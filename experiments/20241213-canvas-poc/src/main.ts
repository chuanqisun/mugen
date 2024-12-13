import { fromEvent, map, tap } from "rxjs";
import "./index.css";
import { AzureSttElement, defineAzureSttElement, type TranscriptionEventDetail } from "./lib/azure-stt-element";
import { toCustomEventDetail } from "./lib/event";
import { defineNodeElement, NodeElement } from "./lib/node-element";
import { defineOpenaiElement } from "./lib/openai-element";
import { $, $new } from "./lib/query";
import { defineSettingsElement } from "./lib/settings-element";

defineOpenaiElement();
defineSettingsElement();
defineNodeElement();
defineAzureSttElement();

const azureSttElement = $<AzureSttElement>("azure-stt-element")!;
const menuButton = $<HTMLButtonElement>("#menu")!;
const nodes = $<HTMLElement>("#nodes")!;
const dialog = $("dialog")!;
const body = document.body;

const openDialog$ = fromEvent(menuButton, "click").pipe(tap(() => dialog.showModal()));
const transcribe$ = fromEvent(azureSttElement, "transcription").pipe(
  map(toCustomEventDetail<TranscriptionEventDetail>),
  tap((detail) => {
    const { id, text } = detail;
    const node = $<HTMLElement>(`[task-id="${id}"]`);
    if (!node) return;

    if (!text) {
      node.remove();
      return;
    }

    node.textContent = text;
  })
);

openDialog$.subscribe();
transcribe$.subscribe();

document.addEventListener("keydown", async (event) => {
  if (event.code === "Space") {
    const id = await azureSttElement.start();
    if (!id) return;

    // drop in the center of the viewport

    const bodyStyles = getComputedStyle(document.body);
    const prevX = parseInt(bodyStyles.getPropertyValue("--x"));
    const prevY = parseInt(bodyStyles.getPropertyValue("--y"));
    const { width, height } = body.getBoundingClientRect();

    nodes.append(
      $new<NodeElement>("node-element", {
        "task-id": id.toString(),
        style: `--x: ${width / 2 - prevX}px; --y: ${height / 2 - prevY}px;`,
      })
    );
  }
});

document.addEventListener("keyup", (event) => {
  if (event.code === "Space") {
    azureSttElement.stop();
  }
});

body.addEventListener("mousedown", async (event) => {
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
    body.removeEventListener("mousemove", handleMouseMove);
    body.removeEventListener("mouseup", handleMouseUp);
    window.removeEventListener("mouseout", handleMouseout);
  };

  const handleMouseUp = (event: MouseEvent) => {
    event.preventDefault();
    body.removeEventListener("mousemove", handleMouseMove);
    body.removeEventListener("mouseup", handleMouseUp);
    window.removeEventListener("mouseleave", handleMouseout);
  };

  body.addEventListener("mousemove", handleMouseMove);
  body.addEventListener("mouseup", handleMouseUp, { once: true });
  window.addEventListener("mouseout", handleMouseout, { once: true });
});
