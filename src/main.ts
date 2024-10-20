import { fromEvent, switchMap, tap } from "rxjs";
import { useChatInput } from "./components/chat-input/use-chat-input";
import { CodeEditorElement, defineCodeEditorElement } from "./components/code-editor/code-editor-element";
import { defineTaskElement } from "./components/thread/task-element";
import { useThread } from "./components/thread/use-thread";
import { useMenu } from "./components/use-menu";

import { readFile } from "./components/file-system/file-system";
import "./main.css";

defineTaskElement();
defineCodeEditorElement();

useMenu();
const { $submission } = useChatInput();
useThread({ newMessage: $submission });

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
