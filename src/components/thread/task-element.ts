import { html, render } from "lit";
import { BehaviorSubject, filter, from, map, Subject, switchMap, tap, withLatestFrom } from "rxjs";
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
        stream: true,
        model: "gpt-4o-mini",
        messages: [
          system`Respond based on user's instruction or goal. Wrap your response in <response-file path=""></response-file> tags.
path attribute must end with one of these extensions: txt, md, html, css, js, ts, jsx, tsx, json, jsonl, ndjson.

Requirement:
- Every <response-file> tag must have a path with a meaningful filename and valid extension.
- When writing code, entry function name must be \`main\`.
- Do NOT discuss your plan, unless asked by user.
- Do NOT explain your code or show examples, unless asked by user.
- If asked by user, respond with plan and explanation for code in separate <response-file path="[filename].md"> tags.
- Do NOT use external libraries or frameworks, unless asked by user.
- Respond to general chat with markdown like this
<response-file path="[filename].md">
your reponse here...
</response-file>
\`\`\`
      `,
          user`${input}`,
        ],
        temperature: 0,
      })
    ),
    switchMap((stream) => from(stream)),
    map((chunk) => chunk.choices[0].delta.content),
    filter(Boolean),
    tap((textChunk) => this.$state.next({ ...this.$state.value, output: this.$state.value.output + textChunk }))
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
