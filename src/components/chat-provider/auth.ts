import { BehaviorSubject } from "rxjs";

export const $apiKey = new BehaviorSubject(localStorage.getItem("apiKey") || "");

export function setApiKey(apiKey: string) {
  localStorage.setItem("apiKey", apiKey);
  $apiKey.next(apiKey);
}
