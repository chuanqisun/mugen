import { filter, map, tap } from "rxjs";
import { $submission } from "../chat-input/submission";
import { TaskElement } from "./task-element";

import "./thread-element.css";

export class ThreadElement extends HTMLElement {
  private $runSubmission = $submission.pipe(
    filter(({ prompt }) => !prompt.startsWith("/")),
    map(({ prompt }) => {
      const taskElement = document.createElement("task-element") as TaskElement;
      taskElement.setAttribute("input", prompt);
      return taskElement;
    }),
    tap((taskElement) => this.appendChild(taskElement)),
    tap((taskElement) => taskElement.run())
  );

  connectedCallback() {
    this.$runSubmission.subscribe();
  }
}

export function defineThreadElement() {
  customElements.define("thread-element", ThreadElement);
}
