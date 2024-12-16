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
      // console.log(doc.body.outerHTML);
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
    stdout.append($new("div", { "data-role": "user" }, [`${prompt}`]));
    const execId = env.exec(prompt);

    function writeFile(props: { filename: string; mimeType: string; content: string }) {
      const file = new File([props.content], props.filename, { type: props.mimeType });
      env.addFile(file);
      return `File written: ${file.name} (${file.size} bytes)`;
    }

    async function readFile(props: { filename: string }) {
      const file = env.getFile(props.filename);
      if (!file) return `File not found: ${props.filename}`;

      const text = await file.text();
      return text;
    }

    async function listFiles() {
      const files = env.listFiles();

      if (!files.length) return "No files found";
      return files.map((file) => `${file.name} (${file.size} bytes)`).join("\n");
    }

    const aoai = await openai.getClient("aoai");
    const task = await aoai.beta.chat.completions.runTools({
      stream: true,
      tools: [
        {
          type: "function",
          function: {
            function: writeFile,
            description: "Write a text file to the environment",
            parse: JSON.parse,
            parameters: {
              type: "object",
              required: ["filename", "mimeType", "content"],
              properties: {
                filename: { type: "string" },
                mimeType: { type: "string" },
                content: { type: "string" },
              },
            },
          },
        },
        {
          type: "function",
          function: {
            function: readFile,
            description: "Read a text file from the environment",
            parse: JSON.parse,
            parameters: {
              type: "object",
              required: ["filename"],
              properties: {
                filename: { type: "string" },
              },
            },
          },
        },
        {
          type: "function",
          function: {
            function: listFiles,
            description: "List all file names in the environment",
            parse: JSON.parse,
            parameters: {
              type: "object",
              properties: {},
            },
          },
        },
      ],
      messages: [
        system`
Chat with the user. You can use writeFile, readFile, and listFiles in an environment shared with the user.
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

    // DEBUG file io
    // task.on("tool_calls.function.arguments.delta", (delta) => {
    //   console.log("delta", delta);
    // });
    // task.on("tool_calls.function.arguments.done", (done) => {
    //   console.log("final", done);
    // });

    for await (const chunk of task) {
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
