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

    this.addEventListener("keydown", (event) => {
      // only one button has tabindex=0, we use left/right arrow keys to rotate the focused button in the menu
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

      const trigger = event.target as HTMLElement;
      if (!trigger.matches("[data-action]")) return;

      const buttons = [...this.querySelectorAll<HTMLElement>("[data-action]")];
      const index = buttons.indexOf(trigger);
      const nextIndex = event.key === "ArrowRight" ? (index + 1) % buttons.length : (index - 1 + buttons.length) % buttons.length;
      const nextButton = buttons.at(nextIndex)!;
      trigger.setAttribute("tabindex", "-1");
      nextButton.setAttribute("tabindex", "0");
      nextButton.focus();
    });

    // on blur, reset tabindex
    this.addEventListener("focusout", (event) => {
      const newFocus = event.relatedTarget as HTMLElement;
      if (newFocus && this.contains(newFocus)) return;
      const buttons = [...this.querySelectorAll<HTMLElement>("[data-action]")];
      buttons.forEach((button, index) => button.setAttribute("tabindex", index === 0 ? "0" : "-1"));
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
