import html from "./message.element.html?raw";
import { attachShadowHtml } from "./shadow";

export class MessageElement extends HTMLElement {
  shadowRoot = attachShadowHtml(this, html);
}

export function defineMessageElement() {
  if (!customElements.get("message-element")) {
    customElements.define("message-element", MessageElement);
  }
}
