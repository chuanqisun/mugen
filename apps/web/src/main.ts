import { defineThreadElement, ThreadElement } from "./elements/thread-element";
import { $ } from "./utils/query";

defineThreadElement();

$("textarea")?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();

    $<ThreadElement>("thread-element")?.appendUserMessage((event.target as HTMLTextAreaElement).value);
    (event.target as HTMLTextAreaElement).value = "";
  }
});
