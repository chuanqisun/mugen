import "./style.css";

import { fromEvent, map, tap } from "rxjs";
import { CodeEditorElement, defineCodeEditorElement } from "./code-editor/code-editor-element";
import { handleOpenMenu } from "./handlers/handle-open-menu";
import { OpenAILLMProvider } from "./llm/openai-llm-provider";
import { defineSettingsElement } from "./settings/settings-element";
import { $, parseActionEvent } from "./utils/dom";

defineSettingsElement();
defineCodeEditorElement();

const codeEditor = $<CodeEditorElement>("code-editor-element")!;
const openai = new OpenAILLMProvider();

const windowClick$ = fromEvent(window, "click").pipe(
  map(parseActionEvent),
  tap((e) => {
    handleOpenMenu(e);
  })
);

windowClick$.subscribe();

codeEditor.loadText("test.md", "# Hello, world!\n\nThis is a test file.");
