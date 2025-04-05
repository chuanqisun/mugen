const iconFileMap: Record<string, string> = {
  avif: "file_type_image.svg",
  bash: "file_type_shell.svg",
  css: "file_type_css.svg",
  default: "default_file.svg",
  gif: "file_type_image.svg",
  html: "file_type_html.svg",
  jpeg: "file_type_image.svg",
  jpg: "file_type_image.svg",
  js: "file_type_js_official.svg",
  json: "file_type_json.svg",
  jsx: "file_type_reactjs.svg",
  markdown: "file_type_markdown.svg",
  md: "file_type_markdown.svg",
  mermaid: "file_type_mermaid.svg",
  mp3: "file_type_audio.svg",
  mp4: "file_type_video.svg",
  ogg: "file_type_audio.svg",
  pdf: "file_type_pdf.svg",
  png: "file_type_image.svg",
  sh: "file_type_shell.svg",
  svg: "file_type_svg.svg",
  ts: "file_type_typescript_official.svg",
  tsx: "file_type_reactts.svg",
  txt: "file_type_text.svg",
  wav: "file_type_audio.svg",
  webm: "file_type_video.svg",
  webp: "file_type_image.svg",
  xml: "file_type_xml.svg",
  yaml: "file_type_yaml.svg",
};

export function getFileIconUrl(filename: string): string {
  const ext = filename.split(".").pop() ?? "";
  const iconFilename = iconFileMap[ext] ?? iconFileMap["default"];
  return `https://esm.sh/gh/vscode-icons/vscode-icons@v12.12.0/icons/${iconFilename}`;
}
