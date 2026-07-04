<div align="center"><h1>软件开发赛道 + 无障碍校园导航 (Accessible Campus Navigator)</h1></div>

【类别】TRAE AI 创造力大赛 - 初赛专区

【标签】#AI编程 #TRAE #软件开发 #无障碍 #PWA #CloudflareWorkers #WebSpeechAPI

【标题】软件开发赛道 + 无障碍校园导航 (Accessible Campus Navigator)

### 1. Demo 简介

**无障碍校园导航** 是一款专为视障与行动不便用户设计的 Progressive Web App,在校园地点之间查找安全、无台阶、有坡道/电梯/盲道等无障碍设施的路线。

核心亮点:
- 🎙️ **语音优先**:用户点进程序首屏即看到麦克风按钮,说一句"从宿舍楼到第一食堂"即可自动识别意图并查询路线;无法识别时可手动选择地点兜底。
- ♿ **WCAG 2.x AA 全栈无障碍**:语义化 HTML 地标、双 `aria-live` 区域(polite 状态 + assertive 错误)、`aria-pressed` 状态、`:focus-visible` 键盘焦点环、48dp 最小触控目标、200% 文字缩放可生存、`prefers-reduced-motion` 与 `prefers-contrast` 系统级偏好自动响应。
- 🎨 **"Editorial Cartographer" 视觉语言**:暖色奶油纸背景 + 深墨蓝主色 + 信号锈红 + 森林绿无障碍正指标;Fraunces / Newsreader / JetBrains Mono 三字体搭配,票据式卡片排版,模拟老式地图册质感。
- 📲 **可离线 PWA**:手写 `service-worker.js`,app-shell 预缓存 + cache-first + Tailwind CDN stale-while-revalidate,断网仍可用。
- ☁️ **Cloudflare Workers 部署**:基于 2024 原生 Workers Static Assets + SPA fallback,边缘 CDN 加速,`_headers` 统一注入 PWA 必需响应头(`Service-Worker-Allowed: /`、`immutable` 长缓存、安全头)。

### 2. Demo 创作思路

**痛点**:校园动辄占地数百亩,台阶、施工区、坡道缺失让轮椅用户和视障同学每学期都要重新"探索"安全路径;而主流地图 App 既不区分无障碍属性,语音交互在阳光下也难以看清屏幕。

**设计思路**:
1. **语音 > 触控** —— 视障用户根本看不见下拉框。把 Web Speech API 的 `webkitSpeechRecognition`(zh-CN)做成首屏唯一焦点,识别"从 X 到 Y"/"去 Y"两种自然句式,中文意图解析器 `parseRouteIntent` 直接产出可执行的起终点。
2. **可降级兜底** —— 识别失败或浏览器不支持时,展开 `<details>` 手动选择,`aria-live` 同步播报状态,绝不留死路。
3. **状态单源** —— `manualOpen`、`highContrast` 等关键状态全部提升到 `App.jsx`,Header 与 Footer 的 HC 开关不再各自维护 useState 而失同步(这是早期迭代踩过的坑)。
4. **样式与逻辑分离** —— Tailwind 负责布局/间距,自写 `a11y.css` 负责焦点环、触控目标、HC 覆盖,保证 utility class 变动时 a11y 规则不丢。

**技术选型**:React 18 + Vite 5(快、PWA 友好)+ Tailwind Play CDN(零构建配置)+ 手写 SW(用户明确要求"独立的、可重度注释的 service-worker.js")+ Web Speech API(双 API:`SpeechRecognition` 输入 + `speechSynthesis` 播报)+ Cloudflare Workers Static Assets(零 KV、原生 SPA fallback、边缘加速)。

### 3. Demo 体验地址

🌐 在线体验(**待补充部署后 URL**):
部署命令已就绪,执行 `npm run deploy` 后会得到形如
`https://accessible-campus-navigator.<你的子域>.workers.dev` 的地址。

