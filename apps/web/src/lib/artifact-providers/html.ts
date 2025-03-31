import type { ArtifactProvider, RunOptions } from "../artifact-editor/artifact-editor";

export class HtmlProvider implements ArtifactProvider {
  static languages = ["html"];

  run(options: RunOptions) {
    options.renderHtml(options.code);
  }
}
