import { handleOpenMenu } from "../settings/handle-open-menu";
import { handleOpenStorage } from "../storage/handle-open-storage";
import { openWorkspace } from "../storage/workspace";

export interface Command {
  id: string;
  key?: string;
  preventDefault?: boolean;
  stopPropagation?: boolean;
  run: () => any;
}

const rawCommands: Command[] = [
  {
    id: "storage.openDirectory",
    key: "ctrl+o",
    preventDefault: true,
    stopPropagation: true,
    run: () => openWorkspace(),
  },
  {
    id: "ui.openConnectionsDialog",
    run: () => handleOpenMenu(),
  },
  {
    id: "ui.openStorageDialog",
    run: () => handleOpenStorage(),
  },
];

export const keyboardCommands = new Map<string, Command>(rawCommands.filter((c) => c.key).map((c) => [c.key!, c]));
export const allCommands = new Map<string, Command>(rawCommands.map((c) => [c.id, c]));
