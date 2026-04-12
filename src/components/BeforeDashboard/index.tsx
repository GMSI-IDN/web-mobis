import { Banner } from '@payloadcms/ui/elements/Banner'
import React from 'react'

import './index.scss'

const baseClass = 'before-dashboard'

const BeforeDashboard: React.FC = () => {
  return (
    <div className={baseClass}>
      <Banner className={`${baseClass}__banner`} type="success">
        <h4>Dashboard Mobis</h4>
      </Banner>

      <p className={`${baseClass}__intro`}>
        Kelola homepage, voucher promo, dan data pendaftaran driver dari satu tempat. Area ini
        dibuat lebih ringkas supaya tim bisa langsung fokus ke operasional harian.
      </p>

      <div className={`${baseClass}__links`}>
        <a href="/" target="_blank" rel="noreferrer">
          Buka Website
        </a>
        <a href="/admin/collections/pages" target="_blank" rel="noreferrer">
          Kelola Halaman
        </a>
        <a href="/admin/collections/customers" target="_blank" rel="noreferrer">
          Lihat Pendaftaran
        </a>
      </div>
    </div>
  )
}

export default BeforeDashboard
