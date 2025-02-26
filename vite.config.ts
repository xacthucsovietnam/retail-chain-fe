import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://app.xts.vn',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, '/dungbaby-service/hs/apps/execute/xts'),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.error('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            proxyReq.setHeader('Accept', '*/*');
            proxyReq.setHeader('Accept-Encoding', 'gzip, deflate, br, zstd');
            proxyReq.setHeader('Accept-Language', 'en-US,en;q=0.9,vi;q=0.8,vi-VN;q=0.7');
            proxyReq.setHeader('Content-Type', 'text/plain;charset=UTF-8');
            proxyReq.setHeader('Origin', 'https://cool-clafoutis-0474e4.netlify.app');
            proxyReq.setHeader('Referer', 'https://cool-clafoutis-0474e4.netlify.app/');
            proxyReq.setHeader('Priority', 'u=1, i');
            proxyReq.setHeader('Sec-Fetch-Dest', 'empty');
            proxyReq.setHeader('Sec-Fetch-Mode', 'cors');
            proxyReq.setHeader('Sec-Fetch-Site', 'cross-site');
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Response Status:', proxyRes.statusCode);
          });
        },
      },
    },
  },
})