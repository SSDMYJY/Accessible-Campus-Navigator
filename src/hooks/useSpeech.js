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

export function useSpeech() {
  const supported =
    typeof window !== 'undefined' && 'speechSynthesis' in window

  const [speaking, setSpeaking] = useState(false)
  // Keep a ref to the current utterance so we can detach handlers on unmount.
  const utteranceRef = useRef(null)

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
      utterance.rate = 0.95
      utterance.pitch = 1
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
