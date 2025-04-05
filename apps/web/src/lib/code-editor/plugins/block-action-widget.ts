import { syntaxTree } from "@codemirror/language";
import { Decoration, EditorView, ViewPlugin, ViewUpdate, WidgetType, type DecorationSet } from "@codemirror/view";
import { $new } from "../../dom";
import "./block-action-widget.css";

export interface BlockEventInit {
  code: string;
  blockStart: number;
  blockEnd: number;
  codeStart: number;
  codeEnd: number;
  lang: string;
}

export const blockActionPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = actionBarDecorationSet(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged || syntaxTree(update.startState) != syntaxTree(update.state))
        this.decorations = actionBarDecorationSet(update.view);
    }
  },
  {
    decorations: (v) => v.decorations,

    eventHandlers: {
      click: (e, view) => {
        // TODO emit the block lang and text content
        const trigger = (e.target as HTMLElement).closest(`[data-action]`);
        if (trigger) {
          const action = trigger.getAttribute("data-action");
          e.stopPropagation();

          const from = parseInt(trigger!.closest("[data-from]")!.getAttribute("data-from")!);
          const to = parseInt(trigger!.closest("[data-to]")!.getAttribute("data-to")!);
          // the content of [from, to] can be either the opening ``` or the lang + attribute string
          const blockStart = Math.max(0, from - 3);
          const remaintingDoc = view.state.sliceDoc(blockStart);
          const markdownBlockPattern = /```(?:[^\n]*)\n([\s\S]*?)```/;
          // if no match, use rest of the document
          const content = remaintingDoc.match(markdownBlockPattern)?.[1] ?? view.state.sliceDoc(to + 1);
          const lang = view.state.sliceDoc(from, to).trim();
          const resolvedLang = lang === "```" ? "txt" : lang.split(" ")[0].trim();

          // code start is the first line below opening ```
          const codeStartWithInBlock = remaintingDoc.indexOf("\n", 3) + 1;
          const maybeBacktickIndex = remaintingDoc.indexOf("```", codeStartWithInBlock);
          const codeEndWithInBlock = maybeBacktickIndex === -1 ? remaintingDoc.length : maybeBacktickIndex;
          const blockEndWithInBlock = maybeBacktickIndex === -1 ? remaintingDoc.length : maybeBacktickIndex + 3;
          const codeStart = blockStart + codeStartWithInBlock;
          const codeEnd = blockStart + codeEndWithInBlock;
          const blockEnd = blockStart + blockEndWithInBlock;

          switch (action) {
            case "run":
              view.dom.dispatchEvent(
                new CustomEvent<BlockEventInit>("block-run", {
                  detail: { code: content, blockStart, blockEnd, codeStart, codeEnd, lang: resolvedLang },
                  bubbles: true,
                  cancelable: true,
                }),
              );
              break;
            case "copy":
              view.dom.dispatchEvent(
                new CustomEvent<BlockEventInit>("block-copy", {
                  detail: { code: content, blockStart, blockEnd, codeStart, codeEnd, lang: resolvedLang },
                  bubbles: true,
                  cancelable: true,
                }),
              );
              break;
            default:
          }
        }
      },
    },
  },
);

class BlockActionWidget extends WidgetType {
  constructor(
    private from: number,
    private to: number,
  ) {
    super();
  }

  toDOM(_view: EditorView) {
    return $new("span", { class: "block-actions", "data-from": this.from.toString(), "data-to": this.to.toString() }, [
      $new("button", { "data-action": "run" }, ["Run"]),
      $new("button", { "data-action": "copy" }, ["Copy"]),
    ]);
  }

  eq(widget: WidgetType): boolean {
    if (!(widget instanceof BlockActionWidget)) return false;
    return this.from === widget.from && this.to === widget.to;
  }

  ignoreEvent() {
    return false;
  }
}

function actionBarDecorationSet(view: EditorView) {
  let widgets = [] as any[];
  for (let { from, to } of view.visibleRanges) {
    const pushSites = [] as { name: string; from: number; to: number }[];
    let isInBlock = false;
    syntaxTree(view.state).iterate({
      from,
      to,
      enter: (node) => {
        if (node.type.name === "CodeMark" && isInBlock) return;
        if (node.type.name === "CodeMark" && node.to - node.from !== 3) return;
        if (node.type.name === "CodeMark") isInBlock = true;
        if (node.type.name === "CodeInfo") {
          pushSites.push({ name: node.type.name, from: node.from, to: node.to });
        }
      },
    });

    for (let node of pushSites) {
      const nextNode = pushSites[pushSites.indexOf(node) + 1];
      if (node.name === "CodeMark" && nextNode?.name === "CodeInfo" && node.to === nextNode?.from) continue;

      const deco = Decoration.widget({ widget: new BlockActionWidget(node.from, node.to), side: 1 });

      widgets.push(deco.range(node.to));
    }
  }

  return Decoration.set(widgets);
}
