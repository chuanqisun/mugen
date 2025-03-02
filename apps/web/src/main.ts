import { fromEvent, map, tap } from "rxjs";
import { parseKeyboardShortcut } from "./lib/dom";
import "./style.css";

fromEvent<KeyboardEvent>(document, "keydown")
  .pipe(
    map(parseKeyboardShortcut),
    tap((shortcut) => {
      switch (shortcut?.combo) {
        case "ctrl+p":
          shortcut.event.preventDefault();
          break;
      }
    })
  )
  .subscribe();
