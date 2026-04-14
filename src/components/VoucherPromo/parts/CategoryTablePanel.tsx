type Cat = { id: string; name: string; createdAt?: string }

function fmtDate(d?: string) {
  if (!d) return '-'
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return '-'
  return dt.toLocaleDateString('id-ID')
}

export default function CategoryTablePanel({ data }: { data: Cat[] }) {
  return (
    <section className="voucher-dashboard__panel">
      <div className="voucher-dashboard__panel-head">
        <div>
          <h5>Daftar Kategori</h5>
          <p>Kategori membantu tim memisahkan performa voucher per channel campaign.</p>
        </div>
      </div>

      <div className="voucher-dashboard__table-wrap">
        <table className="voucher-dashboard__table">
          <thead>
            <tr>
              <th>Nama</th>
              <th className="text-end">Tanggal</th>
            </tr>
          </thead>
          <tbody>
            {(!data || data.length === 0) && (
              <tr>
                <td colSpan={2} className="voucher-dashboard__empty">
                  Belum ada kategori
                </td>
              </tr>
            )}

            {(data || []).slice(0, 10).map((c) => (
              <tr key={c.id}>
                <td className="voucher-dashboard__code-cell">{c.name}</td>
                <td className="text-end">{fmtDate(c.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="voucher-dashboard__note">
        Kategori dipakai untuk grouping voucher seperti Facebook, Instagram, TikTok, atau channel
        promosi lain.
      </p>
    </section>
  )
}
