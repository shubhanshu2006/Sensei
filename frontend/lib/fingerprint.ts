/**
 * Client-Side Free Open-Source Device Fingerprinting
 * Based on https://github.com/fingerprintjs/fingerprintjs (MIT License)
 *
 * 100% Free - Requires NO API keys, NO paid plans, NO external cloud servers.
 */

let cachedVisitorId: string | null = null;
let fpPromise: Promise<string> | null = null;

/**
 * Robust fallback entropy generator in case CDN is unreachable or blocked by privacy extensions.
 * Collects deterministic hardware & browser rendering signatures to produce a consistent 32-char hex hash.
 */
function generateLocalEntropyHash(): string {
  if (typeof window === "undefined") {
    return "00000000000000000000000000000000";
  }

  const nav = window.navigator as any;
  const screen = window.screen;

  const components: string[] = [
    nav.userAgent || "",
    nav.language || "",
    nav.languages ? nav.languages.join(",") : "",
    nav.hardwareConcurrency ? String(nav.hardwareConcurrency) : "",
    nav.deviceMemory ? String(nav.deviceMemory) : "",
    nav.platform || "",
    screen.width + "x" + screen.height,
    screen.colorDepth ? String(screen.colorDepth) : "",
    new Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    String(new Date().getTimezoneOffset()),
  ];

  // Canvas fingerprinting
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.textBaseline = "top";
      ctx.font = "14px 'Arial'";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "#f60";
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = "#069";
      ctx.fillText("Sensei AI Fingerprint 2026", 2, 15);
      ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
      ctx.fillText("Sensei AI Fingerprint 2026", 4, 17);
      components.push(canvas.toDataURL());
    }
  } catch {
    // Ignore canvas security errors
  }

  // WebGL fingerprinting
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    if (gl) {
      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
      if (debugInfo) {
        components.push(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || "");
        components.push(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || "");
      }
    }
  } catch {
    // Ignore webgl errors
  }

  const raw = components.join("###");
  return hashStringTo32Hex(raw);
}

function hashStringTo32Hex(str: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  let h3 = 0x9e3779b9;
  let h4 = 0x85ebca6b;

  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
    h3 = Math.imul(h3 ^ ch, 2246822507);
    h4 = Math.imul(h4 ^ ch, 3266489909);
  }

  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 1597334677) ^ Math.imul(h1 ^ (h1 >>> 13), 2654435761);
  h3 = Math.imul(h3 ^ (h3 >>> 16), 2654435761) ^ Math.imul(h4 ^ (h4 >>> 13), 1597334677);
  h4 = Math.imul(h4 ^ (h4 >>> 16), 3266489909) ^ Math.imul(h3 ^ (h3 >>> 13), 2246822507);

  const p1 = (h1 >>> 0).toString(16).padStart(8, "0");
  const p2 = (h2 >>> 0).toString(16).padStart(8, "0");
  const p3 = (h3 >>> 0).toString(16).padStart(8, "0");
  const p4 = (h4 >>> 0).toString(16).padStart(8, "0");

  return `${p1}${p2}${p3}${p4}`;
}

/**
 * Initializes and retrieves the device visitor identifier using open-source FingerprintJS.
 * Checks sessionStorage first to minimize computation, then loads open-source FingerprintJS,
 * falling back to local entropy if offline or blocked.
 */
export async function getDeviceFingerprint(): Promise<string> {
  if (typeof window === "undefined") {
    return "00000000000000000000000000000000";
  }

  if (cachedVisitorId) {
    return cachedVisitorId;
  }

  // Check localStorage and sessionStorage
  try {
    const saved =
      localStorage.getItem("sensei_device_fingerprint") ||
      sessionStorage.getItem("sensei_device_fingerprint");
    if (saved && saved.length >= 16) {
      cachedVisitorId = saved;
      return saved;
    }
  } catch {
    // Ignore storage restrictions
  }

  if (fpPromise) {
    return fpPromise;
  }

  fpPromise = (async () => {
    try {
      // 1. Try official FingerprintJS open-source CDN (no API key required)
      // Reference: https://github.com/fingerprintjs/fingerprintjs#quick-start
      // @ts-ignore - dynamic import from openfpcdn
      const FingerprintJS = await import("https://openfpcdn.io/fingerprintjs/v4")
        .then((m) => m.default || m)
        .catch(async () => {
          // 2. Secondary CDN fallback
          // @ts-ignore
          return import("https://esm.sh/@fingerprintjs/fingerprintjs@4").then(
            (m) => m.default || m
          );
        });

      if (FingerprintJS && typeof FingerprintJS.load === "function") {
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        if (result && result.visitorId) {
          cachedVisitorId = result.visitorId;
          try {
            localStorage.setItem("sensei_device_fingerprint", result.visitorId);
            sessionStorage.setItem("sensei_device_fingerprint", result.visitorId);
          } catch {}
          return result.visitorId;
        }
      }
    } catch (err) {
      console.warn(
        "[FingerprintJS] CDN loader unavailable, falling back to local client entropy:",
        err
      );
    }

    // 3. Fallback to local deterministic client entropy
    const fallbackId = generateLocalEntropyHash();
    cachedVisitorId = fallbackId;
    try {
      localStorage.setItem("sensei_device_fingerprint", fallbackId);
      sessionStorage.setItem("sensei_device_fingerprint", fallbackId);
    } catch {}
    return fallbackId;
  })();

  return fpPromise;
}
