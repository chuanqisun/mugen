import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { defaultHighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { languages } from "@codemirror/language-data";
import { Compartment, EditorSelection, EditorState } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { drawSelection, EditorView, highlightSpecialChars, keymap } from "@codemirror/view";
import { ReplaySubject, tap } from "rxjs";
import "./code-editor-element.css";
import { blockActionPlugin } from "./plugins/block-action-widget";
import { chatKeymap } from "./plugins/chat-keymap";
import { syncDispatch } from "./sync";

const dynamicLanguage = new Compartment();

export function defineCodeEditorElement() {
  customElements.define("code-editor-element", CodeEditorElement);
}

export class CodeEditorElement extends HTMLElement {
  static observedAttributes = ["data-lang", "value"];

  private editorView: EditorView | null = null;

  connectedCallback() {
    this.editorView = new EditorView({
      extensions: [
        highlightSpecialChars(),
        history(),
        drawSelection(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        keymap.of([...chatKeymap(this), ...defaultKeymap, ...historyKeymap]),
        oneDark,
        dynamicLanguage.of([]),
        blockActionPlugin,
        EditorView.lineWrapping,
        EditorView.focusChangeEffect.of((state, focusing) => {
          if (focusing) return null;
          this.dispatchEvent(new CustomEvent("change", { detail: state.doc.toString() }));
          return null;
        }),
      ],
      parent: this,
    });

    this.updateLanguage(this.getAttribute("data-lang") ?? "md");

    if (this.hasAttribute("value")) {
      this.value = this.getAttribute("value") ?? "";
    }
  }

  attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
    if (name === "data-lang") {
      this.updateLanguage(newValue);
    }

    if (name === "value") {
      this.value = newValue;
    }
  }

  focus() {
    this.editorView?.focus();
  }

  updateLanguage(lang: string) {
    getLanguageSupport(lang).then((lang) => {
      const reconfig = dynamicLanguage.reconfigure(lang);
      this.editorView?.dispatch({ effects: reconfig });
    });
  }

  set value(value: string) {
    this.editorView?.dispatch({ changes: { from: 0, to: this.editorView.state.doc.length, insert: value } });
  }

  get value() {
    return this.editorView?.state.doc.toString() ?? "";
  }

  appendText(text: string) {
    const length = this.editorView?.state.doc.length ?? 0;
    this.editorView?.dispatch({ changes: { from: length, to: length, insert: text } });
  }

  replaceText(from: number, to: number, text: string) {
    console.log("replace", { from, to, oldText: this.editorView?.state.doc.sliceString(from, to), newText: text });

    this.editorView?.dispatch({ changes: { from, to, insert: text } });
  }

  spawnCursor(options?: { selection?: EditorSelection }) {
    if (!this.editorView) {
      throw new Error("EditorView not initialized");
    }

    const cursorView = document.createElement("div");
    const chatView = new EditorView({
      state: EditorState.create({ doc: this.editorView.state.doc }), // share doc and nothing else
      parent: cursorView,
      dispatch: (tr) => syncDispatch(tr, chatView, this.editorView!),
    });

    const initialSelection = options?.selection ?? this.editorView.state.selection.main;

    // initial selection
    chatView.dispatch({ selection: initialSelection });

    const cursorInput$ = new ReplaySubject();
    cursorInput$
      .pipe(
        tap((chunk: any) => {
          chatView.dispatch({
            changes: { from: chatView.state.selection.main.from, insert: chunk },
            selection: {
              anchor: chatView.state.selection.main.from + chunk.length,
              head: chatView.state.selection.main.from + chunk.length,
            },
          });
        }),
        tap({
          finalize: () => {
            chatView.destroy();
          },
        }),
      )
      .subscribe();

    const write = (text: string) => cursorInput$.next(text);
    const end = () => cursorInput$.complete();

    return { write, end };
  }
}

async function getLanguageSupport(filenameOrExtension: string) {
  const ext = filenameOrExtension.split(".").pop();
  switch (ext) {
    case "markdown":
    case "md":
      return markdown({ codeLanguages: languages });
    default:
      return (
        (await languages
          .find((lang) =>
            [lang.name.toLocaleLowerCase(), lang.alias.map((a) => a.toLocaleLowerCase()), ...lang.extensions].includes(
              ext ?? "",
            ),
          )
          ?.load()) ?? []
      );
  }
}
