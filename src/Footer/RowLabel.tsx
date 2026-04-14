'use client'

import type { Footer } from '@/payload-types'
import { RowLabelProps, useRowLabel } from '@payloadcms/ui'

export const RowLabel: React.FC<RowLabelProps> = () => {
  const data = useRowLabel<NonNullable<Footer['socials']>[number]>()

  const label = data?.data?.icon
    ? `Social ${data.rowNumber !== undefined ? data.rowNumber + 1 : ''}: ${data.data.icon}`
    : 'Row'

  return <div>{label}</div>
}
