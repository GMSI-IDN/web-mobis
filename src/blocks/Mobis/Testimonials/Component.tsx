'use client'

import React, { useMemo, useRef, useState, useEffect } from 'react'
import { getMediaUrl } from '@/utilities/getMediaUrl'

type Testi = {
  id?: string
  name: string
  role?: string
  rating?: number
  text: string
  avatar?: any
}

type Props = {
  title?: string
  items?: Testi[]
  intervalMs?: number // 0 = off
}

const DEFAULT_TESTIS: Testi[] = [
  {
    name: 'HARMAINI',
    role: 'Gabung 2020',
    rating: 5,
    text: 'Harga murah dibanding yang lain, dan penanganannya cepat',
    avatar: { url: '/mobis/img/foto-5.webp' },
  },
  {
    name: 'RIZAL',
    role: 'Gabung 2024',
    rating: 5,
    text: 'Rental yang terbaik, biaya sewa cukup ekonomis, service bulanan dijamin',
    avatar: { url: '/mobis/img/foto-6.webp' },
  },
  {
    name: 'JOHN',
    role: 'Gabung 2025',
    rating: 5,
    text: 'Administrasi mudah tidak rumit, setoran murah dan dikasih tempo seminggu jadi lebih tenang',
    avatar: { url: '/mobis/img/foto-7.webp' },
  },
  {
    name: 'FARIS',
    role: 'Gabung 2025',
    rating: 5,
    text: 'Lokasi dekat, harga murah, dan prosesnya mudah',
    avatar: { url: '/mobis/img/foto-8.webp' },
  },
]

function Stars({ rating }: { rating: number }) {
  const r = Math.max(1, Math.min(5, rating))
  return (
    <div className="testi-stars" aria-label={`Rating ${r} dari 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < r ? 'testi-star--active' : 'testi-star--inactive'}>
          ★
        </span>
      ))}
    </div>
  )
}

function Card({ t }: { t: Testi }) {
  const rawAvatarUrl =
    t.avatar?.sizes?.thumbnail?.url ||
    t.avatar?.sizes?.square?.url ||
    t.avatar?.url ||
    (typeof t.avatar === 'string' ? t.avatar : undefined)

  const avatarUrl = rawAvatarUrl ? getMediaUrl(rawAvatarUrl) : undefined
  const rating = t.rating ?? 5

  return (
    <div className="testi-card" style={{ minHeight: 112 }}>
      {/* Kolom Kiri: Foto Profil, Nama, & Masa Gabung */}
      <div className="testi-card__profile" style={{ width: 68, flexShrink: 0 }}>
        <div
          className="testi-card__avatar"
          style={{ width: 44, height: 44, minWidth: 44, maxWidth: 44, borderRadius: '50%', overflow: 'hidden' }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={t.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: '50%' }}
              loading="lazy"
            />
          ) : (
            <div className="testi-card__avatar-placeholder">
              {t.name?.charAt(0) || 'M'}
            </div>
          )}
        </div>
        <div className="testi-card__name">{t.name}</div>
        {t.role ? <div className="testi-card__role">{t.role}</div> : null}
      </div>

      {/* Kolom Kanan: Teks Ulasan & Rating Bintang di bawahnya */}
      <div className="testi-card__content" style={{ flex: 1, minWidth: 0 }}>
        <p className="testi-card__quote">{t.text}</p>
        <Stars rating={rating} />
      </div>
    </div>
  )
}

export const Testimonials: React.FC<Props> = ({ title, items, intervalMs }) => {
  const list = useMemo(() => {
    if (items && items.length > 0) return items
    return DEFAULT_TESTIS
  }, [items])

  const trackRef = useRef<HTMLDivElement | null>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScroll = () => {
    if (!trackRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = trackRef.current
    setCanScrollLeft(scrollLeft > 10)
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10)
  }

  useEffect(() => {
    checkScroll()
    const el = trackRef.current
    if (!el) return
    el.addEventListener('scroll', checkScroll, { passive: true })
    window.addEventListener('resize', checkScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [list])

  // Auto-scroll jika intervalMs disediakan
  useEffect(() => {
    const ms = typeof intervalMs === 'number' && intervalMs > 0 ? intervalMs : 0
    if (!ms || list.length <= 1) return

    const timer = setInterval(() => {
      if (trackRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = trackRef.current
        if (scrollLeft + clientWidth >= scrollWidth - 15) {
          trackRef.current.scrollTo({ left: 0, behavior: 'smooth' })
        } else {
          trackRef.current.scrollBy({ left: 285, behavior: 'smooth' })
        }
      }
    }, ms)

    return () => clearInterval(timer)
  }, [intervalMs, list.length])

  // Support drag-to-scroll dengan pointer
  const isDragging = useRef(false)
  const startX = useRef(0)
  const initialScrollLeft = useRef(0)

  const onPointerDown = (e: React.PointerEvent) => {
    if (!trackRef.current) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    isDragging.current = true
    startX.current = e.clientX
    initialScrollLeft.current = trackRef.current.scrollLeft
    try {
      trackRef.current.setPointerCapture(e.pointerId)
    } catch {}
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !trackRef.current) return
    const dx = e.clientX - startX.current
    trackRef.current.scrollLeft = initialScrollLeft.current - dx
  }

  const onPointerUp = (e: React.PointerEvent) => {
    if (!isDragging.current) return
    isDragging.current = false
    try {
      trackRef.current?.releasePointerCapture(e.pointerId)
    } catch {}
  }

  const scrollBy = (offset: number) => {
    if (trackRef.current) {
      trackRef.current.scrollBy({ left: offset, behavior: 'smooth' })
    }
  }

  return (
    <section className="testi-section" id="kata_mitra_kami">
      <div className="container px-0 px-md-3">
        {/* Judul Seksi */}
        <div className="text-center mb-3">
          <h2 className="testi-title">{title ?? 'KATA MITRA KAMI'}</h2>
        </div>

        {/* Track Slider Testimoni */}
        <div className="testi-track-wrapper">
          {/* Tombol navigasi desktop */}
          {canScrollLeft && (
            <button
              type="button"
              className="testi-nav-btn testi-nav-btn--prev d-none d-md-flex"
              onClick={() => scrollBy(-285)}
              aria-label="Previous Testimonial"
            >
              ‹
            </button>
          )}

          <div
            ref={trackRef}
            className="testi-track"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {list.map((t, idx) => (
              <div key={t.id || idx} className="testi-slide">
                <Card t={t} />
              </div>
            ))}
          </div>

          {canScrollRight && (
            <button
              type="button"
              className="testi-nav-btn testi-nav-btn--next d-none d-md-flex"
              onClick={() => scrollBy(285)}
              aria-label="Next Testimonial"
            >
              ›
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
