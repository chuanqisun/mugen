import "./style.css";

import { Parser } from "htmlparser2";
import { html, render } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { distinctUntilKeyChanged, filter, fromEvent, map, switchMap, tap } from "rxjs";
import { $activeFilePath } from "./code-editor/buffer";
import { CodeEditorElement, defineCodeEditorElement } from "./code-editor/code-editor-element";
import { FileSystem } from "./environment/file-system";
import { Journal } from "./environment/journal";
import { handleClearFiles } from "./handlers/handle-clear-files";
import { handleOpenFile } from "./handlers/handle-open-file";
import { handleOpenMenu } from "./handlers/handle-open-menu";
import { handleSwitchTab } from "./handlers/handle-switch-tab";
import { handleUploadFiles } from "./handlers/handle-upload-files";
import { system } from "./llm/messages";
import { OpenAILLMProvider } from "./llm/openai-llm-provider";
import { defineSettingsElement } from "./settings/settings-element";
import { $, parseActionEvent } from "./utils/dom";

defineSettingsElement();
defineCodeEditorElement();

const input = $<HTMLTextAreaElement>("#input")!;
const thread = $<HTMLElement>("#thread")!;
const files = $<HTMLElement>("#files")!;
const codeEditor = $<CodeEditorElement>("code-editor-element")!;
const filename = $<HTMLElement>("#filename")!;

const openai = new OpenAILLMProvider();
const fileSystem = new FileSystem();
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

const renderFiles$ = fileSystem.getFiles$().pipe(
  tap((files) => console.log("files changed", files)),
  map((files) => Object.entries(files)),
  map((files) =>
    repeat(
      files,
      ([path]) => path,
      ([path, vFile]) => html` <button data-action="open-file" data-file="${path}">${path} (${vFile.file.size} bytes)</button> `
    )
  ),
  tap((temp) => render(temp, files))
);

const openActiveFile$ = $activeFilePath.pipe(
  filter((path) => path !== null),
  switchMap((path) => {
    const distinctStreams = fileSystem.getFiles$().pipe(
      map((fs) => fs[path]),
      distinctUntilKeyChanged("update$"),
      switchMap((vFile) =>
        vFile.update$
          ? vFile.update$.pipe(
              tap((update) => {
                if (update.snapshot === update.delta) {
                  codeEditor.loadText(vFile.file.name, update.snapshot);
                } else {
                  codeEditor.appendText(update.delta);
                }
              })
            )
          : codeEditor.loadFile(vFile.file)
      )
    );

    return distinctStreams;
  })
);

const renderFilename$ = $activeFilePath.pipe(
  tap((path) => {
    filename.textContent = path;
  })
);

input.addEventListener("keydown", async (e) => {
  if (e.key === "Enter") {
    e.preventDefault();

    const prompt = input.value.trim();
    if (!prompt) return;

    input.value = "";
    const userMessageId = journal.createUserMessage(prompt);

    async function readFile(props: { filename: string }) {
      const file = fileSystem.getFile(props.filename);
      if (!file) return `File not found: ${props.filename}`;

      const text = await file.text();
      return text;
    }

    const fileList = Object.entries(fileSystem.listFiles())
      .map(([path, vFile]) => `${path} (${vFile.file.size} bytes)`)
      .join("\n");

    const aoai = await openai.getClient("aoai");
    const task = await aoai.beta.chat.completions.runTools({
      stream: true,
      tools: [
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
      ],
      messages: [
        system`
Chat with the user.

If deemed necessary by the task, you may read user uploaded file with the readFile tool.
 
Respond in custom xml. Any text in your response MUST be wrapped in one of these tags. Text outside of these tags will be removed.

<speak>short utterance</speak> to provide simple response. Long response should use <write-file> instead.
<think>your private thoughts</think> to reason before performaning any complex task.
<write-file path="filename.ext" mime-type="mime/type">standalone content</write-file> to respond with rich text or formated code. You can use <speak> to provide additional context for the standalone content.

In <write-file>, only these mime-types are supported: text/plain, text/html, text/css, text/javascript, text/markdown, text/yaml, text/json, text/csv
        `,
        ...journal.getHistoryMessages().map((item, i, arr) =>
          i === arr.length - 1
            ? {
                ...item,
                content: `
${
  fileList
    ? `<speak>I have the following files</speak>
<file-list>
${fileList}
</file-list>}\n`
    : ""
}${item.content}
          `,
              }
            : item
        ),
      ],
      model: "gpt-4o",
    });

    const assistantMessageId = journal.createAssistantMessage(userMessageId);

    let currentObjectPath: string | null = null;
    let shouldTrimStart = true; // trim whitespace immediately before tag inner html starts. This allows artifact to have a clean looking start

    const parser = new Parser({
      onopentag(name, attributes, isImplied) {
        if (isImplied) return;

        const attributesString = Object.entries(attributes)
          .map(([key, value]) => `${key}="${value}"`)
          .join(" ");

        const tagString = `<${name}${attributesString.length ? ` ${attributesString}` : ""}>`;

        if (currentObjectPath) {
          fileSystem.appendFile(currentObjectPath, tagString);
        } else {
          /* treat other tags as plaintext */
          journal.appendMessageContent(assistantMessageId, tagString);
        }

        if (name === "write-file") {
          currentObjectPath = attributes.path ?? "new-file.txt";
          fileSystem.writeFile(currentObjectPath, "");
          shouldTrimStart = true;
        }
      },
      ontext(text) {
        if (currentObjectPath) {
          if (shouldTrimStart) {
            text = text.trimStart();
            shouldTrimStart = !text; // if text is empty, keep trimming
          }
          fileSystem.appendFile(currentObjectPath, text);
        } else {
          journal.appendMessageContent(assistantMessageId, text);
        }
      },
      onclosetag(name, isImplied) {
        if (isImplied) return;

        const tagString = `</${name}>`;
        journal.appendMessageContent(assistantMessageId, tagString);

        if (!currentObjectPath) return;

        if (name === "write-file") {
          fileSystem.closeFile(currentObjectPath);
          currentObjectPath = null;
          shouldTrimStart = true;
        } else {
          fileSystem.appendFile(currentObjectPath, tagString);
        }
      },
    });

    for await (const chunk of task) {
      parser.write(chunk.choices[0]?.delta?.content ?? "");
    }
    parser.end();

    journal.setMessageIsFinal(assistantMessageId);
  }
});

const windowClick$ = fromEvent(window, "click").pipe(
  map(parseActionEvent),
  tap((e) => {
    handleOpenMenu(e);
    handleSwitchTab(e);
    handleUploadFiles(e, fileSystem);
    handleClearFiles(e, fileSystem);
    handleOpenFile(e, fileSystem, codeEditor);
  })
);

windowClick$.subscribe();
renderThread$.subscribe();
renderFiles$.subscribe();
openActiveFile$.subscribe();
renderFilename$.subscribe();
