import { share, Subject } from "rxjs";

const $globalShortcutInternal = new Subject<GlobalShortcut>();

export const $globalShortcut = $globalShortcutInternal.asObservable().pipe(share());

export interface GlobalShortcut {
  /**  format: "[Ctrl+][Alt+][Shift+]<event.code>" https://www.toptal.com/developers/keycode */
  combo: string;
  event: KeyboardEvent;
}

document.addEventListener("keydown", (event) => {
  const combo = [event.ctrlKey ? "Ctrl" : "", event.altKey ? "Alt" : "", event.shiftKey ? "Shift" : "", event.code].filter(Boolean).join("+");
  $globalShortcutInternal.next({ combo, event });
});
