import { fromEvent, switchMap, tap } from "rxjs";
import { defineChatInputElement } from "./components/chat-input/chat-input-element";
import { CodeEditorElement, defineCodeEditorElement } from "./components/code-editor/code-editor-element";
import { readFile } from "./components/file-system/file-system";
import { defineTaskElement } from "./components/thread/task-element";
import { defineThreadElement } from "./components/thread/thread-element";
import { useMenu } from "./components/use-menu";

defineChatInputElement();
defineThreadElement();
defineTaskElement();
defineCodeEditorElement();

useMenu();

fromEvent<CustomEvent>(window, "open-file")
  .pipe(
    switchMap(async (event) => {
      const sourceCode = await readFile(event.detail);
      return sourceCode;
    }),
    tap((sourceCode) => {
      document.querySelector<CodeEditorElement>("code-editor-element")!.value = sourceCode;
    })
  )
  .subscribe();
