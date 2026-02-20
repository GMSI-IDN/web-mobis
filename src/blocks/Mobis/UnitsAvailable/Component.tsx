'use client'

import React from 'react'

type Props = {
  title?: string
  units?: { name: string; image?: any }[]
}

export const UnitsAvailable: React.FC<Props> = ({ title, units }) => {
  return (
    <section id="unit_mobil" className="bg-success-subtle">
      <div className="container py-4">
        <div className="text-center mb-3">
          <div className="small fw-bold text-success">{title}</div>
        </div>

        <div className="row g-3 justify-content-center">
          {(units ?? []).map((u, idx) => {
            const imageUrl = u.image?.url
            return (
              <div key={idx} className="col-10 col-sm-6 col-lg-4">
                <div className="unit-card bg_gradient_avaliabel_programs shadow-sm">
                  <div className="unit-card__media">
                    {imageUrl ? (
                      <img src={imageUrl} alt={u.name} className="unit-card__img" />
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
