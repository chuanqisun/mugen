import "./message-menu-element.css";


export class MessageMenuElement extends HTMLElement {

}

export function defineMessageMenuElement() {
  if (!customElements.get("message-menu")) {
    customElements.define("message-menu", MessageMenuElement);
  }
}