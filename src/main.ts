import OpenAI from "openai";
import { useMenu } from "./components/use-menu";
import { $apiKey } from "./lib/auth";

import { useChatInput } from "./components/chat-input/use-chat-input";
import { defineTaskElement } from "./components/thread/task-element";
import { useThread } from "./components/thread/use-thread";
import "./main.css";

defineTaskElement();

useMenu();
const { $submission } = useChatInput();
useThread({ newMessage: $submission });

const openai = new OpenAI({ apiKey: $apiKey.value, dangerouslyAllowBrowser: true });
