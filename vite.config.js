import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true, // expose on LAN so phones / tablets on the same Wi-Fi can connect
    open: true,
  },
  preview: {
    port: 3000,
    host: true,
  },
});
