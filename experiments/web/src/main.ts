import { tap } from "rxjs";
import { CodeEditorElement, defineCodeEditorElement } from "./lib/code-editor/code-editor-element";
import { compileApp } from "./lib/compile";
import { $get } from "./lib/dom";
import { handleAction } from "./lib/handle-data-action";
import "./style.css";

defineCodeEditorElement();

handleAction($get("#app-menu"))
  .pipe(
    tap((action) => {
      switch (action.name) {
        case "login": {
          const key = window.prompt("Enter your Anthropic API key");
          if (!key) return;
          localStorage.setItem("mugen:anthropic-api-key", key);
          break;
        }
        case "compile": {
          compileApp($get<CodeEditorElement>(`[data-for="input"]`).value).then((html) => {
            const programIframe = $get<HTMLIFrameElement>("#program");
            programIframe.srcdoc = html;
          });
          break;
        }
        case "run": {
          break;
        }
      }
    }),
  )
  .subscribe();

window.addEventListener("message", (event) => {
  if (event.data.type === "submit") {
    const input = event.data.input;
    console.log(input);
  }
});

async function initTemplate() {
  import("./templates/summarize-keypoints/input.d.ts?raw").then(
    (code) => ($get<CodeEditorElement>(`[data-for="input"]`).value = code.default),
  );
  import("./templates/summarize-keypoints/output.d.ts?raw").then(
    (code) => ($get<CodeEditorElement>(`[data-for="output"]`).value = code.default),
  );
  import("./templates/summarize-keypoints/prompt.liquid?raw").then(
    (code) => ($get<CodeEditorElement>(`[data-for="prompt"]`).value = code.default),
  );
}

initTemplate();

function run(input: any) {
  console.log("let's go");
}
