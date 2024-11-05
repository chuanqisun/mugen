import { BehaviorSubject, switchMap } from "rxjs";
import { readFile } from "./file-system";

export const $previewPath = new BehaviorSubject<string | null>(null);

export function openPreview(path: string) {
  $previewPath.next(path);
}

export function closePreview() {
  $previewPath.next(null);
}

export const $previewHtml = $previewPath.pipe(
  switchMap(async (path) => {
    if (!path) return null;

    const entryType = path.split(".").pop();
    switch (entryType) {
      case "html": {
        return readFile(path).then((virtualFile) => virtualFile.file.text());
      }

      default: {
        return readFile(path).then(
          async (virtualFile) => `<doctype html><html><head><title>${path}</title></head><body><pre>${await virtualFile.file.text()}</pre></body></html>`
        );
      }
    }
  })
);
