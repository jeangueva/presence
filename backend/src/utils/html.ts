/**
 * Escape user-controlled strings before embedding into HTML (emails,
 * server-rendered OG pages, etc.). Covers the OWASP-recommended 5
 * (& < > " ') so output is safe in attribute or text contexts.
 */
export const escapeHtml = (s: string | null | undefined): string => {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

/**
 * Safely embed a JSON object inside a <script type="application/ld+json"> tag.
 * Prevents </script> break-out by escaping `<` as a Unicode escape that the
 * JSON parser still understands.
 */
export const escapeJsonForScript = (obj: unknown): string =>
  JSON.stringify(obj).replace(/</g, "\\u003c").replace(/>/g, "\\u003e");

/**
 * Sanitize a search query before passing it to a Supabase/PostgREST `.or()`
 * filter. PostgREST treats `,` as a filter separator and `()` as grouping —
 * if a user-controlled value contains them, the filter shape changes.
 *
 * Strategy: drop reserved characters entirely. Keeps letters/numbers/spaces
 * and a handful of common diacritics-safe chars. Length-clamped.
 */
export const sanitizePostgrestQuery = (q: string, maxLen = 80): string =>
  q
    .normalize("NFC")
    .replace(/[(),.*?%\\"'`<>{}[\];]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
