import React from 'react'

import { getFooterCached } from '@/Footer/getFooter'

type FooterData = {
  logo?: any
  socials?: Array<{ icon?: string; url?: string }>
}

function renderSocialIcon(icon?: string) {
  switch (icon) {
    case 'instagram':
      return (
        <img
          src="/mobis/img/ig_white_logo.svg"
          alt="Instagram"
          width="26"
          height="26"
          loading="lazy"
          decoding="async"
        />
      )
    case 'facebook':
      return (
        <img
          src="/mobis/img/fb_white_logo.svg"
          alt="Facebook"
          width="26"
          height="26"
          loading="lazy"
          decoding="async"
        />
      )
    case 'tiktok':
      return (
        <img
          src="/mobis/img/tk_white_logo.svg"
          alt="TikTok"
          width="26"
          height="26"
          loading="lazy"
          decoding="async"
        />
      )
    case 'whatsapp':
      return (
        <img
          src="/mobis/img/wa_white_logo.svg"
          alt="WhatsApp"
          width="26"
          height="26"
          loading="lazy"
          decoding="async"
        />
      )
    case 'youtube':
      return (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      )
    default:
      return (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      )
  }
}

/**
 * layout.tsx:
 *   import { Footer } from '@/Footer/Component'
 *   <Footer />
 *
 * Jadi wajib named export "Footer" dan tanpa props.
 */
export async function Footer() {
  const data = (await getFooterCached()) as FooterData | null
  const socials = data?.socials ?? []

  return (
    <footer className="footer-mobis">
      <div className="container-fluid py-4 text-center">
        {/* Logo */}
        <div className="mb-2">
          {/* [10-09-2026] Tambahkan dimensi eksplisit, decoding async, dan lazy loading */}
          <img
            src="/mobis/img/mobis-white-logo.svg"
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
              {renderSocialIcon(s?.icon)}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
