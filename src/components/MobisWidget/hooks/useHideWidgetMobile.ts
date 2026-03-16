'use client'

import { useEffect, useState } from 'react'

export default function useHideWidgetMobile(sectionId: string, mobileMaxWidth = 768) {
  const [hide, setHide] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const check = () => {
      const isMobile = window.innerWidth <= mobileMaxWidth
      if (!isMobile) {
        setHide(false)
        return
      }

      const section = document.getElementById(sectionId)
      if (!section) {
        setHide(false)
        return
      }

      const rect = section.getBoundingClientRect()
      const viewportHeight = window.innerHeight

      /**
       * Widget berada di area bawah layar.
       * Jadi kita hide hanya kalau section form masuk ke area bawah viewport,
       * bukan sekadar terlihat di layar.
       */
      const widgetZoneTop = viewportHeight - 220
      const widgetZoneBottom = viewportHeight

      const overlapsWidgetZone = rect.bottom > widgetZoneTop && rect.top < widgetZoneBottom

      setHide(overlapsWidgetZone)
    }

    check()
    window.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check)

    return () => {
      window.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
    }
  }, [sectionId, mobileMaxWidth])

  return hide
}
