import { html, render } from "lit";
import type { FormEvent } from "react";
import { BehaviorSubject, fromEvent, tap } from "rxjs";
import "./settings-element.css";

export function defineSettingsElement() {
  customElements.define("settings-element", SettingsElement);
}

export interface Settings {
  claudeApiKey: string;
  openaiApiKey: string;
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
        <form class="rows" method="dialog" @submit=${(e: FormEvent) => this.#handleSubmit(e)}>
          <label>Claude key</label>
          <input name="claudeApiKey" type="password" .value=${this.settings$.value["claudeApiKey"] ?? ""} />
          <label>OpenAI key</label>
          <input name="openaiApiKey" type="password" .value=${this.settings$.value["openaiApiKey"] ?? ""} />
          <label>Azure Speech region</label>
          <input name="azureSpeechRegion" type="text" .value=${this.settings$.value["azureSpeechRegion"] ?? ""} />
          <label>Azure Speech key</label>
          <input name="azureSpeechKey" type="password" .value=${this.settings$.value["azureSpeechKey"] ?? ""} />
          <button>OK</button>
        </form>
      `,
      this
    );

    this.#submit$.subscribe();
  }

  #handleSubmit(event: FormEvent) {
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
