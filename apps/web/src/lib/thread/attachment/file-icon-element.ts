import { getFileIconUrl } from "./file-icon";
import "./file-icon-element.css";

export class FileIconElement extends HTMLElement {
  static get observedAttributes() {
    return ["data-lang"];
  }

  constructor() {
    super();
    this.innerHTML = `<img src="" alt="File Icon" width="15" height="15" />`;
  }

  connectedCallback() {
    this.querySelector("img")!.setAttribute("src", getFileIconUrl(`file.${this.getAttribute("data-lang")}`));
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === "data-lang" && oldValue !== newValue) {
      this.querySelector("img")!.setAttribute("src", getFileIconUrl(`file.${newValue}`));
    }
  }
}

export function defineFileIconElement() {
  if (!customElements.get("file-icon-element")) {
    customElements.define("file-icon-element", FileIconElement);
  }
}
