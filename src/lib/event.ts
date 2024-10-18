export function isCtrlEnterKeydown(e: KeyboardEvent) {
  return e.key === "Enter" && !e.shiftKey && e.ctrlKey && !e.metaKey && !e.altKey;
}

export function preventDefault(e: Event) {
  e.preventDefault();
}

export function toTargetValueString(e: Event) {
  return (e.target as HTMLInputElement).value ?? "";
}
