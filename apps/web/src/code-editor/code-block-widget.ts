import { syntaxTree } from "@codemirror/language";
import { Decoration, EditorView, ViewPlugin, ViewUpdate, WidgetType, type DecorationSet } from "@codemirror/view";
import { $new } from "../utils/dom";

export const codeblockPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = blockCommands(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged || syntaxTree(update.startState) != syntaxTree(update.state))
        this.decorations = blockCommands(update.view);
    }
  },
  {
    decorations: (v) => v.decorations,

    eventHandlers: {
      mousedown: (e, view) => {
        let target = e.target as HTMLElement;
        if (target.nodeName == "INPUT" && target.parentElement!.classList.contains("cm-boolean-toggle")) console.log(view, view.posAtDOM(target));
      },
    },
  }
);

class CodeblockWidget extends WidgetType {
  eq(other: CodeblockWidget) {
    // command bars are always the same
    return true;
  }

  toDOM() {
    return $new("span", {}, [$new("button", {}, ["Run"]), $new("button", {}, ["Copy"])]);
  }

  ignoreEvent() {
    return false;
  }
}

function blockCommands(view: EditorView) {
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
        if (node.type.name === "CodeMark" || node.type.name === "CodeInfo") {
          pushSites.push({ name: node.type.name, from: node.from, to: node.to });
        }
      },
    });

    for (let node of pushSites) {
      const nextNode = pushSites[pushSites.indexOf(node) + 1];
      console.log([node, nextNode]);
      if (node.name === "CodeMark" && nextNode?.name === "CodeInfo" && node.to === nextNode?.from) continue;

      const deco = Decoration.widget({
        widget: new CodeblockWidget(),
        side: 1,
      });

      widgets.push(deco.range(node.to));
    }
  }

  return Decoration.set(widgets);
}
