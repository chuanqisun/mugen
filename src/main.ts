import OpenAI from "openai";
import { concatMap, filter, fromEvent, map, tap } from "rxjs";
import { $apiKey, setApiKey } from "./lib/auth";

import { fromAbortablePromise } from "./lib/abort";
import { isEnterKeydown, preventDefault, toTargetValueString } from "./lib/event";
import { user } from "./lib/message";
import "./main.css";

const openai = new OpenAI({ apiKey: $apiKey.value, dangerouslyAllowBrowser: true });

// static elements
const apiKeyInput = document.querySelector(`[name="api-key"]`) as HTMLInputElement;
const textareaElement = document.querySelector("textarea") as HTMLTextAreaElement;

function clearTextarea() {
  textareaElement.value = "";
}

// initialize api key input
apiKeyInput.value = $apiKey.value;
fromEvent<KeyboardEvent>(apiKeyInput, "input").pipe(map(toTargetValueString), tap(setApiKey)).subscribe();
fromEvent<KeyboardEvent>(textareaElement, "keydown")
  .pipe(
    filter(isEnterKeydown),
    tap(preventDefault),
    map(toTargetValueString),
    tap(clearTextarea),
    concatMap((prompt) => fromAbortablePromise((signal) => openai.chat.completions.create({ model: "gpt-4o", messages: [user`${prompt}`] }, { signal }))),
    tap((r) => console.log(r))
  )
  .subscribe();
