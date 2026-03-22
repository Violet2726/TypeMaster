/**
 * 前端应用入口。
 *
 * 这里只做两件事：
 * 1. 加载全局样式。
 * 2. 把 React 应用挂载到 `#root`。
 *
 * 所有业务初始化都放在 App 内部，避免入口文件承担过多职责。
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '../index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
