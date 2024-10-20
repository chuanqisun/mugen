import { map, tap } from "rxjs";
import { $submission } from "../chat-input/chat-input-element";
import { TaskElement } from "./task-element";

export function useThread() {
  /* query dom for static elements */
  const thread = document.querySelector("#thread") as HTMLDivElement;

  $submission
    .pipe(
      map(({ prompt }) => {
        const taskElement = document.createElement("task-element") as TaskElement;
        taskElement.setAttribute("input", prompt);
        return taskElement;
      }),
      tap((taskElement) => thread.appendChild(taskElement)),
      tap((taskElement) => taskElement.run())
    )
    .subscribe();
}
