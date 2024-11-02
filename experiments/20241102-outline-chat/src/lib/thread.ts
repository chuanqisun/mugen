import { BehaviorSubject } from "rxjs";

export interface ThreadItem {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
}

export const $thread = new BehaviorSubject<ThreadItem[]>([]);

export function appendThreadItem(item: Pick<ThreadItem, "role" | "content">) {
  $thread.next([...$thread.value, { id: crypto.randomUUID(), ...item }]);
}
