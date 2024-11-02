import { Parser } from "htmlparser2";
import { $chat } from "./chat";
import { $thread, appendAssistantMessage, createAssistantMessage } from "./thread";

export async function run(id: number) {
  const currentItems = $thread.value.items;
  const runItems = currentItems.slice(0, currentItems.findIndex((item) => item.id === id) + 1);

  const parser = new Parser({});

  const stream = $chat.value.messages
    .stream({
      temperature: 0,
      max_tokens: 4_000,
      model: "claude-3-haiku-20240307",
      system: `Respond in plaintext. If user asks for standalone code or document, wrap them with embedded <standalone-artifact> tags.
Requirements:
- Each <standalone-artifact> must have path with extension, e.g. <standalone-artifact path="[filename].[extension]">...</standalone-artifact>.
- Suppported file extensions: txt, md, html, css, js, ts, jsx, tsx, json, sh
- Do NOT explain the artifact
      `.trim(),
      messages: runItems.map((item) => ({
        role: item.role,
        content: item.content,
      })),
      stream: true,
    })
    .on("connect", () => {
      createAssistantMessage(id);
    })
    .on("text", (text) => {
      appendAssistantMessage(id, text);
    });

  await stream.finalMessage();
}
