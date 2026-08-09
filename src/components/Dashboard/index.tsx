import type { AdminViewServerProps } from 'payload'

import BeforeDashboard from '../BeforeDashboard'
import DashboardClientPanels from './DashboardClientPanels'
import './index.scss'

export default async function DashboardView({}: AdminViewServerProps) {
  return (
    <div className="mobis-admin-dashboard">
      <BeforeDashboard />
      <DashboardClientPanels />
    </div>
  )
}
