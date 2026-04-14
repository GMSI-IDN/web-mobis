'use client'

import React from 'react'

type ScrollButtonProps = {
  targetId: string
  className?: string
  children: React.ReactNode
  onClick?: () => void
}

export default function ScrollButton({
  targetId,
  className,
  children,
  onClick,
}: ScrollButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()

    onClick?.()

    const cleanTarget = targetId.replace('#', '')
    const element = document.getElementById(cleanTarget)

    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  }

  return (
    <button type="button" className={className} onClick={handleClick}>
      {children}
    </button>
  )
}
