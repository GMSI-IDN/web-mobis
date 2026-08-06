'use client'

import { Button, type ButtonProps } from '@/components/ui/button'
import {
  type RegistrationCTATracking,
  trackRegistrationCTAClick,
} from '@/utilities/pixelTracking'
import { cn } from '@/utilities/ui'
import Link from 'next/link'
import React from 'react'

import type { Page, Post } from '@/payload-types'

type CMSLinkType = {
  appearance?: 'inline' | ButtonProps['variant']
  children?: React.ReactNode
  className?: string
  label?: string | null
  newTab?: boolean | null
  reference?: {
    relationTo: 'pages' | 'posts'
    value: Page | Post | string | number
  } | null
  registrationTracking?: boolean | RegistrationCTATracking
  size?: ButtonProps['size'] | null
  type?: 'custom' | 'reference' | null
  url?: string | null
  onClick?: React.MouseEventHandler<HTMLAnchorElement>
}

export const CMSLink: React.FC<CMSLinkType> = (props) => {
  const {
    type,
    appearance = 'inline',
    children,
    className,
    label,
    newTab,
    reference,
    registrationTracking,
    size: sizeFromProps,
    url,
    onClick,
  } = props

  const href =
    type === 'reference' && typeof reference?.value === 'object' && reference.value.slug
      ? `${reference?.relationTo !== 'pages' ? `/${reference?.relationTo}` : ''}/${
          reference.value.slug
        }`
      : url

  if (!href) return null

  const size = appearance === 'link' ? 'clear' : sizeFromProps
  const newTabProps = newTab ? { rel: 'noopener noreferrer', target: '_blank' } : {}
  const linkLabel = label || (typeof children === 'string' ? children : '') || ''
  const linkTarget = href || url || ''

  const handleClick: React.MouseEventHandler<HTMLAnchorElement> = (event) => {
    onClick?.(event)

    if (!registrationTracking) return

    const trackingConfig = registrationTracking === true ? {} : registrationTracking

    void trackRegistrationCTAClick({
      ctaText: trackingConfig.ctaText || linkLabel || 'Daftar Sekarang',
      ctaLink: trackingConfig.ctaLink || linkTarget,
      section: trackingConfig.section || 'General CTA',
      placement: trackingConfig.placement || className || undefined,
      targetType: trackingConfig.targetType,
    })
  }

  /* Ensure we don't break any styles set by richText */
  if (appearance === 'inline') {
    return (
      <Link className={cn(className)} href={linkTarget} onClick={handleClick} {...newTabProps}>
        {label && label}
        {children && children}
      </Link>
    )
  }

  return (
    <Button asChild className={className} size={size} variant={appearance}>
      <Link className={cn(className)} href={linkTarget} onClick={handleClick} {...newTabProps}>
        {label && label}
        {children && children}
      </Link>
    </Button>
  )
}
