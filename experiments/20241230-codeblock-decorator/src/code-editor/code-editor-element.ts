import { javascript } from "@codemirror/lang-javascript";
import { markdown } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { Compartment } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { keymap } from "@codemirror/view";
import { EditorView, minimalSetup } from "codemirror";

import { blockActionPlugin } from "./block-action-widget";
import "./code-editor-element.css";

const dynamicLanguage = new Compartment();

export function defineCodeEditorElement() {
  customElements.define("code-editor-element", CodeEditorElement);
}

export class CodeEditorElement extends HTMLElement {
  static observedAttributes = ["data-lang"];

  private editorView!: EditorView;

  connectedCallback() {
    const textContent = this.textContent || "";
    this.textContent = "";

    this.editorView = new EditorView({
      extensions: [
        keymap.of([
          {
            key: "Ctrl-Enter",
            run: () => {
              this.dispatchEvent(new CustomEvent("run-message", { bubbles: true }));
              return true;
            },
          },
        ]),
        minimalSetup,
        oneDark,
        dynamicLanguage.of([]),
        blockActionPlugin,
        // highlightActiveLine(),
        EditorView.lineWrapping,
        EditorView.focusChangeEffect.of((state, focusing) => {
          if (focusing) return null;
          this.dispatchEvent(new CustomEvent("change", { detail: state.doc.toString() }));
          return null;
        }),
      ],
      parent: this,
    });

    this.value = textContent;

    this.updateLanguage(this.getAttribute("data-lang") ?? "md");
  }

  attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
    if (name === "data-lang") this.updateLanguage(newValue);
  }

  updateLanguage(lang: string) {
    getLanguageSupport(lang).then((lang) => {
      const reconfig = dynamicLanguage.reconfigure(lang);
      this.editorView.dispatch({ effects: reconfig });
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
}

async function getLanguageSupport(filenameOrExtension: string) {
  const ext = filenameOrExtension.split(".").pop();
  switch (ext) {
    case "js":
    case "javascript":
    case "ts":
    case "typescript":
    case "jsx":
    case "tsx":
      return javascript({ jsx: true, typescript: true });
    case "md":
      return markdown({ codeLanguages: languages });
    default:
      return (await languages.find((lang) => lang.extensions.includes(ext ?? ""))?.load()) ?? [];
  }
}
