import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// This file tells the build tool to treat the code as a React app
export default defineConfig({
  plugins: [react()],
})