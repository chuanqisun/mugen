import { loadFileToBuffer } from "../code-editor/buffer";
import type { CodeEditorElement } from "../code-editor/code-editor-element";
import type { FileSystem } from "../environment/file-system";
import { type ParsedActionEvent } from "../utils/dom";

export function handleOpenFile(e: ParsedActionEvent, fileStore: FileSystem, codeEditor: CodeEditorElement) {
  if (e.action !== "open-file") return;

  const fileName = e.trigger?.getAttribute("data-file");
  if (!fileName) return;

  const file = fileStore.getFile(fileName);
  if (!file) return;

  loadFileToBuffer(fileName);
}
