import { $chat } from "./chat";
import { $thread, appendAssistantMessage, createAssistantMessage } from "./thread";

export async function run(id: number) {
  const currentItems = $thread.value.items;
  const runItems = currentItems.slice(0, currentItems.findIndex((item) => item.id === id) + 1);

  const stream = $chat.value.messages
    .stream({
      temperature: 0,
      max_tokens: 4_000,
      model: "claude-3-haiku-20240307",
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
