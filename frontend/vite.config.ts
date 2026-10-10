import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss(), tsconfigPaths()],
    server: {
      // In dev the SPA runs on Vite; /api is forwarded to the Go backend.
      proxy: {
        '/api': env.VITE_BACKEND_URL || 'http://localhost:8080',
      },
    },
  };
});
