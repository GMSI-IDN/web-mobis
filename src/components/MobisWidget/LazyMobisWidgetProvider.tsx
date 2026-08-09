'use client'

import dynamic from 'next/dynamic'

const MobisWidgetProvider = dynamic(() => import('./MobisWidgetProvider'), {
  ssr: false,
})

export default MobisWidgetProvider
