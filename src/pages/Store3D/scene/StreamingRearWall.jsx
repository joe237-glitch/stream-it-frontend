import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * StreamingRearWall — wall holographique animé derrière le stand Streaming.
 *
 * Référence moodboard : P3.V2 (top-right) — wall multi-écrans bleu/violet
 * sans rouge cinéma. Ne reproduit pas littéralement les écrans (ça exigerait
 * un GLB) mais simule la profondeur et le mouvement avec un shader léger :
 *
 * - Lignes horizontales animées (scanlines subtiles)
 * - Gradient vertical violet → cyan
 * - Modulation onduleuse par UV pour suggérer "écrans empilés"
 * - Opacité 0.45 pour rester en arrière-plan (les cartes restent prioritaires)
 *
 * Performance : 1 plane + 1 shaderMaterial = ~0.3 ms/frame, négligeable.
 */
const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uAccent;
  varying vec2 vUv;

  float scanline(float y, float speed) {
    float t = uTime * speed;
    return smoothstep(0.92, 0.98, sin((y + t) * 60.0) * 0.5 + 0.5);
  }

  float panels(float x, float y) {
    float gx = step(0.96, sin(x * 12.0) * 0.5 + 0.5);
    float gy = step(0.94, sin(y * 8.0) * 0.5 + 0.5);
    return max(gx, gy) * 0.6;
  }

  void main() {
    vec2 uv = vUv;
    vec3 col = mix(uColorA, uColorB, uv.y);

    // Suggéré "écrans" en grille subtile
    col += panels(uv.x, uv.y) * uAccent * 0.45;

    // Scanlines lentes
    col += scanline(uv.y, 0.12) * uAccent * 0.35;

    // Vignette périphérique pour fondre dans le fog
    float vig = 1.0 - smoothstep(0.3, 0.95, length(uv - 0.5) * 1.4);
    col *= 0.75 + vig * 0.55;

    gl_FragColor = vec4(col, 0.62);
  }
`

export default function StreamingRearWall({ accent }) {
  const matRef = useRef()
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColorA: { value: new THREE.Color('#0a0820') },
      uColorB: { value: new THREE.Color('#1a1240') },
      uAccent: { value: accent || new THREE.Color('#7c3aed') },
    }),
    [accent],
  )

  useFrame((state) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.elapsedTime
    }
  })

  return (
    <mesh position={[0, 1.7, -1.5]} renderOrder={-1}>
      <planeGeometry args={[5.2, 3.4]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={VERT}
        fragmentShader={FRAG}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
