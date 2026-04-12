'use client'

import React from 'react'

type Media = {
  url?: string
  alt?: string
  filename?: string
}

type Props = {
  title?: string
  alt?: string
  desktopImage?: Media | string | null
  mobileImage?: Media | string | null
  maxWidth?: number
}

function getUrl(input?: Media | string | null): string | undefined {
  if (!input) return undefined
  if (typeof input === 'string') return input
  return input.url
}

export const RegistrationFlow: React.FC<Props> = ({
  title = 'ALUR PENDAFTARAN',
  alt = 'Alur pendaftaran rental mobil Mobis untuk driver online',
  desktopImage,
  mobileImage,
  maxWidth = 1200,
}) => {
  const desktopUrl = getUrl(desktopImage)
  const mobileUrl = getUrl(mobileImage)
  const fallback = desktopUrl || mobileUrl

  if (!fallback) {
    return (
      <section className="bg-white">
        <div className="container py-4">
          <div className="text-center mb-4">
            <h3 className="h6 fw-bold text-success mb-4">{title}</h3>
          </div>
          <div className="text-center small text-muted">
            Gambar alur pendaftaran belum diisi di Payload.
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="alur_pendaftaran" className="bg-white">
      <div className="container py-4">
        <div className="text-center m-title-registration-flow">
          <h3 className="h6 fw-bold text-success mb-0">{title}</h3>
        </div>

        <div className="rf-img-wrap">
          <picture>
            {/* Mobile < md */}
            {mobileUrl ? <source media="(max-width: 767.98px)" srcSet={mobileUrl} /> : null}
            {/* Desktop >= md */}
            {desktopUrl ? <source media="(min-width: 768px)" srcSet={desktopUrl} /> : null}

            <img
              className="rf-img"
              src={fallback}
              alt={alt}
              loading="lazy"
              decoding="async"
              fetchPriority="low"
              style={{ maxWidth: `${maxWidth}px` }}
            />
          </picture>
        </div>
      </div>
    </section>
  )
}
