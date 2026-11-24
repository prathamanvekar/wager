import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import Constants from "expo-constants";
import {
  WagerClient,
  configureRandomSource,
  newId,
  type StorageAdapter,
} from "../../../../packages/client/src";
import type {
  CustomerProfile,
  DisputeCase,
  EventEnvelope,
  ServerSession,
} from "../../../../packages/contracts/src";
configureRandomSource(Crypto.randomUUID);
const secure: StorageAdapter =
  Platform.OS === "web"
    ? AsyncStorage
    : {
        getItem: SecureStore.getItemAsync,
        setItem: SecureStore.setItemAsync,
        removeItem: SecureStore.deleteItemAsync,
      };
export function defaultUrl() {
  const host = Constants.expoConfig?.hostUri?.split(":")[0];
  return (
    process.env.EXPO_PUBLIC_API_URL ||
    (host
      ? `http://${host}:8000/api/v1`
      : Platform.OS === "web"
        ? "http://127.0.0.1:8000/api/v1"
        : "")
  );
}
interface MobileState {
  client: WagerClient | null;
  session: ServerSession | null;
  customer: CustomerProfile | null;
  customers: CustomerProfile[];
  cases: DisputeCase[];
  pending: EventEnvelope[];
  online: boolean;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  notice: string | null;
  url: string;
  connect: (url: string) => Promise<void>;
  refresh: () => Promise<void>;
  login: (id: string) => Promise<void>;
  logout: () => Promise<void>;
  emit: <T>(
    type: string,
    payload: T,
    options?: { caseId?: string; threadHint?: string },
  ) => Promise<boolean>;
  notify: (text: string | null) => void;
}
const Context = createContext<MobileState | null>(null);
export function MobileProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<WagerClient | null>(null);
  const [session, setSession] = useState<ServerSession | null>(null);
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [cases, setCases] = useState<DisputeCase[]>([]);
  const [pending, setPending] = useState<EventEnvelope[]>([]);
  const [url, setUrl] = useState(defaultUrl());
  const [online, setOnline] = useState(false),
    [loading, setLoading] = useState(true),
    [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null),
    [notice, setNotice] = useState<string | null>(null);
  const clientRef = useRef<WagerClient | null>(null),
    refreshTask = useRef<{ epoch: number; cacheKey: string; promise: Promise<void> } | null>(
      null,
    );
  const epoch = useRef(0);
  const lastRefresh = useRef(0);
  const scopeKey = (c: WagerClient) =>
    `wager.cache.${encodeURIComponent(c.getBaseUrl())}.${c.getSession()?.session_id}.${c.getSession()?.customer_id || "anonymous"}`;
  const refresh = useCallback(async () => {
    const c = clientRef.current;
    if (!c) return;
    const generation = epoch.current;
    const cacheKey = scopeKey(c);
    const current = () =>
      clientRef.current === c &&
      epoch.current === generation &&
      scopeKey(c) === cacheKey;
    if (refreshTask.current?.epoch === generation && refreshTask.current.cacheKey === cacheKey)
      return refreshTask.current.promise;
    setRefreshing(true);
    const task = (async () => {
      try {
        const health = await c.checkHealth();
        if (!current()) return;
        setOnline(!!health);
        if (!health) {
          setPending(c.getOfflineQueue());
          return;
        }
        await c.flushQueue();
        if (!current()) return;
        const data = await c.fetchCases();
        if (!current()) return;
        setCases(data);
        setPending(c.getOfflineQueue());
        setSession(c.getSession());
        setError(null);
        // The captured key can never change to another account while awaiting IO.
        await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
        if (current()) lastRefresh.current = Date.now();
      } catch (e) {
        if (!current()) return;
        setError(
          e instanceof Error
            ? e.message
            : "Could not refresh your conversations.",
        );
        setPending(c.getOfflineQueue());
      }
    })();
    refreshTask.current = { epoch: generation, cacheKey, promise: task };
    try {
      await task;
    } finally {
      if (refreshTask.current?.promise === task) {
        refreshTask.current = null;
        setRefreshing(false);
      }
    }
  }, []);
  const connect = useCallback(
    async (input: string) => {
      const address = input.trim().replace(/\/$/, "");
      if (!/^https?:\/\/[^\s]+\/api\/v1$/.test(address))
        throw new Error(
          "Use your server address ending in /api/v1, for example http://192.168.1.10:8000/api/v1.",
        );
      if (
        clientRef.current?.getOfflineQueue().length &&
        clientRef.current.getBaseUrl() !== address
      )
        throw new Error("Send pending actions before changing servers.");
      const generation = ++epoch.current;
      const c =
        clientRef.current?.getBaseUrl() === address
          ? clientRef.current
          : new WagerClient(address, AsyncStorage, secure);
      const changedServer = clientRef.current !== c;
      clientRef.current = c;
      const current = () =>
        clientRef.current === c && epoch.current === generation;
      if (changedServer) {
        setClient(null);
        setSession(null);
        setCases([]);
        setPending([]);
        setCustomers([]);
        setOnline(false);
      }
      setLoading(true);
      setError(null);
      try {
        let device = await AsyncStorage.getItem("wager.device");
        if (!device) {
          device = newId("dev");
          await AsyncStorage.setItem("wager.device", device);
        }
        if (!current()) return;
        const s = await c.connect({
          device_id: device,
          session_id: newId("ses"),
          channel: "mobile",
        });
        if (!current()) return;
        setClient(c);
        setSession(s);
        setUrl(address);
        await AsyncStorage.setItem("wager.apiUrl", address);
        if (!current()) return;
        const cached = await AsyncStorage.getItem(scopeKey(c));
        if (!current()) return;
        try {
          setCases(cached ? JSON.parse(cached) : []);
        } catch {
          setCases([]);
        }
        const savedPeople = await AsyncStorage.getItem(
          "wager.customers." + encodeURIComponent(address),
        );
        if (!current()) return;
        if (savedPeople) {
          try {
            setCustomers(JSON.parse(savedPeople));
          } catch {
            setCustomers([]);
          }
        }
        const health = await c.checkHealth();
        if (!current()) return;
        setOnline(!!health);
        if (health) {
          const people = await c.customers();
          if (!current()) return;
          setCustomers(people);
          await AsyncStorage.setItem(
            "wager.customers." + encodeURIComponent(address),
            JSON.stringify(people),
          );
        }
        const startedKey = "wager.started." + s.session_id;
        const started = await AsyncStorage.getItem(startedKey);
        if (!current()) return;
        if (!started) {
          await c.emit(
            "mobile.session.started",
            { launch: "mobile" },
            { threadHint: "session_initiation" },
          );
          await AsyncStorage.setItem(startedKey, "1");
        }
        if (current()) await refresh();
      } catch (e) {
        if (!current()) return;
        setError(e instanceof Error ? e.message : "Unable to connect.");
        throw e;
      } finally {
        if (current()) setLoading(false);
      }
    },
    [refresh],
  );
  useEffect(() => {
    let alive = true;
    (async () => {
      const stored = await AsyncStorage.getItem("wager.apiUrl");
      if (!alive) return;
      if (stored) {
        try {
          await connect(stored);
        } catch {
          /* connection screen owns recovery */
        }
      } else setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [connect]);
  useEffect(() => {
    if (!client) return;
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void refresh();
    });
    const timer = setInterval(() => {
      if (
        AppState.currentState === "active" &&
        Date.now() - lastRefresh.current > 4000
      )
        void refresh();
    }, 5000);
    return () => {
      subscription.remove();
      clearInterval(timer);
    };
  }, [client, refresh]);
  const login = async (id: string) => {
    const c = clientRef.current;
    if (!c) throw new Error("Connect to your server first.");
    const generation = ++epoch.current;
    await c.login(id);
    if (clientRef.current !== c || epoch.current !== generation) return;
    setCases([]);
    setSession({ ...c.getSession()! });
    await refresh();
  };
  const logout = async () => {
    const c = clientRef.current;
    if (!c) return;
    const generation = ++epoch.current;
    await c.logout();
    if (clientRef.current !== c || epoch.current !== generation) return;
    setCases([]);
    setSession(null);
    setPending([]);
    await connect(c.getBaseUrl());
  };
  const emit = async <T,>(
    type: string,
    payload: T,
    options?: { caseId?: string; threadHint?: string },
  ) => {
    const c = clientRef.current;
    if (!c) throw new Error("Connect first.");
    const generation = epoch.current;
    const result = await c.emit(type, payload, options);
    if (clientRef.current !== c || epoch.current !== generation)
      return result.result.online;
    setPending(c.getOfflineQueue());
    if (result.result.online) {
      await refresh();
      if (!type.endsWith(".viewed"))
        setNotice("Saved to your shared conversation.");
    } else {
      setOnline(false);
      setNotice("Saved on this phone. We’ll send it when you reconnect.");
    }
    return result.result.online;
  };
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(timer);
  }, [notice]);
  const customer = customers.find((c) => c.id === session?.customer_id) || null;
  return (
    <Context.Provider
      value={{
        client,
        session,
        customer,
        customers,
        cases,
        pending,
        online,
        loading,
        refreshing,
        error,
        notice,
        url,
        connect,
        refresh,
        login,
        logout,
        emit,
        notify: setNotice,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useMobile() {
  const value = useContext(Context);
  if (!value) throw new Error("MobileProvider is required");
  return value;
}
