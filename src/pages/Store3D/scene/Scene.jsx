import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import {
  AdaptiveDpr,
  AdaptiveEvents,
  Environment,
  PerformanceMonitor,
  Preload,
} from '@react-three/drei'
import { EffectComposer, Bloom, DepthOfField, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'

import { STORE3D_CATEGORIES } from '../data/mockProducts'
import { useStore3DSession } from '../hooks/useStore3DSession'
import Lights from './Lights'
import Floor from './Floor'
import Particles from './Particles'
import CategoryStand from './CategoryStand'
import CameraRig from './CameraRig'

/**
 * Scene — Canvas R3F principal du Stream-It 3D Store.
 *
 * Architecture :
 *   <Canvas>
 *     <fog />
 *     <Environment preset="city" /> (drei) — IBL doux, charge ~150 KB
 *     <Lights tier=... />
 *     <Floor tier=... />
 *     <Particles tier=... />
 *     <CategoryStand /> × 3
 *     <CameraRig />
 *     <EffectComposer> Bloom + DoF + Vignette + ToneMapping ACES (full only) </EffectComposer>
 *     <AdaptiveDpr /> + <AdaptiveEvents /> + <PerformanceMonitor />
 *   </Canvas>
 *
 * PerformanceMonitor : si < 35 fps mesurés sur 200 ms → bascule tier 'light'
 * (désactive Bloom + DoF + Particles + Sparkles + Floor reflector). Utile aussi
 * comme garde-fou si le DeviceProbe a sur-estimé l'appareil.
 */
export default function Scene() {
  const tier = useStore3DSession((s) => s.tier) || 'full'
  const setTier = useStore3DSession((s) => s.setTier)
  const openProduct = useStore3DSession((s) => s.openProduct)

  const isFull = tier === 'full'

  return (
    <Canvas
      shadows={isFull}
      camera={{ position: [0, 1.7, 6.5], fov: 58, near: 0.1, far: 80 }}
      gl={{
        antialias: isFull,
        powerPreference: 'high-performance',
        alpha: false,
        stencil: false,
        toneMapping: THREE.ACESFilmicToneMapping,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      dpr={isFull ? [1, 1.6] : [1, 1.0]}
    >
      <color attach="background" args={['#06060d']} />
      <fog attach="fog" args={['#0a0a14', 6, 28]} />

      <PerformanceMonitor
        bounds={() => [35, 60]}
        flipflops={3}
        onDecline={() => {
          if (tier === 'full') setTier('light')
        }}
      />

      <Suspense fallback={null}>
        <Environment preset="city" background={false} />
        <Lights tier={tier} />
        <Floor tier={tier} />
        <Particles tier={tier} />

        {STORE3D_CATEGORIES.map((cat) => (
          <CategoryStand
            key={cat.key}
            category={cat}
            position={cat.position}
            onProductClick={openProduct}
            tier={tier}
          />
        ))}

        <CameraRig />

        <Preload all />
      </Suspense>

      {isFull && (
        <EffectComposer multisampling={2} disableNormalPass>
          <Bloom
            intensity={0.45}
            luminanceThreshold={0.45}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
          <DepthOfField focusDistance={0.04} focalLength={0.05} bokehScale={1.5} />
          <Vignette eskil={false} offset={0.15} darkness={0.55} />
        </EffectComposer>
      )}

      <AdaptiveDpr pixelated />
      <AdaptiveEvents />
    </Canvas>
  )
}
