import type { Page } from '@/payload-types'

type AreaChipsBlock = Extract<NonNullable<Page['layout']>[number], { blockType: 'areaChips' }>
type Area = AreaChipsBlock['areas'][number]

type LocalBusinessSchema = {
  '@context': 'https://schema.org'
  '@type': 'AutoRental'
  name: string
  url: string
  address: {
    '@type': 'PostalAddress'
    addressLocality: string
    addressCountry: 'ID'
  }
  areaServed: string[]
  parentOrganization: {
    '@type': 'Organization'
    name: string
    url: string
  }
}

function toAreaId(label: string): string {
  return 'rental-mobil-' + label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

function buildSchemaForArea(area: Area, siteUrl: string): LocalBusinessSchema {
  const label = (area.label ?? '').trim()
  const pools = area.pools ?? []
  const areaServed = pools
    .map((p) => (typeof p.name === 'string' ? p.name.trim() : ''))
    .filter(Boolean)

  return {
    '@context': 'https://schema.org',
    '@type': 'AutoRental',
    name: `Rental MOBIS ${label}`,
    url: `${siteUrl}/#${toAreaId(label)}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: label,
      addressCountry: 'ID',
    },
    areaServed: areaServed.length > 0 ? areaServed : [label],
    parentOrganization: {
      '@type': 'Organization',
      name: 'Rental MOBIS',
      url: siteUrl,
    },
  }
}

export function buildLocalBusinessStructuredData(
  layout: Page['layout'],
  siteUrl: string,
): LocalBusinessSchema[] {
  if (!Array.isArray(layout)) return []

  return layout
    .filter((block): block is AreaChipsBlock => block?.blockType === 'areaChips')
    .flatMap((block) =>
      (block.areas ?? [])
        .filter((area) => typeof area.label === 'string' && area.label.trim().length > 0)
        .map((area) => buildSchemaForArea(area, siteUrl)),
    )
}
