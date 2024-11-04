import { html, nothing, render } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { when } from "lit/directives/when.js";
import { map, tap } from "rxjs";
import { $fs } from "../services/file-system";

export class TabsElement extends HTMLElement {
  private $render = $fs.pipe(
    map((fs) =>
      repeat(
        Object.values(fs),
        (artifact) => artifact.path,
        (artifact) =>
          html`<button @click=${() => this.handleClick(artifact.path)}>
            ${artifact.path}
            ${when(
              artifact.stream,
              () => html`<spinner-element></spinner-element>`,
              () => nothing
            )}
          </button> `
      )
    ),
    tap((template) => render(template, this))
  );

  connectedCallback() {
    this.$render.subscribe();
  }

  handleClick(path: string) {
    this.dispatchEvent(new CustomEvent("openpath", { detail: path }));
  }
}

export function defineTabsElement(tagName = "tabs-element") {
  customElements.define(tagName, TabsElement);
}
