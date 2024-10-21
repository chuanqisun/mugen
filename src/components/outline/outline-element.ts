import { html, render } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { fromEvent, map, switchMap, tap } from "rxjs";
import { CodeEditorElement } from "../code-editor/code-editor-element";
import { $fs, readFile } from "../file-system/file-system";
import "./outline-element.css";

export class OutlineElement extends HTMLElement {
  private $items = $fs.pipe(map((fs) => Object.entries(fs).map(([path, file]) => ({ path, filename: file.name }))));
  private $render = this.$items.pipe(
    tap((items) =>
      render(
        repeat(
          items,
          (item) => item.path,
          (item) => html`<button data-action="load-file" , data-path=${item.path}>${item.filename}</button>`
        ),
        this
      )
    )
  );
  private $openFile = fromEvent(this, "click").pipe(
    map((e) => e.target as HTMLElement),
    map((target) => (target.closest(`[data-action="load-file"]`) as HTMLButtonElement).getAttribute("data-path")!),
    switchMap((path) => readFile(path)),
    switchMap((file) => document.querySelector<CodeEditorElement>("code-editor-element")!.loadFile(file))
  );

  connectedCallback() {
    this.$render.subscribe();
    this.$openFile.subscribe();
  }
}

export function defineOutlineElement() {
  customElements.define("outline-element", OutlineElement);
}
