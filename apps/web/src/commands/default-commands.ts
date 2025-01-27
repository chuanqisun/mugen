import { showDialog } from "../shell/dialog";
import { openWorkspace } from "../storage/workspace";
import type { Command } from "./use-commands";

export const defaultCommands: Command[] = [
  {
    id: "storage.openWorkspace",
    run: () => openWorkspace(),
  },
  {
    id: "ui.openConnectionsDialog",
    run: () => showDialog("<settings-element></settings-element>"),
  },
  {
    id: "ui.openStorageDialog",
    key: "ctrl+o",
    preventDefault: true,
    stopPropagation: true,
    run: () => showDialog("<storage-element></storage-element>"),
  },
  {
    id: "ui.openWorkspaceRecoveryDialog",
    run: () => showDialog("<workspace-recovery-element></workspace-recovery-element>"),
  },
];
