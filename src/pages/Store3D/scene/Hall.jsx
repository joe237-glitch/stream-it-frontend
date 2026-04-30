import { useMemo } from 'react'
import * as THREE from 'three'
import { Cylinder, RoundedBox, Sparkles, Stars } from '@react-three/drei'

/**
 * Hall V2 — architecture immersive du store.
 *
 * Composition spatiale (référence moodboard P1.V2 + P2.V3) :
 * 1. Sol miroir circulaire (rendu via <Floor /> séparé pour reflexions)
 * 2. Podium central : disque légèrement surélevé qui ancre la vue d'ensemble
 *    et sert de point focal caméra par défaut. Émissive faible violet.
 * 3. Arche courbe en arrière-plan : cylindre semi-ouvert avec inner emissive
 *    qui simule le hall holographique cinematic
 * 4. Pylônes verticaux entre les stands : RoundedBox métal poli avec accent
 *    violet/cyan en gradient vertical (effet "colonne de lumière")
 * 5. Atmosphere : Stars en lointain + Sparkles particules violet/cyan
 * 6. Plafond suggéré par fog dense (pas de mesh ceiling pour économiser draws)
 *
 * Sur tier 'light' : on désactive Stars + Sparkles, on garde podium + arche
 * + 2 pylônes simplifiés. Économie ~ 25-30 % du temps frame.
 */
export default function Hall({ tier = 'full' }) {
  const isFull = tier === 'full'

  return (
    <group>
      {/* Podium central */}
      <RoundedBox
        args={[3.4, 0.18, 3.4]}
        radius={0.08}
        smoothness={4}
        position={[0, 0.09, 0]}
        receiveShadow
      >
        <meshStandardMaterial
          color="#100e22"
          metalness={0.85}
          roughness={0.22}
          emissive="#7c3aed"
          emissiveIntensity={0.07}
        />
      </RoundedBox>

      {/* Halo gradient sous podium (radial subtil) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.005, 0]}
        renderOrder={-2}
      >
        <ringGeometry args={[1.6, 4.5, 64]} />
        <meshBasicMaterial
          color="#7c3aed"
          transparent
          opacity={0.06}
          side={THREE.DoubleSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Arche courbe arrière (demi-cylindre ouvert) */}
      <mesh
        position={[0, 3.2, -7]}
        rotation={[0, 0, 0]}
      >
        <cylinderGeometry args={[8, 8, 6.4, 64, 1, true, -Math.PI / 2.3, Math.PI / 1.15]} />
        <meshStandardMaterial
          color="#0a0916"
          metalness={0.6}
          roughness={0.5}
          side={THREE.BackSide}
          emissive="#22d3ee"
          emissiveIntensity={0.025}
        />
      </mesh>

      {/* Bandeau lumineux interne sur l'arche */}
      <mesh
        position={[0, 4.8, -7]}
        rotation={[0, 0, 0]}
      >
        <cylinderGeometry args={[7.85, 7.85, 0.08, 64, 1, true, -Math.PI / 2.3, Math.PI / 1.15]} />
        <meshBasicMaterial
          color="#a78bfa"
          transparent
          opacity={0.55}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <mesh
        position={[0, 1.6, -7]}
        rotation={[0, 0, 0]}
      >
        <cylinderGeometry args={[7.85, 7.85, 0.05, 64, 1, true, -Math.PI / 2.3, Math.PI / 1.15]} />
        <meshBasicMaterial
          color="#22d3ee"
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>

      {/* Pylônes verticaux entre les stands (4 colonnes) */}
      {[
        [-3.3, 0, -4.5],
        [3.3, 0, -4.5],
        [-7.5, 0, -1.5],
        [7.5, 0, -1.5],
      ].map(([x, , z], i) => (
        <group key={i} position={[x, 0, z]}>
          <Cylinder args={[0.07, 0.1, 5.5, 16]} position={[0, 2.75, 0]} castShadow>
            <meshStandardMaterial
              color="#15122d"
              metalness={0.9}
              roughness={0.25}
            />
          </Cylinder>
          {/* Bandeau lumineux mi-hauteur */}
          <Cylinder args={[0.075, 0.075, 1.2, 16]} position={[0, 2.0, 0]}>
            <meshBasicMaterial
              color={i % 2 ? '#22d3ee' : '#a78bfa'}
              transparent
              opacity={0.85}
              toneMapped={false}
            />
          </Cylinder>
        </group>
      ))}

      {/* Atmosphère : Stars + Sparkles (full tier only) */}
      {isFull && (
        <>
          <Stars
            radius={40}
            depth={20}
            count={1200}
            factor={3}
            saturation={0.4}
            fade
            speed={0.3}
          />
          <Sparkles
            count={80}
            scale={[18, 8, 18]}
            size={2.4}
            speed={0.22}
            opacity={0.55}
            color="#a78bfa"
            position={[0, 2, -2]}
          />
          <Sparkles
            count={40}
            scale={[14, 5, 14]}
            size={1.6}
            speed={0.16}
            opacity={0.45}
            color="#22d3ee"
            position={[0, 1.5, 0]}
          />
        </>
      )}
    </group>
  )
}
