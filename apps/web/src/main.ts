import { fromEvent, map, merge, tap } from "rxjs";
import "./style.css";

import { defineCodeEditorElement } from "./code-editor/code-editor-element";
import { handleOpenMenu } from "./settings/handle-open-menu";
import { activeProvider, useProviderSelector } from "./settings/provider-selector";
import { defineSettingsElement } from "./settings/settings-element";
import { handleOpenStorage } from "./storage/handle-open-storage";
import { defineStorageElement } from "./storage/storage-element";
import { parseActionEvent } from "./utils/dom";

merge(useProviderSelector()).subscribe();

fromEvent(window, "click")
  .pipe(
    map(parseActionEvent),
    tap((e) => {
      handleOpenMenu(e);
      handleOpenStorage(e);
    })
  )
  .subscribe();

activeProvider.pipe(tap(console.log)).subscribe();

defineSettingsElement();
defineCodeEditorElement();
defineStorageElement();
