import { $chat } from "./chat";
import { $thread } from "./thread";

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
        content: item.content.join(" "), // HACK
      })),
      stream: true,
    })
    .on("text", (text) => {
      console.log(text);
    });

  const final = await stream.finalMessage();

  console.log({ final });
}
