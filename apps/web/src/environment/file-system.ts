import { BehaviorSubject, concatMap, groupBy, mergeMap, ReplaySubject, Subject } from "rxjs";

export interface VirtualFile {
  file: File;
  update$?: ReplaySubject<TextFileUpdate>;
}

export interface TextFileUpdate {
  delta: string;
  snapshot: string;
}

export class FileSystem extends EventTarget {
  #objects$ = new BehaviorSubject<Record<string, VirtualFile>>({
    "README.md": { file: new File(["# Welcome to the editor"], "README.md", { type: "text/markdown" }) },
  });
  #writeTransaction$ = new Subject<{ path: string; transaction: () => Promise<any> }>();

  constructor() {
    super();
    this.#writeTransaction$
      .pipe(
        groupBy(({ path }) => path),
        // files can be written concurrently
        mergeMap((tasksPerPath) =>
          tasksPerPath.pipe(
            // inside each file, write must be serial
            concatMap((task) => task.transaction().catch(() => null))
          )
        )
      )
      .subscribe();
  }

  async addFileInteractive() {
    const [file] = await window.showOpenFilePicker();
    if (file) {
      this.#objects$.next({ ...this.#objects$.value, [file.name]: { file: await file.getFile() } });
    }
  }

  getFiles$() {
    return this.#objects$.asObservable();
  }

  addFile(file: File) {
    this.#objects$.next({ ...this.#objects$.value, [file.name]: { file } });
  }

  getFile(path: string): File | null {
    return this.#objects$.value[path]?.file ?? null;
  }

  listFiles() {
    return this.#objects$.value;
  }

  clearFiles() {
    this.#objects$.next({});
  }

  async writeFile(path: string, content: string) {
    this.#writeTransaction$.next({
      path,
      transaction: async () => {
        const $stream = new ReplaySubject<TextFileUpdate>();

        this.#objects$.next({
          ...this.#objects$.value,
          [path]: {
            ...this.#objects$.value[path],
            file: new File([content], this.#getFilename(path), { type: this.#getMimeType(this.#getExtension(path)) }),
            update$: $stream,
          },
        });

        $stream.next({ snapshot: content, delta: content });
      },
    });
  }

  async writeFileSilent(path: string, content: string) {
    this.#writeTransaction$.next({
      path,
      transaction: async () => {
        this.#objects$.next({
          ...this.#objects$.value,
          [path]: {
            ...this.#objects$.value[path],
            file: new File([content], this.#getFilename(path), { type: this.#getMimeType(this.#getExtension(path)) }),
          },
        });
      },
    });
  }

  async deleteFile(path: string) {
    this.#writeTransaction$.next({
      path,
      transaction: async () => {
        const existingFile = this.#objects$.value[path];
        if (existingFile) {
          existingFile.update$?.complete();
          this.#objects$.next(Object.fromEntries(Object.entries(this.#objects$.value).filter(([key]) => key !== path)));
        }
      },
    });
  }

  // TODO use efficient text encoded appending
  async appendFile(path: string, content: string) {
    this.#writeTransaction$.next({
      path,
      transaction: async () => {
        const virtualFile = this.#objects$.value[path];
        const text = virtualFile ? await virtualFile.file.text() : "";
        const snapshot = text + content;

        let $stream = this.#objects$.value[path].update$;
        if (!$stream) {
          $stream = new ReplaySubject<TextFileUpdate>();
          $stream.next({ snapshot, delta: snapshot });
        } else {
          $stream.next({ snapshot, delta: content });
        }

        this.#objects$.next({
          ...this.#objects$.value,
          [path]: {
            ...this.#objects$.value[path],
            file: new File([snapshot], this.#getFilename(path), { type: this.#getMimeType(this.#getExtension(path)) }),
            update$: $stream,
          },
        });
      },
    });
  }

  async closeFile(path: string) {
    this.#writeTransaction$.next({
      path,
      transaction: async () => {
        const virtualFile = this.#objects$.value[path];
        if (virtualFile?.update$) {
          virtualFile.update$?.complete();

          this.#objects$.next({
            ...this.#objects$.value,
            [path]: {
              ...virtualFile,
              update$: undefined,
            },
          });
        }
      },
    });
  }

  #getFilename(path: string) {
    return path.split("/").pop() ?? "";
  }

  #getExtension(path: string) {
    return path.split(".").pop() ?? "";
  }

  #getMimeType(ext: string) {
    switch (ext) {
      case "html":
        return "text/html";
      case "css":
        return "text/css";
      case "js":
        return "text/javascript";
      case "txt":
        return "text/plain";
      case "ts":
        return "text/typescript";
      case "jsx":
        return "text/jsx";
      case "tsx":
        return "text/tsx";
      case "json":
        return "application/json";
      case "jsonl":
        return "application/jsonl";
      case "ndjson":
        return "application/ndjson";
      default:
        return "text/plain";
    }
  }
}
