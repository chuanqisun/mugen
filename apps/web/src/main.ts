import { CodeEditorElement, defineCodeEditorElement } from './lib/code-editor/code-editor-element';
import { insertAdacentElements } from './lib/dom';
import { defineMessageMenuElement } from './lib/message-menu/message-menu-element';
import { getChatStreamProxy, useProviderSelector } from './lib/settings/provider-selector';
import { defineSettingsElement } from './lib/settings/settings-element';
import "./style.css";

defineCodeEditorElement();
defineSettingsElement();
defineMessageMenuElement();

useProviderSelector().subscribe();

document.querySelector("#thread")?.addEventListener("run", async (e) => {
  const editor = e.target as CodeEditorElement;
  const value = editor.value;


  const proxy = getChatStreamProxy();
  if (!proxy) throw new Error("Proxy not found");

  const newMessage = createMessage("model") as DocumentFragment;
  const outputEditor = newMessage.querySelector("code-editor-element") as CodeEditorElement;
  insertAdacentElements(editor, [...newMessage.children] as HTMLElement[], "afterend");

  const outputStream = proxy({
    messages: [
      {
        role: "user",
        content: value,
      },
    ],
  });

  for await (const chunk of outputStream) {
    outputEditor.appendText(chunk);
  }
});

// initialize messages
const thread = document.querySelector("#thread")!;
thread.appendChild(createMessage("user"));

function createMessage(role: string) {
  const template = document.querySelector<HTMLTemplateElement>("#message")!;
  const newMessageRoot = template.content.cloneNode(true) as DocumentFragment;
  newMessageRoot.querySelector(`[data-action="toggle-role"]`)!.textContent = capitalizeInitial(role);
  newMessageRoot.querySelector("code-editor-element")?.setAttribute("data-role", role);
  return newMessageRoot;
}

function capitalizeInitial(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
