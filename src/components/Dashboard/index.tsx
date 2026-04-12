import type { AdminViewServerProps } from 'payload'

import BeforeDashboard from '../BeforeDashboard'
import RecentRegistrationsPanel from './RecentRegistrationsPanel'
import VoucherPromo from '../VoucherPromo'
import './index.scss'

export default async function DashboardView({}: AdminViewServerProps) {
  return (
    <div className="mobis-admin-dashboard">
      <BeforeDashboard />
      <VoucherPromo />
      <RecentRegistrationsPanel />
    </div>
  )
}
