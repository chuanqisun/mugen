import "./style.css";

import { html, render } from "lit";
import { debounceTime, fromEvent, map, tap } from "rxjs";
import { handleOpenMenu } from "./handlers/handle-open-menu";
import { $, $all, $new, getDetail, parseActionEvent } from "./lib/dom";
import { Environment, type ObjectsChangeEventDetail, type ThreadChangeEventDetail } from "./lib/environment";
import { system } from "./lib/messages";
import { OpenAILLMProvider } from "./lib/openai-llm-provider";
import { defineSettingsElement } from "./lib/settings-element";

defineSettingsElement();

const input = $<HTMLTextAreaElement>("#input")!;
const stdout = $<HTMLElement>("#stdout")!;
const openai = new OpenAILLMProvider();
const env = new Environment();

let taskId = 0;

fromEvent(env, "threadchange")
  .pipe(
    debounceTime(1000),
    map(getDetail<ThreadChangeEventDetail>),
    tap((doc) => {
      console.log(doc.body.outerHTML);
    })
  )
  .subscribe();

fromEvent(env, "objectschange")
  .pipe(
    map(getDetail<ObjectsChangeEventDetail>),
    map(
      (objects) => html`
        <ul>
          ${Object.entries(objects).map(([name, file]) => html` <li>${name} (${file.size} bytes)</li> `)}
        </ul>
      `
    ),
    tap((temp) => render(temp, $<HTMLElement>("#objects")!))
  )
  .subscribe();

input.addEventListener("keydown", async (e) => {
  if (e.key === "Enter") {
    e.preventDefault();

    const prompt = input.value.trim();
    if (!prompt) return;

    input.value = "";
    const id = ++taskId;
    stdout.append($new("div", { "data-role": "user" }, [`<speak>${prompt}</speak>`]));
    const execId = env.exec(prompt);

    function readFile(props: { filename: string }) {
      return `Hello world!`;
    }

    const aoai = await openai.getClient("aoai");
    const response = await aoai.beta.chat.completions.runTools({
      stream: true,
      tools: [
        {
          type: "function",
          function: {
            function: readFile,
            description: "Read a file uploaded by the user",
            parse: JSON.parse,
            parameters: {
              type: "object",
              properties: {
                filename: { type: "string" },
              },
            },
          },
        },
      ],
      messages: [
        system`
Respond in a custom xml language. You can only use the following tags:

<speak>Your verbal response. Use this for short simple response.</speak>
<show mime-type="..." name="...>Standalone text response. You can show formatted source code or rich text</show>
<think>Your private thoughts. Think before you speak, show, or script when the task is complex.</think>

When you use <show>, only these mime-types are supported: text/plain, text/markdown, text/html, application/javascript, application/json. Pick the most suitable type for the task.
When you use <script>, you have access to modern JavaScript APIs.
        `,
        // TODO collect history from thread, not stdout
        ...[...$all("[data-role]")].map((div) => ({
          role: div.getAttribute("data-role") as "assistant" | "user",
          content: div.textContent ?? "",
        })),
      ],
      model: "gpt-4o",
    });

    const assitantElement = $new("div", { "data-role": "assistant", "data-id": id.toString() });
    stdout.append(assitantElement);

    for await (const chunk of response) {
      assitantElement.append(chunk.choices[0]?.delta?.content ?? "");
      env.appendAssistantResponse(execId, chunk.choices[0]?.delta?.content ?? "");
    }
  }
});

const windowClick$ = fromEvent(window, "click").pipe(
  map(parseActionEvent),
  tap((e) => {
    handleOpenMenu(e);

    if (e.action === "upload") {
      env.upload();
    }

    if (e.action === "clear-objects") {
      env.clearObjects();
    }
  })
);

windowClick$.subscribe();
