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

  const allowed = await verifyPermission(handle, "readwrite");
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

async function verifyPermission(fileHandle: FileSystemHandle, mode?: FileSystemPermissionMode): Promise<boolean> {
  const options: FileSystemHandlePermissionDescriptor = mode ? { mode } : {};

  if ((await fileHandle.queryPermission(options)) === "granted") {
    return true;
  }
  // Request permission. If the user grants permission, return true.
  if ((await fileHandle.requestPermission(options)) === "granted") {
    return true;
  }
  // The user didn't grant permission, so return false.
  return false;
}
