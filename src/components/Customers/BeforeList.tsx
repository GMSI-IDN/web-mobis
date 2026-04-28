import type { BeforeListServerProps } from 'payload'
import { TEST_LEAD_NAME_EXCLUDE_VALUES } from '@/lib/customers/testLeadFilter'

import './index.scss'

function formatNumber(value: number) {
  return new Intl.NumberFormat('id-ID').format(value)
}

export default async function CustomersBeforeList({ payload, user }: BeforeListServerProps) {
  const [totalRegistrants, todayRegistrants, promoRegistrants] = await Promise.all([
    payload.count({
      collection: 'customers',
      overrideAccess: false,
      user,
      where: {
        name: {
          not_in: [...TEST_LEAD_NAME_EXCLUDE_VALUES],
        },
      },
    }),
    payload.count({
      collection: 'customers',
      overrideAccess: false,
      user,
      where: {
        and: [
          {
            createdAt: {
              greater_than_equal: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
            },
          },
          {
            name: {
              not_in: [...TEST_LEAD_NAME_EXCLUDE_VALUES],
            },
          },
        ],
      },
    }),
    payload.count({
      collection: 'customers',
      overrideAccess: false,
      user,
      where: {
        and: [
          {
            promoApplied: {
              equals: true,
            },
          },
          {
            name: {
              not_in: [...TEST_LEAD_NAME_EXCLUDE_VALUES],
            },
          },
        ],
      },
    }),
  ])

  return (
    <section className="customers-list-summary">
      <div className="customers-list-summary__intro">
        <div>
          <p className="customers-list-summary__eyebrow">Menu Pendaftar</p>
          <h3 className="customers-list-summary__title">Daftar User Yang Sudah Mendaftar</h3>
          <p className="customers-list-summary__description">
            Halaman ini dipakai untuk memonitor user yang masuk dari form pendaftaran Mobis.
            Pembuatan data baru dilakukan dari website, jadi list ini difokuskan untuk review dan
            tindak lanjut.
          </p>
        </div>

        <a className="customers-list-summary__action" href="/admin">
          Kembali ke Dashboard
        </a>
      </div>

      <div className="customers-list-summary__stats">
        <div className="customers-list-summary__stat">
          <span>Total Pendaftar</span>
          <strong>{formatNumber(totalRegistrants.totalDocs)}</strong>
        </div>
        <div className="customers-list-summary__stat">
          <span>Pendaftar Hari Ini</span>
          <strong>{formatNumber(todayRegistrants.totalDocs)}</strong>
        </div>
        <div className="customers-list-summary__stat">
          <span>Pakai Promo</span>
          <strong>{formatNumber(promoRegistrants.totalDocs)}</strong>
        </div>
      </div>

      <div className="customers-list-summary__note">
        <span className="customers-list-summary__note-label">Pencarian cepat</span>
        <strong className="customers-list-summary__note-value">
          Gunakan nama, telepon, KTP, domisili, atau promo code untuk menelusuri pendaftar dengan
          lebih cepat.
        </strong>
      </div>
    </section>
  )
}
