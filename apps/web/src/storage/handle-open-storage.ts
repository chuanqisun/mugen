import { $, type ParsedActionEvent } from "../utils/dom";

export function handleOpenStorage(e: ParsedActionEvent) {
  if (e.action !== "open-files") return;

  const dialog = $<HTMLDialogElement>("dialog:has(storage-element)")!;
  dialog.showModal();
}
