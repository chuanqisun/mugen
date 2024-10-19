import { fromEvent, map, tap } from "rxjs";
import { $apiKey, setApiKey } from "../lib/auth";
import { toTargetValueString } from "../lib/event";

export function useOptionsDialog() {
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
