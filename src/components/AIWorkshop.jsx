/**
 * AI 训练工坊。
 *
 * 这一块承担两种职责：
 * 1. 让用户配置 AI 文本模板与难度。
 * 2. 清晰展示当前 AI 草稿是否过期、是否需要重新生成。
 *
 * 这里不直接请求接口，请求动作仍由 store 统一调度。
 */
import { AI_TEMPLATES, DIFFICULTY_OPTIONS } from '../engine';

export function AIWorkshop({
    config,
    currentDraft,
    isGenerating,
    isDraftStale,
    practiceError,
    onConfigChange,
    onGenerate
}) {
    return (
        <section className="panel workshop-panel">
            <div className="panel-head">
                <div>
                    <p className="panel-kicker">AI Workshop</p>
                    <h2>训练工坊</h2>
                </div>
                <span className="panel-badge">自动接入结果页教练诊断</span>
            </div>

            <div className="workshop-grid">
                <label className="field">
                    <span>主题模板</span>
                    <select value={config.aiTemplate} onChange={(event) => onConfigChange({ aiTemplate: event.target.value, source: 'ai' })}>
                        {AI_TEMPLATES.map((template) => (
                            <option key={template.id} value={template.id}>{template.label}</option>
                        ))}
                    </select>
                </label>

                <label className="field">
                    <span>难度</span>
                    <select value={config.difficulty} onChange={(event) => onConfigChange({ difficulty: event.target.value, source: 'ai' })}>
                        {DIFFICULTY_OPTIONS.map((difficulty) => (
                            <option key={difficulty.id} value={difficulty.id}>{difficulty.label}</option>
                        ))}
                    </select>
                </label>
            </div>

            <div className="workshop-summary">
                <div>
                    <p className="summary-label">当前文本</p>
                    <strong>{currentDraft?.sourceTextMeta?.label || '尚未生成'}</strong>
                </div>
                <div>
                    <p className="summary-label">状态</p>
                    <strong>{isDraftStale ? '配置已变化，建议重新生成' : '可以直接开始练习'}</strong>
                </div>
            </div>

            <div className="workshop-actions">
                <button type="button" className="action-btn primary" onClick={onGenerate} disabled={isGenerating}>
                    {isGenerating ? '正在生成训练文本...' : '生成 AI 训练文本'}
                </button>
                {practiceError && <span className="inline-error">{practiceError}</span>}
            </div>
        </section>
    );
}
