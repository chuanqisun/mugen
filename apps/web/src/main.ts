import "./style.css";

import { get, set } from "idb-keyval";
import { fromEvent, merge, tap } from "rxjs";
import { $ } from "./lib/dom";
import { user } from "./lib/messages";
import { OpenAILLMProvider } from "./lib/openai-llm-provider";
import { defineSettingsElement } from "./lib/settings-element";

defineSettingsElement();

const stdout = $<HTMLElement>("#stdout")!;
const input = $("textarea")!;
const llm = new OpenAILLMProvider();

// auto load cwd if exists
load();

const inputSubmit$ = fromEvent(input, "keydown").pipe(
  tap(async (event) => {
    if ((event as KeyboardEvent).key !== "Enter") return;

    const prompt = input.value;
    if (!prompt) return;

    event.preventDefault();

    input.value = "";

    const aoai = llm.getClient();
    const task = await aoai.chat.completions.create({
      stream: true,
      messages: [user`${prompt}`],
      model: "gpt-4o",
    });

    for await (const chunk of task) {
      stdout.textContent += chunk.choices[0]?.delta?.content || "";
    }
  })
);

const topLevelClick$ = fromEvent(window, "click").pipe(
  tap(async (event) => {
    const target = (event?.target as HTMLElement)?.closest("[data-action]");
    const action = target?.getAttribute("data-action");
    if (!action) return;
    switch (action) {
      case "open": {
        const cwd = await get("cwd");
        const directoryHandle = await window.showDirectoryPicker({
          startIn: cwd,
          mode: "readwrite",
        });

        // save in indexedDB
        set("cwd", directoryHandle);

        clear(stdout);
        ls(stdout, directoryHandle);
        break;
      }

      case "menu": {
        const menu = $<HTMLDialogElement>("dialog")!;
        menu.showModal();
        break;
      }
    }
  })
);

merge(inputSubmit$, topLevelClick$).subscribe();

// refactor to FS
async function load() {
  const handle = await get("cwd");
  if (!handle) return;

  clear(stdout);
  ls(stdout, handle);
}

function clear(stdout: HTMLElement) {
  stdout.textContent = "";
}

async function ls(stdout: HTMLElement, handle: FileSystemDirectoryHandle) {
  for await (const entry of handle.values()) {
    stdout.textContent += `${entry.name}\n`;
  }
}
