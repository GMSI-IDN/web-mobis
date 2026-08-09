function normalizeText(value: unknown) {
  return String(value ?? '').trim()
}

// Assumes a single trusted reverse proxy (Nginx) sits directly in front of
// this app, with no CDN/extra hop in between. Under that topology:
//  - X-Real-IP is fully overwritten by Nginx (`proxy_set_header X-Real-IP
//    $remote_addr;`) and cannot be spoofed by the client, so it's preferred.
//  - X-Forwarded-For may already contain a client-supplied value; Nginx's
//    default `$proxy_add_x_forwarded_for` only *appends* the real IP, so the
//    LAST entry (not the first) is the one to trust.
// If a CDN or additional proxy hop is ever added in front of Nginx, this
// logic must be revisited (the trusted hop count changes).
export function getClientIp(req: Request): string | undefined {
  const realIp = normalizeText(req.headers.get('x-real-ip'))
  if (realIp) return realIp

  const forwardedFor = normalizeText(req.headers.get('x-forwarded-for'))
  if (forwardedFor) {
    const hops = forwardedFor
      .split(',')
      .map((hop) => hop.trim())
      .filter(Boolean)
    const last = hops[hops.length - 1]
    if (last) return last
  }

  return undefined
}
