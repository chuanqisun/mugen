import "./style.css";

import { fromEvent, map, tap } from "rxjs";
import { defineCodeEditorElement } from "./code-editor/code-editor-element";
import { handleOpenMenu } from "./handlers/handle-open-menu";
import { LlmProvider } from "./llm/llm-provider";
import { defineSettingsElement } from "./settings/settings-element";
import { parseActionEvent } from "./utils/dom";

defineSettingsElement();
defineCodeEditorElement();

const llm = new LlmProvider();

const windowClick$ = fromEvent(window, "click").pipe(
  map(parseActionEvent),
  tap((e) => {
    handleOpenMenu(e);
  })
);

windowClick$.subscribe();
