import { BehaviorSubject } from "rxjs";

export interface Thread {
  nextId: number;
  systemMessage?: string;
  items: ThreadItem[];
}

export interface ThreadItem {
  id: number;
  role: "user" | "assistant";
  content: any[];
}

export function addUserMessage($thread: BehaviorSubject<Thread>, message: string) {
  const thread = $thread.value;
  const id = thread.nextId;

  $thread.next({
    nextId: id + 1,
    items: [
      ...thread.items,
      {
        id: id,
        role: "user",
        content: [message],
      },
    ],
  });

  return id;
}

export const $thread = new BehaviorSubject<Thread>({
  nextId: 1,
  items: [],
});
