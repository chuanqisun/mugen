import { fromEvent, map, tap } from "rxjs";
import { CodeEditorElement, defineCodeEditorElement } from "./lib/code-editor/code-editor-element";
import { $get, insertAdacentElements } from "./lib/dom";
import { getChatStreamProxy, useProviderSelector } from "./lib/settings/provider-selector";
import { defineSettingsElement } from "./lib/settings/settings-element";
import { defineMessageMenuElement } from "./lib/thread/message-menu-element";
import { createMessage, getThreadMessages } from "./lib/thread/thread";
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

    const newMessage = createMessage("assistant") as DocumentFragment;
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
$get("#thread").append(createMessage("system"), createMessage("user"));
