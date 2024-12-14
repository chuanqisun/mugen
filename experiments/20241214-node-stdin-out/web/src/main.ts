import "./style.css";

import { concatMap, filter, fromEvent, tap } from "rxjs";
import { fromFetch } from "rxjs/fetch";
import { $ } from "./lib/dom";
import { handleSSEResponse } from "./lib/sse";

const backendHost = "http://localhost:3000";
const stdout = $<HTMLElement>("#stdout")!;
const input = $("textarea")!;

// subscribe to stdout
const stdout$ = fromFetch(`${backendHost}/stdout`).pipe(
  concatMap(handleSSEResponse),
  tap((event) => {
    if (event.data) {
      stdout.innerText += event.data;
      stdout.innerText += "\n";
    }
  })
);

// enter to submit
const stdin$ = fromEvent(input, "keydown").pipe(
  filter((e) => (e as KeyboardEvent).key === "Enter"),
  tap((e) => e.preventDefault()),
  tap(() => {
    const command = `${input.value}\n`;
    stdout.innerText += `$ ${command}`;
    input.value = "";

    fetch(`${backendHost}/stdin`, {
      method: "POST",
      body: JSON.stringify({ command }),
      headers: {
        "Content-Type": "application/json",
      },
    });
  })
);

stdout$.subscribe();
stdin$.subscribe();
