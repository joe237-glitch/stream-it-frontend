import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float, MeshTransmissionMaterial, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

/**
 * IPTVFloatingPanels — écrans holographiques flottants derrière le stand IPTV.
 *
 * Référence moodboard P4.V1 : "lounge violet/cyan avec écrans flottants,
 * lighting cinématique propre, glassmorphism".
 *
 * Implémentation V4 :
 * - 3 panels rectangulaires de tailles différentes (composition asymétrique)
 * - MeshTransmissionMaterial pour vrai verre semi-translucide
 * - Float drei pour mouvement subtil indépendant par panel
 * - Chaque panel a un shader gradient violet→cyan animé en arrière-plan
 *   (suggère contenu sans afficher d'écran spécifique)
 * - Décale en Z pour profondeur (panels à -2.5, -3.5, -4.0)
 *
 * Composition asymétrique :
 *   Panel 1 (gauche, plus grand) : 1.6 × 2.4 — écran "principal"
 *   Panel 2 (droite haut, petit) : 1.0 × 1.2 — écran "secondaire"
 *   Panel 3 (droite bas, moyen)  : 1.2 × 1.6 — écran "secondaire 2"
 *
 * Tier light : panels désactivés (économie ~3 Float + 3 transmission).
 */

const PANELS = [
  // Repositionnés derrière + plus haut pour être visibles au-dessus du stand
  // sans masquer les cartes produits
  { size: [1.4, 2.0], pos: [-2.0, 3.4, -4.5], rot: [0, 0.22, -0.04], delay: 0 },
  { size: [1.0, 1.2], pos: [2.2, 3.8, -4.8], rot: [0, -0.26, 0.02], delay: 0.4 },
  { size: [1.1, 1.5], pos: [1.6, 2.3, -5.6], rot: [0, -0.22, 0], delay: 0.8 },
]

function GradientPanel({ size, accent, delay }) {
  const matRef = useRef()
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAccent: { value: new THREE.Color(accent) },
      uDelay: { value: delay },
    }),
    [accent, delay],
  )

  useFrame((state) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.elapsedTime
    }
  })

  return (
    <mesh position={[0, 0, 0.041]}>
      <planeGeometry args={[size[0] * 0.94, size[1] * 0.94]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float uTime;
          uniform vec3 uAccent;
          uniform float uDelay;
          varying vec2 vUv;

          void main() {
            float t = uTime * 0.18 + uDelay;
            vec3 colA = vec3(0.04, 0.05, 0.16);
            vec3 colB = uAccent * 0.85;
            float wave = sin((vUv.y + t) * 4.0) * 0.5 + 0.5;
            vec3 col = mix(colA, colB, smoothstep(0.0, 1.0, vUv.y * 0.7 + wave * 0.25));

            // scanline subtile
            col += smoothstep(0.95, 1.0, sin((vUv.y - t * 1.2) * 80.0) * 0.5 + 0.5) * uAccent * 0.4;

            // vignette douce
            float vig = 1.0 - smoothstep(0.4, 0.95, length(vUv - 0.5) * 1.4);
            col *= 0.65 + vig * 0.5;

            gl_FragColor = vec4(col, 0.78);
          }
        `}
        transparent
        depthWrite={false}
      />
    </mesh>
  )
}

export default function IPTVFloatingPanels({ accent = '#22d3ee', tier = 'full' }) {
  const isFull = tier === 'full'
  return (
    <group>
      {PANELS.map((p, i) => (
        <Float
          key={i}
          speed={isFull ? 0.7 + i * 0.15 : 0.4}
          rotationIntensity={0.05}
          floatIntensity={0.14}
        >
          <group position={p.pos} rotation={p.rot}>
            {/* Bevel ring métal */}
            <RoundedBox args={[p.size[0] + 0.04, p.size[1] + 0.04, 0.06]} radius={0.03} smoothness={4}>
              <meshStandardMaterial
                color="#1a1530"
                metalness={1}
                roughness={0.18}
                emissive={accent}
                emissiveIntensity={0.4}
              />
            </RoundedBox>
            {/* Glass body translucide */}
            <RoundedBox args={p.size.concat(0.05)} radius={0.02} smoothness={4}>
              {isFull ? (
                <MeshTransmissionMaterial
                  backside={false}
                  samples={4}
                  resolution={128}
                  transmission={0.95}
                  roughness={0.18}
                  thickness={0.3}
                  ior={1.42}
                  chromaticAberration={0.04}
                  color="#0a0820"
                />
              ) : (
                <meshStandardMaterial
                  color="#0a0820"
                  metalness={0.5}
                  roughness={0.25}
                  transparent
                  opacity={0.9}
                />
              )}
            </RoundedBox>
            {/* Gradient shader content (face avant) */}
            <GradientPanel size={p.size} accent={accent} delay={p.delay} />
          </group>
        </Float>
      ))}
    </group>
  )
}
