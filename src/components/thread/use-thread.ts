import { map, Observable, tap } from "rxjs";
import { TaskElement } from "./task-element";

export interface UseThreadOptions {
  newMessage: Observable<string>;
}
export function useThread(options: UseThreadOptions) {
  /* query dom for static elements */
  const thread = document.querySelector("#thread") as HTMLDivElement;

  options.newMessage
    .pipe(
      map((message) => {
        const taskElement = document.createElement("task-element") as TaskElement;
        taskElement.setAttribute("input", message);
        return taskElement;
      }),
      tap((taskElement) => thread.appendChild(taskElement))
    )
    .subscribe();
}
