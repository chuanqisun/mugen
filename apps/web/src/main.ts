import { defineSettingsElement } from "./elements/settings-element";
import { defineThreadElement } from "./elements/thread-element";
import { runCommand } from "./services/command";
import { run } from "./services/run";
import { addUserMessage } from "./services/thread";
import { toTargetValueString } from "./utils/event";
import { $ } from "./utils/query";

defineThreadElement();
defineSettingsElement();

$("textarea")?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    const value = toTargetValueString(event).trim();
    (event.target as HTMLTextAreaElement).value = "";

    if (value.startsWith("/")) {
      runCommand(value.slice(1));
    } else {
      const id = addUserMessage(value);
      run(id);
    }
  }
});
