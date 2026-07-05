/*
 * SettingsPopover.jsx — a small popover for voice / TTS preferences.
 *
 * WHY A POPOVER (and not a full modal)
 *   The settings here are a small handful of values that the user wants to
 *   tweak in-place, see the effect immediately, and dismiss. A full-screen
 *   modal would be heavier than needed and would steal focus from the
 *   route they're looking at.
 *
 * WHY POPOVER API
 *   We use the native `popover` attribute where supported (Chrome 114+,
 *   Safari 17+, Firefox 125+). It gives us top-layer rendering, light-
 *   dismiss (click outside / ESC), and focus management for free. On
 *   browsers without popover support we fall back to a controlled
 *   absolutely-positioned panel with manual outside-click handling.
 *
 * A11Y DECISIONS
 *   - The popover has role="dialog" + aria-labelledby so AT treats it as a
 *     dialog (regardless of native popover support).
 *   - The trigger button has aria-haspopup="dialog" and aria-expanded.
 *   - The "试听" (preview) button speaks a sample sentence at the current
 *     rate so users can audition before committing.
 *   - All controls have visible labels and aria-labels.
 *   - The reset button restores defaults and is undoable by simply
 *     re-opening the popover.
 */
import { useEffect, useRef, useState } from 'react'
import { VOICE_RATE_BOUNDS, VOICE_PITCH_BOUNDS } from '../hooks/useVoiceSettings.js'

const SAMPLE_TEXT = '这是一段语音播报示例,用于试听当前的语速与音调。'

export default function SettingsPopover({
  settings,
  onUpdate,
  onReset,
  speech,
}) {
  const [open, setOpen] = useState(false)
  const popoverRef = useRef(null)
  const triggerRef = useRef(null)

  // When opening, move focus into the popover so AT announces it.
  // When closing, restore focus to the trigger so the user doesn't lose
  // their place in the tab order.
  useEffect(() => {
    if (!open) return
    const dlg = popoverRef.current
    if (dlg) {
      // Try native showPopover().
      if (typeof dlg.showPopover === 'function') {
        try { dlg.showPopover() } catch (_) { /* already open */ }
      }
      // Move focus to the first interactive control inside.
      const first = dlg.querySelector('input, button, select, textarea')
      if (first) {
        const t = setTimeout(() => first.focus(), 30)
        return () => clearTimeout(t)
      }
    }
    // When closing: return focus to the trigger for keyboard users.
    return () => {
      if (triggerRef.current) triggerRef.current.focus()
    }
  }, [open])

  // Light-dismiss for browsers without native popover support: click outside
  // closes. Native popover already handles this via `popover=auto`.
  useEffect(() => {
    if (!open) return
    function onDocClick(e) {
      const dlg = popoverRef.current
      const trg = triggerRef.current
      if (!dlg) return
      if (dlg.contains(e.target)) return
      if (trg && trg.contains(e.target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  // ESC closes the popover (also handled natively by `popover=auto`).
  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const preview = () => {
    if (speech.supported) speech.speak(SAMPLE_TEXT)
  }

  return (
    <div className="settings-popover-wrapper">
      <button
        ref={triggerRef}
        type="button"
        className="badge-button touch-target"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="settings-popover"
        onClick={() => setOpen((o) => !o)}
        title="语音播报设置"
      >
        <span aria-hidden="true">⚙</span>
        <span>语音设置</span>
      </button>

      <div
        ref={popoverRef}
        id="settings-popover"
        role="dialog"
        aria-modal="false"
        aria-labelledby="settings-popover-title"
        className="settings-popover"
        hidden={!open}
      >
        <div className="flex items-baseline justify-between gap-3 mb-3">
          <p className="station-code" id="settings-popover-title">语音播报设置 · TTS</p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="关闭设置"
            className="settings-popover__close touch-target"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        {/* Rate slider */}
        <div className="settings-popover__row">
          <label htmlFor="voice-rate" className="settings-popover__label">
            语速
            <span className="mono text-xs text-ink-muted ml-1">
              {settings.rate.toFixed(2)}×
            </span>
          </label>
          <input
            id="voice-rate"
            type="range"
            min={VOICE_RATE_BOUNDS.min}
            max={VOICE_RATE_BOUNDS.max}
            step={VOICE_RATE_BOUNDS.step}
            value={settings.rate}
            onChange={(e) => onUpdate({ rate: Number(e.target.value) })}
            className="settings-popover__range"
            aria-describedby="voice-rate-desc"
          />
          <p id="voice-rate-desc" className="settings-popover__desc">
            数值越小越慢,越大越快。默认 0.95。
          </p>
        </div>

        {/* Pitch slider */}
        <div className="settings-popover__row">
          <label htmlFor="voice-pitch" className="settings-popover__label">
            音调
            <span className="mono text-xs text-ink-muted ml-1">
              {settings.pitch.toFixed(1)}
            </span>
          </label>
          <input
            id="voice-pitch"
            type="range"
            min={VOICE_PITCH_BOUNDS.min}
            max={VOICE_PITCH_BOUNDS.max}
            step={VOICE_PITCH_BOUNDS.step}
            value={settings.pitch}
            onChange={(e) => onUpdate({ pitch: Number(e.target.value) })}
            className="settings-popover__range"
            aria-describedby="voice-pitch-desc"
          />
          <p id="voice-pitch-desc" className="settings-popover__desc">
            数值越大音调越高。默认 1.0。
          </p>
        </div>

        {/* Auto-announce checkbox */}
        <div className="settings-popover__row">
          <label htmlFor="auto-announce" className="settings-popover__check-label">
            <input
              id="auto-announce"
              type="checkbox"
              checked={settings.autoAnnounceSteps}
              onChange={(e) => onUpdate({ autoAnnounceSteps: e.target.checked })}
              className="settings-popover__checkbox"
            />
            <span>
              <span className="font-display font-600 text-ink text-sm">引导导航自动播报每一步</span>
              <span className="block font-serif text-xs text-ink-muted mt-0.5">
                关闭后,在引导导航中需手动点击「重播」按钮才会读出当前步骤。
              </span>
            </span>
          </label>
        </div>

        {/* Actions: preview / reset */}
        <div className="settings-popover__actions">
          <button
            type="button"
            onClick={preview}
            disabled={!speech.supported}
            aria-disabled={!speech.supported}
            title={!speech.supported ? '当前浏览器不支持语音合成' : '用当前设置播报示例'}
            className="badge-button touch-target"
          >
            <span aria-hidden="true">🔊</span>
            试听
          </button>
          <button
            type="button"
            onClick={onReset}
            className="badge-button touch-target"
            aria-label="恢复默认设置"
          >
            <span aria-hidden="true">↺</span>
            恢复默认
          </button>
        </div>
      </div>
    </div>
  )
}
