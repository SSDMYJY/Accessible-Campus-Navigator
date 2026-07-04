/*
 * capture-screenshots.mjs — Playwright script that captures 8 screenshots of
 * the Accessible Campus Navigator demo for the TRAE contest post.
 *
 * Run: node capture-screenshots.mjs
 * (after: npm i -D playwright && npx playwright install chromium)
 *
 * Targets the Vite dev server at http://localhost:5173/. Make sure it's up.
 *
 * Output: /workspace/screenshots/*.png
 *
 * A11y / state notes:
 *   - SpeechRecognition can't actually fire headlessly (no mic audio), so for
 *     the "listening" screenshot we click the mic and capture the listening
 *     state before the 8s auto-stop / no-speech error fires. The pulse halo
 *     + "正在聆听…" text are real DOM states from onstart.
 *   - For the route-tickets screenshots we drive the manual fallback form
 *     (open <details>, select origin/destination, submit) — this is the same
 *     code path the voice intent ultimately triggers, so the resulting cards
 *     are identical to what a voice search would render.
 *   - High-contrast + manual-header states are driven by clicking the real
 *     toggle / disclosure.
 *   - Lighthouse + SW-offline DevTools views can't be rendered by Playwright
 *     (they are browser-UI panels, not page content). For those two we render
 *     an annotated "info card" screenshot instead so the post still has a
 *     visual placeholder; the real DevTools captures should be done manually.
 */
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, 'screenshots')
const URL = process.env.URL || 'http://localhost:5173/'

const VIEWPORT = { width: 1280, height: 900, deviceScaleFactor: 2 }

async function shot(page, name) {
  const path = join(OUT, name)
  await page.screenshot({ path, fullPage: false })
  console.log('  ✓', name)
  return path
}

async function main() {
  await mkdir(OUT, { recursive: true })
  const browser = await chromium.launch({ args: ['--no-sandbox'] })
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    // Grant mic so SpeechRecognition.start() doesn't immediately error on
    // permission — we want the "listening" state to render.
    permissions: ['microphone'],
  })
  const page = await ctx.newPage()
  page.setDefaultTimeout(8000)

  console.log('Loading', URL)
  await page.goto(URL, { waitUntil: 'networkidle' })
  // Let fonts + HMR settle.
  await page.waitForTimeout(800)

  // ── 01. Voice-first default page (Header hidden, mic is the focus) ────
  console.log('1/8  voice-first default page')
  await shot(page, 'screenshot-01-voice-first.png')

  // ── 02. Listening state (mic clicked → pulse + 正在聆听…) ────────────
  console.log('2/8  listening state')
  // The mic button is the large round button in the VoiceInput section.
  const micBtn = page.getByRole('button', { name: /开始语音输入|正在聆听/ })
  if (await micBtn.count()) {
    await micBtn.first().click()
    // Give onstart time to flip listening=true + the pulse halo +声波 animation
    // to render visibly. Lengthened from 700ms to 1500ms so the pulse is
    // mid-cycle (the halo scales 1→1.6 over ~1.2s), giving a more readable
    // capture than catching it at the start of the cycle.
    await page.waitForTimeout(1500)
  }
  await shot(page, 'screenshot-02-listening.png')
  // Stop listening so it doesn't interfere with subsequent steps.
  try {
    const stopBtn = page.getByRole('button', { name: /停止聆听/ })
    if (await stopBtn.count()) await stopBtn.first().click()
    await page.waitForTimeout(300)
  } catch (_) { /* noop */ }

  // ── 03. Route tickets (drive manual fallback: Dormitory → First Canteen)
  console.log('3/8  route tickets after search')
  // Open the manual fallback <details>.
  await page.getByText('手动选择地点 · MANUAL FALLBACK').click()
  await page.waitForTimeout(400)
  // Origin select.
  await page.locator('#origin').selectOption('宿舍楼')
  await page.locator('#destination').selectOption('第一食堂')
  await page.getByRole('button', { name: /查找无障碍路线/ }).first().click()
  // Wait for route tickets to render.
  await page.waitForTimeout(900)
  await shot(page, 'screenshot-03-route-tickets.png')

  // ── 04. Selected route with seal ─────────────────────────────────────
  console.log('4/8  selected route seal')
  // Click the first "选择此路线" button.
  const selectBtn = page.getByRole('button', { name: /选择此路线|已选择此路线/ }).first()
  if (await selectBtn.count()) {
    await selectBtn.click()
    // Seal stamp animation ~0.35s.
    await page.waitForTimeout(600)
  }
  await shot(page, 'screenshot-04-selected-seal.png')

  // ── 05. High contrast mode ───────────────────────────────────────────
  console.log('5/8  high contrast mode')
  // Use the footer HC toggle (always visible).
  const hcToggle = page.getByRole('button', { name: /切换高对比度模式/ }).first()
  if (await hcToggle.count()) {
    await hcToggle.click()
    await page.waitForTimeout(500)
  }
  await shot(page, 'screenshot-05-high-contrast.png')
  // Toggle back off for subsequent shots.
  if (await hcToggle.count()) {
    await hcToggle.click()
    await page.waitForTimeout(400)
  }

  // ── 06. Manual header visible (manual details open → Header rendered) ─
  console.log('6/8  manual header visible')
  // Manual details is already open from step 03; Header should now be visible.
  // Scroll to top so the Header is in frame.
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(400)
  await shot(page, 'screenshot-06-manual-header.png')

  // ── 07. Lighthouse info card (rendered as page content) ──────────────
  console.log('7/8  lighthouse info card')
  await renderInfoCard(page, {
    title: 'Lighthouse · 无障碍审计',
    lines: [
      '类别:Accessibility(无障碍)',
      '预期评分:≥ 95 / 100',
      '',
      '如何复现:',
      '1. npm run build && npm run preview',
      '2. Chrome DevTools → Lighthouse',
      '3. 勾选 Accessibility → Generate report',
      '',
      '已对齐的 WCAG 2.x AA 检查项:',
      '• 语义地标 header/nav/main/footer',
      '• aria-live 双区(polite + assertive)',
      '• aria-pressed / aria-disabled / aria-labelledby',
      '• :focus-visible 锈红描边',
      '• 48dp 触控目标',
      '• 200% 文字缩放无溢出',
      '• 高对比度模式 + prefers-reduced-motion',
    ],
  })
  await shot(page, 'screenshot-07-lighthouse.png')

  // ── 08. Service Worker offline info card ─────────────────────────────
  console.log('8/8  service worker offline info card')
  await renderInfoCard(page, {
    title: 'PWA · Service Worker 离线缓存',
    lines: [
      'manifest.json:display standalone · maskable SVG 图标',
      'service-worker.js:手写,app-shell 预缓存 + SWR',
      '',
      '如何复现离线:',
      '1. npm run build && npm run preview',
      '2. 首次加载 → SW 安装并缓存 app shell',
      '3. DevTools → Application → Service Workers',
      '   可见 /service-worker.js 已 activated',
      '4. Application → Cache Storage → acn-v1',
      '   含 index.html / manifest / icons / hashed bundles',
      '5. DevTools → Network → Offline → 刷新',
      '   应用仍可加载并展示 mock 路线',
    ],
  })
  await shot(page, 'screenshot-08-sw-offline.png')

  await browser.close()
  console.log('\nDone. Screenshots in:', OUT)
}

