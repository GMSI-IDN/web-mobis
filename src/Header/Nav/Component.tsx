import React from 'react'
import type { Header as HeaderType } from '@/payload-types'
import { CMSLink } from '@/components/Link'
import { NavShellClient } from './Component.client'

export const NavComponent: React.FC<{ data: HeaderType }> = ({ data }) => {
  const navItems = data?.navItems || []

  return (
    <NavShellClient>
      <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
        {navItems.map(({ link }, i) => (
          <li className="nav-item" key={i}>
            <CMSLink {...link} className="nav-link" appearance="inline" />
          </li>
        ))}
      </ul>
    </NavShellClient>
  )
}
