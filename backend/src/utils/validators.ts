// Email

export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return re.test(email.trim());
}

// URLs

/**
 * Return `true` if `url` is a syntactically valid http or https URL.
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Return `true` if `url` is a valid https URL whose hostname is `github.com`.
 */
export function isValidGithubUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    return (
      (parsed.protocol === "https:" || parsed.protocol === "http:") &&
      parsed.hostname === "github.com"
    );
  } catch {
    return false;
  }
}

// Sanitisation

/**
 * Trim whitespace and remove `<` and `>` characters to mitigate basic
 * HTML-injection risks in plain-text fields.
 */
export function sanitizeString(str: string): string {
  return str.trim().replace(/[<>]/g, "");
}

// GitHub helpers

/**
 * Extract the GitHub username from a GitHub profile or repository URL.
 *
 * Supports patterns like:
 *   - https://github.com/username
 *   - https://github.com/username/repo
 *   - http://github.com/username
 *
 * Returns `null` if the URL is not a valid GitHub URL or has no username
 * segment.
 */
export function extractGithubUsername(url: string): string | null {
  if (!isValidGithubUrl(url)) return null;

  try {
    const parsed = new URL(url.trim());
    // pathname starts with '/' — the first segment after it is the username
    const segments = parsed.pathname.split("/").filter(Boolean);
    return segments[0] ?? null;
  } catch {
    return null;
  }
}
