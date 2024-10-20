import { html, render } from "lit";
import resetCSSUrl from "../reset.css?url";
import elementCSSUrl from "./popover-element.css?url";

export class PopoverElement extends HTMLElement {
  shadowRoot: ShadowRoot;

  constructor() {
    super();
    this.shadowRoot = this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    const popoverId = crypto.getRandomValues(new Uint32Array(1))[0].toString(16);

    render(
      html`
        <style>
          @import url(${resetCSSUrl});
          @import url(${elementCSSUrl});
        </style>
        <div class="layout-container">
          <button popovertarget=${popoverId}>
            <slot name="trigger"></slot>
          </button>
          <div data-popover-body>
            <slot name="popover"></slot>
          </div>
          <div popover id=${popoverId}></div>
        </div>
      `,
      this.shadowRoot
    );
  }
}

export function definePopoverElement() {
  customElements.define("popover-element", PopoverElement);
}
