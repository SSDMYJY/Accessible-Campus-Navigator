/*
 * useSpeech.js — wraps window.speechSynthesis (Web Speech API).
 *
 * RETURNS
 *   { supported, speaking, speak(text), cancel() }
 *
 * A11Y / ROBUSTNESS DECISIONS
 *   - Feature-detect `window.speechSynthesis`. Browsers without it (or where
 *     the user has disabled speech) cause `supported` to be false; the Header
 *     button then renders as aria-disabled with an explanatory title instead
 *     of throwing on click.
 *   - `speak()` cancels any in-flight utterance first. Without this, rapid
 *     clicks queue up multiple utterances that play back-to-back, which is
 *     confusing for screen-reader users who may also be running their own AT.
 *   - rate=0.95 (slightly slower than default 1.0) improves comprehension for
 *     users with cognitive impairments and for non-native speakers.
 *   - We track `speaking` via the utterance's onstart/onend events so the UI
 *     can show a "Speaking…" state without polling.
 *   - No language auto-detection: the app is `lang="zh-CN"`, so we hard-code
 *     'zh-CN' to avoid the browser picking a wrong voice for a long string.
 */
import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * @param {object} [opts]
 * @param {number} [opts.rate=0.95]    Speech rate. Web Speech API supports 0.1–10,
 *                                    but values outside ~0.5–2.0 are unintelligible.
 * @param {number} [opts.pitch=1]     Speech pitch, 0–2.
 */
export function useSpeech({ rate, pitch } = {}) {
  const supported =
    typeof window !== 'undefined' && 'speechSynthesis' in window

  const [speaking, setSpeaking] = useState(false)
  // Keep a ref to the current utterance so we can detach handlers on unmount.
  const utteranceRef = useRef(null)

  // Read the latest rate/pitch on each speak() call so a settings change in
  // the middle of a session takes effect on the very next utterance without
  // needing to recreate the hook or the consumers.
  const rateRef = useRef(rate)
  const pitchRef = useRef(pitch)
  useEffect(() => {
    rateRef.current = rate
  }, [rate])
  useEffect(() => {
    pitchRef.current = pitch
  }, [pitch])

  // Cancel any pending speech when the component using the hook unmounts,
  // otherwise the browser keeps talking after the user navigated away.
  useEffect(() => {
    return () => {
      if (supported) {
        window.speechSynthesis.cancel()
      }
    }
  }, [supported])

  const speak = useCallback(
    (text) => {
      if (!supported || !text) return
      // Cancel anything currently in flight so we don't stack utterances.
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = typeof rateRef.current === 'number' ? rateRef.current : 0.95
      utterance.pitch = typeof pitchRef.current === 'number' ? pitchRef.current : 1
      utterance.volume = 1
      utterance.lang = 'zh-CN'

      utterance.onstart = () => setSpeaking(true)
      utterance.onend = () => setSpeaking(false)
      utterance.onerror = () => setSpeaking(false)

      utteranceRef.current = utterance
      window.speechSynthesis.speak(utterance)
    },
    [supported]
  )

  const cancel = useCallback(() => {
    if (!supported) return
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [supported])

  return { supported, speaking, speak, cancel }
}
