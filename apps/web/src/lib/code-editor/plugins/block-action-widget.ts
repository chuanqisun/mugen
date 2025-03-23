import { syntaxTree } from "@codemirror/language";
import { Decoration, EditorView, ViewPlugin, ViewUpdate, WidgetType, type DecorationSet } from "@codemirror/view";
import { $new } from "../../dom";
import "./block-action-widget.css";

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
          switch (action) {
            case "run":
              view.dom.dispatchEvent(new CustomEvent("run-block", { bubbles: true, cancelable: true }));
              break;
            case "copy":
              view.dom.dispatchEvent(new CustomEvent("copy-block", { bubbles: true, cancelable: true }));
              break;
            default:
          }
        }
      },
    },
  },
);

class BlockActionWidget extends WidgetType {
  eq(_other: BlockActionWidget) {
    // command bars are always the same
    return true;
  }

  toDOM(_view: EditorView) {
    return $new("span", { class: "block-actions" }, [
      $new("button", { "data-action": "run" }, ["Run"]),
      $new("button", { "data-action": "copy" }, ["Copy"]),
    ]);
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
        if (node.type.name === "CodeMark" || node.type.name === "CodeInfo") {
          pushSites.push({ name: node.type.name, from: node.from, to: node.to });
        }
      },
    });

    for (let node of pushSites) {
      const nextNode = pushSites[pushSites.indexOf(node) + 1];
      if (node.name === "CodeMark" && nextNode?.name === "CodeInfo" && node.to === nextNode?.from) continue;

      const deco = Decoration.widget({
        widget: new BlockActionWidget(),
        side: 1,
      });

      widgets.push(deco.range(node.to));
    }
  }

  return Decoration.set(widgets);
}
