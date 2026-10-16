'use client'

import React, { useMemo, useState } from 'react'
import {
  Search,
  Eye,
  Pencil,
  Trash2,
  Plus,
  X,
  MessageSquare,
  Copy,
  Check,
  RefreshCw,
  Rocket,
  Loader2,
} from 'lucide-react'
import type { FaqChannel, FaqEnvironment, FaqItem } from './types'
import { CATEGORY_LABELS } from './types'
import EnvironmentTabs from './components/EnvironmentTabs'
import FaqDetailModal from './components/FaqDetailModal'
import FaqEditModal from './components/FaqEditModal'
import ScanFeedbackModal, { type ScanFeedbackData } from './components/ScanFeedbackModal'
import ChatbotFab from './components/ChatbotFab'
import './index.scss'

export default function FaqChatbotClient({ initialFaqs }: { initialFaqs: FaqItem[] }) {
  const [faqs, setFaqs] = useState<FaqItem[]>(initialFaqs)
  // Default: Staging dan DM sesuai permintaan
  const [activeEnv, setActiveEnv] = useState<FaqEnvironment>('staging')
  const [activeChannel, setActiveChannel] = useState<FaqChannel>('dm')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const [activeModalFaq, setActiveModalFaq] = useState<FaqItem | null>(null)
  const [activeEditFaq, setActiveEditFaq] = useState<FaqItem | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDeletingUuid, setIsDeletingUuid] = useState<string | null>(null)
  const [faqToDelete, setFaqToDelete] = useState<FaqItem | null>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [copiedUuid, setCopiedUuid] = useState<string | null>(null)

  // Sync FAQ via n8n webhook
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState<{
    type: 'success' | 'error' | 'loading'
    message: string
  } | null>(null)

  // Single Global Apply to Production state
  const [isApplyingGlobal, setIsApplyingGlobal] = useState(false)

  // Modal feedback hasil scan AI n8n (kontradiksi / duplikasi)
  const [scanFeedbackData, setScanFeedbackData] = useState<ScanFeedbackData | null>(null)
  const [isConfirmingSync, setIsConfirmingSync] = useState(false)

  // Bandingkan Staging vs Production untuk mendeteksi apakah ada perubahan
  const diffInfo = useMemo(() => {
    const targetChannels = activeChannel === 'all' ? ['dm', 'comment'] : [activeChannel]

    const stgItems = faqs.filter(
      (f) => f.environment === 'staging' && targetChannels.includes(f.channel as any),
    )
    const prodItems = faqs.filter(
      (f) => f.environment === 'production' && targetChannels.includes(f.channel as any),
    )

    const prodMapByUuid = new Map<string, FaqItem>()
    const prodMapByQuestion = new Map<string, FaqItem>()
    for (const item of prodItems) {
      if (item.uuid) {
        prodMapByUuid.set(item.uuid, item)
      }
      prodMapByQuestion.set(item.question.trim().toLowerCase(), item)
    }

    const diffMap = new Map<string, 'new' | 'modified'>()
    const matchedProdUuids = new Set<string>()

    let newCount = 0
    let modifiedCount = 0

    for (const item of stgItems) {
      const key = item.uuid || String(item.id)
      const prodItem = item.uuid
        ? prodMapByUuid.get(item.uuid)
        : prodMapByQuestion.get(item.question.trim().toLowerCase())

      if (!prodItem) {
        diffMap.set(key, 'new')
        newCount++
      } else {
        if (prodItem.uuid) matchedProdUuids.add(prodItem.uuid)

        const isDiff =
          item.question.trim() !== prodItem.question.trim() ||
          item.answer.trim() !== prodItem.answer.trim() ||
          item.category !== prodItem.category

        if (isDiff) {
          diffMap.set(key, 'modified')
          modifiedCount++
        }
      }
    }

    // Hitung item yang ada di Production tetapi sudah tidak ada di Staging (dihapus)
    let deletedCount = 0
    for (const prodItem of prodItems) {
      if (prodItem.uuid && !matchedProdUuids.has(prodItem.uuid)) {
        deletedCount++
      }
    }

    const totalChanges = newCount + modifiedCount + deletedCount
    const hasChanges = totalChanges > 0

    return {
      hasChanges,
      totalChanges,
      newCount,
      modifiedCount,
      deletedCount,
      diffMap,
    }
  }, [faqs, activeChannel])

  const handleSyncFaq = async () => {
    if (isSyncing) return
    setIsSyncing(true)
    setSyncStatus(null)

    try {
      const res = await fetch('/api/assistant/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ environment: activeEnv, channel: activeChannel }),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setSyncStatus({
          type: 'success',
          message: data.message || 'Workflow sinkronisasi FAQ dari Google Sheet berhasil dijalankan di n8n!',
        })
      } else {
        setSyncStatus({
          type: 'error',
          message: data.error || 'Gagal menjalankan sinkronisasi FAQ. Periksa koneksi ke n8n.',
        })
      }
    } catch (err: any) {
      setSyncStatus({
        type: 'error',
        message: err?.message || 'Terjadi kesalahan saat memicu sinkronisasi.',
      })
    } finally {
      setIsSyncing(false)
      // Auto-dismiss notification after 8 seconds
      setTimeout(() => setSyncStatus(null), 8000)
    }
  }

  const handleApplyGlobal = async () => {
    if (isApplyingGlobal || !diffInfo.hasChanges) return
    setIsApplyingGlobal(true)

    // Buka Modal Loading secara instan agar user melihat animasi proses workflow n8n
    const channel = activeChannel === 'all' ? 'all' : activeChannel
    const channelLabel = channel === 'all' ? 'DM & Comment' : channel.toUpperCase()

    setScanFeedbackData({
      isOpen: true,
      status: 'loading',
      title: 'Mengevaluasi & Scan Kontradiksi n8n...',
      subtitle: `Memeriksa ${diffInfo.totalChanges} perubahan FAQ (${channelLabel}) sebelum ke Production`,
      feedbackText:
        'Sedang menghubungkan ke n8n dan menunggu eksekusi Workflow selesai... Mohon jangan tutup halaman ini.',
    })

    setSyncStatus({
      type: 'loading',
      message: `Sedang melakukan AI Review & scan kontradiksi di n8n untuk seluruh FAQ (${diffInfo.totalChanges} perubahan terdeteksi)...`,
    })

    try {
      const res = await fetch('/api/assistant/apply-production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'scan',
          channel,
          triggeredBy: 'CMS_GLOBAL_APPLY_BUTTON',
        }),
      })
      const data = await res.json()

      // 0. Jika n8n merespon 'Workflow was started' (Webhook n8n diset 'Respond: Immediately')
      if (data.isImmediately) {
        setScanFeedbackData({
          isOpen: true,
          status: 'info',
          title: data.title || 'Workflow n8n Sedang Berjalan di Background',
          subtitle: data.subtitle || 'Webhook n8n saat ini tersetting ke "Respond: Immediately"',
          feedbackText:
            data.feedbackText ||
            'Workflow n8n telah dipicu dan sedang berjalan di background.',
          rawResponse: data.n8nResponse || data,
        })
        setSyncStatus({
          type: 'loading',
          message:
            'Workflow n8n sedang berjalan di server n8n. Ubah Webhook n8n ke "When Last Node Finishes" agar Payload otomatis menunggu.',
        })
        return
      }

      // 1. Jika terjadi Timeout (BUKAN kontradiksi)
      const isTimeout = Boolean(data.isTimeout || data.error?.includes('Timeout') || res.status === 504)
      if (isTimeout) {
        setScanFeedbackData({
          isOpen: true,
          status: 'error',
          title: 'Waktu Tunggu Eksekusi Habis (Timeout)',
          subtitle: 'Workflow n8n membutuhkan waktu lebih lama untuk memproses AI scan',
          feedbackText:
            data.error ||
            'Workflow n8n membutuhkan waktu lebih dari batas tunggu yang ditentukan.',
          rawResponse: data.n8nResponse || data,
        })
        setSyncStatus({
          type: 'error',
          message: 'Workflow n8n membutuhkan waktu lebih dari batas tunggu (Timeout).',
        })
        return
      }

      // 2. Jika n8n mendeteksi kontradiksi nyata
      if (data.isContradiction) {
        setScanFeedbackData({
          isOpen: true,
          status: 'contradiction',
          title: data.title || 'Ditemukan Kontradiksi pada FAQ',
          subtitle: data.subtitle || 'Data belum dapat disinkronkan ke Production',
          feedbackText:
            data.feedbackText ||
            data.message ||
            'Berdasarkan hasil analisis AI pada alur n8n, ditemukan adanya kontradiksi atau ketidaksesuaian jawaban pada data FAQ. Silakan sesuaikan dan perbaiki pertanyaan atau jawaban di tab Staging terlebih dahulu sebelum disinkronkan ke Production.',
          rawResponse: data.n8nResponse || data,
        })
        setSyncStatus({
          type: 'error',
          message: 'Ditemukan kontradiksi FAQ oleh AI Scanner di n8n! Silakan sesuaikan data.',
        })
        return
      }

      // 2. Jika n8n mendeteksi duplikasi
      if (data.isDuplicate) {
        setScanFeedbackData({
          isOpen: true,
          status: 'duplicate',
          title: 'Terdeteksi Duplikasi oleh n8n',
          subtitle: 'Kategori atau pertanyaan telah terdaftar sebelumnya.',
          feedbackText: data.feedbackText || data.message || 'Ditemukan duplikasi kategori.',
          rawResponse: data.n8nResponse || data,
        })
        setSyncStatus({
          type: 'error',
          message: 'Ditemukan duplikasi kategori pada FAQ oleh n8n!',
        })
        return
      }

      // 3. JIKA TRUE: TIDAK ADA KONTRADIKSI -> TAMPILKAN KONFIRMASI DENGAN TOMBOL YA SINKRON
      if (res.ok && data.success) {
        setScanFeedbackData({
          isOpen: true,
          status: 'confirmation',
          title: data.title || 'Pemeriksaan AI Selesai - Tidak Ada Kontradiksi',
          subtitle: data.subtitle || 'Data FAQ konsisten dan aman untuk diterapkan',
          feedbackText:
            data.feedbackText ||
            `Berdasarkan hasil analisis AI pada alur n8n, seluruh data FAQ telah diperiksa dan tidak ditemukan adanya kontradiksi, duplikasi, atau inkonsistensi jawaban.\n\nApakah kamu yakin ingin menyinkronkan data ini ke Production?`,
          rawResponse: data.n8nResponse || data,
        })
        setSyncStatus({
          type: 'success',
          message: 'Data FAQ valid tanpa kontradiksi. Menunggu konfirmasi untuk sinkron ke Production.',
        })
      } else {
        // 4. Jika error / timeout dari n8n / server (BUKAN kontradiksi)
        const isTimeout = Boolean(data.isTimeout || data.error?.includes('Timeout') || res.status === 504)
        setScanFeedbackData({
          isOpen: true,
          status: 'error',
          title: isTimeout ? 'Waktu Tunggu Eksekusi Habis (Timeout)' : (data.title || 'Workflow n8n Mengembalikan Error'),
          subtitle: isTimeout
            ? 'Workflow n8n membutuhkan waktu lebih lama untuk memproses AI scan'
            : (data.subtitle || 'Terjadi kendala saat eksekusi n8n atau validasi.'),
          feedbackText:
            data.error ||
            data.feedbackText ||
            data.message ||
            'Gagal menerapkan FAQ ke Production.',
          rawResponse: data.n8nResponse || data,
        })
        setSyncStatus({
          type: 'error',
          message: isTimeout
            ? 'Workflow n8n membutuhkan waktu lebih dari batas tunggu (Timeout).'
            : (data.error || 'Gagal menerapkan FAQ ke Production.'),
        })
      }
    } catch (err: any) {
      setScanFeedbackData({
        isOpen: true,
        status: 'error',
        title: 'Gagal Menghubungi n8n',
        subtitle: 'Koneksi jaringan terputus atau batas waktu tercapai.',
        feedbackText: err?.message || 'Terjadi kesalahan jaringan saat memproses ke n8n.',
        rawResponse: { error: err?.message, stack: err?.stack },
      })
      setSyncStatus({
        type: 'error',
        message: err?.message || 'Terjadi kesalahan saat memproses ke n8n.',
      })
    } finally {
      setIsApplyingGlobal(false)
      setTimeout(() => {
        setSyncStatus((curr) => (curr?.type === 'loading' ? curr : null))
      }, 9000)
    }
  }

  // Konfirmasi Sinkronisasi ke Production setelah verifikasi n8n lolos (true)
  const handleConfirmSync = async () => {
    if (isConfirmingSync) return
    setIsConfirmingSync(true)

    const channel = activeChannel === 'all' ? 'all' : activeChannel
    const channelLabel = channel === 'all' ? 'DM & Comment' : channel.toUpperCase()

    try {
      const res = await fetch('/api/assistant/apply-production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'commit',
          channel,
          triggeredBy: 'CMS_GLOBAL_APPLY_CONFIRMED',
        }),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        // Sinkronkan local state: perbarui production items agar match dengan staging
        setFaqs((prevFaqs) => {
          const targetChannels = channel === 'all' ? ['dm', 'comment'] : [channel]
          const stgItems = prevFaqs.filter(
            (f) => f.environment === 'staging' && targetChannels.includes(f.channel as any),
          )
          const otherProdItems = prevFaqs.filter(
            (f) => f.environment === 'production' && !targetChannels.includes(f.channel as any),
          )
          const nonProdItems = prevFaqs.filter((f) => f.environment !== 'production')

          const newProdItems: FaqItem[] = stgItems.map((stg) => ({
            ...stg,
            id: `prod-${stg.channel}-${stg.uuid || stg.id}`,
            environment: 'production',
          }))

          return [...nonProdItems, ...otherProdItems, ...newProdItems]
        })

        setScanFeedbackData({
          isOpen: true,
          status: 'success',
          title: 'Berhasil Disinkronkan ke Production!',
          subtitle: 'Data Live Production telah diperbarui',
          feedbackText:
            data.feedbackText ||
            `Seluruh data FAQ (${channelLabel}) berhasil disinkronkan ke database Production!`,
          rawResponse: data,
        })
        setSyncStatus({
          type: 'success',
          message:
            data.message ||
            `Berhasil menerapkan seluruh perubahan FAQ (${channelLabel}) ke Live Production!`,
        })
      } else {
        setScanFeedbackData({
          isOpen: true,
          status: 'error',
          title: 'Gagal Menyinkronkan ke Production',
          subtitle: 'Terjadi kendala saat update database',
          feedbackText: data.error || 'Gagal menyimpan perubahan ke database Production.',
          rawResponse: data,
        })
        setSyncStatus({
          type: 'error',
          message: data.error || 'Gagal menerapkan FAQ ke Production.',
        })
      }
    } catch (err: any) {
      setScanFeedbackData({
        isOpen: true,
        status: 'error',
        title: 'Gagal Menyinkronkan ke Production',
        subtitle: 'Koneksi jaringan terputus',
        feedbackText: err?.message || 'Terjadi kesalahan saat menyinkronkan ke Production.',
        rawResponse: { error: err?.message },
      })
    } finally {
      setIsConfirmingSync(false)
    }
  }

  const copyUuid = (uuid: string, e: React.MouseEvent) => {
    e.stopPropagation()
    void navigator.clipboard.writeText(uuid)
    setCopiedUuid(uuid)
    setTimeout(() => setCopiedUuid(null), 1800)
  }

  // Hapus FAQ dari Staging (menggunakan custom modal konfirmasi, tanpa alert bawaan)
  const handleConfirmDelete = async () => {
    if (!faqToDelete || isDeletingUuid) return

    if (!faqToDelete.uuid) {
      setSyncStatus({
        type: 'error',
        message: 'FAQ ini belum memiliki UUID database sehingga tidak dapat dihapus.',
      })
      setFaqToDelete(null)
      return
    }

    const targetItem = faqToDelete
    const targetUuid = targetItem.uuid as string
    const targetChannel = targetItem.channel
    const targetId = targetItem.id

    setIsDeletingUuid(targetUuid)
    try {
      const res = await fetch(
        `/api/assistant/faq?uuid=${encodeURIComponent(targetUuid)}&channel=${targetChannel}`,
        {
          method: 'DELETE',
        },
      )
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menghapus FAQ')
      }

      // PENTING: Hanya hapus item dari Staging! Jangan hapus item dari Production di state faqs!
      setFaqs((prev) =>
        prev.filter((f) => !(f.environment === 'staging' && (f.uuid === targetUuid || f.id === targetId))),
      )

      // Cek apakah item ini pernah ada di Production
      const existedInProd = faqs.some(
        (f) =>
          f.environment === 'production' &&
          (f.uuid === targetUuid ||
            f.question.trim().toLowerCase() === targetItem.question.trim().toLowerCase()),
      )

      setSyncStatus({
        type: 'success',
        message: existedInProd
          ? `FAQ berhasil dihapus dari Staging. Tombol 'Apply ke Production' kini aktif untuk menyelaraskan penghapusan ini ke Live Production.`
          : `FAQ berhasil dihapus dari Staging.`,
      })
      setFaqToDelete(null)
    } catch (err: any) {
      setSyncStatus({
        type: 'error',
        message: err?.message || 'Gagal menghapus FAQ dari Staging.',
      })
    } finally {
      setIsDeletingUuid(null)
    }
  }

  // Handler simpan hasil edit / create di Staging
  const handleSaveSuccess = (data: {
    uuid: string
    question: string
    answer: string
    category: string
    channel: string
    isNew: boolean
  }) => {
    const channelVal = (data.channel === 'comment' ? 'comment' : 'dm') as FaqChannel

    if (data.isNew) {
      const newItem: FaqItem = {
        id: `staging-${channelVal}-${data.uuid}`,
        uuid: data.uuid,
        question: data.question,
        answer: data.answer,
        category: data.category,
        channel: channelVal,
        environment: 'staging',
        status: 'active',
        order: 1,
      }
      setFaqs((prev) => [newItem, ...prev])

      // Otomatis aktifkan tab Staging & Channel yang sesuai agar data langsung terlihat
      setActiveEnv('staging')
      setActiveChannel(channelVal)
      setSelectedCategory('all')
      setSearchQuery('')

      const channelLabel = channelVal === 'comment' ? 'Comment (Komentar)' : 'Direct Message (DM)'
      setSyncStatus({
        type: 'success',
        message: `FAQ baru berhasil ditambahkan ke Staging (${channelLabel})! Tampilan otomatis diarahkan ke channel ini dan tombol 'Apply ke Production' kini menyala.`,
      })
    } else {
      setFaqs((prev) =>
        prev.map((f) => {
          if (f.uuid === data.uuid && f.environment === 'staging') {
            return {
              ...f,
              question: data.question,
              answer: data.answer,
              category: data.category,
            }
          }
          return f
        }),
      )
      setSyncStatus({
        type: 'success',
        message: `FAQ berhasil diperbarui di Staging! Perubahan terdeteksi dan tombol 'Apply ke Production' kini aktif.`,
      })
    }
  }

  // Dynamic categories from real database metadata
  const availableCategories = useMemo(() => {
    const set = new Set<string>()
    faqs.forEach((f) => {
      if (f.category) set.add(f.category)
    })
    return Array.from(set).sort()
  }, [faqs])

  // Filtered FAQs based on Environment & Channel + Category & Search
  const filteredFaqs = useMemo(() => {
    return faqs.filter((item) => {
      // 1. Filter Environment
      if (activeEnv !== 'all') {
        if (item.environment !== activeEnv && item.environment !== 'all') return false
      }

      // 2. Filter Channel
      if (activeChannel !== 'all') {
        if (item.channel && item.channel !== activeChannel && item.channel !== 'all') return false
      }

      // 3. Filter Category
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false
      }

      // 4. Search query (Question, Answer, and UUID)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchQuestion = item.question.toLowerCase().includes(q)
        const matchAnswer = item.answer.toLowerCase().includes(q)
        const matchUuid = (item.uuid || '').toLowerCase().includes(q)
        if (!matchQuestion && !matchAnswer && !matchUuid) return false
      }

      return true
    })
  }, [faqs, activeEnv, activeChannel, selectedCategory, searchQuery])

  return (
    <div className="mobis-faq-container" suppressHydrationWarning>
      {/* 1. HEADER (CLEAN & NATIVE) */}
      <div className="mobis-header-bar">
        <div>
          <h1 className="mobis-page-title">Chatbot FAQs</h1>
          <p className="mobis-page-subtitle">
            Kelola knowledge base FAQ asisten MOBIS ({filteredFaqs.length} data ditampilkan
            {diffInfo.hasChanges ? ` • ${diffInfo.totalChanges} perubahan terdeteksi` : ''})
          </p>
        </div>
        <div className="mobis-header-actions">
          {/* SINGLE GLOBAL APPLY TO PRODUCTION BUTTON (HANYA MUNCUL DI STAGING) */}
          {activeEnv === 'staging' && (
            <button
              type="button"
              className={`mobis-btn-apply-global ${diffInfo.hasChanges ? 'is-active' : 'is-disabled'} ${isApplyingGlobal ? 'is-applying' : ''}`}
              onClick={handleApplyGlobal}
              disabled={!diffInfo.hasChanges || isApplyingGlobal}
              title={
                diffInfo.hasChanges
                  ? `Ada ${diffInfo.totalChanges} perubahan di Staging (${diffInfo.newCount} baru, ${diffInfo.modifiedCount} diubah, ${diffInfo.deletedCount} dihapus). Klik untuk Cek Kontradiksi AI terlebih dahulu sebelum konfirmasi ke Production.`
                  : 'Semua FAQ di Staging sudah identik dengan Live Production (tidak ada perubahan untuk di-apply).'
              }
            >
              {isApplyingGlobal ? (
                <>
                  <Loader2 size={15} className="mobis-spin" />
                  <span>Memeriksa Kontradiksi AI...</span>
                </>
              ) : diffInfo.hasChanges ? (
                <>
                  <span className="mobis-apply-glow-dot" />
                  <Rocket size={15} />
                  <span>Cek Kontradiksi &amp; Apply</span>
                  <span className="mobis-changes-badge">{diffInfo.totalChanges} Perubahan</span>
                </>
              ) : (
                <>
                  <Rocket size={15} style={{ opacity: 0.5 }} />
                  <span>Cek Kontradiksi &amp; Apply</span>
                  <span className="mobis-changes-badge is-muted">0</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            className={`mobis-btn-secondary mobis-btn-sync ${isSyncing ? 'is-syncing' : ''}`}
            onClick={handleSyncFaq}
            disabled={isSyncing}
            title="Tarik & sinkronkan FAQ terbaru dari Google Sheet ke Vector DB"
          >
            <RefreshCw size={15} className={isSyncing ? 'mobis-spin' : ''} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Sync dari Sheet'}</span>
          </button>
          <button
            type="button"
            className="mobis-btn-secondary"
            onClick={() => setChatOpen(true)}
          >
            <MessageSquare size={15} />
            <span>Uji Coba Asisten</span>
          </button>
          <button
            type="button"
            className="mobis-btn-primary"
            onClick={() => setIsCreateModalOpen(true)}
            title="Tambah FAQ baru ke Staging"
          >
            <Plus size={16} />
            <span>Tambah FAQ</span>
          </button>
        </div>
      </div>

      {/* SYNC & APPLY NOTIFICATION BANNER */}
      {syncStatus && (
        <div className={`mobis-sync-banner is-${syncStatus.type}`} role="alert">
          {syncStatus.type === 'loading' && (
            <Loader2 size={15} className="mobis-spin" style={{ marginRight: '8px', flexShrink: 0 }} />
          )}
          <span className="mobis-sync-banner-text">{syncStatus.message}</span>
          {syncStatus.type !== 'loading' && (
            <button
              type="button"
              className="mobis-sync-banner-close"
              onClick={() => setSyncStatus(null)}
              aria-label="Tutup notifikasi"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {/* 2. DUAL FILTER: ENVIRONMENT & CHANNEL / SHEET */}
      <EnvironmentTabs
        activeEnv={activeEnv}
        onSelectEnv={setActiveEnv}
        activeChannel={activeChannel}
        onSelectChannel={setActiveChannel}
      />

      {/* 3. SEARCH & CATEGORY FILTER */}
      <div className="mobis-search-toolbar">
        <div className="mobis-search-input-wrap">
          <Search size={16} className="mobis-search-icon" />
          <input
            type="text"
            className="mobis-search-input"
            placeholder="Cari pertanyaan atau jawaban..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="mobis-search-clear"
              onClick={() => setSearchQuery('')}
              title="Hapus pencarian"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="mobis-toolbar-right">
          <select
            className="mobis-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Filter Kategori"
          >
            <option value="all">Semua Kategori ({availableCategories.length})</option>
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat] || cat.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. TABLE */}
      <div className="mobis-table-container">
        {filteredFaqs.length === 0 ? (
          <div className="mobis-empty-state">
            <p className="mobis-empty-title">Tidak ada FAQ yang ditemukan</p>
            <p className="mobis-empty-desc">
              Coba ganti filter Environment, Channel, atau kata kunci pencarian.
            </p>
            <button
              type="button"
              className="mobis-btn-secondary"
              onClick={() => {
                setActiveEnv('staging')
                setActiveChannel('dm')
                setSelectedCategory('all')
                setSearchQuery('')
              }}
            >
              Reset Filter ke Default (Staging &amp; DM)
            </button>
          </div>
        ) : (
          <table className="mobis-data-table" suppressHydrationWarning>
            <thead>
              <tr>
                <th style={{ width: '44px', textAlign: 'center' }}>#</th>
                <th style={{ width: '135px' }}>UUID</th>
                <th style={{ minWidth: '260px' }}>Pertanyaan</th>
                <th style={{ minWidth: '360px' }}>Jawaban</th>
                <th style={{ width: '130px', textAlign: 'center' }}>Kategori</th>
                <th style={{ width: activeEnv === 'production' ? '70px' : '110px', textAlign: 'center' }}>
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredFaqs.map((item, idx) => (
                <tr key={item.id} className="mobis-table-row">
                  <td style={{ textAlign: 'center', opacity: 0.5 }}>{idx + 1}</td>
                  <td>
                    <div className="mobis-uuid-cell" title={item.uuid ? `UUID: ${item.uuid}` : 'Belum ada UUID'}>
                      <code className="mobis-uuid-tag">
                        {item.uuid ? `${item.uuid.slice(0, 8)}...` : '-'}
                      </code>
                      {item.uuid && (
                        <button
                          type="button"
                          className="mobis-copy-inline-btn"
                          onClick={(e) => copyUuid(item.uuid!, e)}
                          title="Salin UUID lengkap"
                        >
                          {copiedUuid === item.uuid ? (
                            <Check size={12} color="#10b981" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                  <td>
                    <div
                      className="mobis-question-cell"
                      onClick={() => setActiveModalFaq(item)}
                      title="Klik untuk melihat detail"
                    >
                      {item.environment === 'staging' && diffInfo.diffMap.has(item.uuid || String(item.id)) && (
                        <span
                          className={`mobis-diff-pill is-${diffInfo.diffMap.get(item.uuid || String(item.id))}`}
                          title={
                            diffInfo.diffMap.get(item.uuid || String(item.id)) === 'new'
                              ? 'FAQ Baru di Staging (belum ada di Production)'
                              : 'FAQ Diubah di Staging (berbeda dari Production)'
                          }
                        >
                          {diffInfo.diffMap.get(item.uuid || String(item.id)) === 'new' ? 'Baru' : 'Berubah'}
                        </span>
                      )}
                      <span>{item.question}</span>
                    </div>
                  </td>
                  <td>
                    <div
                      className="mobis-answer-cell"
                      onClick={() => setActiveModalFaq(item)}
                      title="Klik untuk melihat detail"
                    >
                      {item.answer}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="mobis-category-badge">
                      {CATEGORY_LABELS[item.category] || String(item.category).replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>
                    <div className="mobis-actions-group">
                      {/* DETAIL: Ada di Staging maupun Production */}
                      <button
                        type="button"
                        className="mobis-action-btn"
                        onClick={() => setActiveModalFaq(item)}
                        title="Lihat Detail FAQ"
                      >
                        <Eye size={15} />
                      </button>

                      {/* STAGING ONLY: EDIT & DELETE */}
                      {item.environment === 'staging' && (
                        <>
                          <button
                            type="button"
                            className="mobis-action-btn mobis-action-btn-edit"
                            onClick={() => setActiveEditFaq(item)}
                            title="Edit FAQ di Staging"
                          >
                            <Pencil size={14} />
                          </button>

                          <button
                            type="button"
                            className="mobis-action-btn mobis-action-btn-danger"
                            onClick={() => setFaqToDelete(item)}
                            disabled={isDeletingUuid === item.uuid}
                            title="Hapus FAQ dari Staging"
                          >
                            {isDeletingUuid === item.uuid ? (
                              <Loader2 size={13} className="mobis-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 5. MODAL DETAIL FAQ */}
      <FaqDetailModal
        faq={activeModalFaq}
        onClose={() => setActiveModalFaq(null)}
      />

      {/* 6. MODAL EDIT FAQ (STAGING) */}
      <FaqEditModal
        isOpen={Boolean(activeEditFaq)}
        faq={activeEditFaq}
        defaultChannel={activeChannel === 'all' ? 'dm' : activeChannel}
        onClose={() => setActiveEditFaq(null)}
        onSaveSuccess={handleSaveSuccess}
      />

      {/* 7. MODAL TAMBAH FAQ (STAGING) */}
      <FaqEditModal
        isOpen={isCreateModalOpen}
        faq={null}
        defaultChannel={activeChannel === 'all' ? 'dm' : activeChannel}
        onClose={() => setIsCreateModalOpen(false)}
        onSaveSuccess={handleSaveSuccess}
      />

      {/* 8. CHATBOT WIDGET */}
      <ChatbotFab
        isOpen={chatOpen}
        onToggle={setChatOpen}
      />

      {/* 9. MODAL FEEDBACK SCAN AI (KONTRADIKSI / HASIL N8N) */}
      <ScanFeedbackModal
        data={scanFeedbackData}
        onClose={() => setScanFeedbackData(null)}
        onConfirmSync={handleConfirmSync}
        isConfirmingSync={isConfirmingSync}
      />

      {/* 10. MODAL KONFIRMASI HAPUS FAQ (STAGING) */}
      {faqToDelete && (
        <div
          className="mobis-modal-backdrop"
          onClick={() => !isDeletingUuid && setFaqToDelete(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="mobis-modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '520px' }}
          >
            <div className="mobis-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ef4444',
                    flexShrink: 0,
                  }}
                >
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className="mobis-modal-title" style={{ fontSize: '1.1rem' }}>
                    Hapus FAQ dari Staging
                  </h3>
                  <span className="mobis-modal-subtitle">
                    Data akan dihapus dari tabel Staging ({faqToDelete.channel.toUpperCase()})
                  </span>
                </div>
              </div>
              {!isDeletingUuid && (
                <button
                  type="button"
                  className="mobis-modal-close"
                  onClick={() => setFaqToDelete(null)}
                  aria-label="Tutup"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <div className="mobis-modal-body" style={{ gap: '1rem' }}>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.88rem',
                  color: 'var(--theme-text)',
                  lineHeight: 1.5,
                }}
              >
                Apakah Anda yakin ingin menghapus data FAQ ini dari <strong>Staging</strong>?
              </p>

              <div
                style={{
                  background: 'var(--theme-elevation-100)',
                  border: '1px solid var(--theme-elevation-200)',
                  borderRadius: '8px',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.75rem',
                    opacity: 0.7,
                  }}
                >
                  <span style={{ textTransform: 'uppercase', fontWeight: 700 }}>
                    {faqToDelete.channel === 'comment' ? 'Comment' : 'Direct Message (DM)'}
                  </span>
                  <span>•</span>
                  <span>{faqToDelete.category}</span>
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--theme-text)' }}>
                  "{faqToDelete.question}"
                </div>
                <div
                  style={{
                    fontSize: '0.82rem',
                    opacity: 0.8,
                    color: 'var(--theme-text)',
                    lineHeight: 1.4,
                  }}
                >
                  {faqToDelete.answer.length > 120
                    ? `${faqToDelete.answer.slice(0, 120)}...`
                    : faqToDelete.answer}
                </div>
              </div>

              <div
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: '6px',
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  fontSize: '0.82rem',
                  color: '#f59e0b',
                  lineHeight: 1.45,
                }}
              >
                <strong>Catatan:</strong> Setelah dihapus dari Staging, tombol{' '}
                <strong>"Apply ke Production"</strong> akan aktif untuk menyelaraskan penghapusan ini
                ke Live Production.
              </div>
            </div>

            <div className="mobis-modal-footer">
              <button
                type="button"
                className="mobis-btn-secondary"
                onClick={() => setFaqToDelete(null)}
                disabled={Boolean(isDeletingUuid)}
              >
                Batal
              </button>
              <button
                type="button"
                className="mobis-btn-primary"
                onClick={handleConfirmDelete}
                disabled={Boolean(isDeletingUuid)}
                style={{
                  background: '#ef4444',
                  borderColor: '#ef4444',
                  color: '#ffffff',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {isDeletingUuid ? (
                  <>
                    <Loader2 size={14} className="mobis-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Hapus FAQ</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
