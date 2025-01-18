import { type KeyBinding } from "@codemirror/view";

export const chatKeymap = (eventTarget: EventTarget) =>
  [
    {
      key: "Ctrl-Enter",
      run: () => {
        eventTarget.dispatchEvent(new CustomEvent("run-message", { bubbles: true }));
        return true;
      },
    },
  ] as KeyBinding[];
