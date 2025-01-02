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
  // get 24 hour format HH:MM:SS from local ISO string
  const time = now.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return time;
}

eventsViewer.textContent = `[${printTime()}] User: started the session`;

environmentViewer.textContent = `
<user>
  <goals></goals>
</user>
<assistant>
  <goals>
    <goal>Understand user</goal>
    <goal>Update environment</goal>
    <goal>Provide help user</goal>
  </goals>
</assistant>
<output-files>
  <file name="welcome.txt">Welcome to the AI assistant system</file>
</output-files>
`.trim();

const windowClick$ = fromEvent(window, "click").pipe(
  map(parseActionEvent),
  tap((e) => {
    handleOpenMenu(e);
  })
);

const appendEntry = (args: { actor: "User" | "Assistant"; event: string }) => {
  const time = printTime();
  const entryXML = `[${time}] ${args.actor}: ${args.event}`.trim();
  eventsViewer.textContent += `\n${entryXML}`;
};

const formSubmission$ = fromEvent(inputForm, "submit").pipe(
  tap(preventDefault),
  tap(async (e) => {
    const prompt = (new FormData(inputForm).get("prompt") as string).trim();
    inputForm.reset();

    function updateEnvironment(args: { latestXML: string }) {
      environmentViewer.textContent = args.latestXML;
      return `Environment updated`;
    }

    appendEntry({
      actor: "User",
      event: prompt,
    });

    const openai = await llm.getClient();
    const task = openai.beta.chat.completions.runTools({
      model: "gpt-4o",
      messages: [
        system`
You are an AI assistant. Your goal is to understand user, update the environment, and provide help. You must interact with the user by updating the environment.
Follow this process:
1. Update the environment based on user's input. This is the only way for your to respond to the user.
   - Update <user> to model user's goals and thoughts.
   - Update <assistant> to model your own goals and thoughts.
   - Update <output-files> to include any file content you want to show to the user.
     You must wrap each file like this: <file name="filename.ext">...</file>
2. Respond to user with a one short sentence confirming what you did, or reporting any errors.

Here are the current journal entries:
${eventsViewer.textContent}

Here is the latest environment:
${environmentViewer.textContent}
        `,
        user`${prompt}`,
      ],
      tools: [
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
    appendEntry({
      actor: "Assistant",
      event: final ?? "No response",
    });

    console.log("final response", final);
  })
);

windowClick$.subscribe();
formSubmission$.subscribe();
