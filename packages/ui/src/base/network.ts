import type { Disposable } from "./disposable";

export type PostData = Record<
  string,
  string | number | boolean | readonly string[] | readonly number[] | readonly boolean[] | null | undefined
>;

const pending = new Map<string, PostData>();
let timer = 0;

/// Convert a flat data object into form-urlencoded request content.
export function toQueryString(data: PostData) {
  const pairs: string[] = [];
  for (const [rawKey, rawValue] of Object.entries(data)) {
    const key = encodeURIComponent(rawKey);
    if (rawValue == null) {
      pairs.push(key);
      continue;
    }
    const value = Array.isArray(rawValue) ? rawValue.join(",") : String(rawValue);
    pairs.push(`${key}=${encodeURIComponent(value.replace(/\r?\n/g, "\r\n")).replace(/%20/g, "+")}`);
  }
  return pairs.join("&");
}

/// POST form data using native fetch, preserving FormData bodies and adding
/// the renderer's CSRF token when one is present.
export async function post(url: string, data?: FormData | PostData, signal?: AbortSignal) {
  const isForm = data instanceof FormData;
  const headers: Record<string, string> = {
    "X-CSRF-Token": (window as Window & { csrfToken?: string }).csrfToken ?? "",
  };
  if (!isForm) headers["Content-Type"] = "application/x-www-form-urlencoded";

  const response = await fetch(url, {
    method: "POST",
    body: isForm ? data : data ? toQueryString(data) : undefined,
    headers,
    signal,
  });
  if (!response.ok) throw new Error(`POST failed ${response.status}: ${url}`);
  return response.text();
}

function mergePostData(target: PostData, source: PostData) {
  for (const [key, value] of Object.entries(source)) {
    const current = target[key];
    if (Array.isArray(current) && Array.isArray(value)) {
      target[key] = [...new Set([...current, ...value])] as string[];
    } else {
      target[key] = value;
    }
  }
}

async function flushDeferred() {
  if (!navigator.onLine) return;
  window.clearTimeout(timer);
  timer = 0;

  for (const [url, data] of [...pending]) {
    pending.delete(url);
    const body = toQueryString({ data: JSON.stringify(data) });
    if (navigator.sendBeacon?.(url, body)) continue;
    post(url, { data: JSON.stringify(data) }).catch(() => {
      deferredPost(url, data);
    });
  }
}

/// Coalesce repeated POST payloads by URL and flush them on a quiet timer.
export function deferredPost(url: string, data: PostData, delay = 5000) {
  if (pending.has(url)) mergePostData(pending.get(url)!, data);
  else pending.set(url, { ...data });
  if (!timer) timer = window.setTimeout(flushDeferred, delay);
}

/// Install global online/pagehide flushing for deferred posts.
export function installDeferredPostFlush(): Disposable {
  const online = () => void flushDeferred();
  const pagehide = () => void flushDeferred();
  window.addEventListener("online", online);
  window.addEventListener("pagehide", pagehide);
  return {
    dispose() {
      window.removeEventListener("online", online);
      window.removeEventListener("pagehide", pagehide);
    },
  };
}
