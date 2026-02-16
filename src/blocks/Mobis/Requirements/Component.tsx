'use client'

import React from 'react'

type Props = {
  title?: string
  left?: { heading?: string; items?: { text: string }[] }
  right?: { heading?: string; items?: { text: string }[] }
  note?: string
}

export const Requirements: React.FC<Props> = ({ title, left, right, note }) => {
  return (
    <section className="requirements-section">
      <div className="container py-4">
        {title ? (
          <div className="text-center mb-3">
            {/* <h3 className="h6 fw-bold requirements-title mb-0">{title}</h3> */}
          </div>
        ) : null}

        <div className="requirements-card shadow-sm">
          <div className="requirements-card__body">
            <div className="row g-4">
              <div className="col-12 col-md-6">
                {left?.heading ? <div className="requirements-heading">{left.heading}</div> : null}

                <ol className="requirements-list">
                  {(left?.items ?? []).map((it, idx) => (
                    <li key={idx} className="requirements-list__item">
                      {it.text}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="col-12 col-md-6">
                {right?.heading ? (
                  <div className="requirements-heading">{right.heading}</div>
                ) : null}

                <ol className="requirements-list">
                  {(right?.items ?? []).map((it, idx) => (
                    <li key={idx} className="requirements-list__item">
                      {it.text}
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {note ? <div className="requirements-note">{note}</div> : null}
          </div>
        </div>
      </div>
    </section>
  )
}
