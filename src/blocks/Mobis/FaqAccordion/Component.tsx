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
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  if (rows.length === 0) return null

  return (
    <section id="faq" className="faq-mobis-section">
      <div className="container py-4 py-md-5">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-8">
            <h2 className="faq-mobis-title">{title || 'PERTANYAAN UMUM (FAQ)'}</h2>

            <div className="faq-mobis-list">
              {rows.map((item, idx) => {
                const isOpen = openIndex === idx
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
                      onClick={() => setOpenIndex((prev) => (prev === idx ? null : idx))}
                      type="button"
                    >
                      <span className="faq-mobis-question">{question}</span>
                      <span className="faq-mobis-icon" aria-hidden="true">
                        <svg className="faq-mobis-icon-svg" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <g className="faq-mobis-symbol-group">
                            <circle cx="16" cy="16" r="14" fill="#3bac1f" />
                            <path d="M16 9.5V22.5" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
                            <path d="M9.5 16H22.5" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
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
