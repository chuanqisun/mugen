import { Parser } from "htmlparser2";
import { appendArtifactContent, createArtifact } from "./artifacts";
import { $chat } from "./chat";
import { $thread, appendAssistantMessage, createAssistantMessage } from "./thread";

export async function run(userMessageId: number) {
  const currentItems = $thread.value.items;
  const runItems = currentItems.slice(0, currentItems.findIndex((item) => item.id === userMessageId) + 1);

  let currentArtifactId: string | null = null;

  const parser = new Parser({
    onopentag: (name, attributes, isImplied) => {
      if (name === "standalone-artifact") {
        currentArtifactId = createArtifact(attributes.path, "");
        appendAssistantMessage(userMessageId, `[${attributes.path}]`);
      }
    },
    ontext: (text) => {
      if (currentArtifactId) {
        appendArtifactContent(currentArtifactId, text);
      } else {
        appendAssistantMessage(userMessageId, text);
      }
    },
    onclosetag: (name, _isImplied) => {
      if (name === "standalone-artifact") {
        currentArtifactId = null;
      }
    },
  });

  const stream = $chat.value.messages
    .stream({
      temperature: 0,
      max_tokens: 4_000,
      model: "claude-3-haiku-20240307",
      system: `Respond in plaintext. If user asks for standalone code blocks, documents, or files, wrap them with embedded <standalone-artifact> tags.
Requirements:
- Each <standalone-artifact> must have a path with descriptive filename and extension, e.g. <standalone-artifact path="[filename].[extension]">...</standalone-artifact>.
- Suppported file extensions: txt, md, html, css, js, ts, jsx, tsx, json, sh
- Do NOT nest <standalone-artifact> elements
      `.trim(),
      messages: runItems.map((item) => ({
        role: item.role,
        content: item.content,
      })),
      stream: true,
    })
    .on("connect", () => {
      createAssistantMessage(userMessageId);
    })
    .on("text", (text) => {
      parser.write(text);
    });

  await stream.finalMessage();
  parser.end();
}
