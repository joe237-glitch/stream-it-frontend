import { useEffect, useRef } from 'react'
import { useStore3DSession } from '../hooks/useStore3DSession'

/**
 * AudioToggle V4 — drone ambient synthétique via Web Audio API.
 *
 * Conformément aux directives PM :
 * - Mute par défaut (audioEnabled = false dans zustand)
 * - Bouton activation/désactivation visible dans le HUD
 * - Aucun autoplay : démarre uniquement après user gesture (clic toggle)
 * - Aucun fichier binaire : drone généré en temps réel via OscillatorNode +
 *   BiquadFilter + Gain (~10 Hz CPU négligeable)
 *
 * Composition du drone :
 * - 2 oscillators : sine 110 Hz (fondamentale) + sine 220 Hz (octave)
 * - LFO sine 0.13 Hz qui modèle la fréquence du filtre passe-bas (~ ±150 Hz)
 *   donne le mouvement subtil sans saccade
 * - Filtre passe-bas Q=2, freq centrale 600 Hz
 * - Gain master 0.04 (très bas, ne couvre jamais une voix off)
 * - Reverb très légère via DelayNode + feedback (économie : pas de convolver)
 *
 * Aucun fichier audio téléchargé. Aucun coût bundle (juste du JS).
 */

function makeDrone(ctx) {
  const master = ctx.createGain()
  master.gain.value = 0
  master.connect(ctx.destination)

  // Filtre passe-bas centre 600 Hz
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 600
  filter.Q.value = 2
  filter.connect(master)

  // Delay pour suggérer une réverb
  const delay = ctx.createDelay(2)
  delay.delayTime.value = 0.42
  const feedback = ctx.createGain()
  feedback.gain.value = 0.32
  delay.connect(feedback)
  feedback.connect(delay)
  delay.connect(filter)

  // Oscillator 1 : 110 Hz fondamentale
  const osc1 = ctx.createOscillator()
  osc1.type = 'sine'
  osc1.frequency.value = 110
  const g1 = ctx.createGain()
  g1.gain.value = 0.6
  osc1.connect(g1)
  g1.connect(filter)
  g1.connect(delay)

  // Oscillator 2 : 220 Hz octave
  const osc2 = ctx.createOscillator()
  osc2.type = 'sine'
  osc2.frequency.value = 220
  const g2 = ctx.createGain()
  g2.gain.value = 0.32
  osc2.connect(g2)
  g2.connect(filter)

  // Oscillator 3 : 165 Hz quinte légère
  const osc3 = ctx.createOscillator()
  osc3.type = 'sine'
  osc3.frequency.value = 165
  const g3 = ctx.createGain()
  g3.gain.value = 0.22
  osc3.connect(g3)
  g3.connect(filter)

  // LFO sur fréquence du filtre
  const lfo = ctx.createOscillator()
  lfo.type = 'sine'
  lfo.frequency.value = 0.13
  const lfoGain = ctx.createGain()
  lfoGain.gain.value = 150
  lfo.connect(lfoGain)
  lfoGain.connect(filter.frequency)

  osc1.start()
  osc2.start()
  osc3.start()
  lfo.start()

  return {
    master,
    stop: () => {
      try { osc1.stop(); osc2.stop(); osc3.stop(); lfo.stop() } catch {}
    },
  }
}

export default function AudioToggle() {
  const audioEnabled = useStore3DSession((s) => s.audioEnabled)
  const setAudioEnabled = useStore3DSession((s) => s.setAudioEnabled)
  const ctxRef = useRef(null)
  const droneRef = useRef(null)

  useEffect(() => {
    if (audioEnabled) {
      // Démarre context (user gesture déjà eu via clic toggle)
      if (!ctxRef.current) {
        const Ctx = window.AudioContext || window.webkitAudioContext
        if (!Ctx) return
        ctxRef.current = new Ctx()
      }
      if (ctxRef.current.state === 'suspended') {
        ctxRef.current.resume()
      }
      if (!droneRef.current) {
        droneRef.current = makeDrone(ctxRef.current)
      }
      // Fade in 0 → 0.04 sur 1.2 s
      const t = ctxRef.current.currentTime
      droneRef.current.master.gain.cancelScheduledValues(t)
      droneRef.current.master.gain.setValueAtTime(droneRef.current.master.gain.value, t)
      droneRef.current.master.gain.linearRampToValueAtTime(0.04, t + 1.2)
    } else if (droneRef.current && ctxRef.current) {
      // Fade out 0 → silence sur 0.6 s
      const t = ctxRef.current.currentTime
      droneRef.current.master.gain.cancelScheduledValues(t)
      droneRef.current.master.gain.setValueAtTime(droneRef.current.master.gain.value, t)
      droneRef.current.master.gain.linearRampToValueAtTime(0, t + 0.6)
    }

    return () => {
      // Pas de cleanup dur ici : on laisse le drone tourner même quand on
      // toggle off pour pouvoir reprendre instantanément. Cleanup à l'unmount
      // global du composant si jamais.
    }
  }, [audioEnabled])

  // Cleanup à l'unmount complet
  useEffect(() => {
    return () => {
      if (droneRef.current) droneRef.current.stop()
      if (ctxRef.current) ctxRef.current.close().catch(() => {})
    }
  }, [])

  return (
    <button
      type="button"
      className={'store3d-pill' + (audioEnabled ? ' store3d-pill-strong' : '')}
      onClick={() => setAudioEnabled(!audioEnabled)}
      aria-label={audioEnabled ? 'Couper le son ambiant' : 'Activer le son ambiant'}
      title={audioEnabled ? 'Couper le son' : 'Activer le son'}
      aria-pressed={audioEnabled}
    >
      <span aria-hidden="true">{audioEnabled ? '♪' : '♪̸'}</span>
    </button>
  )
}
