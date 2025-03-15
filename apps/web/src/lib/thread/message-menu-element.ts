import "./message-menu-element.css";

export class MessageMenuElement extends HTMLElement {
  connectedCallback() {
    this.addEventListener("click", (event) => {
      const trigger = event.target as HTMLElement;
      const action = trigger.dataset.action;
      switch (action) {
        case "toggle-role": {
          switch (trigger.dataset.role) {
            case "assistant": {
              trigger.dataset.role = "user";
              break;
            }
            case "user": {
              trigger.dataset.role = "assistant";
              break;
            }
          }
          break;
        }

        case "append": {
        }
      }
    });
  }
}

export function defineMessageMenuElement() {
  if (!customElements.get("message-menu-element")) {
    customElements.define("message-menu-element", MessageMenuElement);
  }
}
