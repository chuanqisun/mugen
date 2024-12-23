import { BehaviorSubject } from "rxjs";

export type JournalEntry = UserEntry | AssistantEntry;

export interface UserEntry {
  createdAt: number;
  parentId?: string;
  isFinal: boolean;
  id: string;
  role: "user";
  content: string;
}

export interface AssistantEntry {
  createdAt: number;
  parentId?: string;
  isFinal: boolean;
  id: string;
  role: "assistant";
  content: string;
}

export interface ThreadItem {
  role: "user" | "assistant";
  content: string;
}

export class Journal extends EventTarget {
  #journalEntries = new BehaviorSubject<JournalEntry[]>([]);

  getEntries$() {
    return this.#journalEntries.asObservable();
  }

  getHistoryMessages() {
    return this.#journalEntries.value.map((entry) => ({
      role: entry.role,
      content: entry.role === "user" ? `<speak>${entry.content}<speak>` : entry.content,
    }));
  }

  createUserMessage(content: string) {
    const id = crypto.randomUUID();
    this.#journalEntries.next([
      ...this.#journalEntries.value,
      {
        createdAt: Date.now(),
        id,
        role: "user",
        isFinal: true,
        content,
      },
    ]);

    return id;
  }

  createAssistantMessage(parentId: string) {
    const id = crypto.randomUUID();
    this.#journalEntries.next([
      ...this.#journalEntries.value,
      {
        createdAt: Date.now(),
        parentId,
        id,
        role: "assistant",
        content: "",
        isFinal: false,
      },
    ]);

    return id;
  }

  appendMessageContent(id: string, chunk: string) {
    const entries = this.#journalEntries.value;

    const updatedEntries = entries.map((entry) => {
      if (entry.id === id) {
        return {
          ...entry,
          content: entry.content + chunk,
        };
      }

      return entry;
    });

    this.#journalEntries.next(updatedEntries);
  }

  setMessageIsFinal(id: string) {
    const entries = this.#journalEntries.value;

    const updatedEntries = entries.map((entry) => {
      if (entry.id === id) {
        return {
          ...entry,
          isFinal: true,
        };
      }

      return entry;
    });

    this.#journalEntries.next(updatedEntries);
  }
}
