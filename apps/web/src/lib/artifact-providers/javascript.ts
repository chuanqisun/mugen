import type { ArtifactProvider, RunOptions } from "../artifact-editor/artifact-editor";

export class JavaScriptProvider implements ArtifactProvider {
  static languages = ["javascript", "js"];

  run(options: RunOptions) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <script type="module">
    ${options.code}
  </script>
</head>
<body>
  See results in the console
</body>
    `;

    options.renderHtml(html);
  }
}
