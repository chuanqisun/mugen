import { html, render } from "lit";
import { BehaviorSubject, combineLatest, fromEvent, map, merge, startWith, tap } from "rxjs";
import { $, getEventDetail } from "../dom";
import type { BaseConnection, BaseProvider } from "../model-providers/base";
import { createProvider } from "../model-providers/factory";
import { useRouteParameter } from "../route-parameter";
import { connectionStore } from "./connections-store";

export const activeProvider = new BehaviorSubject<{ provider: BaseProvider; connection: BaseConnection } | null>(null);

export function getChatStreamProxy() {
  const { provider, connection } = activeProvider.value ?? {};
  const chatStreamProxy = provider && connection ? provider.getChatStreamProxy(connection) : null;
  return chatStreamProxy;
}

export function useProviderSelector() {
  const routeConnectionId = useRouteParameter({ key: "connectionId" });

  const selectElement = $<HTMLSelectElement>("#active-connection")!;

  const reflectSelection$ = fromEvent(selectElement, "change").pipe(
    map((e) => (e.target as HTMLSelectElement).value),
    tap((id) => routeConnectionId.replace(id))
  );

  const options$ = fromEvent(connectionStore, "change").pipe(map(getEventDetail<BaseConnection[]>), startWith(connectionStore.listConnections()));

  const updateActiveProvider$ = combineLatest([routeConnectionId.value$, options$]).pipe(
    tap(([latestId, connections]) => {
      const isSelectionInvalid = connections.length && !connections.find((c) => c.id === latestId);

      const grouped = Object.entries(Object.groupBy(connections, (connection) => connection.displayGroup));

      render(
        html` ${!connections.length ? html`<option value="" disabled selected>No connection available</option>` : null}
        ${isSelectionInvalid ? html`<option value="" disabled selected>Select a connection</option>` : null}
        ${grouped.map(
          (group) => html`
            ${html`<optgroup label="${group[0]}">
              ${group[1]!.map(
            (connection) => html` <option value="${connection.id}" ?selected=${connection.id === latestId}>${connection.displayName}</option>`
          )}
            </optgroup> `}
          `
        )}`,
        selectElement
      );
    }),
    map(([latestId, connections]) => connections.find((c) => c.id === latestId) ?? null),
    map((connection) =>
      connection
        ? {
          provider: createProvider(connection.type) as BaseProvider,
          connection,
        }
        : null
    ),
    tap((provider) => activeProvider.next(provider))
  );

  return merge(reflectSelection$, updateActiveProvider$);
}
