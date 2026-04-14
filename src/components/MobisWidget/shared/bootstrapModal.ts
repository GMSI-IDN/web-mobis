'use client'

import type { Modal as BsModalType } from 'bootstrap'

let BsModal: typeof BsModalType | null = null

async function getBsModal() {
  // load bootstrap bundle sekali (client only)
  if (!BsModal) {
    const mod = await import('bootstrap')
    BsModal = mod.Modal
  }
  return BsModal!
}

export async function bsModalShow(el: HTMLDivElement | null) {
  if (!el) return
  const Modal = await getBsModal()
  const inst = Modal.getOrCreateInstance(el, {
    backdrop: true,
    keyboard: true,
    focus: true,
  })
  inst.show()
}

export async function bsModalHide(el: HTMLDivElement | null) {
  if (!el) return
  const Modal = await getBsModal()
  const inst = Modal.getInstance(el)
  inst?.hide()
}
