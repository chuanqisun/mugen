const iconFileMap: Record<string, string> = {
  css: "file_type_css.svg",
  default: "default_file.svg",
  html: "file_type_html.svg",
  js: "file_type_js_official.svg",
  json: "file_type_json.svg",
  jsx: "file_type_reactjs.svg",
  markdown: "file_type_markdown.svg",
  md: "file_type_markdown.svg",
  mermaid: "file_type_mermaid.svg",
  svg: "file_type_svg.svg",
  ts: "file_type_typescript_official.svg",
  tsx: "file_type_reactts.svg",
  txt: "file_type_text.svg",
  yaml: "file_type_yaml.svg",
};

export function getFileIconUrl(filename: string): string {
  const ext = filename.split(".").pop() ?? "";
  const iconFilename = iconFileMap[ext] ?? iconFileMap["default"];
  return `https://esm.sh/gh/vscode-icons/vscode-icons@v12.12.0/icons/${iconFilename}`;
}
