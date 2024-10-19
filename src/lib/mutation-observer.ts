import { Observable } from "rxjs";

export interface AttributeMutationRecord {
  oldValue: string | null;
  newValue: string | null;
}

export function fromAttributeChange(element: HTMLElement, attributeName: string): Observable<AttributeMutationRecord> {
  return new Observable((subscriber) => {
    // starts with initial value
    subscriber.next({ oldValue: null, newValue: element.getAttribute(attributeName) });

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes" && mutation.attributeName === attributeName) {
          const newValue = element.getAttribute(attributeName);
          subscriber.next({ oldValue: mutation.oldValue, newValue });
        }
      });
    });
    observer.observe(element, { attributes: true, attributeFilter: [attributeName] });

    /** Mutation observer holds weak reference to observed node. No need to manually unsubscribe */
    return () => {
      observer.disconnect();
    };
  });
}
