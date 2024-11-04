import { distinctUntilKeyChanged, filter, fromEvent, map, startWith, switchMap, tap } from "rxjs";
import { CodeEditorElement, defineCodeEditorElement } from "./elements/code-editor/code-editor-element";
import { defineSettingsElement } from "./elements/settings-element";
import { defineSpinnerElement } from "./elements/spinner";
import { defineTabsElement, TabsElement } from "./elements/tabs-element";
import { defineThreadElement } from "./elements/thread-element";
import { $activeFilePath } from "./services/buffer";
import { runCommand } from "./services/command";
import { $fs, writeFileSilent } from "./services/file-system";
import { run } from "./services/run";
import { addUserMessage } from "./services/thread";
import { toCustomEventDetail, toTargetValueString } from "./utils/event";
import { $ } from "./utils/query";

const tabsElement = $<TabsElement>("tabs-element")!;
const codeEditorElement = $<CodeEditorElement>("code-editor-element")!;

defineThreadElement();
defineSettingsElement();
defineCodeEditorElement();
defineTabsElement();
defineSpinnerElement();

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

fromEvent(tabsElement, "openpath")
  .pipe(
    map((event) => toCustomEventDetail<string>(event)),
    startWith("welcome.txt")
  )
  .subscribe($activeFilePath);

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

$activeFilePath
  .pipe(
    filter((path) => path !== null),
    switchMap((path) => {
      // subscribe to changes
      const distinctStreams = $fs.pipe(
        map((fs) => fs[path]),
        distinctUntilKeyChanged("stream"),
        switchMap(({ file, stream }) =>
          stream
            ? stream.pipe(
                tap((update) => {
                  if (update.snapshot === update.delta) {
                    codeEditorElement.loadText(update.snapshot);
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
