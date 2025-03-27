import type { CodeEditorElement } from "../code-editor/code-editor-element";
import "./artifact-editor.css";

const codeEditor = document.querySelector("code-editor-element") as CodeEditorElement;
const dialog = document.querySelector<HTMLDialogElement>("#artifact-editor")!;

export interface OpenArtifactOptions {
  code: string;
  lang: string;
}
export function openArtifact(options: OpenArtifactOptions) {
  codeEditor.value = options.code;
  codeEditor.updateLanguage(options.lang);
  dialog.showModal();
}
