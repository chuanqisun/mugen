import { BehaviorSubject } from "rxjs";

const inMemoryFileSystem = new BehaviorSubject<Record<string, string>>({});

export async function readFile(path: string) {
  return inMemoryFileSystem.value[path];
}

export async function writeFile(path: string, content: string) {
  inMemoryFileSystem.next({ ...inMemoryFileSystem.value, [path]: content });
}
