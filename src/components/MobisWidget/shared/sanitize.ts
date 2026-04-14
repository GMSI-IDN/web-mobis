function escapeHtml(s: string) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

const ALLOWED_TAGS = new Set(['A', 'BR', 'STRONG', 'IMG'])
const ALLOWED_ATTR: Record<string, Set<string>> = {
  A: new Set(['href', 'target', 'rel', 'class']),
  IMG: new Set(['src', 'alt', 'class']),
  STRONG: new Set([]),
  BR: new Set([]),
}

export function sanitizeHtml(input: string) {
  const raw = String(input ?? '')

  // Server-side / no DOMParser -> fallback plaintext
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return escapeHtml(raw).replaceAll('\n', '<br>')
  }

  try {
    const doc = new DOMParser().parseFromString(raw, 'text/html')

    // ✅ Guard: body bisa null pada beberapa kasus
    const root = doc.body ?? doc.documentElement
    if (!root) {
      return escapeHtml(raw).replaceAll('\n', '<br>')
    }

    const walk = (node: Node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement
        const tag = el.tagName.toUpperCase()

        // buang tag yang tidak di-allow
        if (!ALLOWED_TAGS.has(tag)) {
          el.replaceWith(doc.createTextNode(el.textContent || ''))
          return
        }

        // bersihkan attributes (hapus event handlers, dll)
        ;[...el.attributes].forEach((attr) => {
          const name = attr.name.toLowerCase()

          if (name.startsWith('on')) {
            el.removeAttribute(attr.name)
            return
          }

          const allowed = ALLOWED_ATTR[tag]
          if (allowed && !allowed.has(attr.name)) el.removeAttribute(attr.name)
        })

        // normalisasi <a>
        if (tag === 'A') {
          el.setAttribute('target', '_blank')
          el.setAttribute('rel', 'noreferrer noopener')

          const href = el.getAttribute('href') || ''
          // allow only http(s)
          if (!href.startsWith('http://') && !href.startsWith('https://')) {
            el.removeAttribute('href')
          }
        }

        // normalisasi <img>
        if (tag === 'IMG') {
          const src = el.getAttribute('src') || ''
          if (!src.startsWith('http://') && !src.startsWith('https://')) {
            el.removeAttribute('src')
          }
          el.classList.add('mw-100', 'rounded')
        }
      }

      Array.from(node.childNodes).forEach(walk)
    }

    walk(root)

    // ✅ Guard: root mungkin bukan HTMLElement yang punya innerHTML di typings,
    // tapi di runtime Element pasti punya innerHTML
    const html = (root as any).innerHTML
    if (typeof html !== 'string') {
      return escapeHtml(raw).replaceAll('\n', '<br>')
    }

    return html
  } catch (e) {
    console.error('[MobisWidget sanitizeHtml] failed:', e)
    return escapeHtml(raw).replaceAll('\n', '<br>')
  }
}
