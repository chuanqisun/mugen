import { BehaviorSubject } from "rxjs";

export interface ThreadItem {
  id: string;
  role: string;
  content: string;
}

export const thread$ = new BehaviorSubject<ThreadItem[]>([]);

export function appendItem(item: { role: string; content: string }) {
  thread$.next([...thread$.value, { id: crypto.randomUUID(), ...item }]);
}
