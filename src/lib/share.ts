export type SharePayloadV1 = {
  v: 1;
  name?: string;
  trackIds: string[];
};

export function encodeSharePayload(payload: SharePayloadV1): string {
  const json = JSON.stringify(payload);
  // Base64 URL-safe
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function decodeSharePayload(input: string): SharePayloadV1 | null {
  try {
    const pad = input + '==='.slice((input.length + 3) % 4);
    const b64 = pad.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(escape(atob(b64)));
    const data = JSON.parse(json);
    if (data && data.v === 1 && Array.isArray(data.trackIds)) return data as SharePayloadV1;
    return null;
  } catch {
    return null;
  }
}
