import "./style.css";

import { get, set } from "idb-keyval";
import { html, render } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { fromEvent, map, merge, tap } from "rxjs";
import { $ } from "./lib/dom";
import { user } from "./lib/messages";
import { OpenAILLMProvider } from "./lib/openai-llm-provider";
import { defineSettingsElement } from "./lib/settings-element";
import { appendItem, thread$ } from "./lib/thread";
import { clear, load, ls } from "./lib/web-fs";

defineSettingsElement();

const stdout = $<HTMLElement>("#stdout")!;
const thread = $<HTMLElement>("#thread")!;
const input = $("textarea")!;
const llm = new OpenAILLMProvider();

const inputSubmit$ = fromEvent(input, "keydown").pipe(
  tap(async (event) => {
    if ((event as KeyboardEvent).key !== "Enter") return;

    const prompt = input.value;
    if (!prompt) return;

    event.preventDefault();

    input.value = "";

    // open thread.json file
    const cwd = (await get("cwd")) as FileSystemDirectoryHandle;
    if (!cwd) return;

    const fileHandle = await cwd.getFileHandle("thread.json", {
      create: true,
    });

    const aoai = llm.getClient();
    const task = await aoai.chat.completions.create({
      stream: true,
      messages: [user`${prompt}`],
      model: "gpt-4o",
    });

    appendItem(user`${prompt}`);

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
      case "restore": {
        load(stdout);
        break;
      }
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

const renderThread$ = thread$.pipe(
  map((thread) =>
    repeat(
      thread,
      (item) => item.id,
      (item) => html`<div>${item.role}: ${item.content}</div>`
    )
  ),
  tap((html) => render(html, thread))
);

merge(inputSubmit$, topLevelClick$, renderThread$).subscribe();
