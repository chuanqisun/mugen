import { fromEvent, map, tap } from "rxjs";
import { getThreadMessages } from "./lib/chat/thread";
import { CodeEditorElement, defineCodeEditorElement } from "./lib/code-editor/code-editor-element";
import { $get, insertAdacentElements } from "./lib/dom";
import { defineMessageMenuElement } from "./lib/message-menu/message-menu-element";
import { getChatStreamProxy, useProviderSelector } from "./lib/settings/provider-selector";
import { defineSettingsElement } from "./lib/settings/settings-element";
import "./style.css";

defineCodeEditorElement();
defineSettingsElement();
defineMessageMenuElement();

useProviderSelector().subscribe();

const chat$ = fromEvent($get<HTMLElement>("#thread"), "run").pipe(
  map((e) => e.target as CodeEditorElement),
  tap(async (editor) => {
    const proxy = getChatStreamProxy();
    if (!proxy) throw new Error("Proxy not found");

    const newMessage = createMessage("model") as DocumentFragment;
    const messageElement = editor.closest<HTMLElement>("message-element")!;
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
  })
);

chat$.subscribe();

// initialize messages
const thread = document.querySelector("#thread")!;
thread.append(createMessage("system"), createMessage("user"));

function createMessage(role: string) {
  const template = document.querySelector<HTMLTemplateElement>("#message")!;
  const newMessageRoot = template.content.cloneNode(true) as DocumentFragment;
  newMessageRoot.querySelector(`[data-action="toggle-role"]`)!.textContent = capitalizeInitial(role);
  newMessageRoot.querySelector("[data-role]")?.setAttribute("data-role", role);
  return newMessageRoot;
}

function capitalizeInitial(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
