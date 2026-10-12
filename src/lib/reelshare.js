// Link that opens this reel directly on the Discover page (Discover reads ?reel=)
export const reelUrl = (reel) => `${window.location.origin}/discover?reel=${reel.id}`

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback for older browsers / non-secure contexts
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      return ok
    } catch {
      return false
    }
  }
}

// Native share sheet when available, otherwise copies the link.
// Returns 'shared' | 'copied' | 'cancelled' | 'failed'
export async function shareReel(reel) {
  const url = reelUrl(reel)
  if (navigator.share) {
    try {
      await navigator.share({ title: reel.tour?.title || 'Check out this reel on Hoppity', url })
      return 'shared'
    } catch (e) {
      if (e?.name === 'AbortError') return 'cancelled'
    }
  }
  return (await copyText(url)) ? 'copied' : 'failed'
}