import { filter, fromEvent, map, merge, share, Subject, tap } from "rxjs";
import { defineSettingsElement } from "./elements/settings-element";
import { createFileSystem } from "./services/file-system";
import { parseKeyboardShortcut, preventDefault, stopPropagation, toTargetValueString } from "./utils/event";
import { $ } from "./utils/query";
import { parseCommand } from "./utils/string";

/** Define custom elements */
defineSettingsElement();

/** Global variables */
const fs = createFileSystem({
  initialFiles: {
    "/welcome.txt": {
      path: "/welcome.txt",
      file: new File(["Welcome to the chat!"], "welcome.txt"),
    },
  },
});

/** Element queries */
const promptInputElement = $<HTMLInputElement>("#prompt-input")!;
const settingsDialogElement = $<HTMLDialogElement>("#settings-dialog")!;

/** Declare subjects */
const $programmaticCommandBox = new Subject<string>();

/** Stream processing */
const $keyboardShortcut = fromEvent<KeyboardEvent>(document, "keydown").pipe(map(parseKeyboardShortcut), filter(Boolean));

const $textInputSubmission = fromEvent<KeyboardEvent>(promptInputElement, "keydown").pipe(
  filter((event) => event.key === "Enter"),
  tap(preventDefault),
  tap(stopPropagation),
  map(toTargetValueString),
  map((value) => value.trim()),
  filter(Boolean),
  tap(() => (promptInputElement.value = "")),
  share()
);

const $textInputCommandSubmission = $textInputSubmission.pipe(filter((content) => content.startsWith("/")));
const $textInputChatSubmission = $textInputSubmission.pipe(filter((content) => !content.startsWith("/")));
const $parsedCommand = merge($textInputCommandSubmission, $programmaticCommandBox).pipe(map(parseCommand));

const $handleCommand = $parsedCommand.pipe(
  tap((parsed) => {
    console.log(parsed);
    switch (parsed.command) {
      case "login":
        return settingsDialogElement.showModal();
      case "focusPrompt":
        return promptInputElement.focus();
    }
  })
);

const $handleKeyboardShortcut = $keyboardShortcut.pipe(
  tap((parsed) => {
    switch (parsed.combo) {
      case "Ctrl+KeyK":
        parsed.event.preventDefault();
        return $programmaticCommandBox.next("/focusPrompt");
    }
  })
);

const $updateMainThread = $textInputChatSubmission.pipe(
  tap((content) => {
    fs.append("/main-thread.html", `<user-message>${content}</user-message>`);
  })
);

/** I/O effects */
$handleCommand.subscribe();
$handleKeyboardShortcut.subscribe();
$updateMainThread.subscribe();

// debug
fs.$debug.subscribe(console.log);
