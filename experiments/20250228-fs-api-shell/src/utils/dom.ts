/* Query and Mutation helpers */
export const $ = document.querySelector.bind(document);
export const $all = document.querySelectorAll.bind(document);

interface CreateElement {
  <K extends keyof HTMLElementTagNameMap>(tag: K, attributes?: Record<string, string>, children?: (HTMLElement | string)[]): HTMLElementTagNameMap[K];
  <T extends HTMLElement>(tag: string, attributes?: Record<string, string>, children?: (HTMLElement | string)[]): T;
}

export const $new: CreateElement = (tag: string, attributes: Record<string, string> = {}, children: (HTMLElement | string)[] = []) => {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, value);
  }
  for (const child of children) {
    element.append(child);
  }
  return element;
};

/* Event processing */
export interface ParsedCommandEvent {
  event: Event;
  trigger?: HTMLElement;
  command?: string | null;
}

export function parseCommandEvent(e: Event): ParsedCommandEvent {
  const actionTrigger = (e.target as HTMLElement).closest("[data-command]");
  if (!actionTrigger)
    return {
      event: e,
    };

  const command = actionTrigger.getAttribute("data-command");
  return {
    event: e,
    trigger: actionTrigger as HTMLElement,
    command,
  };
}

export function preventDefault(e: Event) {
  e.preventDefault();
}

export function stopPropagation(e: Event) {
  e.stopPropagation();
}

export function getTargetValue(e: Event) {
  return (e.target as HTMLInputElement).value ?? "";
}

export function getEventDetail<T>(e: Event) {
  return (e as CustomEvent<T>).detail;
}

export interface KeyboardShortcut {
  /**
   * format: "[ctrl+][alt+][shift+]<event.key>"
   * event.key is all lowercase and with space spelt out as "space"
   * Reference: https://www.toptal.com/developers/keycode
   */
  combo: string;
  event: KeyboardEvent;
}

const MODIFIERS = ["Control", "Alt", "Shift", "Meta"];
export function isModifierKey(event: KeyboardEvent) {
  return MODIFIERS.includes(event.key);
}

export function parseKeyboardShortcut(event: KeyboardEvent): KeyboardShortcut | null {
  if (isModifierKey(event)) return null;

  const ctrlPrefix = event.metaKey || event.ctrlKey ? "ctrl+" : "";
  const altPrefix = event.altKey ? "alt+" : "";
  const shiftPrefix = event.shiftKey ? "shift+" : "";
  const key = event.key === " " ? "space" : event.key.toLocaleLowerCase();
  const combo = `${ctrlPrefix}${altPrefix}${shiftPrefix}${key}`;

  return { combo, event };
}
