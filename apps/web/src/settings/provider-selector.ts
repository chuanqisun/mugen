import { BehaviorSubject, combineLatest, fromEvent, map, mergeWith, startWith, Subject, tap } from "rxjs";
import type { BaseConnection, BaseProvider } from "../model-providers/base";
import { createProvider } from "../model-providers/factory";
import { $, getDetail } from "../utils/dom";
import { connectionStore } from "./connections-store";

export const activeProvider = new BehaviorSubject<BaseProvider | null>(null);

export function useProviderSelector() {
  const optionsChanged$ = new Subject<void>();
  const selectElement = $<HTMLSelectElement>("#active-connection")!;

  const selectedId = fromEvent(selectElement, "change").pipe(
    mergeWith(optionsChanged$),
    map((_) => selectElement.value),
    startWith(selectElement.value)
  );

  const options$ = fromEvent(connectionStore, "change").pipe(
    map(getDetail<BaseConnection[]>),
    startWith(connectionStore.listConnections()),
    tap((connections) => {
      selectElement.innerHTML = `
<option value="" disabled>Select a connection</option>
${connections.map((connection) => `<option value="${connection.id}">${connection.displayName}</option>`).join("")}
      `;
    }),
    tap(() => optionsChanged$.next())
  );

  const updateActiveModel = combineLatest([selectedId, options$]).pipe(
    map(([id, connections]) => connections.find((c) => c.id === id) ?? null),
    map((connection) => (connection ? createProvider(connection.type) : null)),
    tap((provider) => activeProvider.next(provider))
  );

  return updateActiveModel;
}
