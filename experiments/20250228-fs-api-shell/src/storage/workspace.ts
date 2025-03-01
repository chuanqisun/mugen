import { get, set } from "idb-keyval";
import { BehaviorSubject, concatMap, filter, from, merge, tap } from "rxjs";
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
  const init$ = from(listLastUsedItems()).pipe(
    tap((items) => lastUsedWorkspaces$.next(items)),
    concatMap(async (items) =>
      items
        .at(0)
        ?.handle.queryPermission({ mode: "readwrite" })
        .then((permissionState) => (permissionState === "granted" ? items.at(0)?.handle : null))
    ),
    concatMap((grantedHandle) => {
      if (grantedHandle) {
        // if last used item can be accessed, use it
        workspaceDirectory$.next(grantedHandle);
        return grantedHandle;
      } else {
        // else if there are items, prompt for recovery
        const promptForRecovery = from(listLastUsedItems()).pipe(
          filter((itemsOrUndefined) => itemsOrUndefined.length > 0),
          tap((_storedHandle) => showDialog(`<storage-element></storage-element>`))
        );
        return promptForRecovery;
      }
    })
  );

  const renderSwitcher$ = workspaceDirectory$.pipe(
    tap((handle) => {
      if (!handle) {
        options.switcherElement.textContent = "Workspace";
        return;
      }

      options.switcherElement.textContent = `${handle.name} (change)`;
    })
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

  return merge(renderSwitcher$, init$, updateHistory$);
}

async function verifyPermission(fileHandle: FileSystemHandle) {
  if ((await fileHandle.queryPermission({ mode: "readwrite" })) === "granted") {
    return true;
  }
  const currentState = await fileHandle.requestPermission({ mode: "readwrite" });
  if (currentState === "granted") {
    return true;
  }

  if (currentState === "prompt") {
    return new Promise((resolve) => {
      const clear = setInterval(async () => {
        const newState = await fileHandle.queryPermission({ mode: "readwrite" });
        if (newState === "granted") {
          clearInterval(clear);
          resolve(true);
        } else if (newState === "denied") {
          clearInterval(clear);
          resolve(false);
        }
      }, 100);
    });
  }

  return false;
}
