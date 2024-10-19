import { html, render } from "lit";
import { BehaviorSubject, map, tap } from "rxjs";
import { fromAttributesChange } from "../../lib/mutation-observer";

class TaskElement extends HTMLElement {
  private $state = new BehaviorSubject<{ input: string }>({ input: this.getAttribute("input") ?? "" });
  private $render = this.$state.pipe(
    tap((state) =>
      render(
        html`
          <div>
            <div>Input: ${state.input}</div>
            <div>Output</div>
          </div>
        `,
        this
      )
    )
  );

  connectedCallback() {
    fromAttributesChange(this)
      .pipe(
        map((changes) =>
          Object.entries(changes)
            .map((change) => ({ [change[0]]: change[1].newValue }) as { [key: string]: string | null })
            .reduce((acc, changes) => ({ ...acc, ...changes }), {} as { [key: string]: string | null })
        ),
        tap((changes) => this.$state.next({ ...this.$state.value, ...changes }))
      )
      .subscribe();

    this.$render.subscribe();
  }
}

export function defineTaskElement() {
  customElements.define("task-element", TaskElement);
}
