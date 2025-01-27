import { get, set } from "idb-keyval";
import { BehaviorSubject, filter, from, merge, tap } from "rxjs";
import { showDialog } from "../shell/dialog";

export const workspaceDirectory$ = new BehaviorSubject<FileSystemDirectoryHandle | null>(null);
export const lastUsedWorkspaces$ = new BehaviorSubject<WorkspaceHistoryItem[]>([]);

export interface WorkspaceHistoryItem {
  handle: FileSystemDirectoryHandle;
  lastAccessedTime: number;
}

export async function openWorkspace() {
  const handle = await window.showDirectoryPicker().catch(() => null);
  if (!handle) return;

  workspaceDirectory$.next(handle);
}

export async function openExistingWorkspace(handle: FileSystemDirectoryHandle) {
  const permission = await verifyPermission(handle);
  if (!permission) return;

  workspaceDirectory$.next(handle);
}

export function removeExistingWorkspace(handle: FileSystemDirectoryHandle) {
  const updatedItems = lastUsedWorkspaces$.value.filter((item) => item.handle.name !== handle.name);
  lastUsedWorkspaces$.next(updatedItems);
  set("mugen.lastUsedWorkspaces", updatedItems);
}

function listLastUsedItems() {
  return get("mugen.lastUsedWorkspaces").then((result) => result ?? []) as Promise<WorkspaceHistoryItem[]>;
}

export function useWorkspace(options: { switcherElement: HTMLElement }) {
  // init history
  listLastUsedItems().then((items) => lastUsedWorkspaces$.next(items));

  const renderSwitcher = workspaceDirectory$.pipe(
    tap((handle) => {
      if (!handle) {
        options.switcherElement.textContent = "Workspace";
        return;
      }

      options.switcherElement.textContent = `${handle.name} (change)`;
    })
  );

  const promptForRecovery = from(get("mugen.lastUsedWorkspaces")).pipe(
    filter((itemsOrUndefined) => itemsOrUndefined?.length),
    tap((_storedHandle) => showDialog(`<storage-element></storage-element>`))
  );

  const updateHistory$ = workspaceDirectory$.pipe(
    filter(Boolean),
    tap((handle) => {
      const history = lastUsedWorkspaces$.value;
      const newEntry: WorkspaceHistoryItem = {
        handle,
        lastAccessedTime: Date.now(),
      };
      const updatedEntries = [newEntry, ...history.filter((item) => item.handle.name !== handle.name)].sort((a, b) => b.lastAccessedTime - a.lastAccessedTime); // defensively ensure sorting order most recent first
      set("mugen.lastUsedWorkspaces", updatedEntries);

      lastUsedWorkspaces$.next(updatedEntries);
    })
  );

  return merge(renderSwitcher, promptForRecovery, updateHistory$);
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