📦 GitHub 仓库: [https://github.com/SSDMYJY/Accessible-Campus-Navigator/](https://github.com/SSDMYJY/Accessible-Campus-Navigator/)

📋 本地预览:
```bash
npm install
npm run build && npm run preview   # 测试 PWA + SW
# 或
npm run cf:dev                     # 用 wrangler 本地模拟 Workers 环境
```

### 4. TRAE 实践过程

整个 Demo 从 0 到部署就绪,全程在 TRAE 中完成,涵盖 **需求 → 编码 → 美化 → 重构 → 部署** 五个环节:

1. **需求与脚手架**:用 `/plan` 让 TRAE 基于无障碍规格书产出可执行计划(文件结构、a11y 决策表、验证清单),生成 React + Vite + 手写 SW 的完整骨架。
2. **本地化**:把 UI 全量翻译为 zh-CN,代码注释保持英文工程惯例。
3. **视觉重构**:调用 `frontend-design` skill,落地"Editorial Cartographer"美学,引入 Fraunces / Newsreader / JetBrains Mono 与票据卡片。
4. **交互重构**:按"用户点进程序就要看到说话按钮"的反馈,移除 Hero、把 VoiceInput 推到首屏首位;再按"Header 默认不可见"反馈,把 Header 渲染与 `manualOpen` 状态绑定,同时把高对比度开关下沉到 Footer 永久可见——HC 状态提升到 App.jsx 单源。
5. **部署适配**:用 `/plan` 生成 Cloudflare Workers 适配方案,新建 `wrangler.toml` / `worker/src/index.js` / `public/_headers`,扩展 `package.json` 部署脚本,`npm run deploy:dry` 校验通过。

> 💡 **踩坑经历 & 心得**
>
> **坑 1:wrangler 报 "Cannot use assets with a binding in an assets-only Worker"**
> 初版 `wrangler.toml` 没写 `main = "worker/src/index.js"`,wrangler 默认按"纯静态资源 Worker"处理,而纯静态模式下禁止 `binding = "ASSETS"`。补上 `main` 字段后,wrangler 改按"Worker-with-assets"处理,既能服务静态资源、又能让 Worker 通过 `env.ASSETS.fetch(request)` 介入。`deploy:dry` 立即通过。
>
> **坑 2:HC 状态在 Header 与 Footer 之间失同步**
> 早期 Header 和 Footer 各自调用 `useHighContrast` hook,内部各自 `useState`,结果两个开关各管各的。重构方案:把 `highContrast` 与 `toggleHighContrast` 提升到 `App.jsx`,通过 props 下发——单一数据源,问题根治。
>
> **坑 3:沙箱里 Playwright/Chromium 装不上**
> 想给帖子配 8 张自动截图,但沙箱网络封锁了 Chrome-for-Testing CDN 与 `npx playwright install`,scrot / gnome-screenshot 也都不可用。最终写了 `capture-screenshots.mjs` 脚本交付,留给用户在本地执行——这本身也是 TRAE 协作流的真实一幕:**AI 不掩盖自己的局限,把可复用脚本留给人类补位**。
>
> **心得**:TRAE 最适合这种"规格驱动 + 迭代式重构"的工作流——先用 plan 锁定决策表与文件结构,再在每一轮反馈里小步重构(状态提升、组件裁剪、部署适配),每一步都有可验证的产物(build 通过、dry-run 通过)。Plan 模式 + NotifyUser 审阅点,让 AI 不会"自作主张"地大改。

---
📎 可配图素材(本次沙箱未生成 PNG,建议本地补齐):

1. **首屏语音按钮截图** — 帖子头图,展示 Editorial Cartographer 视觉 + 中央 96×96 麦克风按钮
2. **语音识别中状态** — 展示 pulse halo 动画与 interim 实时转写
3. **路线卡片列表** — 展示票据式卡片 + 无障碍设施徽章 + `<ol>` 步骤
4. **选中路线 + 语音播报** — 展示 `aria-pressed` 状态与播报中视觉反馈
5. **手动选择兜底** — 展开 `<details>` 后 Header 显现 + 下拉框 + 表单
6. **高对比度模式开** — 展示黑底黄字青链接的 HC 覆盖效果
7. **200% 文字缩放** — 展示布局在放大后仍无横向滚动
8. **DevTools Application 面板** — 展示 manifest + service worker + cache storage `acn-v1`,证明 PWA 合规

> 本地生成命令:`node capture-screenshots.mjs`(需先 `npm run build && npm run preview`)
