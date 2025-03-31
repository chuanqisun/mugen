import type { ArtifactProvider, RunOptions } from "../artifact-editor/artifact-editor";

export class TextProvider implements ArtifactProvider {
  static languages = ["text", "txt"];

  run(options: RunOptions) {}
}
