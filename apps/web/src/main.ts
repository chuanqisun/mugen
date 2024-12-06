import { fromEvent, tap } from "rxjs";
import "./index.css";
import { defineOpenaiElement } from "./lib/openai-element";
import { $ } from "./lib/query";
import { defineSettingsElement } from "./lib/settings-element";

defineOpenaiElement();
defineSettingsElement();

const menuButton = $<HTMLButtonElement>("#menu")!;
const dialog = $("dialog")!;

const openDialog$ = fromEvent(menuButton, "click").pipe(tap(() => dialog.showModal()));

openDialog$.subscribe();
