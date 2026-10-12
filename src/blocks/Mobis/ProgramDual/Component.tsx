'use client'

import React from 'react'
import { getMediaUrl } from '@/utilities/getMediaUrl'

type MediaLike = {
  url?: string
  alt?: string
  filename?: string
  sizes?: Record<string, { url?: string | null; filename?: string | null } | null | undefined>
}

type ProgramSide = {
  title?: string
  headerImage?: MediaLike
  subtitle?: string
  bullets?: { text: string }[]
  note?: string
}

type RequirementsData = {
  title?: string
  left?: { heading?: string; items?: { text: string }[] }
  right?: { heading?: string; items?: { text: string }[] }
  note?: string
}

type Props = {
  title?: string
  left?: ProgramSide
  right?: ProgramSide
  requirements?: RequirementsData
  style?: {
    sectionBgClass?: string
    cardBgClass?: string
    cardTextClass?: string
    headerImgMaxWidth?: number
    headerTop?: number
    bodyTopPadding?: number
  }
}

function resolveProgramHeaderAlt(side?: ProgramSide) {
  const explicitAlt = side?.headerImage?.alt?.trim()
  if (explicitAlt) return explicitAlt

  const filename = side?.headerImage?.filename?.toLowerCase() || ''
  if (filename.includes('pro-mingguan')) return 'Program rental driver online mingguan'

  return side?.title || 'Program rental driver online mingguan'
}

const DEFAULT_PERSYARATAN = {
  umum: {
    heading: 'Persyaratan Umum',
    items: [
      'Berdomisili di Jabodetabek/Bandung/Surabaya/Sidoarjo/Gresik/Bali',
      'Usia 18 - 62 tahun',
    ],
  },
  dokumen: {
    heading: 'Persyaratan Dokumen',
    items: [
      'KTP',
      'Kartu Keluarga',
      'SIM A / B',
      'PBB / Surat Ket. kepemilikan rumah/\nBukti sewa',
      'Surat keterangan domisili*',
      'Dokumen Penjamin*',
    ],
  },
  note: '*S&K Berlaku',
}

function RequirementsCard({ requirements }: { requirements?: RequirementsData }) {
  const umumHeading = requirements?.left?.heading || DEFAULT_PERSYARATAN.umum.heading
  const formatText = (text: string) => {
    // Allow natural line breaks after slashes so long paths wrap without overflowing on mobile
    return String(text || '').replace(/\/(?!\s)/g, '/\u200B')
  }

  const umumItems =
    requirements?.left?.items && requirements.left.items.length > 0
      ? requirements.left.items.map((it) => formatText(it.text))
      : DEFAULT_PERSYARATAN.umum.items.map((it) => formatText(it))

  const dokumenHeading = requirements?.right?.heading || DEFAULT_PERSYARATAN.dokumen.heading
  const dokumenItems =
    requirements?.right?.items && requirements.right.items.length > 0
      ? requirements.right.items.map((it) => formatText(it.text))
      : DEFAULT_PERSYARATAN.dokumen.items.map((it) => formatText(it))

  const note = requirements?.note || DEFAULT_PERSYARATAN.note

  return (
    <div className="persyaratan-card">
      <div className="persyaratan-card__body">
        <div>
          {/* Persyaratan Umum */}
          <div className="mb-3">
            <h3 className="persyaratan-card__heading">{umumHeading}</h3>
            <ol className="persyaratan-card__list">
              {umumItems.map((text, idx) => (
                <li key={idx} className="persyaratan-card__item">
                  <span className="persyaratan-card__item-number">{idx + 1}.</span>
                  <span className="persyaratan-card__item-text">{text}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Persyaratan Dokumen */}
          <div>
            <h3 className="persyaratan-card__heading">{dokumenHeading}</h3>
            <ol className="persyaratan-card__list">
              {dokumenItems.map((text, idx) => (
                <li key={idx} className="persyaratan-card__item">
                  <span className="persyaratan-card__item-number">{idx + 1}.</span>
                  <span className="persyaratan-card__item-text" style={{ whiteSpace: 'pre-line' }}>
                    {text}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {note && <div className="persyaratan-card__note">{note}</div>}
      </div>
    </div>
  )
}

function ProgramCard({
  side,
}: {
  side?: ProgramSide
}) {
  const fallbackSide: ProgramSide = {
    title: 'Program Rental Mingguan',
    subtitle: 'Program sewa mobil yang fleksibel dengan pembayaran mingguan/harian',
    bullets: [
      { text: 'Gratis Service Rutin & pajak tahunan' },
      { text: 'Tersedia mobil pengganti' },
      { text: 'Lepas kunci 24 jam' },
      { text: 'Harga sewa mulai dari 120 ribu/hari' },
      { text: 'Tersedia tim towing dan storing' },
    ],
  }

  const activeSide = side || fallbackSide
  const rawHeaderUrl =
    activeSide.headerImage?.sizes?.small?.url ||
    activeSide.headerImage?.sizes?.thumbnail?.url ||
    activeSide.headerImage?.url
  const headerUrl = rawHeaderUrl ? getMediaUrl(rawHeaderUrl) : '/mobis/img/pro-mingguan.webp'
  const headerAlt = resolveProgramHeaderAlt(activeSide)

  return (
    <div className="program-card">
      {/* Header image floating */}
      <div className="program-card__header">
        <img
          src={headerUrl}
          alt={headerAlt}
          className="img-fluid"
          width="466"
          height="193"
          loading="lazy"
          decoding="async"
        />
      </div>

      <div className="program-card__body">
        <div>
          {activeSide.subtitle ? (
            <p className="program-card__subtitle">
              {activeSide.subtitle}
            </p>
          ) : null}

          <ul className="program-bullets">
            {(activeSide.bullets ?? fallbackSide.bullets ?? []).map((b, idx) => (
              <li key={idx}>
                <span aria-hidden="true" className="program-bullet-icon">
                  ✓
                </span>
                <span>{b.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {activeSide.note ? <div className="small opacity-75 mt-2">{activeSide.note}</div> : null}
      </div>
    </div>
  )
}

export const ProgramDual: React.FC<Props> = ({ left, requirements }) => {
  return (
    <section id="program" className="program-section">
      <div className="container py-4 py-md-5">
        <div className="row g-4 justify-content-center align-items-stretch program-cards-row mx-auto">
          {/* Card 1: Program Rental Mingguan */}
          <div className="col-12 col-md-6 d-flex justify-content-center">
            <ProgramCard side={left} />
          </div>

          {/* Card 2: Persyaratan */}
          <div className="col-12 col-md-6 d-flex justify-content-center">
            <RequirementsCard requirements={requirements} />
          </div>
        </div>
      </div>
    </section>
  )
}
