'use client'

import React, { useId, useEffect } from 'react'
import Link from 'next/link'
import ScrollButton from '@/components/ui/ScrollButton'
import { trackFacebookEvent, trackFacebookCustomEvent } from '@/utilities/pixelFacebook'

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
    slideIndex,
    targetType,
  }: {
    ctaText: string
    ctaLink: string
    slideIndex: number
    targetType: 'section' | 'link'
  }) => {
    const payload = {
      content_name: ctaText,
      content_category: 'Banner CTA',
      section: 'Banner Carousel',
      slide_index: slideIndex + 1,
      target: ctaLink,
      target_type: targetType,
      page_path: window.location.pathname,
    }

    trackFacebookEvent('Lead', payload)

    trackFacebookCustomEvent('ClickBannerCarouselCTA', {
      button_text: ctaText,
      section: 'Banner Carousel',
      slide_index: slideIndex + 1,
      target: ctaLink,
      target_type: targetType,
      page_path: window.location.pathname,
    })
  }

  const handleCarouselNavTrack = (direction: 'prev' | 'next') => {
    trackFacebookCustomEvent('ClickBannerCarouselNavigation', {
      direction,
      section: 'Banner Carousel',
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
                  onClick={() => {
                    trackFacebookCustomEvent('ClickBannerCarouselIndicator', {
                      indicator_index: i + 1,
                      section: 'Banner Carousel',
                      page_path: window.location.pathname,
                    })
                  }}
                />
              ))}
            </div>
          )}

          <div className="carousel-inner banner-inner-fullbleed">
            {activeSlides.map((s, i) => {
              const desktopUrl = s?.backgroundImage?.url ?? ''
              const mobileUrl = s?.backgroundImageMobile?.url ?? desktopUrl

              const ctaText = s?.ctaText ?? 'Daftar Sekarang'
              const ctaLink = s?.ctaLink?.trim() || '#registration'
              const isSectionLink = ctaLink.startsWith('#')

              return (
                <div key={i} className={`carousel-item ${i === 0 ? 'active' : ''}`}>
                  <div className="banner-slide-fullbleed position-relative">
                    <picture>
                      <source media="(max-width: 767.98px)" srcSet={mobileUrl} />
                      <img
                        className="banner-img-fullbleed"
                        src={desktopUrl}
                        alt="Banner"
                        loading={i === 0 ? 'eager' : 'lazy'}
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
                              slideIndex: i,
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
                              slideIndex: i,
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
                onClick={() => handleCarouselNavTrack('prev')}
              >
                <span className="carousel-control-prev-icon" aria-hidden="true" />
                <span className="visually-hidden">Previous</span>
              </button>

              <button
                className="carousel-control-next"
                type="button"
                data-bs-target={`#${carouselId}`}
                data-bs-slide="next"
                onClick={() => handleCarouselNavTrack('next')}
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
