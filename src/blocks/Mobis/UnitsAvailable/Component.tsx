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
  const colClass = totalUnits === 3 ? 'col-6 col-sm-4 col-lg-4' : 'col-6 col-lg-3'

  return (
    <section id="unit_mobil" className="unit-mobil-section">
      <div className="container py-3 py-md-4 pb-4 pb-md-5">
        <div className="text-center mb-3 mb-md-4">
          <h2 className="visually-hidden">{title || 'Pilihan Mobil Buat Onbid Kamu'}</h2>
          <div className="d-flex justify-content-center mb-1 mb-md-2">
            <img
              src="/mobis/img/pilihan-mobil-header.webp"
              alt={title || 'Pilihan Mobil Buat Onbid Kamu'}
              className="unit-header-sticker img-fluid"
              width="545"
              height="118"
              loading="lazy"
              decoding="async"
            />
          </div>
          <p className="unit-header-subtitle mx-auto mb-0">
            {description ||
              'Tersedia pilihan mobil yang irit dan terbaru biar onbid lebih hemat dan tetap nyaman!'}
          </p>
        </div>

        <div className="unit-cards-wrapper mx-auto">
          <div className="row g-3 g-md-4 g-lg-4 gy-4 justify-content-center">
          {(units ?? []).map((u, idx) => {
            const rawImageUrl =
              u.image?.sizes?.square?.url ||
              u.image?.sizes?.small?.url ||
              u.image?.sizes?.thumbnail?.url ||
              u.image?.url
            const imageUrl = getMediaUrl(rawImageUrl)
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
    </div>
  </section>
)
}
