import Anthropic from "@anthropic-ai/sdk";

export function getAnthropic() {
  const anthropic = new Anthropic({
    dangerouslyAllowBrowser: true,
    apiKey: localStorage.getItem("mugen:anthropic-api-key"),
  });

  return anthropic;
}
