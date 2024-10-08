import fg from "fast-glob";
import fs from "fs/promises";
import path from "path";
import { Plugin } from "vite";

export async function htmlPlugin(): Promise<Plugin> {
  const __dirname = path.resolve(path.dirname(new URL(import.meta.url).pathname));

  // const templateFiles = await fs.readdir(path.join(__dirname, "src/server-elements"));
  const templateFiles = await fg(["../src/elements/**/*.html"], { cwd: __dirname });
  const templateEntries = await Promise.all(
    templateFiles.map(async (file) => {
      const tagName = path.basename(file, ".html");
      const templateHtml = await fs.readFile(path.join(__dirname, file), "utf-8");

      return { tagName, templateHtml };
    })
  );

  console.log(`${templateEntries.length} templates found`);

  const tagNames = templateEntries.map((entry) => `<${entry.tagName}[^>]*>`);
  const anyTagNameRegex = new RegExp(`(${tagNames.join("|")})`, "g");

  function replaceTagNamesInTemplateHtml(templateHtml: string) {
    return templateHtml.replace(anyTagNameRegex, (match) => {
      const templateEntry = templateEntries.find((entry) => new RegExp(`<${entry.tagName}[^>]*>`).test(match));
      if (!templateEntry) return match;
      return `${match}\n${replaceTagNamesInTemplateHtml(templateEntry.templateHtml)}`;
    });
  }

  return {
    name: "html-transform",
    transformIndexHtml(html) {
      return replaceTagNamesInTemplateHtml(html);
    },
  };
}
