import { useEffect } from 'react'

const DEFAULT_TITLE = 'Stream-It - Abonnements digitaux premium'
const DEFAULT_DESC  = 'Netflix, Spotify, Disney+ et plus - payez via Mobile Money'

export default function SEO({ title, description }) {
  useEffect(() => {
    document.title = title ? `${title} | Stream-It` : DEFAULT_TITLE

    const desc = description || DEFAULT_DESC
    let meta = document.querySelector('meta[name="description"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'description')
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', desc)

    return () => {
      document.title = DEFAULT_TITLE
    }
  }, [title, description])

  return null
}
