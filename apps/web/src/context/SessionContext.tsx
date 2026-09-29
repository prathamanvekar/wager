import React, { createContext, useContext, useState } from 'react';
import type { VisitorSession, CustomerProfile } from '../types/session';
import {
  getOrCreateDeviceId,
  getOrCreateSessionId,
  getOrCreateIpHash,
  rotateSessionId,
  rotateDeviceId,
} from '../services/storage';

export const FLAGSHIP_CUSTOMER: CustomerProfile = {
  id: 'C1041',
  fullName: 'Alex Mercer',
  email: 'alex.mercer@apex.bank',
  phoneSuffix: '8821',
  tier: 'Premier',
  accountNumber: 'APEX-8821-4902',
  linkedDevicesCount: 2,
};

interface SessionContextValue {
  session: VisitorSession;
  isLoggedIn: boolean;
  login: (customer?: CustomerProfile) => void;
  logout: () => void;
  rotateDevice: () => void;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  bindingNotice: string | null;
  dismissBindingNotice: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<VisitorSession>(() => {
    const deviceId = getOrCreateDeviceId();
    const sessionId = getOrCreateSessionId();
    const ipHash = getOrCreateIpHash();

    return {
      sessionId,
      deviceId,
      ipHash,
      networkAsn: 'AS13335 (Cloudflare/Metro)',
      startedAt: new Date().toISOString(),
      authState: 'anonymous',
      identityState: 'orphan',
      customer: null,
    };
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [bindingNotice, setBindingNotice] = useState<string | null>(null);

  const login = (customer: CustomerProfile = FLAGSHIP_CUSTOMER) => {
    const previousAnonymousSession = session.sessionId;

    setSession((prev) => ({
      ...prev,
      authState: 'authenticated',
      identityState: 'resolved',
      customer,
    }));

    setIsAuthModalOpen(false);

    // Announce the identity discovery
    setBindingNotice(
      `Identity authenticated as ${customer.fullName} (${customer.id}). Previous anonymous session (${previousAnonymousSession}) is now candidates for retroactive binding.`
    );
  };

  const logout = () => {
    const newSessionId = rotateSessionId();
    setSession((prev) => ({
      ...prev,
      sessionId: newSessionId,
      authState: 'anonymous',
      identityState: 'orphan',
      customer: null,
    }));
    setBindingNotice(null);
  };

  const rotateDevice = () => {
    const newDev = rotateDeviceId();
    const newSes = rotateSessionId();
    setSession((prev) => ({
      ...prev,
      deviceId: newDev,
      sessionId: newSes,
      authState: 'anonymous',
      identityState: 'orphan',
      customer: null,
    }));
    setBindingNotice(null);
  };

  const dismissBindingNotice = () => setBindingNotice(null);

  return (
    <SessionContext.Provider
      value={{
        session,
        isLoggedIn: session.authState === 'authenticated',
        login,
        logout,
        rotateDevice,
        isAuthModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
        bindingNotice,
        dismissBindingNotice,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return ctx;
}
