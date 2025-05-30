import type { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import type { BaseConnection, BaseCredential, BaseProvider, ChatStreamProxy, GenericChatParams, GenericMessage } from "./base";

export interface OpenAICredential extends BaseCredential {
  id: string;
  type: "openai";
  accountName: string;
  apiKey: string;
}

export interface OpenAIConnection extends BaseConnection {
  id: string;
  type: "openai";
  displayGroup: string;
  displayName: string;
  model: string;
  apiKey: string;
}

export class OpenAIProvider implements BaseProvider {
  static type = "openai";
  static defaultModels = ["gpt-4o", "gpt-4o-mini", "o1-mini"];

  parseNewCredentialForm(formData: FormData): OpenAICredential[] {
    const accountName = formData.get("newAccountName") as string;

    /* YYYYMMDDHHMMSS */
    const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, "");

    return [
      {
        id: crypto.randomUUID(),
        type: "openai",
        accountName: accountName?.length ? accountName : `openai-${timestamp}`,
        apiKey: formData.get("newKey") as string,
      },
    ];
  }

  credentialToConnections(credential: BaseCredential): OpenAIConnection[] {
    if (!this.isOpenAICredential(credential)) throw new Error("Invalid credential type");

    return OpenAIProvider.defaultModels.map(
      (model) =>
        ({
          id: `${model}:${credential.id}`,
          type: "openai",
          displayGroup: credential.accountName,
          displayName: model,
          model,
          apiKey: credential.apiKey,
        }) satisfies OpenAIConnection
    );
  }

  getCredentialSummary(credential: BaseCredential) {
    if (!this.isOpenAICredential(credential)) throw new Error("Invalid credential type");

    return {
      title: credential.accountName,
      tagLine: credential.type,
      features: OpenAIProvider.defaultModels.join(","),
    };
  }

  getChatStreamProxy(connection: BaseConnection): ChatStreamProxy {
    if (!this.isOpenAIConnection(connection)) throw new Error("Invalid connection type");
    const that = this;

    return async function* ({ messages, abortSignal, ...config }: GenericChatParams) {
      const AzureOpenAI = await import("openai").then((res) => res.AzureOpenAI);
      const client = new AzureOpenAI({
        apiKey: connection.apiKey,
        dangerouslyAllowBrowser: true,
      });

      const supportsMaxToken = !connection.model.startsWith("o1");
      const supportsTemperature = !connection.model.startsWith("o1");

      const stream = await client.chat.completions.create({
        stream: true,
        messages: that.getOpenAIMessages(messages),
        model: connection.model,
        temperature: supportsTemperature ? config?.temperature : undefined,
        max_tokens: supportsMaxToken ? config?.maxTokens : undefined,
        top_p: config?.topP,
      });

      for await (const message of stream) {
        const deltaText = message.choices?.at(0)?.delta?.content;
        if (deltaText) yield deltaText;
      }
    };
  }

  private getOpenAIMessages(messages: GenericMessage[]): ChatCompletionMessageParam[] {
    const convertedMessage = messages.map((message) => {
      switch (message.role) {
        case "user":
          return { role: "user", content: message.content };
        case "assistant":
          return { role: "assistant", content: message.content };
        case "system":
          return { role: "system", content: message.content };
        default: {
          console.warn("Unknown message type", message);
          return null;
        }
      }
    });

    return convertedMessage.filter((m) => m !== null) as ChatCompletionMessageParam[];
  }

  private isOpenAICredential(credential: BaseCredential): credential is OpenAICredential {
    return credential.type === "openai";
  }

  private isOpenAIConnection(connection: BaseConnection): connection is OpenAIConnection {
    return connection.type === "openai";
  }
}
