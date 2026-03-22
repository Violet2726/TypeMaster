const LANGUAGE_META = {
    'zh-CN': {
        id: 'zh-CN',
        label: '简体中文',
        shortLabel: '中文'
    },
    'en-US': {
        id: 'en-US',
        label: 'English',
        shortLabel: 'EN'
    }
};

const COPY = {
    'zh-CN': {
        shell: {
            kicker: 'AI Training Studio',
            footerDefault: '本地历史 / AI 教练 / 下一练闭环',
            footerFocus: '专注模式已开启 · Tab + Enter 重新开始 · Esc 重置'
        },
        nav: {
            home: '首页',
            practice: '练习',
            insights: '成长洞察',
            toggleTheme: '切换主题',
            openSettings: '打开设置'
        },
        common: {
            appName: 'TypeMaster 2.1',
            aiCoachMode: 'AI Coach Experience Refresh',
            cancel: '取消',
            close: '关闭',
            save: '保存',
            retry: '重试',
            confirm: '确认',
            continue: '继续',
            back: '返回',
            open: '打开',
            loading: '加载中',
            comingSoon: '即将推出',
            none: '暂无',
            generate: '生成',
            regenerate: '重新生成',
            startTyping: '开始输入',
            resumeTyping: '恢复输入',
            resetRound: '重置本轮',
            viewInsights: '查看成长洞察',
            backToPractice: '返回练习',
            aiReady: '文本已就绪',
            aiNeedsGenerate: '需要生成',
            aiStale: '已过期',
            aiFailed: '生成失败',
            aiGenerating: '生成中',
            coachLoading: '教练生成中',
            coachReady: 'AI 成功',
            coachFallback: '本地兜底',
            coachError: '生成失败',
            builtIn: '标准词库',
            aiTraining: 'AI 训练',
            timeMode: '时间',
            wordsMode: '词数',
            punctuation: '标点',
            numbers: '数字',
            wpm: 'WPM',
            accuracy: '准确率',
            consistency: '稳定度',
            sessions: '练习次数',
            language: '语言',
            theme: '主题',
            focusMode: '专注模式',
            fontScale: '字号密度',
            status: '状态',
            currentText: '当前文本',
            restoreLastConfig: '恢复上次配置',
            refreshAdvice: '重试 AI 建议',
            useBuiltIn: '切换到标准词库',
            startAi: '开始 AI 训练',
            quickBuiltIn: '快速标准练习',
            continueLastSetup: '继续上次配置',
            openPractice: '进入练习工作台',
            generateAiText: '生成 AI 训练文本',
            reGenerateAiText: '重新生成 AI 文本',
            nextDrill: '开始下一练',
            nextDrillRetry: '重试下一练',
            returnPractice: '返回练习页',
            emptyValue: '--'
        },
        statuses: {
            idle: '未开始',
            running: '进行中',
            paused: '已暂停',
            complete: '已完成',
            ready: '可开始',
            stale: '需要刷新',
            error: '需要处理',
            loading: '处理中'
        },
        errors: {
            missing_config: {
                title: 'AI 配置缺失',
                description: '当前环境还没有配置 AI_API_KEY 或 AI_API_URL，暂时无法调用 AI。'
            },
            network: {
                title: '网络异常',
                description: '请求没有成功到达 AI 服务，请检查网络连接后重试。'
            },
            timeout: {
                title: '响应超时',
                description: 'AI 返回时间过长，已中止本次请求。你可以稍后重试。'
            },
            empty_response: {
                title: '返回为空',
                description: 'AI 没有返回可用内容，本次结果已切换到可恢复的兜底路径。'
            },
            server_error: {
                title: '服务异常',
                description: 'AI 服务返回了异常响应，请稍后再试。'
            },
            unknown: {
                title: '未知异常',
                description: '出现了未识别的问题，请稍后重试。'
            }
        },
        home: {
            kicker: 'AI Coach Experience Refresh',
            title: '每一轮练习，都应该被解释、被反馈、被延续。',
            body: 'TypeMaster 2.1 把 AI 训练、结果解释和成长洞察收拢成一条连续路径，让你知道现在该练什么、为什么练、下一步怎么练。',
            primaryCta: '开始 AI 训练',
            secondaryCta: '快速标准练习',
            continueTitle: '继续上次配置',
            continueBody: '沿用最近一次练习的模式、来源和时长，直接回到工作台。',
            emptyCoach: '还没有可展示的建议。先完成一次练习，结果页会自动生成第一份总结。',
            latestCoachTitle: '最近一次训练价值',
            recentTitle: '最近 7 次概览',
            recentEmpty: '本地还没有练习样本，先完成一轮训练再回来查看变化。',
            recentSessions: '最近 7 次练习',
            avgWpm: '最近 7 次平均速度',
            bestAccuracy: '最近 7 次最佳准确率',
            practiceMix: 'AI 使用占比'
        },
        practice: {
            pageTitle: '训练工作台',
            pageBody: '先定目标，再生成文本，再开始输入。高风险操作会先确认，避免中途丢失进度。',
            configTitle: '训练配置',
            configBody: '练习来源、模式和难度会直接影响文本生成和结果建议。',
            aiPanelTitle: 'AI 训练工坊',
            aiPanelBody: '选择模板和难度后，先生成文本，再开始这一轮训练。',
            stepPick: '1. 选择模板与难度',
            stepGenerate: '2. 生成训练文本',
            stepType: '3. 开始这一轮输入',
            builtInReady: '标准词库模式无需等待 AI，当前可以直接开始练习。',
            aiIdle: '当前还没有可用的 AI 文本。先点击生成，再开始输入。',
            aiReady: '当前 AI 文本已准备好，可以直接开始这一轮训练。',
            aiStale: '你的 AI 配置已经变化，当前文本不再匹配。请重新生成，或恢复到上次已生成配置。',
            aiLoading: '正在生成训练文本，通常需要 5-15 秒。',
            aiError: '本次 AI 文本没有生成成功。可以重试，或切回标准词库继续练习。',
            restoreHint: '把当前配置恢复到最近一次成功生成 AI 文本时的参数。',
            mobileActionGenerate: '先生成 AI 文本',
            mobileActionReady: '开始这一轮输入',
            mobileActionResume: '继续这一轮输入',
            sourceTitle: '文本来源',
            modeTitle: '练习模式',
            optionsTitle: '训练开关',
            volumeTitle: '练习规模',
            templateLabel: '主题模板',
            difficultyLabel: '难度',
            sourceBuiltin: '标准词库',
            sourceAi: 'AI 定制文本',
            wordsPlaceholder: '点击这里开始输入；空格切词，Backspace 可回退上一词。',
            wordsLockedTitle: '当前文本未就绪',
            wordsLockedBody: '先完成左侧步骤，准备好文本后再开始输入。',
            focusLost: '输入焦点已离开。点击输入框或下方按钮继续。',
            pausedTitle: '练习已暂停',
            pausedBody: '窗口失焦后计时已暂停，你可以随时回来继续。',
            runningHint: '输入会自动实时更新速度、准确率和稳定度。',
            idleHint: '从第一个字符开始计时。建议先浏览一眼文本节奏再起手。',
            completeHint: '这一轮已结束，结果页会继续给出解释和下一练建议。',
            confirmLeaveTitle: '离开当前练习？',
            confirmLeaveBody: '你当前这轮还没结束，离开后本轮输入会丢失。',
            confirmResetTitle: '重置当前练习？',
            confirmResetBody: '这会清空当前输入和进度，无法恢复。',
            confirmConfigTitle: '切换训练配置？',
            confirmConfigBody: '这会结束当前未完成的练习进度，并按新配置重置工作台。',
            statusCard: '当前会话',
            textMetaTitle: '文本状态',
            helperTitle: '操作提示',
            helperBody: '桌面端点击文本区域即可聚焦；移动端建议使用下方主按钮快速回到输入状态。',
            timeRemaining: '剩余秒',
            timeElapsed: '已用秒'
        },
        result: {
            emptyTitle: '还没有可展示的结果',
            emptyBody: '先完成一次练习，再回来查看结算、AI 解释和下一步建议。',
            emptyAction: '去练习',
            heroKicker: '结果与解释',
            summaryTitle: '本次总结',
            issuesTitle: '主要问题',
            strengthsTitle: '做得好的地方',
            nextTitle: '推荐下一练',
            trendTitle: '速度曲线',
            trendEmpty: '这轮练习的趋势点不足，完成更完整的一轮后会看到更清晰的曲线。',
            detailsTitle: '关键指标',
            coachTitle: 'AI 教练反馈',
            coachLoadingTitle: '正在生成本次建议',
            coachLoadingBody: '会结合本次结果和最近历史，通常需要几秒钟。',
            coachFallbackBody: 'AI 暂不可用，已用本地规则生成建议，你仍然可以继续下一练。',
            coachErrorTitle: '建议生成失败',
            coachErrorBody: '这次没有拿到可用建议，你可以重试 AI 建议或直接返回练习页。',
            nextDrillLoading: '正在准备下一练文本，通常需要 5-15 秒。',
            nextDrillError: '下一练文本准备失败，当前仍保留在结果页。',
            nextReasonFallback: '继续强化这一轮里最明显的短板。'
        },
        insights: {
            heroKicker: '成长洞察',
            heroTitle: '把最近的训练结果串成长期反馈。',
            heroBody: '这里保留最近一次完整建议、近 7/30 次概览和错误热点，帮助你看清下一段时间最值得练的方向。',
            emptyTitle: '还没有成长样本',
            emptyBody: '先完成一次 AI 训练，这里会开始积累建议、趋势和错误热点。',
            emptyAction: '开始第一轮 AI 训练',
            latestCoach: '最近一次完整建议',
            recentTrend: '近 7 / 30 次训练概览',
            bestWpm: '最佳速度',
            avgAccuracy: '平均准确率',
            aiShare: 'AI 使用占比',
            topErrorChars: '高频错误字符',
            topErrorWords: '高频错误单词',
            recentHistory: '最近练习列表',
            sessions7: '近 7 次',
            sessions30: '近 30 次',
            noErrors: '当前样本还不够多，暂时没有明显错误热点。',
            noCoach: '还没有完整建议，完成第一次训练后这里会保留最新一份解释。'
        },
        settings: {
            kicker: 'Workspace',
            title: '设置中心',
            theme: '主题',
            fontScale: '字号密度',
            focusMode: '专注模式',
            language: '语言',
            sound: '音效',
            soundComingSoon: '暂未开放，当前版本不提供真实音效。',
            themeDark: 'Serika Dark',
            themeLight: 'Serika Light',
            fontSm: '紧凑',
            fontMd: '标准',
            fontLg: '舒展',
            focusOn: '已开启',
            focusOff: '已关闭'
        },
        chart: {
            kicker: '结果趋势',
            title: '本次速度曲线',
            wpm: 'WPM',
            raw: 'Raw',
            burst: 'Burst'
        },
        confirm: {
            stay: '继续当前练习',
            leave: '确认离开',
            reset: '确认重置',
            apply: '确认切换'
        }
    },
    'en-US': {
        shell: {
            kicker: 'AI Training Studio',
            footerDefault: 'Local history / AI coach / next drill loop',
            footerFocus: 'Focus mode on · Tab + Enter restart · Esc reset'
        },
        nav: {
            home: 'Home',
            practice: 'Practice',
            insights: 'Insights',
            toggleTheme: 'Toggle theme',
            openSettings: 'Open settings'
        },
        common: {
            appName: 'TypeMaster 2.1',
            aiCoachMode: 'AI Coach Experience Refresh',
            cancel: 'Cancel',
            close: 'Close',
            save: 'Save',
            retry: 'Retry',
            confirm: 'Confirm',
            continue: 'Continue',
            back: 'Back',
            open: 'Open',
            loading: 'Loading',
            comingSoon: 'Coming soon',
            none: 'None',
            generate: 'Generate',
            regenerate: 'Regenerate',
            startTyping: 'Start typing',
            resumeTyping: 'Resume typing',
            resetRound: 'Reset round',
            viewInsights: 'View insights',
            backToPractice: 'Back to practice',
            aiReady: 'Text ready',
            aiNeedsGenerate: 'Needs text',
            aiStale: 'Outdated',
            aiFailed: 'Failed',
            aiGenerating: 'Generating',
            coachLoading: 'Coach loading',
            coachReady: 'AI success',
            coachFallback: 'Local fallback',
            coachError: 'Failed',
            builtIn: 'Built-in',
            aiTraining: 'AI practice',
            timeMode: 'Time',
            wordsMode: 'Words',
            punctuation: 'Punctuation',
            numbers: 'Numbers',
            wpm: 'WPM',
            accuracy: 'Accuracy',
            consistency: 'Consistency',
            sessions: 'Sessions',
            language: 'Language',
            theme: 'Theme',
            focusMode: 'Focus mode',
            fontScale: 'Font density',
            status: 'Status',
            currentText: 'Current text',
            restoreLastConfig: 'Restore last config',
            refreshAdvice: 'Retry AI advice',
            useBuiltIn: 'Switch to built-in',
            startAi: 'Start AI practice',
            quickBuiltIn: 'Quick built-in drill',
            continueLastSetup: 'Continue last setup',
            openPractice: 'Open workspace',
            generateAiText: 'Generate AI text',
            reGenerateAiText: 'Regenerate AI text',
            nextDrill: 'Start next drill',
            nextDrillRetry: 'Retry next drill',
            returnPractice: 'Back to practice',
            emptyValue: '--'
        },
        statuses: {
            idle: 'Idle',
            running: 'Running',
            paused: 'Paused',
            complete: 'Complete',
            ready: 'Ready',
            stale: 'Refresh needed',
            error: 'Needs action',
            loading: 'Working'
        },
        errors: {
            missing_config: {
                title: 'AI config missing',
                description: 'AI_API_KEY or AI_API_URL is not configured in the current environment.'
            },
            network: {
                title: 'Network issue',
                description: 'The request did not reach the AI service. Check the network and try again.'
            },
            timeout: {
                title: 'Request timed out',
                description: 'The AI service took too long to respond. You can try again shortly.'
            },
            empty_response: {
                title: 'Empty response',
                description: 'The AI returned no usable content, so the product switched to a recoverable fallback path.'
            },
            server_error: {
                title: 'Service error',
                description: 'The AI service returned an unexpected response. Try again later.'
            },
            unknown: {
                title: 'Unknown error',
                description: 'An unrecognized issue occurred. Try again later.'
            }
        },
        home: {
            kicker: 'AI Coach Experience Refresh',
            title: 'Every drill should be explained, felt, and continued.',
            body: 'TypeMaster 2.1 turns AI practice, result explanation, and growth insights into one continuous loop so you always know what to train next and why.',
            primaryCta: 'Start AI practice',
            secondaryCta: 'Quick built-in drill',
            continueTitle: 'Continue last setup',
            continueBody: 'Reuse the latest mode, source, and size, then jump straight back into the workspace.',
            emptyCoach: 'No advice yet. Finish one drill and the result page will generate the first summary automatically.',
            latestCoachTitle: 'Latest training value',
            recentTitle: 'Last 7 sessions',
            recentEmpty: 'No local sessions yet. Finish one drill and come back to see the loop take shape.',
            recentSessions: 'Recent sessions',
            avgWpm: 'Average WPM',
            bestAccuracy: 'Best accuracy',
            practiceMix: 'AI usage share'
        },
        practice: {
            pageTitle: 'Training workspace',
            pageBody: 'Pick the setup first, generate the text second, then start typing. Risky actions are confirmed before progress is lost.',
            configTitle: 'Training setup',
            configBody: 'Source, mode, and difficulty directly affect text generation and coaching suggestions.',
            aiPanelTitle: 'AI workshop',
            aiPanelBody: 'Choose a template and difficulty, generate the text, then begin the drill.',
            stepPick: '1. Pick template and difficulty',
            stepGenerate: '2. Generate the training text',
            stepType: '3. Start the typing round',
            builtInReady: 'Built-in mode does not wait for AI. You can start right away.',
            aiIdle: 'There is no AI text ready yet. Generate it first, then begin typing.',
            aiReady: 'The current AI text is ready. You can start this round now.',
            aiStale: 'Your AI setup changed, so the current text no longer matches. Regenerate it or restore the last generated setup.',
            aiLoading: 'Generating training text. This usually takes 5-15 seconds.',
            aiError: 'This AI text failed to generate. Retry it or switch back to the built-in word bank.',
            restoreHint: 'Restore the current setup to the parameters used by the last successful AI draft.',
            mobileActionGenerate: 'Generate AI text first',
            mobileActionReady: 'Start this round',
            mobileActionResume: 'Resume this round',
            sourceTitle: 'Text source',
            modeTitle: 'Practice mode',
            optionsTitle: 'Training toggles',
            volumeTitle: 'Practice size',
            templateLabel: 'Template',
            difficultyLabel: 'Difficulty',
            sourceBuiltin: 'Built-in word bank',
            sourceAi: 'AI custom text',
            wordsPlaceholder: 'Type here; Space advances, Backspace can return to the previous word.',
            wordsLockedTitle: 'Text not ready yet',
            wordsLockedBody: 'Finish the setup steps on the left, then start typing once the text is ready.',
            focusLost: 'Input focus moved away. Click the input or use the action button below to continue.',
            pausedTitle: 'Practice paused',
            pausedBody: 'Timing is paused when the window loses focus. You can continue anytime.',
            runningHint: 'Speed, accuracy, and consistency update in real time while you type.',
            idleHint: 'Timing starts from the first character. A quick glance at the rhythm usually helps.',
            completeHint: 'This round is complete. The result page will continue with explanation and the next drill.',
            confirmLeaveTitle: 'Leave this practice?',
            confirmLeaveBody: 'The current round is not finished yet. Leaving now will discard the active input.',
            confirmResetTitle: 'Reset this practice?',
            confirmResetBody: 'This clears the current input and progress and cannot be undone.',
            confirmConfigTitle: 'Change the training setup?',
            confirmConfigBody: 'This will discard the unfinished round and reset the workspace with the new setup.',
            statusCard: 'Current session',
            textMetaTitle: 'Text readiness',
            helperTitle: 'Interaction tips',
            helperBody: 'On desktop, click the text area to focus. On mobile, the primary action button is the fastest way back into typing.',
            timeRemaining: 'sec left',
            timeElapsed: 'sec elapsed'
        },
        result: {
            emptyTitle: 'No result to show yet',
            emptyBody: 'Finish one practice round first, then come back for the score, explanation, and next step.',
            emptyAction: 'Go practice',
            heroKicker: 'Result and explanation',
            summaryTitle: 'Round summary',
            issuesTitle: 'Main issues',
            strengthsTitle: 'What went well',
            nextTitle: 'Recommended next drill',
            trendTitle: 'Speed trend',
            trendEmpty: 'This round does not have enough timeline points yet. Finish a fuller round to see a clearer curve.',
            detailsTitle: 'Key metrics',
            coachTitle: 'AI coach feedback',
            coachLoadingTitle: 'Generating this round summary',
            coachLoadingBody: 'This combines the latest result with recent history and usually takes a few seconds.',
            coachFallbackBody: 'AI is unavailable right now, so a local rule-based fallback was used. You can still continue with the next drill.',
            coachErrorTitle: 'Advice generation failed',
            coachErrorBody: 'No usable advice was created this time. Retry the AI advice or go back to practice.',
            nextDrillLoading: 'Preparing the next drill text. This usually takes 5-15 seconds.',
            nextDrillError: 'The next drill text failed to prepare. You are still on the result page.',
            nextReasonFallback: 'Keep reinforcing the most obvious weakness from this round.'
        },
        insights: {
            heroKicker: 'Insights',
            heroTitle: 'Turn recent drills into longer-term feedback.',
            heroBody: 'This page keeps the latest full advice, 7/30-session summaries, and error hotspots so you can see what is worth training next.',
            emptyTitle: 'No growth data yet',
            emptyBody: 'Finish one AI drill first. Advice, trends, and hotspots will start to accumulate here.',
            emptyAction: 'Start the first AI drill',
            latestCoach: 'Latest full advice',
            recentTrend: '7 / 30 session overview',
            bestWpm: 'Best WPM',
            avgAccuracy: 'Average accuracy',
            aiShare: 'AI usage share',
            topErrorChars: 'Frequent error characters',
            topErrorWords: 'Frequent error words',
            recentHistory: 'Recent session list',
            sessions7: 'Last 7',
            sessions30: 'Last 30',
            noErrors: 'The current sample is still too small to reveal clear error hotspots.',
            noCoach: 'No full advice yet. After the first completed round, the latest explanation stays here.'
        },
        settings: {
            kicker: 'Workspace',
            title: 'Settings',
            theme: 'Theme',
            fontScale: 'Font density',
            focusMode: 'Focus mode',
            language: 'Language',
            sound: 'Sound',
            soundComingSoon: 'Not available yet. This release does not ship real sound effects.',
            themeDark: 'Serika Dark',
            themeLight: 'Serika Light',
            fontSm: 'Compact',
            fontMd: 'Standard',
            fontLg: 'Spacious',
            focusOn: 'Enabled',
            focusOff: 'Disabled'
        },
        chart: {
            kicker: 'Result trend',
            title: 'Speed curve',
            wpm: 'WPM',
            raw: 'Raw',
            burst: 'Burst'
        },
        confirm: {
            stay: 'Keep practicing',
            leave: 'Leave anyway',
            reset: 'Reset anyway',
            apply: 'Apply changes'
        }
    }
};

export function getLanguageMeta(language = 'zh-CN') {
    return LANGUAGE_META[language] || LANGUAGE_META['zh-CN'];
}

export function getSupportedLanguages() {
    return Object.values(LANGUAGE_META);
}

export function getCopy(language = 'zh-CN') {
    return COPY[language] || COPY['zh-CN'];
}

export function getErrorMessage(language = 'zh-CN', code = 'unknown') {
    const copy = getCopy(language);
    return copy.errors[code] || copy.errors.unknown;
}

export function formatDateTime(value, language = 'zh-CN') {
    if (!value) return getCopy(language).common.emptyValue;
    return new Intl.DateTimeFormat(language, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(value));
}

export function formatShortDate(value, language = 'zh-CN') {
    if (!value) return getCopy(language).common.emptyValue;
    return new Intl.DateTimeFormat(language, {
        month: 'short',
        day: 'numeric'
    }).format(new Date(value));
}

export function formatPercent(value) {
    return `${Math.round(Number(value || 0))}%`;
}
