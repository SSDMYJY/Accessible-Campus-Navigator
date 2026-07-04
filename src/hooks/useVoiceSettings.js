/*
 * useVoiceSettings.js — persisted TTS preferences shared across the app.
 *
 * WHY THIS EXISTS
 *   The default useSpeech hook hard-codes rate=0.95. That works for most
 *   users but is too slow for some and too fast for others. A user who is
 *   hard-of-hearing or learning Mandarin needs a slower rate; a power user
 *   who's heard these routes a hundred times wants faster. Persisting this
 *   per-device in localStorage lets each user tune it once and forget it.
 *
 * SCOPE
 *   - rate: 0.5 – 2.0 (Web Speech API supported range). Default 0.95 to
 *     preserve the previous behavior.
 *   - pitch: 0 – 2, default 1.
 *   - autoAnnounceSteps: whether the GuidedNavigator automatically speaks
 *     each step on advance. Default true.
 *
 * A11Y
 *   - We never block the UI on the localStorage read; the initial value is
 *     computed synchronously in useState's initializer, so there is no
 *     flash of "default" before the saved preference applies.
 *   - On browsers without localStorage (private mode, disabled storage),
 *     we silently fall back to defaults — the in-memory state still works.
 */
import { useCallback, useState } from 'react'

const STORAGE_KEY = 'acn-voice-settings'

const DEFAULTS = {
  rate: 0.95,
  pitch: 1,
  autoAnnounceSteps: true,
}

const RATE_MIN = 0.5
const RATE_MAX = 2.0
const PITCH_MIN = 0
const PITCH_MAX = 2

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v))
}

function readStore() {
  if (typeof window === 'undefined') return { ...DEFAULTS }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULTS }
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULTS }
    return {
      rate: clamp(Number(parsed.rate) || DEFAULTS.rate, RATE_MIN, RATE_MAX),
      pitch: clamp(Number(parsed.pitch) || DEFAULTS.pitch, PITCH_MIN, PITCH_MAX),
      autoAnnounceSteps:
        typeof parsed.autoAnnounceSteps === 'boolean'
          ? parsed.autoAnnounceSteps
          : DEFAULTS.autoAnnounceSteps,
    }
  } catch (_) {
    return { ...DEFAULTS }
  }
}

function writeStore(values) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(values))
  } catch (_) {
    /* storage disabled — fail silently */
  }
}

export function useVoiceSettings() {
  const [settings, setSettings] = useState(readStore)

  const update = useCallback((patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      // Re-clamp defensively so a malformed external write can't push us
      // outside the Web Speech API's supported range.
      next.rate = clamp(Number(next.rate) || DEFAULTS.rate, RATE_MIN, RATE_MAX)
      next.pitch = clamp(Number(next.pitch) || DEFAULTS.pitch, PITCH_MIN, PITCH_MAX)
      writeStore(next)
      return next
    })
  }, [])

  const reset = useCallback(() => {
    setSettings({ ...DEFAULTS })
    writeStore({ ...DEFAULTS })
  }, [])

  return { settings, update, reset }
}

// Export the bounds so the UI can render the slider with the same constraints
// the hook enforces. Single source of truth — no magic numbers in the markup.
export const VOICE_RATE_BOUNDS = { min: RATE_MIN, max: RATE_MAX, step: 0.05 }
export const VOICE_PITCH_BOUNDS = { min: PITCH_MIN, max: PITCH_MAX, step: 0.1 }
