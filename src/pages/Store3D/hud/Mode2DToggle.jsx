import { useStore3DSession } from '../hooks/useStore3DSession'

/**
 * Mode2DToggle — bouton qui force le passage en mode 2D fallback. Utile pour
 * les utilisateurs qui veulent économiser batterie/données ou qui ont un
 * affichage de mauvaise qualité avec la 3D.
 */
export default function Mode2DToggle() {
  const tier = useStore3DSession((s) => s.tier)
  const force = useStore3DSession((s) => s.forceFallback)
  const toggle = useStore3DSession((s) => s.toggleForceFallback)

  if (tier === 'fallback') return null

  return (
    <button
      type="button"
      className={'store3d-pill' + (force ? ' store3d-pill-strong' : '')}
      onClick={toggle}
      aria-label={force ? 'Repasser en 3D' : 'Passer en mode 2D'}
      title={force ? 'Repasser en 3D' : 'Passer en mode 2D'}
    >
      {force ? '↻ 3D' : '◷ 2D'}
    </button>
  )
}
