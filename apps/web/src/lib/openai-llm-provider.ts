import { AzureOpenAI, OpenAI } from "openai";
import { $ } from "./dom";
import { SettingsElement } from "./settings-element";

export class OpenAILLMProvider extends EventTarget {
  getClient(provider: "aoai" | "openai" = "aoai") {
    const settings = $<SettingsElement>("settings-element")?.settings;
    if (!settings) throw new Error("Settings not found");

    if (provider === "aoai") {
      const client = new AzureOpenAI({
        apiKey: settings.aoaiApiKey,
        endpoint: settings.aoaiEndpoint,
        apiVersion: "2024-10-21", // ref: https://learn.microsoft.com/en-us/azure/ai-services/openai/reference
        dangerouslyAllowBrowser: true,
      });

      return client;
    } else {
      const client = new OpenAI({
        apiKey: settings.openaiApiKey,
        dangerouslyAllowBrowser: true,
      });

      return client;
    }
  }
}
