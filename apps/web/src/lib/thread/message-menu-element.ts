import "./message-menu-element.css";
import { appendMessage, clearMessage, createMessage, deleteMessage, trimThread } from "./thread";

export class MessageMenuElement extends HTMLElement {
  connectedCallback() {
    this.addEventListener("click", (event) => {
      const trigger = event.target as HTMLElement;
      const headMessage = trigger.closest<HTMLElement>("message-element")!;
      const role = headMessage.querySelector("[data-role]")!.getAttribute("data-role");
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
          switch (role) {
            case "system":
            case "assistant": {
              appendMessage(createMessage("user"), headMessage);
              break;
            }
            case "user": {
              appendMessage(createMessage("assistant"), headMessage);
              break;
            }
          }
          break;
        }

        case "trim": {
          trimThread(headMessage);
          break;
        }

        case "delete": {
          switch (role) {
            case "system": {
              clearMessage(headMessage);
              break;
            }
            default: {
              deleteMessage(headMessage);
              break;
            }
          }
          break;
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
