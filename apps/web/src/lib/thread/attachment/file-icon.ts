const iconFileMap: Record<string, string> = {
  js: "file_type_js_official.svg",
  jsx: "file_type_js_official.svg",
  ts: "file_type_js_official.svg",
  tsx: "file_type_js_official.svg",
  html: "file_type_html.svg",
  json: "file_type_json.svg",
  yaml: "file_type_yaml.svg",
  md: "file_type_markdown.svg",
  markdown: "file_type_markdown.svg",
  txt: "file_type_text.svg",
  default: "default_file.svg",
};

export function getFileIconUrl(filename: string): string {
  const ext = filename.split(".").pop() ?? "";
  const iconFilename = iconFileMap[ext] ?? iconFileMap["default"];
  return `https://esm.sh/gh/vscode-icons/vscode-icons@v12.12.0/icons/${iconFilename}`;
}
