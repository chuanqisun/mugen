import "./node-element.css";

export function defineNodeElement() {
  customElements.define("node-element", NodeElement);
}

export class NodeElement extends HTMLElement {
  connectedCallback() {
    this.innerHTML = "Listening...";
  }
}
