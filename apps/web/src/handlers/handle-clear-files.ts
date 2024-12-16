import type { FileStore } from "../environment/in-memory-file-store";
import { type ParsedActionEvent } from "../utils/dom";

export function handleClearFiles(e: ParsedActionEvent, fileStore: FileStore) {
  if (e.action !== "clear-files") return;

  fileStore.clearFiles();
}
