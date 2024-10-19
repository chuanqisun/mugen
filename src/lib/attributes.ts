import { BehaviorSubject, map, Observable, scan, tap } from "rxjs";

export interface AttributeMutationRecord {
  oldValue: string | null;
  newValue: string | null;
}

export function fromChangedAttributes(element: HTMLElement, attributeFilter?: string[]): Observable<Record<string, AttributeMutationRecord>> {
  function isAttributeNameObserved(name: string) {
    return !attributeFilter || attributeFilter.includes(name);
  }

  return new Observable((subscriber) => {
    // starts with initial values
    subscriber.next(
      element
        .getAttributeNames()
        .filter(isAttributeNameObserved)
        .reduce(
          (map, name) => {
            map[name] = { oldValue: null, newValue: element.getAttribute(name) };
            return map;
          },
          {} as Record<string, AttributeMutationRecord>
        )
    );

    const observer = new MutationObserver((mutations) => {
      const combinedMutationMap = mutations.reduce(
        (map, mutation) => {
          if (mutation.type === "attributes" && isAttributeNameObserved(mutation.attributeName!)) {
            map[mutation.attributeName!] = {
              oldValue: mutation.oldValue,
              newValue: element.getAttribute(mutation.attributeName!),
            };
          }

          return map;
        },
        {} as Record<string, AttributeMutationRecord>
      );

      subscriber.next(combinedMutationMap);
    });

    observer.observe(element, { attributes: true, attributeFilter });

    /** Mutation observer holds weak reference to observed node. No need to manually unsubscribe */
    return () => {
      observer.disconnect();
    };
  });
}

export type AttributeValue = string | null;

export function fromAttributes<T extends string>(element: HTMLElement, attributeFilter?: string[]): Observable<Record<T, AttributeValue>> {
  return fromChangedAttributes(element, attributeFilter).pipe(
    scan(
      (acc, changes) => {
        const newAcc = { ...acc };

        for (const [name, { newValue }] of Object.entries(changes)) {
          if (newValue === null) {
            delete newAcc[name as T];
          } else {
            newAcc[name as T] = newValue;
          }
        }

        return newAcc;
      },
      {} as Record<T, AttributeValue>
    )
  );
}

/**
 * Reflects attributes to a BehaviorSubject.
 */
export function reflectAttributes<K extends {}, T extends HTMLElement>(element: T, $state: BehaviorSubject<K>, attributeFilter?: string[]) {
  const $reflectAttributes = fromChangedAttributes(element, attributeFilter).pipe(
    map((changes) =>
      Object.entries(changes)
        .map((change) => ({ [change[0]]: change[1].newValue }) as { [key: string]: string | null })
        .reduce((acc, changes) => ({ ...acc, ...changes }), {} as { [key: string]: string | null })
    ),
    tap((changes) => $state.next({ ...$state.value, ...changes }))
  );

  return $reflectAttributes;
}
