/**
 * 练习配置面板。
 *
 * 这是练习页最核心的控制台，负责切换：
 * - 文本来源（标准词库 / AI 训练）
 * - 标点、数字开关
 * - 时间模式 / 词数模式
 * - 时间长度 / 词数规模
 *
 * 组件本身不保存状态，所有配置都交给外层 store 管理。
 */
const timeOptions = [15, 30, 60, 120];
const wordOptions = [10, 25, 50, 100];

export function ConfigPanel({ config, onConfigChange, onUseBuiltin }) {
    return (
        <section className="config-shell">
            <div className="config-bar">
                <div className="config-group">
                    <button
                        type="button"
                        className={`config-btn ${config.source === 'builtin' ? 'active' : ''}`}
                        onClick={() => onUseBuiltin()}
                    >
                        标准词库
                    </button>
                    <button
                        type="button"
                        className={`config-btn ${config.source === 'ai' ? 'active' : ''}`}
                        onClick={() => onConfigChange({ source: 'ai' })}
                    >
                        AI 训练
                    </button>
                </div>

                <div className="config-separator" />

                <div className="config-group">
                    <button
                        type="button"
                        className={`config-btn ${config.includePunctuation ? 'active' : ''}`}
                        onClick={() => onConfigChange({ includePunctuation: !config.includePunctuation })}
                    >
                        @ 标点
                    </button>
                    <button
                        type="button"
                        className={`config-btn ${config.includeNumbers ? 'active' : ''}`}
                        onClick={() => onConfigChange({ includeNumbers: !config.includeNumbers })}
                    >
                        # 数字
                    </button>
                </div>

                <div className="config-separator" />

                <div className="config-group">
                    <button
                        type="button"
                        className={`config-btn ${config.mode === 'time' ? 'active' : ''}`}
                        onClick={() => onConfigChange({ mode: 'time' })}
                    >
                        ⏱ 时间
                    </button>
                    <button
                        type="button"
                        className={`config-btn ${config.mode === 'words' ? 'active' : ''}`}
                        onClick={() => onConfigChange({ mode: 'words' })}
                    >
                        📝 单词
                    </button>
                </div>

                <div className="config-separator" />

                {config.mode === 'time' ? (
                    <div className="config-group">
                        {timeOptions.map((value) => (
                            <button
                                key={value}
                                type="button"
                                className={`config-btn ${config.durationSeconds === value ? 'active' : ''}`}
                                onClick={() => onConfigChange({ durationSeconds: value })}
                            >
                                {value}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="config-group">
                        {wordOptions.map((value) => (
                            <button
                                key={value}
                                type="button"
                                className={`config-btn ${config.wordCount === value ? 'active' : ''}`}
                                onClick={() => onConfigChange({ wordCount: value })}
                            >
                                ~{value}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
