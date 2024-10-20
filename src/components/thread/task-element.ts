import { html, render } from "lit";
import { BehaviorSubject, Subject, switchMap, tap, withLatestFrom } from "rxjs";
import { reflectAttributes } from "../../lib/attributes";
import { system, user } from "../../lib/message";
import { $openai } from "../chat-provider/openai";

import "./task-element.css";

export class TaskElement extends HTMLElement {
  private $state = new BehaviorSubject({ input: this.getAttribute("input") ?? "", output: "" });
  private $reflectAttributes = reflectAttributes(this, this.$state);

  private $runInput = new Subject<string>();

  private $taskRuns = this.$runInput.pipe(
    withLatestFrom($openai),
    switchMap(([input, openai]) =>
      openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          system`Respond with markdown code blocks based on user's instruction or goal.
Supported languages are text, markdown, html, css, typescript, tsx, json, jsonl, ndjson.

Requirement:
- Choose the best language for the task. Do NOT repeat response in multiple languages unless asked by user.
- Each code block must have path, like this \`\`\`html path=index.html
- When writing code, entry function name must be \`main\`.
- Do NOT explain your code or show examples, unless asked by user.
- Do NOT use external libraries or frameworks, unless asked by user.
- Code should be self-explanatory. Do NOT discuss code outside the code blocks.
      `,
          user`${input}`,
        ],
        temperature: 0,
      })
    ),
    tap((res) => this.$state.next({ ...this.$state.value, output: res.choices[0].message.content ?? "" })),
    tap(console.log)
  );

  private $render = this.$state.pipe(
    tap((state) =>
      render(
        html`
          <div>
            <br />
            <pre><code>&gt; ${state.input}</code></pre>
            <pre><code>${state.output}</code></pre>
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
