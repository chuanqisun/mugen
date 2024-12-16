import "./settings-element.css";

import { get, set } from "idb-keyval";
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
  constructor() {
    super();
    this.#loadSettings();
  }

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
    this.settings$
      .pipe(
        tap((settings) =>
          render(
            html`
              <form class="rows" method="dialog" @submit=${(e: Event) => this.#handleSubmit(e)}>
                <label>Azure OpenAI endpoint</label>
                <input name="aoaiEndpoint" type="url" placeholder="https://project-name.openai.azure.com/" .value=${settings["aoaiEndpoint"]} />

                <label>Azure OpenAI key</label>
                <input name="aoaiApiKey" type="password" .value=${settings["aoaiApiKey"]} />

                <label>Azure Speech region</label>
                <input name="azureSpeechRegion" type="text" .value=${settings["azureSpeechRegion"]} />

                <label>Azure Speech key</label>
                <input name="azureSpeechKey" type="password" .value=${settings["azureSpeechKey"]} />

                <label>OpenAI key</label>
                <input name="openaiApiKey" type="password" .value=${settings["openaiApiKey"]} />

                <label>Claude key</label>
                <input name="claudeApiKey" type="password" .value=${settings["claudeApiKey"]} />

                <button>OK</button>
              </form>
            `,
            this
          )
        )
      )
      .subscribe();

    this.#submit$.subscribe();
  }

  #handleSubmit(event: Event) {
    const settings = Object.fromEntries(new FormData(event.target as HTMLFormElement)) as any as Settings;
    set("settings", settings);
    this.settings$.next(settings);
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
    const settings = (await get("settings")) as Settings;
    if (settings) {
      this.settings$.next(settings);
    }
  }
}
