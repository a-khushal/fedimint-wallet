import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import wasm from 'vite-plugin-wasm'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), wasm(), tailwindcss()],
  base: "/fedimint-wallet",
  // These worker settings are required
  worker: {
    format: 'es',
    plugins: () => [
      wasm(), // Required for wasm
    ],
  },
  build: {
    target: 'esnext',
    sourcemap: true,
    minify: false,
  },
  optimizeDeps: {
    exclude: ['@fedimint/core-web'],
  },
})
