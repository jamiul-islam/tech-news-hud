const X_USERNAME_REGEX = /^[a-z0-9_]{1,15}$/i;

/**
 * Normalizes user input into a valid X/Twitter handle (without the leading @).
 * Returns null when the input cannot be parsed into an allowed username.
 */
export function normalizeTwitterHandle(input?: string | null): string | null {
  if (!input) return null;
  let handle = input.trim();
  if (!handle) return null;

  if (handle.startsWith('http://') || handle.startsWith('https://')) {
    try {
      const url = new URL(handle);
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts.length > 0) {
        handle = parts[parts.length - 1];
      } else {
        handle = '';
      }
    } catch {
      // ignore URL parse errors; fall back to raw string
    }
  } else if (handle.startsWith('x.com/') || handle.startsWith('twitter.com/')) {
    const parts = handle.split('/').filter(Boolean);
    handle = parts[parts.length - 1] ?? '';
  }

  handle = handle.replace(/^@/, '');
  handle = handle.split(/[/?#]/)[0];

  const sanitized = handle.trim().toLowerCase();
  if (!X_USERNAME_REGEX.test(sanitized)) {
    return null;
  }
  return sanitized;
}

export function formatTwitterHandle(handle: string): string {
  return handle.startsWith('@') ? handle : `@${handle}`;
}
