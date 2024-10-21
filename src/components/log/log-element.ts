import { map, tap } from "rxjs";
import { $submission } from "../chat-input/submission";
import { EntryElement } from "./entry-element";

import { $rawPartialResponses } from "../interpreter/run";
import "./log-element.css";

export class LogElement extends HTMLElement {
  private $runSubmission = $submission.pipe(
    map(({ id, prompt }) => {
      const taskElement = document.createElement("entry-element") as EntryElement;
      taskElement.setAttribute("run-id", id.toString());
      taskElement.setAttribute("input", prompt);
      return taskElement;
    }),
    tap((taskElement) => this.appendChild(taskElement))
  );

  connectedCallback() {
    this.$runSubmission.subscribe();

    $rawPartialResponses.subscribe(({ runId, delta }) => {
      console.log("partial response", [runId, delta]);
      this.querySelector<EntryElement>(`entry-element[run-id="${runId}"]`)?.appendOutputRaw(delta);
    });
  }
}

export function defineLogElement() {
  customElements.define("log-element", LogElement);
}
