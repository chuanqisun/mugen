import { BehaviorSubject } from "rxjs";

export const workspaceDirectory$ = new BehaviorSubject<FileSystemDirectoryHandle | null>(null);

export async function openWorkspace() {
  const results = await window.showDirectoryPicker().catch(() => null);
  workspaceDirectory$.next(results);
}

export function useWorkspaceSwitcher(swithherElement: HTMLElement) {
  workspaceDirectory$.subscribe((directory) => {
    if (!directory) {
      swithherElement.textContent = "Open";
      return;
    }

    swithherElement.textContent = directory.name;
  });
}
