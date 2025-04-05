import { defineCodeEditorElement } from "./lib/code-editor/code-editor-element";
import { $get } from "./lib/dom";
import { useProviderSelector } from "./lib/settings/provider-selector";
import { defineSettingsElement } from "./lib/settings/settings-element";
import { defineFileIconElement } from "./lib/thread/attachment/file-icon-element";
import { defineMessageMenuElement } from "./lib/thread/message-menu-element";
import { createMessage } from "./lib/thread/thread";
import "./style.css";

defineCodeEditorElement();
defineSettingsElement();
defineMessageMenuElement();
defineFileIconElement();

useProviderSelector().subscribe();

// initialize messages
$get("#thread").append(createMessage("system"), createMessage("user"));
