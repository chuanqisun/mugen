import { get } from "idb-keyval";

export interface WebFS {
  pwd: () => Promise<string>;
  cd: (dir: string) => Promise<void>;
  ls: () => Promise<string[]>;
}

// refactor to FS
export async function load(stdout: HTMLElement) {
  const handle = await get("cwd");
  if (!handle) return;

  const allowed = await getPermissionedHandle(handle, "readwrite");
  if (!allowed) return;

  clear(stdout);
  ls(stdout, handle);
}

export function clear(stdout: HTMLElement) {
  stdout.textContent = "";
}

export async function ls(stdout: HTMLElement, handle: FileSystemDirectoryHandle) {
  for await (const entry of handle.values()) {
    stdout.textContent += `${entry.name}\n`;
  }
}

export async function getPermissionedHandle<T extends FileSystemHandle>(fileHandle: T, mode?: FileSystemPermissionMode): Promise<T | null> {
  const options: FileSystemHandlePermissionDescriptor = mode ? { mode } : {};

  if ((await fileHandle.queryPermission(options)) === "granted") {
    return fileHandle;
  }

  if ((await fileHandle.requestPermission(options)) === "granted") {
    return fileHandle;
  }
  return null;
}
