import "./style.css";

import { html, render } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { fromEvent, map, tap } from "rxjs";
import { defineCodeEditorElement } from "./code-editor/code-editor-element";
import { InMemoryFileStore, type ObjectsChangeEventDetail } from "./environment/in-memory-file-store";
import { Journal } from "./environment/journal";
import { handleOpenMenu } from "./handlers/handle-open-menu";
import { system } from "./llm/messages";
import { OpenAILLMProvider } from "./llm/openai-llm-provider";
import { defineSettingsElement } from "./settings/settings-element";
import { $, getDetail, parseActionEvent } from "./utils/dom";

defineSettingsElement();
defineCodeEditorElement();

const input = $<HTMLTextAreaElement>("#input")!;
const thread = $<HTMLElement>("#thread")!;
const openai = new OpenAILLMProvider();
const fileStore = new InMemoryFileStore();
const journal = new Journal();

const renderThread$ = journal.getEntries$().pipe(
  map((items) =>
    repeat(
      items,
      (item) => item.id,
      (item) => html` <div>${item.role === "user" ? ">" : ""} ${item.content}</div> `
    )
  ),
  tap((temp) => render(temp, thread))
);

fromEvent(fileStore, "objectschange")
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
    const userMessageId = journal.createUserMessage(prompt);

    function writeFile(props: { filename: string; mimeType: string; content: string }) {
      const file = new File([props.content], props.filename, { type: props.mimeType });
      fileStore.addFile(file);
      return `File written: ${file.name} (${file.size} bytes)`;
    }

    async function readFile(props: { filename: string }) {
      const file = fileStore.getFile(props.filename);
      if (!file) return `File not found: ${props.filename}`;

      const text = await file.text();
      return text;
    }

    async function listFiles() {
      const files = fileStore.listFiles();

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
        ...journal.getHistoryMessages(),
      ],
      model: "gpt-4o",
    });

    // DEBUG file io
    // task.on("tool_calls.function.arguments.delta", (delta) => {
    //   console.log("delta", delta);
    // });
    // task.on("tool_calls.function.arguments.done", (done) => {
    //   console.log("final", done);
    // });

    const assistantMessageId = journal.createAssistantMessage(userMessageId);

    for await (const chunk of task) {
      journal.appendMessageContent(assistantMessageId, chunk.choices[0]?.delta?.content ?? "");
    }

    journal.setMessageIsFinal(assistantMessageId);
  }
});

const windowClick$ = fromEvent(window, "click").pipe(
  map(parseActionEvent),
  tap((e) => {
    handleOpenMenu(e);

    if (e.action === "upload") {
      fileStore.addFileInteractive();
    }

    if (e.action === "clear-objects") {
      fileStore.clearFiles();
    }
  })
);

windowClick$.subscribe();
renderThread$.subscribe();
