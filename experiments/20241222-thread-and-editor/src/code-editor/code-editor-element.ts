import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { yaml } from "@codemirror/lang-yaml";
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
  private editorView!: EditorView;

  connectedCallback() {
    this.editorView = createCodeEditorView({
      container: this,
      onChange: (value) => this.dispatchEvent(new CustomEvent("change", { detail: value })),
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

interface SourceEditorProps {
  container: HTMLElement;
  onChange: (value: string) => void;
}
function createCodeEditorView(props: SourceEditorProps) {
  const view = new EditorView({
    extensions: [
      minimalSetup,
      oneDark,
      dynamicLanguage.of([]),
      highlightActiveLine(),
      EditorView.lineWrapping,
      EditorView.focusChangeEffect.of((state, focusing) => {
        if (focusing) return null;
        props.onChange?.(state.doc.toString());
        return null;
      }),
    ],
    parent: props.container,
  });

  return view;
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
      return dynamicLanguage.reconfigure(markdown());
    case "json":
      return dynamicLanguage.reconfigure(json());
    case "yaml":
    case "yml":
      return dynamicLanguage.reconfigure(yaml());
    default:
      return dynamicLanguage.reconfigure([]);
  }
}
