import { html, render } from "lit";
import { BehaviorSubject, tap } from "rxjs";
import { reflectAttributes } from "../../lib/attributes";

import "./entry-element.css";

export class EntryElement extends HTMLElement {
  private $state = new BehaviorSubject({ input: this.getAttribute("input") ?? "", outputRaw: "" });
  private $reflectAttributes = reflectAttributes(this, this.$state);

  private $render = this.$state.pipe(
    tap((state) =>
      render(
        html`
          <div>
            <br />
            <pre><code>&gt; ${state.input}</code></pre>
            <pre><code>${state.outputRaw}</code></pre>
            <br />
            <hr />
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

  appendOutputRaw(outputRaw: string) {
    this.$state.next({ ...this.$state.value, outputRaw: this.$state.value.outputRaw + outputRaw });
  }
}

export function defineTaskElement() {
  customElements.define("entry-element", EntryElement);
}
