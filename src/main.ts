import { fromEvent, switchMap, tap } from "rxjs";
import { defineChatInputElement } from "./components/chat-input/chat-input-element";
import { CodeEditorElement, defineCodeEditorElement } from "./components/code-editor/code-editor-element";
import { readFile } from "./components/file-system/file-system";
import { definePopoverElement } from "./components/popover/popover-element";
import { defineSettingsElement } from "./components/settings/settings-element";
import { defineTaskElement } from "./components/thread/task-element";
import { defineThreadElement } from "./components/thread/thread-element";

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

fromEvent<MouseEvent>(document.querySelector("#open-settings")!, "click")
  .pipe(tap(() => document.querySelector<HTMLDialogElement>("#settings-dialog")!.showModal()))
  .subscribe();
