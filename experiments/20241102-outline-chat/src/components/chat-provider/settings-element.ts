import { html, render } from "lit";
import { fromEvent, map, tap } from "rxjs";
import { toTargetValueString } from "../../lib/event";
import { $apiKey, setApiKey } from "./auth";

export class SettingsElement extends HTMLElement {
  connectedCallback() {
    render(
      html`
        <div class="rows">
          <label>API Key</label>
          <input name="api-key" type="password" />
          <form method="dialog">
            <button>OK</button>
          </form>
        </div>
      `,
      this
    );

    // static elements
    const apiKeyInput = this.querySelector(`[name="api-key"]`) as HTMLInputElement;
    // initialize api key input
    apiKeyInput.value = $apiKey.value;
    fromEvent<KeyboardEvent>(apiKeyInput, "input").pipe(map(toTargetValueString), tap(setApiKey)).subscribe();
  }
}

export function defineSettingsElement() {
  customElements.define("settings-element", SettingsElement);
}
