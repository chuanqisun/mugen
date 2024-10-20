import { html, render } from "lit";
import { BehaviorSubject, endWith, filter, from, fromEvent, map, Subject, switchMap, tap, withLatestFrom } from "rxjs";
import { reflectAttributes } from "../../lib/attributes";
import { system, user } from "../../lib/message";
import { $openai } from "../chat-provider/openai";

import { unsafeHTML } from "lit/directives/unsafe-html.js";
import { writeFile } from "../file-system/file-system";
import "./task-element.css";

export class TaskElement extends HTMLElement {
  private $state = new BehaviorSubject({ input: this.getAttribute("input") ?? "", outputRaw: "", outputHtml: "" });
  private $reflectAttributes = reflectAttributes(this, this.$state);
  private $runInput = new Subject<string>();
  private $openFile = fromEvent<MouseEvent>(this, "click").pipe(
    filter((event) => (event.target as HTMLElement).dataset.action === "open-file"),
    map((event) => (event.target as HTMLElement).dataset.path),
    tap((path) => this.dispatchEvent(new CustomEvent("open-file", { detail: path, bubbles: true })))
  );

  private $taskRuns = this.$runInput.pipe(
    withLatestFrom($openai),
    switchMap(([input, openai]) =>
      openai.chat.completions.create({
        stream: true,
        model: "gpt-4o-mini",
        messages: [
          system`Respond based on user's instruction or goal. Wrap your response in <response-file path=""></response-file> tags.

Requirement:
- Every <response-file> tag must have a path with a meaningful filename and file extension.
- Use valid file extensions. For example: txt, md, html, yaml, css, js, ts, jsx, tsx, json, jsonl, ndjson.
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
    switchMap((stream) =>
      from(stream).pipe(
        map((chunk) => chunk.choices[0].delta.content),
        endWith("\0")
      )
    ),
    filter(Boolean),
    tap((textChunk) => {
      if (textChunk !== "\0") {
        this.$state.next({ ...this.$state.value, outputRaw: this.$state.value.outputRaw + textChunk });
      } else {
        // wrap into artifact
        // TODO: symbolize as soon as we encounter the html open tag
        const extractedFiles: Record<string, string> = {};
        const responseFileElementPattern = /<response-file path="(.+?)">([\s\S]*?)<\/response-file>/g;

        // replace all with <button>[filename]</button>
        const output = this.$state.value.outputRaw.replace(responseFileElementPattern, (_, path: string, content: string) => {
          // TODO prettier process the source code
          const formmatedSourceCode = content.trim();
          extractedFiles[path] = formmatedSourceCode;
          return `<button data-action="open-file" data-path="${path}">${path}</button>`;
        });

        this.$state.next({ ...this.$state.value, outputHtml: output });

        Object.entries(extractedFiles).forEach(([path, content]) => {
          writeFile(path, content);
        });
      }
    })
  );

  private $render = this.$state.pipe(
    tap((state) =>
      render(
        html`
          <div>
            <br />
            <pre><code>&gt; ${state.input}</code></pre>
            ${state.outputHtml ? html`<div>${unsafeHTML(state.outputHtml)}</div>` : html`<pre><code>${state.outputRaw}</code></pre>`}
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
    this.$openFile.subscribe();
  }

  run() {
    console.log("run", this.$state.value);
    this.$runInput.next(this.$state.value.input);
  }
}

export function defineTaskElement() {
  customElements.define("task-element", TaskElement);
}
