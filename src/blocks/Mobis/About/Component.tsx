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
  const imgSizes = image?.sizes
  const thumbUrl = imgSizes?.thumbnail?.url ? getMediaUrl(imgSizes.thumbnail.url) : null
  const smallUrl = imgSizes?.small?.url ? getMediaUrl(imgSizes.small.url) : null
  const mediumUrl = imgSizes?.medium?.url ? getMediaUrl(imgSizes.medium.url) : null
  const originalUrl = image?.url ? getMediaUrl(image.url) : undefined

  // Fallback: prefer small/medium over full original
  const imageUrl = smallUrl || mediumUrl || thumbUrl || originalUrl

  // Build responsive srcSet
  const srcSetEntries: string[] = []
  if (thumbUrl) srcSetEntries.push(`${thumbUrl} 300w`)
  if (smallUrl) srcSetEntries.push(`${smallUrl} 600w`)
  if (mediumUrl) srcSetEntries.push(`${mediumUrl} 900w`)
  if (originalUrl) srcSetEntries.push(`${originalUrl} 1200w`)
  const srcSet = srcSetEntries.length > 1 ? srcSetEntries.join(', ') : undefined
  const sizesAttr = '(max-width: 768px) 50vw, 600px'

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
                <img
                  src={imageUrl}
                  srcSet={srcSet}
                  sizes={sizesAttr}
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
