'use client'

import React, { useId } from 'react'
import Link from 'next/link'

type Media = { url?: string }

type Slide = {
  isActive?: boolean
  ctaText?: string
  ctaLink?: string
  backgroundImage?: Media
  backgroundImageMobile?: Media
}

export default function BannerCarouselBlockComponent({ slides }: { slides?: Slide[] }) {
  const carouselId = useId().replace(/:/g, '')
  const activeSlides = (slides ?? []).filter((s) => s?.isActive !== false)
  if (!activeSlides.length) return null

  return (
    // ✅ FULL BLEED WRAPPER (no container)
    <section className="banner-carousel-fullbleed">
      <div className="container-fluid p-0 m-0">
        <div id={carouselId} className="carousel slide" data-bs-ride="carousel">
          {activeSlides.length > 1 && (
            <div className="carousel-indicators">
              {activeSlides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  data-bs-target={`#${carouselId}`}
                  data-bs-slide-to={i}
                  className={i === 0 ? 'active' : ''}
                  aria-current={i === 0 ? 'true' : undefined}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          )}

          {/* ✅ no padding, no margin */}
          <div className="carousel-inner banner-inner-fullbleed">
            {activeSlides.map((s, i) => {
              const desktopUrl = s?.backgroundImage?.url ?? ''
              const mobileUrl = s?.backgroundImageMobile?.url ?? desktopUrl

              return (
                <div key={i} className={`carousel-item ${i === 0 ? 'active' : ''}`}>
                  <div className="banner-slide-fullbleed position-relative">
                    {/* tampilkan gambar utuh / sesuai file kamu */}
                    <picture>
                      <source media="(max-width: 767.98px)" srcSet={mobileUrl} />
                      <img className="banner-img-fullbleed" src={desktopUrl} alt="Banner" />
                    </picture>

                    {/* CTA overlay bottom-center */}
                    <div className="banner-cta-fullbleed position-absolute start-50 translate-middle-x text-center">
                      <Link
                        href={s?.ctaLink ?? '/'}
                        className="btn btn-light fw-bold rounded-pill px-4 btn-banner-cta-fullbleed"
                      >
                        {s?.ctaText ?? 'Daftar Sekarang'}
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {activeSlides.length > 1 && (
            <>
              <button
                className="carousel-control-prev"
                type="button"
                data-bs-target={`#${carouselId}`}
                data-bs-slide="prev"
              >
                <span className="carousel-control-prev-icon" aria-hidden="true" />
                <span className="visually-hidden">Previous</span>
              </button>

              <button
                className="carousel-control-next"
                type="button"
                data-bs-target={`#${carouselId}`}
                data-bs-slide="next"
              >
                <span className="carousel-control-next-icon" aria-hidden="true" />
                <span className="visually-hidden">Next</span>
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
