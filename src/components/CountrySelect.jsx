import { useEffect, useRef, useState } from 'react'

/**
 * CountrySelect — dropdown custom (drop-in pour <select>) avec dark theme.
 *
 * Pourquoi ce composant existe : <select> natif + <option> sont rendus par
 * l'OS (Windows force fond blanc + texte noir sur les options). Sur le
 * dark theme de Stream-It les options apparaissent blanc sur blanc, donc
 * illisibles sauf l'option sélectionnée. Ce dropdown utilise un <button>
 * + une <ul> de divs pour avoir un contrôle CSS total.
 *
 * Usage :
 *   <CountrySelect
 *     value={countryCode}
 *     onChange={setCountryCode}
 *     options={[{country_code:'CM', country_name:'Cameroun', currency:'XAF'}, ...]}
 *   />
 */
export default function CountrySelect({ value, onChange, options = [], placeholder = 'Sélectionner un pays' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Close on outside click + Escape
  useEffect(() => {
    if (!open) return
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const selected = options.find(o => o.country_code === value)

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="input-field w-full text-left flex items-center justify-between gap-2"
      >
        <span className={selected ? '' : 'text-slate-500'}>
          {selected ? `${selected.country_name} (${selected.currency})` : placeholder}
        </span>
        <span className={`text-slate-500 text-xs transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1.5 w-full max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-[#0b0b14] shadow-2xl py-1"
        >
          {options.length === 0 && (
            <li className="px-3 py-2 text-sm text-slate-500">Aucun pays disponible</li>
          )}
          {options.map(c => {
            const isSelected = c.country_code === value
            return (
              <li
                key={c.country_code}
                role="option"
                aria-selected={isSelected}
                onClick={() => { onChange(c.country_code); setOpen(false) }}
                className={`px-3 py-2 cursor-pointer text-sm transition-colors flex items-center justify-between ${
                  isSelected
                    ? 'bg-indigo-500/20 text-white'
                    : 'text-slate-200 hover:bg-white/5'
                }`}
              >
                <span>{c.country_name}</span>
                <span className="text-xs text-slate-500">({c.currency})</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
