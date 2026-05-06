import { useState } from 'react'

/**
 * Champ password avec toggle œil (afficher/masquer).
 * Drop-in replacement pour <input type="password" />.
 *
 * Usage:
 *   <PasswordInput value={pwd} onChange={e => setPwd(e.target.value)}
 *                  placeholder="Minimum 8 caractères" required />
 */
export default function PasswordInput({
  value,
  onChange,
  placeholder = '••••••••',
  required = false,
  autoComplete,
  className = 'input-field pr-12',
  name,
  ...rest
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        name={name}
        value={value}
        onChange={onChange}
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        className={className}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        title={show ? 'Masquer' : 'Afficher'}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs transition-colors select-none"
      >
        {show ? '🙈' : '👁'}
      </button>
    </div>
  )
}
