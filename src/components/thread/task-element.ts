import { html, render } from "lit";
import { map, tap } from "rxjs";
import { fromAttributeChange } from "../../lib/mutation-observer";

class TaskElement extends HTMLElement {
  constructor() {
    super();

    render(
      html`
        <div>
          <div>Input</div>
          <div>Output</div>
        </div>
      `,
      this
    );
  }

  connectedCallback() {
    fromAttributeChange(this, "data-input")
      .pipe(
        tap((record) => console.log({ record })),
        map((record) => record.newValue),
        tap((newInput) =>
          render(
            html`<div>
              <div>Input: ${newInput}</div>
              <div>Output</div>
            </div> `,
            this
          )
        )
      )
      .subscribe();
  }
}

export function defineTaskElement() {
  customElements.define("task-element", TaskElement);
}