// Render a plain-text documentation card for screenshots that can't be
// captured programmatically (DevTools panels like Lighthouse / Service Workers
// are browser UI, not page content). This is intentionally NOT a styled
// placeholder — it's a sober, single-column document page with a clear
// "文档说明 · 非截图" header so the post stays honest about what it shows.
async function renderInfoCard(page, { title, lines }) {
  await page.setContent(
    `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=Newsreader:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
      :root{
        --paper:#faf7f1;--ink:#1a1a1a;--ink-soft:#3a3a3a;--ink-muted:#777;
        --hairline:#e0e0e0;
      }
      *{box-sizing:border-box}
      body{margin:0;min-height:100vh;background:var(--paper);
        font-family:'Newsreader',Georgia,serif;color:var(--ink);
        padding:3.5rem 2rem;display:flex;justify-content:center;}
      .doc{max-width:680px;width:100%;}
      .eyebrow{font-family:'JetBrains Mono',monospace;font-size:0.72rem;
        letter-spacing:.16em;text-transform:uppercase;color:var(--ink-muted);
        margin-bottom:.4rem}
      .badge{display:inline-block;font-family:'JetBrains Mono',monospace;
        font-size:0.68rem;letter-spacing:.12em;text-transform:uppercase;
        color:#faf7f1;background:var(--ink);padding:.18rem .55rem;
        border-radius:2px;margin-bottom:1.4rem}
      h1{font-family:'Fraunces',serif;font-weight:700;font-size:1.9rem;
        margin:0 0 1rem;letter-spacing:-.015em;line-height:1.15}
      .lead{font-size:1rem;color:var(--ink-soft);line-height:1.65;
        margin:0 0 1.6rem}
      .rule{height:1px;background:var(--hairline);margin:1.4rem 0}
      pre{font-family:'JetBrains Mono',monospace;font-size:0.8rem;
        line-height:1.75;color:var(--ink-soft);white-space:pre-wrap;
        margin:0}
      .foot{font-family:'JetBrains Mono',monospace;font-size:0.7rem;
        color:var(--ink-muted);margin-top:2rem;letter-spacing:.05em}
    </style></head>
    <body><div class="doc">
      <p class="eyebrow">ACN · 无障碍校园导航</p>
      <span class="badge">文档说明 · 非截图</span>
      <h1>${title}</h1>
      <p class="lead">DevTools 面板(Lighthouse 报告 / Service Workers 视图)属浏览器 UI,无法由自动化脚本捕获。下方为本地复现步骤,请按此操作后手动截取真实面板。</p>
      <div class="rule"></div>
      <pre>${lines.map(escapeHtml).join('\n')}</pre>
      <p class="foot">— 校样 v0.4 · 文档占位</p>
    </div></body></html>`,
    { waitUntil: 'networkidle' }
  )
  await page.waitForTimeout(400)
}
function escapeHtml(s) {
  return String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
