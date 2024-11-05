export function preventDefault(e: Event) {
  e.preventDefault();
}

export function toTargetValueString(e: Event) {
  return (e.target as HTMLInputElement).value ?? "";
}

export function toCustomEventDetail<T>(e: Event) {
  return (e as CustomEvent<T>).detail;
}
