import "./style.css";

import { Parser } from "htmlparser2";
import { fromEvent, map, tap } from "rxjs";
import { CodeEditorElement, defineCodeEditorElement } from "./code-editor/code-editor-element";
import { LlmProvider } from "./llm/llm-provider";
import { assistant, system, user } from "./llm/messages";
import { handleOpenMenu } from "./settings/handle-open-menu";
import { defineSettingsElement } from "./settings/settings-element";
import { $, $new, parseActionEvent } from "./utils/dom";

defineSettingsElement();
defineCodeEditorElement();

const llm = new LlmProvider();
const blocks = $<HTMLDivElement>("#blocks")!;

const windowClick$ = fromEvent(window, "click").pipe(
  map(parseActionEvent),
  tap((e) => {
    handleOpenMenu(e);
  })
);

const runMessage$ = fromEvent(blocks, "run-message").pipe(
  tap(async (e) => {
    const block = (e.target as HTMLElement).closest("code-editor-element") as CodeEditorElement;
    const prompt = block.value;

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
          const fileName = $new("div", {}, [currentObjectPath]);
          block.insertAdjacentElement("afterend", fileName);
          fileName.insertAdjacentElement("afterend", currentEditor);
          const nextUserMessage = $new("div", {}, ["user-message.txt"]);
          currentEditor.insertAdjacentElement("afterend", nextUserMessage);
          nextUserMessage.insertAdjacentElement("afterend", $new("code-editor-element", { "data-lang": lang }));
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
runMessage$.subscribe();
