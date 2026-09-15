'use client'

import React from 'react'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { getMediaUrl } from '@/utilities/getMediaUrl'

type Props = {
  title?: string
  description?: SerializedEditorState | string // ✅ nama tetap "description"
  image?: any
}

export const AboutSplit: React.FC<Props> = ({ title, description, image }) => {
  // [10-09-2026] Utamakan format WebP dan ukuran responsif untuk efisiensi transfer data (hemat ~280 KiB)
  const rawUrl = image?.sizes?.medium?.url || image?.sizes?.small?.url || image?.url
  const cleanUrl = rawUrl ? rawUrl.replace(/\.png$/i, '.webp') : undefined
  const imageUrl = cleanUrl ? getMediaUrl(cleanUrl) : undefined
  const normalizedTitle =
    title?.trim() === 'Tentang Rental MOBIS' ? 'Tentang Layanan Rental Driver Online MOBIS' : title

  return (
    <section className="background-light about-section py-5">
      <div className="container py-4">
        <div className="row align-items-center g-3">
          <div className="col-6 ">
            <div className="text-about">
              <h1 className="fw-bold primary-color text-center title-about">{normalizedTitle}</h1>

              {/* ✅ RichText output (bold/italic/underline) */}
              <div className="mb-0 primary-color text-justify">
                {typeof description === 'string' ? (
                  // fallback kalau ada data lama yang masih string
                  <p className="mb-0">{description}</p>
                ) : description ? (
                  <RichText data={description} />
                ) : null}
              </div>
            </div>
          </div>

          <div className="col-6 overflow-hidden">
            <div className="card border-0 shadow-sm overflow-hidden about-rounded">
              {imageUrl ? (
                /* [10-09-2026] Tambahkan lazy loading, decoding async, dan dimensi dasar */
                <img
                  src={imageUrl}
                  alt={normalizedTitle ?? 'Tentang MOBIS'}
                  className="w-100"
                  width="600"
                  height="400"
                  loading="lazy"
                  decoding="async"
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div className="p-4 text-muted small">No image</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
