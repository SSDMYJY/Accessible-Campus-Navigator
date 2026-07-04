/*
 * VoiceInput.jsx — the PRIMARY interaction surface of the app.
 *
 * DESIGN INTENT (per user request: "简化操作，默认只通过用户说的话识别意图")
 *   Voice is the default entry. The user taps the mic, speaks
 *   "从宿舍楼到第一食堂", and the app parses + searches automatically.
 *   Manual dropdown selection is still available as a collapsible fallback
 *   (rendered by RouteFinder.jsx) for users whose browser lacks
 *   SpeechRecognition, who can't speak at the moment, or whose accent the
 *   recognizer mishears.
 *
 * VISUAL DESIGN
 *   The mic sits in a large "voice ticket window" panel — same cartographic
 *   paper aesthetic as the rest of the app, but visually dominant so the
 *   user understands it is the primary path. While listening, the mic badge
 *   pulses (rust halo) and shows animated sound-wave bars. The live interim
 *   transcript appears below in italic Newsreader so the user sees what the
 *   recognizer is hearing in real time.
 *
 * A11Y DECISIONS
 *   - The mic button has a descriptive aria-label that changes with state
 *     ("开始语音输入" / "正在聆听,再次点击停止").
 *   - aria-pressed conveys listening/not-listening to AT.
 *   - When unsupported, aria-disabled keeps the button focusable so AT users
 *     discover why it is inactive via the title.
 *   - The status line below the mic is a polite aria-live region so screen
 *     readers announce listening start, transcript, and errors.
 *   - The button is a generous 96x96px — well above the 48dp minimum — so
 *     users with motor impairments can hit it easily.
 *   - All decorative SVG (mic icon, wave bars) is aria-hidden.
 */
export default function VoiceInput({
  supported,
  listening,
  interim,
  error,
  lastTranscript,
  onStart,
  onStop,
  places,
}) {
  const buttonLabel = listening ? '停止聆听' : '说出你的目的地'
  const ariaLabel = !supported
    ? '语音输入(当前浏览器不支持)'
    : listening
    ? '正在聆听,再次点击停止聆听'
    : '开始语音输入,例如说:从宿舍楼到第一食堂'

  return (
    <section
      aria-labelledby="voice-input-heading"
      className="ticket-window p-6 sm:p-8"
    >
      <div className="flex items-baseline justify-between gap-3 mb-4">
        <p className="station-code">语音问询处 · VOICE DESK</p>
        <span className="mono text-xs text-ink-muted">No. 001</span>
      </div>

      <h2
        id="voice-input-heading"
        className="font-display font-700 text-ink leading-tight"
        style={{
          fontSize: 'clamp(1.5rem, 1.2rem + 1.4vw, 2.25rem)',
          fontVariationSettings: "'opsz' 96",
          letterSpacing: '-0.02em',
        }}
      >
        说出你的目的地
      </h2>

      <p className="mt-2 font-serif text-ink-soft text-base leading-relaxed max-w-prose">
        点击下方麦克风,然后说出起点和终点。例如:
        <span className="voice-transcript"> 「从宿舍楼到第一食堂」</span>
        或
        <span className="voice-transcript"> 「去图书馆」</span>。
      </p>

      {/* ── Mic button ─────────────────────────────────────────────────── */}
      <div className="mt-6 flex flex-col items-center text-center">
        <button
          type="button"
          onClick={listening ? onStop : onStart}
          aria-label={ariaLabel}
          aria-pressed={listening}
          aria-disabled={!supported}
          disabled={!supported}
          title={
            !supported
              ? '当前浏览器不支持语音识别,请使用 Chrome 或 Edge,或改用手动选择。'
              : listening
              ? '正在聆听,点击停止'
              : '点击开始语音输入'
          }
          className={[
            'mic-button',
            'touch-target',
            listening ? 'mic-button--listening' : '',
            'rounded-full',
            'flex items-center justify-center',
            'focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-rust',
            'transition-transform duration-150',
            'disabled:opacity-40 disabled:cursor-not-allowed',
          ].join(' ')}
          style={{
            width: 96,
            height: 96,
            minWidth: 96,
            minHeight: 96,
            background: listening ? 'var(--rust)' : 'var(--ink)',
            color: 'var(--paper)',
            border: '2px solid var(--ink)',
            boxShadow: listening
              ? '4px 4px 0 var(--ink)'
              : '4px 4px 0 var(--rust)',
          }}
        >
          {listening ? (
            // Animated sound-wave bars (decorative — the button's aria-label
            // already conveys the listening state).
            <span className="flex items-end gap-1" aria-hidden="true" style={{ height: 24 }}>
              <span className="wave-bar" />
              <span className="wave-bar" />
              <span className="wave-bar" />
            </span>
          ) : (
            // Microphone glyph (decorative).
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.8" />
              <path d="M5 11 a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="12" y1="18" x2="12" y2="21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="8" y1="21" x2="16" y2="21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          )}
        </button>

        <p className="mt-3 font-display font-600 text-ink text-lg">
          {buttonLabel}
        </p>

        {/* Status / live transcript / error — polite live region for AT */}
        <div
          aria-live="polite"
          aria-atomic="true"
          className="mt-2 min-h-[1.5rem] max-w-md"
        >
          {error ? (
            <p className="font-serif text-sm text-rust font-600">{error}</p>
          ) : listening ? (
            interim ? (
              <p className="voice-transcript">
                <span className="station-code mr-2 not-italic">聆听中</span>
                「{interim}」
              </p>
            ) : (
              <p className="font-serif text-sm text-ink-muted italic">
                正在聆听…请说出起点和终点。
              </p>
            )
          ) : lastTranscript ? (
            <p className="voice-transcript">
              <span className="station-code mr-2 not-italic">已识别</span>
              「{lastTranscript}」
            </p>
          ) : (
            <p className="font-serif text-sm text-ink-muted italic">
              点击麦克风开始说话。
            </p>
          )}
        </div>
      </div>

      {/* ── Known places hint ──────────────────────────────────────────── */}
      <details className="mt-6 border-t border-hairline pt-4">
        <summary className="station-code cursor-pointer select-none hover:text-rust transition-colors">
          可识别地点列表 · {places.length} 个
        </summary>
        <ul
          className="mt-3 flex flex-wrap gap-1.5"
          role="list"
          aria-label="可识别地点"
        >
          {places.map((p) => (
            <li
              key={p}
              className="mono text-xs text-ink-soft border border-hairline px-2 py-1 rounded-sm bg-paper-deep/40"
            >
              {p}
            </li>
          ))}
        </ul>
      </details>
    </section>
  )
}
