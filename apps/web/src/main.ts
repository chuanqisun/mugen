import { CodeEditorElement, defineCodeEditorElement } from './lib/code-editor/code-editor-element';
import { $new } from './lib/dom';
import { getChatStreamProxy, useProviderSelector } from './lib/settings/provider-selector';
import { defineSettingsElement } from './lib/settings/settings-element';
import "./style.css";

defineCodeEditorElement();
defineSettingsElement();

useProviderSelector().subscribe();

document.querySelector("#thread")?.addEventListener("run", async (e) => {
  const editor = e.target as CodeEditorElement;
  const value = editor.value;


  const proxy = getChatStreamProxy();
  if (!proxy) throw new Error("Proxy not found");

  const outputEditor = $new<CodeEditorElement>("code-editor-element");
  editor.insertAdjacentElement("afterend", outputEditor);

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