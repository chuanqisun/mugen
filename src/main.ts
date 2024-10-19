import OpenAI from "openai";
import { $apiKey } from "./lib/auth";

import { useOptionsDialog } from "./components/options-dialog";
import "./main.css";

/* Define web components */
useOptionsDialog();

const openai = new OpenAI({ apiKey: $apiKey.value, dangerouslyAllowBrowser: true });
