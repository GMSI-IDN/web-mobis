import * as migration_20260427_072500_fix_registration_form_online_app from './20260427_072500_fix_registration_form_online_app'
import * as migration_20260429_103000_add_faq_accordion_block from './20260429_103000_add_faq_accordion_block'

export const migrations = [
  {
    up: migration_20260427_072500_fix_registration_form_online_app.up,
    down: migration_20260427_072500_fix_registration_form_online_app.down,
    name: '20260427_072500_fix_registration_form_online_app',
  },
  {
    up: migration_20260429_103000_add_faq_accordion_block.up,
    down: migration_20260429_103000_add_faq_accordion_block.down,
    name: '20260429_103000_add_faq_accordion_block',
  },
]
