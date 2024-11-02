import Anthropic from "@anthropic-ai/sdk";
import { map } from "rxjs";
import { $apiKey } from "./auth";

export const $openai = $apiKey.pipe(map((apiKey) => new Anthropic({ apiKey, dangerouslyAllowBrowser: true })));
