import "./style.css";

import { $, $all, $new } from "./lib/dom";
import { system, user } from "./lib/messages";
import { OpenAILLMProvider } from "./lib/openai-llm-provider";
import { defineSettingsElement } from "./lib/settings-element";

defineSettingsElement();

const input = $<HTMLTextAreaElement>("#input")!;
const rawEvents = $<HTMLElement>("#events")!;
const dialog = $("dialog")!;
const openai = new OpenAILLMProvider();

let taskId = 0;

input.addEventListener("keydown", async (e) => {
  if (e.key === "Enter") {
    e.preventDefault();

    const prompt = input.value.trim();
    if (!prompt) return;

    input.value = "";
    const id = ++taskId;
    rawEvents.append($new("div", { "data-role": "user", "data-id": id.toString() }, [`<user-message>${prompt}</user-message>`]));

    const aoai = await openai.getClient("aoai");
    const response = await aoai.chat.completions.create({
      stream: true,
      messages: [
        system`Respond with <assistant-message>. <assistant-message> can only have these children:
<think> for reasoning thoughts against complex tasks.
<say> for speaking to user. The innerText must be colloquial utterances.
<artifact filename="..." mime-type="..."> for showing standalone text. The innerText must be valid syntax for the mime-type.
        `,
        ...[...$all("[data-role]")].map(
          (div) => ({
            role: div.getAttribute("data-role") as "assistant" | "user",
            content: div.textContent ?? "",
          }),
          user`<user-message>${prompt}</user-message>`
        ),
      ],
      model: "gpt-4o",
    });

    const assitantElement = $new("div", { "data-role": "assistant", "data-id": id.toString() });
    rawEvents.append(assitantElement);

    for await (const chunk of response) {
      assitantElement.append(chunk.choices[0]?.delta?.content ?? "");
    }
  }
});

window.addEventListener("click", (e) => {
  const actionTrigger = (e.target as HTMLElement).closest("[data-action]");
  if (!actionTrigger) return;
  const action = actionTrigger.getAttribute("data-action");

  switch (action) {
    case "menu": {
      dialog.showModal();
      break;
    }
  }
});
