import type { CodeEditorElement } from "./code-editor/code-editor-element";
import { $frag } from "./dom";

export function defineFrameElement() {
  if (customElements.get("frame-element")) return;
  customElements.define("frame-element", FrameElement);
}

export class FrameElement extends HTMLElement {
  connectedCallback() {
    const frag = $frag`
    <input type="text" placeholder="markdown" value="markdown" />
    <code-editor-element data-lang="markdown"></code-editor-element>
    `;

    this.appendChild(frag);

    this.querySelector("input")?.addEventListener("input", (e) => {
      const input = e.target as HTMLInputElement;
      const editor = this.querySelector("code-editor-element") as CodeEditorElement;
      editor.updateLanguage(input.value);
    });
  }
}
