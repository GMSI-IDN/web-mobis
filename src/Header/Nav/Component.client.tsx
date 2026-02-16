'use client'

import React, { useId } from 'react'
import Link from 'next/link'

export function NavShellClient({ children }: { children: React.ReactNode }) {
  const collapseId = useId().replace(/:/g, '')

  return (
    <nav className="navbar fixed-top navbar-expand-lg navbar-light bg-light border-bottom w-100">
      <div className="container">
        <Link href="/" className="navbar-brand fw-bold">
          <img src="./mobis/img/favicon.svg" alt="MOBIS" style={{ height: '40px' }} />
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target={`#${collapseId}`}
          aria-controls={collapseId}
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id={collapseId}>
          {children}
        </div>
      </div>
    </nav>
  )
}
