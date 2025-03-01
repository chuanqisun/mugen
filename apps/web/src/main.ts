import { fromEvent, map, tap } from "rxjs";
import { defineCommandFormElement } from "./lib/command-form.element";
import { showDialog } from "./lib/dialog";
import { parseKeyboardShortcut } from "./lib/dom";
import "./style.css";

fromEvent<KeyboardEvent>(document, "keydown")
  .pipe(
    map(parseKeyboardShortcut),
    tap((shortcut) => {
      switch (shortcut?.combo) {
        case "ctrl+p":
          shortcut.event.preventDefault();
          showDialog(`<command-form-element></command-form-element>`);
          break;
      }
    })
  )
  .subscribe();

defineCommandFormElement();
