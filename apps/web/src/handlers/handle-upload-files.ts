import type { FileStore } from "../environment/in-memory-file-store";
import { type ParsedActionEvent } from "../utils/dom";

export function handleUploadFiles(e: ParsedActionEvent, fileStore: FileStore) {
  if (e.action !== "upload-files") return;

  fileStore.addFileInteractive();
}
