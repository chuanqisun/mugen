import "./style.css";

import { fromEvent, map, tap } from "rxjs";
import { CodeEditorElement, defineCodeEditorElement } from "./code-editor/code-editor-element";
import { handleOpenMenu } from "./handlers/handle-open-menu";
import { LlmProvider } from "./llm/llm-provider";
import { defineSettingsElement } from "./settings/settings-element";
import { $, $new, parseActionEvent } from "./utils/dom";
import { MarkdownBlockParser } from "./utils/markdown";

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

    let targetEditor = $new<CodeEditorElement>("code-editor-element");
    const nextMessage = $new("message-element", { "data-role": "assistant" }, [targetEditor]);
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

    const parser = new MarkdownBlockParser({
      onOpenBlock: (info) => {
        targetEditor = $new("code-editor-element", { "data-lang": info.language });
        nextMessage.appendChild(targetEditor);
      },
      onCloseBlock: () => {
        targetEditor.setAttribute("data-ended", "true");
      },
      onText: (text) => {
        if (targetEditor.getAttribute("data-ended")) {
          targetEditor = $new("code-editor-element");
          nextMessage.appendChild(targetEditor);
        }
        targetEditor.appendText(text);
      },
    });

    for await (const chunk of response) {
      parser.write(chunk.choices[0]?.delta?.content || "");
    }
    parser.close();
  })
);

windowClick$.subscribe();
runMessage$.subscribe();
