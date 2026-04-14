'use client'

import React, { useEffect, useId, useMemo, useRef, useState } from 'react'

type Testi = {
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

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

function Stars({ rating }: { rating: number }) {
  const r = Math.max(1, Math.min(5, rating))
  return (
    <div className="d-flex gap-1" aria-label={`Rating ${r} dari 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < r ? 'text-warning' : 'text-muted'}>
          ★
        </span>
      ))}
    </div>
  )
}

function Card({ t }: { t: Testi }) {
  const avatarUrl = t.avatar?.url
  const rating = t.rating ?? 5

  return (
    <div className="card border-0 shadow-sm h-100 testi-card">
      <div className="card-body p-3 p-md-4">
        <div className="d-flex gap-3 align-items-start">
          <div
            className="rounded-circle bg-light overflow-hidden flex-shrink-0"
            style={{ width: 56, height: 56 }}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={t.name}
                className="w-100 h-100"
                style={{ objectFit: 'cover' }}
                loading="lazy"
              />
            ) : null}
          </div>

          <div className="w-100">
            <div className="fw-bold">{t.name}</div>
            {t.role ? <div className="text-muted small">{t.role}</div> : null}

            <div className="mt-2">
              <Stars rating={rating} />
            </div>

            <p className="small text-muted mt-2 mb-0" style={{ lineHeight: 1.4 }}>
              {t.text}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/** breakpoint -> perSlide (mobile=1, md=2, lg=3, xl=4) */
function usePerSlide() {
  const [perSlide, setPerSlide] = useState<1 | 2 | 3 | 4>(1)

  useEffect(() => {
    // SSR safe
    if (typeof window === 'undefined') return

    const calc = () => {
      const w = window.innerWidth
      if (w >= 1200) return 4
      if (w >= 992) return 3
      if (w >= 768) return 2
      return 1
    }

    const apply = () => setPerSlide(calc() as 1 | 2 | 3 | 4)
    apply()

    window.addEventListener('resize', apply, { passive: true })
    return () => window.removeEventListener('resize', apply)
  }, [])

  return perSlide
}

function safeCall(api: any, rootEl: HTMLDivElement | null, fn: () => void) {
  if (!api) return
  if (!rootEl || !rootEl.isConnected) return
  try {
    fn()
  } catch {
    // swallow to avoid crashing during fast UI changes
  }
}

function useBootstrapCarousel({
  rootRef,
  enabled,
  intervalMs,
}: {
  rootRef: React.RefObject<HTMLDivElement | null>
  enabled: boolean
  intervalMs: number
}) {
  const [api, setApi] = useState<any>(null)

  useEffect(() => {
    let instance: any = null
    let cancelled = false

    const el = rootRef.current
    if (!el) return
    ;(async () => {
      const mod = await import('bootstrap/js/dist/carousel')
      if (cancelled) return
      if (!el || !el.isConnected) return

      const Carousel = mod.default

      // dispose old
      try {
        const old = Carousel.getInstance(el)
        if (old) old.dispose()
      } catch {}

      instance = new Carousel(el, {
        interval: enabled && intervalMs > 0 ? intervalMs : false,
        ride: enabled && intervalMs > 0 ? 'carousel' : false,
        wrap: enabled,
        touch: enabled,
        pause: enabled ? 'hover' : false,
      })

      setApi(instance)
    })()

    return () => {
      cancelled = true
      try {
        if (instance) instance.dispose()
      } catch {}
      setApi(null)
    }
  }, [rootRef, enabled, intervalMs])

  return api
}

function useDragToSlide({
  enabled,
  api,
  rootRef,
  threshold = 60,
}: {
  enabled: boolean
  api: any
  rootRef: React.RefObject<HTMLDivElement | null>
  threshold?: number
}) {
  const startX = useRef<number | null>(null)
  const dragging = useRef(false)

  const onPointerDown = (e: React.PointerEvent) => {
    if (!enabled || !api) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    dragging.current = true
    startX.current = e.clientX
    try {
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    } catch {}
  }

  const end = (e: React.PointerEvent) => {
    if (!enabled || !api) return
    if (!dragging.current || startX.current == null) return

    const dx = e.clientX - startX.current
    dragging.current = false
    startX.current = null

    if (Math.abs(dx) < threshold) return
    const rootEl = rootRef.current
    if (dx < 0) safeCall(api, rootEl, () => api.next?.())
    else safeCall(api, rootEl, () => api.prev?.())
  }

  return {
    onPointerDown,
    onPointerUp: end,
    onPointerCancel: end,
    onPointerLeave: end,
  }
}

export const Testimonials: React.FC<Props> = ({ title, items, intervalMs }) => {
  const list = useMemo(() => items ?? [], [items])
  const baseId = useId().replace(/:/g, '')
  const perSlide = usePerSlide()
  const ms = typeof intervalMs === 'number' ? intervalMs : 0

  const groups = useMemo(() => chunk(list, perSlide), [list, perSlide])

  // enable slide jika lebih dari 1 halaman
  const enableSlide = groups.length > 1

  const rootRef = useRef<HTMLDivElement | null>(null)
  const api = useBootstrapCarousel({
    rootRef,
    enabled: enableSlide,
    intervalMs: ms,
  })

  const drag = useDragToSlide({ enabled: enableSlide, api, rootRef })

  const colClass =
    perSlide === 1
      ? 'col-12'
      : perSlide === 2
        ? 'col-12 col-md-6'
        : perSlide === 3
          ? 'col-12 col-md-6 col-lg-4'
          : 'col-12 col-md-6 col-lg-3'

  return (
    <div className="bg-white" id="kata_mitra_kami">
      <div className="container py-4">
        <div className="text-center mb-3">
          <h2 className="h6 fw-bold text-success mb-0">{title ?? 'KATA MITRA KAMI'}</h2>
        </div>

        <div id={`${baseId}-carousel`} ref={rootRef} className="carousel slide testi-carousel">
          <div
            className={`carousel-inner ${enableSlide ? 'cursor-grab' : ''}`}
            style={{ userSelect: 'none' }}
            {...drag}
          >
            {groups.map((grp, i) => (
              <div key={i} className={`carousel-item ${i === 0 ? 'active' : ''}`}>
                <div className="row m-carusel-testimoni  g-3">
                  {grp.map((t, idx) => (
                    <div key={idx} className={colClass}>
                      <Card t={t} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* controls */}
          <button
            className={`carousel-control-prev ${enableSlide ? '' : 'd-none'}`}
            type="button"
            onClick={() => safeCall(api, rootRef.current, () => api?.prev?.())}
            aria-label="Previous"
          >
            <span className="carousel-control-prev-icon" aria-hidden="true" />
          </button>

          <button
            className={`carousel-control-next ${enableSlide ? '' : 'd-none'}`}
            type="button"
            onClick={() => safeCall(api, rootRef.current, () => api?.next?.())}
            aria-label="Next"
          >
            <span className="carousel-control-next-icon" aria-hidden="true" />
          </button>

          {/* ✅ IMPORTANT:
              indikator SELALU ada + button harus punya data-bs-target & data-bs-slide-to
              agar Bootstrap tidak null saat _setActiveIndicatorElement
          */}
          <div
            className={`carousel-indicators position-static mt-3 mb-0 ${enableSlide ? '' : 'd-none'}`}
          >
            {groups.map((_, idx) => (
              <button
                key={idx}
                type="button"
                data-bs-target={`#${baseId}-carousel`}
                data-bs-slide-to={idx}
                className={idx === 0 ? 'active' : ''}
                aria-current={idx === 0 ? 'true' : undefined}
                aria-label={`Slide ${idx + 1}`}
                onClick={() => safeCall(api, rootRef.current, () => api?.to?.(idx))}
              />
            ))}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .testi-card {
          border-radius: 14px;
        }

        .testi-carousel .carousel-control-prev,
        .testi-carousel .carousel-control-next {
          width: 44px;
        }

        .testi-carousel .carousel-control-prev-icon,
        .testi-carousel .carousel-control-next-icon {
          filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.2));
        }

        .cursor-grab {
          cursor: grab;
        }
        .cursor-grab:active {
          cursor: grabbing;
        }
      `}</style>
    </div>
  )
}
