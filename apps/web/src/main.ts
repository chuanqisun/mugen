import { distinctUntilKeyChanged, filter, fromEvent, map, of, share, startWith, switchMap, takeUntil, tap } from "rxjs";
import { CodeEditorElement, defineCodeEditorElement } from "./elements/code-editor/code-editor-element";
import { definePreviewElement, PreviewElement } from "./elements/preview-element";
import { defineSettingsElement } from "./elements/settings-element";
import { defineSpinnerElement } from "./elements/spinner";
import { defineTabsElement, TabsElement } from "./elements/tabs-element";
import { defineThreadElement } from "./elements/thread-element";
import { $activeFilePath } from "./services/buffer";
import { run } from "./services/chat";
import { $fs, writeFileSilent } from "./services/file-system";
import { $previewHtml, $previewPath, closePreview, openPreview } from "./services/preview";
import { $globalShortcut } from "./services/shortcut";
import { $autoOpenPaths } from "./services/tab";
import { addUserMessage, clearThreadItems } from "./services/thread";
import { preventDefault, toCustomEventDetail, toTargetValueString } from "./utils/event";
import { $ } from "./utils/query";

const tabsElement = $<TabsElement>("tabs-element")!;
const codeEditorElement = $<CodeEditorElement>("code-editor-element")!;
const settingsDialogElement = $<HTMLDialogElement>("#settings-dialog")!;
const previewElement = $<PreviewElement>("preview-element")!;
const previewContainer = $<HTMLElement>("#preview-container")!;
const closePreviewButton = $<HTMLButtonElement>("#close-preview")!;

defineThreadElement();
defineSettingsElement();
defineCodeEditorElement();
defineTabsElement();
defineSpinnerElement();
definePreviewElement();

$("textarea")?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    const value = toTargetValueString(event).trim();
    (event.target as HTMLTextAreaElement).value = "";

    if (value.startsWith("/")) {
      runCommand(value.slice(1));
    } else {
      const id = addUserMessage(value);
      run(id);
    }
  }
});

$globalShortcut
  .pipe(
    filter(({ combo }) => combo === "Ctrl+KeyK"),
    tap((e) => preventDefault(e.event)),
    tap(() => $("textarea")!.focus())
  )
  .subscribe();

const $manualOpenTab = fromEvent(tabsElement, "openpath").pipe(
  map((event) => toCustomEventDetail<string>(event)),
  tap((path) => $activeFilePath.next(path)),
  share()
);
$manualOpenTab.subscribe();

fromEvent(codeEditorElement, "change")
  .pipe(
    tap((event) => {
      const value = toCustomEventDetail<string>(event);
      const path = $activeFilePath.value;
      if (!path) return;
      writeFileSilent(path, value);
    })
  )
  .subscribe();

fromEvent(closePreviewButton, "click").pipe(tap(closePreview)).subscribe();

$autoOpenPaths
  .pipe(
    startWith(of("welcome.txt")),
    switchMap(($path) => $path.pipe(takeUntil($manualOpenTab)))
  )
  .subscribe($activeFilePath);

$activeFilePath
  .pipe(
    filter((path) => path !== null),
    switchMap((path) => {
      const distinctStreams = $fs.pipe(
        map((fs) => fs[path]),
        distinctUntilKeyChanged("stream"),
        switchMap(({ file, stream }) =>
          stream
            ? stream.pipe(
                tap((update) => {
                  if (update.snapshot === update.delta) {
                    codeEditorElement.loadText(file.name, update.snapshot);
                  } else {
                    codeEditorElement.appendText(update.delta);
                  }
                })
              )
            : codeEditorElement.loadFile(file)
        )
      );

      return distinctStreams;
    })
  )
  .subscribe();

$previewPath
  .pipe(
    tap((path) => {
      previewContainer.dataset.active = path ? "true" : "false";
    })
  )
  .subscribe();

$previewHtml
  .pipe(
    filter(Boolean),
    tap((html) => previewElement.renderHTML(html))
  )
  .subscribe();

function runCommand(command: string) {
  switch (command) {
    case "clear": {
      clearThreadItems();
      break;
    }
    case "?":
    case "help": {
      break;
    }
    case "login": {
      settingsDialogElement.showModal();
      settingsDialogElement.onclose = () => {
        const textarea = document.querySelector("textarea");
        textarea?.blur();
        textarea?.focus();
      };
      break;
    }
    case "preview": {
      const activePath = $activeFilePath.value;
      if (!activePath) return;
      openPreview(activePath);
      break;
    }
  }
}
