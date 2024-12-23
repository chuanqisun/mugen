import type { FileSystem } from "../environment/file-system";
import { type ParsedActionEvent } from "../utils/dom";

export function handleUploadFiles(e: ParsedActionEvent, fileStore: FileSystem) {
  if (e.action !== "upload-files") return;

  fileStore.addFileInteractive();
}
