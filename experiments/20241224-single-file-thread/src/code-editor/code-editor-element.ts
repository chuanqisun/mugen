import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { yaml } from "@codemirror/lang-yaml";
import { languages } from "@codemirror/language-data";
import { Compartment } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { highlightActiveLine, keymap } from "@codemirror/view";
import { EditorView, minimalSetup } from "codemirror";

import { OpenAILLMProvider } from "../llm/openai-llm-provider";
import "./code-editor-element.css";

const dynamicLanguage = new Compartment();

export function defineCodeEditorElement() {
  customElements.define("code-editor-element", CodeEditorElement);
}

export class CodeEditorElement extends HTMLElement {
  private editorView!: EditorView;
  private openai = new OpenAILLMProvider();

  connectedCallback() {
    this.editorView = new EditorView({
      extensions: [
        keymap.of([
          {
            key: "Ctrl-Enter",
            run: (view) => {
              this.openai.getClient().then(async (client) => {
                const text = view.state.doc.toString();
                const doc = new DOMParser().parseFromString(text, "text/html");
                const messages = [...doc.querySelectorAll("system,user,assistant")].map((e) => ({
                  role: e.tagName.toLowerCase(),
                  content: e.textContent,
                }));

                // insert <assistant> tag
                view.dispatch({
                  changes: {
                    from: view.state.doc.length,
                    to: view.state.doc.length,
                    insert: "<user>\n<assistant>",
                  },
                });

                const responseStream = await client.chat.completions.create({
                  stream: true,
                  messages: messages as any[],
                  model: "gpt-4o",
                });

                for await (const completion of responseStream) {
                  view.dispatch({
                    changes: {
                      from: view.state.doc.length,
                      to: view.state.doc.length,
                      insert: completion.choices.at(0)?.delta?.content ?? "",
                    },
                  });
                }

                // insert: "</assistant>";
                view.dispatch({
                  changes: {
                    from: view.state.doc.length,
                    to: view.state.doc.length,
                    insert: "</assistant>\n<user>",
                  },
                });
              });

              console.log("will complete");
              return true;
            },
          },
        ]),
        minimalSetup,
        oneDark,
        dynamicLanguage.of([]),
        highlightActiveLine(),
        EditorView.lineWrapping,
        EditorView.focusChangeEffect.of((state, focusing) => {
          if (focusing) return null;
          this.dispatchEvent(new CustomEvent("change", { detail: state.doc.toString() }));
          return null;
        }),
      ],
      parent: this,
    });
  }

  set value(value: string) {
    this.editorView.dispatch({
      changes: {
        from: 0,
        to: this.editorView.state.doc.length,
        insert: value,
      },
    });
  }

  get value() {
    return this.editorView.state.doc.toString();
  }

  async loadFile(file: File) {
    const reconfig = getLanguageReconfig(file.name);
    this.editorView.dispatch({ effects: reconfig });

    return file.text().then((text) => (this.value = text));
  }

  appendText(text: string) {
    const length = this.editorView.state.doc.length;
    this.editorView.dispatch({
      changes: {
        from: length,
        to: length,
        insert: text,
      },
    });
  }

  loadText(filename: string, text: string) {
    const reconfig = getLanguageReconfig(filename);
    this.editorView.dispatch({ effects: reconfig });

    this.value = text;
  }
}

function getLanguageReconfig(filename: string) {
  const ext = filename.split(".").pop();
  switch (ext) {
    case "html":
      return dynamicLanguage.reconfigure(html());
    case "js":
    case "ts":
    case "jsx":
    case "tsx":
      return dynamicLanguage.reconfigure(javascript({ jsx: true, typescript: true }));
    case "css":
      return dynamicLanguage.reconfigure(css());
    case "md":
      return dynamicLanguage.reconfigure(markdown({ codeLanguages: languages }));
    case "json":
      return dynamicLanguage.reconfigure(json());
    case "yaml":
    case "yml":
      return dynamicLanguage.reconfigure(yaml());
    default:
      return dynamicLanguage.reconfigure([]);
  }
}
