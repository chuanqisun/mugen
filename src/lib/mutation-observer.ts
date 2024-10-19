import { Observable } from "rxjs";

export interface AttributeMutationRecord {
  oldValue: string | null;
  newValue: string | null;
}

export function fromAttributes(element: HTMLElement, attributeFilter?: string[]): Observable<Record<string, AttributeMutationRecord>> {
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
