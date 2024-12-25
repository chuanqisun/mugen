import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { yaml } from "@codemirror/lang-yaml";
import { languages } from "@codemirror/language-data";
import { Compartment } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { highlightActiveLine } from "@codemirror/view";
import { EditorView, minimalSetup } from "codemirror";

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

    this.value = textContent;

    this.updateLanguage(this.getAttribute("data-lang") ?? "");
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
    case "html":
      return html();
    case "js":
    case "ts":
    case "jsx":
    case "tsx":
      return javascript({ jsx: true, typescript: true });
    case "css":
      return css();
    case "md":
      return markdown({ codeLanguages: languages });
    case "json":
      return json();
    case "yaml":
    case "yml":
      return yaml();
    default:
      return (await languages.find((lang) => lang.extensions.includes(ext ?? ""))?.load()) ?? [];
  }
}
