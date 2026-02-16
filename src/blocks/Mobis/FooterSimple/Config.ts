import type { Block } from 'payload'

export const FooterSimpleConfig: Block = {
  slug: 'footerSimple',
  interfaceName: 'FooterSimpleBlock',
  fields: [
    { name: 'brand', type: 'text', defaultValue: 'MOBIS', required: true },
    { name: 'address', type: 'textarea' },
    { name: 'instagram', type: 'text' },
    { name: 'whatsapp', type: 'text' },
  ],
}
