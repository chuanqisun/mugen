import { BehaviorSubject } from "rxjs";

export interface Settings {
  claudeApiKey: string;
  openaiApiKey: string;
}

const initialSettings: Record<string, any> = getInitialSettings();

function getInitialSettings() {
  try {
    return JSON.parse(localStorage.getItem("settings") || "{}");
  } catch {
    return {};
  }
}

export const settings$ = new BehaviorSubject(initialSettings);

export function setSettings(settings: Record<string, any>) {
  localStorage.setItem("settings", JSON.stringify(settings));
  settings$.next(settings);
}
