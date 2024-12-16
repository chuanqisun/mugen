import { BehaviorSubject, ReplaySubject } from "rxjs";

export type ObjectsChangeEventDetail = Record<string, File>;

export interface EditableFile extends File {
  updateStream?: ReplaySubject<string>;
}

export class FileStore extends EventTarget {
  #objects$ = new BehaviorSubject<Record<string, EditableFile>>({
    "REAMD.md": new File(["# Welcome to the editor"], "REAMD.md", { type: "text/markdown" }),
  });

  async addFileInteractive() {
    const [file] = await window.showOpenFilePicker();
    if (file) {
      this.#objects$.next({ ...this.#objects$.value, [file.name]: await file.getFile() });
      this.dispatchEvent(new CustomEvent<ObjectsChangeEventDetail>("objectschange", { detail: this.#objects$.value }));
    }
  }

  getFiles$() {
    return this.#objects$.asObservable();
  }

  addFile(file: File) {
    this.#objects$.next({ ...this.#objects$.value, [file.name]: file });
    this.dispatchEvent(new CustomEvent<ObjectsChangeEventDetail>("objectschange", { detail: this.#objects$.value }));
  }

  getFile(name: string): File | null {
    return this.#objects$.value[name] ?? null;
  }

  listFiles(): File[] {
    return Object.values(this.#objects$.value);
  }

  clearFiles() {
    this.#objects$.next({});
  }
}
