'use client'

import React from 'react'
import { getMediaUrl } from '@/utilities/getMediaUrl'

type Unit = {
  name: string
  image?: any
  isNew?: boolean | null
}

type Props = {
  title?: string
  description?: string | null
  units?: Unit[]
}

function resolveUnitAlt(unitName?: string, image?: { alt?: string; filename?: string }) {
  const explicitAlt = String(image?.alt || '').trim()
  if (explicitAlt) return explicitAlt

  const name = String(unitName || '').toLowerCase()
  const filename = String(image?.filename || '').toLowerCase()

  if (name.includes('calya') || filename.includes('calya')) {
    return 'Sewa Toyota Calya untuk rental driver online'
  }

  if (name.includes('sigra') || filename.includes('sigra')) {
    return 'Sewa Daihatsu Sigra untuk rental driver online'
  }

  return `${unitName || 'Unit mobil'} untuk rental driver online`
}

export const UnitsAvailable: React.FC<Props> = ({ title, description, units }) => {
  const totalUnits = units?.length ?? 0
  const isEvenFromFour = totalUnits >= 4 && totalUnits % 2 === 0
  const colClass = isEvenFromFour ? 'col-10 col-sm-6 col-lg-6' : 'col-10 col-sm-6 col-lg-4'

  return (
    <section id="unit_mobil" className="bg-success-subtle">
      <div className="container py-4 pb-5">
        <div className="text-center mb-3">
          <h2 className="small fw-bold text-success mb-0">{title}</h2>
          {description && <p className="units-description">{description}</p>}
        </div>

        <div className="row g-4 gy-5 justify-content-center">
          {(units ?? []).map((u, idx) => {
            const imgSizes = u.image?.sizes
            const thumbUrl = imgSizes?.thumbnail?.url ? getMediaUrl(imgSizes.thumbnail.url) : null
            const squareUrl = imgSizes?.square?.url ? getMediaUrl(imgSizes.square.url) : null
            const smallUrl = imgSizes?.small?.url ? getMediaUrl(imgSizes.small.url) : null
            const originalUrl = u.image?.url ? getMediaUrl(u.image.url) : null

            // Fallback src: prefer square (500x500) or small over full original
            const imageUrl = squareUrl || smallUrl || thumbUrl || originalUrl

            // Responsive srcSet: mobile (273px display) downloads thumbnail (300w) or square (500w)
            const srcSetEntries: string[] = []
            if (thumbUrl) srcSetEntries.push(`${thumbUrl} 300w`)
            if (squareUrl) srcSetEntries.push(`${squareUrl} 500w`)
            if (smallUrl) srcSetEntries.push(`${smallUrl} 600w`)
            if (originalUrl) srcSetEntries.push(`${originalUrl} 820w`)
            const srcSet = srcSetEntries.length > 1 ? srcSetEntries.join(', ') : undefined
            const sizesAttr = '(max-width: 576px) 280px, (max-width: 992px) 350px, 300px'

            const imageAlt = resolveUnitAlt(u.name, u.image)
            return (
              <div key={idx} className={colClass}>
                <div className="unit-card bg_gradient_avaliabel_programs shadow-sm">
                  {u.isNew && (
                    <div className="unit-card__ribbon-wrapper">
                      <div className="unit-card__ribbon">
                        <span className="unit-card__ribbon-text">UNIT BARU</span>
                      </div>
                    </div>
                  )}
                  <div className="unit-card__media">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        srcSet={srcSet}
                        sizes={sizesAttr}
                        alt={imageAlt}
                        className="unit-card__img"
                        width="500"
                        height="500"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="p-4 text-muted small">No image</div>
                    )}
                  </div>
                  <div className="unit-card__footer">
                    <span className="unit-card__badge">{u.name}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
