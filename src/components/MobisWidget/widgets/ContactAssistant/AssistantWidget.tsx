'use client'

import React, { useEffect, useRef, useState } from 'react'
import Portal from '../../shared/Portal'
import { bsModalHide, bsModalShow } from '../../shared/bootstrapModal'
import { postJSON } from '../../shared/fetcher'
import { linkifyText } from '../../shared/linkify'
import { clampPhone, uid, isNoMessage, isThankYouMessage } from '../../shared/helpers'
import { inter } from '@/app/(frontend)/fonts'
import { sanitizeHtml } from '../../shared/sanitize'
import type { ChatMsg, ChatResponse } from './types'

export default function AssistantWidget({
  title,
  brandText,
  greeting,
  apiBase,
  isOpen,
  onCloseToButtons,
}: {
  title: string
  brandText: string
  greeting: string
  apiBase: string
  isOpen: boolean
  onCloseToButtons: () => void
}) {
  const [stage, setStage] = useState<'register' | 'chat'>('register')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [token, setToken] = useState('')

  const [messages, setMessages] = useState<ChatMsg[]>([{ id: uid(), role: 'bot', text: greeting }])
  const [input, setInput] = useState('')

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const endConfirmModalRef = useRef<HTMLDivElement | null>(null)
  const ratingModalRef = useRef<HTMLDivElement | null>(null)

  const [rating, setRating] = useState(0)
  const [review, setReview] = useState('')
  const [ratingLoading, setRatingLoading] = useState(false)

  useEffect(() => {
    if (!scrollRef.current) return
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages.length, isOpen, stage])

  // reset state saat widget ditutup, supaya ketika dibuka lagi fresh
  useEffect(() => {
    if (isOpen) return
    setStage('register')
    setName('')
    setPhone('')
    setToken('')
    setMessages([{ id: uid(), role: 'bot', text: greeting }])
    setInput('')
    setRating(0)
    setReview('')
  }, [isOpen, greeting])

  const canStart = name.trim().length >= 2 && phone.trim().length >= 8

  function closeWidgetHard() {
    // close modal jika masih kebuka
    bsModalHide(endConfirmModalRef.current)
    bsModalHide(ratingModalRef.current)
    onCloseToButtons()
  }

  function addLoading() {
    const id = uid()
    setMessages((prev) => [...prev, { id, role: 'loading' }])
    return id
  }

  function replaceLoading(id: string, text: string) {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, role: 'bot', text } : m)))
  }

  async function startChat() {
    setStage('chat')
  }

  async function send() {
    const text = input.trim()
    if (!text) return

    setInput('')
    setMessages((prev) => [...prev, { id: uid(), role: 'user', text }])

    const loadingId = addLoading()

    try {
      // shortcut rules
      if (isThankYouMessage(text)) {
        replaceLoading(loadingId, 'Sama-sama, ada lagi yang bisa saya bantu?')
        return
      }
      if (isNoMessage(text)) {
        replaceLoading(loadingId, 'Baik kalau begitu, saya ijin akhiri chat ini. Terimakasih :)')
        setTimeout(() => bsModalShow(ratingModalRef.current), 600)
        return
      }

      const headers = token ? { Authorization: token } : undefined
      const res = await postJSON<ChatResponse>(
        apiBase,
        { query: text, username: name, phoneNumber: phone },
        headers,
      )

      if (!token && res?.token) setToken(res.token)

      replaceLoading(
        loadingId,
        res?.answer || 'Mohon maaf, asisten sedang sibuk. Silakan coba kembali.',
      )
    } catch {
      replaceLoading(loadingId, 'Gagal mengirim pesan. Silakan coba lagi.')
    }
  }

  async function submitRating() {
    if (rating <= 0) return
    setRatingLoading(true)

    try {
      const headers = token ? { Authorization: token } : undefined
      await postJSON(
        `${apiBase}/rating`,
        { rating, review: review.trim(), username: name, phoneNumber: phone },
        headers,
      )
    } catch {
      // no block UX
    } finally {
      setRatingLoading(false)
      bsModalHide(ratingModalRef.current)
      closeWidgetHard()
    }
  }

  if (!isOpen) return null

  return (
    <Portal>
      {/* <div className="mobis-chat-portal"> */}
      <div className={`${inter.className} ${inter.variable} mobis-chat-portal`}>
        {/* CHAT BOX */}
        <div className="bg-white mobis-chatbox border">
          <div className="d-flex align-items-center justify-content-between p-3 border-bottom">
            <div className="d-flex align-items-center gap-2">
              <h5 className="mb-0">{title}</h5>
              <span className="fw-bold text-success">{brandText}</span>
            </div>
            <div className="d-flex gap-2">
              {/* minimize */}
              <button className="btn btn-light btn-sm" type="button" onClick={onCloseToButtons}>
                —
              </button>
              {/* close -> confirm */}
              <button
                className="btn btn-light btn-sm"
                type="button"
                onClick={async () => {
                  await bsModalShow(endConfirmModalRef.current)
                }}
              >
                ×
              </button>
            </div>
          </div>

          {stage === 'register' ? (
            <div className="p-3">
              <div className="mb-3">
                <label className="form-label">Nama</label>
                <input
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masukkan nama Anda"
                  autoFocus
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Nomor Telepon</label>
                <input
                  className="form-control"
                  value={phone}
                  onChange={(e) => setPhone(clampPhone(e.target.value))}
                  placeholder="Masukkan nomor telepon"
                  inputMode="tel"
                />
              </div>

              <button
                className="btn btn-success w-100"
                type="button"
                disabled={!canStart}
                onClick={startChat}
              >
                Mulai Chat
              </button>
            </div>
          ) : (
            <div className="p-3 d-flex flex-column h-100">
              <div ref={scrollRef} className="mobis-chat-scroll d-flex flex-column gap-2">
                {messages.map((m) => {
                  if (m.role === 'loading') {
                    return (
                      <div key={m.id} className="p-2 mobis-bubble-bot align-self-start">
                        <div className="mobis-dots">
                          <span />
                          <span />
                          <span />
                        </div>
                      </div>
                    )
                  }

                  if (m.role === 'user') {
                    return (
                      <div
                        key={m.id}
                        className="p-2 mobis-bubble-user align-self-end"
                        style={{ maxWidth: '85%' }}
                      >
                        {m.text}
                      </div>
                    )
                  }

                  // const safe = sanitizeHtml(String(m.text ?? ''))
                  // return (
                  //   <div
                  //     key={m.id}
                  //     className="p-2 mobis-bubble-bot align-self-start"
                  //     style={{ maxWidth: '85%' }}
                  //     dangerouslySetInnerHTML={{ __html: safe }}
                  //   />
                  // )
                  return (
                    <div
                      key={m.id}
                      className="p-2 mobis-bubble-bot align-self-start"
                      style={{ maxWidth: '85%' }}
                    >
                      {linkifyText(String(m.text ?? ''))}
                    </div>
                  )
                })}
              </div>

              <div className="d-flex gap-2 mt-3">
                <input
                  className="form-control"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') send()
                  }}
                />
                <button className="btn btn-success" type="button" onClick={send}>
                  <i className="bi-regular bi-send-fill" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CONFIRM END MODAL */}
        <div className="modal fade" tabIndex={-1} ref={endConfirmModalRef}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body text-center py-4">
                <p className="mb-4">Apakah Anda yakin ingin mengakhiri chat ini?</p>
                <div className="d-flex justify-content-center gap-3">
                  <button
                    className="btn btn-success px-4"
                    type="button"
                    onClick={() => {
                      bsModalHide(endConfirmModalRef.current)
                      bsModalShow(ratingModalRef.current)
                    }}
                  >
                    Yes
                  </button>
                  <button
                    className="btn btn-outline-success px-4"
                    type="button"
                    onClick={() => bsModalHide(endConfirmModalRef.current)}
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RATING MODAL */}
        <div className="modal fade" tabIndex={-1} ref={ratingModalRef}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body text-center py-4">
                <p className="mb-3">Berikan rating Anda</p>

                <div className="d-flex justify-content-center gap-2 mb-3">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      className="btn btn-link p-0"
                      style={{
                        fontSize: 28,
                        textDecoration: 'none',
                        color: n <= rating ? '#FFD700' : '#999',
                      }}
                      onClick={() => setRating(n)}
                    >
                      ★
                    </button>
                  ))}
                </div>

                <textarea
                  className="form-control mb-3"
                  placeholder="Berikan ulasan Anda (opsional)"
                  rows={3}
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                />

                <button
                  className="btn btn-success px-5"
                  type="button"
                  disabled={rating <= 0 || ratingLoading}
                  onClick={submitRating}
                >
                  {ratingLoading ? 'Mengirim...' : 'Kirim'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  )
}
