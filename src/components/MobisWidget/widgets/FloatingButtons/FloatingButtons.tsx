'use client'
import React from 'react'

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
    <div className="d-flex flex-column gap-3 mobis-widget-float">
      {/* {showRegister && (
        <button
          type="button"
          className="btn btn-success d-flex align-items-center text-white px-4"
          style={btnStyle}
          onClick={onRegister}
        >
          <i className="fa-solid fa-user-pen me-2" style={{ fontSize: 22 }} />
          <span>Daftar Sekarang</span>
        </button>
      )} */}

      {showStatus && (
        <button
          type="button"
          className="btn btn-warning d-flex align-items-center text-white px-4"
          style={btnStyle}
          onClick={onStatus}
        >
          <i className="bi-solid bi-list-check me-2" style={{ fontSize: 22 }} />
          <span>Status Pendaftaran</span>
        </button>
      )}

      {showAssistant && (
        <button
          type="button"
          className="btn btn-success d-flex align-items-center text-white px-4"
          style={btnStyle}
          onClick={onAssistant}
        >
          <i className="bi-solid bi-headset me-2" style={{ fontSize: 22 }} />
          <span>Hubungi Kami</span>
        </button>
      )}
    </div>
  )
}
