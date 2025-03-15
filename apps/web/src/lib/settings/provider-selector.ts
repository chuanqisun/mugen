import { BehaviorSubject, combineLatest, concatMap, from, fromEvent, map, merge, startWith, take, takeWhile, tap } from "rxjs";
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

  const selectDefault$ = options$.pipe(
    takeWhile(() => routeConnectionId.value$.value === null),
    concatMap(from),
    take(1),
    map((connection) => connection.id),
    tap(routeConnectionId.replace)
  );

  const updateActiveProvider$ = combineLatest([routeConnectionId.value$, options$]).pipe(
    tap(([latestId, connections]) => {
      // Clear previous options
      while (selectElement.firstChild) {
        selectElement.removeChild(selectElement.firstChild);
      }

      const isSelectionInvalid = connections.length && !connections.find((c) => c.id === latestId);

      // Handle empty connections case
      if (!connections.length) {
        const noConnectionOption = document.createElement("option");
        noConnectionOption.value = "";
        noConnectionOption.disabled = true;
        noConnectionOption.selected = true;
        noConnectionOption.textContent = "No connection available";
        selectElement.appendChild(noConnectionOption);
      }

      // Handle invalid selection case
      if (isSelectionInvalid) {
        const selectConnectionOption = document.createElement("option");
        selectConnectionOption.value = "";
        selectConnectionOption.disabled = true;
        selectConnectionOption.selected = true;
        selectConnectionOption.textContent = "Select a connection";
        selectElement.appendChild(selectConnectionOption);
      }

      // Group connections by display group
      const grouped = Object.entries(Object.groupBy(connections, (connection) => connection.displayGroup));

      // Create option groups and options
      grouped.forEach(([groupName, groupConnections]) => {
        const optGroup = document.createElement("optgroup");
        optGroup.label = groupName;

        groupConnections!.forEach((connection) => {
          const option = document.createElement("option");
          option.value = connection.id;
          option.textContent = connection.displayName;
          option.selected = connection.id === latestId;
          optGroup.appendChild(option);
        });

        selectElement.appendChild(optGroup);
      });
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

  return merge(reflectSelection$, updateActiveProvider$, selectDefault$);
}
