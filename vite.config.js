import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Minimal Vite config.
// - React plugin enables JSX + Fast Refresh in dev.
// - `server.host` exposes the dev server on the LAN (useful in sandboxes / VMs).
// - `preview.host` exposes the production preview server so we can validate the
//   service worker against a real HTTP origin (SW + manifest require http(s)).
// Note: we deliberately do NOT use vite-plugin-pwa here. The user asked for a
// discrete, hand-rolled `public/service-worker.js` so accessibility + caching
// decisions can be heavily commented inline. See that file for details.
export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
})
