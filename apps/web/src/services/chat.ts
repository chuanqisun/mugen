import Anthropic from "@anthropic-ai/sdk";
import { map } from "rxjs";
import { $apiKey } from "./auth";

export const $client = $apiKey.pipe(map((apiKey) => new Anthropic({ apiKey, dangerouslyAllowBrowser: true })));
