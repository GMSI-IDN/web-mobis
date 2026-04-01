import React from 'react'
import type { Header as HeaderType } from '@/payload-types'
import { HeaderNav } from './Nav'
import { getHeaderCached } from './getHeader'

export async function Header() {
  const data: HeaderType = await getHeaderCached()

  return (
    <header className="w-100">
      <HeaderNav data={data} />
    </header>
  )
}
