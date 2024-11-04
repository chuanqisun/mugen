import { defineCodeEditorElement } from "./elements/code-editor/code-editor-element";
import { defineSettingsElement } from "./elements/settings-element";
import { defineSpinnerElement } from "./elements/spinner";
import { defineTabsElement } from "./elements/tabs-element";
import { defineThreadElement } from "./elements/thread-element";
import { runCommand } from "./services/command";
import { run } from "./services/run";
import { addUserMessage } from "./services/thread";
import { toTargetValueString } from "./utils/event";
import { $ } from "./utils/query";

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

// debug only
// $fs.subscribe((a) => {
//   const artifacts = Object.values(a);

//   render(
//     repeat(
//       artifacts,
//       (artifact) => artifact.path,
//       (artifact) => html`
//         <h2>${artifact.path}</h2>
//         <pre><code>${artifact.file.size}</code></pre>
//       `
//     ),
//     document.querySelector("main")!
//   );

//   console.log({ artifacts: a });
// });
