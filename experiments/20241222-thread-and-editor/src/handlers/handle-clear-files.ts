import type { FileSystem } from "../environment/file-system";
import { type ParsedActionEvent } from "../utils/dom";

export function handleClearFiles(e: ParsedActionEvent, fileStore: FileSystem) {
  if (e.action !== "clear-files") return;

  fileStore.clearFiles();
}
