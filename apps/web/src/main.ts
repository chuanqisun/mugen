import { defineThreadElement } from "./elements/thread-element";
import { $thread, addUserMessage } from "./services/thread";
import { $ } from "./utils/query";

defineThreadElement();

$("textarea")?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    const id = addUserMessage($thread, (event.target as HTMLTextAreaElement).value);
    (event.target as HTMLTextAreaElement).value = "";
  }
});
