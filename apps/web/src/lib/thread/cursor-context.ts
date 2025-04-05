export interface CodeBlockResult {
  lang: string;
  code: string;
  innerCodeStart: number;
  innerCodeEnd: number;
}

/**
 * Requirement:
 * - The opening Triple backtick code mark must contain lang name. e.g. ```js is valid, ``` is invalid opening.
 * - The closing Triple backtick is just ```
 * - Code mark MUST be at the beginning of a line
 * - If the selected text contains opening/closing of code mark at the beginning of some line return null
 * - From the selected text, search backward to find the closest opening code mark. If encountered closing code mark, return null
 * - From the selected text, search forward to find the closest closing code mark. If encountered opening code mark, return
 */
export function getCodeBlockAtCurosr(
  doc: string,
  selectionStart: number,
  selectionEnd: number,
): CodeBlockResult | null {
  // Check if selection contains any code block markers
  const selectedText = doc.substring(selectionStart, selectionEnd);
  const lines = selectedText.split("\n");

  for (const line of lines) {
    if (line.trimStart() === line && line.startsWith("```")) {
      // Selection contains a code block marker at the beginning of a line
      return null;
    }
  }

  // Find the opening code mark by searching backward
  let openingIndex = selectionStart;
  let openingLine = "";
  let foundOpening = false;

  while (openingIndex > 0 && !foundOpening) {
    // Find the start of the current line
    const lineStart = doc.lastIndexOf("\n", openingIndex - 1) + 1;
    const currentLine = doc.substring(
      lineStart,
      doc.indexOf("\n", lineStart) !== -1 ? doc.indexOf("\n", lineStart) : doc.length,
    );

    if (currentLine.startsWith("```") && currentLine.length > 3) {
      // Found valid opening with language
      openingLine = currentLine;
      openingIndex = lineStart;
      foundOpening = true;
    } else if (currentLine.startsWith("```")) {
      // Found invalid opening (no language)
      return null;
    } else if (currentLine === "```") {
      // Found a closing mark while searching backward
      return null;
    } else {
      // Continue searching backward
      openingIndex = lineStart - 1;
    }
  }

  if (!foundOpening) {
    return null;
  }

  // Extract language from opening line
  const lang = openingLine.substring(3).trim();

  // Find the closing code mark by searching forward
  let closingIndex = selectionEnd;
  let foundClosing = false;

  while (closingIndex < doc.length && !foundClosing) {
    // Find the start of the current line
    const lineStart = doc.indexOf("\n", closingIndex) !== -1 ? doc.indexOf("\n", closingIndex) + 1 : doc.length;

    if (lineStart >= doc.length) {
      break;
    }

    const lineEnd = doc.indexOf("\n", lineStart) !== -1 ? doc.indexOf("\n", lineStart) : doc.length;
    const currentLine = doc.substring(lineStart, lineEnd);

    if (currentLine === "```") {
      // Found closing mark
      closingIndex = lineStart;
      foundClosing = true;
    } else if (currentLine.startsWith("```")) {
      // Found another opening mark while searching forward
      return null;
    } else {
      // Continue searching forward
      closingIndex = lineEnd + 1;
    }
  }

  if (!foundClosing) {
    return null;
  }

  // Extract the code content
  const codeStartIndex = openingIndex + openingLine.length + 1;
  const codeEndIndex = closingIndex - 1;
  const code = doc.substring(codeStartIndex, codeEndIndex);

  return {
    lang,
    code,
    innerCodeStart: codeStartIndex,
    innerCodeEnd: codeEndIndex,
  };
}
