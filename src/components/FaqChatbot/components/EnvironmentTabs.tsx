'use client'

import React from 'react'
import type { FaqChannel, FaqEnvironment } from '../types'

export default function EnvironmentTabs({
  activeEnv,
  onSelectEnv,
  activeChannel,
  onSelectChannel,
}: {
  activeEnv: FaqEnvironment
  onSelectEnv: (env: FaqEnvironment) => void
  activeChannel: FaqChannel
  onSelectChannel: (channel: FaqChannel) => void
}) {
  return (
    <div className="mobis-filter-bar">
      {/* FILTER 1: ENVIRONMENT */}
      <div className="mobis-filter-group">
        <span className="mobis-filter-label">Environment:</span>
        <div className="mobis-pill-tabs">
          <button
            type="button"
            className={`mobis-pill-btn ${activeEnv === 'staging' ? 'is-active' : ''}`}
            onClick={() => onSelectEnv('staging')}
          >
            Staging
          </button>
          <button
            type="button"
            className={`mobis-pill-btn ${activeEnv === 'production' ? 'is-active' : ''}`}
            onClick={() => onSelectEnv('production')}
          >
            Production
          </button>
          <button
            type="button"
            className={`mobis-pill-btn ${activeEnv === 'all' ? 'is-active' : ''}`}
            onClick={() => onSelectEnv('all')}
          >
            Semua
          </button>
        </div>
      </div>

      <div className="mobis-filter-divider" />

      {/* FILTER 2: CHANNEL / SHEET */}
      <div className="mobis-filter-group">
        <span className="mobis-filter-label">Channel / Sheet:</span>
        <div className="mobis-pill-tabs">
          <button
            type="button"
            className={`mobis-pill-btn ${activeChannel === 'dm' ? 'is-active' : ''}`}
            onClick={() => onSelectChannel('dm')}
          >
            Direct Message (DM)
          </button>
          <button
            type="button"
            className={`mobis-pill-btn ${activeChannel === 'comment' ? 'is-active' : ''}`}
            onClick={() => onSelectChannel('comment')}
          >
            Comment
          </button>
          <button
            type="button"
            className={`mobis-pill-btn ${activeChannel === 'all' ? 'is-active' : ''}`}
            onClick={() => onSelectChannel('all')}
          >
            Semua
          </button>
        </div>
      </div>
    </div>
  )
}


