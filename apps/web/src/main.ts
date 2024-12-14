import "./style.css";

import { get, set } from "idb-keyval";
import { $ } from "./lib/dom";

const backendHost = "http://localhost:3000";
const stdout = $<HTMLElement>("#stdout")!;
const input = $("textarea")!;

// auto load cwd if exists
load();

async function load() {
  const handle = await get("cwd");
  if (!handle) return;

  clear(stdout);
  ls(stdout, handle);
}

window.addEventListener("click", async () => {
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
    }
  }
});

export function clear(stdout: HTMLElement) {
  stdout.textContent = "";
}

export async function ls(stdout: HTMLElement, handle: FileSystemDirectoryHandle) {
  for await (const entry of handle.values()) {
    console.log(entry.name);
    stdout.textContent += `${entry.name}\n`;
  }
}
