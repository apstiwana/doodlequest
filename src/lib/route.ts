/**
 * URL handling for a single-screen app.
 *
 * Doodle quest has one screen and no navigation, so it carries no router. The only
 * question the app still asks of the URL is "is this the address we are served
 * from?", which is a string comparison rather than a routing table.
 */

/** Collapse the cosmetic differences between URLs that address the same document. */
function normalisePath(pathname: string): string {
  const withoutIndex = pathname.replace(/\/index\.html?$/i, "/");
  const withoutTrailingSlash = withoutIndex.replace(/\/+$/, "");
  return withoutTrailingSlash === "" ? "/" : withoutTrailingSlash;
}

/**
 * Whether `pathname` addresses the app's own entry point.
 *
 * `base` defaults to Vite's configured base URL rather than a literal "/" so that a
 * future sub-path deploy (`base: "/doodlequest/"`) does not make every legitimate
 * URL look like a 404.
 *
 * @param pathname - Typically `window.location.pathname`.
 * @param base - Deploy base path. Defaults to `import.meta.env.BASE_URL`.
 * @returns `true` when the game should render, `false` when the not-found page should.
 */
export function isAppRoot(
  pathname: string,
  base: string = import.meta.env.BASE_URL,
): boolean {
  return normalisePath(pathname) === normalisePath(base);
}
