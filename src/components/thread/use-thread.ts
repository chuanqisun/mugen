import { map, Observable, tap } from "rxjs";

export interface UseThreadOptions {
  newMessage: Observable<string>;
}
export function useThread(options: UseThreadOptions) {
  /* query dom for static elements */
  const thread = document.querySelector("#thread") as HTMLDivElement;

  options.newMessage
    .pipe(
      map((message) => `<task-element input="${message}"></task-element>`),
      tap((message) => (thread.innerHTML += message))
    )
    .subscribe();
}
