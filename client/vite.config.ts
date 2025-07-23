import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig(async ({ command }) => ({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    host: true,
    port: 3000,
    fs: {
      allow: ['..']
    },
    proxy: {
      '/health': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        ws: true,
        rewrite: (path) => path,
        configure: (proxy, _options) => {
          proxy.on('error', (err, req, res) => {
            console.log('proxy error', err);
            if (!res.writableEnded) {
              res.writeHead(500, {
                'Content-Type': 'application/json',
              });
              res.end(JSON.stringify({ 
                error: 'Proxy Error', 
                message: 'Server is starting, please try again in a moment' 
              }));
            }
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response:', proxyRes.statusCode, req.url);
          });
        },
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, req, res) => {
            console.log('WebSocket proxy error', err);
          });
          proxy.on('proxyReqWs', (proxyReq, req, _res) => {
            console.log('WebSocket Request:', req.url);
          });
        },
      },
    },
    strictPort: false,
    cors: true,
    hmr: {
      host: '0.0.0.0',
      clientPort: 443
    },
    watch: {
      usePolling: true,
    },
  },
  define: {
    global: 'globalThis',
  },
}));