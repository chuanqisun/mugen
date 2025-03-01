export class Environment {
  cwd = "/";
  root: FileSystemDirectoryHandle;

  constructor(options: { root: FileSystemDirectoryHandle }) {
    this.root = options.root;
  }
}

export async function* ls(handle: FileSystemDirectoryHandle): AsyncIterable<string> {
  const entries = handle.entries();
  for await (const [_key, entry] of entries) {
    const name = entry.kind === "directory" ? `${entry.name}/` : entry.name;
    yield `${name}\n`;
  }
}

export async function getDirHandle(rootHandle: FileSystemDirectoryHandle, absolutePath: string): Promise<FileSystemDirectoryHandle> {
  const parts = absolutePath.split("/").filter(Boolean);
  let handle = rootHandle;

  for (const part of parts) {
    handle = await handle.getDirectoryHandle(part);
  }

  return handle;
}

export async function getFileHandle(rootHandle: FileSystemDirectoryHandle, absolutePath: string): Promise<FileSystemFileHandle> {
  if (absolutePath.endsWith("/")) throw new Error("Invalid file path.");

  const parts = absolutePath.split("/").filter(Boolean);
  const fileName = parts.pop();
  if (!fileName) {
    throw new Error("Invalid file path.");
  }

  const dirHandle = await getDirHandle(rootHandle, parts.join("/"));
  return dirHandle.getFileHandle(fileName);
}

export function resolve(baseAbsolutePath: string, ...segments: string[]): string {
  const nonEmptySegments = segments.filter(Boolean);
  if (!nonEmptySegments.length) return baseAbsolutePath;

  const [first, ...rest] = nonEmptySegments;
  const head = resolvePathInternal(baseAbsolutePath, first);
  return resolve(head, ...rest);
}

function resolvePathInternal(baseAbsolutePath: string, maybeRelativePath: string): string {
  if (!baseAbsolutePath.startsWith("/")) {
    throw new Error("Base path must be an absolute path.");
  }

  const isRelative = !maybeRelativePath.startsWith("/");
  if (!isRelative) {
    return maybeRelativePath;
  }

  // Split the paths into components
  const baseComponents = baseAbsolutePath.split("/").filter((component) => component !== "");
  const relativeComponents = maybeRelativePath.split("/").filter((component) => component !== "");

  // Process the relative path components
  for (const component of relativeComponents) {
    if (component === ".") {
      // Current directory, do nothing
      continue;
    } else if (component === "..") {
      // Parent directory, remove the last component from baseComponents
      if (baseComponents.length === 0) {
        throw new Error("Path goes above the root directory.");
      }
      baseComponents.pop();
    } else {
      // Normal directory or file, add to baseComponents
      baseComponents.push(component);
    }
  }

  // Construct the resolved path
  return "/" + baseComponents.join("/");
}
