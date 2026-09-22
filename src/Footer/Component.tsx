import React from 'react'

import { getFooterCached } from '@/Footer/getFooter'
import { getServerSideURL } from '@/utilities/getURL'

type FooterData = {
  logo?: any
  socials?: Array<{ icon?: string; url?: string }>
}

function iconToBootstrapClass(icon?: string) {
  switch (icon) {
    case 'instagram':
      return 'bi bi-instagram'
    case 'facebook':
      return 'bi bi-facebook'
    case 'youtube':
      return 'bi bi-youtube'
    case 'tiktok':
      return 'bi bi-tiktok'
    default:
      return 'bi bi-globe'
  }
}

function toAbsURL(url?: string) {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url

  // Prioritas: URL Payload (jika frontend & payload beda host)
  const payloadBase =
    process.env.NEXT_PUBLIC_PAYLOAD_URL || process.env.PAYLOAD_PUBLIC_SERVER_URL || ''

  const base = (payloadBase || getServerSideURL()).replace(/\/$/, '')
  const path = url.startsWith('/') ? url : `/${url}`
  return `${base}${path}`
}

/**
 * layout.tsx Anda:
 *   import { Footer } from '@/Footer/Component'
 *   <Footer />
 *
 * Jadi wajib named export "Footer" dan tanpa props.
 */
export async function Footer() {
  const data = (await getFooterCached()) as FooterData | null

  const rawLogoUrl = typeof data?.logo === 'object' ? data?.logo?.url : undefined
  const logoUrl = toAbsURL(rawLogoUrl)

  const socials = data?.socials ?? []

  return (
    <footer className="footer-mobis">
      <div className="container-fluid py-4 text-center">
        {/* Logo */}
        {/* {logoUrl ? (
          <div className="mb-2">
            <img src={logoUrl} alt="MOBIS" className="footer-mobis__logo" />
          </div>
        ) : null} */}

        <div className="mb-2">
          {/* [10-09-2026] Tambahkan dimensi eksplisit, decoding async, dan lazy loading */}
          <img
            src="/media/new-white-2.png"
            alt="Logo MOBIS Footer"
            width="120"
            height="40"
            loading="lazy"
            decoding="async"
            className="footer-mobis__logo"
          />
        </div>

        {/* Social icons */}
        <div className="d-flex justify-content-center gap-3">
          {socials.map((s, i) => (
            <a
              key={i}
              href={s?.url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-mobis__icon"
              /* [10-09-2026] Tingkatkan deskripsi aria-label untuk pembaca layar */
              aria-label={`Kunjungi media sosial ${s?.icon || 'MOBIS'}`}
            >
              <i className={iconToBootstrapClass(s?.icon)} />
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
