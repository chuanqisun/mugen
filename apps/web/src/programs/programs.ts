export interface Program {
  name: string;
  run: (context: ProgramRunContext) => AsyncIterable<string>;
}

export interface ProgramRunContext {
  rawArgs: string;
}
