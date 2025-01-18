import { type KeyBinding } from "@codemirror/view";

export const blockEditorKeymap = (eventTarget: EventTarget) =>
  [
    {
      key: "Ctrl-Enter",
      run: () => {
        eventTarget.dispatchEvent(new CustomEvent("run-message", { bubbles: true }));
        return true;
      },
    },
  ] as KeyBinding[];
