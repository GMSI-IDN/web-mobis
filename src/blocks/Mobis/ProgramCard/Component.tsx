'use client'

import React from 'react'

type Props = {
  title?: string
  subtitle?: string
  bullets?: { text: string }[]
  note?: string
  style?: { bgClass?: string; textClass?: string }
}

export const ProgramCard: React.FC<Props> = ({ title, subtitle, bullets, note, style }) => {
  const bgClass = style?.bgClass ?? 'bg-success'
  const textClass = style?.textClass ?? 'text-white'

  return (
    <section id="program" className="bg-success-subtle">
      <div className="container py-4">
        <div className={`card border-0 shadow-sm ${bgClass} ${textClass}`}>
          <div className="card-body p-4">
            <h2 className="h4 fw-bold mb-2">{title}</h2>
            {subtitle ? <p className=" mb-3 opacity-75">{subtitle}</p> : null}

            <ul className="program-rental-list mb-3">
              {(bullets ?? []).map((b, idx) => (
                <li key={idx} className="d-flex gap-2 mb-2">
                  <span aria-hidden="true">✅</span>
                  <span className="">{b.text}</span>
                </li>
              ))}
            </ul>

            {note ? <div className=" opacity-75">{note}</div> : null}
          </div>
        </div>
      </div>
    </section>
  )
}
