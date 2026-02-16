import type { Block } from 'payload'

export const RegistrationFlowConfig: Block = {
  slug: 'registrationFlow',
  interfaceName: 'RegistrationFlowBlock',
  fields: [
    {
      name: 'title',
      type: 'text',
      defaultValue: 'ALUR PENDAFTARAN',
      required: true,
    },

    // SEO / accessibility
    {
      name: 'alt',
      type: 'text',
      defaultValue: 'Alur pendaftaran MOBIS',
      required: true,
    },
    // ✅ gambar desktop (horizontal)
    {
      name: 'desktopImage',
      type: 'upload',
      relationTo: 'media',
      required: false,
    },
    // ✅ gambar mobile (vertical)
    {
      name: 'mobileImage',
      type: 'upload',
      relationTo: 'media',
      required: false,
    },

    // optional: batas max width biar rapih di container bootstrap
    // {
    //   name: 'maxWidth',
    //   type: 'number',
    //   defaultValue: 1200,
    //   min: 320,
    //   max: 2000,
    //   required: false,
    //   admin: {
    //     description: 'Lebar maksimal gambar (px) saat desktop. Default 1200.',
    //   },
    // },
  ],
}
