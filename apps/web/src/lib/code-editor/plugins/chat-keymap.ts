import { type KeyBinding } from "@codemirror/view";

export interface CommandEventDetails {
  command: string;
}

export const chatKeymap = (eventTarget: EventTarget) =>
  [
    {
      key: "Mod-Enter",
      run: (view) => {
        const sourceCode = view.state.doc.toString();
        eventTarget.dispatchEvent(new CustomEvent("command", { detail: { command: "run" }, bubbles: true }));
        return true;
      },
    },
    {
      key: "Shift-Enter",
      run: (_view) => {
        eventTarget.dispatchEvent(new CustomEvent("command", { detail: { command: "append" }, bubbles: true }));
        return true;
      },
    },
    {
      key: "Backspace",
      run: (view) => {
        // when text is empty, emit a "delete" event
        if (view.state.doc.length === 0) {
          eventTarget.dispatchEvent(new CustomEvent("command", { detail: { command: "delete" }, bubbles: true }));
          return true;
        }
      },
    },
  ] as KeyBinding[];
