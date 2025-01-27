import templateHtml from "./storage-element.html?raw";
import { getLastUsedHandle } from "./workspace";

export function defineStorageElement() {
  customElements.define("storage-element", StorageElement);
}

export class StorageElement extends HTMLElement {
  constructor() {
    super();
    this.innerHTML = templateHtml;
  }

  connectedCallback() {
    getLastUsedHandle().then((handle) => {
      this.querySelector<HTMLElement>("#recover")!.innerHTML = handle ? `<button data-command="storage.openLastUsedWorkspace">${handle.name}</button>` : "";
      if (handle) {
        this.querySelector<HTMLElement>(`[data-command="storage.openLastUsedWorkspace"]`)!.focus();
      }
    });
  }
}
