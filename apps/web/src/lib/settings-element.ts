import "./settings-element.css";

import { html, render } from "lit";
import { BehaviorSubject, fromEvent, tap } from "rxjs";

export function defineSettingsElement() {
  customElements.define("settings-element", SettingsElement);
}

export interface Settings {
  claudeApiKey: string;
  openaiApiKey: string;
  aoaiEndpoint: string;
  aoaiApiKey: string;
  azureSpeechRegion: string;
  azureSpeechKey: string;
}

export class SettingsElement extends HTMLElement {
  settings$ = new BehaviorSubject<Settings>(this.#getInitialSettings());

  #submit$ = fromEvent(this, "submit").pipe(
    tap((event) => {
      const formData = new FormData(event.target as HTMLFormElement);
      this.dispatchEvent(new CustomEvent("settingschange", { detail: Object.fromEntries(formData) }));
    })
  );

  get settings() {
    return this.settings$.value;
  }

  connectedCallback() {
    render(
      html`
        <form class="rows" method="dialog" @submit=${(e: Event) => this.#handleSubmit(e)}>
          <label>Azure OpenAI endpoint</label>
          <input name="aoaiEndpoint" type="url" placeholder="https://project-name.openai.azure.com/" .value=${this.settings$.value["aoaiEndpoint"] ?? ""} />

          <label>Azure OpenAI key</label>
          <input name="aoaiApiKey" type="password" .value=${this.settings$.value["aoaiApiKey"] ?? ""} />

          <label>Azure Speech region</label>
          <input name="azureSpeechRegion" type="text" .value=${this.settings$.value["azureSpeechRegion"] ?? ""} />

          <label>Azure Speech key</label>
          <input name="azureSpeechKey" type="password" .value=${this.settings$.value["azureSpeechKey"] ?? ""} />

          <label>OpenAI key</label>
          <input name="openaiApiKey" type="password" .value=${this.settings$.value["openaiApiKey"] ?? ""} />

          <label>Claude key</label>
          <input name="claudeApiKey" type="password" .value=${this.settings$.value["claudeApiKey"] ?? ""} />

          <button>OK</button>
        </form>
      `,
      this
    );

    this.#submit$.subscribe();
  }

  #handleSubmit(event: Event) {
    const settings = Object.fromEntries(new FormData(event.target as HTMLFormElement)) as any as Settings;
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
