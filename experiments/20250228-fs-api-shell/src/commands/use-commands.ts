import { Subject, filter, fromEvent, map, merge, tap } from "rxjs";
import { parseCommandEvent, parseKeyboardShortcut } from "../utils/dom";

export interface Command {
  id: string;
  key?: string;
  preventDefault?: boolean;
  stopPropagation?: boolean;
  run: () => any;
}

export const commandRequest$ = new Subject<string>();

export function useCommands(options: { commands: Command[] }) {
  const keyboardCommands = new Map<string, Command>(options.commands.filter((c) => c.key).map((c) => [c.key!, c]));
  const allCommands = new Map<string, Command>(options.commands.map((c) => [c.id, c]));

  const keyboardRuns$ = fromEvent<KeyboardEvent>(window, "keydown").pipe(
    map(parseKeyboardShortcut),
    filter(Boolean),
    map(({ combo, event }) => ({ combo, event, runtimeCommand: keyboardCommands.get(combo) })),
    filter(({ runtimeCommand }) => !!runtimeCommand),
    tap(async ({ runtimeCommand, event }) => {
      if (runtimeCommand?.preventDefault) event.preventDefault();
      if (runtimeCommand?.stopPropagation) event.stopPropagation();
      runtimeCommand!.run();
    })
  );

  const clickRuns$ = fromEvent(window, "click").pipe(
    map(parseCommandEvent),
    filter(({ command }) => !!command),
    map(({ command, ...rest }) => ({
      ...rest,
      command,
      runtimeCommand: allCommands.get(command!),
    })),
    tap(({ runtimeCommand }) => {
      runtimeCommand?.run();
    })
  );

  return merge(keyboardRuns$, clickRuns$);
}
