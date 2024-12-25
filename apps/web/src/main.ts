import "./style.css";

import { fromEvent, map, tap } from "rxjs";
import { CodeEditorElement, defineCodeEditorElement } from "./code-editor/code-editor-element";
import { handleOpenMenu } from "./handlers/handle-open-menu";
import { LlmProvider } from "./llm/llm-provider";
import { defineSettingsElement } from "./settings/settings-element";
import { $, $new, parseActionEvent } from "./utils/dom";

defineSettingsElement();
defineCodeEditorElement();

const threadElement = $<HTMLElement>("#thread")!;
const llm = new LlmProvider();

const windowClick$ = fromEvent(window, "click").pipe(
  map(parseActionEvent),
  tap((e) => {
    handleOpenMenu(e);
  })
);

const runMessage$ = fromEvent(threadElement, "run-message").pipe(
  tap(async (e) => {
    const messageElement = (e.target as HTMLElement).closest("message-element")!;
    const newEditor = $new<CodeEditorElement>("code-editor-element");
    const nextMessage = $new("message-element", { "data-role": "assistant" }, [newEditor]);
    messageElement.insertAdjacentElement("afterend", nextMessage);

    const aoai = await llm.getClient("aoai");
    const allMessages = [...threadElement.querySelectorAll("message-element")];
    const messages = allMessages.slice(0, allMessages.indexOf(messageElement) + 1).map((m) => ({
      role: m.getAttribute("data-role")! as "user" | "assistant" | "system",
      content: m.querySelector<CodeEditorElement>("code-editor-element")!.value,
    }));

    const response = await aoai.chat.completions.create({
      stream: true,
      model: "gpt-4o-mini",
      messages,
    });

    for await (const chunk of response) {
      newEditor.appendText(chunk.choices[0]?.delta?.content || "");
    }
  })
);

windowClick$.subscribe();
runMessage$.subscribe();
