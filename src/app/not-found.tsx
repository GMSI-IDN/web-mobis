import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '404 | Halaman Tidak Ditemukan',
  description:
    'Halaman yang Anda cari tidak tersedia. Kembali ke homepage Mobis untuk melihat program rental dan informasi terbaru.',
  robots: {
    index: false,
    follow: true,
  },
}

export default function NotFound() {
  return (
    <main
      aria-label="404 Not Found"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2147483647,
        background:
          'radial-gradient(circle at 50% 35%, rgba(220, 38, 38, 0.16) 0%, rgba(220, 38, 38, 0) 46%), linear-gradient(180deg, #ffffff 0%, #fff3f3 38%, #edfbe9 100%)',
        display: 'grid',
        placeItems: 'center',
        padding: '1rem',
      }}
    >
      <section
        aria-labelledby="not-found-title"
        style={{
          width: '100%',
          maxWidth: 560,
          background: '#ffffff',
          border: '1px solid rgba(220, 38, 38, 0.45)',
          borderRadius: 24,
          boxShadow: '0 22px 55px rgba(127, 29, 29, 0.16)',
          padding: '2rem 1.5rem',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            margin: 0,
            color: '#dc2626',
            fontSize: '1.5rem',
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}
        >
          Error 404!!
        </p>
        <h3
          id="not-found-title"
          style={{
            marginTop: '0.75rem',
            marginBottom: '0.75rem',
            color: '#14532d',
            fontSize: 'clamp(1.8rem, 4vw, 2rem)',
            lineHeight: 1.15,
            fontWeight: 700,
          }}
        >
          Halaman Tidak Ditemukan
        </h3>
        <p
          style={{
            marginTop: 0,
            marginBottom: '1.5rem',
            color: '#334155',
            fontSize: '1rem',
            lineHeight: 1.55,
          }}
        >
          Halaman yang Anda cari mungkin sudah dipindahkan atau URL tidak lagi aktif.
        </p>
        <Link
          href="/"
          className="btn text-white fw-semibold"
          style={{
            backgroundColor: '#3BAC1F',
            borderColor: '#3BAC1F',
            borderRadius: 999,
            padding: '0.62rem 1.35rem',
          }}
        >
          Kembali ke Home
        </Link>
      </section>
    </main>
  )
}
