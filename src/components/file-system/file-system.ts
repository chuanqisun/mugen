import { BehaviorSubject } from "rxjs";

export interface VirtualFile {
  path: string;
  file: File;
  isBusy?: boolean;
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
}

export async function setFileBusy(path: string, isBusy: boolean) {
  const vfile = $fs.value[path];
  if (vfile) {
    $fs.next({
      ...$fs.value,
      [path]: {
        ...vfile,
        isBusy,
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
