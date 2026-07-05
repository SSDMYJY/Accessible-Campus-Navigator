/*
 * App.jsx — root component for the Accessible Campus Navigator.
 *
 * AESTHETIC: "Editorial Cartographer" — unchanged from v2.
 *
 * INTERACTION MODEL (v4 — voice-first, chrome-less default)
 *   Per user request, the top Header is HIDDEN on the default voice page so
 *   the mic button is the absolute focus. The Header (with its controls)
 *   appears only when the user opens the "手动选择地点" fallback — i.e. when
 *   they explicitly opt into manual mode. This keeps the voice experience
 *   maximally focused.
 *
 *   To preserve access to the High-Contrast toggle (a critical a11y control
 *   that must NOT disappear when the Header is hidden), a compact HC toggle
 *   is rendered in the footer at all times.
 *
 *   Voice flow is unchanged: mic → recognize → parse → auto-search.
 *
 * LANDMARK STRATEGY (WCAG 1.3.1 / 2.4.1)
 *   <main> and <footer> are always present. <header> is conditionally
 *   rendered — when absent, <main> is the first landmark, which is fine.
 *   The skip link still targets <main id="main" tabIndex="-1">.
 */
import { useCallback, useMemo, useState } from 'react'
import Header from './components/Header.jsx'
import RouteFinder from './components/RouteFinder.jsx'
import GuidedNavigator from './components/GuidedNavigator.jsx'
import SettingsPopover from './components/SettingsPopover.jsx'
import AriaLiveRegion from './components/AriaLiveRegion.jsx'
import { ROUTES } from './data/routes.js'
import { parseRouteIntent, describeParseResult } from './data/parseIntent.js'
import { useSpeech } from './hooks/useSpeech.js'
import { useSpeechRecognition } from './hooks/useSpeechRecognition.js'
import { useHighContrast } from './hooks/useHighContrast.js'
import { useRecentSearches } from './hooks/useRecentSearches.js'
import { useVoiceSettings } from './hooks/useVoiceSettings.js'

