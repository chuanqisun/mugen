import template from "./thread-element.html?raw";
export class ThreadElement extends HTMLElement {
  shadowRoot = this.attachShadow({ mode: "open" });
  private mid = 0;

  connectedCallback() {
    this.shadowRoot.innerHTML = template;
  }

  appendUserMessage(message: string) {
    const messageElement = document.createElement("div");
    messageElement.dataset.id = (++this.mid).toString();
    messageElement.textContent = message;
    this.shadowRoot.querySelector<HTMLElement>(".thread")!.appendChild(messageElement);
  }
}

export function defineThreadElement(tagName = "thread-element") {
  customElements.define(tagName, ThreadElement);
}
