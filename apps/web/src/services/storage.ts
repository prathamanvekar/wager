/**
 * Local storage utility for browser tokens and simulation state.
 */

const STORAGE_KEYS = {
  DEVICE_ID: 'wager_device_id',
  SESSION_ID: 'wager_session_id',
  IP_HASH: 'wager_ip_hash',
  AUTH_STATE: 'wager_auth_state',
  CUSTOMER_DATA: 'wager_customer_data',
  EMITTED_EVENTS: 'wager_emitted_events',
};

function generateId(prefix: string): string {
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `${prefix}_${randomPart}`;
}

export function getOrCreateDeviceId(): string {
  let deviceId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
  if (!deviceId) {
    deviceId = generateId('tok_dev');
    localStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
  }
  return deviceId;
}

export function getOrCreateSessionId(): string {
  let sessionId = sessionStorage.getItem(STORAGE_KEYS.SESSION_ID);
  if (!sessionId) {
    sessionId = generateId('tok_ses');
    sessionStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);
  }
  return sessionId;
}

export function getOrCreateIpHash(): string {
  let ipHash = localStorage.getItem(STORAGE_KEYS.IP_HASH);
  if (!ipHash) {
    ipHash = generateId('tok_ip');
    localStorage.setItem(STORAGE_KEYS.IP_HASH, ipHash);
  }
  return ipHash;
}

export function rotateSessionId(): string {
  const newSessionId = generateId('tok_ses');
  sessionStorage.setItem(STORAGE_KEYS.SESSION_ID, newSessionId);
  return newSessionId;
}

export function rotateDeviceId(): string {
  const newDeviceId = generateId('tok_dev');
  localStorage.setItem(STORAGE_KEYS.DEVICE_ID, newDeviceId);
  return newDeviceId;
}
