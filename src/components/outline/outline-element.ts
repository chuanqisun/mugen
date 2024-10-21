import { html, render } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { fromEvent, map, switchMap, tap } from "rxjs";
import { CodeEditorElement } from "../code-editor/code-editor-element";
import { $fs, readFile } from "../file-system/file-system";
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
  private $openFile = fromEvent(this, "click").pipe(
    map((e) => e.target as HTMLElement),
    map((target) => (target.closest(`[data-action="load-file"]`) as HTMLButtonElement).getAttribute("data-path")!),
    switchMap((path) => readFile(path)),
    switchMap((vFile) => document.querySelector<CodeEditorElement>("code-editor-element")!.loadFile(vFile.file))
  );

  connectedCallback() {
    this.$render.subscribe();
    this.$openFile.subscribe();
  }
}

export function defineOutlineElement() {
  customElements.define("outline-element", OutlineElement);
}
