export function runCommand(command: string) {
  switch (command) {
    case "?":
    case "help": {
      break;
    }
    case "login": {
      document.querySelector<HTMLDialogElement>("#settings-dialog")!.showModal();
      break;
    }
  }
}
