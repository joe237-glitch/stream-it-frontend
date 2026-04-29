import { useMemo } from 'react'
import * as THREE from 'three'
import { Text, RoundedBox } from '@react-three/drei'
import ProductCard3D from './ProductCard3D'
import { productsByCategory } from '../data/mockProducts'

/**
 * CategoryStand — un stand par catégorie (Streaming / IPTV / Gaming+Cartes).
 *
 * Composition :
 * - Plinthe arrondie sombre métallique sous les cartes (RoundedBox 4 × 0.06 × 1.6)
 * - Halo discret au sol (cercle emissive faible avec accent catégorie)
 * - Label catégorie (Text drei) en flottant arrière, lisible mais discret
 * - 3 cartes produits réparties horizontalement
 *
 * Le stand n'est pas cliquable globalement : seule la carte produit l'est.
 * La caméra peut zoomer dessus via CameraRig (focusCategory du store session).
 */
export default function CategoryStand({
  category,
  position = [0, 0, 0],
  onProductClick,
  tier = 'full',
}) {
  const products = useMemo(() => productsByCategory(category.key), [category.key])
  const accent = new THREE.Color(category.accent)

  return (
    <group position={position} rotation={category.rotation || [0, 0, 0]}>
      {/* Plinthe */}
      <RoundedBox
        args={[4.6, 0.08, 1.8]}
        radius={0.08}
        smoothness={4}
        position={[0, 0.04, 0]}
        castShadow={tier === 'full'}
        receiveShadow
      >
        <meshStandardMaterial
          color="#0d0c1c"
          metalness={0.85}
          roughness={0.28}
          emissive={accent}
          emissiveIntensity={0.08}
        />
      </RoundedBox>

      {/* Halo sol */}
      {tier !== 'light' && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.005, 0]}
          renderOrder={-1}
        >
          <ringGeometry args={[1.8, 3.0, 64]} />
          <meshBasicMaterial
            color={accent}
            transparent
            opacity={0.07}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Label catégorie en arrière, lisible mais effacé */}
      <Text
        position={[0, 2.85, -0.6]}
        fontSize={0.32}
        color="#f4f0ff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0}
        material-transparent
        material-opacity={0.85}
      >
        {category.label}
      </Text>
      <Text
        position={[0, 2.45, -0.6]}
        fontSize={0.13}
        color="#9aa0c0"
        anchorX="center"
        anchorY="middle"
        maxWidth={4.5}
        textAlign="center"
      >
        {category.description}
      </Text>

      {/* 3 cartes produits */}
      {products.map((p, idx) => {
        const x = (idx - 1) * 1.6 // -1.6, 0, 1.6
        return (
          <ProductCard3D
            key={p.id}
            product={p}
            position={[x, 1.45, 0]}
            onClick={onProductClick}
            tier={tier}
          />
        )
      })}
    </group>
  )
}
