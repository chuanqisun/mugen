import { BehaviorSubject } from "rxjs";
import { $new } from "./dom";

export type ThreadChangeEventDetail = Document;
export type ObjectsChangeEventDetail = Record<string, File>;

export class Environment extends EventTarget {
  #thread = new DOMParser().parseFromString("<body></body>", "text/html");
  #objects$ = new BehaviorSubject<Record<string, File>>({});

  exec(command: string) {
    const executionId = crypto.randomUUID();
    this.#thread.body.appendChild($new("task-element", { "data-id": executionId }, [$new("user-message", {}, [command])]));
    this.dispatchEvent(new CustomEvent("threadchange", { detail: this.#thread }));
    return executionId;
  }

  async upload() {
    // show file picker
    const [file] = await window.showOpenFilePicker();
    if (file) {
      this.#objects$.next({ ...this.#objects$.value, [file.name]: await file.getFile() });
      this.dispatchEvent(new CustomEvent("objectschange", { detail: this.#objects$.value }));
    }
  }

  clearObjects() {
    this.#objects$.next({});
    this.dispatchEvent(new CustomEvent("objectschange", { detail: this.#objects$.value }));
  }

  appendAssistantResponse(executionId: string, chunk: string) {
    const taskElement = this.#thread.body.querySelector(`task-element[data-id="${executionId}"]`);
    if (!taskElement) {
      console.warn(`Task of id ${executionId} not found`);
      return;
    }

    let assistantMessage = taskElement.querySelector("assistant-message");
    if (!assistantMessage) {
      assistantMessage = $new("assistant-message");
      taskElement.appendChild(assistantMessage);
    }

    assistantMessage.append(chunk);
    this.dispatchEvent(new CustomEvent("threadchange", { detail: this.#thread }));
  }
}
