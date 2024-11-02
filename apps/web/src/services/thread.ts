import { BehaviorSubject } from "rxjs";

export interface Thread {
  nextId: number;
  systemMessage?: string;
  items: ThreadItem[];
}

export interface ThreadItem {
  id: number;
  sourceMessageId?: number;
  role: "user" | "assistant";
  content: string;
}

export function clearThreadItems() {
  $thread.next({
    ...$thread.value,
    items: [],
  });
}

export function addUserMessage(message: string) {
  const thread = $thread.value;
  const id = thread.nextId;

  $thread.next({
    nextId: id + 1,
    items: [
      ...thread.items,
      {
        id: id,
        role: "user",
        content: message,
      },
    ],
  });

  return id;
}

export function createAssistantMessage(referenceUserMessageId: number, initialContent?: string) {
  const userMessageIndex = $thread.value.items.findIndex((item) => item.id === referenceUserMessageId);
  if (userMessageIndex === -1) return;

  const thread = $thread.value;
  const id = thread.nextId;

  $thread.next({
    nextId: id + 1,
    items: [
      ...thread.items.slice(0, userMessageIndex + 1),
      {
        id: id,
        sourceMessageId: referenceUserMessageId,
        role: "assistant",
        content: initialContent ?? "",
      },
      ...thread.items.slice(userMessageIndex + 1),
    ],
  });

  return id;
}

export function appendAssistantMessage(referenceUserMessageId: number, message: string) {
  const thread = $thread.value;
  const assistantMessageIndex = thread.items.findIndex((item) => item.sourceMessageId === referenceUserMessageId);
  if (assistantMessageIndex === -1) return;

  const assistantMessage = thread.items[assistantMessageIndex];
  $thread.next({
    ...thread,
    items: [
      ...thread.items.slice(0, assistantMessageIndex),
      {
        ...assistantMessage,
        content: assistantMessage.content + message,
      },
      ...thread.items.slice(assistantMessageIndex + 1),
    ],
  });
}

export const $thread = new BehaviorSubject<Thread>({
  nextId: 1,
  items: [],
});
