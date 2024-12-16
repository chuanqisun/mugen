import { BehaviorSubject } from "rxjs";

export type ObjectsChangeEventDetail = Record<string, File>;

export interface EditableFile extends File {
  buffer?: string;
}

export class FileStore extends EventTarget {
  #objects$ = new BehaviorSubject<Record<string, EditableFile>>({});

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

  async loadBuffer(filename: string) {
    const file = this.#objects$.value[filename];
    if (!file) {
      console.warn(`File not found: ${filename}`);
      return;
    }
    this.#objects$.next({ ...this.#objects$.value, [filename]: { ...file, buffer: await file.text() } });
  }

  async flushBuffer(filename: string) {
    const file = this.#objects$.value[filename];
    if (!file) {
      console.warn(`File not found: ${filename}`);
      return;
    }
    if (!file.buffer) {
      console.warn(`File buffer not found: ${filename}`);
      return;
    }
    this.#objects$.next({ ...this.#objects$.value, [filename]: new File([file.buffer], filename, { type: file.type }) });
  }
}
