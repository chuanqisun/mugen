import { $ } from "../utils/dom";

export function handleOpenStorage() {
  const dialog = $<HTMLDialogElement>("dialog:has(storage-element)")!;
  dialog.showModal();
}
