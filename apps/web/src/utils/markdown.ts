export interface MarkdownBlockParserOptions {
  onText?: (text: string, context: TextContext) => void;
  onOpenBlock?: (info: BlockInfo) => void;
  onCloseBlock?: (info: BlockInfo) => void;
  onDone?: () => void;
}

export interface TextContext {
  block?: BlockInfo;
}

export interface BlockInfo {
  language: string;
  attributes: Record<string, string>;
}

export class MarkdownBlockParser {
  private currentBlock: BlockInfo | null = null;
  private buffer: string = "";
  private lineBuffer: string = "";

  constructor(private options: MarkdownBlockParserOptions) {}

  write(text: string) {
    this.lineBuffer += text;
    let newlineIndex: number;

    while ((newlineIndex = this.lineBuffer.indexOf("\n")) !== -1) {
      const line = this.lineBuffer.slice(0, newlineIndex);
      this.processLine(line);
      this.lineBuffer = this.lineBuffer.slice(newlineIndex + 1);
    }
  }

  close() {
    if (this.lineBuffer) {
      this.processLine(this.lineBuffer);
      this.lineBuffer = "";
    }
    if (this.buffer) {
      this.flushText();
    }
    if (this.currentBlock) {
      this.closeBlock();
    }
    this.options.onDone?.();
  }

  private processLine(line: string) {
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith("```")) {
      this.handleCodeBlock(trimmedLine);
    } else {
      this.buffer += line + "\n";
      this.flushText();
    }
  }

  private handleCodeBlock(line: string) {
    if (this.currentBlock) {
      // Closing the current block
      this.flushText();
      this.closeBlock();
    } else {
      // Opening a new block
      this.flushText();
      this.openBlock(line);
    }
  }

  private openBlock(line: string) {
    const info = this.parseBlockInfo(line);
    this.currentBlock = info;
    this.options.onOpenBlock?.(info);
  }

  private closeBlock() {
    if (this.currentBlock) {
      this.options.onCloseBlock?.(this.currentBlock);
    }
    this.currentBlock = null;
  }

  private flushText() {
    if (this.buffer) {
      this.options.onText?.(this.buffer, { block: this.currentBlock ?? undefined });
    }
    this.buffer = "";
  }

  private parseBlockInfo(line: string): BlockInfo {
    const parts = line.slice(3).trim().split(" ");
    const type = parts.shift() || "";
    const attributes: Record<string, string> = {};

    parts.forEach((part) => {
      const [key, value] = part.split("=");
      if (key) {
        attributes[key] = value ? value.replace(/['"]/g, "") : "";
      }
    });

    return { language: type, attributes };
  }
}
