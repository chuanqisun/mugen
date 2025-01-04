import "./style.css";

import { Parser } from "htmlparser2";
import { fromEvent, map, tap } from "rxjs";
import { CodeEditorElement, defineCodeEditorElement } from "./code-editor/code-editor-element";
import { handleOpenMenu } from "./handlers/handle-open-menu";
import { LlmProvider } from "./llm/llm-provider";
import { assistant, system, user } from "./llm/messages";
import { defineSettingsElement } from "./settings/settings-element";
import { $, $new, parseActionEvent, preventDefault } from "./utils/dom";

defineSettingsElement();
defineCodeEditorElement();

const llm = new LlmProvider();
const inputForm = $<HTMLFormElement>("#input-form")!;
const blocks = $<HTMLDivElement>("#blocks")!;

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

    blocks.append($new("div", {}, ["input.txt"]), $new("code-editor-element", { "data-lang": "txt", value: prompt }));

    const openai = await llm.getClient();
    const task = await openai.chat.completions.create({
      stream: true,
      model: "gpt-4o-mini",
      messages: [
        system`
Respond with text blocks like this: <block filename="name.ext">text content</block>. Default to response.md`,
        user`<block>test input</block>`,
        assistant`<block filename="test.txt">test output</block>`,
        user`<block>${prompt}</block>`,
      ],
    });

    let currentObjectPath: string | null = null;
    let currentEditor: CodeEditorElement | null = null;
    let shouldTrimStart = true; // trim whitespace immediately before tag inner html starts. This allows artifact to have a clean looking start

    const parser = new Parser({
      onopentag(name, attributes, isImplied) {
        if (isImplied) return;

        if (name === "block") {
          currentObjectPath = attributes.filename ?? "unnamed.txt";
          shouldTrimStart = true;
          const lang = currentObjectPath.split(".").pop() ?? "txt";
          currentEditor = $new<CodeEditorElement>("code-editor-element", { "data-lang": lang });
          blocks.append($new("div", {}, [currentObjectPath]), currentEditor);
        } else if (currentEditor) {
          const attributesString = Object.entries(attributes)
            .map(([key, value]) => `${key}="${value}"`)
            .join(" ");
          const tagString = `<${name}${attributesString.length ? ` ${attributesString}` : ""}>`;
          currentEditor?.appendText(tagString);
        }
      },

      ontext(text) {
        if (currentEditor) {
          if (shouldTrimStart) {
            text = text.trimStart();
            shouldTrimStart = !text; // if text is empty, keep trimming
          }
          currentEditor.appendText(text);
        }
      },
      onclosetag(name, isImplied) {
        if (isImplied) return;

        if (name === "block") {
          currentEditor = null;
          shouldTrimStart = true;
        } else {
          const tagString = `</${name}>`;
          currentEditor?.appendText(tagString);
        }
      },
    });

    for await (const chunk of task) {
      parser.write(chunk.choices[0]?.delta?.content || "");
    }

    parser.end();
  })
);

windowClick$.subscribe();
formSubmission$.subscribe();
