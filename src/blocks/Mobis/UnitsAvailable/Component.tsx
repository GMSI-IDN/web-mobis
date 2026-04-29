'use client'

import React from 'react'

type Props = {
  title?: string
  units?: { name: string; image?: any }[]
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

export const UnitsAvailable: React.FC<Props> = ({ title, units }) => {
  return (
    <section id="unit_mobil" className="bg-success-subtle">
      <div className="container py-4">
        <div className="text-center mb-3">
          <h2 className="small fw-bold text-success mb-0">{title}</h2>
        </div>

        <div className="row g-3 justify-content-center">
          {(units ?? []).map((u, idx) => {
            const imageUrl = u.image?.url
            const imageAlt = resolveUnitAlt(u.name, u.image)
            return (
              <div key={idx} className="col-10 col-sm-6 col-lg-4">
                <div className="unit-card bg_gradient_avaliabel_programs shadow-sm">
                  <div className="unit-card__media">
                    {imageUrl ? (
                      <img src={imageUrl} alt={imageAlt} className="unit-card__img" />
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
