import {
  WagerClient,
  type StorageAdapter,
} from "../../../../packages/client/src";
export type {
  BackendHealth,
  IngestResult,
} from "../../../../packages/contracts/src";
const browserStorage: StorageAdapter = {
  getItem: async (k) => localStorage.getItem(k),
  setItem: async (k, v) => localStorage.setItem(k, v),
  removeItem: async (k) => localStorage.removeItem(k),
};
const sessionStorageAdapter: StorageAdapter = {
  getItem: async (k) => sessionStorage.getItem(k),
  setItem: async (k, v) => sessionStorage.setItem(k, v),
  removeItem: async (k) => sessionStorage.removeItem(k),
};
export const apiClient = new WagerClient(
  import.meta.env.VITE_API_URL ||
    localStorage.getItem("wager_api_url") ||
    "http://127.0.0.1:8000/api/v1",
  browserStorage,
  sessionStorageAdapter,
);
