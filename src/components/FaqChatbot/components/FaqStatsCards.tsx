'use client'

import React from 'react'
import { Database, HardDrive, Cpu, GitBranch } from 'lucide-react'
import type { FaqItem } from '../types'

export default function FaqStatsCards({ faqs }: { faqs: FaqItem[] }) {
  const total = faqs.length
  const stageDm = faqs.filter((f) => (f.environment === 'staging' || f.environment === 'all') && f.channel === 'dm').length
  const stageComment = faqs.filter((f) => (f.environment === 'staging' || f.environment === 'all') && f.channel === 'comment').length
  const stageTotal = stageDm + stageComment

  const prodDm = faqs.filter((f) => (f.environment === 'production' || f.environment === 'all') && f.channel === 'dm').length
  const prodComment = faqs.filter((f) => (f.environment === 'production' || f.environment === 'all') && f.channel === 'comment').length
  const prodTotal = prodDm + prodComment

  return (
    <div className="mobis-faq-metrics-bar" aria-label="System Metrics">
      <div className="mobis-faq-metric-item">
        <div className="mobis-faq-metric-icon-wrap">
          <Database size={15} />
        </div>
        <div className="mobis-faq-metric-content">
          <span className="mobis-faq-metric-label">Total Vectors</span>
          <div className="mobis-faq-metric-value-row">
            <span className="mobis-faq-metric-value">{total}</span>
            <span className="mobis-faq-metric-sub">records</span>
          </div>
        </div>
      </div>

      <div className="mobis-faq-metric-item">
        <div className="mobis-faq-metric-icon-wrap is-staging">
          <GitBranch size={15} />
        </div>
        <div className="mobis-faq-metric-content">
          <span className="mobis-faq-metric-label">Staging Index</span>
          <div className="mobis-faq-metric-value-row">
            <span className="mobis-faq-metric-value is-staging">{stageTotal}</span>
            <span className="mobis-faq-metric-sub">
              {stageDm} DM &bull; {stageComment} Comment
            </span>
          </div>
        </div>
      </div>

      <div className="mobis-faq-metric-item">
        <div className="mobis-faq-metric-icon-wrap is-prod">
          <HardDrive size={15} />
        </div>
        <div className="mobis-faq-metric-content">
          <span className="mobis-faq-metric-label">Production Index</span>
          <div className="mobis-faq-metric-value-row">
            <span className="mobis-faq-metric-value is-prod">{prodTotal}</span>
            <span className="mobis-faq-metric-sub">
              {prodDm} DM &bull; {prodComment} Comment
            </span>
          </div>
        </div>
      </div>

      <div className="mobis-faq-metric-item">
        <div className="mobis-faq-metric-icon-wrap is-engine">
          <Cpu size={15} />
        </div>
        <div className="mobis-faq-metric-content">
          <span className="mobis-faq-metric-label">Vector Storage</span>
          <div className="mobis-faq-metric-value-row">
            <span className="mobis-faq-metric-value is-code">pgvector</span>
            <span className="mobis-faq-metric-sub">PostgreSQL 18</span>
          </div>
        </div>
      </div>
    </div>
  )
}
