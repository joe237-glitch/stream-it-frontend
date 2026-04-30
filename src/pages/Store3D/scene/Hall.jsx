import * as THREE from 'three'
import { RoundedBox, Sparkles, Stars, Torus } from '@react-three/drei'

/**
 * Hall V3 — architecture allégée et plus aérée.
 *
 * Changements vs V2 :
 * - SUPPRIMÉS : 4 pylônes verticaux (coupaient la vue des produits)
 * - REMPLACÉE : grosse arche cylindrique → arc lumineux fin (torus segment)
 * - AJOUTÉS : 3 anneaux concentriques au sol (profondeur sans encombrer)
 * - AJOUTÉS : 2 plans verticaux lointains très translucides (suggestion mur)
 *
 * Composition :
 * 1. Sol miroir (rendu via <Floor /> séparé)
 * 2. Podium central : disque sobrement surélevé, point focal caméra
 * 3. Arc d'entrée : Torus segment fin lumineux derrière les stands
 * 4. Anneaux concentriques au sol (3 cercles, accent gradient)
 * 5. Murs lointains suggérés (planes très transparents fog-cohérent)
 * 6. Atmosphère : Stars + Sparkles (full only)
 *
 * Aucune géométrie ne coupe le champ produit. Le hall donne maintenant la
 * profondeur sans bloquer la lecture des cartes.
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

      {/* Halo radial sous podium */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.005, 0]}
        renderOrder={-2}
      >
        <ringGeometry args={[1.8, 5.5, 96]} />
        <meshBasicMaterial
          color="#7c3aed"
          transparent
          opacity={0.05}
          side={THREE.DoubleSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* 3 anneaux concentriques au sol — donnent la profondeur */}
      {[3.5, 6.0, 9.0].map((radius, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.004 - i * 0.001, 0]}
          renderOrder={-3 - i}
        >
          <ringGeometry args={[radius - 0.04, radius, 128]} />
          <meshBasicMaterial
            color={i % 2 ? '#22d3ee' : '#a78bfa'}
            transparent
            opacity={0.18 - i * 0.03}
            side={THREE.DoubleSide}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Arc d'entrée léger (torus segment au lieu d'un cylindre opaque) */}
      <Torus
        args={[7.5, 0.04, 16, 64, Math.PI]}
        position={[0, 4.5, -7]}
        rotation={[0, 0, 0]}
      >
        <meshBasicMaterial
          color="#a78bfa"
          transparent
          opacity={0.85}
          toneMapped={false}
        />
      </Torus>

      {/* Halo cyan sous l'arc */}
      <Torus
        args={[7.2, 0.025, 12, 48, Math.PI]}
        position={[0, 3.0, -7]}
      >
        <meshBasicMaterial
          color="#22d3ee"
          transparent
          opacity={0.55}
          toneMapped={false}
        />
      </Torus>

      {/* 2 plans verticaux lointains (suggérent un fond architectural sans
          le saturer) */}
      {[-9, 9].map((x, i) => (
        <mesh
          key={i}
          position={[x, 3, -8]}
          rotation={[0, x > 0 ? -Math.PI / 6 : Math.PI / 6, 0]}
        >
          <planeGeometry args={[6, 6]} />
          <meshBasicMaterial
            color="#0a0916"
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* Atmosphère : Stars + Sparkles (full only) */}
      {isFull && (
        <>
          <Stars
            radius={45}
            depth={20}
            count={1500}
            factor={3.2}
            saturation={0.45}
            fade
            speed={0.28}
          />
          <Sparkles
            count={70}
            scale={[20, 8, 20]}
            size={2.6}
            speed={0.22}
            opacity={0.55}
            color="#a78bfa"
            position={[0, 2.5, -2]}
          />
          <Sparkles
            count={45}
            scale={[16, 5, 16]}
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
