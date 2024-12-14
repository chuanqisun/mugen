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
