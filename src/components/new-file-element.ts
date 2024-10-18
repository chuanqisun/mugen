class NewFileElement extends HTMLElement {
  private buttonElement: HTMLButtonElement | null = null;
  private inputElement: HTMLInputElement | null = null;

  private buttonElementOriginalDisplay = "";
  private inputElementOriginalDisplay = "";

  connectedCallback() {
    this.buttonElement = this.querySelector("button");
    this.inputElement = this.querySelector("input");

    if (!this.buttonElement || !this.inputElement) throw new Error("button or input element not found");
    this.buttonElementOriginalDisplay = this.buttonElement.style.display;
    this.inputElementOriginalDisplay = this.inputElement.style.display;

    this.buttonElement.addEventListener("click", this.handleButtonClick.bind(this));
    this.inputElement.addEventListener("blur", this.handleBlur.bind(this));
    this.inputElement.style.display = "none";
  }

  private handleButtonClick() {
    this.inputElement!.style.display = this.inputElementOriginalDisplay;
    this.inputElement!.focus();
    this.buttonElement!.style.display = "none";
  }

  private handleBlur() {
    this.buttonElement!.style.display = this.buttonElementOriginalDisplay;
    this.inputElement!.style.display = "none";
  }
}

export function defineNewFileElement() {
  customElements.define("new-file-element", NewFileElement);
}
