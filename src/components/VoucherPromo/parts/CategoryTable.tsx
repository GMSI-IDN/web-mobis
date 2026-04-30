type Cat = { id: number; name: string; createdAt?: string }

function fmtDate(d?: string) {
  if (!d) return '-'
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return '-'
  return dt.toLocaleDateString('id-ID')
}

export default function CategoryTable({ data }: { data: Cat[] }) {
  return (
    <div className="card mb-3">
      <div className="card-body">
        <b>Kategori</b>

        <div className="table-responsive mt-2">
          <table className="table table-sm align-middle mb-0">
            <thead>
              <tr>
                <th>Nama</th>
                <th className="text-end">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {(!data || data.length === 0) && (
                <tr>
                  <td colSpan={2} className="text-muted">
                    Belum ada kategori
                  </td>
                </tr>
              )}

              {(data || []).slice(0, 10).map((c) => (
                <tr key={c.id}>
                  <td className="fw-semibold">{c.name}</td>
                  <td className="text-end small text-muted">{fmtDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="small text-muted mt-2">
          Kategori dipakai untuk grouping voucher (Facebook/IG/TikTok/dll).
        </div>
      </div>
    </div>
  )
}
