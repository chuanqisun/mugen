import { BehaviorSubject, concatMap, groupBy, mergeMap, ReplaySubject, Subject } from "rxjs";

export interface VirtualFile {
  path: string;
  file: File;
  stream?: ReplaySubject<TextFileUpdate>;
}

export interface TextFileUpdate {
  delta: string;
  snapshot: string;
}

export const $fs = new BehaviorSubject<Record<string, VirtualFile>>({
  "test.html": {
    path: "test.html",
    file: new File(
      [
        `
<!doctype html>
<head>
  <title>Test</title>
  <link rel="stylesheet" href="test.css" />
</head>
<body>
hello html
  <script type="module" src="test.js"></script>
</body>
      `.trim(),
      ],
      "test.html",
      { type: "text/html" }
    ),
  },
  "test.css": {
    path: "test.css",
    file: new File(["body { color: red; }"], "test.css", { type: "text/css" }),
  },
  "test.js": {
    path: "test.js",
    file: new File(["console.log('hello js')"], "test.js", { type: "text/javascript" }),
  },
  "welcome.txt": {
    path: "welcome.txt",
    file: new File(["Welcome to Mugen"], "welcome.txt", { type: "text/plain" }),
  },
});

export async function readFile(path: string) {
  return $fs.value[path];
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

export async function writeFile(path: string, content: string) {
  $fsInternalQueue.next({
    path,
    transaction: async () => {
      const $stream = new ReplaySubject<TextFileUpdate>();

      $fs.next({
        ...$fs.value,
        [path]: {
          ...$fs.value[path],
          path,
          file: new File([content], getFilename(path), { type: getMimeType(getExtension(path)) }),
          stream: $stream,
        },
      });

      $stream.next({ snapshot: content, delta: content });
    },
  });
}

export async function writeFileSilent(path: string, content: string) {
  $fsInternalQueue.next({
    path,
    transaction: async () => {
      $fs.next({
        ...$fs.value,
        [path]: {
          ...$fs.value[path],
          path,
          file: new File([content], getFilename(path), { type: getMimeType(getExtension(path)) }),
        },
      });
    },
  });
}

export async function deleteFile(path: string) {
  $fsInternalQueue.next({
    path,
    transaction: async () => {
      const existingFile = $fs.value[path];
      if (existingFile) {
        existingFile.stream?.complete();
        $fs.next(Object.fromEntries(Object.entries($fs.value).filter(([key]) => key !== path)));
      }
    },
  });
}

// TODO use efficient text encoded appending
export async function appendFile(path: string, content: string) {
  $fsInternalQueue.next({
    path,
    transaction: async () => {
      const virtualFile = $fs.value[path];
      const text = virtualFile ? await virtualFile.file.text() : "";
      const snapshot = text + content;

      let $stream = $fs.value[path].stream;
      if (!$stream) {
        $stream = new ReplaySubject<TextFileUpdate>();
        $stream.next({ snapshot, delta: snapshot });
      } else {
        $stream.next({ snapshot, delta: content });
      }

      $fs.next({
        ...$fs.value,
        [path]: {
          ...$fs.value[path],
          file: new File([snapshot], getFilename(path), { type: getMimeType(getExtension(path)) }),
          stream: $stream,
        },
      });
    },
  });
}

export async function closeFile(path: string) {
  $fsInternalQueue.next({
    path,
    transaction: async () => {
      const virtualFile = $fs.value[path];
      if (virtualFile?.stream) {
        virtualFile.stream?.complete();

        $fs.next({
          ...$fs.value,
          [path]: {
            ...virtualFile,
            stream: undefined,
          },
        });
      }
    },
  });
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
