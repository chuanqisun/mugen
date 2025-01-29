import { BehaviorSubject, fromEvent, map, merge, tap } from "rxjs";
import { CodeEditorElement, defineCodeEditorElement } from "./code-editor/code-editor-element";
import { defaultCommands } from "./commands/default-commands";
import { useCommands } from "./commands/use-commands";
import { activeProvider, useProviderSelector } from "./settings/provider-selector";
import { defineSettingsElement } from "./settings/settings-element";
import { Environment, getDirHandle, getFileHandle, ls, resolve } from "./storage/fs-api";
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

const env$ = new BehaviorSubject<Environment | null>(null);
workspaceDirectory$.subscribe((handle) => {
  if (!handle) return;
  env$.next(new Environment({ root: handle }));
});

fromEvent(codeEditor, "run")
  .pipe(
    map(getEventDetail<string>),
    tap(async (input) => {
      const env = env$.value;
      if (!env) return;

      codeEditor.value = "";
      const outputContainer = $new("pre", { style: "padding-block: 0.5rem" }, [`> ${input}\n`]);
      $<HTMLElement>("#stdout")?.prepend(outputContainer);
      const [command, ...args] = input.split(" ");

      let result: Iterable<string> | AsyncIterable<string> | undefined = undefined;

      switch (command) {
        case "ls": {
          result = await getDirHandle(env.root, resolve(env.cwd, args[0])).then((handle) => ls(handle));
          break;
        }
        case "cd": {
          const maybeCwd = resolve(env.cwd, args[0]);
          await getDirHandle(env.root, maybeCwd);
          env.cwd = maybeCwd;
          break;
        }
        case "pwd": {
          result = [env.cwd];
          break;
        }
        case "cat": {
          const file = await getFileHandle(env.root, resolve(env.cwd, args[0])).then((handle) => handle.getFile());
          const stream = file.stream();
          const textStream = stream.pipeThrough(new TextDecoderStream());
          result = textStream;
          break;
        }
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
