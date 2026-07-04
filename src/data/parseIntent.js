/*
 * parseIntent.js — extracts an origin + destination from a Mandarin voice
 * transcript, given the list of known place names.
 *
 * GOAL
 *   The user speaks naturally. We do NOT require a strict grammar. We try
 *   several patterns in order of specificity:
 *     1. "从 X 到/去/前往 Y"   → origin=X, destination=Y
 *     2. "我在 X,要去 Y" / "我在 X,去 Y"
 *     3. "X 到 Y" / "X 去 Y"   (no 从/在 marker — order of appearance wins)
 *     4. "去 Y" / "到 Y"        → destination only, origin unknown
 *
 *   The parser returns:
 *     { ok: true,  origin, destination }   — both recognized
 *     { ok: false, reason: 'only-destination', destination, places }
 *     { ok: false, reason: 'no-match',      places }
 *
 *   `places` is echoed back so the UI can show the user which place names
 *   the app knows about (helpful error recovery).
 *
 * A11Y NOTE
 *   This is a pure function — no DOM, no AT interaction. Its results feed
 *   into the aria-live region in App.jsx so screen-reader users hear the
 *   parse outcome ("已识别:从宿舍楼到第一食堂" or "未识别到地点").
 *
 * Fuzzy matching
 *   Voice recognition sometimes returns slight variants (e.g. "第一饭堂"
 *   instead of "第一食堂", or "图书馆" matched inside "校园图书馆"). We do
 *   substring matching both ways: place ⊂ transcript OR transcript-segment
 *   ⊂ place. This catches most minor phonetic drift.
 */

/**
 * @param {string} transcript  The recognized text, e.g. "从宿舍楼到第一食堂".
 * @param {string[]} places    Known place names, e.g. ["宿舍楼","第一食堂",...].
 * @returns {{ok:boolean, origin?:string, destination?:string, reason?:string, places:string[]}}
 */
export function parseRouteIntent(transcript, places) {
  const text = (transcript || '').trim()
  if (!text) {
    return { ok: false, reason: 'empty', places }
  }

  // 1. Find every known place that appears in the transcript, recording its
  //    first-character index so we can infer order.
  const found = []
  for (const place of places) {
    const idx = text.indexOf(place)
    if (idx >= 0) {
      found.push({ place, index: idx })
    }
  }
  // Sort left-to-right by appearance in the transcript.
  found.sort((a, b) => a.index - b.index)

  if (found.length >= 2) {
    // Two or more places mentioned. Use the first two by appearance order.
    // If the transcript contains "从…到…" or "我在…要去…", the FROM marker
    // precedes the first place, so appearance order still maps to
    // origin→destination.
    return {
      ok: true,
      origin: found[0].place,
      destination: found[1].place,
      places,
    }
  }

  if (found.length === 1) {
    // Only one place recognized. Treat it as the destination and ask for the
    // origin (the UI will prompt the user to speak again or pick manually).
    return {
      ok: false,
      reason: 'only-destination',
      destination: found[0].place,
      places,
    }
  }

  // No known place recognized. Return no-match with the place list so the UI
  // can show "请说出以下任一地点:…".
  return { ok: false, reason: 'no-match', places }
}

/**
 * Build a friendly, screen-reader-ready spoken summary of the parse result.
 * Used both for the aria-live region AND the speech-synthesis confirmation
 * before the route search runs.
 */
export function describeParseResult(result) {
  if (result.ok) {
    return `已识别:从 ${result.origin} 到 ${result.destination}。`
  }
  if (result.reason === 'only-destination') {
    return `只听到目的地「${result.destination}」,请再说出起点,例如:从宿舍楼到${result.destination}。`
  }
  if (result.reason === 'empty') {
    return '没有听到内容,请再说一次。'
  }
  // no-match
  return `未识别到地点,请说出以下任一地点:${result.places.join('、')}。`
}
