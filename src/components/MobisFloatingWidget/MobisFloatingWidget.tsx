'use client'

import React, { useEffect, useRef, useState } from 'react'
import './mobis-widget.css'

type Active = 'none' | 'register' | 'status' | 'chat'
type ChatState = 'open' | 'minimized'

type ChatMsg = {
  from: 'bot' | 'user'
  text: string
}

export default function MobisFloatingWidget() {
  // ✅ hanya satu yang boleh aktif
  const [active, setActive] = useState<Active>('none')

  // chat internal state (hanya relevan jika active === 'chat')
  const [chatState, setChatState] = useState<ChatState>('open')
  const [chatInput, setChatInput] = useState('')

  // ✅ FIX: typing union bot|user
  const [messages, setMessages] = useState<ChatMsg[]>([
    { from: 'bot', text: 'Halo saya Assistant MOBIS, ada yang bisa saya bantu?' },
  ])

  const chatBodyRef = useRef<HTMLDivElement | null>(null)

  // auto-scroll
  useEffect(() => {
    if (active === 'chat' && chatState === 'open') {
      requestAnimationFrame(() => {
        chatBodyRef.current?.scrollTo({
          top: chatBodyRef.current.scrollHeight,
          behavior: 'smooth',
        })
      })
    }
  }, [active, chatState, messages.length])

  // ✅ function untuk buka widget: otomatis menutup yang lain
  const open = (next: Active) => {
    setActive((prev) => {
      // klik tombol yang sama => toggle close
      if (prev === next) return 'none'
      return next
    })

    // kalau pindah ke chat, reset jadi open (bukan minimized)
    if (next === 'chat') setChatState('open')
  }

  const closeAll = () => setActive('none')

  const sendChat = () => {
    const text = chatInput.trim()
    if (!text) return

    // ✅ FIX: tidak perlu as const
    setMessages((prev) => [...prev, { from: 'user', text }])
    setChatInput('')

    // demo reply
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          from: 'bot',
          text: 'Baik, mohon info area Anda dan kebutuhan (daftar/status/pertanyaan program).',
        },
      ])
    }, 350)
  }

  return (
    <>
      {/* Floating button stack */}
      <div className="mobis-widget">
        <button
          type="button"
          className="mobis-btn mobis-btn--green"
          onClick={() => open('register')}
          aria-label="Daftar Sekarang"
        >
          Daftar Sekarang
        </button>

        <button
          type="button"
          className="mobis-btn mobis-btn--yellow"
          onClick={() => open('status')}
          aria-label="Status Pendaftaran"
        >
          Status Pendaftaran
        </button>

        <button
          type="button"
          className="mobis-btn mobis-btn--green"
          onClick={() => open('chat')}
          aria-label="Hubungi Kami"
        >
          Hubungi Kami
        </button>
      </div>

      {/* ✅ Modal: Register */}
      {active === 'register' && (
        <Modal title="Daftar Program Mobis" onClose={closeAll}>
          <RegisterForm />
        </Modal>
      )}

      {/* ✅ Modal: Status */}
      {active === 'status' && (
        <Modal title="Registration Mobis Check" onClose={closeAll}>
          <StatusForm />
        </Modal>
      )}

      {/* ✅ Floating Chat Panel */}
      {active === 'chat' && (
        <div className={`mobis-chat ${chatState === 'minimized' ? 'is-min' : ''}`}>
          <div className="mobis-chatHeader">
            <div className="mobis-chatTitle">
              Assistants <span className="mobis-chatBrand">MOBIS</span>
            </div>

            <div className="mobis-chatActions">
              <button
                type="button"
                className="mobis-chatBtn"
                onClick={() => setChatState((s) => (s === 'minimized' ? 'open' : 'minimized'))}
                aria-label="Minimize"
                title="Minimize"
              >
                —
              </button>
              <button
                type="button"
                className="mobis-chatBtn"
                onClick={closeAll}
                aria-label="Close"
                title="Close"
              >
                ×
              </button>
            </div>
          </div>

          {chatState === 'open' && (
            <>
              <div className="mobis-chatBody" ref={chatBodyRef}>
                {messages.map((m, i) => (
                  <div key={i} className={`mobis-row ${m.from === 'user' ? 'is-user' : ''}`}>
                    <div className={`mobis-bubble ${m.from === 'user' ? 'is-user' : 'is-bot'}`}>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>

              <form
                className="mobis-chatInputRow"
                onSubmit={(e) => {
                  e.preventDefault()
                  sendChat()
                }}
              >
                <input
                  className="mobis-chatInput"
                  placeholder="Type a message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                />
                <button type="submit" className="mobis-sendBtn" aria-label="Send">
                  ➤
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  )
}

/* =======================
   Modal wrapper
======================= */
function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="mobis-modalOverlay" role="dialog" aria-modal="true">
      <button className="mobis-backdrop" onClick={onClose} aria-label="Backdrop" />
      <div className="mobis-modal">
        <div className="mobis-modalHeader">
          <div className="mobis-modalTitle">{title}</div>
          <button type="button" className="mobis-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="mobis-modalBody">{children}</div>
      </div>
    </div>
  )
}

/* =======================
   Forms (dummy)
======================= */
function RegisterForm() {
  return (
    <form>
      <label className="form-label">Nama</label>
      <input className="form-control mb-3" placeholder="Masukkan nama Anda" required />

      <label className="form-label">Nomor Telepon</label>
      <input className="form-control mb-3" placeholder="Masukkan nomor telepon" required />

      <button className="btn btn-success w-100 py-2" type="submit">
        Daftar Sekarang
      </button>
    </form>
  )
}

function StatusForm() {
  const [nik, setNik] = useState('')
  const isSubmitDisabled = !nik.trim()

  return (
    <form>
      <label className="form-label">NIK</label>
      <input
        className="form-control mb-3"
        placeholder="Masukan NIK"
        required
        value={nik}
        onChange={(e) => setNik(e.target.value)}
      />

      <button className="btn btn-success w-100 py-2" type="submit" disabled={isSubmitDisabled}>
        Check Status
      </button>
    </form>
  )
}
