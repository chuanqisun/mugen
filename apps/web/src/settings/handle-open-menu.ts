import { $ } from "../utils/dom";

export function handleOpenMenu() {
  const dialog = $<HTMLDialogElement>("dialog:has(settings-element)")!;
  dialog.showModal();
}
