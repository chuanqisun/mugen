import { filter, map } from "rxjs";
import { $submission } from "../chat-input/submission";

export const $globalCommands = $submission.pipe(
  filter(({ prompt }) => prompt.startsWith("/")),
  map(({ prompt }) => {
    const command = prompt.slice(1).toLocaleLowerCase().trim();
    return command;
  })
);
