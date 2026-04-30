import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Text, RoundedBox, Cylinder } from '@react-three/drei'
import ProductCard3D from './ProductCard3D'
import { productsByCategory } from '../data/mockProducts'

/**
 * CategoryStand V2 — stand premium par catégorie.
 *
 * Composition :
 * - Plinthe principale `<RoundedBox>` métal poli avec emissive ring inférieur
 * - Socle élargi (plus large) avec décale de 20 cm pour effet "podium étagé"
 * - Halo annulaire animé sous le stand (rotation lente)
 * - 4 micro-pylônes aux coins de la plinthe (effet "balise lumineuse")
 * - Label catégorie + description bien positionnés derrière les cartes
 * - 3 cartes ProductCard3D V2 (transmission glass)
 *
 * Animation : halo annulaire tourne lentement, les micro-pylônes pulsent
 * légèrement (sinusoïde). Tier light désactive halo + pulsations.
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
      ringRef.current.rotation.z = state.clock.elapsedTime * 0.15
    }
  })

  return (
    <group position={position} rotation={category.rotation || [0, 0, 0]}>
      {/* Socle élargi (effet podium étagé) */}
      <RoundedBox
        args={[5.0, 0.06, 2.0]}
        radius={0.04}
        smoothness={4}
        position={[0, 0.03, 0.05]}
        receiveShadow
      >
        <meshStandardMaterial
          color="#0a0916"
          metalness={0.95}
          roughness={0.4}
        />
      </RoundedBox>

      {/* Plinthe principale */}
      <RoundedBox
        args={[4.6, 0.1, 1.7]}
        radius={0.08}
        smoothness={5}
        position={[0, 0.115, 0]}
        castShadow={isFull}
        receiveShadow
      >
        <meshStandardMaterial
          color="#13112a"
          metalness={0.9}
          roughness={0.22}
          emissive={accent}
          emissiveIntensity={0.06}
        />
      </RoundedBox>

      {/* Bandeau emissive sur le pourtour de la plinthe (top edge) */}
      <RoundedBox
        args={[4.6, 0.012, 1.7]}
        radius={0.005}
        smoothness={3}
        position={[0, 0.172, 0]}
      >
        <meshBasicMaterial color={accent} transparent opacity={0.85} toneMapped={false} />
      </RoundedBox>

      {/* Halo annulaire au sol (full only) */}
      {isFull && (
        <mesh
          ref={ringRef}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.006, 0]}
          renderOrder={-1}
        >
          <ringGeometry args={[2.0, 3.4, 96, 1, 0, Math.PI * 1.4]} />
          <meshBasicMaterial
            color={accent}
            transparent
            opacity={0.13}
            side={THREE.DoubleSide}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      )}

      {/* 4 balises lumineuses aux coins */}
      {[
        [-2.2, 0.05, -0.78],
        [2.2, 0.05, -0.78],
        [-2.2, 0.05, 0.78],
        [2.2, 0.05, 0.78],
      ].map(([x, y, z], i) => (
        <Cylinder
          key={i}
          args={[0.025, 0.04, 0.16, 12]}
          position={[x, y + 0.08, z]}
        >
          <meshBasicMaterial color={accent} transparent opacity={0.95} toneMapped={false} />
        </Cylinder>
      ))}

      {/* Label catégorie principal */}
      <Text
        position={[0, 2.95, -0.6]}
        fontSize={0.36}
        color="#f4f0ff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0}
        material-transparent
        material-opacity={0.92}
        letterSpacing={-0.02}
      >
        {category.label}
      </Text>

      {/* Soulignement coloré sous label */}
      <mesh position={[0, 2.74, -0.6]}>
        <planeGeometry args={[1.2, 0.04]} />
        <meshBasicMaterial color={accent} transparent opacity={0.85} toneMapped={false} />
      </mesh>

      {/* Description */}
      <Text
        position={[0, 2.5, -0.6]}
        fontSize={0.118}
        color="#b9bcd6"
        anchorX="center"
        anchorY="middle"
        maxWidth={4.2}
        textAlign="center"
        letterSpacing={-0.01}
      >
        {category.description}
      </Text>

      {/* 3 cartes produits */}
      {products.map((p, idx) => {
        const x = (idx - 1) * 1.65
        return (
          <ProductCard3D
            key={p.id}
            product={p}
            position={[x, 1.5, 0]}
            onClick={onProductClick}
            tier={tier}
          />
        )
      })}
    </group>
  )
}
