import { merge, tap } from "rxjs";
import { defineCodeEditorElement } from "./code-editor/code-editor-element";
import { defaultCommands } from "./commands/default-commands";
import { useCommands } from "./commands/use-commands";
import { activeProvider, useProviderSelector } from "./settings/provider-selector";
import { defineSettingsElement } from "./settings/settings-element";
import { defineStorageElement } from "./storage/storage-element";
import { useWorkspace } from "./storage/workspace";
import "./style.css";
import { $ } from "./utils/dom";

merge(
  useProviderSelector(),
  useCommands({ commands: defaultCommands }),
  useWorkspace({ switcherElement: $("#workspace-switcher")! }),
  activeProvider.pipe(tap(console.log)) // debug
).subscribe();

defineSettingsElement();
defineCodeEditorElement();
defineStorageElement();
