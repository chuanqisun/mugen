import { fromEvent, map, tap } from "rxjs";
import { toTargetValueString } from "../lib/event";
import { $apiKey, setApiKey } from "./chat-provider/auth";

export function useMenu() {
  const optionsDialogTrigger = document.querySelector("#open-menu") as HTMLButtonElement;
  optionsDialogTrigger.addEventListener("click", () => {
    document.querySelector("dialog")!.showModal();
  });

  // static elements
  const apiKeyInput = document.querySelector(`[name="api-key"]`) as HTMLInputElement;
  // initialize api key input
  apiKeyInput.value = $apiKey.value;
  fromEvent<KeyboardEvent>(apiKeyInput, "input").pipe(map(toTargetValueString), tap(setApiKey)).subscribe();
}
