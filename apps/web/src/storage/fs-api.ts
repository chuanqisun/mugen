export class EmulatedFileSystem {
  cwd = "/";
  cwdHandle: FileSystemDirectoryHandle;

  constructor(private rootHandle: FileSystemDirectoryHandle) {
    this.cwdHandle = rootHandle;
  }

  async *ls(path?: string): AsyncIterable<string> {
    let targetHandle = path ? await this.getDirHandle(this.resolvePath(this.cwd, path)) : this.cwdHandle;
    if (!targetHandle) throw new Error("Target directory not found.");

    const results: string[] = []; // dir name ends with '/'
    const entries = targetHandle.entries();

    for await (const [_key, entry] of entries) {
      const name = entry.kind === "directory" ? `${entry.name}/` : entry.name;
      yield `${name}\n`;
    }

    return results;
  }

  async *cd(path: string): AsyncIterable<string> {
    const absolutePath = this.resolvePath(this.cwd, path);
    this.cwd = absolutePath;
    this.cwdHandle = await this.getDirHandle(absolutePath);
  }

  private async getDirHandle(absolutePath: string): Promise<FileSystemDirectoryHandle> {
    const parts = absolutePath.split("/").filter(Boolean);
    let handle = this.rootHandle;

    for (const part of parts) {
      handle = await handle.getDirectoryHandle(part);
    }

    return handle;
  }

  resolvePath(baseAbsolutePath: string, maybeRelativePath: string) {
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
}
