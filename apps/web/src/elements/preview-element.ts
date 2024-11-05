import { html, render } from "lit";
import { BehaviorSubject, map, tap } from "rxjs";

export class PreviewElement extends HTMLElement {
  shadowRoot = this.attachShadow({ mode: "open" });
  private $srcdoc = new BehaviorSubject<string>("");

  $view = this.$srcdoc.pipe(
    map(
      (srcdoc) => html`
        <style>
          iframe {
            width: 100%;
            height: 100%;
            border: none;
            display: block;
          }
        </style>
        <iframe .srcdoc=${srcdoc.trim()}></iframe>
      `
    ),
    tap((template) => render(template, this.shadowRoot))
  );

  connectedCallback() {
    this.$view.subscribe();
  }

  renderHTML(html: string) {
    this.$srcdoc.next(html);
  }
}

export function definePreviewElement(tagName = "preview-element") {
  customElements.define(tagName, PreviewElement);
}
