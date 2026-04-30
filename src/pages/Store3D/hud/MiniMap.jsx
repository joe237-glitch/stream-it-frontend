import { useStore3DSession } from '../hooks/useStore3DSession'
import { STORE3D_CATEGORIES } from '../data/mockProducts'

/**
 * MiniMap — vue radar top-right qui matérialise la topologie du hall 3D.
 *
 * 3 cercles colorés représentent les 3 stands, l'utilisateur peut cliquer
 * directement pour focus la caméra. Le focus actif est marqué par un anneau
 * pulsant. La position de la caméra n'est pas représentée pour rester sobre.
 *
 * Cache sur viewport < 600 px (occupé par autres HUD éléments).
 */
export default function MiniMap() {
  const focus = useStore3DSession((s) => s.focusCategory)
  const setFocus = useStore3DSession((s) => s.setFocusCategory)

  // Mapping position 3D → coord SVG (proportionnel)
  // Stands 3D : streaming [-5.4,0,-3.5] | iptv [0,0,-5.5] | gaming [5.4,0,-3.5]
  // SVG box 84×84, centre 42, échelle 4 px / unité monde
  const svgPositions = {
    streaming: { cx: 42 - 5.4 * 4, cy: 42 - (-3.5) * 4 },
    iptv: { cx: 42, cy: 42 - (-5.5) * 4 },
    gaming: { cx: 42 + 5.4 * 4, cy: 42 - (-3.5) * 4 },
  }

  return (
    <div className="store3d-minimap" aria-label="Plan de la boutique 3D">
      <div className="store3d-minimap-label">PLAN</div>
      <svg viewBox="0 0 84 84" width="100%" height="100%">
        {/* Cercle de hall */}
        <circle cx="42" cy="42" r="40" fill="none" stroke="rgba(167,139,250,0.18)" strokeWidth="0.7" />
        <circle cx="42" cy="42" r="28" fill="none" stroke="rgba(167,139,250,0.1)" strokeWidth="0.5" strokeDasharray="2 3" />

        {/* Position viewer (caméra par défaut z≈+6.5 → SVG y=42-6.5*4=16) */}
        <circle cx="42" cy="68" r="2" fill="#a78bfa" opacity="0.7" />
        <text x="42" y="78" textAnchor="middle" fontSize="5" fill="rgba(154,160,192,0.7)">VOUS</text>

        {/* Stands */}
        {STORE3D_CATEGORIES.map((cat) => {
          const pos = svgPositions[cat.key]
          const isActive = focus === cat.key
          return (
            <g key={cat.key}>
              {isActive && (
                <circle
                  cx={pos.cx}
                  cy={pos.cy}
                  r="6"
                  fill="none"
                  stroke={cat.accent}
                  strokeWidth="0.8"
                  opacity="0.6"
                  className="store3d-minimap-pulse"
                />
              )}
              <circle
                cx={pos.cx}
                cy={pos.cy}
                r="3.6"
                fill={cat.accent}
                opacity={isActive ? 1 : 0.78}
                onClick={() => setFocus(cat.key)}
                style={{ cursor: 'pointer' }}
              >
                <title>{cat.label}</title>
              </circle>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
