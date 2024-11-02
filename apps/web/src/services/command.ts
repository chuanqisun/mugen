import { clearThreadItems } from "./thread";

export function runCommand(command: string) {
  switch (command) {
    case "?":
    case "help": {
      break;
    }
    case "login": {
      document.querySelector<HTMLDialogElement>("#settings-dialog")!.showModal();
      document.querySelector<HTMLInputElement>("#settings-dialog")!.onclose = () => {
        const textarea = document.querySelector("textarea");
        textarea?.blur();
        textarea?.focus();
      };
      break;
    }
    case "clear": {
      clearThreadItems();
      break;
    }
  }
}
