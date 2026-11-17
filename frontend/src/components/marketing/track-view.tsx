'use client'

import { useEffect } from 'react'
import { trackDashboard } from '@/lib/analytics/umami'

/** Fires the analytics section-view event once on mount. Renders nothing. */
export function TrackSectionView({ section, role }: { section: string; role: string }) {
  useEffect(() => {
    trackDashboard.sectionView(section, role)
  }, [section, role])
  return null
}
