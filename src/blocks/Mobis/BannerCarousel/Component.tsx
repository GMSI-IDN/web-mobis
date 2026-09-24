'use client'

import React, { useId, useEffect, useState } from 'react'
import Link from 'next/link'
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

/**
 * Build responsive banner media from Payload CMS image sizes.
 * Generates srcSet so the browser picks the right size for the viewport,
 * e.g. medium (900px) on mobile instead of the full 1440px original.
 */
function buildBannerMedia(media: Media | undefined, fallbackWidth: number, fallbackHeight: number) {
  const url = media?.sizes?.large?.url || media?.sizes?.medium?.url || media?.url
  if (!url) return null

  const mainSrc = getMediaUrl(url)
  const srcSet = media?.sizes
    ? [
        media.sizes.small?.url ? `${getMediaUrl(media.sizes.small.url)} 600w` : '',
        media.sizes.medium?.url ? `${getMediaUrl(media.sizes.medium.url)} 900w` : '',
        media.sizes.large?.url ? `${getMediaUrl(media.sizes.large.url)} 1400w` : '',
        media.sizes.xlarge?.url ? `${getMediaUrl(media.sizes.xlarge.url)} 1920w` : '',
      ]
        .filter(Boolean)
        .join(', ')
    : undefined

  return {
    src: mainSrc,
    srcSet,
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

  // Only render non-first slide images after hydration to reduce initial DOM weight
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

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

              const ctaText = s?.ctaText ?? 'Daftar Sekarang'
              const rawCtaLink = s?.ctaLink?.trim() || '#registration'
              const ctaLink = isSafeCtaLink(rawCtaLink) ? rawCtaLink : '#registration'
              const isSectionLink = ctaLink.startsWith('#')

              return (
                <div key={i} className={`carousel-item ${i === 0 ? 'active' : ''}`}>
                  <div className="banner-slide-fullbleed position-relative">
                    {desktopMedia && (isFirstSlide || mounted) ? (
                      <picture>
                        <img
                          src={desktopMedia.src}
                          srcSet={desktopMedia.srcSet}
                          sizes="100vw"
                          alt={`Banner Mobis untuk promo pendaftaran driver online ${i + 1}`}
                          className="banner-img-fullbleed"
                          width={desktopMedia.width}
                          height={desktopMedia.height}
                          loading={isFirstSlide ? 'eager' : 'lazy'}
                          fetchPriority={isFirstSlide ? 'high' : 'low'}
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
