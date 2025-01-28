import { BehaviorSubject, fromEvent, map, merge, tap } from "rxjs";
import { CodeEditorElement, defineCodeEditorElement } from "./code-editor/code-editor-element";
import { defaultCommands } from "./commands/default-commands";
import { useCommands } from "./commands/use-commands";
import { activeProvider, useProviderSelector } from "./settings/provider-selector";
import { defineSettingsElement } from "./settings/settings-element";
import { EmulatedFileSystem } from "./storage/fs-api";
import { defineStorageElement } from "./storage/storage-element";
import { useWorkspace, workspaceDirectory$ } from "./storage/workspace";
import "./style.css";
import { $, $new, getEventDetail } from "./utils/dom";

const codeEditor = $<CodeEditorElement>("code-editor-element")!;

merge(
  useProviderSelector(),
  useCommands({ commands: defaultCommands }),
  useWorkspace({ switcherElement: $("#workspace-switcher")! }),
  activeProvider.pipe(tap(console.log)) // debug
).subscribe();

const fs$ = new BehaviorSubject<EmulatedFileSystem | null>(null);
workspaceDirectory$.subscribe((handle) => {
  if (!handle) return;
  fs$.next(new EmulatedFileSystem(handle));
});

fromEvent(codeEditor, "run")
  .pipe(
    map(getEventDetail<string>),
    tap((input) => {
      codeEditor.value = "";

      console.log(input);
      const outputContainer = $new("pre", { style: "padding-block: 0.5rem" }, [`> ${input}\n`]);
      $<HTMLElement>("#stdout")?.append(outputContainer);
      const [command, ...args] = input.split(" ");

      switch (command) {
        case "ls":
          fs$.value?.ls().then((result) => {
            outputContainer.textContent += result.join("\n");
          });
          break;
        case "cd":
          fs$.value?.cd(args[0]);
          break;
        default:
          console.log("Unknown command");
      }
    })
  )
  .subscribe();

defineSettingsElement();
defineCodeEditorElement();
defineStorageElement();
