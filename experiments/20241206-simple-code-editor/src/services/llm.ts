import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { BehaviorSubject, distinctUntilChanged, map } from "rxjs";
import { settings$ } from "./settings";

export const claude$: BehaviorSubject<Anthropic> = new BehaviorSubject<Anthropic>(new Anthropic({ apiKey: "", dangerouslyAllowBrowser: true }));
settings$
  .pipe(
    map((settings) => settings.claudeApiKey),
    distinctUntilChanged(),
    map((apiKey) => new Anthropic({ apiKey, dangerouslyAllowBrowser: true }))
  )
  .subscribe(claude$);

export const openai$: BehaviorSubject<OpenAI> = new BehaviorSubject<OpenAI>(new OpenAI({ apiKey: "", dangerouslyAllowBrowser: true }));
settings$
  .pipe(
    map((settings) => settings.openaiApiKey),
    distinctUntilChanged(),
    map((apiKey) => new OpenAI(apiKey))
  )
  .subscribe(openai$);
