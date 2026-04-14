'use client'

import React, { useId, useEffect } from 'react'
import Link from 'next/link'
import ScrollButton from '@/components/ui/ScrollButton'
import { trackFacebookCustomEvent } from '@/utilities/pixelFacebook'

type Media = { url?: string }

type Slide = {
  isActive?: boolean
  ctaText?: string
  ctaLink?: string
  backgroundImage?: Media
  backgroundImageMobile?: Media
}

export default function BannerCarouselBlockComponent({ slides }: { slides?: Slide[] }) {
  const id = useId().replace(/:/g, '')
  const carouselId = `carousel-${id}`

  const activeSlides = (slides ?? []).filter((s) => s?.isActive !== false)

  useEffect(() => {
    const initBootstrap = async () => {
      const bootstrap = await import('bootstrap')
      const element = document.getElementById(carouselId)

      if (!element) return

      const existingInstance = bootstrap.Carousel.getInstance(element)
      if (existingInstance) existingInstance.dispose()

      new bootstrap.Carousel(element, {
        interval: 6000,
        ride: 'carousel',
        pause: false,
      })
    }

    initBootstrap()
  }, [carouselId, activeSlides.length])

  const handleBannerCTATrack = ({
    ctaText,
    ctaLink,
    targetType,
  }: {
    ctaText: string
    ctaLink: string
    targetType: 'section' | 'link'
  }) => {
    trackFacebookCustomEvent('ClickBannerCarouselCTA', {
      button_text: ctaText,
      section: 'Banner Carousel',
      target: ctaLink,
      target_type: targetType,
      page_path: window.location.pathname,
    })
  }

  if (!activeSlides.length) return null

  return (
    <section className="banner-carousel-fullbleed">
      <div className="container-fluid p-0 m-0">
        <div
          id={carouselId}
          className="carousel slide"
          data-bs-ride="carousel"
          data-bs-interval="6000"
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
              const isFirstSlide = i === 0

              const ctaText = s?.ctaText ?? 'Daftar Sekarang'
              const ctaLink = s?.ctaLink?.trim() || '#registration'
              const isSectionLink = ctaLink.startsWith('#')

              return (
                <div key={i} className={`carousel-item ${i === 0 ? 'active' : ''}`}>
                  <div className="banner-slide-fullbleed position-relative">
                    <picture>
                      <source media="(max-width: 767.98px)" srcSet={mobileUrl} />
                      <source media="(min-width: 768px)" srcSet={desktopUrl} />
                      <img
                        className="banner-img-fullbleed"
                        src={desktopUrl}
                        alt={`Banner Mobis untuk promo pendaftaran driver online ${i + 1}`}
                        loading={isFirstSlide ? 'eager' : 'lazy'}
                        fetchPriority={isFirstSlide ? 'high' : 'auto'}
                        decoding="async"
                      />
                    </picture>

                    <div className="banner-cta-fullbleed position-absolute start-50 translate-middle-x text-center">
                      {isSectionLink ? (
                        <ScrollButton
                          className="btn btn-light fw-bold rounded-pill px-4 btn-banner-cta-fullbleed"
                          targetId={ctaLink}
                          onClick={() => {
                            handleBannerCTATrack({
                              ctaText,
                              ctaLink,
                              targetType: 'section',
                            })
                          }}
                        >
                          {ctaText}
                        </ScrollButton>
                      ) : (
                        <Link
                          href={ctaLink}
                          className="btn btn-light fw-bold rounded-pill px-4 btn-banner-cta-fullbleed"
                          onClick={(e) => {
                            e.preventDefault()

                            handleBannerCTATrack({
                              ctaText,
                              ctaLink,
                              targetType: 'link',
                            })

                            setTimeout(() => {
                              window.location.href = ctaLink
                            }, 150)
                          }}
                        >
                          {ctaText}
                        </Link>
                      )}
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
