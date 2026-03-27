import type { DataStore } from "./types";

export type { DataStore } from "./types";

let _store: DataStore | null = null;

export async function getStore(): Promise<DataStore> {
  if (_store) return _store;

  if (process.env.DATA_PROVIDER === "sheets") {
    const { sheetsStore } = await import("./sheets-provider");
    _store = sheetsStore;
  } else {
    const { localStore } = await import("./local-provider");
    _store = localStore;
  }

  return _store;
}
