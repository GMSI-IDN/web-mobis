'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  Copy,
  Check,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Rocket,
  Loader2,
  Clock,
  Sparkles,
  Info,
  HelpCircle,
} from 'lucide-react'

export interface ScanFeedbackData {
  isOpen: boolean
  status:
    | 'loading'
    | 'confirmation'
    | 'contradiction'
    | 'duplicate'
    | 'success'
    | 'error'
    | 'info'
  feedbackText: string
  faqQuestion?: string
  faqUuid?: string
  rawResponse?: any
  title?: string
  subtitle?: string
}

export default function ScanFeedbackModal({
  data,
  onClose,
  onConfirmSync,
  isConfirmingSync,
}: {
  data: ScanFeedbackData | null
  onClose: () => void
  onConfirmSync?: () => void
  isConfirmingSync?: boolean
}) {
  const [copied, setCopied] = useState(false)
  const [secondsElapsed, setSecondsElapsed] = useState(0)

  // Live timer saat status 'loading'
  useEffect(() => {
    let interval: any = null
    if (data?.isOpen && data?.status === 'loading') {
      setSecondsElapsed(0)
      interval = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1)
      }, 1000)
    } else {
      setSecondsElapsed(0)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [data?.isOpen, data?.status])

  if (!data || !data.isOpen) return null

  const handleCopy = () => {
    const textToCopy =
      typeof data.rawResponse === 'object'
        ? `${data.feedbackText}\n\nDetail Respon n8n:\n${JSON.stringify(data.rawResponse, null, 2)}`
        : data.feedbackText

    void navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isLoading = data.status === 'loading'
  const isConfirmation = data.status === 'confirmation'
  const isContradiction = data.status === 'contradiction'
  const isDuplicate = data.status === 'duplicate'
  const isSuccess = data.status === 'success'
  const isError = data.status === 'error'
  const isInfo = data.status === 'info'

  let title = data.title || 'Hasil Pemeriksaan FAQ'
  let subtitle = data.subtitle || 'Pemeriksaan konsistensi data jawaban FAQ'

  if (isLoading) {
    title = 'Menjalankan Workflow n8n...'
    subtitle = 'Sedang mengevaluasi data dan menunggu respon workflow n8n selesai'
  } else if (isConfirmation) {
    title = data.title || 'Pemeriksaan AI Selesai - Tidak Ada Kontradiksi'
    subtitle = data.subtitle || 'Data FAQ konsisten dan aman untuk diterapkan'
  } else if (isContradiction) {
    title = data.title || 'Ditemukan Kontradiksi pada FAQ!'
    subtitle = data.subtitle || 'Sistem AI mendeteksi adanya jawaban yang saling bertentangan'
  } else if (isDuplicate) {
    title = data.title || 'Ditemukan Duplikasi Kategori FAQ!'
    subtitle = data.subtitle || 'Kategori FAQ ini terdeteksi memiliki duplikasi'
  } else if (isInfo) {
    title = data.title || 'Status Eksekusi n8n'
    subtitle = data.subtitle || 'Workflow n8n sedang diproses'
  } else if (isSuccess) {
    title = data.title || 'Workflow n8n Berhasil Selesai!'
    subtitle = data.subtitle || 'Data telah berhasil diselaraskan ke Live Production'
  } else if (isError) {
    title = data.title || 'Respon Sistem: Terjadi Kendala'
    subtitle = data.subtitle || 'Workflow n8n atau database mengembalikan pesan kesalahan'
  }

  return (
    <div
      className="mobis-modal-backdrop"
      onClick={() => {
        // Jangan izinkan tutup sembarangan jika sedang proses loading n8n atau sedang commit
        if (!isLoading && !isConfirmingSync) onClose()
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="mobis-modal-dialog mobis-feedback-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px' }}
      >
        {/* HEADER */}
        <div className="mobis-modal-header" style={{ alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {isLoading ? (
              <div className="mobis-loading-orb-wrap">
                <Loader2 size={22} className="mobis-spin" color="#10b981" />
              </div>
            ) : isConfirmation ? (
              <CheckCircle2 size={24} color="#10b981" style={{ flexShrink: 0 }} />
            ) : isContradiction ? (
              <AlertTriangle size={24} color="#f59e0b" style={{ flexShrink: 0 }} />
            ) : isInfo ? (
              <Info size={24} color="#0ea5e9" style={{ flexShrink: 0 }} />
            ) : isDuplicate || isError ? (
              <XCircle size={24} color="#ef4444" style={{ flexShrink: 0 }} />
            ) : (
              <CheckCircle2 size={24} color="#10b981" style={{ flexShrink: 0 }} />
            )}
            <div>
              <h3 className="mobis-modal-title" style={{ fontSize: '1.15rem' }}>
                {title}
              </h3>
              <span className="mobis-modal-subtitle">{subtitle}</span>
            </div>
          </div>
          {!isLoading && !isConfirmingSync && (
            <button
              type="button"
              className="mobis-modal-close"
              onClick={onClose}
              aria-label="Tutup"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* BODY */}
        <div className="mobis-modal-body" style={{ gap: '1.15rem' }}>
          {/* TAMPILAN KHUSUS STATUS LOADING */}
          {isLoading && (
            <div className="mobis-waiting-wf-container">
              {/* ANIMATED PULSING ORB */}
              <div className="mobis-wf-pulse-center">
                <div className="mobis-wf-pulse-ring" />
                <div className="mobis-wf-pulse-icon">
                  <Rocket size={26} color="#ffffff" />
                </div>
              </div>

              {/* TIMER COUNTER */}
              <div className="mobis-wf-timer-badge">
                <Clock size={13} />
                <span>Menunggu eksekusi n8n: {secondsElapsed} detik</span>
              </div>

              {/* PROGRESS STEPS */}
              <div className="mobis-wf-steps-list">
                <div className="mobis-wf-step-item is-done">
                  <span className="mobis-wf-step-dot">✓</span>
                  <span>Webhook berhasil dikirim ke n8n</span>
                </div>
                <div className="mobis-wf-step-item is-active">
                  <span className="mobis-wf-step-dot">
                    <Loader2 size={12} className="mobis-spin" />
                  </span>
                  <span>Node evaluasi &amp; workflow n8n sedang berjalan...</span>
                </div>
                <div className="mobis-wf-step-item is-waiting">
                  <span className="mobis-wf-step-dot">•</span>
                  <span>Menunggu respon hasil dari n8n</span>
                </div>
              </div>

              <p className="mobis-wf-info-note">
                <Sparkles size={14} style={{ marginRight: '6px', flexShrink: 0 }} />
                <span>
                  Jika workflow n8n Anda menjalankan AI Evaluation atau RAG, proses ini membutuhkan waktu beberapa detik. Hasil respon akan otomatis tampil di layar ini begitu selesai.
                </span>
              </p>
            </div>
          )}

          {/* TAMPILAN SETELAH SELESAI */}
          {!isLoading && (
            <>
              {/* 1. TAMPILAN JIKA STATUS CONFIRMATION (TRUE: TIDAK ADA KONTRADIKSI) */}
              {isConfirmation ? (
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    borderRadius: '8px',
                    padding: '1.15rem 1.25rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '10px',
                      color: '#10b981',
                      fontWeight: 700,
                      fontSize: '0.96rem',
                    }}
                  >
                    <CheckCircle2 size={20} />
                    <span>Hasil Analisis AI: Valid &amp; Bebas Kontradiksi</span>
                  </div>
                  <p
                    style={{
                      margin: '0 0 12px 0',
                      fontSize: '0.88rem',
                      lineHeight: 1.55,
                      color: 'var(--theme-text)',
                    }}
                  >
                    Berdasarkan hasil analisis AI pada alur n8n, seluruh data FAQ pada Staging telah diperiksa. <strong>Tidak ada kontradiksi</strong>, duplikasi, atau inkonsistensi jawaban antar artikel FAQ.
                  </p>
                  <div
                    style={{
                      padding: '0.85rem 1rem',
                      background: 'rgba(16, 185, 129, 0.16)',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      borderRadius: '6px',
                      fontWeight: 600,
                      fontSize: '0.92rem',
                      color: 'var(--theme-text)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <HelpCircle size={18} color="#10b981" style={{ flexShrink: 0 }} />
                    <span>Apakah kamu yakin ingin menyinkronkan data ini ke Production?</span>
                  </div>

                  {data.rawResponse && (
                    <div
                      style={{
                        marginTop: '1rem',
                        paddingTop: '0.65rem',
                        borderTop: '1px dashed rgba(16, 185, 129, 0.3)',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          opacity: 0.7,
                          display: 'block',
                          marginBottom: '0.25rem',
                        }}
                      >
                        DATA RESPON / RAW OUTPUT N8N:
                      </span>
                      <pre
                        style={{
                          margin: 0,
                          fontSize: '0.76rem',
                          background: 'rgba(0,0,0,0.25)',
                          padding: '0.5rem',
                          borderRadius: '4px',
                          overflowX: 'auto',
                        }}
                      >
                        {JSON.stringify(data.rawResponse, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ) : isContradiction || isDuplicate ? (
                /* 2. TAMPILAN JIKA STATUS CONTRADICTION (FALSE: ADA KONTRADIKSI / DUPLIKASI) */
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    borderRadius: '8px',
                    padding: '1.15rem 1.25rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '10px',
                      color: '#ef4444',
                      fontWeight: 700,
                      fontSize: '0.96rem',
                    }}
                  >
                    <AlertTriangle size={20} />
                    <span>Hasil Analisis AI: Ditemukan Kontradiksi / Kesalahan</span>
                  </div>
                  <p
                    style={{
                      margin: '0 0 10px 0',
                      fontSize: '0.88rem',
                      lineHeight: 1.55,
                      color: 'var(--theme-text)',
                    }}
                  >
                    Berdasarkan hasil analisis AI pada alur n8n, <strong>ditemukan adanya kontradiksi</strong> atau ketidaksesuaian jawaban pada data FAQ.
                  </p>

                  {/* TAMPILKAN RINCIAN KONTRADIKSI YANG MANA DENGAN MANA */}
                  {data.feedbackText && (
                    <div
                      style={{
                        padding: '0.9rem 1.1rem',
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        borderRadius: '6px',
                        fontSize: '0.88rem',
                        lineHeight: 1.6,
                        color: 'var(--theme-text)',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        marginBottom: '0.85rem',
                      }}
                    >
                      <strong style={{ display: 'block', color: '#f87171', marginBottom: '6px', fontSize: '0.86rem' }}>
                        📋 Rincian Temuan Kontradiksi (Yang Mana dengan Mana):
                      </strong>
                      {data.feedbackText}
                    </div>
                  )}

                  <div
                    style={{
                      padding: '0.85rem 1rem',
                      background: 'rgba(239, 68, 68, 0.14)',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      borderRadius: '6px',
                      fontSize: '0.88rem',
                      lineHeight: 1.5,
                      color: 'var(--theme-text)',
                      marginBottom: '0.75rem',
                    }}
                  >
                    👉 <strong>Silakan sesuaikan data:</strong> Periksa dan perbaiki pertanyaan atau jawaban pada tab Staging terlebih dahulu sebelum disinkronkan ke Production.
                  </div>

                  {data.rawResponse && (
                    <div
                      style={{
                        marginTop: '0.9rem',
                        paddingTop: '0.65rem',
                        borderTop: '1px dashed rgba(239, 68, 68, 0.3)',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          opacity: 0.7,
                          display: 'block',
                          marginBottom: '0.25rem',
                        }}
                      >
                        DATA RESPON / RAW OUTPUT N8N:
                      </span>
                      <pre
                        style={{
                          margin: 0,
                          fontSize: '0.76rem',
                          background: 'rgba(0,0,0,0.25)',
                          padding: '0.5rem',
                          borderRadius: '4px',
                          overflowX: 'auto',
                        }}
                      >
                        {JSON.stringify(data.rawResponse, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                /* 3. TAMPILAN DEFAULT LAINNYA (INFO / SUCCESS / GENERAL ERROR) */
                <>
                  {data.faqQuestion && (
                    <div className="mobis-detail-block">
                      <span className="mobis-detail-label">Pertanyaan FAQ</span>
                      <div
                        style={{
                          fontSize: '0.88rem',
                          fontWeight: 600,
                          color: 'var(--theme-text)',
                          lineHeight: 1.45,
                        }}
                      >
                        {data.faqQuestion}
                      </div>
                      {data.faqUuid && (
                        <div style={{ marginTop: '0.25rem', fontSize: '0.74rem', opacity: 0.6 }}>
                          UUID: <code>{data.faqUuid}</code>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mobis-detail-block">
                    <span className="mobis-detail-label">
                      <span>Respon yang Diterima dari n8n / Sistem:</span>
                    </span>
                    <div
                      className={`mobis-feedback-content-box ${
                        isError ? 'is-danger' : isInfo ? 'is-info' : 'is-success'
                      }`}
                      style={{
                        background: isError
                          ? 'rgba(239, 68, 68, 0.08)'
                          : isInfo
                          ? 'rgba(14, 165, 233, 0.08)'
                          : 'rgba(16, 185, 129, 0.08)',
                        border: isError
                          ? '1px solid rgba(239, 68, 68, 0.3)'
                          : isInfo
                          ? '1px solid rgba(14, 165, 233, 0.35)'
                          : '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '8px',
                        padding: '0.9rem 1.1rem',
                        fontSize: '0.86rem',
                        lineHeight: 1.55,
                        color: 'var(--theme-text)',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        maxHeight: '260px',
                        overflowY: 'auto',
                      }}
                    >
                      {data.feedbackText}

                      {data.rawResponse && typeof data.rawResponse === 'object' && (
                        <div
                          style={{
                            marginTop: '0.75rem',
                            paddingTop: '0.65rem',
                            borderTop: '1px dashed var(--theme-elevation-200)',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              opacity: 0.7,
                              display: 'block',
                              marginBottom: '0.25rem',
                            }}
                          >
                            DATA RESPON / RAW OUTPUT N8N:
                          </span>
                          <pre
                            style={{
                              margin: 0,
                              fontSize: '0.76rem',
                              background: 'rgba(0,0,0,0.25)',
                              padding: '0.5rem',
                              borderRadius: '4px',
                              overflowX: 'auto',
                            }}
                          >
                            {JSON.stringify(data.rawResponse, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* FOOTER */}
        {!isLoading && (
          <div className="mobis-modal-footer">
            {isConfirmation ? (
              <>
                <button
                  type="button"
                  className="mobis-btn-secondary"
                  onClick={onClose}
                  disabled={isConfirmingSync}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="mobis-btn-primary"
                  onClick={onConfirmSync}
                  disabled={isConfirmingSync}
                  style={{
                    background: '#10b981',
                    borderColor: '#10b981',
                    color: '#ffffff',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {isConfirmingSync ? (
                    <>
                      <Loader2 size={15} className="mobis-spin" />
                      <span>Menyinkronkan ke Production...</span>
                    </>
                  ) : (
                    <>
                      <Rocket size={15} />
                      <span>Ya, Sinkronkan ke Production</span>
                    </>
                  )}
                </button>
              </>
            ) : isContradiction || isDuplicate ? (
              <>
                <button
                  type="button"
                  className="mobis-btn-secondary"
                  onClick={handleCopy}
                  title="Salin hasil review ke clipboard"
                >
                  {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  <span>{copied ? 'Tersalin!' : 'Salin Respon'}</span>
                </button>
                <button
                  type="button"
                  className="mobis-btn-primary"
                  onClick={onClose}
                  style={{ background: '#f59e0b', borderColor: '#f59e0b', color: '#000', fontWeight: 600 }}
                >
                  Tutup &amp; Sesuaikan Data
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="mobis-btn-secondary"
                  onClick={handleCopy}
                  title="Salin hasil review ke clipboard"
                >
                  {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  <span>{copied ? 'Tersalin!' : 'Salin Respon'}</span>
                </button>
                <button
                  type="button"
                  className="mobis-btn-primary"
                  onClick={onClose}
                >
                  Selesai &amp; Tutup
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
