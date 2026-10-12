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
  const rawUrl = image?.sizes?.medium?.url || image?.sizes?.small?.url || image?.url
  const imageUrl = rawUrl ? getMediaUrl(rawUrl) : undefined
  const displayTitle = title || 'Gabung Jadi Mitra MOBIS'

  return (
    <section className="about-section">
      <div className="container px-3 px-md-4 py-3 py-md-4">
        <div className="row align-items-center g-4 g-lg-5 justify-content-center">
          <div className="col-12 col-md-6 col-lg-5">
            <div className="text-about mx-auto">
              <h2 className="title-about mb-2 mb-md-3">
                {displayTitle}
              </h2>

              {/* ✅ RichText output (bold/italic/underline) */}
              <div className="mb-0 about-description">
                {typeof description === 'string' ? (
                  // fallback kalau ada data lama yang masih string
                  <p className="mb-0">{description}</p>
                ) : description ? (
                  <RichText data={description} />
                ) : null}
              </div>
            </div>
          </div>

          <div className="col-12 col-md-6 col-lg-6 d-none d-md-block">
            <div
              className="card border-0 overflow-hidden mx-auto shadow"
              style={{
                borderRadius: '24px',
                maxWidth: '460px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.12)',
              }}
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={displayTitle}
                  className="w-100"
                  width="600"
                  height="340"
                  loading="lazy"
                  decoding="async"
                  style={{
                    objectFit: 'cover',
                    height: '270px',
                    borderRadius: '24px',
                  }}
                />
              ) : (
                <div className="p-4 text-muted small text-center">No image</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
