import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { opencodeMonitor } from './server/monitor.ts'

export default defineConfig({
  plugins: [react(), tailwindcss(), opencodeMonitor()],
  server: { port: 5173, strictPort: true },
})
