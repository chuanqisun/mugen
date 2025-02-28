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
      const outputContainer = $new("pre", { style: "padding-block: 0.5rem; white-space: pre-wrap" }, [`> ${input}\n`]);
      $<HTMLElement>("#stdout")?.prepend(outputContainer);

      // extract the command from the beginning of the input, and the rawArgString as the rest
      const trimmedInput = input.trim();
      const hasSpace = trimmedInput.includes(" ");
      const command = hasSpace ? trimmedInput.slice(0, trimmedInput.indexOf(" ")) : trimmedInput;
      const rawArgString = hasSpace ? trimmedInput.slice(trimmedInput.indexOf(" ") + 1).trim() : "";
      const args = rawArgString.split(/\s+/);

      const stdout = {
        pipe: async (streamLike: Iterable<string> | AsyncIterable<string>) => {
          for await (const line of streamLike) {
            outputContainer.append(line);
          }
        },
        render: (renderFn: (container: HTMLElement) => any) => renderFn(outputContainer),
      };

      const { provider, connection } = activeProvider.value ?? {};
      const chatStreamProxy = provider && connection ? provider.getChatStreamProxy(connection) : null;

      const stdlib = {
        chatStream:
          chatStreamProxy ??
          async function* () {
            return "No chat provider available";
          },
      };

      try {
        switch (command) {
          case "ls": {
            getDirHandle(env.root, resolve(env.cwd, args.at(0) ?? "."))
              .then(ls)
              .then(stdout.pipe);
            break;
          }
          case "cd": {
            const maybeCwd = resolve(env.cwd, args.at(0) ?? ".");
            await getDirHandle(env.root, maybeCwd);
            env.cwd = maybeCwd;
            break;
          }
          case "pwd": {
            stdout.pipe([env.cwd]);
            break;
          }
          case "date": {
            stdout.pipe([new Date().toString()]);
            break;
          }
          case "cat": {
            getFileHandle(env.root, resolve(env.cwd, args[0]))
              .then((handle) => handle.getFile())
              .then((file) => file.stream().pipeThrough(new TextDecoderStream()))
              .then(stdout.pipe);
            break;
          }
          case "open": {
            break;
          }
          case "!": {
            break;
          }
          case "?": {
            stdout.pipe(stdlib.chatStream({ messages: [{ role: "user", content: rawArgString }] }));
            break;
          }
          default:
            throw new Error(`Command not found: ${command}`);
        }
      } catch (e) {
        outputContainer.append(`${(e as any)?.message}`);
      }
    })
  )
  .subscribe();

defineSettingsElement();
defineCodeEditorElement();
defineStorageElement();
