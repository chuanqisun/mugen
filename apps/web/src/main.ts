import "./style.css";

import { fromEvent, map, tap } from "rxjs";
import { defineCodeEditorElement } from "./code-editor/code-editor-element";
import { handleOpenMenu } from "./handlers/handle-open-menu";
import { LlmProvider } from "./llm/llm-provider";
import { system, user } from "./llm/messages";
import { defineSettingsElement } from "./settings/settings-element";
import { $, parseActionEvent, preventDefault } from "./utils/dom";

defineSettingsElement();
defineCodeEditorElement();

const llm = new LlmProvider();
const inputForm = $<HTMLFormElement>("#input-form")!;
const eventsViewer = $<HTMLElement>("#events-viewer")!;
const environmentViewer = $<HTMLElement>("#environment-viewer")!;

function printTime() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
}

eventsViewer.textContent = `<entry time="${printTime()}" actor="User">started the session</entry>`;

environmentViewer.textContent = `
<user></user>
<assistant>
  <goals>
    <goal>Understand user</goal>
    <goal>Update environment</goal>
    <goal>Provide help user</goal>
  </goals>
</assistant>
<output></output>
`.trim();

const windowClick$ = fromEvent(window, "click").pipe(
  map(parseActionEvent),
  tap((e) => {
    handleOpenMenu(e);
  })
);

const formSubmission$ = fromEvent(inputForm, "submit").pipe(
  tap(preventDefault),
  tap(async (e) => {
    const prompt = (new FormData(inputForm).get("prompt") as string).trim();
    inputForm.reset();
    console.log(prompt);

    function appendEntry(args: { actor: "User" | "Assistant"; event: string }) {
      const time = printTime();

      const entryXML = `
<entry time="${time}" actor="${args.actor}">${args.event}</entry>
      `.trim();

      eventsViewer.textContent += `\n${entryXML}`;

      return `Added: ${entryXML}`;
    }

    function updateEnvironment(args: { latestXML: string }) {
      environmentViewer.textContent = args.latestXML;
      return `Environment updated`;
    }

    const openai = await llm.getClient();
    const task = openai.beta.chat.completions.runTools({
      model: "gpt-4o",
      messages: [
        system`
You are an AI assistant. Your goal is to understand user, update the environment, and provide help. You must interact with the user by updating the environment.
Follow this process:
1. Append an entry to the events journal, summarizing the user's input into one short record.
2. Update the environment based on user's input. This is the only way for your to respond to the user.
   - Update <user> to model user's goals and thoughts.
   - Update <assistant> to model your own goals and thoughts.
   - Update <output> to include any data or information you want to show to the user.
3. Add an entry to the events journal, summarizing what changes you've made to the environment into one short record.

Here are the current journal entries:
${eventsViewer.textContent}

Here is the latest environment:
${environmentViewer.textContent}

IMPORTANT:
Say nothing after updating the environment. The ONLY way you can communicate with the user is by using the <output> element in the environment. 
        `,
        user`${prompt}`,
      ],
      tools: [
        {
          type: "function",
          function: {
            function: appendEntry,
            description: "Append an entry to the events journal",
            parse: JSON.parse,
            parameters: {
              type: "object",
              required: ["actor", "event"],
              properties: {
                actor: { enum: ["User", "Assistant"] },
                event: { type: "string" },
              },
            },
          },
        },
        {
          type: "function",
          function: {
            function: updateEnvironment,
            description: "Completely replace the environment XML",
            parse: JSON.parse,
            parameters: {
              type: "object",
              required: ["latestXML"],
              properties: {
                latestXML: { type: "string" },
              },
            },
          },
        },
      ],
    });

    const final = await task.finalContent();

    console.log("final response", final);
  })
);

windowClick$.subscribe();
formSubmission$.subscribe();
