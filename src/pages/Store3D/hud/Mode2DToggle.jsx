import { Link } from 'react-router-dom'

/**
 * Mode2DToggle — bouton de sortie permanent, toujours visible top-right.
 * Conformément à la directive PM : "Mode classique" toujours accessible,
 * jamais bloquer l'achat rapide.
 */
export default function Mode2DToggle() {
  return (
    <Link
      to="/"
      className="fixed top-4 right-4 z-50 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/15 text-white text-xs font-semibold hover:bg-white/20 transition-colors"
      style={{ boxShadow: '0 6px 18px rgba(0,0,0,0.35)' }}
    >
      <span aria-hidden>↗</span>
      Mode classique
    </Link>
  )
}
