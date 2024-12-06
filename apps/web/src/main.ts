import { fromEvent, map, tap } from "rxjs";
import "./index.css";
import { AzureSttElement, defineAzureSttElement } from "./lib/azure-stt-element";
import { toCustomEventDetail } from "./lib/event";
import { defineNodeElement } from "./lib/node-element";
import { defineOpenaiElement } from "./lib/openai-element";
import { $ } from "./lib/query";
import { defineSettingsElement } from "./lib/settings-element";

defineOpenaiElement();
defineSettingsElement();
defineNodeElement();
defineAzureSttElement();

const azureSttElement = $<AzureSttElement>("azure-stt-element")!;
const menuButton = $<HTMLButtonElement>("#menu")!;
const nodes = $<HTMLElement>("#nodes")!;
const dialog = $("dialog")!;

const openDialog$ = fromEvent(menuButton, "click").pipe(tap(() => dialog.showModal()));
const transcribe$ = fromEvent(azureSttElement, "transcription").pipe(map(toCustomEventDetail<string>), tap(console.log));

openDialog$.subscribe();
transcribe$.subscribe();

$("body")?.addEventListener("mousedown", (event) => {
  event.preventDefault();

  const bodyStyles = getComputedStyle(document.body);

  const prevX = parseInt(bodyStyles.getPropertyValue("--x"));
  const prevY = parseInt(bodyStyles.getPropertyValue("--y"));

  const startX = event.clientX;
  const startY = event.clientY;

  const handleMouseMove = (event: MouseEvent) => {
    event.preventDefault();
    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;
    document.body.style.setProperty("--x", `${deltaX + prevX}px`);
    document.body.style.setProperty("--y", `${deltaY + prevY}px`);
  };

  const handleMouseout = (event: MouseEvent) => {
    event.preventDefault();
    $("body")?.removeEventListener("mousemove", handleMouseMove);
    $("body")?.removeEventListener("mouseup", handleMouseUp);
    window.removeEventListener("mouseout", handleMouseout);
  };

  const handleMouseUp = (event: MouseEvent) => {
    event.preventDefault();
    $("body")?.removeEventListener("mousemove", handleMouseMove);
    $("body")?.removeEventListener("mouseup", handleMouseUp);
    window.removeEventListener("mouseleave", handleMouseout);
  };

  $("body")?.addEventListener("mousemove", handleMouseMove);
  $("body")?.addEventListener("mouseup", handleMouseUp, { once: true });
  window.addEventListener("mouseout", handleMouseout, { once: true });
});
