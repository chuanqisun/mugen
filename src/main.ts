import { filter, tap } from "rxjs";
import { ChatInputElement, defineChatInputElement } from "./components/chat-input/chat-input-element";
import { $commandSubmissions } from "./components/chat-input/submission";
import { defineSettingsElement } from "./components/chat-provider/settings-element";
import { CodeEditorElement, defineCodeEditorElement } from "./components/code-editor/code-editor-element";
import helpText from "./components/help/help.txt?raw";
import { $runs } from "./components/interpreter/run";
import { $globalShortcut } from "./components/keyboard/keyboard";
import { defineTaskElement } from "./components/log/entry-element";
import { defineLogElement } from "./components/log/log-element";
import { defineOutlineElement } from "./components/outline/outline-element";
import { definePopoverElement } from "./components/popover/popover-element";
import { preventDefault } from "./lib/event";

defineChatInputElement();
defineCodeEditorElement();
definePopoverElement();
defineSettingsElement();
defineTaskElement();
defineLogElement();
defineOutlineElement();

$runs.subscribe();

$commandSubmissions
  .pipe(
    tap((command) => {
      switch (command) {
        case "?":
        case "help": {
          document.querySelector<CodeEditorElement>("code-editor-element")!.loadText(helpText);
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
