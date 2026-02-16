import React from 'react'
import type { Header as HeaderType } from '@/payload-types'
import { NavComponent } from './Component'

export const HeaderNav: React.FC<{ data: HeaderType }> = ({ data }) => {
  return <NavComponent data={data} />
}
