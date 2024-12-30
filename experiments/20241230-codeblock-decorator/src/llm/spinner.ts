// TODO refactor to use css only
export class SpinnerElement extends HTMLElement {
  private spinnerIndex = 0;
  private spinnerChars = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  private timeoutId: null | number = null;

  connectedCallback() {
    this.startSpinner();
  }

  disconnectedCallback() {
    this.stopSpinner();
  }

  startSpinner() {
    this.timeoutId = window.setInterval(() => {
      this.textContent = this.spinnerChars[this.spinnerIndex];
      this.spinnerIndex = (this.spinnerIndex + 1) % this.spinnerChars.length;
    }, 80);
  }

  stopSpinner() {
    window.clearInterval(this.timeoutId!);
  }
}

export function defineSpinnerElement(tagName = "spinner-element") {
  customElements.define(tagName, SpinnerElement);
}
