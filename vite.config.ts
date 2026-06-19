import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { powerApps } from '@microsoft/power-apps-vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    powerApps()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    watch: {
      // The AL extension lives in bc-extension/; its compiled .app / .alpackages
      // get locked by the AL tooling and crash Vite's file watcher (EBUSY).
      ignored: ["**/bc-extension/**"],
    },
  },
})
