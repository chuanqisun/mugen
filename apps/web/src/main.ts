import "./style.css";

import { fromEvent, map, tap } from "rxjs";
import { CodeEditorElement, defineCodeEditorElement } from "./code-editor/code-editor-element";
import { handleOpenMenu } from "./handlers/handle-open-menu";
import { LlmProvider } from "./llm/llm-provider";
import { assistant, system, user } from "./llm/messages";
import { defineSettingsElement } from "./settings/settings-element";
import { $, parseActionEvent, preventDefault } from "./utils/dom";

defineSettingsElement();
defineCodeEditorElement();

const llm = new LlmProvider();
const inputForm = $<HTMLFormElement>("#input-form")!;
const filename = $<HTMLInputElement>("#filename")!;
const codeEditorElement = $<CodeEditorElement>("code-editor-element")!;

const windowClick$ = fromEvent(window, "click").pipe(
  map(parseActionEvent),
  tap((e) => {
    handleOpenMenu(e);
  })
);

const formSubmission$ = fromEvent(inputForm, "submit").pipe(
  tap(preventDefault),
  tap(async (e) => {
    const prompt = (new FormData(inputForm).get("prompt") as string).trim();
    inputForm.reset();

    const openai = await llm.getClient();
    const task = await openai.chat.completions.create({
      stream: true,
      model: "gpt-4o-mini",
      messages: [
        system`
Respond with text blocks like this: <block filename="name.ext">content goes here...</block>. Default to response.md`,
        user`<block>test input</block>`,
        assistant`<block filename="test.txt">test output</block>`,
        user`<block>${prompt}</block>`,
      ],
    });

    codeEditorElement.value = "";

    for await (const chunk of task) {
      codeEditorElement.appendText(chunk.choices[0]?.delta?.content || "");
    }
  })
);

windowClick$.subscribe();
formSubmission$.subscribe();
