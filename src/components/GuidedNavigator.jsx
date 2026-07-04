/*
 * GuidedNavigator.jsx — a focused, one-step-at-a-time navigation overlay.
 *
 * WHY THIS EXISTS
 *   Reading a multi-step route in a long list is fine for picking a route,
 *   but terrible for *following* it on the move. Once the user has chosen a
 *   route, they want:
 *     - one big step at a time,
 *     - clear "current step / total steps" progress,
 *     - prev / next controls that are huge and thumb-reachable,
 *     - automatic audio playback of the current step (so a blind user can
 *       walk without re-tapping the announce button),
 *     - a clear "exit navigation" affordance.
 *   This component delivers all of the above as a modal-style overlay.
 *
 * A11Y DECISIONS
 *   - Implemented as a real <dialog> via the native HTML <dialog> element
 *     where supported, falling back to a div with role="dialog" otherwise.
 *     Native <dialog> gives us focus trap + ESC-to-close for free.
 *   - aria-modal="true" so AT switches to "modal" interaction mode.
 *   - aria-labelledby points at the dialog title (route name).
 *   - aria-describedby points at the current-step text so AT users hear the
 *     step immediately when the dialog opens.
 *   - The Prev / Next buttons have aria-labels that include the step numbers,
 *     e.g. "上一步,第 2 步,共 5 步".
 *   - When the user advances to the last step, the Next button morphs into
 *     "完成导航" with aria-label "完成导航,到达终点".
 *   - Auto-announce: each time the current step changes, we speak the step
 *     text via the speech hook. The user can toggle this off inside the
 *     overlay if they prefer silence.
 *
 * FOCUS MANAGEMENT
 *   On open, focus moves to the dialog (so AT announces the title). The
 *   first tab stop after the title is the "current step" region, then the
 *   Prev / Next controls. Tab is constrained to the overlay by the native
 *   dialog's focus trap.
 */
import { useEffect, useMemo, useRef, useState } from 'react'

