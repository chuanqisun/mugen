export function consumeStringValue<T extends { value: string }>(textareaElement: T): string {
  const value = textareaElement.value;
  if (typeof value !== "string") throw new TypeError("Expected value to be a string");

  textareaElement.value = "";
  return value;
}
