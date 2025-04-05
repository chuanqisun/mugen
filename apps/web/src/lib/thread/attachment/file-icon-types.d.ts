declare module "https://esm.sh/gh/vscode-icons/vscode-icons@v12.12.0/src/iconsManifest/supportedExtensions.ts" {
  export const extensions: IFileCollection;
}

enum FileFormat {
  svg,
  png,
  jpg,
  gif,
  bmp,
  tiff,
  ico,
}

interface IFileCollection {
  default: {
    file: {
      icon: string;
      format: FileFormat | string;
    };
  };
  supported: {
    /**
     * name of the icon.
     */
    icon: string;
    /**
     * format of the icon
     */
    format: FileFormat | string;
    /**
     * user customization: if false the extension won't be exported.
     */
    disabled?: boolean;
    /**
     * set this to true if you want to use a bundle icon.
     * This will override the `default` prefix with the one for files or folders.
     */
    useBundledIcon?: boolean;
    /**
     * set of extensions associated to the icon.
     */
    extensions?: string[];
    /**
     * set it to true if the extension support light icons.
     */
    light?: boolean;
    /**
     * user customization: disables the specified extension.
     */
    overrides?: string;
    /**
     * user customization: extends the specified extension.
     */
    extends?: string;
    /**
     * set to true if the extension represents the whole file name.
     */
    filename?: boolean;
    /**
     * collection of languages associated to the icon.
     */
    languages?: ILanguage[];
    /**
     * array of file names to generate with file extensions to associate to the icon.
     */
    filenamesGlob?: string[];
    /**
     * array of file extensions to generate with file names to associate to the icon.
     */
    extensionsGlob?: string[];
  }[];
}

declare module "https://esm.sh/vscode-icons/vscode-icons@v12.12.0/src/iconsManifest/languages.ts" {
  export const languages: Record<string, ILanguage>;
}

interface ILanguage {
  ids: string | string[];
  defaultExtension: string;
}
