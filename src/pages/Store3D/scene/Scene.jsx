import { Canvas } from '@react-three/fiber'
import { Environment, AdaptiveDpr, AdaptiveEvents, PerformanceMonitor, Stars } from '@react-three/drei'
import { Suspense, useState } from 'react'
import CameraRig from './CameraRig'
import Hall from './Hall'
import CategoryStand from './CategoryStand'
import { CATEGORIES } from '../data/mockProducts'
import { useStore3DSession } from '../hooks/useStore3DSession'

/**
 * Scene — racine R3F. Lights + Hall + 3 stands + AdaptiveDpr / AdaptiveEvents.
 * Si tier=light, on désactive le post-processing et les Stars d'arrière-plan.
 */
export default function Scene() {
  const tier = useStore3DSession(s => s.tier)
  const isLight = tier === 'light'
  const [dprFactor, setDprFactor] = useState(isLight ? 0.7 : 1)

  return (
    <Canvas
      shadows={!isLight}
      camera={{ position: [0, 6, 12], fov: 55, near: 0.1, far: 100 }}
      dpr={[0.7, isLight ? 1.2 : 1.6]}
      style={{ width: '100%', height: '100%', background: 'linear-gradient(180deg,#05050d 0%,#0a0a18 60%,#0e0e1c 100%)' }}
    >
      <PerformanceMonitor
        onIncline={() => setDprFactor(d => Math.min(d + 0.1, isLight ? 1.2 : 1.6))}
        onDecline={() => setDprFactor(d => Math.max(d - 0.1, 0.6))}
      />
      <AdaptiveDpr pixelated={false} />
      <AdaptiveEvents />

      {/* Lights : ambient doux + 3 spots Direction E (cyan/violet) + accent ambre D */}
      <ambientLight intensity={0.45} color="#9ca3ff" />
      <pointLight position={[ 5, 6,  5]} intensity={1.4} color="#7c3aed" />
      <pointLight position={[-5, 6,  5]} intensity={1.2} color="#06b6d4" />
      <pointLight position={[ 0, 3, -6]} intensity={0.5} color="#f59e0b" />
      <pointLight position={[ 0, 8,  0]} intensity={0.6} color="#ffffff" />

      <Suspense fallback={null}>
        {!isLight && <Stars radius={50} depth={20} count={1200} factor={2} fade />}
        <Hall />
        {/* 3 stands disposés en arc devant le hall */}
        <CategoryStand code={CATEGORIES[0].code} name={CATEGORIES[0].name} accent={CATEGORIES[0].accent} position={[-4, 0,  1]} />
        <CategoryStand code={CATEGORIES[1].code} name={CATEGORIES[1].name} accent={CATEGORIES[1].accent} position={[ 0, 0,  2]} />
        <CategoryStand code={CATEGORIES[2].code} name={CATEGORIES[2].name} accent={CATEGORIES[2].accent} position={[ 4, 0,  1]} />
        {!isLight && <Environment preset="night" />}
      </Suspense>

      <CameraRig />
    </Canvas>
  )
}
