import { supabase } from './supabase'

// Returns a Set of reel ids the user has saved.
export async function fetchSavedReelIds(userId) {
  if (!userId) return new Set()
  const { data, error } = await supabase
    .from('Reel_Saves')
    .select('reel_id')
    .eq('user_id', userId)
  if (error) throw error
  return new Set((data || []).map(r => r.reel_id))
}

// save = true → add a row, save = false → remove it.
export async function setReelSaved(reelId, userId, save) {
  if (save) {
    const { error } = await supabase
      .from('Reel_Saves')
      .upsert({ user_id: userId, reel_id: reelId }, { onConflict: 'user_id,reel_id', ignoreDuplicates: true })
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('Reel_Saves')
      .delete()
      .eq('user_id', userId)
      .eq('reel_id', reelId)
    if (error) throw error
  }
}