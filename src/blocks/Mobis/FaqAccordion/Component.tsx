'use client'

import React, { useState } from 'react'

type FaqItem = {
  answer?: string
  question?: string
}

type Props = {
  items?: FaqItem[]
  title?: string
}

export const FaqAccordion: React.FC<Props> = ({ title, items }) => {
  const rows = items ?? []
  const [openIndices, setOpenIndices] = useState<Record<number, boolean>>({})

  const toggleIndex = (idx: number) => {
    setOpenIndices((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }))
  }

  if (rows.length === 0) return null

  return (
    <section id="faq" className="faq-mobis-section">
      <div className="container px-3">
        <div className="row justify-content-center">
          <div className="faq-mobis-card-container">
            <h2 className="faq-mobis-title">{title || 'PERTANYAAN UMUM (FAQ)'}</h2>

            <div className="faq-mobis-list">
              {rows.map((item, idx) => {
                const isOpen = !!openIndices[idx]
                const question = item?.question?.trim() || `Pertanyaan ${idx + 1}`
                const answer = item?.answer?.trim() || 'Jawaban akan segera diperbarui.'

                return (
                  <article
                    className={`faq-mobis-item ${isOpen ? 'is-open' : ''}`}
                    key={`faq-${idx}`}
                  >
                    <button
                      aria-controls={`faq-answer-${idx}`}
                      aria-expanded={isOpen}
                      className="faq-mobis-trigger"
                      onClick={() => toggleIndex(idx)}
                      type="button"
                    >
                      <span className="faq-mobis-question">{question}</span>
                      <span className="faq-mobis-icon" aria-hidden="true">
                        <svg
                          className="faq-mobis-icon-svg"
                          viewBox="0 0 32 32"
                          width="32"
                          height="32"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <circle cx="16" cy="16" r="16" fill="#2ea113" />
                          <g className="faq-mobis-symbol-group">
                            <rect x="14.2" y="8" width="3.6" height="16" rx="0.6" fill="white" />
                            <rect x="8" y="14.2" width="16" height="3.6" rx="0.6" fill="white" />
                          </g>
                        </svg>
                      </span>
                    </button>

                    <div className="faq-mobis-answer-wrap" id={`faq-answer-${idx}`}>
                      <div className="faq-mobis-answer-inner">
                        <p className="faq-mobis-answer">{answer}</p>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