export default function App() {
  const [matchedRoutes, setMatchedRoutes] = useState([])
  const [activeRouteId, setActiveRouteId] = useState(null)
  const [statusMsg, setStatusMsg] = useState('欢迎使用。点击麦克风说出你的目的地,例如:从宿舍楼到第一食堂。')
  const [errorMsg, setErrorMsg] = useState('')
  const [lastTranscript, setLastTranscript] = useState('')
  // manualOpen controls BOTH the <details> disclosure in RouteFinder AND the
  // visibility of the top Header. Default false = voice-first, chrome-less.
  const [manualOpen, setManualOpen] = useState(false)
  // When set, the GuidedNavigator overlay is rendered for this route.
  const [navigatingRouteId, setNavigatingRouteId] = useState(null)

  const { settings, update: updateVoiceSettings, reset: resetVoiceSettings } = useVoiceSettings()
  // Pass the persisted rate/pitch into useSpeech so changes take effect on
  // the very next utterance without needing to recreate the hook's consumers.
  const speech = useSpeech({ rate: settings.rate, pitch: settings.pitch })
  const [highContrast, toggleHighContrast] = useHighContrast()
  const { recent, addRecent, clearRecent } = useRecentSearches()

  // Unique sorted list of place names — used by the intent parser AND shown
  // in the VoiceInput "known places" hint.
  const places = useMemo(() => {
    const set = new Set()
    ROUTES.forEach((r) => {
      set.add(r.origin)
      set.add(r.destination)
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [])

  const activeRoute = useMemo(
    () => matchedRoutes.find((r) => r.id === activeRouteId) || null,
    [matchedRoutes, activeRouteId]
  )

  const handleSearch = useCallback((origin, destination) => {
    setErrorMsg('')
    const results = ROUTES.filter(
      (r) =>
        r.origin.toLowerCase() === origin.toLowerCase() &&
        r.destination.toLowerCase() === destination.toLowerCase()
    )
    setMatchedRoutes(results)
    setActiveRouteId(null)
    if (results.length === 0) {
      setStatusMsg('未找到符合条件的无障碍路线。')
      setErrorMsg(`在「${origin}」与「${destination}」之间未找到无障碍路线,请尝试其他地点。`)
    } else {
      setStatusMsg(`已找到 ${results.length} 条无障碍路线,从 ${origin} 到 ${destination}。`)
      // Persist the successful query so the user can re-run it later from
      // the "最近搜索" rail. Only successful searches are worth remembering.
      addRecent(origin, destination)
    }
  }, [addRecent])

  const handleSelectRoute = useCallback((route) => {
    setActiveRouteId(route.id)
    setStatusMsg(`已选择路线:从 ${route.origin} 到 ${route.destination}。`)
  }, [])

  const handleAnnounce = useCallback((route) => {
    const text =
      `路线:从 ${route.origin} 到 ${route.destination}。` +
      `距离 ${route.distanceMeters} 米,约 ${route.estMinutes} 分钟。` +
      `无障碍设施:${route.features.join('、')}。` +
      `导航步骤:${route.steps.join('。')}。` +
      (route.safetyNote ? `安全提示:${route.safetyNote}` : '')
    speech.speak(text)
    setStatusMsg(`正在播报路线:从 ${route.origin} 到 ${route.destination}。`)
  }, [speech])

  // Open the GuidedNavigator overlay for a route. Also marks the route as
  // selected so the underlying ticket shows the "已选" seal while the user
  // is navigating it.
  const handleNavigate = useCallback((route) => {
    setActiveRouteId(route.id)
    setNavigatingRouteId(route.id)
    setStatusMsg(`开始引导导航:从 ${route.origin} 到 ${route.destination}。`)
  }, [])

  const handleCloseNavigation = useCallback(() => {
    setNavigatingRouteId(null)
    setStatusMsg('已退出引导导航。')
  }, [])

  const navigatingRoute = useMemo(
    () => matchedRoutes.find((r) => r.id === navigatingRouteId) || null,
    [matchedRoutes, navigatingRouteId]
  )

  // Retry a recent search — used by the RecentSearches chip rail.
  const handleRetryRecent = useCallback((origin, destination) => {
    handleSearch(origin, destination)
  }, [handleSearch])

  // ── Voice intent pipeline ─────────────────────────────────────────────
  // Called by useSpeechRecognition when a final transcript is available.
  const handleVoiceResult = useCallback((transcript) => {
    setLastTranscript(transcript)
    const result = parseRouteIntent(transcript, places)
    const description = describeParseResult(result)
    setStatusMsg(description)
    setErrorMsg('')

    if (result.ok) {
      // Speak the parse confirmation so low-vision users get audible feedback
      // that their speech was understood, then run the search.
      speech.speak(description)
      handleSearch(result.origin, result.destination)
    } else if (result.reason === 'only-destination') {
      // Only a destination was recognized — nudge the user to also say the
      // origin. We don't search yet.
      speech.speak(description)
    } else if (result.reason === 'no-match') {
      setErrorMsg(description)
    }
    // reason === 'empty' → just the status message, no error.
  }, [places, speech, handleSearch])

  const recognition = useSpeechRecognition({ onFinalResult: handleVoiceResult })

  return (
    <div className="min-h-screen flex flex-col">
      {/*
        HEADER — conditionally rendered.
        Hidden on the default voice page so the mic button is the absolute
        focus. Appears only when the user opens the manual fallback
        (manualOpen === true), at which point the full masthead + controls
        (title, HC toggle, announce button) become visible.
      */}
      {manualOpen && (
        <Header
          onAnnounce={activeRoute ? () => handleAnnounce(activeRoute) : null}
          speech={speech}
          highContrast={highContrast}
          onToggleHighContrast={toggleHighContrast}
        />
      )}

      {/*
        MAIN — Voice-first entry.
        The VoiceInput (mic button) is the FIRST thing visible on load. The
        VoiceInput component carries the page title ("说出你的目的地") and the
        prompt copy, so no separate hero or header is needed by default.
      */}
      <main
        id="main"
        tabIndex="-1"
        className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-8 outline-none"
      >
        <RouteFinder
          routes={ROUTES}
          matchedRoutes={matchedRoutes}
          onSearch={handleSearch}
          onSelectRoute={handleSelectRoute}
          onAnnounceRoute={handleAnnounce}
          onNavigateRoute={handleNavigate}
          activeRouteId={activeRouteId}
          places={places}
          manualOpen={manualOpen}
          onManualOpenChange={setManualOpen}
          voice={{
            supported: recognition.supported,
            listening: recognition.listening,
            interim: recognition.interim,
            error: recognition.error,
            lastTranscript,
            onStart: recognition.start,
            onStop: recognition.stop,
          }}
          recent={recent}
          onRetryRecent={handleRetryRecent}
          onClearRecent={clearRecent}
        />
      </main>

      <footer className="border-t-2 border-ink bg-paper-deep/60 mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
          <div className="grid sm:grid-cols-[1fr_auto_auto_auto] gap-4 items-end">
            <div>
              <p className="station-code">版权页 · COLOPHON</p>
              <p className="mt-2 font-serif text-ink-soft text-sm leading-relaxed max-w-prose">
                无障碍校园导航 —— 一款示例 PWA。所示路线为演示用模拟数据。
                设计遵循 WCAG 2.x AA,支持语音输入、键盘导航、屏幕阅读器、高对比度与 200% 文字缩放。
              </p>
            </div>

            {/*
              Compact High-Contrast toggle — ALWAYS visible in the footer so the
              a11y control remains reachable even when the top Header is hidden
              on the default voice page. Same aria-pressed semantics as the
              Header version.
            */}
            <button
              type="button"
              onClick={toggleHighContrast}
              aria-pressed={highContrast}
              aria-label="切换高对比度模式"
              title="切换高对比度模式"
              className="badge-button touch-target"
            >
              <span aria-hidden="true">{highContrast ? '◐' : '◑'}</span>
              <span>{highContrast ? '高对比度:开' : '高对比度:关'}</span>
            </button>

            <a
              href="mailto:accessibility@example.edu"
              className="badge-button touch-target"
            >
              <span aria-hidden="true">✎</span>
              反馈
            </a>

            {/*
              Voice settings popover — always visible in the footer so the
              TTS rate / pitch / auto-announce defaults are reachable even
              when the top Header is hidden on the default voice page.
            */}
            <SettingsPopover
              settings={settings}
              onUpdate={updateVoiceSettings}
              onReset={resetVoiceSettings}
              speech={speech}
            />
          </div>
          <hr className="rule-cartographic decorative-only mt-6" />
          <p className="mt-4 mono text-xs text-ink-muted">
            排版 Fraunces · Newsreader · JetBrains Mono 　·　 校样 v0.5
          </p>
        </div>
      </footer>

      <AriaLiveRegion status={statusMsg} error={errorMsg} />

      {/*
        Guided step-by-step navigation overlay.
        Rendered only when the user has tapped "开始引导导航" on a route.
        Implemented as a native <dialog> so it gets focus trap + ESC-to-close
        + top-layer rendering for free. The dialog itself lives inside
        GuidedNavigator.jsx; we just gate its rendering here.
      */}
      {navigatingRoute && (
        <GuidedNavigator
          route={navigatingRoute}
          speech={speech}
          onClose={handleCloseNavigation}
          initialAutoAnnounce={settings.autoAnnounceSteps}
        />
      )}
    </div>
  )
}
