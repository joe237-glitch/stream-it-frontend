/**
 * phone.js — frontend helpers to keep mobile-money phone input UX permissive.
 *
 * The coverage matrix (served by the backend, sourced from GeniusPay) ships a
 * `phone_pattern` per operator like `^6[0-9]{8}$` (Cameroon) which only
 * matches the *national* number. If the user types `+237 6XX XX XX XX`,
 * `0237 6XX...`, or `00237 6XX...`, the regex would fail.
 *
 * `stripDialCode` normalises whatever the user typed back to the national
 * format so we can validate against the operator pattern, without forcing
 * the user to remember/type the right format.
 *
 * The backend always re-formats to E.164 with the country dial code before
 * sending to GeniusPay (cf. backend src/utils/phoneE164.js), so we don't
 * need to keep the dial code on the frontend submit value.
 */

const DIAL_CODES = {
  BJ: '229', BF: '226', CM: '237', CD: '243', CG: '242',
  CI: '225', GA: '241', GN: '224', KE: '254', ML: '223',
  NE: '227', RW: '250', SN: '221', SL: '232', TD: '235',
  TG: '228', UG: '256', ZM: '260',
}

/**
 * Strip non-digits, the country dial code (with or without leading +),
 * and a leading 0 — return the bare national number for regex validation.
 */
export function stripDialCode(phone, countryCode) {
  if (!phone) return ''
  let digits = String(phone).replace(/\D/g, '')
  if (!digits) return ''
  const dial = countryCode && DIAL_CODES[String(countryCode).toUpperCase()]
  if (dial && digits.startsWith(dial)) {
    digits = digits.slice(dial.length)
  }
  if (digits.startsWith('0')) {
    digits = digits.slice(1)
  }
  return digits
}

/** Get the +XXX prefix to display in the UI (fallback empty string). */
export function getDialCode(countryCode) {
  return (countryCode && DIAL_CODES[String(countryCode).toUpperCase()]) || ''
}
