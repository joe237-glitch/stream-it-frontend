import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Text, RoundedBox } from '@react-three/drei'
import ProductCard3D from './ProductCard3D'
import StreamingRearWall from './StreamingRearWall'
import IPTVFloatingPanels from './IPTVFloatingPanels'
import { FONT_INTER_BOLD, FONT_INTER_MEDIUM } from './fonts'
import { productsByCategory } from '../data/mockProducts'

/**
 * CategoryStand V3 — plinthe stratifiée 3 couches premium.
 *
 * Composition :
 * 1. Socle base — RoundedBox large métal sombre (couche fond)
 * 2. Socle moyen — RoundedBox plus petit avec emissive accent (couche signature)
 * 3. Plinthe haute — RoundedBox top métal poli (couche cartes)
 * 4. Bandeau lumineux entre couche moyenne et haute (LED accent)
 * 5. Halo annulaire sol animé rotation
 * 6. Label catégorie + barre lumineuse + description
 * 7. Rear-wall optionnel (Streaming uniquement, shader holographique)
 * 8. 3 cartes ProductCard3D V3 biseautées
 *
 * Pas de balises lumineuses aux coins (V2) — épuration visuelle
 * conformément à la directive "ne pas couper le champ produit".
 */
export default function CategoryStand({
  category,
  position = [0, 0, 0],
  onProductClick,
  tier = 'full',
}) {
  const products = useMemo(() => productsByCategory(category.key), [category.key])
  const accent = useMemo(() => new THREE.Color(category.accent), [category.accent])
  const ringRef = useRef()
  const isFull = tier === 'full'

  useFrame((state) => {
    if (!isFull) return
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.elapsedTime * 0.12
    }
  })

  return (
    <group position={position} rotation={category.rotation || [0, 0, 0]}>
      {/* COUCHE 1 : socle base élargi */}
      <RoundedBox
        args={[5.2, 0.05, 2.1]}
        radius={0.04}
        smoothness={4}
        position={[0, 0.025, 0.05]}
        receiveShadow
      >
        <meshStandardMaterial
          color="#08071a"
          metalness={0.95}
          roughness={0.45}
        />
      </RoundedBox>

      {/* COUCHE 2 : socle moyen avec emissive accent */}
      <RoundedBox
        args={[4.85, 0.07, 1.85]}
        radius={0.05}
        smoothness={4}
        position={[0, 0.085, 0.025]}
      >
        <meshStandardMaterial
          color="#0e0d24"
          metalness={0.92}
          roughness={0.32}
          emissive={accent}
          emissiveIntensity={0.18}
        />
      </RoundedBox>

      {/* Bandeau lumineux entre couche 2 et 3 (LED accent fin) */}
      <RoundedBox
        args={[4.85, 0.018, 1.85]}
        radius={0.005}
        smoothness={3}
        position={[0, 0.13, 0.025]}
      >
        <meshBasicMaterial color={accent} transparent opacity={0.95} toneMapped={false} />
      </RoundedBox>

      {/* COUCHE 3 : plinthe haute (où posent les cartes) */}
      <RoundedBox
        args={[4.5, 0.09, 1.65]}
        radius={0.06}
        smoothness={5}
        position={[0, 0.185, 0]}
        castShadow={isFull}
        receiveShadow
      >
        <meshStandardMaterial
          color="#161330"
          metalness={0.9}
          roughness={0.2}
          emissive={accent}
          emissiveIntensity={0.05}
        />
      </RoundedBox>

      {/* Bandeau emissive top edge (effet "rebord lumineux") */}
      <RoundedBox
        args={[4.5, 0.012, 1.65]}
        radius={0.005}
        smoothness={3}
        position={[0, 0.235, 0]}
      >
        <meshBasicMaterial color={accent} transparent opacity={0.85} toneMapped={false} />
      </RoundedBox>

      {/* Halo annulaire sol (rotation lente, full only) */}
      {isFull && (
        <mesh
          ref={ringRef}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.008, 0]}
          renderOrder={-1}
        >
          <ringGeometry args={[2.0, 3.6, 96, 1, 0, Math.PI * 1.4]} />
          <meshBasicMaterial
            color={accent}
            transparent
            opacity={0.14}
            side={THREE.DoubleSide}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      )}

      {/* Label catégorie principal */}
      <Text
        position={[0, 3.05, -0.7]}
        fontSize={0.36}
        color="#f4f0ff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0}
        material-transparent
        material-opacity={0.95}
        letterSpacing={-0.025}
      >
        {category.label}
      </Text>

      {/* Soulignement coloré sous label */}
      <mesh position={[0, 2.84, -0.7]}>
        <planeGeometry args={[1.2, 0.04]} />
        <meshBasicMaterial color={accent} transparent opacity={0.85} toneMapped={false} />
      </mesh>

      {/* Description */}
      <Text
        position={[0, 2.6, -0.7]}
        fontSize={0.118}
        color="#b9bcd6"
        anchorX="center"
        anchorY="middle"
        maxWidth={4.2}
        textAlign="center"
        letterSpacing={-0.005}
      >
        {category.description}
      </Text>

      {/* Rear-wall holographique pour Streaming */}
      {category.key === 'streaming' && isFull && (
        <StreamingRearWall accent={accent} />
      )}

      {/* Écrans flottants pour IPTV (V4) — disponibles en light + full */}
      {category.key === 'iptv' && (
        <IPTVFloatingPanels accent={category.accent} tier={tier} />
      )}

      {/* 3 cartes produits */}
      {products.map((p, idx) => {
        const x = (idx - 1) * 1.7
        return (
          <ProductCard3D
            key={p.id}
            product={p}
            position={[x, 1.55, 0]}
            onClick={onProductClick}
            tier={tier}
          />
        )
      })}
    </group>
  )
}
