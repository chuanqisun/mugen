import { html, render } from "lit";
import { BehaviorSubject, combineLatestWith, tap } from "rxjs";
import { reflectAttributes } from "../../lib/attributes";

export class TaskElement extends HTMLElement {
  private $state = new BehaviorSubject({ input: this.getAttribute("input") ?? "" });
  private $reflectAttributes = reflectAttributes(this, this.$state);

  private $render = this.$state.pipe(
    combineLatestWith(this.$state),
    tap(([_state, attr]) =>
      render(
        html`
          <div>
            <div>Input: ${attr.input}</div>
            <div>Output</div>
          </div>
        `,
        this
      )
    )
  );

  connectedCallback() {
    this.$render.subscribe();
    this.$reflectAttributes.subscribe();
  }

  run() {
    console.log("run", this.$state.value);
  }
}

export function defineTaskElement() {
  customElements.define("task-element", TaskElement);
}
