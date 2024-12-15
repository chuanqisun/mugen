import { get, set } from "idb-keyval";
import { BehaviorSubject } from "rxjs";
import { getPermissionedHandle } from "./file-utils";

export interface Workspace {
  id: string;
  handle: FileSystemDirectoryHandle;
  lastAccessed: number;
  isCurrent?: boolean;
}

export class WorkspaceService {
  #workspaces = new BehaviorSubject<Workspace[]>([]);

  constructor() {
    this.#init();
  }

  async #init() {
    const workspaces = await this.listWorkspaces();
    this.#workspaces.next(workspaces);
  }

  async add(handle: FileSystemDirectoryHandle) {
    const workspaces: Workspace[] = (await get("workspaces")) ?? [];
    const newWorkspace: Workspace = { id: crypto.randomUUID(), handle, lastAccessed: Date.now() };
    set("workspaces", [...workspaces, newWorkspace]);
    this.#workspaces.next([...workspaces, { ...newWorkspace, isCurrent: true }]);
  }

  async getCurrentWorkspace() {
    const workspaces = await this.listWorkspaces();
    return workspaces.find((w) => w.isCurrent);
  }

  async open(id: string) {
    const workspaces = await this.listWorkspaces();
    const workspace = workspaces.find((w) => w.id === id);
    if (!workspace) return;

    const writableHandle = await getPermissionedHandle(workspace.handle, "readwrite");
    if (!writableHandle) return;

    this.#workspaces.next(workspaces.map((w) => ({ ...w, isCurrent: w.id === id })));

    return writableHandle;
  }

  get workspaces$() {
    return this.#workspaces.asObservable();
  }

  async listWorkspaces() {
    const workspaces: Workspace[] = (await get("workspaces")) ?? [];
    return workspaces;
  }
}
