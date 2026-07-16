import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

// Tiny module-level store so the avatar updates everywhere the moment
// it's uploaded — no page reload, no prop drilling through Navbar.
let cache = null
const listeners = new Set()

export function broadcastProfile(next) {
  cache = typeof next === 'function' ? next(cache) : next
  listeners.forEach(fn => fn(cache))
}

export function useProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(cache)

  useEffect(() => {
    listeners.add(setProfile)
    return () => { listeners.delete(setProfile) }
  }, [])

  useEffect(() => {
    if (!user) { broadcastProfile(null); return }
    if (cache?.user_id === user.id) { setProfile(cache); return }

    let cancelled = false
    supabase
      .from('Users')
      .select('*')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => { if (!cancelled && data) broadcastProfile(data) })

    return () => { cancelled = true }
  }, [user?.id])

  return { profile, setProfile: broadcastProfile }
}