import { filter, fromEvent, map, share, tap } from "rxjs";
import { consumeStringValue } from "../../lib/consume-string-value";
import { isCtrlEnterKeydown, preventDefault } from "../../lib/event";

export function useChatInput() {
  /* query dom for static elements */
  const chatInputElement = document.querySelector("#chat-input") as HTMLTextAreaElement;

  /* rxjs behaviors */
  const $submission = fromEvent<KeyboardEvent>(chatInputElement, "keydown").pipe(
    filter(isCtrlEnterKeydown),
    tap(preventDefault),
    map((e) => e.target as HTMLTextAreaElement),
    map(consumeStringValue),
    tap(console.log),
    share()
  );

  /* render */
  return {
    $submission,
  };
}
