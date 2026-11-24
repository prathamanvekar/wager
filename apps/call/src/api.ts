import { WagerClient, type StorageAdapter } from '../../../packages/client/src';
const fallback = new Map<string, string>();
export function read(key: string, session = false): string | null {
  try { return (session ? sessionStorage : localStorage).getItem('wager.call.' + key); }
  catch { return fallback.get((session ? 'session.' : '') + key) ?? null; }
}
export function write(key: string, value: string | null, session = false) {
  const k = 'wager.call.' + key;
  try {
    const storage = session ? sessionStorage : localStorage;
    if (value === null) storage.removeItem(k); else storage.setItem(k, value);
  } catch {
    const memoryKey = (session ? 'session.' : '') + key;
    if (value === null) fallback.delete(memoryKey); else fallback.set(memoryKey, value);
  }
}
const adapter = (session: boolean): StorageAdapter => ({
  getItem: async key => read(key, session),
  setItem: async (key, value) => write(key, value, session),
  removeItem: async key => write(key, null, session),
});
export const defaultAddress = import.meta.env.VITE_API_URL || read('api') || 'http://127.0.0.1:8000/api/v1';
export function addressFor(input: string) {
  const value = input.trim().replace(/\/$/, '');
  let url: URL;
  try { url = new URL(value); } catch { throw Error('Enter a valid backend address ending in /api/v1.'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.pathname !== '/api/v1' || url.search || url.hash || url.username || url.password)
    throw Error('Use a backend URL such as http://127.0.0.1:8000/api/v1.');
  return value;
}
export const createClient = (address: string) => new WagerClient(address, adapter(false), adapter(true));
export const callKey = (address: string) => 'active.' + encodeURIComponent(address);
export const endKey = (address: string) => 'ending.' + encodeURIComponent(address);
