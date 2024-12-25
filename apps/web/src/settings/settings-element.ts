import { BehaviorSubject, fromEvent, tap } from "rxjs";

import "./settings-element.css";

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
  constructor() {
    super();
    this.#loadSettings();
    this.innerHTML = `
      <form class="rows" method="dialog">
        <label>Azure OpenAI endpoint</label>
        <input name="aoaiEndpoint" type="url" placeholder="https://project-name.openai.azure.com/" />

        <label>Azure OpenAI key</label>
        <input name="aoaiApiKey" type="password" />

        <label>Azure Speech region</label>
        <input name="azureSpeechRegion" type="text" />

        <label>Azure Speech key</label>
        <input name="azureSpeechKey" type="password" />

        <label>OpenAI key</label>
        <input name="openaiApiKey" type="password" />

        <label>Claude key</label>
        <input name="claudeApiKey" type="password" />

        <button>OK</button>
      </form>
    `;
  }

  settings$ = new BehaviorSubject<Settings>(this.#getInitialSettings());

  #submit$ = fromEvent(this, "submit").pipe(
    tap((event) => {
      const settings = Object.fromEntries(new FormData(event.target as HTMLFormElement)) as any as Settings;
      localStorage.setItem("settings", JSON.stringify(settings));
      this.settings$.next(settings);
    })
  );

  reflectSettings$ = this.settings$.pipe(
    tap((settings) => {
      for (const [key, value] of Object.entries(settings)) {
        const input = this.querySelector<HTMLInputElement>(`input[name="${key}"]`);
        if (input) {
          input.value = value;
        }
      }
    })
  );

  get settings() {
    return this.settings$.value;
  }

  connectedCallback() {
    this.reflectSettings$.subscribe();
    this.#submit$.subscribe();
  }

  #getInitialSettings() {
    return {
      aoaiEndpoint: "",
      aoaiApiKey: "",
      azureSpeechRegion: "",
      azureSpeechKey: "",
      openaiApiKey: "",
      claudeApiKey: "",
    };
  }

  async #loadSettings() {
    const settingsRaw = localStorage.getItem("settings");
    if (settingsRaw) {
      try {
        const parsed = JSON.parse(settingsRaw);
        this.settings$.next(parsed);
      } catch (e) {}
    }
  }
}
