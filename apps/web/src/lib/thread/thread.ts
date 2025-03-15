import { CodeEditorElement } from "../code-editor/code-editor-element";
import { $all } from "../dom";

export interface ThreadMessages {
  role: string;
  content: string;
}

export function getThreadMessages(headMessage?: HTMLElement): ThreadMessages[] {
  const allElements = [...$all("message-element")];
  const elementsUpToHead = headMessage ? allElements.slice(0, allElements.indexOf(headMessage) + 1) : allElements;
  const threadMessages = elementsUpToHead.map((message) => ({
    role: message.querySelector("[data-role]")!.getAttribute("data-role")!,
    content: message.querySelector<CodeEditorElement>("code-editor-element")!.value,
  }));

  return threadMessages;
}

export function createMessage(role: "user" | "assistant" | "system"): DocumentFragment {
  const template = document.querySelector<HTMLTemplateElement>("#message")!;
  const newMessageRoot = template.content.cloneNode(true) as DocumentFragment;
  newMessageRoot.querySelector("[data-role]")?.setAttribute("data-role", role);
  return newMessageRoot;
}

export function appendMessage(newMessage: DocumentFragment, headMessage?: HTMLElement): void {
  const allElements = [...$all("message-element")];
  const elementsUpToHead = headMessage ? allElements.slice(0, allElements.indexOf(headMessage) + 1) : allElements;
  const lastElement = elementsUpToHead.at(-1);
  if (!lastElement) throw new Error("No message element found");
  lastElement.after(newMessage);
}
