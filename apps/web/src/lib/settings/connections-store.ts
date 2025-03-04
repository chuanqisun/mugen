import type { BaseConnection, BaseCredential } from "../model-providers/base";
import { createProvider } from "../model-providers/factory";

export class ConnectionsStore extends EventTarget {
  listCredentials(): BaseCredential[] {
    return this.#tryJSONParse(localStorage.getItem("mugen.credentials"), [] as BaseCredential[]);
  }

  listConnections(): BaseConnection[] {
    const credentials = this.#tryJSONParse(localStorage.getItem("mugen.credentials"), [] as BaseCredential[]);
    return this.#credentialsToConnections(credentials);
  }

  upsertCredentials(newCredentials: BaseCredential[]): BaseCredential[] {
    const credentials = this.#tryJSONParse(localStorage.getItem("mugen.credentials"), [] as BaseCredential[]);
    const mergedCredentials = [...credentials, ...newCredentials];
    localStorage.setItem("mugen.credentials", JSON.stringify(mergedCredentials));

    const connections = this.#credentialsToConnections(mergedCredentials);
    this.dispatchEvent(new CustomEvent<BaseConnection[]>("change", { detail: connections }));

    return mergedCredentials;
  }

  deleteCredential(id: string): BaseCredential[] {
    const credentials = this.#tryJSONParse(localStorage.getItem("mugen.credentials"), [] as BaseCredential[]);
    const remaining = credentials.filter((credential) => credential.id !== id);
    localStorage.setItem("mugen.credentials", JSON.stringify(remaining));

    const connections = this.#credentialsToConnections(remaining);
    this.dispatchEvent(new CustomEvent<BaseConnection[]>("change", { detail: connections }));

    return remaining;
  }

  #tryJSONParse<T>(value: unknown, fallback: T): T {
    if (typeof value !== "string") return fallback;

    return JSON.parse(value as string) ?? fallback;
  }

  #credentialsToConnections(credentials: BaseCredential[]): BaseConnection[] {
    return credentials.flatMap((credential) => {
      const provider = createProvider(credential.type);
      return provider.credentialToConnections(credential) as BaseConnection[];
    });
  }
}

export const connectionStore = new ConnectionsStore();
