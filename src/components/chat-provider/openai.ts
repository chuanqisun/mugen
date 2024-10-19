import OpenAI from "openai";
import { map } from "rxjs";
import { $apiKey } from "./auth";

export class ChatProviderElement extends HTMLElement {}
export const $openai = $apiKey.pipe(map((apiKey) => new OpenAI({ apiKey, dangerouslyAllowBrowser: true })));
