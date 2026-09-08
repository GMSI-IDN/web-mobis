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
      <div className="container py-4 py-lg-5">
        {title ? (
          <div className="text-center mb-4 pb-2">
            <h2 className="h6 fw-bold requirements-title mb-0">{title}</h2>
          </div>
        ) : null}

        <div className="requirements-card shadow-sm">
          <div className="requirements-card__body">
            <div className="row g-4 g-lg-5">
              <div className="col-12 col-md-6 p-reqruitments">
                {left?.heading ? <h3 className="requirements-heading">{left.heading}</h3> : null}

                <ol className="requirements-list">
                  {(left?.items ?? []).map((it, idx) => (
                    <li key={idx} className="requirements-list__item">
                      {it.text}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="col-12 col-md-6 p-reqruitments">
                {right?.heading ? (
                  <h3 className="requirements-heading">{right.heading}</h3>
                ) : null}

                <ol className="requirements-list">
                  {(right?.items ?? []).map((it, idx) => (
                    <li key={idx} className="requirements-list__item">
                      {it.text}
                    </li>
                  ))}
                </ol>
                <div className="requirements-note">* S&K Berlaku</div>
              </div>
              {/* <div className="requirements-note">*S&K Berlaku</div> */}
            </div>
            {/* <div className="requirements-note">*S&K Berlaku</div> */}
            {note ? <div className="requirements-note">{note}</div> : null}
          </div>
        </div>
      </div>
    </section>
  )
}
