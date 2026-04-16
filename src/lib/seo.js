/**
 * Hoppity SEO Helper
 * Updates document title, meta tags, and structured data dynamically.
 * Google now crawls JavaScript-rendered content, so this works for SEO.
 */

const SITE = 'Hoppity'
const BASE_URL = 'https://www.hoppity.in'
const DEFAULT_IMG = `${BASE_URL}/og-image.jpg`

export function setPageSEO({ title, description, canonical, image, type = 'website', jsonLd }) {
  // Title
  document.title = title ? `${title} | ${SITE}` : `${SITE} – Discover Real India`

  // Meta helpers
  const setMeta = (selector, attr, value) => {
    let el = document.querySelector(selector)
    if (!el) {
      el = document.createElement('meta')
      if (selector.includes('name=')) el.setAttribute('name', selector.match(/name="([^"]+)"/)?.[1])
      if (selector.includes('property=')) el.setAttribute('property', selector.match(/property="([^"]+)"/)?.[1])
      document.head.appendChild(el)
    }
    el.setAttribute(attr, value)
  }

  if (description) {
    setMeta('meta[name="description"]', 'content', description)
    setMeta('meta[property="og:description"]', 'content', description)
    setMeta('meta[name="twitter:description"]', 'content', description)
  }

  const ogTitle = title || `${SITE} – Discover Real India`
  setMeta('meta[property="og:title"]', 'content', ogTitle)
  setMeta('meta[name="twitter:title"]', 'content', ogTitle)
  setMeta('meta[property="og:type"]', 'content', type)
  setMeta('meta[property="og:image"]', 'content', image || DEFAULT_IMG)
  setMeta('meta[name="twitter:image"]', 'content', image || DEFAULT_IMG)

  // Canonical
  const url = canonical ? `${BASE_URL}${canonical}` : BASE_URL
  setMeta('meta[property="og:url"]', 'content', url)
  let canonEl = document.querySelector('link[rel="canonical"]')
  if (!canonEl) {
    canonEl = document.createElement('link')
    canonEl.setAttribute('rel', 'canonical')
    document.head.appendChild(canonEl)
  }
  canonEl.setAttribute('href', url)

  // JSON-LD structured data
  if (jsonLd) {
    let ldEl = document.querySelector('script[data-hoppity-ld]')
    if (!ldEl) {
      ldEl = document.createElement('script')
      ldEl.setAttribute('type', 'application/ld+json')
      ldEl.setAttribute('data-hoppity-ld', '1')
      document.head.appendChild(ldEl)
    }
    ldEl.textContent = JSON.stringify(jsonLd)
  }
}

export function buildTourLD({ title, description, url, image, price, location, category, duration }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: title,
    description,
    url: `${BASE_URL}${url}`,
    image: image || DEFAULT_IMG,
    touristType: category,
    itinerary: { '@type': 'ItemList', name: title },
    provider: {
      '@type': 'TravelAgency',
      name: 'Hoppity',
      url: BASE_URL,
    },
    ...(price && {
      offers: {
        '@type': 'Offer',
        price,
        priceCurrency: 'INR',
        availability: 'https://schema.org/InStock',
      }
    }),
    ...(location && {
      touristType: 'https://schema.org/TouristDestination',
      containedInPlace: { '@type': 'Place', name: location },
    }),
    ...(duration && { duration }),
  }
}
