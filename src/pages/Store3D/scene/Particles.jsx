import { Sparkles } from '@react-three/drei'

/**
 * Particles — particules subtiles flottant dans le hall pour donner de la
 * profondeur (référence : moodboard P1.V2/V3).
 *
 * - Tier 'full' : 60 sparkles violet, scale 12 m, vitesse lente, taille variable
 * - Tier 'light' : composant non rendu (économie ~ 0.6 ms / frame)
 *
 * Toujours sous le post-process Bloom pour faire ressortir les particules sans
 * en abuser.
 */
export default function Particles({ tier = 'full' }) {
  if (tier !== 'full') return null

  return (
    <>
      <Sparkles
        count={60}
        scale={[14, 6, 14]}
        size={2.2}
        speed={0.25}
        opacity={0.55}
        color="#a78bfa"
        position={[0, 2, -2]}
      />
      <Sparkles
        count={30}
        scale={[10, 4, 10]}
        size={1.4}
        speed={0.18}
        opacity={0.4}
        color="#22d3ee"
        position={[0, 1.5, 0]}
      />
    </>
  )
}
