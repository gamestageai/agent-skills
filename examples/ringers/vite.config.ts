import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Relative, because the playground serves a game under /games/<id>/ and a
  // local `gamestage dev --serve` serves it at the root.
  base: './',
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('.', import.meta.url)) },
  },
  // Our own, empty. Without it Vite walks up to the gamestage repo's
  // postcss.config.mjs, which needs Tailwind, and the build works only in a
  // checkout that happens to have the repo's node_modules installed.
  css: { postcss: {} },
})
