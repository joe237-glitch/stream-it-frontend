import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

/**
 * Lights — setup lumineux Direction A « Atelier holographique ».
 *
 * - 1 spot warm en hauteur (key light) : donne la profondeur et anime les reflets
 *   métalliques.
 * - 2 point lights latérales (violet + cyan) : signature couleur du moodboard
 *   (Direction A pure, accents 30 % C via le warm).
 * - Ambient bleuté faible (~0.25) : respecte le contraste sans noyer les noirs.
 * - Hémisphère discret pour adoucir le sol.
 *
 * Les point lights oscillent légèrement (~5 cm en sinusoïde) pour donner du
 * mouvement aux reflets, sans casser la cohérence cinématique. Sur tier 'light'
 * on désactive la pulsation et on baisse l'intensité du spot.
 */
export default function Lights({ tier = 'full' }) {
  const violetRef = useRef()
  const cyanRef = useRef()

  useFrame((state) => {
    if (tier === 'light') return
    const t = state.clock.elapsedTime
    if (violetRef.current) {
      violetRef.current.position.y = 2.5 + Math.sin(t * 0.6) * 0.1
    }
    if (cyanRef.current) {
      cyanRef.current.position.y = 2.5 + Math.cos(t * 0.7) * 0.1
    }
  })

  const spotIntensity = tier === 'light' ? 0.6 : 1.1

  return (
    <>
      <ambientLight intensity={0.22} color="#1f2540" />
      <hemisphereLight
        args={['#3a2a6b', '#0a0a14', 0.18]}
        position={[0, 5, 0]}
      />

      {/* Key light warm (touche C 30 %) */}
      <spotLight
        position={[0, 6, 4]}
        angle={0.6}
        penumbra={0.7}
        intensity={spotIntensity}
        color="#ffd9a8"
        castShadow={tier === 'full'}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
      />

      {/* Accent violet (gauche) */}
      <pointLight
        ref={violetRef}
        position={[-5, 2.5, 0]}
        intensity={tier === 'light' ? 0.8 : 1.4}
        color="#7c3aed"
        distance={12}
        decay={1.6}
      />

      {/* Accent cyan (droite) */}
      <pointLight
        ref={cyanRef}
        position={[5, 2.5, 0]}
        intensity={tier === 'light' ? 0.8 : 1.4}
        color="#22d3ee"
        distance={12}
        decay={1.6}
      />

      {/* Fill faible derrière la caméra pour éviter les contre-jours sales */}
      <pointLight
        position={[0, 1.5, 6]}
        intensity={0.25}
        color="#a78bfa"
        distance={10}
      />
    </>
  )
}
