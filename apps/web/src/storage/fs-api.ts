export class EmulatedFileSystem {
  cwd = "/";
  cwdHandle: FileSystemDirectoryHandle;

  constructor(private rootHandle: FileSystemDirectoryHandle) {
    this.cwdHandle = rootHandle;
  }

  async *ls(): AsyncIterable<string> {
    if (!this.cwdHandle) throw new Error("No current directory");

    const results: string[] = []; // dir name ends with '/'
    const entries = this.cwdHandle.entries();

    for await (const [_key, entry] of entries) {
      const name = entry.kind === "directory" ? `${entry.name}/` : entry.name;

      yield `${name}\n`;
    }

    return results;
  }

  async *cd(path: string): AsyncIterable<string> {
    let handle = this.rootHandle;

    const isRelative = !path.startsWith("/");
    const absolutePath = isRelative ? this.resolvePath(this.cwd, path) : path;

    const parts = absolutePath.split("/").filter(Boolean);

    for (const part of parts) {
      handle = await handle.getDirectoryHandle(part);
      if (!handle) throw new Error(`No such directory: ${part}`);
    }

    this.cwd = absolutePath;
    this.cwdHandle = handle;
  }

  resolvePath(baseAbsolutePath: string, relativePath: string) {
    if (!baseAbsolutePath.startsWith("/")) {
      throw new Error("Base path must be an absolute path.");
    }

    // Split the paths into components
    const baseComponents = baseAbsolutePath.split("/").filter((component) => component !== "");
    const relativeComponents = relativePath.split("/").filter((component) => component !== "");

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
}
