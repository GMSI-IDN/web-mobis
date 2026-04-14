import Link from 'next/link'
import React from 'react'

import { Button } from '@/components/ui/button'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Halaman Tidak Ditemukan',
  description:
    'Halaman yang Anda cari tidak tersedia. Kembali ke homepage Mobis untuk melihat program rental, promo pendaftaran, dan form pendaftaran driver online.',
  robots: {
    index: false,
    follow: true,
  },
}

export default function NotFound() {
  return (
    <div className="container py-28">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm md:p-12">
        <div className="prose max-w-none">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">
            404 Not Found
          </p>
          <h1 style={{ marginBottom: '0.5rem' }}>Halaman Tidak Ditemukan</h1>
          <p className="mb-6">
            Halaman yang Anda buka mungkin sudah dipindahkan atau URL-nya tidak lagi aktif. Anda
            bisa kembali ke homepage untuk melihat program rental mobil, promo pendaftaran, dan
            langkah daftar awal di Mobis.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="default">
            <Link href="/">Kembali ke Homepage</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/posts">Lihat Artikel</Link>
          </Button>
        </div>

        <div className="mt-6 text-sm text-slate-600">
          Butuh akses cepat ke pendaftaran? Buka form pendaftaran Mobis dari homepage dan lanjutkan
          proses pengajuan kendaraan untuk driver online.
        </div>
      </div>
    </div>
  )
}
