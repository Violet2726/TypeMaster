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
            kicker: '专注打字练习',
            footerDefault: '本地记录 / 实时反馈 / 成长回顾',
            footerFocus: '专注模式已开启 · Tab + Enter 重开 · Esc 重置'
        },
        nav: {
            home: '首页',
            practice: '练习',
            insights: '成长洞察',
            toggleTheme: '切换主题',
            openSettings: '打开设置'
        },
        common: {
            appName: 'TypeMaster',
            cancel: '取消',
            close: '关闭',
            save: '保存',
            retry: '重试',
            confirm: '确认',
            continue: '继续',
            back: '返回',
            open: '打开',
            loading: '处理中',
            comingSoon: '即将推出',
            none: '暂无',
            generate: '生成',
            regenerate: '重新生成',
            startTyping: '开始输入',
            resumeTyping: '继续输入',
            resetRound: '重置本轮',
            viewInsights: '查看成长洞察',
            backToPractice: '返回练习',
            aiReady: '文本已就绪',
            aiNeedsGenerate: '需要生成',
            aiStale: '需要刷新',
            aiFailed: '生成失败',
            aiGenerating: '生成中',
            coachLoading: '建议生成中',
            coachReady: '建议已就绪',
            coachFallback: '本地建议',
            coachError: '建议失败',
            builtIn: '标准词库',
            timeMode: '时间',
            wordsMode: '词数',
            punctuation: '标点',
            numbers: '数字',
            wpm: 'WPM',
            rawWpm: 'Raw WPM',
            accuracy: '准确率',
            consistency: '稳定度',
            characterStats: '字符统计',
            duration: '时长',
            sessions: '练习次数',
            language: '语言',
            theme: '主题',
            focusMode: '专注模式',
            fontScale: '字号',
            status: '状态',
            currentText: '当前文本',
            restoreLastConfig: '恢复上次配置',
            refreshAdvice: '重试建议',
            useBuiltIn: '改用标准词库',
            continueLastSetup: '继续上次',
            generateAiText: '生成文本',
            reGenerateAiText: '重新生成文本',
            nextDrill: '再来一轮',
            nextDrillRetry: '重试下一轮',
            returnPractice: '返回练习',
            emptyValue: '--'
        },
        statuses: {
            idle: '未开始',
            running: '进行中',
            paused: '已暂停',
            complete: '已完成',
            ready: '可开始',
            stale: '需刷新',
            error: '需处理',
            loading: '处理中'
        },
        errors: {
            missing_config: {
                title: 'AI 配置缺失',
                description: '当前环境缺少 AI_API_KEY 或 AI_API_URL，暂时无法请求 AI。'
            },
            network: {
                title: '网络异常',
                description: '请求没有成功到达 AI 服务，请检查网络后重试。'
            },
            timeout: {
                title: '响应超时',
                description: 'AI 返回过慢，当前请求已中止。稍后可以再次尝试。'
            },
            empty_response: {
                title: '返回为空',
                description: 'AI 没有返回可用内容，本次已切换到可恢复的兜底路径。'
            },
            server_error: {
                title: '服务异常',
                description: 'AI 服务返回了异常响应，请稍后重试。'
            },
            unknown: {
                title: '未知异常',
                description: '发生了未识别的问题，请稍后重试。'
            }
        },
        home: {
            kicker: 'Quiet Typing',
            title: '开始下一轮打字练习',
            body: '练速度，练准确率，也练稳定度。',
            primaryCta: '开始练习',
            secondaryCta: '继续上次',
            statsTitle: '练习摘要',
            avgWpm: '最近 7 次平均速度',
            bestAccuracy: '最近 7 次最佳准确率',
            latestMode: '最近模式',
            recentHistoryTitle: '最近记录',
            recentEmpty: '还没有练习记录，先开始第一轮。'
        },
        practice: {
            pageTitle: '输入优先',
            configTitle: '本轮设置',
            settingsToggle: '更多设置',
            settingsHide: '收起设置',
            customTitle: 'AI 自定义文本',
            customBody: '需要定制内容时再生成，不打断主练习流程。',
            builtInReady: '标准词库已就绪，可以直接开始。',
            aiIdle: '还没有自定义文本，先生成再开始。',
            aiReady: '自定义文本已就绪，可以开始输入。',
            aiStale: '配置已变化，需要重新生成文本。',
            aiLoading: '正在生成自定义文本，通常需要几秒。',
            aiError: '这次生成没有成功，可以重试或改用标准词库。',
            mobileActionGenerate: '生成文本',
            mobileActionReady: '开始输入',
            mobileActionResume: '继续输入',
            sourceTitle: '来源',
            modeTitle: '模式',
            optionsTitle: '选项',
            volumeTitle: '规模',
            templateLabel: '主题',
            difficultyLabel: '难度',
            sourceBuiltin: '标准词库',
            sourceAi: 'AI 自定义文本',
            wordsLockedTitle: '文本还没准备好',
            wordsLockedBody: '先完成设置，再开始输入。',
            focusLost: '点击文本区继续输入',
            pausedTitle: '已暂停',
            pausedBody: '离开焦点后，计时已暂停。',
            runningHint: '实时更新速度、准确率和节奏。',
            idleHint: '从第一个字符开始计时。',
            completeHint: '本轮已完成。',
            confirmLeaveTitle: '离开当前练习？',
            confirmLeaveBody: '这轮还没有结束，离开后当前输入会丢失。',
            confirmResetTitle: '重置当前练习？',
            confirmResetBody: '这会清空当前输入和进度，无法恢复。',
            confirmConfigTitle: '切换当前设置？',
            confirmConfigBody: '这会结束当前未完成的练习，并按新设置重置。',
            helperTitle: '当前操作',
            helperBody: '点击文本区即可继续输入。',
            textReadyLabel: '文本可开始',
            textPendingLabel: '文本未就绪',
            sessionLabel: '本轮状态',
            timeRemaining: '剩余时间',
            timeElapsed: '已用时间'
        },
        result: {
            emptyTitle: '还没有可展示的结果',
            emptyBody: '先完成一轮练习，再回来查看成绩和下一步建议。',
            emptyAction: '去练习',
            heroKicker: '本轮结果',
            metricsTitle: '关键指标',
            adviceTitle: '本轮建议',
            challengeStandingTitle: '今日挑战战绩',
            challengeStandingBody: '这轮已经进入今日榜单，看看你现在排在什么位置。',
            challengeStandingSyncTitle: '榜单同步中',
            challengeStandingSyncBody: '成绩已提交，榜单正在刷新。稍后也可以到挑战页查看完整排名。',
            challengeStandingErrorTitle: '挑战榜单暂时不可用',
            challengeStandingErrorBody: '这轮成绩已经记录，但暂时拿不到榜单数据。稍后可以去挑战页查看。',
            challengeRankLabel: '当前名次',
            challengeEntriesLabel: '参与人数',
            challengeBeatLabel: '超过选手',
            challengeBestLabel: '个人最佳',
            challengeBestFresh: '刷新今日最佳',
            challengeBestFirst: '今天的第一条挑战成绩已入榜。',
            challengeBestGapWpm: '距离你的今日最佳还差 {value} WPM。',
            challengeBestGapAccuracy: 'WPM 持平，距离最佳准确率还差 {value}%。',
            challengeViewLeaderboard: '查看挑战榜单',
            trendEmpty: '这轮趋势数据还不够完整，继续多练几轮会更清楚。',
            coachLoadingTitle: '正在生成本轮建议',
            coachLoadingBody: '会结合这轮结果和最近记录，通常只需几秒。',
            coachFallbackBody: 'AI 暂不可用，已改用本地规则生成建议。',
            coachErrorTitle: '建议生成失败',
            coachErrorBody: '这次没有拿到可用建议，你仍然可以继续下一轮。',
            nextDrillLoading: '正在准备下一轮文本。',
            nextDrillError: '下一轮文本准备失败，请重试。',
            nextReasonFallback: '继续强化这轮里最明显的短板。',
            primaryAction: '再来一轮'
        },
        insights: {
            title: '成长洞察',
            body: '回看最近记录、建议和错误热点。',
            emptyTitle: '还没有成长记录',
            emptyBody: '先完成一轮练习，这里会开始积累最近建议和趋势。',
            emptyAction: '开始练习',
            latestCoach: '最近建议',
            recentTrend: '近 7 / 30 次',
            bestWpm: '最佳速度',
            avgAccuracy: '平均准确率',
            recentAvgWpm: '近 7 次平均速度',
            topErrorChars: '高频错误字符',
            topErrorWords: '高频错误单词',
            recentHistory: '最近记录',
            sessions7: '近 7 次',
            sessions30: '近 30 次',
            noErrors: '样本还不够多，暂时没有明显错误热点。',
            noCoach: '还没有完整建议，完成第一轮后这里会保留最近一份总结。'
        },
        settings: {
            kicker: '设置',
            title: '设置中心',
            theme: '主题',
            fontScale: '字号',
            focusMode: '专注模式',
            language: '语言',
            sound: '音效',
            soundComingSoon: '当前版本不提供真实音效。',
            themeDark: '深色',
            themeLight: '浅色',
            fontSm: '紧凑',
            fontMd: '标准',
            fontLg: '舒展',
            focusOn: '已开启',
            focusOff: '已关闭'
        },
        chart: {
            kicker: '本轮回放',
            title: '输入、错误与节奏回放',
            sourceNote: '数据来自本轮练习过程中的每秒采样，只记录本次会话本身。',
            interactionHint: '切换模式后，可悬停、拖动或用左右方向键逐秒检查本轮变化。',
            summaryTitle: '本轮均值',
            avgWpm: '平均 WPM',
            avgRaw: '平均实际速度',
            avgAccuracy: '平均准确率',
            peakBurst: '最高瞬时速度',
            dataNote: '共 {samples} 个采样点，出现 {errors} 个错误波峰。',
            inspectTitle: '当前秒',
            modeSpeed: '速度',
            modeRhythm: '节奏',
            modeAccuracy: '准确率',
            rawLabel: '实际速度',
            burstLabel: '瞬时速度',
            errors: '错误',
            samples: '采样点',
            noAccuracyData: '这轮结果还没有逐秒准确率采样。',
            stateSteady: '稳定输出',
            stateUnstable: '出现错误',
            stateBurst: '爆发输入',
            stateRecovering: '节奏回落',
            statePaused: '中途暂停',
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
            kicker: 'Focused typing practice',
            footerDefault: 'Local history / live feedback / session review',
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
            appName: 'TypeMaster',
            cancel: 'Cancel',
            close: 'Close',
            save: 'Save',
            retry: 'Retry',
            confirm: 'Confirm',
            continue: 'Continue',
            back: 'Back',
            open: 'Open',
            loading: 'Working',
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
            aiStale: 'Needs refresh',
            aiFailed: 'Failed',
            aiGenerating: 'Generating',
            coachLoading: 'Advice loading',
            coachReady: 'Advice ready',
            coachFallback: 'Local advice',
            coachError: 'Advice failed',
            builtIn: 'Built-in',
            timeMode: 'Time',
            wordsMode: 'Words',
            punctuation: 'Punctuation',
            numbers: 'Numbers',
            wpm: 'WPM',
            rawWpm: 'Raw WPM',
            accuracy: 'Accuracy',
            consistency: 'Consistency',
            characterStats: 'Character stats',
            duration: 'Duration',
            sessions: 'Sessions',
            language: 'Language',
            theme: 'Theme',
            focusMode: 'Focus mode',
            fontScale: 'Font size',
            status: 'Status',
            currentText: 'Current text',
            restoreLastConfig: 'Restore last setup',
            refreshAdvice: 'Retry advice',
            useBuiltIn: 'Use built-in',
            continueLastSetup: 'Continue last',
            generateAiText: 'Generate text',
            reGenerateAiText: 'Regenerate text',
            nextDrill: 'Try another round',
            nextDrillRetry: 'Retry next round',
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
                description: 'The AI returned no usable content, so the app switched to a recoverable fallback path.'
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
            kicker: 'Quiet Typing',
            title: 'Start your next typing session',
            body: 'Train speed, accuracy, and consistency.',
            primaryCta: 'Start practice',
            secondaryCta: 'Continue last',
            statsTitle: 'Session snapshot',
            avgWpm: 'Last 7 average WPM',
            bestAccuracy: 'Last 7 best accuracy',
            latestMode: 'Latest mode',
            recentHistoryTitle: 'Recent sessions',
            recentEmpty: 'No sessions yet. Start your first round.'
        },
        practice: {
            pageTitle: 'Input first',
            configTitle: 'Round setup',
            settingsToggle: 'More settings',
            settingsHide: 'Hide settings',
            customTitle: 'AI custom text',
            customBody: 'Generate only when you need custom content.',
            builtInReady: 'Built-in text is ready. You can start immediately.',
            aiIdle: 'No custom text yet. Generate it before you start.',
            aiReady: 'Custom text is ready. Start typing when you are ready.',
            aiStale: 'The setup changed, so this text needs to be regenerated.',
            aiLoading: 'Generating custom text. This usually takes a few seconds.',
            aiError: 'This draft failed to generate. Retry it or switch back to built-in text.',
            mobileActionGenerate: 'Generate text',
            mobileActionReady: 'Start typing',
            mobileActionResume: 'Resume typing',
            sourceTitle: 'Source',
            modeTitle: 'Mode',
            optionsTitle: 'Options',
            volumeTitle: 'Size',
            templateLabel: 'Template',
            difficultyLabel: 'Difficulty',
            sourceBuiltin: 'Built-in',
            sourceAi: 'AI custom text',
            wordsLockedTitle: 'Text is not ready yet',
            wordsLockedBody: 'Finish the setup, then start typing.',
            focusLost: 'Tap the text area to keep typing',
            pausedTitle: 'Paused',
            pausedBody: 'Timing is paused while focus is away.',
            runningHint: 'Speed, accuracy, and rhythm update live.',
            idleHint: 'Timing starts on the first character.',
            completeHint: 'This round is complete.',
            confirmLeaveTitle: 'Leave this practice?',
            confirmLeaveBody: 'This round is not finished yet. Leaving now will discard the active input.',
            confirmResetTitle: 'Reset this practice?',
            confirmResetBody: 'This clears the current input and progress and cannot be undone.',
            confirmConfigTitle: 'Change the current setup?',
            confirmConfigBody: 'This will discard the unfinished round and reset the workspace.',
            helperTitle: 'Primary action',
            helperBody: 'Tap the text area to keep typing.',
            textReadyLabel: 'Text ready',
            textPendingLabel: 'Text pending',
            sessionLabel: 'Session',
            timeRemaining: 'Time left',
            timeElapsed: 'Time elapsed'
        },
        result: {
            emptyTitle: 'No result to show yet',
            emptyBody: 'Finish one round first, then come back for the score and next step.',
            emptyAction: 'Go practice',
            heroKicker: 'This round',
            metricsTitle: 'Key metrics',
            adviceTitle: 'Next focus',
            challengeStandingTitle: 'Daily challenge standing',
            challengeStandingBody: 'This round is already on today\'s board. See where it lands right now.',
            challengeStandingSyncTitle: 'Leaderboard syncing',
            challengeStandingSyncBody: 'Your result is submitted and the board is still refreshing. You can also check the full ranking on the challenge page.',
            challengeStandingErrorTitle: 'Challenge leaderboard unavailable',
            challengeStandingErrorBody: 'This result was recorded, but the ranking data is not available right now. Check the challenge page again shortly.',
            challengeRankLabel: 'Current rank',
            challengeEntriesLabel: 'Entries',
            challengeBeatLabel: 'Beat',
            challengeBestLabel: 'Personal best',
            challengeBestFresh: 'New best today',
            challengeBestFirst: 'Your first challenge result today is already on the board.',
            challengeBestGapWpm: '{value} WPM behind your best today.',
            challengeBestGapAccuracy: 'Same WPM, {value}% behind your best accuracy.',
            challengeViewLeaderboard: 'View leaderboard',
            trendEmpty: 'This round does not have enough timeline data yet. A few more sessions will make the trend clearer.',
            coachLoadingTitle: 'Generating round advice',
            coachLoadingBody: 'This combines the latest result with recent history and usually takes a few seconds.',
            coachFallbackBody: 'AI is unavailable right now, so a local fallback generated the advice.',
            coachErrorTitle: 'Advice failed',
            coachErrorBody: 'No usable advice was created this time. You can still continue with the next round.',
            nextDrillLoading: 'Preparing the next round text.',
            nextDrillError: 'The next round text failed to prepare. Please try again.',
            nextReasonFallback: 'Keep reinforcing the most obvious weakness from this round.',
            primaryAction: 'Try another round'
        },
        insights: {
            title: 'Insights',
            body: 'Review recent sessions, advice, and error hotspots.',
            emptyTitle: 'No session history yet',
            emptyBody: 'Finish one round first. Recent advice and trends will start to appear here.',
            emptyAction: 'Start practice',
            latestCoach: 'Latest advice',
            recentTrend: 'Last 7 / 30',
            bestWpm: 'Best WPM',
            avgAccuracy: 'Average accuracy',
            recentAvgWpm: 'Last 7 average WPM',
            topErrorChars: 'Frequent error characters',
            topErrorWords: 'Frequent error words',
            recentHistory: 'Recent sessions',
            sessions7: 'Last 7',
            sessions30: 'Last 30',
            noErrors: 'The sample is still too small to reveal clear hotspots.',
            noCoach: 'No full advice yet. After the first completed round, the latest summary stays here.'
        },
        settings: {
            kicker: 'Settings',
            title: 'Settings',
            theme: 'Theme',
            fontScale: 'Font size',
            focusMode: 'Focus mode',
            language: 'Language',
            sound: 'Sound',
            soundComingSoon: 'This release does not ship real sound effects.',
            themeDark: 'Dark',
            themeLight: 'Light',
            fontSm: 'Compact',
            fontMd: 'Standard',
            fontLg: 'Spacious',
            focusOn: 'Enabled',
            focusOff: 'Disabled'
        },
        chart: {
            kicker: 'Session replay',
            title: 'Input, error, and rhythm replay',
            sourceNote: 'Built from per-second samples captured during this session only.',
            interactionHint: 'Switch modes, then hover, drag, or use the arrow keys to inspect the round second by second.',
            summaryTitle: 'Round averages',
            avgWpm: 'Average WPM',
            avgRaw: 'Average raw speed',
            avgAccuracy: 'Average accuracy',
            peakBurst: 'Peak burst',
            dataNote: '{samples} samples captured, with {errors} error spikes.',
            inspectTitle: 'Selected second',
            modeSpeed: 'Speed',
            modeRhythm: 'Rhythm',
            modeAccuracy: 'Accuracy',
            rawLabel: 'Raw speed',
            burstLabel: 'Burst speed',
            errors: 'Errors',
            samples: 'Samples',
            noAccuracyData: 'This round does not include per-second accuracy samples yet.',
            stateSteady: 'Steady',
            stateUnstable: 'Errors spiked',
            stateBurst: 'Bursting',
            stateRecovering: 'Recovering',
            statePaused: 'Paused',
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
