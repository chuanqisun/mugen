import { filter, fromEvent, switchMap, tap } from "rxjs";
import { ChatInputElement, defineChatInputElement } from "./components/chat-input/chat-input-element";
import { CodeEditorElement, defineCodeEditorElement } from "./components/code-editor/code-editor-element";
import { $globalCommands } from "./components/command/command";
import { readFile } from "./components/file-system/file-system";
import { $globalShortcut } from "./components/keyboard/keyboard";
import { definePopoverElement } from "./components/popover/popover-element";
import { defineSettingsElement } from "./components/settings/settings-element";
import { defineTaskElement } from "./components/thread/task-element";
import { defineThreadElement } from "./components/thread/thread-element";
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

$globalCommands
  .pipe(
    tap((command) => {
      switch (command) {
        case "?":
        case "help": {
          document.querySelector<CodeEditorElement>("code-editor-element")!.value = `
Syntax
======
<goal or instruction> - Run a task
/<command> - Run a command

Commands
========
? or help - Show this help message
login - Log in to connect with LLM service
    `.trim();
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
