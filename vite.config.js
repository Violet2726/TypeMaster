/**
 * Vite 配置。
 *
 * 当前目标很明确：
 * - React 前端开发体验
 * - 本地开发时把 `/api` 代理到 Node 服务
 * - 预览和开发都监听 0.0.0.0，方便局域网调试
 * - 性能优化：代码分割、压缩优化、tree-shaking
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
        // 使用 esbuild 压缩（Vite 默认，速度更快）
        minify: 'esbuild',
        esbuild: {
            // 生产环境移除 console
            drop: ['console', 'debugger'],
            target: 'es2020'
        },
        target: 'es2020',
        // 代码分割策略
        rollupOptions: {
            output: {
                manualChunks: (id) => {
                    if (id.includes('node_modules')) {
                        if (id.includes('react-router')) {
                            return 'router-vendor';
                        }
                        if (id.includes('react') || id.includes('react-dom')) {
                            return 'react-vendor';
                        }
                        return 'vendor';
                    }
                }
            }
        },
        // 禁用 sourcemap 减小体积
        sourcemap: false,
        // 压缩报告
        reportCompressedSize: true,
        // 启用更 aggressive 的 tree shaking
        treeshake: true
    }
});
