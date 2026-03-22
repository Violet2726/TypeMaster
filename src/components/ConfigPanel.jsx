const timeOptions = [15, 30, 60, 120];
const wordOptions = [10, 25, 50, 100];

function SegmentedButton({ active, children, onClick }) {
    return (
        <button
            type="button"
            className={`segment-btn ${active ? 'active' : ''}`}
            onClick={onClick}
        >
            {children}
        </button>
    );
}

export function ConfigPanel({ copy, config, onConfigChange }) {
    return (
        <section className="panel workspace-card">
            <div className="panel-head">
                <div>
                    <p className="panel-kicker">{copy.practice.pageTitle}</p>
                    <h2>{copy.practice.configTitle}</h2>
                </div>
            </div>

            <p className="muted-text">{copy.practice.configBody}</p>

            <div className="control-group">
                <div className="control-label-row">
                    <span className="control-label">{copy.practice.sourceTitle}</span>
                </div>
                <div className="segmented-group">
                    <SegmentedButton active={config.source === 'ai'} onClick={() => onConfigChange({ source: 'ai' }, { risky: true, intent: 'config' })}>
                        {copy.practice.sourceAi}
                    </SegmentedButton>
                    <SegmentedButton active={config.source === 'builtin'} onClick={() => onConfigChange({ source: 'builtin' }, { risky: true, intent: 'config' })}>
                        {copy.practice.sourceBuiltin}
                    </SegmentedButton>
                </div>
            </div>

            <div className="control-group">
                <div className="control-label-row">
                    <span className="control-label">{copy.practice.modeTitle}</span>
                </div>
                <div className="segmented-group">
                    <SegmentedButton active={config.mode === 'time'} onClick={() => onConfigChange({ mode: 'time' }, { risky: true, intent: 'config' })}>
                        {copy.common.timeMode}
                    </SegmentedButton>
                    <SegmentedButton active={config.mode === 'words'} onClick={() => onConfigChange({ mode: 'words' }, { risky: true, intent: 'config' })}>
                        {copy.common.wordsMode}
                    </SegmentedButton>
                </div>
            </div>

            <div className="control-group">
                <div className="control-label-row">
                    <span className="control-label">{copy.practice.optionsTitle}</span>
                </div>
                <div className="segmented-group">
                    <SegmentedButton active={config.includePunctuation} onClick={() => onConfigChange({ includePunctuation: !config.includePunctuation }, { risky: true, intent: 'config' })}>
                        {copy.common.punctuation}
                    </SegmentedButton>
                    <SegmentedButton active={config.includeNumbers} onClick={() => onConfigChange({ includeNumbers: !config.includeNumbers }, { risky: true, intent: 'config' })}>
                        {copy.common.numbers}
                    </SegmentedButton>
                </div>
            </div>

            <div className="control-group">
                <div className="control-label-row">
                    <span className="control-label">{copy.practice.volumeTitle}</span>
                </div>

                {config.mode === 'time' ? (
                    <div className="segmented-group">
                        {timeOptions.map((value) => (
                            <SegmentedButton
                                key={value}
                                active={config.durationSeconds === value}
                                onClick={() => onConfigChange({ durationSeconds: value }, { risky: true, intent: 'config' })}
                            >
                                {value}s
                            </SegmentedButton>
                        ))}
                    </div>
                ) : (
                    <div className="segmented-group">
                        {wordOptions.map((value) => (
                            <SegmentedButton
                                key={value}
                                active={config.wordCount === value}
                                onClick={() => onConfigChange({ wordCount: value }, { risky: true, intent: 'config' })}
                            >
                                {value}
                            </SegmentedButton>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

