import "./style.css";

import { fromEvent, map, tap } from "rxjs";
import { CodeEditorElement, defineCodeEditorElement } from "./code-editor/code-editor-element";
import { handleOpenMenu } from "./handlers/handle-open-menu";
import { defineSettingsElement } from "./settings/settings-element";
import { $, parseActionEvent } from "./utils/dom";

defineSettingsElement();
defineCodeEditorElement();

const codeEditor = $<CodeEditorElement>("code-editor-element")!;

const windowClick$ = fromEvent(window, "click").pipe(
  map(parseActionEvent),
  tap((e) => {
    handleOpenMenu(e);
  })
);

windowClick$.subscribe();

codeEditor.loadText(
  "test.md",
  `
<system>You are a helpful chat assistant.</system>
<user>`.trim()
);
