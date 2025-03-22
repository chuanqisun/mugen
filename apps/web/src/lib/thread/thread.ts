import { CodeEditorElement } from "../code-editor/code-editor-element";
import { $all, $new, insertAdacentElements } from "../dom";
import type { GenericMessage, GenericMessageRole } from "../model-providers/base";
import { getChatStreamProxy } from "../settings/provider-selector";
import { fileToDataURL } from "../storage/codec";

export async function addAttachment(files: File[], headMessage: HTMLElement) {
  const template = document.querySelector<HTMLTemplateElement>("#message-attachment")!;

  const attachmentElements = await Promise.all(
    files.map(async (file) => {
      const newAttachment = template.content.cloneNode(true) as DocumentFragment;

      newAttachment.querySelector(`[data-media]`)!.textContent = "📄";
      newAttachment.querySelector(`[data-name]`)!.textContent = file.name;
      newAttachment.querySelector(`[data-size]`)!.textContent = file.size.toString();
      newAttachment.querySelector(`[data-type]`)!.textContent = file.type;

      await fileToDataURL(file).then((dataUrl) => {
        const object = $new("object", {
          width: "0",
          height: "0",
          data: dataUrl,
          type: file.type,
        });

        newAttachment.querySelector(`[data-media]`)?.append(object);
      });

      return newAttachment;
    }),
  );

  headMessage.querySelector("attachment-list-element")?.append(...attachmentElements);
}

export function createMessage(role: GenericMessageRole): DocumentFragment {
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
  const codeEditor = newMessage.querySelector<CodeEditorElement>("code-editor-element");
  lastElement.after(newMessage);
  codeEditor?.focus();
}

export function clearMessage(headMessage: HTMLElement) {
  headMessage.querySelector<CodeEditorElement>("code-editor-element")!.value = "";
}

export function deleteMessage(headMessage: HTMLElement) {
  const allElements = [...$all("message-element")];
  const index = allElements.indexOf(headMessage);
  if (index === -1) throw new Error("Head message not found in thread");

  const nextFocusTarget = allElements.at(index + 1) ?? allElements.at(index - 1);
  headMessage.remove();
  nextFocusTarget?.querySelector<CodeEditorElement>("code-editor-element")?.focus();
}

export async function runMessage(headMessage: HTMLElement) {
  const proxy = getChatStreamProxy();
  if (!proxy) throw new Error("Proxy not found");

  const newMessage = createMessage("assistant") as DocumentFragment;
  const messageElement = headMessage;
  const outputEditor = newMessage.querySelector("code-editor-element") as CodeEditorElement;
  insertAdacentElements(messageElement, [...newMessage.children] as HTMLElement[], "afterend");

  // gather messages up to this point
  const threadMessages = getThreadMessages(messageElement);
  const outputStream = proxy({
    messages: threadMessages,
  });

  for await (const chunk of outputStream) {
    outputEditor.appendText(chunk);
  }
}

function getThreadMessages(headMessage?: HTMLElement): GenericMessage[] {
  const allElements = [...$all("message-element")];
  const elementsUpToHead = headMessage ? allElements.slice(0, allElements.indexOf(headMessage) + 1) : allElements;
  const threadMessages = elementsUpToHead.map((message) => ({
    role: message.querySelector("[data-role]")!.getAttribute("data-role") as GenericMessageRole,
    content: message.querySelector<CodeEditorElement>("code-editor-element")!.value,
  }));

  return threadMessages;
}

export async function runAllMessages(headMessage: HTMLElement) {
  const tailMessage = headMessage.parentElement?.querySelector<HTMLElement>("message-element:last-of-type")!;
  runMessage(tailMessage);
}

export function trimThread(headMessage: HTMLElement) {
  const allElements = [...$all("message-element")];
  const index = allElements.indexOf(headMessage);
  if (index === -1) throw new Error("Head message not found in thread");
  allElements.slice(index + 1).forEach((message) => message.remove());
}
