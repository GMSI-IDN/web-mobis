import type { Page } from '@/payload-types'

type FaqStructuredData = {
  '@context': 'https://schema.org'
  '@type': 'FAQPage'
  mainEntity: Array<{
    '@type': 'Question'
    name: string
    acceptedAnswer: {
      '@type': 'Answer'
      text: string
    }
  }>
}

function cleanText(value: unknown) {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
}

export function buildFaqStructuredData(layout: Page['layout']): FaqStructuredData | null {
  if (!Array.isArray(layout) || layout.length === 0) return null

  const mainEntity: FaqStructuredData['mainEntity'] = []
  const seen = new Set<string>()

  for (const block of layout) {
    if (!block || block.blockType !== 'faqAccordion') continue

    const items = Array.isArray((block as any).items) ? (block as any).items : []

    for (const item of items) {
      const question = cleanText(item?.question)
      const answer = cleanText(item?.answer)
      if (!question || !answer) continue

      const signature = `${question}::${answer}`
      if (seen.has(signature)) continue
      seen.add(signature)

      mainEntity.push({
        '@type': 'Question',
        name: question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: answer,
        },
      })
    }
  }

  if (mainEntity.length === 0) return null

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity,
  }
}

