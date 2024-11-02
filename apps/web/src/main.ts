import { defineSettingsElement } from "./elements/settings-element";
import { defineThreadElement } from "./elements/thread-element";
import { runCommand } from "./services/command";
import { run } from "./services/run";
import { $thread, addUserMessage } from "./services/thread";
import { toTargetValueString } from "./utils/event";
import { $ } from "./utils/query";

defineThreadElement();
defineSettingsElement();

$("textarea")?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    const value = toTargetValueString(event).trim();
    if (value.startsWith("/")) {
      runCommand(value.slice(1));
    } else {
      const id = addUserMessage($thread, toTargetValueString(event));
      (event.target as HTMLTextAreaElement).value = "";
      run(id);
    }
  }
});
