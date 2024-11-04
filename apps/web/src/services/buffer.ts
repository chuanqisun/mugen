// Active buffer has one way data flow
// fs -> streams into buffer
// text editor -> streams into buffer
// on save/close -> buffer flush to fs

import { BehaviorSubject } from "rxjs";

export const $activeFilePath = new BehaviorSubject<string | null>(null);

export function loadFileToBuffer(path: string) {
  $activeFilePath.next(path);
}
