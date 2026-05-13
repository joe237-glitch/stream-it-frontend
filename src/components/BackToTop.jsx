import { useEffect, useState } from 'react'

/**
 * BackToTop — floating button that scrolls to the top of the page.
 *
 * Appears once the user has scrolled past one viewport (so it never
 * overlaps content above the fold). Positioned bottom-right with a small
 * offset so it sits below the ChatBot bubble on the same edge.
 */
export default function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Revenir en haut de la page"
      className="fixed bottom-24 right-6 z-40 w-11 h-11 rounded-full bg-indigo-500/90 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 flex items-center justify-center transition-colors"
    >
      <span aria-hidden="true" className="text-lg leading-none">↑</span>
    </button>
  )
}
