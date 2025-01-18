import { fromEvent, map, tap } from "rxjs";
import "./style.css";

import { defineCodeEditorElement } from "./code-editor/code-editor-element";
import { handleOpenMenu } from "./settings/handle-open-menu";
import { defineSettingsElement } from "./settings/settings-element";
import { parseActionEvent } from "./utils/dom";

fromEvent(window, "click")
  .pipe(
    map(parseActionEvent),
    tap((e) => {
      handleOpenMenu(e);
    })
  )
  .subscribe();

defineSettingsElement();
defineCodeEditorElement();
