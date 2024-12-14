export async function* handleSSEResponse(response: Response) {
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  if (!response.body) {
    throw new Error("response.body is undefined");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break; // value is always undefined is done is true

    // stream: true ensures multi-byte characters are handled correctly
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split(/\r?\n\r?\n/);
    buffer = events.pop() || "";

    for (const event of events) {
      const lines = event.split(/\r?\n/);
      const parsedEvent = {} as Record<string, any>;

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const dataContent = line.slice(6);
          parsedEvent.data = dataContent;
        } else if (line.includes(": ")) {
          const [key, value] = line.split(": ", 2);
          parsedEvent[key] = value;
        }

        if (Object.keys(parsedEvent).length > 0) {
          yield parsedEvent;
        }
      }
    }
  }
}
