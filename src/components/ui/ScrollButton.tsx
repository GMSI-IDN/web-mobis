'use client'

type ScrollButtonProps = {
  targetId: string
  children: React.ReactNode
  className?: string
  offsetExtra?: number
}

export default function ScrollButton({
  targetId,
  children,
  className,
  offsetExtra = 16,
}: ScrollButtonProps) {
  const handleClick = () => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        const cleanTargetId = targetId.replace(/^#/, '')
        const el = document.getElementById(cleanTargetId)
        if (!el) return

        const header = document.querySelector('.site-header') as HTMLElement | null
        const adminBar = document.querySelector('.payload-admin-bar') as HTMLElement | null

        const totalOffset =
          (header?.offsetHeight || 0) + (adminBar?.offsetHeight || 0) + offsetExtra

        const top = el.getBoundingClientRect().top + window.scrollY - totalOffset

        window.scrollTo({
          top,
          behavior: 'smooth',
        })

        window.history.replaceState(null, '', `#${cleanTargetId}`)
      }, 50)
    })
  }

  return (
    <button type="button" className={className} onClick={handleClick}>
      {children}
    </button>
  )
}
