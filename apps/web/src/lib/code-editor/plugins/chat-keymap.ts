import { type KeyBinding } from "@codemirror/view";

export const chatKeymap = (eventTarget: EventTarget) =>
  [
    {
      key: "Ctrl-Enter",
      run: (view) => {
        const sourceCode = view.state.doc.toString();
        eventTarget.dispatchEvent(new CustomEvent("run", { detail: sourceCode, bubbles: true }));
        return true;
      },
    },
  ] as KeyBinding[];
