import OpenAI from "openai";
import { concatMap, filter, fromEvent, map, tap } from "rxjs";
import { $apiKey, setApiKey } from "./lib/auth";

import { fromAbortablePromise } from "./lib/abort";
import { isEnterKeydown, preventDefault, toTargetValueString } from "./lib/event";
import { user } from "./lib/message";
import { $recognition, recognizer } from "./lib/web-speech/speech-to-text";
import { speaker } from "./lib/web-speech/text-to-speech";
import "./main.css";

const openai = new OpenAI({ apiKey: $apiKey.value, dangerouslyAllowBrowser: true });

// static elements
const apiKeyInput = document.querySelector(`[name="api-key"]`) as HTMLInputElement;
const textareaElement = document.querySelector("textarea") as HTMLTextAreaElement;
const speakButton = document.querySelector(`#push-to-talk`) as HTMLButtonElement;
const chatForm = document.querySelector(`#chat-form`) as HTMLFormElement;
const threadContainer = document.querySelector(`#thread`) as HTMLElement;

function consumeTextareaValue() {
  const value = textareaElement.value;
  textareaElement.value = "";
  return value;
}

function appendMessage(role: string, content: string) {
  threadContainer.innerHTML += `<div class="message"><span class="message__role">${role}</span><pre><code>${content}</code></pre></div>`;
}

// initialize api key input
apiKeyInput.value = $apiKey.value;
fromEvent<KeyboardEvent>(apiKeyInput, "input").pipe(map(toTargetValueString), tap(setApiKey)).subscribe();

fromEvent<KeyboardEvent>(textareaElement, "keydown")
  .pipe(
    filter(isEnterKeydown),
    tap(preventDefault),
    tap(() => chatForm.requestSubmit())
  )
  .subscribe();

fromEvent<SubmitEvent>(chatForm, "submit")
  .pipe(
    tap(preventDefault),
    map(consumeTextareaValue),
    tap((content) => appendMessage("User", content)),
    concatMap((prompt) => fromAbortablePromise((signal) => openai.chat.completions.create({ model: "gpt-4o-mini", messages: [user`${prompt}`] }, { signal }))),
    filter((r) => r.choices[0].finish_reason === "stop"),
    map((r) => r.choices[0].message.content ?? ""),
    tap((content) => appendMessage("Assistant", content)),
    tap(speaker.speak)
  )
  .subscribe();

// poc speech
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
