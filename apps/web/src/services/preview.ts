import { BehaviorSubject, map } from "rxjs";

export const $previewPath = new BehaviorSubject<string | null>(null);

export function openPreview(path: string) {
  $previewPath.next(path);
}

export function closePreview() {
  $previewPath.next(null);
}

export const $previewHtml = $previewPath.pipe(
  map((path) => {
    if (!path) return "";
    return `<!DOCTYPE html><html><head></head><body>hello world</body></html>`;
  })
);
