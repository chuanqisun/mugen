import { map, startWith } from "rxjs";
import { TextProvider } from "../artifact-providers/generic";
import { HtmlProvider } from "../artifact-providers/html";
import { JavaScriptProvider } from "../artifact-providers/javascript";
import type { CodeEditorElement } from "../code-editor/code-editor-element";
import { handleAction } from "../handle-data-action";
import "./artifact-editor.css";

const codeEditor = document.querySelector("code-editor-element") as CodeEditorElement;
const dialog = document.querySelector<HTMLDialogElement>("#artifact-editor")!;
const iframe = document.querySelector<HTMLIFrameElement>("#artifact-iframe")!;
const artifactMenu = document.querySelector<HTMLElement>("#artifact-menu")!;

export interface ArtifactProvider {
  run(options: RunOptions): any;
}

export interface RunOptions {
  code: string;
  renderHtml: (html: string) => void;
}

const providers = [JavaScriptProvider, HtmlProvider];

export interface StartArtifactOptions {
  code: string;
  lang: string;
}
export async function startArtifact(options: StartArtifactOptions) {
  codeEditor.value = options.code;
  codeEditor.updateLanguage(options.lang);
  dialog.showModal();

  const editResult = Promise.withResolvers<string>();

  const abortController = new AbortController();

  // based on language, load the artifact provider
  const provider: ArtifactProvider = new (providers.find((p) => p.languages.includes(options.lang)) ?? TextProvider)();

  const renderHtml = (html: string) => {
    iframe.srcdoc = html;
  };

  const actionMenu$ = handleAction(artifactMenu)
    .pipe(
      map((action) => action.name),
      startWith("run"),
    )
    .subscribe((actionName) => {
      switch (actionName) {
        case "run": {
          provider.run({ code: codeEditor.value, renderHtml });
          break;
        }
      }
    });

  codeEditor.addEventListener("change", () => provider.run({ code: codeEditor.value, renderHtml }), {
    signal: abortController.signal,
  });

  // on close remove listeners
  dialog.addEventListener(
    "close",
    () => {
      editResult.resolve(codeEditor.value);
      abortController.abort();
      actionMenu$.unsubscribe();
      // TODO sync edits to the source editor
    },
    { once: true },
  );

  return editResult.promise;
}

export function useArtifactEditor() {}
