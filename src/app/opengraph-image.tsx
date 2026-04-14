import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Mobis rental mobil untuk driver online'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background:
            'linear-gradient(135deg, #052f24 0%, #0d7a52 48%, #1fbf75 100%)',
          color: '#ffffff',
          padding: '56px 64px',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '12px 22px',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.14)',
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: 'uppercase',
          }}
        >
          Mobis
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 900 }}>
          <div style={{ fontSize: 68, lineHeight: 1.08, fontWeight: 800 }}>
            Rental Mobil Untuk Driver Online
          </div>
          <div style={{ fontSize: 32, lineHeight: 1.35, color: 'rgba(255,255,255,0.92)' }}>
            Calya & Sigra, promo pendaftaran, dan program kepemilikan untuk mitra driver.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 24,
            color: 'rgba(255,255,255,0.88)',
          }}
        >
          <div>rentalmobis.com</div>
          <div>Jabodetabek • Bandung • Surabaya • Bali</div>
        </div>
      </div>
    ),
    size,
  )
}
