export function attachShadowHtml(element: HTMLElement, html: string, options?: ShadowRootInit): ShadowRoot {
  const shadow = element.attachShadow(options ?? { mode: "open" });
  shadow.innerHTML = html;
  return shadow;
}
