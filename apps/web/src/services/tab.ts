import { Subject } from "rxjs";

export const $interruptAutoOpen = new Subject<void>();
export const $autoOpenPaths = new Subject<Subject<string>>();
