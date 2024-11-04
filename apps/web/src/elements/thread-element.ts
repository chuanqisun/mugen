import { html, render } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { tap } from "rxjs";
import { $thread, type Thread } from "../services/thread";

export class ThreadElement extends HTMLElement {
  shadowRoot = this.attachShadow({ mode: "open" });

  connectedCallback() {
    $thread.pipe(tap((thread) => this.render(thread))).subscribe();
  }

  render(thread: Thread) {
    render(
      html` <style>
          .thread {
            display: grid;
            gap: 8px;
          }
          .message {
            white-space: pre-wrap;
          }
        </style>
        <div class="thread">
          ${repeat(
            thread.items,
            (message) => message.id,
            (message) => html` <div class="message">${message.role} &gt; ${message.content}</div> `
          )}
        </div>`,
      this.shadowRoot
    );
  }
}

export function defineThreadElement(tagName = "thread-element") {
  customElements.define(tagName, ThreadElement);
}