export default function GuidedNavigator({ route, speech, onClose, initialAutoAnnounce = true }) {
  const [stepIndex, setStepIndex] = useState(0)
  // Seed the per-session toggle from the persisted global default so a user
  // who turned off auto-announce in Settings doesn't have to turn it off
  // again every time they open the navigator.
  const [autoAnnounce, setAutoAnnounce] = useState(initialAutoAnnounce)
  const dialogRef = useRef(null)
  const stepRegionRef = useRef(null)

  const total = route.steps.length
  const step = route.steps[stepIndex]
  const isFirst = stepIndex === 0
  const isLast = stepIndex === total - 1

  const titleId = `guided-title-${route.id}`
  const descId = `guided-desc-${route.id}`
  const progressId = `guided-progress-${route.id}`

  // Compose the spoken text for a single step. We prepend the step number so
  // a blind user can keep their place in the sequence without re-reading the
  // visual progress bar.
  const spokenFor = useMemo(() => {
    return (i) => {
      const s = route.steps[i]
      const safetyPrefix = i === 0 && route.safetyNote ? `安全提示:${route.safetyNote}。` : ''
      return `${safetyPrefix}第 ${i + 1} 步,共 ${total} 步。${s}`
    }
  }, [route, total])

  // On open: focus the dialog (or the step region if dialog focus is not
  // honored) and speak the first step.
  useEffect(() => {
    const dlg = dialogRef.current
    if (dlg) {
      // Try native <dialog>.showModal() for free focus trap + ESC handling.
      if (typeof dlg.showModal === 'function' && !dlg.open) {
        try { dlg.showModal() } catch (_) { /* already open */ }
      }
    }
    // Small delay so the focus move doesn't race with the dialog mount.
    const t = setTimeout(() => {
      if (stepRegionRef.current) stepRegionRef.current.focus()
    }, 30)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Speak the current step whenever it changes (and autoAnnounce is on).
  useEffect(() => {
    if (!autoAnnounce) return
    if (!speech.supported) return
    speech.speak(spokenFor(stepIndex))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, autoAnnounce])

  // On unmount: cancel any pending speech so it doesn't keep talking after
  // the user closed the overlay.
  useEffect(() => {
    return () => {
      if (speech.supported) speech.cancel()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const goPrev = () => {
    if (!isFirst) setStepIndex((i) => Math.max(0, i - 1))
  }
  const goNext = () => {
    if (isLast) {
      // Final step → speak arrival then close.
      if (speech.supported) speech.speak('已到达终点,导航结束。')
      onClose()
      return
    }
    setStepIndex((i) => Math.min(total - 1, i + 1))
  }

  const replayStep = () => {
    if (speech.supported) speech.speak(spokenFor(stepIndex))
  }

  const progressPct = total > 1 ? (stepIndex / (total - 1)) * 100 : 100

  return (
    <dialog
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      className="guided-navigator"
      onClose={onClose}
    >
      <div className="guided-navigator__inner">
        {/* Header strip — route name + close button */}
        <header className="guided-navigator__header">
          <p className="station-code">引导导航 · GUIDED</p>
          <h2 id={titleId} className="font-display font-700 text-paper leading-tight mt-1"
            style={{ fontSize: 'clamp(1.25rem, 1rem + 1vw, 1.5rem)', letterSpacing: '-0.02em' }}>
            {route.origin}
            <span className="text-rust mx-2 font-400" aria-hidden="true">→</span>
            {route.destination}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="退出导航"
            title="退出导航"
            className="guided-navigator__close touch-target"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </header>

        {/* Progress bar — decorative; the textual "第 N 步,共 M 步" is in
            the live region below and is the authoritative AT affordance. */}
        <div
          className="guided-navigator__progress"
          role="presentation"
          aria-hidden="true"
        >
          <div
            className="guided-navigator__progress-fill"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p id={progressId} className="mono text-xs text-paper/70 mt-2">
          第 {stepIndex + 1} 步,共 {total} 步
        </p>

        {/* Current step — the focal point of the overlay. Tabindex=-1 so we
            can move focus here programmatically when the step changes. */}
        <div
          ref={stepRegionRef}
          tabIndex={-1}
          id={descId}
          className="guided-navigator__step"
          aria-live="polite"
          aria-atomic="true"
        >
          <p className="station-code text-paper/60 mb-2">当前步骤 · STEP</p>
          <p className="font-serif text-paper text-xl sm:text-2xl leading-relaxed">
            {step}
          </p>
        </div>

        {/* Safety note shown only on the first step so it doesn't nag */}
        {isFirst && route.safetyNote && (
          <p
            role="note"
            className="guided-navigator__safety"
          >
            <span className="font-display font-700 text-rust whitespace-nowrap">⚠ 安全提示</span>
            <span className="leading-relaxed text-paper">{route.safetyNote}</span>
          </p>
        )}

        {/* Controls */}
        <div className="guided-navigator__controls">
          <button
            type="button"
            onClick={goPrev}
            disabled={isFirst}
            aria-label={`上一步,第 ${Math.max(1, stepIndex)} 步,共 ${total} 步`}
            className="badge-button touch-target guided-navigator__btn"
          >
            <span aria-hidden="true">←</span>
            上一步
          </button>

          <button
            type="button"
            onClick={replayStep}
            aria-label="重新播报当前步骤"
            className="badge-button touch-target guided-navigator__btn"
            title="重新播报当前步骤"
          >
            <span aria-hidden="true">🔊</span>
            重播
          </button>

          <button
            type="button"
            onClick={goNext}
            className="badge-button badge-button--primary touch-target guided-navigator__btn"
            aria-label={isLast ? '完成导航,到达终点' : `下一步,第 ${stepIndex + 2} 步,共 ${total} 步`}
          >
            <span aria-hidden="true">{isLast ? '✓' : '→'}</span>
            {isLast ? '完成导航' : '下一步'}
          </button>
        </div>

        {/* Auto-announce toggle — visible inside the overlay only */}
        <label className="guided-navigator__auto-toggle">
          <input
            type="checkbox"
            checked={autoAnnounce}
            onChange={(e) => setAutoAnnounce(e.target.checked)}
          />
          <span className="mono text-xs text-paper/85">每步自动播报</span>
        </label>
      </div>
    </dialog>
  )
}
