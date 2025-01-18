import { BehaviorSubject } from "rxjs";

export interface RouteParameterOptions {
  key: string;
}

export function useRouteParameter(options: RouteParameterOptions) {
  const value$ = new BehaviorSubject<string | null>(new URLSearchParams(location.search).get(options.key) ?? null);

  const update = (method: "replaceState" | "pushState", newValue: string | null) => {
    const mutableUrl = new URL(window.location.href);

    if (newValue === null) {
      mutableUrl.searchParams.delete(options.key);
      window.history[method](null, "", mutableUrl.toString());
    } else {
      mutableUrl.searchParams.set(options.key, newValue);
      window.history[method](null, "", mutableUrl.toString());
    }

    value$.next(newValue);
  };

  const push = (newValue: string | null) => update("pushState", newValue);
  const replace = (newValue: string | null) => update("replaceState", newValue);

  return { value$, push, replace };
}
