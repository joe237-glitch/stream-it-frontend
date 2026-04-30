import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

/**
 * Lights V2 — setup cinématique pour Direction A « Atelier holographique ».
 *
 * - Key light spot warm (haut + face) : sculpte les reliefs des cartes
 * - Rim light cyan derrière : sépare les cartes du fond noir profond
 * - Fill violet à gauche, fill cyan à droite : signature couleur du moodboard
 * - Ambient bleuté faible (HDRI gère le reste)
 *
 * Animations :
 * - Fill violet/cyan oscillent en Y (~10 cm) pour faire vivre les reflets
 * - Key spot fait un léger sweep horizontal continu (~0.25 rad) pour donner
 *   de la vie au podium central sans saccade
 *
 * Tier 'light' : oscillations désactivées, intensités réduites, pas d'ombres.
 */
export default function Lights({ tier = 'full' }) {
  const violetRef = useRef()
  const cyanRef = useRef()
  const keyRef = useRef()
  const isFull = tier === 'full'

  useFrame((state) => {
    if (!isFull) return
    const t = state.clock.elapsedTime
    if (violetRef.current) {
      violetRef.current.position.y = 2.6 + Math.sin(t * 0.55) * 0.12
    }
    if (cyanRef.current) {
      cyanRef.current.position.y = 2.6 + Math.cos(t * 0.65) * 0.12
    }
    if (keyRef.current) {
      keyRef.current.position.x = Math.sin(t * 0.18) * 0.4
    }
  })

  const keyIntensity = isFull ? 1.25 : 0.7

  return (
    <>
      <ambientLight intensity={0.18} color="#1a1f3a" />
      <hemisphereLight
        args={['#3a2a6b', '#06060d', 0.16]}
        position={[0, 6, 0]}
      />

      {/* Key light warm — sculpte les volumes */}
      <spotLight
        ref={keyRef}
        position={[0, 6.5, 4]}
        angle={0.55}
        penumbra={0.75}
        intensity={keyIntensity}
        color="#fff1d8"
        castShadow={isFull}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
      />

      {/* Rim light cyan derrière — sépare les cartes du noir profond */}
      <spotLight
        position={[0, 4, -7]}
        angle={0.85}
        penumbra={0.9}
        intensity={isFull ? 0.7 : 0.4}
        color="#22d3ee"
        target-position={[0, 1.5, 0]}
      />

      {/* Fill violet (gauche) */}
      <pointLight
        ref={violetRef}
        position={[-5.5, 2.6, 0]}
        intensity={isFull ? 1.4 : 0.85}
        color="#7c3aed"
        distance={13}
        decay={1.6}
      />

      {/* Fill cyan (droite) */}
      <pointLight
        ref={cyanRef}
        position={[5.5, 2.6, 0]}
        intensity={isFull ? 1.4 : 0.85}
        color="#22d3ee"
        distance={13}
        decay={1.6}
      />

      {/* Fill très faible derrière la caméra (anti contre-jour sale) */}
      <pointLight
        position={[0, 1.6, 6]}
        intensity={0.22}
        color="#a78bfa"
        distance={10}
      />

      {/* Bottom uplight central pour souligner le podium */}
      <pointLight
        position={[0, 0.3, 0]}
        intensity={isFull ? 0.6 : 0.3}
        color="#7c3aed"
        distance={5}
        decay={2}
      />
    </>
  )
}
