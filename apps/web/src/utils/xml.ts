/**
 * Escapes HTML entities in a string
 * ref: https://stackoverflow.com/questions/7918868/how-to-escape-xml-entities-in-javascript
 */
export function escapeXml(unsafe: string) {
  return unsafe.replace(/[<>&'"]/g, (c: string) => {
    switch (c as "<" | ">" | "&" | "'" | '"') {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
    }
  });
}
