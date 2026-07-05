import { Bot, ChevronDown, Clock3, Hash, Library, PencilLine, SlidersHorizontal, Timer } from 'lucide-react';
import { formatDurationLabel } from '../../../i18n';
import { getTrainingCopy } from '../../../training/copy';

const timeOptions = [15, 30, 60, 120];
const wordOptions = [10, 25, 50, 100];
const advancedPanelId = 'practice-config-advanced';

function getDisplayOptions(defaultOptions, activeValue) {
    if (!Number.isFinite(activeValue) || defaultOptions.includes(activeValue)) {
        return defaultOptions;
    }

    const nearestOption = defaultOptions.reduce((nearest, option) => (
        Math.abs(option - activeValue) < Math.abs(nearest - activeValue) ? option : nearest
    ), defaultOptions[0]);

    return defaultOptions
        .map((option) => (option === nearestOption ? activeValue : option))
        .sort((left, right) => left - right);
}

function SegmentedButton({ active, children, icon: Icon = null, onClick }) {
    return (
        <button
            type="button"
            className={`segment-btn${active ? ' active' : ''}`}
            aria-pressed={active}
            onClick={onClick}
        >
            {Icon && <Icon aria-hidden="true" size={15} strokeWidth={2.3} />}
            {children}
        </button>
    );
}

function ConfigSection({ label, value, variant, children }) {
    return (
        <fieldset className={`config-control-group config-control-group--${variant}`} aria-label={label}>
            <legend className="config-control-group__legend">
                <span className="control-label">{label}</span>
                <strong className="config-control-group__value" aria-hidden="true">{value}</strong>
            </legend>
            <div className="config-control-group__body">
                {children}
            </div>
        </fieldset>
    );
}

function getSourceValue(copy, trainingCopy, source) {
    if (source === 'custom') return trainingCopy.practice.customSource;
    if (source === 'ai') return copy.practice.sourceAi;
    return copy.practice.sourceBuiltin;
}

function getModeValue(copy, mode) {
    return mode === 'time' ? copy.common.timeMode : copy.common.wordsMode;
}

function getVolumeValue(config, language) {
    return config.mode === 'time' ? formatDurationLabel(config.durationSeconds, language) : `${config.wordCount}`;
}

export function ConfigPanel({ copy, language, config, onConfigChange, showAdvanced, onToggleAdvanced }) {
    const trainingCopy = getTrainingCopy(language);
    const sourceValue = getSourceValue(copy, trainingCopy, config.source);
    const modeValue = getModeValue(copy, config.mode);
    const volumeValue = getVolumeValue(config, language);
    const durationOptions = getDisplayOptions(timeOptions, config.durationSeconds);
    const activeWordOptions = getDisplayOptions(wordOptions, config.wordCount);
    const activeOptions = [
        config.includePunctuation ? copy.common.punctuation : null,
        config.includeNumbers ? copy.common.numbers : null
    ].filter(Boolean).join(' / ') || copy.common.emptyValue;

    return (
        <div className="config-strip">
            <div className="config-strip__main">
                <ConfigSection label={copy.practice.sourceTitle} value={sourceValue} variant="source">
                    <div className="segmented-group segmented-group--source">
                        <SegmentedButton icon={Library} active={config.source === 'builtin'} onClick={() => onConfigChange({ source: 'builtin' }, { risky: true, intent: 'config' })}>
                            {copy.practice.sourceBuiltin}
                        </SegmentedButton>
                        <SegmentedButton icon={PencilLine} active={config.source === 'custom'} onClick={() => onConfigChange({ source: 'custom' }, { risky: true, intent: 'config' })}>
                            {trainingCopy.practice.customSource}
                        </SegmentedButton>
                        <SegmentedButton icon={Bot} active={config.source === 'ai'} onClick={() => onConfigChange({ source: 'ai' }, { risky: true, intent: 'config' })}>
                            {copy.practice.sourceAi}
                        </SegmentedButton>
                    </div>
                </ConfigSection>

                <ConfigSection label={copy.practice.modeTitle} value={modeValue} variant="mode">
                    <div className="segmented-group segmented-group--mode">
                        <SegmentedButton icon={Timer} active={config.mode === 'time'} onClick={() => onConfigChange({ mode: 'time' }, { risky: true, intent: 'config' })}>
                            {copy.common.timeMode}
                        </SegmentedButton>
                        <SegmentedButton icon={Hash} active={config.mode === 'words'} onClick={() => onConfigChange({ mode: 'words' }, { risky: true, intent: 'config' })}>
                            {copy.common.wordsMode}
                        </SegmentedButton>
                    </div>
                </ConfigSection>

                <ConfigSection label={copy.practice.volumeTitle} value={volumeValue} variant="volume">
                    {config.mode === 'time' ? (
                        <div className="segmented-group segmented-group--volume">
                            {durationOptions.map((value) => (
                                <SegmentedButton
                                    icon={Clock3}
                                    key={value}
                                    active={config.durationSeconds === value}
                                    onClick={() => onConfigChange({ durationSeconds: value }, { risky: true, intent: 'config' })}
                                >
                                    {formatDurationLabel(value, language)}
                                </SegmentedButton>
                            ))}
                        </div>
                    ) : (
                        <div className="segmented-group segmented-group--volume">
                            {activeWordOptions.map((value) => (
                                <SegmentedButton
                                    icon={Hash}
                                    key={value}
                                    active={config.wordCount === value}
                                    onClick={() => onConfigChange({ wordCount: value }, { risky: true, intent: 'config' })}
                                >
                                    {value}
                                </SegmentedButton>
                            ))}
                        </div>
                    )}
                </ConfigSection>
            </div>

            <div className="config-strip__actions">
                <button
                    type="button"
                    className="ghost-btn ghost-btn--small"
                    aria-expanded={showAdvanced}
                    aria-controls={advancedPanelId}
                    onClick={onToggleAdvanced}
                >
                    <span className="ghost-btn__label">
                        <SlidersHorizontal aria-hidden="true" size={16} strokeWidth={2.2} />
                        {showAdvanced ? copy.practice.settingsHide : copy.practice.settingsToggle}
                    </span>
                    <ChevronDown
                        aria-hidden="true"
                        className={`ghost-btn__chevron ${showAdvanced ? 'is-open' : ''}`}
                        size={16}
                        strokeWidth={2.2}
                    />
                </button>
            </div>

            {showAdvanced && (
                <div className="config-strip__advanced" id={advancedPanelId}>
                    <ConfigSection label={copy.practice.optionsTitle} value={activeOptions} variant="options">
                        <div className="segmented-group segmented-group--options">
                            <SegmentedButton active={config.includePunctuation} onClick={() => onConfigChange({ includePunctuation: !config.includePunctuation }, { risky: true, intent: 'config' })}>
                                {copy.common.punctuation}
                            </SegmentedButton>
                            <SegmentedButton active={config.includeNumbers} onClick={() => onConfigChange({ includeNumbers: !config.includeNumbers }, { risky: true, intent: 'config' })}>
                                {copy.common.numbers}
                            </SegmentedButton>
                        </div>
                    </ConfigSection>
                </div>
            )}
        </div>
    );
}
