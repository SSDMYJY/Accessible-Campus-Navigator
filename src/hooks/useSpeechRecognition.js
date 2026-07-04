/*
 * useSpeechRecognition.js — wraps the Web Speech API SpeechRecognition.
 *
 * WHY A SEPARATE HOOK FROM useSpeech.js?
 *   useSpeech.js handles speech *synthesis* (text → voice, for announcements).
 *   This hook handles speech *recognition* (voice → text, for intent input).
 *   They are independent browser APIs with different capability surfaces, so
 *   they get separate hooks.
 *
 * BROWSER SUPPORT
 *   SpeechRecognition is currently prefixed (`webkitSpeechRecognition`) in
 *   Chrome/Edge/Safari. Firefox has no stable support. We feature-detect and
 *   expose `supported` so the UI can gracefully degrade.
 *
 * A11Y / UX GUARDRAILS
 *   - lang='zh-CN' so recognition uses the Mandarin acoustic model.
 *   - interimResults=true so the user sees live transcription feedback
 *     (important for users with cognitive impairments — confirms the mic
 *     heard them).
 *   - continuous=false: stop after one utterance. Simpler intent model.
 *   - On error (no-speech, not-allowed, network) we surface a structured
 *     error so the aria-live region can announce what went wrong and the
 *     user knows to retry or fall back to manual entry.
 *   - We auto-stop after MAX_SECONDS so the mic never hangs open if the
 *     user gets distracted.
 */
import { useCallback, useEffect, useRef, useState } from 'react'

const MAX_SECONDS = 8

function getRecognitionConstructor() {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

export function useSpeechRecognition({ onFinalResult } = {}) {
  const Ctor = getRecognitionConstructor()
  const supported = Boolean(Ctor)

  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const [error, setError] = useState('')

  const recRef = useRef(null)
  const onResultRef = useRef(onFinalResult)
  const autoStopTimerRef = useRef(null)

  // Keep the latest callback in a ref so the recognition instance (created
  // once) always invokes the freshest handler without needing to be rebuilt.
  useEffect(() => {
    onResultRef.current = onFinalResult
  }, [onFinalResult])

  const clearAutoStop = useCallback(() => {
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current)
      autoStopTimerRef.current = null
    }
  }, [])

  const stop = useCallback(() => {
    clearAutoStop()
    if (recRef.current) {
      try { recRef.current.stop() } catch (_) { /* noop */ }
    }
  }, [clearAutoStop])

  const start = useCallback(() => {
    if (!supported) {
      setError('当前浏览器不支持语音识别,请使用 Chrome 或 Edge,或改用手动选择。')
      return
    }
    setError('')
    setInterim('')

    // Tear down any previous instance first.
    if (recRef.current) {
      try { recRef.current.abort() } catch (_) {}
    }

    const rec = new Ctor()
    rec.lang = 'zh-CN'
    rec.continuous = false
    rec.interimResults = true
    rec.maxAlternatives = 1

    rec.onstart = () => {
      setListening(true)
      // Auto-stop guard so the mic can't hang open if the user gets distracted.
      clearAutoStop()
      autoStopTimerRef.current = setTimeout(() => {
        try { rec.stop() } catch (_) {}
      }, MAX_SECONDS * 1000)
    }

    rec.onresult = (event) => {
      let interimText = ''
      let finalText = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalText += result[0].transcript
        } else {
          interimText += result[0].transcript
        }
      }
      if (interimText) setInterim(interimText)
      if (finalText) {
        setInterim('')
        setListening(false)
        clearAutoStop()
        onResultRef.current?.(finalText.trim())
      }
    }

    rec.onerror = (event) => {
      setListening(false)
      clearAutoStop()
      const code = event.error
      const msg =
        code === 'not-allowed' || code === 'service-not-allowed'
          ? '麦克风权限被拒绝,请在浏览器设置中允许麦克风访问。'
          : code === 'no-speech'
          ? '没有听到声音,请重试。'
          : code === 'network'
          ? '语音识别网络错误,请检查网络后重试。'
          : code === 'aborted'
          ? '' // abort is intentional
          : `语音识别出错:${code}`
      setError(msg)
    }

    rec.onend = () => {
      setListening(false)
      clearAutoStop()
    }

    recRef.current = rec
    try {
      rec.start()
    } catch (err) {
      setError('无法启动语音识别,请重试。')
      setListening(false)
    }
  }, [supported, Ctor, clearAutoStop])

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      clearAutoStop()
      if (recRef.current) {
        try { recRef.current.abort() } catch (_) {}
      }
    }
  }, [clearAutoStop])

  return { supported, listening, interim, error, start, stop, setError }
}
