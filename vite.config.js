/**
 * Vite 配置。
 *
 * 当前目标很明确：
 * - React 前端开发体验
 * - 本地开发时把 `/api` 代理到 Node 服务
 * - 预览和开发都监听 0.0.0.0，方便局域网调试
 * - 优化 bundle 体积优化，减少首屏加载时间
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        host: '0.0.0.0',
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true
            }
        }
    },
    preview: {
        host: '0.0.0.0',
        port: 4173
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'react-vendor': ['react', 'react-dom'],
                    'router-vendor': ['react-router-dom'],
                },
            },
        },
    },
    chunkSizeWarningLimit: 1000,
});
