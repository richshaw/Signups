// `trustHost: true` makes NextAuth derive the magic-link origin from the
// request's Host header, which on Fly.io can be the internal `*.fly.dev`
// hostname rather than the public domain. Re-anchor the URL to AUTH_URL
// (the canonical origin) before sending — path/query/hash are preserved.
export function canonicalizeMagicLinkUrl(rawUrl: string, authUrl: string): string {
  const canonical = new URL(authUrl);
  const link = new URL(rawUrl);
  link.protocol = canonical.protocol;
  link.host = canonical.host;
  return link.toString();
}
