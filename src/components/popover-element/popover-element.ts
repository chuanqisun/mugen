import "./popover-element.css";
export class PopoverElement extends HTMLElement {
  connectedCallback() {
    const triggerElement = this.querySelector("[data-trigger]") as HTMLButtonElement;
    const randomBase64Id = crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
    const targetElement = this.querySelector("[data-target]") as HTMLElement;

    triggerElement.setAttribute("popovertarget", randomBase64Id);
    const dummyPopover = document.createElement("div");
    dummyPopover.id = randomBase64Id;
    dummyPopover.setAttribute("popover", "");

    // insert dummy just before the this element
    targetElement.before(dummyPopover);
  }
}

export function definePopoverElement() {
  customElements.define("popover-element", PopoverElement);
}
