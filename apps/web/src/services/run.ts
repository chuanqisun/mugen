import type { VirtualFile } from "./file-system";

export function bundle(entryPath: string, fs: Record<string, VirtualFile>) {
  // TODO standardize internal fs paths to be absolute, with / prefix
}

function bundleHTML() {
  // extract js sources
  // - module
  // - nomodule
  // extract css links
}

function bundleJavaScript() {}

function bundleCSS() {}
