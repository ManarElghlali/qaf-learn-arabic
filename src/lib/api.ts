// Native app builds set VITE_API_BASE to the published site so server checks stay online.
export const API_BASE = (import.meta.env['VITE_API_BASE'] as string | undefined)?.replace(/\/$/, "") ?? "";

const DEVICE_KEY = "qaf-device-id";
/** Anonymous random ID used only to count pronunciation checks. No account needed. */
export function deviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id || !/^[a-f0-9-]{16,64}$/i.test(id)) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}
