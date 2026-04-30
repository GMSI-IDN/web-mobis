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
                  <article className={`faq-mobis-item ${isOpen ? 'is-open' : ''}`} key={`faq-${idx}`}>
                    <button
                      aria-controls={`faq-answer-${idx}`}
                      aria-expanded={isOpen}
                      className="faq-mobis-trigger"
                      onClick={() => setOpenIndex((prev) => (prev === idx ? null : idx))}
                      type="button"
                    >
                      <span className="faq-mobis-question">{question}</span>
                      <span className="faq-mobis-icon" aria-hidden="true">
                        <span className="faq-mobis-symbol" />
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


