import { html, nothing, render } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { when } from "lit/directives/when.js";
import { map, tap } from "rxjs";
import { fs$ } from "../../services/file-system";

export class FileTreeElement extends HTMLElement {
  #render$ = fs$.pipe(
    map(
      (fs) => html`
        <div class="rows">
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
    tap((template) => render(template, this))
  );

  connectedCallback() {
    this.#render$.subscribe();
  }

  openTab(path: string) {
    this.dispatchEvent(new CustomEvent("openpath", { detail: path }));
  }
}

export function defineFileTreeElement(tagName = "file-tree-element") {
  customElements.define(tagName, FileTreeElement);
}
