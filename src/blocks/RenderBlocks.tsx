import React, { Fragment } from 'react'

import type { Page } from '@/payload-types'

import { ArchiveBlock } from '@/blocks/ArchiveBlock/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { ContentBlock } from '@/blocks/Content/Component'
import { FormBlock } from '@/blocks/Form/Component'
import { MediaBlock } from '@/blocks/MediaBlock/Component'

// New Block Imports Here
import { BannerCarouselBlockComponent } from '@/blocks/Mobis/BannerCarousel'
import { AreaChipsBlockComponent } from '@/blocks/Mobis/AreaChips'
import { AboutSplit } from '@/blocks/Mobis/About'
import { UnitsAvailable } from '@/blocks/Mobis/UnitsAvailable'
import { ProgramCard } from '@/blocks/Mobis/ProgramCard'
import { Requirements } from '@/blocks/Mobis/Requirements'
import { RegistrationFlow } from '@/blocks/Mobis/RegistrationFlow'
import { Testimonials } from '@/blocks/Mobis/Testimonials'
import { RegistrationForm } from '@/blocks/Mobis/RegistrationForm'
import { FooterSimple } from '@/blocks/Mobis/FooterSimple'
import { ProgramDual } from '@/blocks/Mobis/ProgramDual'
import { FaqAccordion } from '@/blocks/Mobis/FaqAccordion'

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

          // spacing per block
          const wrapperClass =
            blockType === 'bannerCarousel'
              ? 'my-0'
              : blockType === 'areaChips'
                ? 'my-0'
                : blockType === 'aboutSplit'
                  ? 'my-0'
                  : blockType === 'unitsAvailable'
                    ? 'my-0'
                    : blockType === 'programCard'
                      ? 'my-0'
                      : blockType === 'requirements'
                        ? 'my-0'
                        : blockType === 'registrationFlow'
                          ? 'my-0'
                          : blockType === 'testimonials'
                            ? 'my-0'
                            : blockType === 'registrationForm'
                              ? 'my-0'
                              : blockType === 'footerSimple'
                                ? 'my-0'
                                : blockType === 'programDual'
                                  ? 'my-0'
                                  : blockType === 'faqAccordion'
                                    ? 'my-0'
                                  : 'my-4 my-md-5'

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
