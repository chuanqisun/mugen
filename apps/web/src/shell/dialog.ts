import { $ } from "../utils/dom";

export function showDialog(html: string) {
  const dialogElement = $<HTMLDialogElement>("#app-dialog")!;
  dialogElement!.innerHTML = html;
  dialogElement.addEventListener("close", () => (dialogElement.innerHTML = ""), { once: true });
  dialogElement.showModal();
}
