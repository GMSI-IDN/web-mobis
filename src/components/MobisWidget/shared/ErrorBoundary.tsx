'use client'

import React from 'react'

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; message?: string }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(err: any) {
    return { hasError: true, message: err?.message || String(err) }
  }

  componentDidCatch(error: any, info: any) {
    // biar kelihatan di console
    console.error('[MobisWidget ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="alert alert-danger m-3" role="alert" style={{ pointerEvents: 'auto' }}>
            <div className="fw-bold">MobisWidget crashed</div>
            <div className="small">{this.state.message}</div>
          </div>
        )
      )
    }
    return this.props.children
  }
}
