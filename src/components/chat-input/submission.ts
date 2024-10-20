import { Subject } from "rxjs";

export const $submission = new Subject<{ prompt: string }>();
