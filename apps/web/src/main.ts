import { fromEvent, map, tap } from "rxjs";
import "./index.css";
import { AzureSttElement, defineAzureSttElement } from "./lib/azure-stt-element";
import { toCustomEventDetail } from "./lib/event";
import { defineOpenaiElement } from "./lib/openai-element";
import { $ } from "./lib/query";
import { defineSettingsElement } from "./lib/settings-element";

defineOpenaiElement();
defineSettingsElement();
defineAzureSttElement();

const azureSttElement = $<AzureSttElement>("azure-stt-element")!;

const menuButton = $<HTMLButtonElement>("#menu")!;
const dialog = $("dialog")!;

const openDialog$ = fromEvent(menuButton, "click").pipe(tap(() => dialog.showModal()));

const transcribe$ = fromEvent(azureSttElement, "transcription").pipe(map(toCustomEventDetail<string>), tap(console.log));

openDialog$.subscribe();
transcribe$.subscribe();

$("body")?.addEventListener("mousedown", (event) => {
  azureSttElement.start();
});
$("body")?.addEventListener("mouseup", (event) => {
  azureSttElement.stop();
});
