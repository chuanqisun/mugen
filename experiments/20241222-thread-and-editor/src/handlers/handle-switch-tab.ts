import { $all, type ParsedActionEvent } from "../utils/dom";

export function handleSwitchTab(e: ParsedActionEvent) {
  if (e.action !== "switch-tab") return;

  const targetTab = e.trigger?.getAttribute("data-target");
  if (!targetTab) return;
  const [tabGroup, tabItem] = targetTab.split(":");

  // select all items that has data-tab attribute start with ${tabGroup}:
  const tabItems = $all(`[data-tab^="${tabGroup}"]`);
  tabItems.forEach((item) => item.toggleAttribute("hidden", item.getAttribute("data-tab") !== targetTab));
}
