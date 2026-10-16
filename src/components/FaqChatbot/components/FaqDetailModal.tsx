'use client'

import React, { useState } from 'react'
import { X, Copy, Check, Rocket } from 'lucide-react'
import type { FaqItem } from '../types'
import { CATEGORY_LABELS } from '../types'

export default function FaqDetailModal({
  faq,
  onClose,
  onApplyProduction,
}: {
  faq: FaqItem | null
  onClose: () => void
  onApplyProduction?: (faq: FaqItem) => void
}) {
  const [copied, setCopied] = useState(false)

  if (!faq) return null

  const handleCopy = () => {
    void navigator.clipboard.writeText(`Pertanyaan:\n${faq.question}\n\nJawaban:\n${faq.answer}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mobis-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="mobis-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="mobis-modal-header">
          <div>
            <h3 className="mobis-modal-title">Detail FAQ</h3>
            <span className="mobis-modal-subtitle">
              {faq.environment.toUpperCase()} &bull;{' '}
              {faq.channel === 'dm' ? 'Direct Message (DM)' : faq.channel === 'comment' ? 'Comment' : 'Semua Channel'}
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

        {/* BODY */}
        <div className="mobis-modal-body">
          {faq.uuid && (
            <div className="mobis-detail-block">
              <span className="mobis-detail-label">Vector UUID (Database ID)</span>
              <div className="mobis-uuid-modal-box">
                <code className="mobis-uuid-modal-code">{faq.uuid}</code>
                <button
                  type="button"
                  className="mobis-uuid-copy-btn"
                  onClick={() => {
                    void navigator.clipboard.writeText(faq.uuid!)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }}
                  title="Salin UUID"
                >
                  <Copy size={13} />
                  <span>Salin UUID</span>
                </button>
              </div>
            </div>
          )}

          <div className="mobis-detail-block">
            <span className="mobis-detail-label">Pertanyaan</span>
            <p className="mobis-detail-question">{faq.question}</p>
          </div>

          <div className="mobis-detail-block">
            <span className="mobis-detail-label">Jawaban (Knowledge Base)</span>
            <div className="mobis-detail-answer">{faq.answer}</div>
          </div>

          <div className="mobis-detail-meta-row">
            <div>
              <span className="mobis-detail-label">Kategori</span>
              <span className="mobis-detail-value">
                {CATEGORY_LABELS[faq.category] || String(faq.category).replace(/_/g, ' ')}
              </span>
            </div>
            <div>
              <span className="mobis-detail-label">Status</span>
              <span className="mobis-detail-value" style={{ textTransform: 'capitalize' }}>
                {faq.status}
              </span>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="mobis-modal-footer">
          {onApplyProduction && faq.environment !== 'production' && (
            <button
              type="button"
              className="mobis-btn-apply"
              onClick={() => {
                onApplyProduction(faq)
                onClose()
              }}
              title="Terapkan FAQ ini dari Staging ke Live Production"
            >
              <Rocket size={14} />
              <span>Apply to Production</span>
            </button>
          )}
          <button
            type="button"
            className="mobis-btn-secondary"
            onClick={handleCopy}
          >
            {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            <span>{copied ? 'Tersalin!' : 'Salin Pertanyaan & Jawaban'}</span>
          </button>
          <button
            type="button"
            className="mobis-btn-primary"
            onClick={onClose}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
