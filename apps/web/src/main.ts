import { filter, fromEvent, map, merge, tap } from "rxjs";
import { defineCodeEditorElement } from "./code-editor/code-editor-element";
import { allCommands, keyboardCommands } from "./commands/commands";
import { activeProvider, useProviderSelector } from "./settings/provider-selector";
import { defineSettingsElement } from "./settings/settings-element";
import { defineStorageElement } from "./storage/storage-element";
import "./style.css";
import { parseCommandEvent, parseKeyboardShortcut } from "./utils/dom";

merge(useProviderSelector()).subscribe();

fromEvent<KeyboardEvent>(window, "keydown")
  .pipe(
    map(parseKeyboardShortcut),
    filter(Boolean),
    map(({ combo, event }) => ({ combo, event, runtimeCommand: keyboardCommands.get(combo) })),
    filter(({ runtimeCommand }) => !!runtimeCommand),
    tap(async ({ runtimeCommand, event }) => {
      if (runtimeCommand?.preventDefault) event.preventDefault();
      if (runtimeCommand?.stopPropagation) event.stopPropagation();
      runtimeCommand!.run();
    })
  )
  .subscribe();

fromEvent(window, "click")
  .pipe(
    map(parseCommandEvent),
    map(({ trigger, command }) => ({
      trigger,
      command,
      runtimeCommand: allCommands.get(command!),
    })),
    tap(({ runtimeCommand }) => runtimeCommand?.run())
  )
  .subscribe();

activeProvider.pipe(tap(console.log)).subscribe();

defineSettingsElement();
defineCodeEditorElement();
defineStorageElement();
