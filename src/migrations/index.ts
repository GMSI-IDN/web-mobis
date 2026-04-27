import * as migration_20260427_072500_fix_registration_form_online_app from './20260427_072500_fix_registration_form_online_app'

export const migrations = [
  {
    up: migration_20260427_072500_fix_registration_form_online_app.up,
    down: migration_20260427_072500_fix_registration_form_online_app.down,
    name: '20260427_072500_fix_registration_form_online_app',
  },
]
