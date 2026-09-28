import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: './', // <-- THIS IS THE CRITICAL FIX FOR THE WHITE SCREEN
  plugins: [
    react(),
    tailwindcss(),
  ],
});