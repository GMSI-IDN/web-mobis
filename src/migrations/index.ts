import * as migration_20260427_072500_fix_registration_form_online_app from './20260427_072500_fix_registration_form_online_app'
import * as migration_20260429_103000_add_faq_accordion_block from './20260429_103000_add_faq_accordion_block'
import * as migration_20260518_add_area_chips_description from './20260518_add_area_chips_description'
import * as migration_20260525_add_area_chips_block_description from './20260525_add_area_chips_block_description'
import * as migration_20260525_area_chips_description_to_richtext from './20260525_area_chips_description_to_richtext'
import * as migration_20260525_add_units_available_description from './20260525_add_units_available_description'
import * as migration_20260604_add_area_chips_is_partner from './20260604_add_area_chips_is_partner'

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
  {
    up: migration_20260518_add_area_chips_description.up,
    down: migration_20260518_add_area_chips_description.down,
    name: '20260518_add_area_chips_description',
  },
  {
    up: migration_20260525_add_area_chips_block_description.up,
    down: migration_20260525_add_area_chips_block_description.down,
    name: '20260525_add_area_chips_block_description',
  },
  {
    up: migration_20260525_area_chips_description_to_richtext.up,
    down: migration_20260525_area_chips_description_to_richtext.down,
    name: '20260525_area_chips_description_to_richtext',
  },
  {
    up: migration_20260525_add_units_available_description.up,
    down: migration_20260525_add_units_available_description.down,
    name: '20260525_add_units_available_description',
  },
  {
    up: migration_20260604_add_area_chips_is_partner.up,
    down: migration_20260604_add_area_chips_is_partner.down,
    name: '20260604_add_area_chips_is_partner',
  },
]
