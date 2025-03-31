import styleUrl from "../style.css?url";
import { getAnthropic } from "./llm";

export async function compileApp(inputTemplate: string) {
  const anthropic = getAnthropic();

  const inputFormAsync = anthropic.messages
    .create({
      model: "claude-3-5-haiku-latest",
      max_tokens: 1024,
      system: `
Based on the Input type, respond in html with a <form> and <script> that allows user to enter the input. Do NOT explain the code.

Requirements:
- Label each field
- No CSS
- Do NOT wrap in markdown codeblock
- Single submit button
- On form submit, preventDefault and call window.submit(input: Input)
      `.trim(),
      messages: [
        {
          role: "user",
          content: inputTemplate,
        },
      ],
    })
    .then((r) => r.content.find((c) => c.type === "text")?.text);

  const formHtml = await inputFormAsync;

  const submitOverrideJs = `
  window.submit = function (input) {
    window.parent.postMessage({
      type: "submit",
      input
    }, "*");
  }
  `;

  const htmlDoc = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <link rel="stylesheet" href="${styleUrl}">
  <script>${submitOverrideJs}</script>
</head>
<body>
  ${formHtml}
</body>
</html>
`;

  return htmlDoc;
}
