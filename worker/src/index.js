/*
 * worker/src/index.js — Cloudflare Worker 入口
 *
 * 角色:极简扩展占位。静态资源(HTML/JS/CSS/SVG/manifest/SW)由 Workers
 * Runtime 直接服务(见 wrangler.toml 的 [assets] 绑定),不经过此 Worker。
 *
 * 本 Worker 仅在以下场景被调用:
 *   - 未匹配静态资源的请求(已被 SPA fallback 处理为 /index.html)
 *   - 未来扩展的 /api/* 路由(本次未实现)
 *
 * 因此这里只做一件事:把请求转发给 ASSETS 绑定,保持 fallback 链完整。
 * 如未来需要动态路由(如 /api/routes),在此 if-else 扩展即可。
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    // 未来扩展点示例(本次注释掉,不启用):
    // if (url.pathname.startsWith('/api/')) {
    //   return handleApi(request, env)
    // }

    // 默认:交给静态资源绑定处理(SPA fallback 已在 wrangler.toml 配置)
    return env.ASSETS.fetch(request)
  },
}
