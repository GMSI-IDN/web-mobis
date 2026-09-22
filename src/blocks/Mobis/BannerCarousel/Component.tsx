'use client'

import React, { useId, useEffect } from 'react'
import Link from 'next/link'
import { getImageProps } from 'next/image'
import ScrollButton from '@/components/ui/ScrollButton'
import { trackCustomEvent } from '@/utilities/pixelTracking'
import { getMediaUrl } from '@/utilities/getMediaUrl'

type Media = {
  url?: string
  width?: number | null
  height?: number | null
  sizes?: Record<string, { url?: string; width?: number | null; height?: number | null }>
}

const DESKTOP_FALLBACK_WIDTH = 1920
const DESKTOP_FALLBACK_HEIGHT = 640
const MOBILE_FALLBACK_WIDTH = 768
const MOBILE_FALLBACK_HEIGHT = 960

function buildBannerMedia(media: Media | undefined, fallbackWidth: number, fallbackHeight: number) {
  const url = media?.url
  if (!url) return null

  return {
    src: getMediaUrl(url),
    width: media?.width || fallbackWidth,
    height: media?.height || fallbackHeight,
  }
}

type Slide = {
  isActive?: boolean
  ctaText?: string
  ctaLink?: string
  backgroundImage?: Media
  backgroundImageMobile?: Media
}

function isSafeCtaLink(value: string) {
  if (!value) return false
  if (value.startsWith('#')) return true
  if (value.startsWith('/')) return true

  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export default function BannerCarouselBlockComponent({ slides }: { slides?: Slide[] }) {
  const id = useId().replace(/:/g, '')
  const carouselId = `carousel-${id}`

  const activeSlides = (slides ?? []).filter((s) => s?.isActive !== false)

  useEffect(() => {
    let timer: any
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

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const handle = (window as any).requestIdleCallback(() => {
        void initBootstrap()
      }, { timeout: 1500 })
      return () => (window as any).cancelIdleCallback(handle)
    } else {
      timer = setTimeout(() => {
        void initBootstrap()
      }, 500)
      return () => clearTimeout(timer)
    }
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
    trackCustomEvent('ClickBannerCarouselCTA', {
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
              const isFirstSlide = i === 0

              const desktopMedia = buildBannerMedia(
                s?.backgroundImage,
                DESKTOP_FALLBACK_WIDTH,
                DESKTOP_FALLBACK_HEIGHT,
              )
              const mobileMediaObj =
                s?.backgroundImageMobile ??
                (s?.backgroundImage?.sizes?.tablet?.url ? s.backgroundImage.sizes.tablet : undefined) ??
                (s?.backgroundImage?.sizes?.mobile?.url ? s.backgroundImage.sizes.mobile : undefined) ??
                s?.backgroundImage

              const mobileMedia = buildBannerMedia(
                mobileMediaObj,
                MOBILE_FALLBACK_WIDTH,
                MOBILE_FALLBACK_HEIGHT,
              )

              const ctaText = s?.ctaText ?? 'Daftar Sekarang'
              const rawCtaLink = s?.ctaLink?.trim() || '#registration'
              const ctaLink = isSafeCtaLink(rawCtaLink) ? rawCtaLink : '#registration'
              const isSectionLink = ctaLink.startsWith('#')

              return (
                <div key={i} className={`carousel-item ${i === 0 ? 'active' : ''}`}>
                  <div className="banner-slide-fullbleed position-relative">
                    {desktopMedia ? (
                      <picture>
                        {mobileMedia && mobileMedia.src !== desktopMedia.src ? (
                          <source media="(max-width: 767.98px)" srcSet={mobileMedia.src} />
                        ) : null}
                        <source media="(min-width: 768px)" srcSet={desktopMedia.src} />
                        <img
                          src={desktopMedia.src}
                          width={desktopMedia.width}
                          height={desktopMedia.height}
                          className="banner-img-fullbleed"
                          alt={`Banner Mobis untuk promo pendaftaran driver online ${i + 1}`}
                          loading={isFirstSlide ? 'eager' : 'lazy'}
                          fetchPriority={isFirstSlide ? 'high' : 'auto'}
                          decoding="async"
                        />
                      </picture>
                    ) : null}

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
