export class OpenaiElement extends HTMLElement {}

export function defineOpenaiElement() {
  customElements.define("openai-element", OpenaiElement);
}
