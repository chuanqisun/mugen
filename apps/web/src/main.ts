import "./style.css";

import { defineCodeEditorElement } from "./code-editor/code-editor-element";
import { LlmProvider } from "./llm/llm-provider";
import { defineSettingsElement } from "./settings/settings-element";

defineSettingsElement();
defineCodeEditorElement();

const llm = new LlmProvider();
