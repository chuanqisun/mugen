import { Observable } from "rxjs";

export function fromAbortablePromise<T>(factoryFunc: (signal: AbortSignal) => Promise<T>): Observable<T> {
  return new Observable((subscriber) => {
    const ac = new AbortController();

    factoryFunc(ac.signal).then(subscriber.next.bind(subscriber)).catch(subscriber.error.bind(subscriber));

    return () => {
      ac.abort();
    };
  });
}
