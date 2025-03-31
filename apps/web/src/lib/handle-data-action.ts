import { filter, fromEvent, map, Observable } from "rxjs";

export interface Action {
  event: MouseEvent;
  name: string;
  trigger: HTMLElement;
  target: HTMLElement;
}

export function handleAction(root: HTMLElement): Observable<Action> {
  return fromEvent<MouseEvent>(root, "click").pipe(
    map((event) => {
      const target = event.target as HTMLElement;
      const trigger = target.closest("[data-action]") as HTMLElement;
      const name = trigger?.getAttribute("data-action");

      if (name) {
        return {
          event,
          name,
          trigger,
          target,
        };
      }
      return null;
    }),
    filter((data) => data !== null),
  );
}
