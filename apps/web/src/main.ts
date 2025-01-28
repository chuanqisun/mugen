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
    tap(async (input) => {
      codeEditor.value = "";
      const outputContainer = $new("pre", { style: "padding-block: 0.5rem" }, [`> ${input}\n`]);
      $<HTMLElement>("#stdout")?.prepend(outputContainer);
      const [command, ...args] = input.split(" ");

      let result: AsyncIterable<string> | undefined = undefined;

      switch (command) {
        case "ls":
          result = fs$.value?.ls(args[0]);
          break;
        case "cd":
          result = fs$.value?.cd(args[0]);
          break;
        default:
          console.log("Unknown command");
      }

      if (result) {
        for await (const line of result) {
          outputContainer.append(line);
        }
      }
    })
  )
  .subscribe();

defineSettingsElement();
defineCodeEditorElement();
defineStorageElement();
