export interface WebFS {
  pwd: () => Promise<string>;
  cd: (dir: string) => Promise<void>;
  ls: () => Promise<string[]>;
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
