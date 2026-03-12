'use client'

import React from 'react'

type MediaLike = {
  url?: string
  alt?: string
  filename?: string
}

type ProgramSide = {
  title?: string
  headerImage?: MediaLike
  subtitle?: string
  bullets?: { text: string }[]
  note?: string
}

type Props = {
  title?: string
  left?: ProgramSide
  right?: ProgramSide
  style?: {
    sectionBgClass?: string
    cardBgClass?: string
    cardTextClass?: string
    headerImgMaxWidth?: number
    headerTop?: number
    bodyTopPadding?: number
  }
}

function ProgramCard({
  side,
  cardBgClass,
  cardTextClass,
  headerImgMaxWidth,
  headerTop,
  bodyTopPadding,
}: {
  side?: ProgramSide
  cardBgClass: string
  cardTextClass: string
  headerImgMaxWidth: number
  headerTop: number
  bodyTopPadding: number
}) {
  if (!side) return null

  const headerUrl = side.headerImage?.url
  const headerAlt =
    side.headerImage?.alt || side.headerImage?.filename || side.title || 'Program title'

  return (
    <div className="program-card position-relative">
      {/* ✅ Header image floating (z-index tinggi) */}
      <div className="program-card__header">
        {headerUrl ? (
          <img src={headerUrl} alt={headerAlt} className="img-fluid" />
        ) : side.title ? (
          <div className="program-card__header--text text-center">{side.title}</div>
        ) : null}
      </div>

      {/* ✅ Card body dikasih padding-top supaya judul tidak menimpa */}
      <div
        className={`program-card__body card border-0 shadow-sm ${cardBgClass} ${cardTextClass}`}
        style={{ paddingTop: bodyTopPadding }}
      >
        <div className="card-body p-4">
          {side.subtitle ? (
            <p className="small mb-3 opacity-75 text-center" style={{ whiteSpace: 'pre-line' }}>
              {side.subtitle}
            </p>
          ) : null}

          <ul className="list-unstyled mb-3">
            {(side.bullets ?? []).map((b, idx) => (
              <li key={idx} className="d-flex gap-2 mb-2">
                <span aria-hidden="true" className="fw-bold">
                  ✓
                </span>
                <span className="small">{b.text}</span>
              </li>
            ))}
          </ul>

          {side.note ? <div className="small opacity-75">{side.note}</div> : null}
        </div>
      </div>
    </div>
  )
}

export const ProgramDual: React.FC<Props> = ({ title, left, right, style }) => {
  const sectionBgClass = style?.sectionBgClass ?? 'bg-white'
  const cardBgClass = style?.cardBgClass ?? 'bg-success'
  const cardTextClass = style?.cardTextClass ?? 'text-white'
  const headerImgMaxWidth = style?.headerImgMaxWidth ?? 320
  const headerTop = typeof style?.headerTop === 'number' ? style.headerTop : -26
  const bodyTopPadding = typeof style?.bodyTopPadding === 'number' ? style.bodyTopPadding : 60

  return (
    <section id="program" className={sectionBgClass}>
      <div className="container py-4">
        {title ? (
          <div className="text-center mb-3">
            {/* <h2 className="h6 fw-bold text-success mb-0">{title}</h2> */}
          </div>
        ) : null}

        {/* mobile stack, md+ 2 kolom */}
        <div className="row g-4 justify-content-center">
          <div className="col-12 col-md-6 mt-5 mt-md-0 m-mobis-button">
            <ProgramCard
              side={left}
              cardBgClass={cardBgClass}
              cardTextClass={cardTextClass}
              headerImgMaxWidth={headerImgMaxWidth}
              headerTop={headerTop}
              bodyTopPadding={bodyTopPadding}
            />
          </div>

          <div className="col-12 col-md-6 mt-5 mt-md-0 m-mobis-button">
            <ProgramCard
              side={right}
              cardBgClass={cardBgClass}
              cardTextClass={cardTextClass}
              headerImgMaxWidth={headerImgMaxWidth}
              headerTop={headerTop}
              bodyTopPadding={bodyTopPadding}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
