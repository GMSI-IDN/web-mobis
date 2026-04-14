'use client'

import React, { useEffect, useId, useRef } from 'react'
import Link from 'next/link'

export function NavShellClient({ children }: { children: React.ReactNode }) {
  const collapseId = useId().replace(/:/g, '')
  const collapseRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const collapseEl = collapseRef.current
    if (!collapseEl) return

    const handleClick = async (event: Event) => {
      const target = event.target as HTMLElement | null
      if (!target) return

      const clickedLink = target.closest('a, button')
      if (!clickedLink) return

      if (window.innerWidth >= 992) return

      const bootstrap = await import('bootstrap')
      const collapse =
        bootstrap.Collapse.getInstance(collapseEl) ||
        new bootstrap.Collapse(collapseEl, { toggle: false })

      collapse.hide()
    }

    collapseEl.addEventListener('click', handleClick)

    return () => {
      collapseEl.removeEventListener('click', handleClick)
    }
  }, [])

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

        <div ref={collapseRef} className="collapse navbar-collapse" id={collapseId}>
          {children}
        </div>
      </div>
    </nav>
  )
}
