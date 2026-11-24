import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { VisitorSession, CustomerProfile } from "../types/session";
import { apiClient } from "../services/api";
import {
  getOrCreateDeviceId,
  getOrCreateSessionId,
  getOrCreateIpHash,
  rotateDeviceId,
  rotateSessionId,
} from "../services/storage";
export const FLAGSHIP_CUSTOMER: CustomerProfile = {
  id: "C1041",
  fullName: "Alex Mercer",
  email: "alex.mercer@apex.bank",
  phoneSuffix: "8821",
  tier: "Premier",
  accountNumber: "APEX-8821-4902",
  linkedDevicesCount: 2,
};
interface SessionContextValue {
  session: VisitorSession;
  isLoggedIn: boolean;
  isReady: boolean;
  connectionError: string | null;
  login: (customer?: CustomerProfile) => Promise<void>;
  logout: () => Promise<void>;
  rotateDevice: () => Promise<void>;
  reconnect: () => Promise<void>;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  bindingNotice: string | null;
  dismissBindingNotice: () => void;
}
const SessionContext = createContext<SessionContextValue | null>(null);
export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<VisitorSession>(() => ({
    deviceId: getOrCreateDeviceId(),
    sessionId: getOrCreateSessionId(),
    ipHash: getOrCreateIpHash(),
    networkAsn: "Local demo",
    startedAt: new Date().toISOString(),
    authState: "anonymous",
    identityState: "orphan",
    customer: null,
  }));
  const [isReady, setReady] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isAuthModalOpen, setAuthModal] = useState(false);
  const [bindingNotice, setBindingNotice] = useState<string | null>(null);
  const reconnect = useCallback(async () => {
    try {
      const s = await apiClient.connect({
        device_id: getOrCreateDeviceId(),
        session_id: getOrCreateSessionId(),
        channel: "web",
      });
      const people = s.customer_id ? await apiClient.customers() : [];
      setSession((prev) => ({
        ...prev,
        deviceId: s.device_id,
        sessionId: s.session_id,
        authState: s.customer_id ? "authenticated" : "anonymous",
        identityState: s.customer_id ? "resolved" : "orphan",
        customer: people.find((c) => c.id === s.customer_id) || null,
      }));
      setReady(true);
      setConnectionError(null);
    } catch (e) {
      setConnectionError(
        e instanceof Error ? e.message : "Could not connect to Wager.",
      );
    }
  }, []);
  useEffect(() => {
    void reconnect();
  }, [reconnect]);
  const login = async (customer = FLAGSHIP_CUSTOMER) => {
    const profile = await apiClient.login(customer.id);
    setSession((prev) => ({
      ...prev,
      customer: profile,
      authState: "authenticated",
      identityState: "resolved",
    }));
    setAuthModal(false);
    setBindingNotice(
      `Signed in as ${profile.fullName}. Your earlier actions in this web session are now connected to your account.`,
    );
  };
  const logout = async () => {
    try {
      await apiClient.logout();
      rotateSessionId();
      setReady(false);
      setBindingNotice(null);
      await reconnect();
    } catch (e) {
      setConnectionError(
        e instanceof Error ? e.message : "Could not sign out.",
      );
    }
  };
  const rotateDevice = async () => {
    await apiClient.logout();
    rotateDeviceId();
    rotateSessionId();
    setReady(false);
    await reconnect();
  };
  return (
    <SessionContext.Provider
      value={{
        session,
        isLoggedIn: session.authState === "authenticated",
        isReady,
        connectionError,
        login,
        logout,
        rotateDevice,
        reconnect,
        isAuthModalOpen,
        openAuthModal: () => setAuthModal(true),
        closeAuthModal: () => setAuthModal(false),
        bindingNotice,
        dismissBindingNotice: () => setBindingNotice(null),
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};
export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("SessionProvider is required");
  return value;
}
