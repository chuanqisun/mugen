import { html, render } from "lit";
import { repeat } from "lit/directives/repeat.js";
import OpenAI from "openai";
import { concatMap, filter, fromEvent, map, tap } from "rxjs";
import { fromAbortablePromise } from "./lib/abort";
import { $apiKey, setApiKey } from "./lib/auth";
import { isCtrlEnterKeydown, preventDefault, toTargetValueString } from "./lib/event";
import { $thread, appendThreadItem } from "./lib/thread";
import { $recognition, recognizer } from "./lib/web-speech/speech-to-text";
import { speaker } from "./lib/web-speech/text-to-speech";

import { defineNewFileElement } from "./components/new-file-element";
import "./main.css";

/* Define web components */
defineNewFileElement();

const openai = new OpenAI({ apiKey: $apiKey.value, dangerouslyAllowBrowser: true });

// static elements
const apiKeyInput = document.querySelector(`[name="api-key"]`) as HTMLInputElement;
const textareaElement = document.querySelector("textarea") as HTMLTextAreaElement;
const speakButton = document.querySelector(`#push-to-talk`) as HTMLButtonElement;
const menuButton = document.querySelector(`#open-menu`) as HTMLButtonElement;
const chatForm = document.querySelector(`#chat-form`) as HTMLFormElement;
const threadContainer = document.querySelector(`#thread`) as HTMLElement;

function consumeTextareaValue() {
  const value = textareaElement.value;
  textareaElement.value = "";
  return value;
}

// initialize api key input
apiKeyInput.value = $apiKey.value;
fromEvent<KeyboardEvent>(apiKeyInput, "input").pipe(map(toTargetValueString), tap(setApiKey)).subscribe();

fromEvent<KeyboardEvent>(textareaElement, "keydown")
  .pipe(
    filter(isCtrlEnterKeydown),
    tap(preventDefault),
    tap(() => chatForm.requestSubmit())
  )
  .subscribe();

fromEvent<SubmitEvent>(chatForm, "submit")
  .pipe(
    tap(preventDefault),
    map(consumeTextareaValue),
    tap((content) => appendThreadItem({ role: "user", content })),
    concatMap(() => fromAbortablePromise((signal) => openai.chat.completions.create({ model: "gpt-4o-mini", messages: $thread.value }, { signal }))),
    filter((r) => r.choices[0].finish_reason === "stop"),
    map((r) => r.choices[0].message.content ?? ""),
    tap((content) => appendThreadItem({ role: "assistant", content })),
    tap(speaker.speak)
  )
  .subscribe();

speakButton.addEventListener("mousedown", () => {
  speaker.stop();
  recognizer.start();
});
speakButton.addEventListener("mouseup", () => recognizer.stop());

$recognition.subscribe((e) => {
  if (e.isFinal) {
    textareaElement.value += (textareaElement.value ? " " : "") + e.text;
  } else {
    console.log(e.text);
  }
});

menuButton.addEventListener("click", () => {
  document.querySelector("dialog")!.showModal();
});

/* Output */

$thread
  .pipe(
    tap((thread) =>
      render(
        repeat(
          thread,
          (item) => item.id,
          (item) => html`
            <div class="message">
              <span class="message__role">${item.role}</span>
              <pre><code>${item.content}</code></pre>
            </div>
          `
        ),
        threadContainer
      )
    )
  )
  .subscribe();
