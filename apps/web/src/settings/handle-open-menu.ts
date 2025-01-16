import { $, type ParsedActionEvent } from "../utils/dom";

export function handleOpenMenu(e: ParsedActionEvent) {
  if (e.action !== "open-menu") return;

  const dialog = $<HTMLDialogElement>("dialog:has(settings-element)")!;
  dialog.showModal();
}
