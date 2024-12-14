import "./style.css";

import { filter, fromEvent, tap } from "rxjs";
import { $ } from "./lib/dom";
import { handleSSEResponse } from "./lib/sse";

const backendHost = "http://localhost:3000";
const stdout = $<HTMLElement>("#stdout")!;
const input = $("textarea")!;

// enter to submit
const submitCommand$ = fromEvent(input, "keydown").pipe(
  filter((e) => (e as KeyboardEvent).key === "Enter"),
  tap((e) => e.preventDefault()),
  tap(() => {
    const command = input.value;

    stdout.innerText += `$ ${command}\n`;

    input.value = "";

    const sse = fetch(`${backendHost}/exec`, {
      method: "POST",
      body: JSON.stringify({ command }),
      headers: {
        "Content-Type": "application/json",
      },
    }).then(handleSSEResponse);

    sse.then(async (events) => {
      for await (const event of events) {
        if (event.data) {
          stdout.innerText += event.data;
          stdout.innerText += "\n";
        }
      }
    });
  })
);

submitCommand$.subscribe();
