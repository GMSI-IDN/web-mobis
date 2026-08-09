import React, { Fragment } from 'react'
import dynamic from 'next/dynamic'

import type { Page } from '@/payload-types'

import { ArchiveBlock } from '@/blocks/ArchiveBlock/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { ContentBlock } from '@/blocks/Content/Component'
import { FormBlock } from '@/blocks/Form/Component'
import { MediaBlock } from '@/blocks/MediaBlock/Component'

// New Block Imports Here
// All Mobis blocks are 'use client' components, several of them large
// (RegistrationForm alone is 1300+ lines). Code-splitting them with
// next/dynamic means a page only ships the JS for the blocks it actually
// uses, instead of every page's bundle including all 12 regardless of which
// ones are rendered.
const BannerCarouselBlockComponent = dynamic(() =>
  import('@/blocks/Mobis/BannerCarousel/Component').then((mod) => mod.default),
)
const AreaChipsBlockComponent = dynamic(() =>
  import('@/blocks/Mobis/AreaChips/Component').then((mod) => mod.default),
)
const AboutSplit = dynamic(() =>
  import('@/blocks/Mobis/About/Component').then((mod) => mod.AboutSplit),
)
const UnitsAvailable = dynamic(() =>
  import('@/blocks/Mobis/UnitsAvailable/Component').then((mod) => mod.UnitsAvailable),
)
const ProgramCard = dynamic(() =>
  import('@/blocks/Mobis/ProgramCard/Component').then((mod) => mod.ProgramCard),
)
const Requirements = dynamic(() =>
  import('@/blocks/Mobis/Requirements/Component').then((mod) => mod.Requirements),
)
const RegistrationFlow = dynamic(() =>
  import('@/blocks/Mobis/RegistrationFlow/Component').then((mod) => mod.RegistrationFlow),
)
const Testimonials = dynamic(() =>
  import('@/blocks/Mobis/Testimonials/Component').then((mod) => mod.Testimonials),
)
const RegistrationForm = dynamic(() =>
  import('@/blocks/Mobis/RegistrationForm/Component').then((mod) => mod.RegistrationForm),
)
const FooterSimple = dynamic(() =>
  import('@/blocks/Mobis/FooterSimple/Component').then((mod) => mod.FooterSimple),
)
const ProgramDual = dynamic(() =>
  import('@/blocks/Mobis/ProgramDual/Component').then((mod) => mod.ProgramDual),
)
const FaqAccordion = dynamic(() =>
  import('@/blocks/Mobis/FaqAccordion/Component').then((mod) => mod.FaqAccordion),
)

const blockComponents = {
  archive: ArchiveBlock,
  content: ContentBlock,
  cta: CallToActionBlock,
  formBlock: FormBlock,
  mediaBlock: MediaBlock,

  // ✅ new
  bannerCarousel: BannerCarouselBlockComponent,
  areaChips: AreaChipsBlockComponent,
  aboutSplit: AboutSplit,
  unitsAvailable: UnitsAvailable,
  programCard: ProgramCard,
  requirements: Requirements,
  registrationFlow: RegistrationFlow,
  testimonials: Testimonials,
  registrationForm: RegistrationForm,
  footerSimple: FooterSimple,
  programDual: ProgramDual,
  faqAccordion: FaqAccordion,
} as const

type BlockTypeKey = keyof typeof blockComponents

export const RenderBlocks: React.FC<{
  blocks: Page['layout']
}> = (props) => {
  const { blocks } = props

  const hasBlocks = Array.isArray(blocks) && blocks.length > 0
  if (!hasBlocks) return null

  return (
    <Fragment>
      {blocks.map((block, index) => {
        const blockType = block?.blockType as string | undefined
        if (!blockType) return null

        if (blockType in blockComponents) {
          const Block = blockComponents[blockType as BlockTypeKey]
          if (!Block) return null

          const standardBlocks = new Set(['archive', 'content', 'cta', 'formBlock', 'mediaBlock'])
          const wrapperClass = standardBlocks.has(blockType) ? 'my-4 my-md-5' : 'my-0'

          return (
            <div className={wrapperClass} key={index}>
              <Block {...(block as any)} disableInnerContainer />
            </div>
          )
        }

        return null
      })}
    </Fragment>
  )
}
