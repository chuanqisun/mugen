import { BehaviorSubject } from "rxjs";

export type ObjectsChangeEventDetail = Record<string, File>;

export class InMemoryFileStore extends EventTarget {
  #objects$ = new BehaviorSubject<Record<string, File>>({});

  async addFileInteractive() {
    const [file] = await window.showOpenFilePicker();
    if (file) {
      this.#objects$.next({ ...this.#objects$.value, [file.name]: await file.getFile() });
      this.dispatchEvent(new CustomEvent<ObjectsChangeEventDetail>("objectschange", { detail: this.#objects$.value }));
    }
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
