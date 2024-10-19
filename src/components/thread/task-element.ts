import { html, render } from "lit";
import { BehaviorSubject, combineLatestWith, map, Subject, switchMap, tap, withLatestFrom } from "rxjs";
import { reflectAttributes } from "../../lib/attributes";
import { user } from "../../lib/message";
import { $openai } from "../chat-provider/openai";

export class TaskElement extends HTMLElement {
  private $state = new BehaviorSubject({ input: this.getAttribute("input") ?? "" });
  private $reflectAttributes = reflectAttributes(this, this.$state);

  private $runInput = new Subject<string>();

  private $taskRuns = this.$runInput.pipe(
    withLatestFrom($openai),
    switchMap(([input, openai]) => openai.chat.completions.create({ model: "gpt-4o-mini", messages: [user`${input}`], temperature: 0 })),
    map((res) => res.choices[0].message.content),
    tap(console.log)
  );

  private $render = this.$state.pipe(
    combineLatestWith(this.$state),
    tap(([_state, attr]) =>
      render(
        html`
          <div>
            <br />
            <div>Input: ${attr.input}</div>
            <div>Output</div>
            <br />
            <hr />
          </div>
        `,
        this
      )
    )
  );

  connectedCallback() {
    this.$render.subscribe();
    this.$reflectAttributes.subscribe();
    this.$taskRuns.subscribe();
  }

  run() {
    console.log("run", this.$state.value);
    this.$runInput.next(this.$state.value.input);
  }
}

export function defineTaskElement() {
  customElements.define("task-element", TaskElement);
}
