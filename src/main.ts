import { useChatInput } from "./components/chat-input/use-chat-input";
import { defineTaskElement } from "./components/thread/task-element";
import { useThread } from "./components/thread/use-thread";
import { useMenu } from "./components/use-menu";

import "./main.css";

defineTaskElement();

useMenu();
const { $submission } = useChatInput();
useThread({ newMessage: $submission });
