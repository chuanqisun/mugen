import { oneDark } from "@codemirror/theme-one-dark";
import { highlightActiveLine } from "@codemirror/view";
import { EditorView, minimalSetup } from "codemirror";
import "./code-editor-element.css";

export class CodeEditorElement extends HTMLElement {
  private editorView!: EditorView;

  connectedCallback() {
    this.editorView = useCodeEditor({
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
    return file.text().then((text) => (this.value = text));
  }

  loadText(text: string) {
    this.value = text;
  }
}

export function defineCodeEditorElement() {
  customElements.define("code-editor-element", CodeEditorElement);
}

interface SourceEditorProps {
  container: HTMLElement;
  onChange: (value: string) => void;
}
function useCodeEditor(props: SourceEditorProps) {
  const view = new EditorView({
    extensions: [
      minimalSetup,
      oneDark,
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
