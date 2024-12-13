import { BehaviorSubject, concatMap, groupBy, mergeMap, Subject } from "rxjs";

export interface VirtualFileHandle {
  path: string;
  file: File;
  stream?: BehaviorSubject<TextFileAppend>;
}

export interface TextFileAppend {
  snapshot: string;
  delta: string;
}

export type VirtualFileSystemDict = Record<string, VirtualFileHandle>;
export type ReactiveVirtualFileSystem = BehaviorSubject<VirtualFileSystemDict>;

export const fs$ = new BehaviorSubject<VirtualFileSystemDict>({});

export function createFileSystem() {
  async function read(path: string) {
    return fs$.value[path];
  }

  const $fsInternalQueue = new Subject<{ path: string; transaction: () => Promise<any> }>();
  $fsInternalQueue
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

  function runTransaction<T>(path: string, transaction: () => Promise<T>) {
    const deferred = Promise.withResolvers<T>();

    $fsInternalQueue.next({
      path,
      transaction: async () => {
        try {
          deferred.resolve(await transaction());
        } catch (error) {
          deferred.reject(error);
        }
      },
    });

    return deferred.promise;
  }

  async function write(path: string, content: string) {
    return runTransaction(path, async () => {
      let existingStream = fs$.value[path]?.stream;
      if (!existingStream) {
        existingStream = new BehaviorSubject<TextFileAppend>({
          snapshot: content,
          delta: content,
        });
      } else {
        existingStream.next({ snapshot: content, delta: content });
      }

      fs$.next({
        ...fs$.value,
        [path]: {
          ...fs$.value[path],
          path,
          file: new File([content], getFilename(path), { type: getMimeType(getExtension(path)) }),
          stream: existingStream,
        },
      });
    });
  }

  async function remove(path: string) {
    return runTransaction(path, async () => {
      const existingFile = fs$.value[path];
      if (existingFile) {
        existingFile.stream?.complete();
        fs$.next(Object.fromEntries(Object.entries(fs$.value).filter(([key]) => key !== path)));
      }
    });
  }

  // TODO use efficient text encoded appending
  async function append(path: string, content: string) {
    return runTransaction(path, async () => {
      const virtualFile = fs$.value[path];
      const text = virtualFile ? await virtualFile.file.text() : "";
      const snapshot = text + content;

      let stream = fs$.value[path]?.stream;
      if (!stream) {
        stream = new BehaviorSubject<TextFileAppend>({ snapshot, delta: snapshot });
      } else {
        stream.next({ snapshot, delta: content });
      }

      fs$.next({
        ...fs$.value,
        [path]: {
          ...fs$.value[path],
          path,
          file: new File([snapshot], getFilename(path), { type: getMimeType(getExtension(path)) }),
          stream,
        },
      });
    });
  }

  async function close(path: string) {
    return runTransaction(path, async () => {
      const virtualFile = fs$.value[path];
      if (virtualFile?.stream) {
        virtualFile.stream?.complete();

        fs$.next({
          ...fs$.value,
          [path]: {
            ...virtualFile,
            stream: undefined,
          },
        });
      }
    });
  }

  return {
    debug$: fs$,
    read,
    write,
    remove,
    append,
    close,
  };
}

function getFilename(path: string) {
  return path.split("/").pop() ?? "";
}

function getExtension(path: string) {
  return path.split(".").pop() ?? "";
}

function getMimeType(ext: string) {
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
