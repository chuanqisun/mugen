import { filter, fromEvent, switchMap, tap } from "rxjs";
import { ChatInputElement, defineChatInputElement } from "./components/chat-input/chat-input-element";
import { $commandSubmissions } from "./components/chat-input/submission";
import { CodeEditorElement, defineCodeEditorElement } from "./components/code-editor/code-editor-element";
import { readFile } from "./components/file-system/file-system";
import helpText from "./components/help/help.txt?raw";
import { $globalShortcut } from "./components/keyboard/keyboard";
import { defineTaskElement } from "./components/log/task-element";
import { defineThreadElement } from "./components/log/thread-element";
import { definePopoverElement } from "./components/popover/popover-element";
import { defineSettingsElement } from "./components/settings/settings-element";
import { preventDefault } from "./lib/event";

defineChatInputElement();
defineCodeEditorElement();
definePopoverElement();
defineSettingsElement();
defineTaskElement();
defineThreadElement();

fromEvent<CustomEvent>(window, "open-file")
  .pipe(
    switchMap(async (event) => readFile(event.detail)),
    tap((sourceCode) => (document.querySelector<CodeEditorElement>("code-editor-element")!.value = sourceCode))
  )
  .subscribe();

$commandSubmissions
  .pipe(
    tap((command) => {
      switch (command) {
        case "?":
        case "help": {
          document.querySelector<CodeEditorElement>("code-editor-element")!.value = helpText.trim();
          break;
        }
        case "login": {
          document.querySelector<HTMLDialogElement>("#settings-dialog")!.showModal();
          break;
        }
      }
    })
  )
  .subscribe();

$globalShortcut
  .pipe(
    filter(({ combo }) => combo === "Ctrl+Slash"),
    tap((e) => preventDefault(e.event)),
    tap(() => document.querySelector<ChatInputElement>("chat-input-element")!.focus())
  )
  .subscribe();
