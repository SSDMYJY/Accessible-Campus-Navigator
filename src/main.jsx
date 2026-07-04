/*
 * main.jsx — React 18 entry point.
 *
 * Equivalent to "app.js" in a vanilla JS project: this is where the application
 * boots. The rest of the React tree lives under src/ (App.jsx, components/,
 * hooks/, data/). See the plan file for the full file-structure mapping.
 *
 * a11y notes:
 *   - React.StrictMode intentionally double-invokes effects in dev to surface
 *     bugs. It does not affect production rendering or screen-reader behavior.
 *   - We import the a11y stylesheet AFTER Tailwind so our focus-ring and
 *     high-contrast overrides win the cascade where needed.
 */
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles/a11y.css'
import './sw-register.js'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
