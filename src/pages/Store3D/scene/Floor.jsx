import { MeshReflectorMaterial } from '@react-three/drei'

/**
 * Floor — sol miroir sombre type lobby fintech premium.
 *
 * Implémentation : disque de 30 m de rayon avec MeshReflectorMaterial (drei).
 * Le miroir reprend les couleurs des point lights et des cartes flottantes,
 * ce qui crée la profondeur signature du moodboard sans particules supplémentaires.
 *
 * Sur tier 'light' on dégrade : meshStandardMaterial avec roughness élevée et
 * envMap désactivé pour économiser une RT pass.
 */
export default function Floor({ tier = 'full' }) {
  if (tier === 'light') {
    return (
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        receiveShadow
      >
        <circleGeometry args={[30, 64]} />
        <meshStandardMaterial
          color="#0a0a14"
          metalness={0.4}
          roughness={0.85}
        />
      </mesh>
    )
  }

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.01, 0]}
      receiveShadow
    >
      <circleGeometry args={[30, 96]} />
      <MeshReflectorMaterial
        blur={[300, 80]}
        resolution={1024}
        mixBlur={1.0}
        mixStrength={1.6}
        roughness={0.85}
        depthScale={1.0}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color="#0b0a18"
        metalness={0.55}
        mirror={0.35}
      />
    </mesh>
  )
}
