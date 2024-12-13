export function preventDefault(e: Event) {
  e.preventDefault();
}

export function stopPropagation(e: Event) {
  e.stopPropagation();
}

export function toTargetValueString(e: Event) {
  return (e.target as HTMLInputElement).value ?? "";
}

export function toCustomEventDetail<T>(e: Event) {
  return (e as CustomEvent<T>).detail;
}

export interface KeyboardShortcut {
  /**  format: "[Ctrl+][Alt+][Shift+]<event.code>" https://www.toptal.com/developers/keycode */
  combo: string;
  event: KeyboardEvent;
}

const MODIFIERS = ["Control", "Alt", "Shift", "Meta"];
export function isModifierKey(event: KeyboardEvent) {
  return MODIFIERS.includes(event.key);
}

export function parseKeyboardShortcut(event: KeyboardEvent): KeyboardShortcut | null {
  if (isModifierKey(event)) return null;

  const combo = [event.ctrlKey ? "Ctrl" : "", event.altKey ? "Alt" : "", event.shiftKey ? "Shift" : "", event.code].filter(Boolean).join("+");
  return { combo, event };
}
