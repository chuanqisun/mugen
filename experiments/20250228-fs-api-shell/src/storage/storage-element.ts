import { html, render } from "lit";
import { tap } from "rxjs";
import "./storage-element.css";
import templateHtml from "./storage-element.html?raw";
import { lastUsedWorkspaces$, openExistingWorkspace, removeExistingWorkspace } from "./workspace";

export function defineStorageElement() {
  customElements.define("storage-element", StorageElement);
}

export class StorageElement extends HTMLElement {
  constructor() {
    super();
    this.innerHTML = templateHtml;
  }

  connectedCallback() {
    lastUsedWorkspaces$
      .pipe(
        tap((items) =>
          render(
            html`${items.map(
              (item) =>
                html` <div class="row">
                  <button @click=${() => openExistingWorkspace(item.handle)}>
                    <span>${item.handle.name}</span> <span>${new Date(item.lastAccessedTime).toLocaleString()}</span>
                  </button>
                  <button type="button" @click=${() => removeExistingWorkspace(item.handle)}>Remove</button>
                </div>`
            )}`,
            this.querySelector<HTMLElement>("#recover")!
          )
        )
      )
      .subscribe();

    // prioritize recover button
    setTimeout(() => (this.querySelector<HTMLElement>("#recover button") ?? this.querySelector("button"))?.focus(), 0);
  }
}
