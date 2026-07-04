/*
 * useHighContrast.js — a small hook that manages the High-Contrast mode toggle.
 *
 * BEHAVIOR
 *   1. On first mount, read the saved preference from localStorage. If none,
 *      honor the user's OS-level contrast preference via the
 *      `(prefers-contrast: more)` media query (Chrome/Edge/Firefox).
 *   2. Apply a `high-contrast` class to <html> whenever the value is true. The
 *      actual color/border overrides live in src/styles/a11y.css under
 *      `.high-contrast`, so the hook itself stays presentation-agnostic.
 *   3. Persist any change to localStorage so the preference survives reloads.
 *
 * WHY NOT prefers-color-scheme?
 *   Dark mode is about aesthetics; high-contrast is about legibility for low-
 *   vision users. They are different concerns. We intentionally use
 *   prefers-contrast and a manual toggle so the user can override the OS
 *   setting from inside the app (some shared machines don't expose OS-level
 *   contrast settings).
 */
import { useEffect, useState } from 'react'

const STORAGE_KEY = 'acn-high-contrast'

function getInitialValue() {
  if (typeof window === 'undefined') return false
  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (saved !== null) return saved === '1'
  // Fall back to OS preference. matchMedia may not exist in very old browsers.
  if (window.matchMedia) {
    return window.matchMedia('(prefers-contrast: more)').matches
  }
  return false
}

export function useHighContrast() {
  const [highContrast, setHighContrast] = useState(getInitialValue)

  // Reflect state onto <html> + localStorage.
  useEffect(() => {
    const root = document.documentElement
    if (highContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }
    window.localStorage.setItem(STORAGE_KEY, highContrast ? '1' : '0')
  }, [highContrast])

  const toggle = () => setHighContrast((v) => !v)

  return [highContrast, toggle]
}
