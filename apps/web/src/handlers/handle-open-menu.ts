import { $, type ParsedActionEvent } from "../lib/dom";

export function handleOpenMenu(e: ParsedActionEvent) {
  if (e.action !== "open-menu") return;

  const dialog = $("dialog")!;
  dialog.showModal();
}
