import { filter, map, Subject } from "rxjs";

export interface Submission {
  id: number;
  prompt: string;
}
export const $submission = new Subject<Submission>();

export const $promptSubmissions = $submission.asObservable().pipe(filter((event) => !event.prompt.startsWith("/")));
export const $commandSubmissions = $submission.asObservable().pipe(
  filter((event) => event.prompt.startsWith("/")),
  map((event) => event.prompt.slice(1).toLocaleLowerCase())
);
