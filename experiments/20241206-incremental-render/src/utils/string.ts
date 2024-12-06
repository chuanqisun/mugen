export interface ParsedCommand {
  command: string;
  argsRaw?: string;
}
export function parseCommand(raw: string): ParsedCommand {
  const firstSpaceIndex = raw.indexOf(" ");
  const hasArgs = firstSpaceIndex !== -1;
  return {
    command: hasArgs ? raw.slice(1, firstSpaceIndex) : raw.slice(1).trim(),
    argsRaw: hasArgs ? raw.slice(firstSpaceIndex + 1).trim() : "",
  };
}
