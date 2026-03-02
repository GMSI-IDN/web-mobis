'use client'

import React, { useId, useEffect, useState } from 'react'
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
  // 1. SOLUSI HYDRATION: Berikan prefix manual agar ID konsisten antara Server & Client
  const id = useId().replace(/:/g, '')
  const carouselId = `carousel-${id}`

  // State untuk memastikan inisialisasi hanya di client
  const [mounted, setMounted] = useState(false)

  const activeSlides = (slides ?? []).filter((s) => s?.isActive !== false)

  // 2. SOLUSI AUTO-PLAY: Inisialisasi Manual Bootstrap
  useEffect(() => {
    setMounted(true)

    const initBootstrap = async () => {
      // Import bootstrap hanya di browser
      const bootstrap = await import('bootstrap')
      const element = document.getElementById(carouselId)

      if (element) {
        // Hapus instance lama jika ada (mencegah memory leak/double init)
        const existingInstance = bootstrap.Carousel.getInstance(element)
        if (existingInstance) existingInstance.dispose()

        // Buat instance baru dengan opsi autoplay
        new bootstrap.Carousel(element, {
          interval: 1500,
          ride: 'carousel',
          pause: false,
        })
      }
    }

    initBootstrap()
  }, [carouselId, activeSlides.length])

  if (!activeSlides.length) return null

  return (
    <section className="banner-carousel-fullbleed">
      <div className="container-fluid p-0 m-0">
        <div
          id={carouselId}
          className="carousel slide"
          // Kita tetap pasang data-attributes sebagai fallback
          data-bs-ride="carousel"
          data-bs-interval="2000"
          data-bs-pause="false"
        >
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

          <div className="carousel-inner banner-inner-fullbleed">
            {activeSlides.map((s, i) => {
              const desktopUrl = s?.backgroundImage?.url ?? ''
              const mobileUrl = s?.backgroundImageMobile?.url ?? desktopUrl

              return (
                <div key={i} className={`carousel-item ${i === 0 ? 'active' : ''}`}>
                  <div className="banner-slide-fullbleed position-relative">
                    <picture>
                      <source media="(max-width: 767.98px)" srcSet={mobileUrl} />
                      {/* Gunakan loading="eager" untuk slide pertama agar LCP bagus */}
                      <img
                        className="banner-img-fullbleed"
                        src={desktopUrl}
                        alt="Banner"
                        loading={i === 0 ? 'eager' : 'lazy'}
                      />
                    </picture>

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
