import { BehaviorSubject } from "rxjs";

export const $artifacts = new BehaviorSubject<Record<string, EnvironmentItem>>({});

export interface EnvironmentItem {
  path: string;
  content: string;
}

// TODO use content hash to manage artifacts

export function createArtifact(path: string, content: string) {
  const id = crypto.randomUUID();

  $artifacts.next({
    ...$artifacts.value,
    [id]: {
      path,
      content,
    },
  });

  return id;
}

export function appendArtifactContent(id: string, delta: string) {
  const existingArtifact = $artifacts.value[id];
  if (!existingArtifact) throw new Error(`Artifact with id ${id} not found`);

  $artifacts.next({
    ...$artifacts.value,
    [id]: {
      ...existingArtifact,
      content: (existingArtifact?.content ?? "") + delta,
    },
  });
}
