'use client'

import React from 'react'

import RecentRegistrationsPanel from './RecentRegistrationsPanel'
import VoucherPromo from '../VoucherPromo'

type BoundaryProps = {
  children: React.ReactNode
  title: string
}

type BoundaryState = {
  hasError: boolean
  message: string
}

class DashboardPanelBoundary extends React.Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = {
    hasError: false,
    message: '',
  }

  static getDerivedStateFromError(error: unknown): BoundaryState {
    const message = error instanceof Error ? error.message : 'Terjadi error saat memuat panel.'
    return { hasError: true, message }
  }

  componentDidCatch(error: unknown) {
    console.error(`[Dashboard Panel Error] ${this.props.title}`, error)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <section className="mobis-admin-dashboard__panel">
        <div className="mobis-admin-dashboard__alert">
          <strong>{this.props.title} gagal dimuat.</strong>
          <div>{this.state.message || 'Silakan refresh halaman atau cek log aplikasi.'}</div>
        </div>
      </section>
    )
  }
}

export default function DashboardClientPanels() {
  return (
    <>
      <DashboardPanelBoundary title="Voucher Promo">
        <VoucherPromo />
      </DashboardPanelBoundary>

      <DashboardPanelBoundary title="Pendaftar Terbaru">
        <RecentRegistrationsPanel />
      </DashboardPanelBoundary>
    </>
  )
}
