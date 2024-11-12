import type { TextDelta } from "@anthropic-ai/sdk/resources/messages.mjs";
import { Parser } from "htmlparser2";
import { concatMap, filter, from, fromEvent, map, merge, Observable, share, Subject, tap } from "rxjs";
import { defineSettingsElement } from "./elements/settings-element";
import { createFileSystem } from "./services/file-system";
import { $chat } from "./services/llm";
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

const $htmlStream = $textInputChatSubmission.pipe(
  concatMap((content) => {
    const responseStream = $chat.value.messages.stream({
      system: `Respond to user in valid innerHTML that can be used inside a <body> element. Make sure you respond nothing but valid HTML`.trim(),
      messages: [{ role: "user", content }],
      model: "claude-3-5-haiku-latest",
      max_tokens: 1024,
    });

    let emitContainer = document.querySelector("#preview-container")!;

    return new Observable<any>((subscriber) => {
      const parser = new Parser({
        onopentag(name, attributes, implied) {
          const element = document.createElement(name);
          for (const [key, value] of Object.entries(attributes)) {
            element.setAttribute(key, value);
          }
          emitContainer.appendChild(element);
          emitContainer = element;
        },
        ontext(text) {
          emitContainer.append(document.createTextNode(text));
        },
        onclosetag(tagname, implied) {
          emitContainer = emitContainer.parentElement!;
        },
      });

      const sub = from(responseStream)
        .pipe(
          filter((chunk) => chunk.type === "content_block_delta"),
          filter((contentBlockDelta) => contentBlockDelta.delta.type === "text_delta"),
          map((contentBlockDelta) => (contentBlockDelta.delta as TextDelta).text),
          tap((delta) => parser.write(delta))
        )
        .subscribe(subscriber);

      return () => sub.unsubscribe();
    });
  })
);

/** I/O effects */
$handleCommand.subscribe();
$handleKeyboardShortcut.subscribe();
$updateMainThread.subscribe();

$htmlStream.subscribe();

// debug
fs.$debug.subscribe(console.log);
