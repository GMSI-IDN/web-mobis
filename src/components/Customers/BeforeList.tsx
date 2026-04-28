import type { BeforeListServerProps, Where } from 'payload'
import { isExcludedLeadName } from '@/lib/customers/testLeadFilter'

import './index.scss'

function formatNumber(value: number) {
  return new Intl.NumberFormat('id-ID').format(value)
}

async function countNonExcludedCustomers(params: {
  payload: BeforeListServerProps['payload']
  user: BeforeListServerProps['user']
  where?: Where
}) {
  const { payload, user, where } = params
  const LIMIT = 200
  const MAX_PAGES = 100
  let page = 1
  let hasNextPage = true
  let total = 0

  while (hasNextPage && page <= MAX_PAGES) {
    const batch = (await payload.find({
      collection: 'customers',
      depth: 0,
      limit: LIMIT,
      overrideAccess: false,
      page,
      user,
      where,
      select: {
        name: true,
      },
    })) as {
      docs: Array<{ name?: null | string }>
      hasNextPage: boolean
    }

    total += (batch.docs || []).reduce((sum, doc) => {
      return sum + (isExcludedLeadName(doc?.name) ? 0 : 1)
    }, 0)

    hasNextPage = Boolean(batch.hasNextPage)
    page += 1
  }

  return total
}

export default async function CustomersBeforeList({ payload, user }: BeforeListServerProps) {
  const [totalRegistrants, todayRegistrants, promoRegistrants] = await Promise.all([
    countNonExcludedCustomers({
      payload,
      user,
    }),
    countNonExcludedCustomers({
      payload,
      user,
      where: {
        createdAt: {
          greater_than_equal: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
        },
      },
    }),
    countNonExcludedCustomers({
      payload,
      user,
      where: {
        promoApplied: {
          equals: true,
        },
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
          <strong>{formatNumber(totalRegistrants)}</strong>
        </div>
        <div className="customers-list-summary__stat">
          <span>Pendaftar Hari Ini</span>
          <strong>{formatNumber(todayRegistrants)}</strong>
        </div>
        <div className="customers-list-summary__stat">
          <span>Pakai Promo</span>
          <strong>{formatNumber(promoRegistrants)}</strong>
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
