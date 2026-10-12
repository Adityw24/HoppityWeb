import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

// Live counters. The DB triggers bump Reels.likes_count / comments_count, and
// Reels is in the realtime publication, so one UPDATE subscription keeps every
// visible card, grid tile and viewer in sync — likes from other users included.
export function useReelLive(onRow) {
  const cb = useRef(onRow)
  cb.current = onRow

  useEffect(() => {
    const ch = supabase
      .channel(`reels-live-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'Reels' }, (p) => {
        const r = p.new
        if (r?.id) cb.current({
          id: r.id,
          likes_count: r.likes_count,
          comments_count: r.comments_count,
          views_count: r.views_count,
        })
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])
}

export const mergeCounts = (list, row) =>
  list.map(r => (r.id === row.id ? { ...r, ...row } : r))