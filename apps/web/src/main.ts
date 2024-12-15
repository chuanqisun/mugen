import "./style.css";

import { get } from "idb-keyval";
import { html, render } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { fromEvent, map, merge, tap } from "rxjs";
import { $ } from "./lib/dom";
import { ls } from "./lib/file-utils";
import { user } from "./lib/messages";
import { OpenAILLMProvider } from "./lib/openai-llm-provider";
import { defineSettingsElement } from "./lib/settings-element";
import { appendItem, thread$ } from "./lib/thread";
import { WorkspaceService } from "./lib/workspace-service";

defineSettingsElement();

const stdout = $<HTMLElement>("#stdout")!;
const thread = $<HTMLElement>("#thread")!;
const input = $("textarea")!;
const recent = $<HTMLElement>("#recent")!;
const llm = new OpenAILLMProvider();

const workspaceService = new WorkspaceService();

const renderRecent$ = workspaceService.workspaces$.pipe(
  map((workspaces) =>
    repeat(
      workspaces ?? [],
      (item) => item.id,
      (item) => html`<button data-action="load-workspace" data-workspace=${item.id}>${item.handle.name}${item.isCurrent ? "*" : ""}</button>`
    )
  ),
  tap((html) => render(html, recent))
);

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
      case "new-workspace": {
        const directoryHandle = await window.showDirectoryPicker({ mode: "readwrite" });
        workspaceService.add(directoryHandle);
        break;
      }

      case "load-workspace": {
        const workspaceId = target?.getAttribute("data-workspace");
        if (!workspaceId) return;
        const opened = await workspaceService.open(workspaceId);

        if (opened) {
          stdout.textContent = await ls(stdout, opened);
        }

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

renderRecent$.subscribe();
merge(inputSubmit$, topLevelClick$, renderThread$).subscribe();
