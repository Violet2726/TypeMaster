/**
 * Vite 配置。
 *
 * 当前目标很明确：
 * - React 前端开发体验
 * - 本地开发时把 `/api` 代理到 Node 服务
 * - 预览和开发都监听 0.0.0.0，方便局域网调试
 * - 性能优化：代码分割、构建优化
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import analyzer from 'vite-bundle-analyzer';

export default defineConfig({
    plugins: [
        react(),
        analyzer({
            analyzerMode: 'disabled', // 只在需要时开启 'server' 或 'static'
            openAnalyzer: false
        })
    ],
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
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('react') && !id.includes('react-router')) {
                            return 'react-vendor';
                        }
                        if (id.includes('react-router')) {
                            return 'router-vendor';
                        }
                        return 'vendor';
                    }
                }
            }
        },
        target: 'es2020',
        minify: 'esbuild',
        cssMinify: true,
        chunkSizeWarningLimit: 1000
    }
});
