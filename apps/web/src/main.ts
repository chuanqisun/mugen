import { filter, fromEvent, map, merge, share, Subject, tap } from "rxjs";
import { defineCodeEditorElement } from "./elements/code-editor/code-editor-element";
import { defineFileTreeElement } from "./elements/file-tree/file-tree-element";
import { defineSettingsElement, SettingsElement } from "./elements/settings-element";
import { createFileSystem } from "./services/file-system";
import { setSettings } from "./services/settings";
import { parseKeyboardShortcut, preventDefault, stopPropagation, toCustomEventDetail, toTargetValueString } from "./utils/event";
import { $ } from "./utils/query";
import { parseCommand } from "./utils/string";

/** Define custom elements */
defineSettingsElement();
defineCodeEditorElement();
defineFileTreeElement();

/** Global variables */
const fs = createFileSystem();
fs.write("/welcome.txt", "Welcome to the chat!");

/** Element queries */
const promptInputElement = $<HTMLInputElement>("#prompt-input")!;
const settingsDialogElement = $<HTMLDialogElement>("#settings-dialog")!;
const menuElement = $<HTMLMenuElement>("#menu")!;
const settingsElement = $<SettingsElement>("settings-element")!;

/** Declare subjects */
const $programmaticCommandBox = new Subject<string>();

/** Stream processing */
const $keyboardShortcut = fromEvent<KeyboardEvent>(document, "keydown").pipe(map(parseKeyboardShortcut), filter(Boolean));
const openMenu$ = fromEvent(menuElement, "click").pipe(tap(() => settingsDialogElement.showModal()));
const settingsChange$ = fromEvent(settingsElement, "settingschange").pipe(
  map((e) => toCustomEventDetail<Record<string, any>>(e)),
  tap(setSettings)
);

const textInputSubmission$ = fromEvent<KeyboardEvent>(promptInputElement, "keydown").pipe(
  filter((event) => event.key === "Enter"),
  tap(preventDefault),
  tap(stopPropagation),
  map(toTargetValueString),
  map((value) => value.trim()),
  filter(Boolean),
  tap(() => (promptInputElement.value = "")),
  share()
);

const $textInputCommandSubmission = textInputSubmission$.pipe(filter((content) => content.startsWith("/")));
const $textInputChatSubmission = textInputSubmission$.pipe(filter((content) => !content.startsWith("/")));
const $parsedCommand = merge($textInputCommandSubmission, $programmaticCommandBox).pipe(map(parseCommand));

const handleCommand$ = $parsedCommand.pipe(
  tap((parsed) => {
    console.log(parsed);
    switch (parsed.command) {
      case "login":
        return settingsDialogElement.showModal();
      case "focusPrompt":
        return promptInputElement.focus();
      case "new":
        fs.write(parsed.argsRaw ?? "new-file.txt", "");
        return;
    }
  })
);

const handleKeyboardShortcut$ = $keyboardShortcut.pipe(
  tap((parsed) => {
    switch (parsed.combo) {
      case "Ctrl+KeyK":
        parsed.event.preventDefault();
        return $programmaticCommandBox.next("/focusPrompt");
    }
  })
);

/** I/O effects */
openMenu$.subscribe();
settingsChange$.subscribe();

handleCommand$.subscribe();
handleKeyboardShortcut$.subscribe();

// debug
fs.debug$.subscribe(console.log);
