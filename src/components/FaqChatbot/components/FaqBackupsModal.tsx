'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  History,
  X,
  Search,
  RotateCcw,
  Eye,
  Calendar,
  User,
  Database,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Layers,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react'
import type { ChatbotFaqBackupRow } from '@/utilities/chatbotDb'

interface BackupSummaryItem {
  id: number
  created_at: string
  backup_name: string
  triggered_by: string
  total_items: number
  total_dm_stg: number
  total_dm_prod: number
  total_comment_stg: number
  total_comment_prod: number
  metadata?: any
}

interface FaqBackupsModalProps {
  isOpen: boolean
  onClose: () => void
  onRestoreSuccess?: (message: string) => void
}

export default function FaqBackupsModal({
  isOpen,
  onClose,
  onRestoreSuccess,
}: FaqBackupsModalProps) {
  const [backups, setBackups] = useState<BackupSummaryItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // State untuk Restore Dialog
  const [selectedBackupForRestore, setSelectedBackupForRestore] = useState<BackupSummaryItem | null>(null)
  const [targetEnv, setTargetEnv] = useState<'staging' | 'production' | 'both'>('both')
  const [targetChannel, setTargetChannel] = useState<'dm' | 'comment' | 'all'>('all')
  const [isRestoring, setIsRestoring] = useState(false)
  const [restoreStatus, setRestoreStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // State untuk Detail Viewer
  const [selectedBackupForDetail, setSelectedBackupForDetail] = useState<ChatbotFaqBackupRow | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [detailTab, setDetailTab] = useState<'dm_stg' | 'dm_prod' | 'comment_stg' | 'comment_prod'>('dm_stg')

  // Fetch daftar riwayat backup dari API
  const fetchBackups = async () => {
    setIsLoading(true)
    setErrorMsg(null)
    try {
      const res = await fetch('/api/assistant/backups')
      const data = await res.json()
      if (res.ok && data.success) {
        setBackups(data.backups || [])
      } else {
        setErrorMsg(data.error || 'Gagal memuat daftar riwayat backup.')
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Terjadi kesalahan jaringan saat memuat riwayat backup.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchBackups()
      setRestoreStatus(null)
    }
  }, [isOpen])

  // Filter daftar backup berdasarkan kata kunci pencarian
  const filteredBackups = useMemo(() => {
    if (!searchQuery.trim()) return backups
    const q = searchQuery.toLowerCase()
    return backups.filter(
      (b) =>
        b.backup_name.toLowerCase().includes(q) ||
        b.triggered_by.toLowerCase().includes(q) ||
        new Date(b.created_at).toLocaleString('id-ID').toLowerCase().includes(q) ||
        String(b.id).includes(q)
    )
  }, [backups, searchQuery])

  // Format tanggal ramah pengguna
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString)
      return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta',
      }).format(date) + ' WIB'
    } catch {
      return isoString
    }
  }

  // Handler eksekusi Restore
  const handleExecuteRestore = async () => {
    if (!selectedBackupForRestore || isRestoring) return
    setIsRestoring(true)
    setRestoreStatus(null)

    try {
      const res = await fetch('/api/assistant/backups/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          backupId: selectedBackupForRestore.id,
          targetEnv,
          targetChannel,
          triggeredBy: 'CMS_ADMIN_RESTORE',
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setRestoreStatus({
          type: 'success',
          message: data.message || `Berhasil memulihkan data dari backup #${selectedBackupForRestore.id}!`,
        })

        if (onRestoreSuccess) {
          onRestoreSuccess(data.message)
        }

        // Tutup dialog restore setelah 2 detik
        setTimeout(() => {
          setSelectedBackupForRestore(null)
          setRestoreStatus(null)
        }, 2200)
      } else {
        setRestoreStatus({
          type: 'error',
          message: data.error || 'Gagal memulihkan data dari backup.',
        })
      }
    } catch (err: any) {
      setRestoreStatus({
        type: 'error',
        message: err?.message || 'Terjadi kesalahan jaringan saat memproses restore.',
      })
    } finally {
      setIsRestoring(false)
    }
  }

  // Handler buka detail viewer
  const handleOpenDetail = async (backupId: number) => {
    setIsLoadingDetail(true)
    setSelectedBackupForDetail(null)
    try {
      const res = await fetch(`/api/assistant/backups?id=${backupId}`)
      const data = await res.json()
      if (res.ok && data.success) {
        setSelectedBackupForDetail(data.backup)
      } else {
        alert(data.error || 'Gagal memuat detail snapshot.')
      }
    } catch (err: any) {
      alert(err?.message || 'Gagal memuat detail snapshot.')
    } finally {
      setIsLoadingDetail(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="mobis-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="mobis-modal-dialog mobis-backups-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '1240px', width: '96%' }}
      >
        {/* HEADER */}
        <div className="mobis-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3b82f6',
                flexShrink: 0,
              }}
            >
              <History size={20} />
            </div>
            <div>
              <h3 className="mobis-modal-title" style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>Riwayat Backup &amp; Restore FAQ</span>
                <span className="mobis-badge-count">{backups.length} Snapshot</span>
              </h3>
              <span className="mobis-modal-subtitle">
                Snapshot keseluruhan data FAQ yang otomatis tersimpan sebelum setiap proses sinkronisasi ke Production
              </span>
            </div>
          </div>
          <button type="button" className="mobis-modal-close" onClick={onClose} aria-label="Tutup">
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="mobis-modal-body" style={{ gap: '1rem', maxHeight: '72vh', overflowY: 'auto' }}>
          {/* TOOLBAR PENCARIAN & REFRESH */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="mobis-search-input-wrap" style={{ flex: '1 1 300px' }}>
              <Search size={15} className="mobis-search-icon" />
              <input
                type="text"
                className="mobis-search-input"
                placeholder="Cari berdasarkan tanggal, nama snapshot, atau ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button type="button" className="mobis-search-clear" onClick={() => setSearchQuery('')}>
                  <X size={13} />
                </button>
              )}
            </div>

            <button
              type="button"
              className="mobis-btn-secondary"
              onClick={fetchBackups}
              disabled={isLoading}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RotateCcw size={14} className={isLoading ? 'mobis-spin' : ''} />
              <span>Muat Ulang</span>
            </button>
          </div>

          {errorMsg && (
            <div className="mobis-sync-banner is-error">
              <AlertTriangle size={15} style={{ marginRight: '8px' }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TABEL TAMPILAN A (DAFTAR TANGGAL RIWAYAT) */}
          <div className="mobis-table-container" style={{ border: '1px solid var(--theme-elevation-200)', borderRadius: '8px' }}>
            {isLoading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--theme-text)' }}>
                <Loader2 size={28} className="mobis-spin" style={{ margin: '0 auto 0.75rem auto', color: '#3b82f6' }} />
                <p style={{ margin: 0, fontSize: '0.92rem' }}>Memuat daftar riwayat backup dari database...</p>
              </div>
            ) : filteredBackups.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', opacity: 0.7 }}>
                <History size={32} style={{ margin: '0 auto 0.75rem auto', opacity: 0.5 }} />
                <p style={{ margin: 0, fontWeight: 600 }}>Belum ada snapshot backup yang ditemukan</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem' }}>
                  Snapshot akan otomatis tercipta setiap kali tombol &quot;Ya, Sinkronkan ke Production&quot; ditekan.
                </p>
              </div>
            ) : (
              <table className="mobis-backup-table">
                <thead>
                  <tr>
                    <th style={{ width: '55px', textAlign: 'center' }}>ID</th>
                    <th style={{ width: '190px' }}>Tanggal &amp; Waktu</th>
                    <th style={{ minWidth: '240px' }}>Label Snapshot</th>
                    <th style={{ width: '160px' }}>Pembuat</th>
                    <th style={{ width: '310px' }}>Rincian Data</th>
                    <th style={{ width: '160px', textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBackups.map((b) => {
                    // Tampilkan label snapshot tanpa pengulangan tanggal jika sudah ada di kolom Tanggal
                    const cleanLabel =
                      b.metadata?.note ||
                      b.backup_name.replace(/\s*\(\d{1,2}\s+[A-Za-z]+\s+\d{4},.*?\)/, '').trim() ||
                      b.backup_name

                    return (
                      <tr key={b.id}>
                        <td style={{ textAlign: 'center' }}>
                          <span className="mobis-backup-id-badge">#{b.id}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontWeight: 600, fontSize: '0.86rem' }}>
                            <Calendar size={14} style={{ color: '#3b82f6', opacity: 0.85, flexShrink: 0 }} />
                            <span>{formatDate(b.created_at)}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--theme-text)' }}>
                              {cleanLabel}
                            </span>
                            <span style={{ fontSize: '0.72rem', opacity: 0.55, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Sparkles size={11} style={{ color: '#10b981' }} />
                              Point-in-time Snapshot
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="mobis-backup-author-pill">
                            <User size={12} style={{ opacity: 0.7 }} />
                            <span>{b.triggered_by}</span>
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="mobis-badge-dm">DM: {b.total_dm_stg} Stg / {b.total_dm_prod} Prod</span>
                            <span className="mobis-badge-comment">Comment: {b.total_comment_stg} Stg / {b.total_comment_prod} Prod</span>
                            <span className="mobis-total-faq-tag">Total: {b.total_items} FAQ</span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                            <button
                              type="button"
                              className="mobis-btn-secondary"
                              onClick={() => handleOpenDetail(b.id)}
                              title="Lihat isi data snapshot ini"
                              style={{ padding: '6px 11px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                            >
                              <Eye size={13} />
                              <span>Lihat</span>
                            </button>
                            <button
                              type="button"
                              className="mobis-btn-primary"
                              onClick={() => {
                                setSelectedBackupForRestore(b)
                                setRestoreStatus(null)
                              }}
                              title="Pulihkan data ke tanggal ini"
                              style={{
                                padding: '6px 12px',
                                fontSize: '0.78rem',
                                background: '#3b82f6',
                                borderColor: '#3b82f6',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                              }}
                            >
                              <RotateCcw size={13} />
                              <span>Restore</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="mobis-modal-footer">
          <button type="button" className="mobis-btn-secondary" onClick={onClose}>
            Tutup Riwayat
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* DIALOG MODAL KONFIRMASI RESTORE SELEKTIF */}
      {/* ======================================================== */}
      {selectedBackupForRestore && (
        <div
          className="mobis-modal-backdrop"
          onClick={() => !isRestoring && setSelectedBackupForRestore(null)}
          style={{ zIndex: 100000 }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="mobis-modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '540px' }}
          >
            <div className="mobis-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(59, 130, 246, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#3b82f6',
                  }}
                >
                  <RotateCcw size={18} />
                </div>
                <div>
                  <h3 className="mobis-modal-title" style={{ fontSize: '1.05rem' }}>
                    Konfirmasi Restore Data FAQ
                  </h3>
                  <span className="mobis-modal-subtitle">
                    Snapshot #{selectedBackupForRestore.id} ({formatDate(selectedBackupForRestore.created_at)})
                  </span>
                </div>
              </div>
              {!isRestoring && (
                <button
                  type="button"
                  className="mobis-modal-close"
                  onClick={() => setSelectedBackupForRestore(null)}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="mobis-modal-body" style={{ gap: '1.1rem' }}>
              {restoreStatus && (
                <div className={`mobis-sync-banner is-${restoreStatus.type}`}>
                  {restoreStatus.type === 'success' ? (
                    <CheckCircle2 size={16} style={{ marginRight: '8px', color: '#10b981' }} />
                  ) : (
                    <AlertTriangle size={16} style={{ marginRight: '8px', color: '#ef4444' }} />
                  )}
                  <span>{restoreStatus.message}</span>
                </div>
              )}

              {/* 1. PILIHAN TARGET ENVIRONMENT */}
              <div className="mobis-restore-group">
                <label className="mobis-restore-group-title">
                  <Database size={14} />
                  <span>1. Pilih Target Environment yang Ingin Dipulihkan:</span>
                </label>
                <div className="mobis-radio-options">
                  <label className={`mobis-radio-card ${targetEnv === 'both' ? 'is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="targetEnv"
                      value="both"
                      checked={targetEnv === 'both'}
                      onChange={() => setTargetEnv('both')}
                      disabled={isRestoring}
                    />
                    <div className="mobis-radio-card-content">
                      <div className="mobis-radio-card-title">Keduanya (Staging &amp; Production)</div>
                      <div className="mobis-radio-card-desc">Reset menyeluruh kedua database ke kondisi tanggal ini</div>
                    </div>
                  </label>

                  <label className={`mobis-radio-card ${targetEnv === 'staging' ? 'is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="targetEnv"
                      value="staging"
                      checked={targetEnv === 'staging'}
                      onChange={() => setTargetEnv('staging')}
                      disabled={isRestoring}
                    />
                    <div className="mobis-radio-card-content">
                      <div className="mobis-radio-card-title">Hanya Staging (Aman &amp; Rekomendasi)</div>
                      <div className="mobis-radio-card-desc">Pulihkan ke Staging dulu untuk ditinjau tanpa menyentuh Live Production</div>
                    </div>
                  </label>

                  <label className={`mobis-radio-card ${targetEnv === 'production' ? 'is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="targetEnv"
                      value="production"
                      checked={targetEnv === 'production'}
                      onChange={() => setTargetEnv('production')}
                      disabled={isRestoring}
                    />
                    <div className="mobis-radio-card-content">
                      <div className="mobis-radio-card-title">Hanya Production</div>
                      <div className="mobis-radio-card-desc">Langsung pulihkan data Live jika Production sedang bermasalah</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* 2. PILIHAN TARGET CHANNEL */}
              <div className="mobis-restore-group">
                <label className="mobis-restore-group-title">
                  <Layers size={14} />
                  <span>2. Pilih Target Channel / Sheet:</span>
                </label>
                <div className="mobis-radio-options" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                  <label className={`mobis-radio-pill ${targetChannel === 'all' ? 'is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="targetChannel"
                      value="all"
                      checked={targetChannel === 'all'}
                      onChange={() => setTargetChannel('all')}
                      disabled={isRestoring}
                    />
                    <span>Semua (DM &amp; Comment)</span>
                  </label>

                  <label className={`mobis-radio-pill ${targetChannel === 'dm' ? 'is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="targetChannel"
                      value="dm"
                      checked={targetChannel === 'dm'}
                      onChange={() => setTargetChannel('dm')}
                      disabled={isRestoring}
                    />
                    <span>Hanya DM</span>
                  </label>

                  <label className={`mobis-radio-pill ${targetChannel === 'comment' ? 'is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="targetChannel"
                      value="comment"
                      checked={targetChannel === 'comment'}
                      onChange={() => setTargetChannel('comment')}
                      disabled={isRestoring}
                    />
                    <span>Hanya Comment</span>
                  </label>
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  borderRadius: '6px',
                  padding: '0.75rem 0.9rem',
                  fontSize: '0.8rem',
                  color: 'var(--theme-text)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                }}
              >
                <AlertTriangle size={15} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  <strong>Perhatian:</strong> Data aktif pada target yang dipilih akan digantikan dengan kondisi data pada snapshot tanggal ini. Proses ini tidak dapat dibatalkan.
                </span>
              </div>
            </div>

            <div className="mobis-modal-footer">
              <button
                type="button"
                className="mobis-btn-secondary"
                onClick={() => setSelectedBackupForRestore(null)}
                disabled={isRestoring}
              >
                Batal
              </button>
              <button
                type="button"
                className="mobis-btn-primary"
                onClick={handleExecuteRestore}
                disabled={isRestoring}
                style={{
                  background: '#3b82f6',
                  borderColor: '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {isRestoring ? (
                  <>
                    <Loader2 size={14} className="mobis-spin" />
                    <span>Memulihkan Data...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw size={14} />
                    <span>Ya, Pulihkan Data</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL LIHAT DETAIL SNAPSHOT */}
      {/* ======================================================== */}
      {selectedBackupForDetail && (
        <div
          className="mobis-modal-backdrop"
          onClick={() => setSelectedBackupForDetail(null)}
          style={{ zIndex: 100000 }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="mobis-modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '850px', width: '92%' }}
          >
            <div className="mobis-modal-header">
              <div>
                <h3 className="mobis-modal-title" style={{ fontSize: '1.1rem' }}>
                  Detail Isi Snapshot #{selectedBackupForDetail.id}
                </h3>
                <span className="mobis-modal-subtitle">
                  {selectedBackupForDetail.backup_name} • {formatDate(selectedBackupForDetail.created_at)}
                </span>
              </div>
              <button
                type="button"
                className="mobis-modal-close"
                onClick={() => setSelectedBackupForDetail(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="mobis-modal-body" style={{ gap: '0.75rem', maxHeight: '68vh', overflowY: 'auto' }}>
              {/* SUB-TABS PILIHAN CHANNEL & ENV */}
              <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--theme-elevation-200)', paddingBottom: '8px' }}>
                <button
                  type="button"
                  className={`mobis-subtab-btn ${detailTab === 'dm_stg' ? 'is-active' : ''}`}
                  onClick={() => setDetailTab('dm_stg')}
                >
                  DM Staging ({selectedBackupForDetail.snapshot_data.dm.staging.length})
                </button>
                <button
                  type="button"
                  className={`mobis-subtab-btn ${detailTab === 'dm_prod' ? 'is-active' : ''}`}
                  onClick={() => setDetailTab('dm_prod')}
                >
                  DM Production ({selectedBackupForDetail.snapshot_data.dm.production.length})
                </button>
                <button
                  type="button"
                  className={`mobis-subtab-btn ${detailTab === 'comment_stg' ? 'is-active' : ''}`}
                  onClick={() => setDetailTab('comment_stg')}
                >
                  Comment Staging ({selectedBackupForDetail.snapshot_data.comment.staging.length})
                </button>
                <button
                  type="button"
                  className={`mobis-subtab-btn ${detailTab === 'comment_prod' ? 'is-active' : ''}`}
                  onClick={() => setDetailTab('comment_prod')}
                >
                  Comment Production ({selectedBackupForDetail.snapshot_data.comment.production.length})
                </button>
              </div>

              {/* LIST FAQ DALAM TAB INI */}
              {(() => {
                let items: any[] = []
                if (detailTab === 'dm_stg') items = selectedBackupForDetail.snapshot_data.dm.staging
                if (detailTab === 'dm_prod') items = selectedBackupForDetail.snapshot_data.dm.production
                if (detailTab === 'comment_stg') items = selectedBackupForDetail.snapshot_data.comment.staging
                if (detailTab === 'comment_prod') items = selectedBackupForDetail.snapshot_data.comment.production

                if (items.length === 0) {
                  return (
                    <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.6 }}>
                      Tidak ada data pada bagian ini.
                    </div>
                  )
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {items.map((item, idx) => (
                      <div
                        key={item.uuid || idx}
                        style={{
                          background: 'var(--theme-elevation-100)',
                          border: '1px solid var(--theme-elevation-200)',
                          borderRadius: '6px',
                          padding: '0.75rem 0.9rem',
                          fontSize: '0.85rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--theme-text)' }}>
                            #{idx + 1}. {item.question}
                          </span>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'var(--theme-elevation-200)',
                              opacity: 0.8,
                            }}
                          >
                            {item.category}
                          </span>
                        </div>
                        <div style={{ color: 'var(--theme-text)', opacity: 0.85, fontSize: '0.82rem', lineHeight: 1.45 }}>
                          {item.answer}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>

            <div className="mobis-modal-footer">
              <button
                type="button"
                className="mobis-btn-secondary"
                onClick={() => setSelectedBackupForDetail(null)}
              >
                Tutup Detail
              </button>
              <button
                type="button"
                className="mobis-btn-primary"
                onClick={() => {
                  const b = selectedBackupForDetail
                  setSelectedBackupForDetail(null)
                  setSelectedBackupForRestore(b as any)
                }}
                style={{ background: '#3b82f6', borderColor: '#3b82f6' }}
              >
                Lanjut ke Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
