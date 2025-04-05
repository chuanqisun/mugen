import { extensions } from "https://esm.sh/gh/vscode-icons/vscode-icons@v12.12.0/src/iconsManifest/supportedExtensions.ts";

const supportedLanguageIds = ["html", "markdown", "json", "yaml"];
const withLang = extensions.supported.filter(
  (ext) =>
    ext.languages?.filter((lang) => supportedLanguageIds.some((id) => lang.ids?.includes(id) || lang.ids === id))
      .length,
);
const withoutLang = extensions.supported.filter((ext) => !ext.languages?.length);

export function getFileIconUrl(filename: string): string {
  const ext = filename.split(".").pop();
  let iconFilename = "default_file.svg";

  if (ext) {
    const supported =
      // match default language first
      withLang.find((supportExt) => supportExt.languages?.some((l) => l.defaultExtension === ext)) ??
      // then match support matrix
      withoutLang.find((support) => {
        if (
          (support.filename && support.extensions?.includes(filename)) ||
          support.filenamesGlob?.includes(filename) ||
          support.extensionsGlob?.includes(filename)
        ) {
          return true;
        } else if (
          support.extensions?.some((supportExt) => ext === supportExt) ||
          support.extensionsGlob?.some((supportExt) => ext === supportExt) ||
          support.filenamesGlob?.some((supportExt) => filename === supportExt)
        ) {
          iconFilename = `file_type_${support.icon}.${getIconExtension(support.format)}`;
          return true;
        }
      });

    if (supported) {
      iconFilename = `file_type_${supported.icon}.${getIconExtension(supported.format)}`;
    } else {
      iconFilename = `default_file.svg`;
    }
  }

  return `https://esm.sh/gh/vscode-icons/vscode-icons@v12.12.0/icons/${iconFilename}`;
}

export function getIconExtension(type: number | string): string {
  if (typeof type === "string") return type;

  switch (type) {
    case 0:
      return "svg";
    case 1:
      return "png";
    case 2:
      return "jpg";
    case 3:
      return "gif";
    case 4:
      return "bmp";
    case 5:
      return "tiff";
    case 6:
      return "ico";
    default: {
      throw new Error(`Unknown file type: ${type}`);
    }
  }
}
