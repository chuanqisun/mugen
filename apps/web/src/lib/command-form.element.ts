import { fromEvent, map, startWith } from "rxjs";
import html from "./command-form.element.html?raw";
import { attachShadowHtml } from "./shadow";

export function defineCommandFormElement() {
  customElements.define("command-form-element", CommandFormElement);
}

export class CommandFormElement extends HTMLElement {
  shadowRoot = attachShadowHtml(this, html);

  connectedCallback() {
    const input = this.shadowRoot!.querySelector("input") as HTMLInputElement;
    const form = this.shadowRoot!.querySelector("form") as HTMLFormElement;
    const suggestions = this.shadowRoot!.querySelector("#suggestions") as HTMLUListElement;

    fromEvent<KeyboardEvent>(input, "input")
      .pipe(
        map((e) => (e.target as HTMLInputElement).value),
        startWith("")
      )
      .subscribe((value) => {
        suggestions.innerHTML = listCommands()
          .filter((command) => command.name.toLowerCase().includes(value.toLowerCase()))
          .map((command) => {
            return `<li data-name="${command.name}">${command.name}</li>`;
          })
          .join("");
      });

    fromEvent(form, "submit").subscribe(() => {
      const activeSuggestionName = suggestions.querySelector("li")?.getAttribute("data-name") ?? "";
      console.log("command", activeSuggestionName);

      const input = this.shadowRoot!.querySelector("input") as HTMLInputElement;
      input.value = "";
    });
  }
}

export function listCommands() {
  return [
    {
      name: "clear",
    },
    {
      name: "trim",
    },
    {
      name: "append user message",
    },
    {
      name: "append model message",
    },
    {
      name: "submit",
    },
  ];
}
