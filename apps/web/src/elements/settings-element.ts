import { html, render } from "lit";
import { fromEvent, tap } from "rxjs";
import { settings$ } from "../services/settings";

export class SettingsElement extends HTMLElement {
  #submit$ = fromEvent(this, "submit").pipe(
    tap((event) => {
      const formData = new FormData(event.target as HTMLFormElement);
      this.dispatchEvent(new CustomEvent("settingschange", { detail: Object.fromEntries(formData) }));
    })
  );

  connectedCallback() {
    render(
      html`
        <form class="rows" method="dialog">
          <label>Claude</label>
          <input name="claudeApiKey" type="password" .value=${settings$.value["claudeApiKey"] ?? ""} />
          <label>OpenAI</label>
          <input name="openaiApiKey" type="password" .value=${settings$.value["openaiApiKey"] ?? ""} />
          <button>OK</button>
        </form>
      `,
      this
    );

    this.#submit$.subscribe();
  }
}

export function defineSettingsElement() {
  customElements.define("settings-element", SettingsElement);
}
