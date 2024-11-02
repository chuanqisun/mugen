import { html, render } from "lit";
import { BehaviorSubject, filter, fromEvent, map, share, tap } from "rxjs";
import { consumeStringValue } from "../../lib/consume-string-value";
import { isEnterKeydown, preventDefault } from "../../lib/event";
import { $submission } from "./submission";

import "./chat-input-element.css";

export class ChatInputElement extends HTMLElement {
  private submissionId = 0;
  private $state = new BehaviorSubject({});
  private $render = this.$state.pipe(
    tap(() =>
      render(
        html`<textarea id="chat-input" style="resize: vertical;" placeholder=${`Goal, instruction, or \"/help\". Enter to submit`} autofocus></textarea>`,
        this
      )
    )
  );

  connectedCallback() {
    this.$render.subscribe();
    const chatInputElement = this.querySelector("#chat-input") as HTMLTextAreaElement;
    fromEvent<KeyboardEvent>(chatInputElement, "keydown")
      .pipe(
        filter(isEnterKeydown),
        tap(preventDefault),
        map((e) => e.target as HTMLTextAreaElement),
        map(consumeStringValue),
        map((input) => ({ id: ++this.submissionId, prompt: input })),
        share()
      )
      .subscribe($submission);
  }

  focus() {
    (this.querySelector("#chat-input") as HTMLTextAreaElement).focus();
  }
}

export function defineChatInputElement() {
  customElements.define("chat-input-element", ChatInputElement);
}
