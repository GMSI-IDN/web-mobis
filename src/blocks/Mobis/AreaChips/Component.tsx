'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'

type Media = {
  url?: string
  alt?: string
}

type Pool = {
  name?: string
  mapUrl?: string
}

type Area = {
  label?: string
  PoolImage?: Media | string | null
  pools?: Pool[]
}

type Props = {
  title?: string
  areas?: Area[]
}

function getMediaUrl(poolImage: Area['PoolImage']): string | null {
  if (!poolImage) return null
  if (typeof poolImage === 'string') return null // belum populated
  return poolImage.url ?? null
}

export default function AreaChipsBlockComponent({ title, areas }: Props) {
  const modalElRef = useRef<HTMLDivElement | null>(null)
  const bsModalRef = useRef<any>(null)

  const [activeAreaIndex, setActiveAreaIndex] = useState<number | null>(null)

  const activeArea = useMemo(() => {
    if (activeAreaIndex === null) return null
    return (areas ?? [])[activeAreaIndex] ?? null
  }, [activeAreaIndex, areas])

  // Init bootstrap modal sekali
  useEffect(() => {
    let mounted = true

    ;(async () => {
      if (!modalElRef.current) return
      // bootstrap tersedia global atau via import (kita coba import dulu)
      try {
        const bootstrap = await import('bootstrap')
        if (!mounted) return
        bsModalRef.current = new bootstrap.Modal(modalElRef.current, {
          backdrop: true,
          keyboard: true,
        })
      } catch {
        // fallback jika bootstrap sudah global
        const w = window as any
        if (!mounted) return
        if (w?.bootstrap?.Modal) {
          bsModalRef.current = new w.bootstrap.Modal(modalElRef.current, {
            backdrop: true,
            keyboard: true,
          })
        }
      }
    })()

    return () => {
      mounted = false
      try {
        bsModalRef.current?.dispose?.()
      } catch {}
      bsModalRef.current = null
    }
  }, [])

  const openModalForArea = (index: number) => {
    setActiveAreaIndex(index)
    // tunggu state ke-render dulu sedikit agar judul/list update
    setTimeout(() => {
      bsModalRef.current?.show?.()
    }, 0)
  }

  const closeModal = () => {
    bsModalRef.current?.hide?.()
  }

  return (
    <section className="area-section">
      <div className="container py-4 text-center">
        {title ? <h2 className="area-title">{title}</h2> : null}

        <div className="row g-3 g-lg-4 justify-content-center">
          {(areas ?? []).map((a, i) => {
            const imgUrl = getMediaUrl(a?.PoolImage)
            const alt =
              (typeof a?.PoolImage === 'string' ? '' : a?.PoolImage?.alt) ||
              (a?.label ? `Lokasi pool Mobis ${a.label}` : 'Lokasi pool Mobis')

            return (
              <div className="col-12 col-md-4" key={i}>
                {/* ✅ Card jadi button supaya tidak pindah halaman */}
                <button
                  type="button"
                  className="area-card area-card-btn"
                  onClick={() => openModalForArea(i)}
                >
                  <div className="area-thumb">
                    {imgUrl ? (
                      <img src={imgUrl} alt={alt} loading="lazy" decoding="async" fetchPriority="low" />
                    ) : (
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
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* ✅ MODAL */}
      <div
        ref={modalElRef}
        className="modal fade area-pools-modal"
        tabIndex={-1}
        aria-hidden="true"
        aria-labelledby="areaPoolsModalLabel"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content rounded-4 shadow area-modal-content">
            <div className="modal-header border-0 area-modal-header">
              <h5 id="areaPoolsModalLabel" className="modal-title area-modal-title">
                {activeArea?.label ? `${String(activeArea.label).toUpperCase()}` : 'POOL'}
              </h5>
              <button
                type="button"
                className="area-modal-close-btn"
                onClick={closeModal}
                aria-label="Tutup modal area"
              >
                X
              </button>
            </div>

            <div className="modal-body area-modal-body">
              {activeArea?.pools?.length ? (
                <div className="list-group list-group-flush area-pools-list">
                  {activeArea.pools.map((p, idx) => {
                    const name = p?.name?.trim() || '-'
                    const mapUrl = p?.mapUrl?.trim() || '#'

                    return (
                      <a
                        key={idx}
                        href={mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                      >
                        <span className="fw-semibold">{name}</span>
                        <span aria-hidden="true">→</span>
                      </a>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center text-muted py-3">Lokasi belum diisi.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
