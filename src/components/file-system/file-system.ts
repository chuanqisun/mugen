import { BehaviorSubject, ReplaySubject } from "rxjs";

export interface VirtualFile {
  path: string;
  file: File;
  stream?: ReplaySubject<string>;
}
export const $fs = new BehaviorSubject<Record<string, VirtualFile>>({
  "welcome.txt": {
    path: "welcome.txt",
    file: new File(["Welcome to the virtual file system!"], "welcome.txt", { type: "text/plain" }),
  },
});

export async function readFile(path: string) {
  return $fs.value[path];
}

export async function writeFile(path: string, content: string) {
  $fs.next({
    ...$fs.value,
    [path]: {
      ...$fs.value[path],
      path,
      file: new File([content], getFilename(path), { type: getMimeType(getExtension(path)) }),
    },
  });
}

// TODO use efficient appending
export async function appendFile(path: string, content: string) {
  const vfile = $fs.value[path];
  const text = vfile ? await vfile.file.text() : "";
  await writeFile(path, text + content);
  vfile.stream?.next(content);
}

export async function startFileStreaming(path: string) {
  const vfile = $fs.value[path];
  if (vfile) {
    $fs.next({
      ...$fs.value,
      [path]: {
        ...vfile,
        stream: vfile.stream ?? new ReplaySubject<string>(),
      },
    });
  }
}

export async function endFileStreaming(path: string) {
  const vfile = $fs.value[path];
  if (vfile) {
    $fs.next({
      ...$fs.value,
      [path]: {
        ...vfile,
        stream: undefined,
      },
    });
  }
}

export function getFilename(path: string) {
  return path.split("/").pop() ?? "";
}

export function getExtension(path: string) {
  return path.split(".").pop() ?? "";
}

export function getMimeType(ext: string) {
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
