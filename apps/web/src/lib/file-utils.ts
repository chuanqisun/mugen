export function clear(stdout: HTMLElement) {
  stdout.textContent = "";
}

export async function ls(stdout: HTMLElement, handle: FileSystemDirectoryHandle) {
  const fileNameList = [];
  for await (const entry of handle.values()) {
    fileNameList.push(entry);
  }

  return fileNameList.map((item) => `${item.kind === "file" ? "[f]" : "[d]"} ${item.name}`).join("\n");
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
