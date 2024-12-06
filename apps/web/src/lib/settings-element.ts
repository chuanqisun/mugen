import { html, render } from "lit";
import { BehaviorSubject, fromEvent, tap } from "rxjs";
import "./settings-element.css";

export function defineSettingsElement() {
  customElements.define("settings-element", SettingsElement);
}

export interface Settings {
  claudeApiKey: string;
  openaiApiKey: string;
}

export class SettingsElement extends HTMLElement {
  settings$ = new BehaviorSubject(this.#getInitialSettings());

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
          <input name="claudeApiKey" type="password" .value=${this.settings$.value["claudeApiKey"] ?? ""} />
          <label>OpenAI</label>
          <input name="openaiApiKey" type="password" .value=${this.settings$.value["openaiApiKey"] ?? ""} />
          <button>OK</button>
        </form>
      `,
      this
    );

    this.#submit$.subscribe();
  }

  setSettings(settings: Record<string, any>) {
    localStorage.setItem("settings", JSON.stringify(settings));
    this.settings$.next(settings);
  }

  #getInitialSettings() {
    try {
      return JSON.parse(localStorage.getItem("settings") || "{}");
    } catch {
      return {};
    }
  }
}
