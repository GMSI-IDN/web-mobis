'use client'

import React, { useState, useEffect } from 'react'
import { X, Save, Plus, Loader2 } from 'lucide-react'
import type { FaqItem, FaqChannel } from '../types'
import { CATEGORY_LABELS } from '../types'

interface FaqEditModalProps {
  isOpen: boolean
  faq: FaqItem | null
  defaultChannel: FaqChannel
  onClose: () => void
  onSaveSuccess: (data: {
    uuid: string
    question: string
    answer: string
    category: string
    channel: string
    isNew: boolean
  }) => void
}

export default function FaqEditModal({
  isOpen,
  faq,
  defaultChannel,
  onClose,
  onSaveSuccess,
}: FaqEditModalProps) {
  const isEditing = Boolean(faq)

  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [category, setCategory] = useState('umum')
  const [channel, setChannel] = useState<'dm' | 'comment'>('dm')
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (faq) {
      setQuestion(faq.question || '')
      setAnswer(faq.answer || '')
      setCategory(faq.category || 'umum')
      setChannel(faq.channel === 'comment' ? 'comment' : 'dm')
    } else {
      setQuestion('')
      setAnswer('')
      setCategory('umum')
      setChannel(defaultChannel === 'comment' ? 'comment' : 'dm')
    }
    setErrorMessage(null)
  }, [faq, defaultChannel, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!question.trim()) {
      setErrorMessage('Pertanyaan tidak boleh kosong.')
      return
    }
    if (!answer.trim()) {
      setErrorMessage('Jawaban tidak boleh kosong.')
      return
    }

    setIsSaving(true)
    setErrorMessage(null)

    try {
      if (isEditing && faq?.uuid) {
        // Edit existing FAQ
        const res = await fetch('/api/assistant/faq', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uuid: faq.uuid,
            channel,
            question: question.trim(),
            answer: answer.trim(),
            category,
          }),
        })

        const data = await res.json()
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Gagal menyimpan perubahan FAQ')
        }

        onSaveSuccess({
          uuid: faq.uuid,
          question: question.trim(),
          answer: answer.trim(),
          category,
          channel,
          isNew: false,
        })
      } else {
        // Create new FAQ
        const res = await fetch('/api/assistant/faq', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channel,
            question: question.trim(),
            answer: answer.trim(),
            category,
          }),
        })

        const data = await res.json()
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Gagal menambahkan FAQ baru')
        }

        onSaveSuccess({
          uuid: data.uuid,
          question: question.trim(),
          answer: answer.trim(),
          category,
          channel,
          isNew: true,
        })
      }

      onClose()
    } catch (err: any) {
      setErrorMessage(err?.message || 'Terjadi kesalahan saat menyimpan data.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="mobis-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="mobis-modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
        {/* HEADER */}
        <div className="mobis-modal-header">
          <div>
            <h3 className="mobis-modal-title">
              {isEditing ? 'Edit FAQ (Staging)' : 'Tambah FAQ Baru (Staging)'}
            </h3>
            <span className="mobis-modal-subtitle">
              Perubahan disimpan ke database Staging dan siap di-apply ke Production
            </span>
          </div>
          <button
            type="button"
            className="mobis-modal-close"
            onClick={onClose}
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        {/* FORM BODY */}
        <form onSubmit={handleSubmit}>
          <div className="mobis-modal-body">
            {errorMessage && (
              <div className="mobis-sync-banner is-error" style={{ marginBottom: '1.25rem' }}>
                <span className="mobis-sync-banner-text">{errorMessage}</span>
              </div>
            )}

            {isEditing && faq?.uuid && (
              <div className="mobis-form-group">
                <label className="mobis-form-label">Vector UUID</label>
                <code className="mobis-form-code-preview">{faq.uuid}</code>
              </div>
            )}

            <div className="mobis-form-row">
              <div className="mobis-form-group" style={{ flex: 1 }}>
                <label className="mobis-form-label" htmlFor="faq-channel">Channel</label>
                <select
                  id="faq-channel"
                  className="mobis-select"
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as 'dm' | 'comment')}
                  disabled={isEditing} // Channel lock on edit to keep table consistent
                >
                  <option value="dm">Direct Message (DM)</option>
                  <option value="comment">Komentar (Comment)</option>
                </select>
              </div>

              <div className="mobis-form-group" style={{ flex: 1 }}>
                <label className="mobis-form-label" htmlFor="faq-category">Kategori</label>
                <select
                  id="faq-category"
                  className="mobis-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                  {/* Fallback if category is not in standard keys */}
                  {!CATEGORY_LABELS[category] && (
                    <option value={category}>{category}</option>
                  )}
                </select>
              </div>
            </div>

            <div className="mobis-form-group">
              <label className="mobis-form-label" htmlFor="faq-question">
                Pertanyaan / Kata Kunci <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                id="faq-question"
                className="mobis-form-textarea"
                rows={3}
                placeholder="Tuliskan variasi pertanyaan atau kata kunci yang sering diajukan pengguna..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                required
              />
            </div>

            <div className="mobis-form-group">
              <label className="mobis-form-label" htmlFor="faq-answer">
                Jawaban (Knowledge Base) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                id="faq-answer"
                className="mobis-form-textarea"
                rows={5}
                placeholder="Tuliskan informasi jawaban lengkap dan akurat yang akan digunakan AI untuk menjawab..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                required
              />
            </div>
          </div>

          {/* FOOTER */}
          <div className="mobis-modal-footer">
            <button
              type="button"
              className="mobis-btn-secondary"
              onClick={onClose}
              disabled={isSaving}
            >
              Batal
            </button>
            <button
              type="submit"
              className="mobis-btn-primary"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 size={15} className="mobis-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : isEditing ? (
                <>
                  <Save size={15} />
                  <span>Simpan Perubahan</span>
                </>
              ) : (
                <>
                  <Plus size={15} />
                  <span>Tambah ke Staging</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
