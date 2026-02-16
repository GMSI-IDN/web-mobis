'use client'

import React from 'react'
import Link from 'next/link'

type Media = {
  url?: string
  alt?: string
}

type Area = {
  label?: string
  href?: string
  PoolImage?: Media | string | null
}

type Props = {
  title?: string
  areas?: Area[]
}

/**
 * Catatan:
 * - Jika Payload Anda menyimpan media sebagai object (populated), PoolImage akan punya .url
 * - Jika belum populated (hanya ID string), Anda perlu populate depth di query/RenderBlocks
 */
function getMediaUrl(poolImage: Area['PoolImage']): string | null {
  if (!poolImage) return null
  if (typeof poolImage === 'string') return null // belum populated
  return poolImage.url ?? null
}

export default function AreaChipsBlockComponent({ title, areas }: Props) {
  return (
    <section className="area-section">
      <div className="container py-4 text-center">
        {title ? <div className="area-title">{title}</div> : null}

        <div className="row g-3 g-lg-4 justify-content-center">
          {(areas ?? []).map((a, i) => {
            const href = a?.href?.trim() || '#'
            const imgUrl = getMediaUrl(a?.PoolImage)
            const alt =
              (typeof a?.PoolImage === 'string' ? '' : a?.PoolImage?.alt) || a?.label || 'Area'

            return (
              <div className="col-12 col-md-4" key={i}>
                <Link className="area-card" href={href}>
                  <div className="area-thumb">
                    {imgUrl ? (
                      <img src={imgUrl} alt={alt} />
                    ) : (
                      // fallback sederhana jika gambar kosong
                      <div
                        style={{
                          height: 150,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: '#e9ecef',
                          color: '#6c757d',
                          fontWeight: 600,
                        }}
                      >
                        No Image
                      </div>
                    )}
                  </div>

                  <div className="area-bar">
                    <div className="area-label">{a?.label || '-'}</div>
                    <div className="area-cta">
                      Cek Lokasi disini <span className="arrow">→</span>
                    </div>
                  </div>
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
