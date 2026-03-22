/**
 * 全局设置抽屉。
 *
 * 目前管理的都是前端本地设置：
 * - 主题
 * - 字号
 * - 专注模式
 * - 音效开关占位
 *
 * 这里暂时不接账号体系，因此所有改动都只会进入本地存储。
 */
export function SettingsDrawer({ isOpen, settings, onClose, onChange }) {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="settings-overlay" role="presentation" onClick={onClose}>
            <aside
                className="settings-drawer"
                role="dialog"
                aria-modal="true"
                aria-label="设置"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="panel-head">
                    <div>
                        <p className="panel-kicker">Workspace</p>
                        <h2>设置中心</h2>
                    </div>
                    <button type="button" className="ghost-btn" onClick={onClose}>关闭</button>
                </div>

                <div className="settings-grid">
                    <label className="field">
                        <span>主题</span>
                        <select value={settings.theme} onChange={(event) => onChange({ theme: event.target.value })}>
                            <option value="serika-dark">Serika Dark</option>
                            <option value="serika-light">Serika Light</option>
                        </select>
                    </label>

                    <label className="field">
                        <span>字号密度</span>
                        <select value={settings.fontScale} onChange={(event) => onChange({ fontScale: event.target.value })}>
                            <option value="sm">紧凑</option>
                            <option value="md">标准</option>
                            <option value="lg">舒展</option>
                        </select>
                    </label>

                    <label className="toggle-field">
                        <span>专注模式</span>
                        <button
                            type="button"
                            className={`toggle-btn ${settings.focusMode ? 'active' : ''}`}
                            onClick={() => onChange({ focusMode: !settings.focusMode })}
                        >
                            {settings.focusMode ? '已开启' : '已关闭'}
                        </button>
                    </label>

                    <label className="toggle-field">
                        <span>音效占位</span>
                        <button
                            type="button"
                            className={`toggle-btn ${settings.soundEffects ? 'active' : ''}`}
                            onClick={() => onChange({ soundEffects: !settings.soundEffects })}
                        >
                            {settings.soundEffects ? '已开启' : '已关闭'}
                        </button>
                    </label>
                </div>
            </aside>
        </div>
    );
}
