import { html, render } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { combineLatestWith, distinctUntilChanged, filter, fromEvent, map, share, switchMap, tap } from "rxjs";
import { CodeEditorElement } from "../code-editor/code-editor-element";
import { $fs, readFile } from "../file-system/file-system";
import { $firstStreamingPathPerSubmission } from "../interpreter/run";
import "./outline-element.css";

export class OutlineElement extends HTMLElement {
  private $items = $fs.pipe(map((fs) => Object.entries(fs).map(([path, vfile]) => ({ path, filename: vfile.file.name, hasStream: vfile.stream }))));
  private $render = this.$items.pipe(
    tap((items) =>
      render(
        repeat(
          items,
          (item) => item.path,
          (item) =>
            html`<button class="cols" style="justify-content: space-between" data-action="load-file" data-path=${item.path}>
              <span>${item.filename}</span>${item.hasStream ? html`<spinner-element></spinner-element>` : ""}
            </button>`
        ),
        this
      )
    )
  );
  private $openFilePath = fromEvent(this, "click").pipe(
    map((e) => e.target as HTMLElement),
    map((target) => (target.closest(`[data-action="load-file"]`) as HTMLButtonElement).getAttribute("data-path")!),
    share()
  );

  private $openFile = this.$openFilePath.pipe(
    switchMap((path) => readFile(path)),
    switchMap((vFile) => {
      const codeEditor = document.querySelector<CodeEditorElement>("code-editor-element")!;

      if (vFile.stream) {
        // TODO need to lock the editor to prevent user changes
        // TODO rewrite file abstraction to allow both streaming and whole file loading easy to watch
        codeEditor.loadText("");
        return vFile.stream.pipe(tap((content) => codeEditor.appendText(content)));
      } else {
        return codeEditor.loadFile(vFile.file);
      }
    })
  );

  // TODO refactor out of outline. It should be workspace manager's responsibility
  private $watchUpdate = this.$openFilePath.pipe(
    combineLatestWith($fs),
    map(([path, fs]) => fs[path]),
    filter((vfile) => !vfile.stream),
    distinctUntilChanged((a, b) => a.file === b.file),
    tap((vfile) => document.querySelector<CodeEditorElement>("code-editor-element")!.loadFile(vfile.file))
  );

  private $autoOpenFirstStreamingResponse = $firstStreamingPathPerSubmission.pipe(
    tap((path) => this.querySelector<HTMLButtonElement>(`[data-path="${path}"]`)?.click())
  );

  connectedCallback() {
    this.$render.subscribe();
    this.$openFile.subscribe();
    this.$watchUpdate.subscribe();
    this.$autoOpenFirstStreamingResponse.subscribe();
  }
}

export function defineOutlineElement() {
  customElements.define("outline-element", OutlineElement);
}
