import { Float, Text } from '@react-three/drei'

/**
 * Hall — décor central : sol holographique, anneaux concentriques lumineux,
 * et titre "Stream-It" flottant. Direction E (Hub holographique minimaliste)
 * + accents D (touches africaines via couleurs chaudes secondaires).
 */
export default function Hall() {
  return (
    <group>
      {/* Sol disque sombre + grille subtile (mesh standard, peu de drawcalls) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[12, 64]} />
        <meshStandardMaterial color="#0a0a14" metalness={0.5} roughness={0.7} />
      </mesh>

      {/* Anneau central (accent indigo) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[3.4, 3.6, 64]} />
        <meshBasicMaterial color="#6366f1" transparent opacity={0.55} />
      </mesh>

      {/* Anneau extérieur (accent ambre — touche D africaine subtile) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[5.4, 5.55, 64]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.18} />
      </mesh>

      {/* Logo flottant Stream-It */}
      <Float speed={1} rotationIntensity={0.15} floatIntensity={0.45}>
        <Text
          position={[0, 3.2, -2]}
          fontSize={0.95}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.012}
          outlineColor="#a78bfa"
        >
          Stream-It
        </Text>
        <Text
          position={[0, 2.55, -2]}
          fontSize={0.18}
          color="#a78bfa"
          anchorX="center"
          anchorY="middle"
        >
          BOUTIQUE 3D · PROTOTYPE
        </Text>
      </Float>

      {/* Halo lumineux central (sphère semi-transparente) */}
      <mesh position={[0, 1.0, -2]}>
        <sphereGeometry args={[0.55, 32, 32]} />
        <meshBasicMaterial color="#7c3aed" transparent opacity={0.18} />
      </mesh>
    </group>
  )
}
