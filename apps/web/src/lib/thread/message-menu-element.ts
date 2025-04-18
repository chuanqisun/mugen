import { distinctUntilChanged, fromEvent, map, merge, tap } from "rxjs";
import { startArtifact } from "../artifact-editor/artifact-editor";
import type { CodeEditorElement, CurosrChangeEventDetails } from "../code-editor/code-editor-element";
import type { BlockEventInit } from "../code-editor/plugins/block-action-widget";
import type { CommandEventDetails } from "../code-editor/plugins/chat-keymap";
import type { FileIconElement } from "./attachment/file-icon-element";
import { getCodeBlockAtCurosr } from "./cursor-context";
import "./message-attachments.css";
import "./message-menu-element.css";
import {
  addAttachment,
  appendMessage,
  clearMessage,
  createMessage,
  deleteMessage,
  runAllMessages,
  runMessage,
  trimThread,
} from "./thread";
import { getOneTimeUpload } from "./upload";

export class MessageMenuElement extends HTMLElement {
  private tasks: AbortController[] = [];

  connectedCallback() {
    const codeEditorElement = this.closest("message-element")!.querySelector<CodeEditorElement>("code-editor-element")!;
    const messageAttachments = this.closest("message-element")!.querySelector("attachment-list-element")!;

    codeEditorElement.addEventListener("command", (event) => {
      event.stopPropagation();
      const command = (event as CustomEvent<CommandEventDetails>).detail.command;
      this.triggerAction(command);
    });

    codeEditorElement?.addEventListener("append", (event) => {
      event.stopPropagation();
      this.triggerAction("append");
    });

    codeEditorElement?.addEventListener("block-copy", (e) => {
      e.stopPropagation();
      console.log("block-copy", (e as CustomEvent<BlockEventInit>).detail);
      navigator.clipboard.writeText((e as CustomEvent<BlockEventInit>).detail.code);
    });

    fromEvent<CustomEvent<CurosrChangeEventDetails>>(codeEditorElement, "cursorchange")
      .pipe(
        map((e) => e.detail),
        distinctUntilChanged((a, b) => a.from === b.from && a.to === b.to && a.doc === b.doc),
        tap((e) => {
          const block = getCodeBlockAtCurosr(e.doc, e.from, e.to);
          const editCodeTrigger = this.querySelector("[data-action='edit-code']") as HTMLElement;
          editCodeTrigger.setAttribute("data-from", block ? block.innerCodeStart.toString() : "0");
          editCodeTrigger.setAttribute("data-to", block ? block.innerCodeEnd.toString() : e.doc.length.toString());
          const lang = block?.lang ?? codeEditorElement.getAttribute("data-lang") ?? "markdown";
          editCodeTrigger.setAttribute("data-lang", lang);
          editCodeTrigger.querySelector<FileIconElement>("file-icon-element")!.setAttribute("data-lang", lang);
          editCodeTrigger.title = `Edit code (${lang})`;
        }),
      )
      .subscribe();

    const attachmentsClick = fromEvent<MouseEvent>(messageAttachments, "click");
    const menuClick = fromEvent<MouseEvent>(this, "click");

    merge(attachmentsClick, menuClick).subscribe(async (event) => {
      const trigger = (event.target as HTMLElement)?.closest<HTMLElement>("[data-action]");
      if (!trigger) return;
      const headMessage = trigger?.closest<HTMLElement>("message-element");
      if (!headMessage) return;
      const role = headMessage?.querySelector("[data-role]")!.getAttribute("data-role");
      const action = trigger?.dataset.action;

      switch (action) {
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

        case "attach": {
          const files = await getOneTimeUpload();
          addAttachment(files, headMessage);
          break;
        }

        case "edit-code": {
          const codeStart = parseInt(trigger.getAttribute("data-from")!);
          const codeEnd = parseInt(trigger.getAttribute("data-to")!);
          const lang = trigger.getAttribute("data-lang") ?? "markdown";
          const code = codeEditorElement.value.slice(codeStart, codeEnd);
          const updatedCode = await startArtifact({ code, lang });
          if (updatedCode !== code) codeEditorElement.replaceText(codeStart, codeEnd, updatedCode);
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

        case "remove-attachment": {
          trigger.closest("attachment-element")?.remove();
          break;
        }

        case "run": {
          trimThread(headMessage);
          runMessage(headMessage);
          break;
        }

        case "run-all": {
          runAllMessages(headMessage);
          break;
        }

        case "run-as-artifact": {
          const codeEditorElement = headMessage.querySelector<CodeEditorElement>("code-editor-element")!;
          const currentCode = codeEditorElement.value;
          const updatedCode = await startArtifact({
            code: codeEditorElement.value,
            lang: codeEditorElement.getAttribute("data-lang") ?? "markdown",
          });
          if (updatedCode !== currentCode) codeEditorElement.value = updatedCode;
          break;
        }

        case "stop": {
          this.tasks.forEach((task) => task.abort());
          break;
        }

        case "toggle-minimize": {
          const isMinimized = trigger.hasAttribute("data-minimized");

          const affectedMessages =
            event.ctrlKey || event.metaKey ? [...document.querySelectorAll("message-element")] : [headMessage];

          affectedMessages.forEach((message) => {
            const trigger = message.querySelector("[data-action='toggle-minimize']") as HTMLElement;
            // set all other messages to the same state
            trigger.toggleAttribute("data-minimized", !isMinimized);
            trigger.querySelector("use")!.setAttribute("href", isMinimized ? "#shrink" : "#expand");
            message.toggleAttribute("data-minimized", !isMinimized);
            message.querySelector<CodeEditorElement>("code-editor-element")!.toggleMinimize(!isMinimized);
          });
          break;
        }

        case "toggle-pin": {
          const isPinned = trigger.hasAttribute("data-pinned");
          trigger.toggleAttribute("data-pinned", !isPinned);
          trigger.querySelector("use")!.setAttribute("href", isPinned ? "#pin" : "#pin-filled");
          break;
        }

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

        case "trim": {
          trimThread(headMessage);
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

      const buttons = [...this.querySelectorAll<HTMLElement>("[data-action]:not([hidden])")];
      const index = buttons.indexOf(trigger);
      const nextIndex =
        event.key === "ArrowRight" ? (index + 1) % buttons.length : (index - 1 + buttons.length) % buttons.length;
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

  addTask(options?: { cancelOthers?: boolean }) {
    const abortController = new AbortController();
    abortController.signal.addEventListener("abort", () => {
      this.tasks = this.tasks.filter((task) => task !== abortController);
      this.updateSpinner();
    });

    if (options?.cancelOthers) {
      this.tasks.forEach((task) => task.abort());
      this.tasks = [];
    }

    this.tasks.push(abortController);
    this.updateSpinner();

    return {
      signal: abortController.signal,
      abort: () => abortController.abort(),
    };
  }

  private updateSpinner() {
    const hasRunningTask = this.tasks.some((task) => !task.signal.aborted);
    const stopButton = this.querySelector(`[data-action="stop"]`)!;
    stopButton.toggleAttribute("hidden", !hasRunningTask);
  }
}

export function defineMessageMenuElement() {
  if (!customElements.get("message-menu-element")) {
    customElements.define("message-menu-element", MessageMenuElement);
  }
}
