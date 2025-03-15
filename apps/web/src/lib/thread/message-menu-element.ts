import type { CodeEditorElement } from "../code-editor/code-editor-element";
import type { CommandEventDetails } from "../code-editor/plugins/chat-keymap";
import "./message-menu-element.css";
import { appendMessage, clearMessage, createMessage, deleteMessage, runMessage, trimThread } from "./thread";

export class MessageMenuElement extends HTMLElement {
  connectedCallback() {
    const codeEditorElement = this.closest("message-element")!.querySelector<CodeEditorElement>("code-editor-element")!;

    codeEditorElement.addEventListener("command", (event) => {
      event.stopPropagation();
      const command = (event as CustomEvent<CommandEventDetails>).detail.command;
      this.triggerAction(command);
    });

    codeEditorElement?.addEventListener("append", (event) => {
      event.stopPropagation();
      this.triggerAction("append");
    });

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

        case "run": {
          runMessage(headMessage);
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

  triggerAction(action: string) {
    const trigger = this.querySelector(`[data-action="${action}"]`) as HTMLElement;
    trigger.click();
  }
}

export function defineMessageMenuElement() {
  if (!customElements.get("message-menu-element")) {
    customElements.define("message-menu-element", MessageMenuElement);
  }
}
