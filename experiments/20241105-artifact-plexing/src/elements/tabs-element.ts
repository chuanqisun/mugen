import { html, nothing, render } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { when } from "lit/directives/when.js";
import { map, tap } from "rxjs";
import { $fs } from "../services/file-system";

export class TabsElement extends HTMLElement {
  shadowRoot = this.attachShadow({ mode: "open" });
  private $render = $fs.pipe(
    map(
      (fs) => html`
        <style>
          .tabs {
            display: flex;
            flex-wrap: wrap;
          }
        </style>
        <div class="tabs">
          ${repeat(
            Object.values(fs),
            (artifact) => artifact.path,
            (artifact) =>
              html`<button @click=${() => this.openTab(artifact.path)}>
                ${artifact.path}
                ${when(
                  artifact.stream,
                  () => html`<spinner-element></spinner-element>`,
                  () => nothing
                )}
              </button> `
          )}
        </div>
      `
    ),
    tap((template) => render(template, this.shadowRoot))
  );

  connectedCallback() {
    this.$render.subscribe();
  }

  openTab(path: string) {
    this.dispatchEvent(new CustomEvent("openpath", { detail: path }));
  }
}

export function defineTabsElement(tagName = "tabs-element") {
  customElements.define(tagName, TabsElement);
}
