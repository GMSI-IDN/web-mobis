'use client'
import React from 'react'
import { FileText, Headset } from 'lucide-react'

export default function FloatingButtons({
  width = 225,
  showRegister,
  showStatus,
  showAssistant,
  onRegister,
  onStatus,
  onAssistant,
}: {
  width?: number
  showRegister: boolean
  showStatus: boolean
  showAssistant: boolean
  onRegister: () => void
  onStatus: () => void
  onAssistant: () => void
}) {
  const btnStyle: React.CSSProperties = {
    borderRadius: 30,
    height: 60,
    width,
    boxShadow: '0 4px 6px rgba(0,0,0,.1)',
  }

  return (
    <div className="d-flex flex-column align-items-end gap-3 mobis-widget-float">
      {showStatus && (
        <button
          type="button"
          /* [10-09-2026] Perbaiki kontras warna: gunakan text-dark di atas latar kuning warning (WCAG AA >= 4.5:1) */
          className="btn btn-warning d-flex align-items-center text-dark fw-bold px-4"
          aria-label="Cek Status Pendaftaran MOBIS"
          style={btnStyle}
          onClick={onStatus}
        >
          <FileText className="me-2" size={22} />
          <span>Status Pendaftaran</span>
        </button>
      )}

      {showAssistant && (
        <button
          type="button"
          className="btn btn-success d-flex align-items-center text-white px-4"
          aria-label="Hubungi Layanan Bantuan MOBIS"
          style={btnStyle}
          onClick={onAssistant}
        >
          <Headset className="me-2" size={22} />
          <span>Hubungi Kami</span>
        </button>
      )}
    </div>
  )
}

