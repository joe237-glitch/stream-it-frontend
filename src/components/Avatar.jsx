import { useState } from 'react'

/**
 * Avatar avec fallback initiales + couleur stable.
 *
 * - Si `src` valide et image charge → affiche la photo
 * - Sinon (src null/undefined OU 404 OU ne charge pas) → affiche initiales
 *   sur un fond coloré dérivé du nom (couleur stable, même nom = même couleur)
 *
 * Usage:
 *   <Avatar src={user?.profile_photo} name={user?.first_name + ' ' + user?.last_name}
 *           size="md" />
 *
 * Tailles: xs (24px) | sm (32px) | md (48px) | lg (64px) | xl (96px) | 2xl (128px)
 */

const SIZES = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-base',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-24 h-24 text-3xl',
  '2xl': 'w-32 h-32 text-4xl',
}

// Palette pro (10 couleurs distinctes, lisibles avec texte blanc)
const PALETTE = [
  'bg-rose-600',
  'bg-pink-600',
  'bg-fuchsia-600',
  'bg-purple-600',
  'bg-violet-600',
  'bg-indigo-600',
  'bg-blue-600',
  'bg-cyan-600',
  'bg-teal-600',
  'bg-emerald-600',
]

function hashString(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

function getInitials(name) {
  if (!name || typeof name !== 'string') return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function Avatar({
  src,
  name = '',
  size = 'md',
  className = '',
  rounded = 'rounded-full',
}) {
  const [errored, setErrored] = useState(false)
  const showImage = src && !errored

  const sizeClasses = SIZES[size] || SIZES.md
  const colorClass = PALETTE[hashString(name || 'guest') % PALETTE.length]
  const initials = getInitials(name)

  return (
    <span
      className={`inline-flex items-center justify-center overflow-hidden font-bold text-white select-none ${rounded} ${sizeClasses} ${showImage ? '' : colorClass} ${className}`}
      aria-label={name || 'avatar'}
    >
      {showImage ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          onError={() => setErrored(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <span aria-hidden="true">{initials}</span>
      )}
    </span>
  )
}
