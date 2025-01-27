import { get, set } from "idb-keyval";
import { BehaviorSubject, filter, from, merge, tap } from "rxjs";
import { showDialog } from "../shell/dialog";

export const workspaceDirectory$ = new BehaviorSubject<FileSystemDirectoryHandle | null>(null);

export async function openWorkspace() {
  const results = await window.showDirectoryPicker().catch(() => null);
  workspaceDirectory$.next(results);
}

export async function openLastUsedWorkspace() {
  const handle = await (get("mugen.lastUsedWorkspace") as Promise<FileSystemDirectoryHandle | null>);
  if (!handle) return;

  const permission = await verifyPermission(handle);
  if (!permission) return;

  workspaceDirectory$.next(handle);
}

export function getLastUsedHandle() {
  return get("mugen.lastUsedWorkspace") as Promise<FileSystemDirectoryHandle | null>;
}

export function useWorkspace(options: { switcherElement: HTMLElement }) {
  const cacheLastUsed = workspaceDirectory$.pipe(
    filter(Boolean),
    tap((handle) => {
      set("mugen.lastUsedWorkspace", handle);
    })
  );

  const renderSwitcher = workspaceDirectory$.pipe(
    tap((handle) => {
      if (!handle) {
        options.switcherElement.textContent = "Workspace";
        return;
      }

      options.switcherElement.textContent = `${handle.name} (change)`;
    })
  );

  const promptForRecovery = from(get("mugen.lastUsedWorkspace")).pipe(
    filter(Boolean),
    tap((_storedHandle) => showDialog(`<storage-element></storage-element>`))
  );

  return merge(cacheLastUsed, renderSwitcher, promptForRecovery);
}

async function verifyPermission(fileHandle: FileSystemHandle) {
  if ((await fileHandle.queryPermission({ mode: "readwrite" })) === "granted") {
    return true;
  }
  if ((await fileHandle.requestPermission({ mode: "readwrite" })) === "granted") {
    return true;
  }
  return false;
}
