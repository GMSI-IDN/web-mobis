import type { Block } from 'payload'

export const FaqAccordionConfig: Block = {
  slug: 'faqAccordion',
  interfaceName: 'FaqAccordionBlock',
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      defaultValue: 'PERTANYAAN UMUM (FAQ)',
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      labels: {
        singular: 'FAQ Item',
        plural: 'FAQ Items',
      },
      fields: [
        {
          name: 'question',
          type: 'text',
          required: true,
          defaultValue: 'APAKAH ADA DEPOSIT ATAU BIAYA PENDAFTARAN?',
        },
        {
          name: 'answer',
          type: 'textarea',
          required: true,
          defaultValue:
            'Tidak ada biaya tersembunyi. Tim kami akan menjelaskan rincian program secara transparan sebelum proses lanjut.',
        },
      ],
    },
  ],
}

