import type { CodeEditorElement } from "../code-editor/code-editor-element";
import type { FileStore } from "../environment/in-memory-file-store";
import { type ParsedActionEvent } from "../utils/dom";

export function handleOpenFile(e: ParsedActionEvent, fileStore: FileStore, codeEditor: CodeEditorElement) {
  if (e.action !== "open-file") return;

  const fileName = e.trigger?.getAttribute("data-file");
  if (!fileName) return;

  const file = fileStore.getFile(fileName);
  if (!file) return;

  codeEditor.loadFile(file);
}
