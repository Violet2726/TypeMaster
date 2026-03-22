/**
 * 练习页。
 *
 * 该页面负责把三个独立部分串起来：
 * - 配置面板
 * - AI 训练工坊
 * - 打字主区域
 *
 * 练习完成后，会直接把结果写入 store 并跳转结果页。
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AIWorkshop } from '../components/AIWorkshop';
import { ConfigPanel } from '../components/ConfigPanel';
import { TypingArea } from '../components/TypingArea';
import { useTypingSession } from '../hooks/useTypingSession';
import { usePracticeStore } from '../store/practice-store';

export function PracticePage() {
    const navigate = useNavigate();
    const {
        config,
        updateConfig,
        currentDraft,
        isGeneratingPractice,
        practiceError,
        isAiDraftStale,
        generateAiPractice,
        resetPracticeToBuiltin,
        completePractice
    } = usePracticeStore();

    /**
     * 把打字流程封装在独立 hook 中，页面只消费状态和事件。
     */
    const typingSession = useTypingSession({
        draft: currentDraft,
        config,
        onComplete: ({ result, timeline }) => {
            const session = completePractice({ result, timeline });
            navigate(`/result?session=${session.id}`);
        }
    });

    /**
     * 每次进入新练习时，把焦点重新放回隐藏输入框。
     */
    useEffect(() => {
        const timer = window.setTimeout(() => {
            typingSession.focusInput();
        }, 120);

        return () => {
            window.clearTimeout(timer);
        };
    }, [typingSession.focusInput, currentDraft?.id]);

    /**
     * 生成新的 AI 训练文本后，重置本轮输入状态。
     */
    const handleGenerateAi = async () => {
        try {
            await generateAiPractice();
            typingSession.resetSession();
            typingSession.focusInput();
        } catch (error) {
            // 错误状态已在 store 中统一处理。
        }
    };

    return (
        <div className="page-stack">
            <ConfigPanel
                config={config}
                onConfigChange={updateConfig}
                onUseBuiltin={resetPracticeToBuiltin}
            />

            <AIWorkshop
                config={config}
                currentDraft={currentDraft}
                isGenerating={isGeneratingPractice}
                isDraftStale={isAiDraftStale}
                practiceError={practiceError}
                onConfigChange={updateConfig}
                onGenerate={handleGenerateAi}
            />

            <TypingArea
                words={typingSession.words}
                typedHistory={typingSession.typedHistory}
                currentInput={typingSession.currentInput}
                currentWordIndex={typingSession.currentWordIndex}
                isFocused={typingSession.isFocused}
                status={typingSession.status}
                liveMetrics={typingSession.liveMetrics}
                timerDisplay={typingSession.timerDisplay}
                mode={config.mode}
                sourceLabel={currentDraft?.sourceTextMeta?.label || '训练文本'}
                inputRef={typingSession.inputRef}
                onInputChange={typingSession.handleInputChange}
                onKeyDown={typingSession.handleKeyDown}
                onFocus={typingSession.handleFocus}
                onBlur={typingSession.handleBlur}
                onActivate={typingSession.focusInput}
                onReset={typingSession.resetSession}
            />
        </div>
    );
}
