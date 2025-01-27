import templateHtml from "./storage-element.html?raw";

export function defineStorageElement() {
  customElements.define("storage-element", StorageElement);
}

export class StorageElement extends HTMLElement {
  constructor() {
    super();
    this.innerHTML = templateHtml;
  }
}
