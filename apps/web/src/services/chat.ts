import Anthropic from "@anthropic-ai/sdk";
import { BehaviorSubject, map } from "rxjs";
import { $apiKey } from "./auth";

export const $chat: BehaviorSubject<Anthropic> = new BehaviorSubject<Anthropic>(new Anthropic({ apiKey: "", dangerouslyAllowBrowser: true }));
$apiKey.pipe(map((apiKey) => new Anthropic({ apiKey, dangerouslyAllowBrowser: true }))).subscribe($chat);
