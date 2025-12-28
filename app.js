/**
 * TypeMaster - 核心应用逻辑
 * 实现了打字测试的所有功能，包括：
 * 1. 单词生成与渲染
 * 2. 实时打字状态追踪 (光标、正确/错误反馈)
 * 3. 统计数据计算 (WPM, 准确率, 爆发速度)
 * 4. AI 智能出题
 * 5. 结果可视化 (Canvas 图表)
 */

// GLM-4 API 配置 (智谱 AI)
const AI_API_KEY = "94a7aa623f314a069d394926191f54fd.g5GIUDJF9pJ8a7ZH";
const AI_API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions";

// 常用英文单词库（内联以避免 ES 模块跨域问题）
// 用于基础的随机单词生成
const words = [
    "the", "be", "to", "of", "and", "a", "in", "that", "have", "I",
    "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
    "this", "but", "his", "by", "from", "they", "we", "say", "her", "she",
    "or", "an", "will", "my", "one", "all", "would", "there", "their", "what",
    "so", "up", "out", "if", "about", "who", "get", "which", "go", "me",
    "when", "make", "can", "like", "time", "no", "just", "him", "know", "take",
    "people", "into", "year", "your", "good", "some", "could", "them", "see", "other",
    "than", "then", "now", "look", "only", "come", "its", "over", "think", "also",
    "back", "after", "use", "two", "how", "our", "work", "first", "well", "way",
    "even", "new", "want", "because", "any", "these", "give", "day", "most", "us",
    "is", "was", "are", "been", "has", "had", "were", "said", "each", "being",
    "made", "find", "more", "long", "here", "thing", "very", "still", "own", "should",
    "house", "world", "need", "too", "never", "let", "down", "same", "another", "great",
    "must", "home", "big", "high", "school", "through", "every", "old", "does", "public",
    "last", "might", "state", "keep", "feel", "while", "away", "turn", "both", "few",
    "seem", "put", "much", "mean", "part", "real", "life", "right", "between", "system",
    "such", "show", "hand", "place", "during", "small", "end", "group", "against", "order",
    "begin", "face", "head", "form", "point", "man", "word", "may", "try",
    "ask", "found", "run", "under", "line", "child", "woman", "side", "before", "move",
    "increase", "early", "late", "consider", "around", "number", "course", "program", "change", "company"
];

// ============================================
// 应用程序状态 (State)
// ============================================
const state = {
    // 测试配置
    testType: 'time',     // 'time' (倒计时) 或 'words' (定额单词)
    testDuration: 30,     // 时间模式下的持续秒数
    wordCount: 25,        // 单词模式下的目标词数
    includePunctuation: false, // 是否包含标点
    includeNumbers: false,     // 是否包含数字

    // AI 模式状态
    aiMode: false,        // 是否启用 AI 生成内容
    aiWords: [],          // AI 生成的单词缓存
    isAiLoading: false,   // AI 请求加载状态

    // 测试运行状态
    isTestActive: false,  // 测试是否正在进行中
    isTestComplete: false,// 测试是否已结束
    startTime: null,      // 测试开始时间戳
    endTime: null,        // 测试结束时间戳
    timeRemaining: 30,    // 倒计时剩余秒数
    timerInterval: null,  // 计时器句柄

    // 打字进度
    currentWordIndex: 0,  // 当前正在输入的单词索引
    currentCharIndex: 0,  // 当前字符索引 (未使用，保留)
    typedHistory: [],     // 已输入的单词历史 (用于回溯和统计)
    generatedWords: [],   // 当前测试的所有目标单词

    // 统计数据 (用于计算准确率)
    totalKeystrokes: 0,      // 总按键次数
    correctKeystrokes: 0,    // 正确按键次数 (用于计算真实准确率)

    // 详细字符统计 (正确/错误/多余/漏打)
    correctChars: 0,
    incorrectChars: 0,
    extraChars: 0,
    missedChars: 0,

    // 图表历史数据
    wpmHistory: [],     // WPM 趋势
    rawWpmHistory: [],  // 原始 WPM (含错误)
    errorHistory: [],   // 错误数趋势
    burstHistory: [],   // 爆发速度 (Burst)
    timeLabels: [],     // 时间轴标签

    // 爆发速度追踪
    lastCharCount: 0,   // 上一次检查时的字符总数
    lastCheckTime: 0,   // 上一次检查的时间戳

    // 焦点状态
    isFocused: false    // 当前窗口/输入框是否聚焦
};

// ============================================
// DOM 元素引用
// ============================================
const elements = {
    // 容器类
    wordsContainer: document.getElementById('words-container'),
    wordsWrapper: document.getElementById('words-wrapper'), // 滚动的内部包装器
    wordsElement: document.getElementById('words'),         // 存放单词节点的容器
    hiddenInput: document.getElementById('hidden-input'),   // 隐形输入框
    caret: document.getElementById('caret'),                // 自定义光标
    focusOverlay: document.getElementById('focus-overlay'), // 聚焦提示层
    typingTest: document.getElementById('typing-test'),     // 测试主区域
    results: document.getElementById('results'),            // 结果面板

    // 实时状态显示
    liveWpm: document.getElementById('live-wpm'),
    liveAccuracy: document.getElementById('live-accuracy'),
    liveTimer: document.getElementById('live-timer'),
    timerLabel: document.getElementById('timer-label'),

    // 配置按钮
    timeOptions: document.getElementById('time-options'),
    wordsOptions: document.getElementById('words-options'),
    aiModeBtn: document.getElementById('ai-mode-btn'),

    // 结果页元素
    resultWpm: document.getElementById('result-wpm'),
    resultAccuracy: document.getElementById('result-accuracy'),
    resultRawWpm: document.getElementById('result-raw-wpm'),
    resultCorrect: document.getElementById('result-correct'),
    resultIncorrect: document.getElementById('result-incorrect'),
    resultExtra: document.getElementById('result-extra'),
    resultMissed: document.getElementById('result-missed'),
    resultConsistency: document.getElementById('result-consistency'),
    resultTime: document.getElementById('result-time'),
    resultTestType: document.getElementById('result-test-type'),

    // 图表相关
    wpmChart: document.getElementById('wpm-chart'),
    chartContainer: document.getElementById('chart-container'),
    chartTooltip: document.getElementById('chart-tooltip'),

    // 操作按钮
    restartBtn: document.getElementById('restart-btn'),
    nextTestBtn: document.getElementById('next-test-btn')
};

// ============================================
// AI 内容生成服务
// ============================================
async function fetchAIContent() {
    state.isAiLoading = true;
    updateAIButtonState();

    // 生成时隐藏聚焦遮罩，以便用户看到流式输出
    if (elements.focusOverlay) elements.focusOverlay.classList.remove('visible');

    // 显示流式输出的临时容器
    if (elements.wordsElement) {
        elements.wordsElement.innerHTML = '<div id="ai-stream-output" style="color:var(--sub-color); text-align:left; padding: 1rem; font-family: Roboto Mono; white-space: pre-wrap; font-size: 1.2rem; line-height: 1.6;"></div>';
    }
    const streamOutput = document.getElementById('ai-stream-output');

    // 计算目标生成词数
    let targetWords = 50;
    if (state.testType === 'words') {
        targetWords = state.wordCount; // 严格匹配用户选择的词数
    } else {
        targetWords = Math.max(30, Math.ceil(state.testDuration * 3)); // 根据时间估算所需的词数
    }

    try {
        const response = await fetch(AI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AI_API_KEY}`
            },
            body: JSON.stringify({
                model: "glm-4-flash",
                messages: [
                    {
                        role: "user",
                        content: `Generate coherent English text containing strictly ${targetWords} words. The topic can be random. Return ONLY the raw text. Do not include numbering, bullet points, or introductory phrases.`
                    }
                ],
                max_tokens: 4096,
                temperature: 0.8,
                stream: true // 开启流式响应
            })
        });

        if (!response.ok) throw new Error('API Request Failed');

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let fullText = "";

        // 处理流式数据
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
                const trimmedLine = line.trim();
                if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;

                const dataStr = trimmedLine.substring(6);
                if (dataStr === '[DONE]') break;

                try {
                    const json = JSON.parse(dataStr);
                    const delta = json.choices[0].delta.content || "";
                    fullText += delta;

                    // 实时显示生成的内容
                    if (streamOutput) {
                        streamOutput.textContent = fullText;
                        elements.wordsContainer.scrollTop = elements.wordsContainer.scrollHeight;
                    }
                } catch (e) {
                    // 忽略不完整的 JSON 块
                }
            }
        }

        // 处理最终文本：清理换行和多余空格
        const cleanText = fullText.replace(/[\n\r]/g, ' ').replace(/\s+/g, ' ').trim();
        state.aiWords = cleanText.split(' ');

        // 重置测试以加载新内容
        resetTest();

    } catch (error) {
        console.error('AI Generation Error:', error);
        alert('AI 内容生成失败，请检查控制台详情。');
        toggleAIMode(false);
    } finally {
        state.isAiLoading = false;
        updateAIButtonState();
    }
}

// 切换 AI 模式
function toggleAIMode(forceState = null) {
    if (forceState !== null) {
        state.aiMode = forceState;
    } else {
        // 点击按钮始终激活并重新生成
        state.aiMode = true;
    }

    if (state.aiMode) {
        fetchAIContent();
    } else {
        state.aiWords = [];
        resetTest();
    }
    updateAIButtonState();
}

// 更新 AI 按钮状态 (加载中/空闲)
function updateAIButtonState() {
    const btn = elements.aiModeBtn;
    if (!btn) return;

    if (state.aiMode && state.isAiLoading) {
        btn.classList.add('active');
        btn.innerHTML = '⏳ Generating...';
        btn.disabled = true;
    } else {
        // 即使在 AI 模式下，只要不是正在加载，按钮也恢复默认状态
        btn.classList.remove('active');
        btn.innerHTML = '🤖 AI生成';
        btn.disabled = false;
    }
}

// ============================================
// 单词生成逻辑
// ============================================

// Fisher-Yates 洗牌算法
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// 生成测试用的单词列表
function generateWords() {
    // 优先使用 AI 生成的内容
    if (state.aiMode && state.aiWords.length > 0) {
        return [...state.aiWords];
    }

    let count = 100;
    if (state.testType === 'words') {
        count = state.wordCount;
    } else {
        // 时间模式：生成足够多的单词 (假设 3词/秒 的极速)
        count = Math.max(100, Math.ceil(state.testDuration * 3));
    }

    let generatedWords = [];

    // 从基础词库随机抽取
    while (generatedWords.length < count) {
        const shuffled = shuffleArray(words);
        generatedWords = generatedWords.concat(shuffled);
    }

    generatedWords = generatedWords.slice(0, count);

    // 如果启用了标点模式，随机添加标点
    if (state.includePunctuation) {
        const punctuation = ['.', ',', '!', '?', ';', ':'];
        generatedWords = generatedWords.map((word, index) => {
            if (Math.random() < 0.15) {
                const punc = punctuation[Math.floor(Math.random() * punctuation.length)];
                return word + punc;
            }
            return word;
        });
    }

    // 如果启用了数字模式，随机替换单词为数字
    if (state.includeNumbers) {
        generatedWords = generatedWords.map((word, index) => {
            if (Math.random() < 0.1) {
                return Math.floor(Math.random() * 1000).toString();
            }
            return word;
        });
    }

    return generatedWords;
}

// ============================================
// 单词渲染
// ============================================
function renderWords() {
    elements.wordsElement.innerHTML = '';

    state.generatedWords.forEach((word, wordIndex) => {
        const wordElement = document.createElement('div');
        wordElement.className = 'word';
        if (wordIndex === state.currentWordIndex) {
            wordElement.classList.add('current');
        }

        word.split('').forEach((char, charIndex) => {
            const letterElement = document.createElement('span');
            letterElement.className = 'letter';
            letterElement.textContent = char;

            // 根据打字历史应用样式 (正确/错误)
            if (wordIndex < state.currentWordIndex) {
                // 已完成的单词
                const typedWord = state.typedHistory[wordIndex] || '';
                if (charIndex < typedWord.length) {
                    if (typedWord[charIndex] === char) {
                        letterElement.classList.add('correct');
                    } else {
                        letterElement.classList.add('incorrect');
                    }
                } else {
                    letterElement.classList.add('incorrect'); // 漏打的字符标红
                }
            } else if (wordIndex === state.currentWordIndex) {
                // 当前正在输入的单词
                const currentTyped = elements.hiddenInput.value;
                if (charIndex < currentTyped.length) {
                    if (currentTyped[charIndex] === char) {
                        letterElement.classList.add('correct');
                    } else {
                        letterElement.classList.add('incorrect');
                    }
                }
            }

            wordElement.appendChild(letterElement);
        });

        // 处理“额外”输入的字符 (超长部分)
        let typedForExtra = '';
        if (wordIndex === state.currentWordIndex) {
            typedForExtra = elements.hiddenInput.value;
        } else if (wordIndex < state.currentWordIndex) {
            typedForExtra = state.typedHistory[wordIndex] || '';
        }

        if (typedForExtra.length > word.length) {
            const extra = typedForExtra.slice(word.length);
            extra.split('').forEach(char => {
                const extraElement = document.createElement('span');
                extraElement.className = 'letter extra';
                extraElement.textContent = char;
                wordElement.appendChild(extraElement);
            });
        }

        elements.wordsElement.appendChild(wordElement);
    });

    // 渲染完成后更新光标和滚动位置
    updateCaretPosition();
    scrollWords();
}

// ============================================
// 光标位置计算
// ============================================
function updateCaretPosition() {
    // 使用 requestAnimationFrame 确保在 DOM 渲染完成后执行
    requestAnimationFrame(() => {
        const wordElements = elements.wordsElement.querySelectorAll('.word');
        const currentWord = wordElements[state.currentWordIndex];

        if (!currentWord) return;

        // 获取所有字母元素，包括 extra 字符
        const allLetters = currentWord.querySelectorAll('.letter');
        const currentTyped = elements.hiddenInput.value;
        const wordText = state.generatedWords[state.currentWordIndex] || '';

        let targetElement;
        let useRightEdge = false;

        if (allLetters.length === 0) return;

        if (currentTyped.length === 0) {
            // 单词开头 - 定位到第一个字母的左边
            targetElement = allLetters[0];
        } else if (currentTyped.length > wordText.length) {
            // 输入超长 - 定位到最后一个(含额外)字母的右边
            targetElement = allLetters[allLetters.length - 1];
            useRightEdge = true;
        } else if (currentTyped.length === wordText.length) {
            // 单词刚输完 - 定位到最后一个字母的右边
            targetElement = allLetters[allLetters.length - 1];
            useRightEdge = true;
        } else {
            // 单词中间 - 定位到下一个待输入字母的左边
            targetElement = allLetters[currentTyped.length];
        }

        if (targetElement) {
            // 计算相对位置 (基于 wordsWrapper)
            const containerRect = elements.wordsWrapper.getBoundingClientRect();
            const letterRect = targetElement.getBoundingClientRect();

            let left = useRightEdge
                ? letterRect.right - containerRect.left
                : letterRect.left - containerRect.left;
            const top = letterRect.top - containerRect.top;

            // 动态调整光标高度
            const fontSize = parseFloat(window.getComputedStyle(targetElement).fontSize);
            elements.caret.style.height = `${fontSize * 1.2}px`;
            elements.caret.style.left = `${left}px`;
            // 垂直居中对齐
            elements.caret.style.top = `${top + (letterRect.height - fontSize * 1.2) / 2}px`;
        }
    });
}

// ============================================
// 滚动控制
// ============================================
function scrollWords() {
    const wordElements = elements.wordsElement.querySelectorAll('.word');
    const currentWord = wordElements[state.currentWordIndex];

    if (!currentWord) return;

    const currentWordTop = currentWord.offsetTop;

    // 始终保持当前行在视口顶部
    elements.wordsWrapper.style.transform = `translateY(-${currentWordTop}px)`;
}

// ============================================
// 计时器功能
// ============================================
function startTimer() {
    if (state.timerInterval) {
        clearInterval(state.timerInterval);
    }

    state.startTime = Date.now();
    state.lastCheckTime = state.startTime; // 初始化 Burst 追踪
    state.lastCharCount = 0;

    if (state.testType === 'time') {
        // 倒计时模式
        state.timeRemaining = state.testDuration;
        elements.liveTimer.textContent = state.timeRemaining;

        state.timerInterval = setInterval(() => {
            state.timeRemaining--;
            elements.liveTimer.textContent = state.timeRemaining;

            updateLiveStats(true); // 每秒更新统计数据和图表

            if (state.timeRemaining <= 0) {
                endTest();
            }
        }, 1000);
    } else {
        // 单词模式 - 正向计时
        state.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
            elements.liveTimer.textContent = elapsed;
            updateLiveStats(true); // 更新图表
        }, 1000);
    }
}

function stopTimer() {
    if (state.timerInterval) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
    }
}

// ============================================
// 统计数据计算
// ============================================
function calculateWPM() {
    if (!state.startTime) return 0;

    const timeElapsed = (Date.now() - state.startTime) / 1000 / 60; // 分钟
    if (timeElapsed === 0) return 0;

    let correctChars = 0;
    // 遍历历史单词计算正确字符
    state.typedHistory.forEach((typed, index) => {
        const original = state.generatedWords[index];
        if (!original) return;
        for (let i = 0; i < Math.min(typed.length, original.length); i++) {
            if (typed[i] === original[i]) {
                correctChars++;
            }
        }
        // 如果正确完成了单词，空格也算一个正确字符
        if (index < state.typedHistory.length - 1) {
            correctChars++;
        }
    });

    // 加上当前正在输入的单词
    const currentTyped = elements.hiddenInput.value;
    const currentWord = state.generatedWords[state.currentWordIndex];
    if (currentWord) {
        for (let i = 0; i < Math.min(currentTyped.length, currentWord.length); i++) {
            if (currentTyped[i] === currentWord[i]) {
                correctChars++;
            }
        }
    }

    // 标准 WPM 公式：(字符数 / 5) / 分钟数
    return Math.round((correctChars / 5) / timeElapsed);
}

function calculateRawWPM() {
    if (!state.startTime) return 0;

    const timeElapsed = (Date.now() - state.startTime) / 1000 / 60;
    if (timeElapsed === 0) return 0;

    let totalChars = 0;
    state.typedHistory.forEach((typed, index) => {
        totalChars += typed.length;
        if (index < state.typedHistory.length - 1) {
            totalChars++; // 空格
        }
    });
    totalChars += elements.hiddenInput.value.length;

    return Math.round((totalChars / 5) / timeElapsed);
}

function calculateAccuracy() {
    // 基于真实按键统计：正确按键 / 总按键
    if (state.totalKeystrokes === 0) return 100;
    return Math.round((state.correctKeystrokes / state.totalKeystrokes) * 100);
}

function updateLiveStats(pushToChart = false) {
    const wpm = calculateWPM();
    const rawWpm = calculateRawWPM();
    const accuracy = calculateAccuracy();

    elements.liveWpm.textContent = wpm;
    elements.liveAccuracy.textContent = accuracy;

    if (pushToChart) {
        // 计算 Burst (瞬时爆发速度)
        const now = Date.now();
        const timeDiff = (now - state.lastCheckTime) / 1000; // 秒

        // 计算当前总字符数
        let totalChars = 0;
        state.typedHistory.forEach((t, i) => {
            totalChars += t.length;
            if (i < state.typedHistory.length - 1) totalChars++;
        });
        totalChars += elements.hiddenInput.value.length;

        let burst = 0;
        if (timeDiff > 0 && state.lastCheckTime > 0) {
            const charDiff = totalChars - state.lastCharCount;
            // Burst WPM
            if (charDiff > 0) {
                burst = Math.round((charDiff / 5) / (timeDiff / 60));
            }
        }

        // 更新状态以供下次计算
        state.lastCheckTime = now;
        state.lastCharCount = totalChars;

        // 记录历史数据
        state.wpmHistory.push(wpm);
        state.rawWpmHistory.push(rawWpm);
        state.burstHistory.push(burst);

        // 记录这一时刻的错误数
        const charStats = calculateCharStats();
        state.errorHistory.push(charStats.incorrect + charStats.extra);

        // 记录时间标签
        const elapsed = state.startTime ? Math.floor((Date.now() - state.startTime) / 1000) : 0;
        state.timeLabels.push(elapsed);
    }
}

function calculateConsistency() {
    if (state.wpmHistory.length < 2) return 100;

    // 计算标准差和变异系数
    const mean = state.wpmHistory.reduce((a, b) => a + b, 0) / state.wpmHistory.length;
    const variance = state.wpmHistory.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / state.wpmHistory.length;
    const stdDev = Math.sqrt(variance);

    // 一致性 = 100% - 变异系数 (CV)
    const cv = (stdDev / mean) * 100;
    return Math.max(0, Math.round(100 - cv));
}

// ============================================
// 字符详细统计
// ============================================
function calculateCharStats() {
    let correct = 0;
    let incorrect = 0;
    let extra = 0;
    let missed = 0;

    // 遍历历史输入
    state.typedHistory.forEach((typed, index) => {
        const original = state.generatedWords[index];
        if (!original) return;

        for (let i = 0; i < Math.max(typed.length, original.length); i++) {
            if (i < typed.length && i < original.length) {
                if (typed[i] === original[i]) {
                    correct++;
                } else {
                    incorrect++;
                }
            } else if (i >= original.length) {
                extra++;
            } else {
                missed++;
            }
        }
    });

    // 加上当前暂存的输入 (如果测试未结束)
    if (state.isTestActive && elements.hiddenInput.value.length > 0) {
        const currentTyped = elements.hiddenInput.value;
        const currentOriginal = state.generatedWords[state.currentWordIndex];

        if (currentOriginal) {
            for (let i = 0; i < Math.max(currentTyped.length, currentOriginal.length); i++) {
                if (i < currentTyped.length && i < currentOriginal.length) {
                    if (currentTyped[i] === currentOriginal[i]) {
                        correct++;
                    } else {
                        incorrect++;
                    }
                } else if (i >= currentOriginal.length) {
                    extra++;
                } else {
                    // 当前单词暂不计入 missed，因为还没输完
                }
            }
        }
    }

    return { correct, incorrect, extra, missed };
}

// ============================================
// 测试流程控制
// ============================================
function startTest() {
    if (state.isTestActive) return;

    state.isTestActive = true;
    state.isTestComplete = false;
    elements.caret.classList.add('active'); // 激活光标闪烁
    startTimer();
}

function endTest() {
    state.isTestActive = false;
    state.isTestComplete = true;
    state.endTime = Date.now();
    elements.caret.classList.remove('active');
    stopTimer();

    // 如果还有正在输入的词，保存到历史记录
    if (elements.hiddenInput.value) {
        state.typedHistory.push(elements.hiddenInput.value);
    }

    showResults();
}

function resetTest() {
    stopTimer();

    // 重置所有状态
    state.isTestActive = false;
    state.isTestComplete = false;
    state.startTime = null;
    state.endTime = null;
    state.currentWordIndex = 0;
    state.currentCharIndex = 0;
    state.typedHistory = [];
    state.totalKeystrokes = 0;
    state.correctKeystrokes = 0;
    state.correctChars = 0;
    state.incorrectChars = 0;
    state.extraChars = 0;
    state.missedChars = 0;
    state.wpmHistory = [];
    state.rawWpmHistory = [];
    state.errorHistory = [];
    state.burstHistory = [];
    state.lastCharCount = 0;
    state.lastCheckTime = 0;
    state.timeLabels = [];

    // 重置界面
    elements.hiddenInput.value = '';
    elements.wordsWrapper.style.transform = 'translateY(0)';
    setTimeout(() => {
        if (elements.wordsContainer) elements.wordsContainer.scrollTop = 0;
    }, 0);
    elements.caret.classList.remove('active');

    // 重置实时数据文本
    elements.liveWpm.textContent = '0';
    elements.liveAccuracy.textContent = '100';

    if (state.testType === 'time') {
        state.timeRemaining = state.testDuration;
        elements.liveTimer.textContent = state.testDuration;
    } else {
        elements.liveTimer.textContent = '0';
    }

    // 切换视图
    elements.results.classList.remove('visible');
    elements.typingTest.classList.remove('hidden');

    // 生成新单词
    state.generatedWords = generateWords();
    renderWords();

    // 自动聚焦
    setTimeout(() => {
        elements.hiddenInput.focus();
    }, 100);
}

function showResults() {
    // 最终计算所有统计数据
    const wpm = calculateWPM();
    const rawWpm = calculateRawWPM();
    const accuracy = calculateAccuracy();
    const consistency = calculateConsistency();
    const charStats = calculateCharStats();
    const testTime = state.endTime && state.startTime
        ? Math.max(0, Math.round((state.endTime - state.startTime) / 1000))
        : state.testType === 'time' ? state.testDuration : 0;

    // 填充结果面板
    elements.resultWpm.textContent = wpm;
    elements.resultAccuracy.innerHTML = `${accuracy}<span class="result-unit">%</span>`;
    elements.resultRawWpm.textContent = rawWpm;
    elements.resultCorrect.textContent = charStats.correct;
    elements.resultIncorrect.textContent = charStats.incorrect;
    elements.resultExtra.textContent = charStats.extra;
    elements.resultMissed.textContent = charStats.missed;
    elements.resultConsistency.textContent = `${consistency}%`;
    elements.resultTime.textContent = `${testTime}s`;

    // 显示测试类型标签
    if (elements.resultTestType) {
        const typeLabel = state.testType === 'time' ? `time ${state.testDuration}` : `words ${state.generatedWords.length}`;
        elements.resultTestType.textContent = typeLabel;
    }

    elements.typingTest.classList.add('hidden');
    elements.results.classList.add('visible');

    // 绘制图表
    drawChart();
}

// ============================================
// 输入事件处理
// ============================================
function handleInput(e) {
    if (state.isTestComplete) return;

    const inputValue = elements.hiddenInput.value;
    const currentWord = state.generatedWords[state.currentWordIndex];

    // 第一个按键触发开始
    if (!state.isTestActive && inputValue.length > 0) {
        startTest();
    }

    // 追踪按键准确率
    if (inputValue.length > 0 && e.inputType === 'insertText' && currentWord) {
        const charIndex = inputValue.length - 1;
        const typedChar = inputValue[charIndex];
        const expectedChar = currentWord[charIndex];

        state.totalKeystrokes++;
        if (typedChar === expectedChar) {
            state.correctKeystrokes++;
        }
    }

    renderWords();

    // 单词模式下检查是否完成
    checkWordsComplete();
}

// 检查是否在单词模式下完成了所有任务
function checkWordsComplete() {
    if (state.testType !== 'words') return;
    if (state.isTestComplete) return;

    const inputValue = elements.hiddenInput.value;
    const currentWord = state.generatedWords[state.currentWordIndex];

    // 如果是最后一个单词，且输入完全正确
    if (state.currentWordIndex === state.generatedWords.length - 1 &&
        inputValue === currentWord) {
        endTest();
    }
}

function handleKeydown(e) {
    if (state.isTestComplete) return;

    // 按下空格：进入下一个单词
    if (e.key === ' ') {
        e.preventDefault();

        const typed = elements.hiddenInput.value.trim();
        if (typed.length === 0) return;

        state.typedHistory.push(typed);
        state.currentWordIndex++;
        elements.hiddenInput.value = '';

        // 仅更新文字统计，不推入图表数据 (图表由计时器驱动)
        updateLiveStats(false);

        // 检查单词模式是否结束
        if (state.testType === 'words' && state.currentWordIndex >= state.generatedWords.length) {
            endTest();
            return;
        }

        renderWords();
    }

    // Tab + Enter: 快速重启
    if (e.key === 'Tab') {
        e.preventDefault();
        state.tabPressed = true;
        setTimeout(() => { state.tabPressed = false; }, 500);
    }

    if (e.key === 'Enter' && state.tabPressed) {
        e.preventDefault();
        resetTest();
    }

    // Escape: 重置
    if (e.key === 'Escape') {
        e.preventDefault();
        resetTest();
    }

    // Backspace: 如果当前输入框为空，允许回删上一个单词
    if (e.key === 'Backspace' && elements.hiddenInput.value === '' && state.currentWordIndex > 0) {
        e.preventDefault();
        state.currentWordIndex--;
        const prevTyped = state.typedHistory.pop() || '';
        elements.hiddenInput.value = prevTyped;
        renderWords();
    }
}

// ============================================
// 焦点管理
// ============================================
function handleFocus() {
    state.isFocused = true;
    elements.focusOverlay.classList.remove('visible');
    elements.caret.style.display = 'block';

    // 恢复暂停的计时器
    if (state.isTestActive && state.isPaused) {
        state.isPaused = false;
        const pauseDuration = Date.now() - state.pauseStartTime;
        state.startTime += pauseDuration;
        if (state.lastCheckTime) state.lastCheckTime += pauseDuration;

        if (state.testType === 'time') {
            state.timerInterval = setInterval(() => {
                state.timeRemaining--;
                elements.liveTimer.textContent = state.timeRemaining;
                updateLiveStats(true);
                if (state.timeRemaining <= 0) endTest();
            }, 1000);
        } else {
            state.timerInterval = setInterval(() => {
                const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
                elements.liveTimer.textContent = elapsed;
                updateLiveStats(true);
            }, 1000);
        }
    }
}

function handleBlur() {
    state.isFocused = false;
    if (!state.isTestComplete) {
        elements.focusOverlay.classList.add('visible');
        elements.caret.style.display = 'none';

        // 暂停计时器
        if (state.isTestActive && state.timerInterval) {
            clearInterval(state.timerInterval);
            state.timerInterval = null;
            state.isPaused = true;
            state.pauseStartTime = Date.now();
        }
    }
}

// ============================================
// 配置切换逻辑
// ============================================
function handleConfigClick(e) {
    const btn = e.target.closest('.config-btn');
    if (!btn) return;

    // 切换测试类型 (Time / Words)
    if (btn.dataset.type) {
        document.querySelectorAll('[data-type]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        state.testType = btn.dataset.type;

        if (state.testType === 'time') {
            elements.timeOptions.classList.remove('hidden');
            elements.wordsOptions.classList.add('hidden');
            elements.timerLabel.textContent = '秒';
            state.testDuration = parseInt(elements.timeOptions.querySelector('.active').dataset.value);
        } else {
            elements.timeOptions.classList.add('hidden');
            elements.wordsOptions.classList.remove('hidden');
            elements.timerLabel.textContent = '词';
            state.wordCount = parseInt(elements.wordsOptions.querySelector('.active').dataset.value);
        }

        // 切换类型时退出 AI 模式
        state.aiMode = false;
        state.aiWords = [];
        updateAIButtonState();
        resetTest();
    }

    // 切换时间/单词数值
    let shouldReset = false;
    if (btn.dataset.value && btn.parentElement.id === 'time-options') {
        elements.timeOptions.querySelectorAll('.config-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.testDuration = parseInt(btn.dataset.value);
        shouldReset = true;
    }

    if (btn.dataset.value && btn.parentElement.id === 'words-options') {
        elements.wordsOptions.querySelectorAll('.config-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.wordCount = parseInt(btn.dataset.value);
        shouldReset = true;
    }

    if (shouldReset) {
        // 更改配置时退出 AI 模式
        state.aiMode = false;
        state.aiWords = [];
        updateAIButtonState();
        resetTest();
    }

    // 切换模式 (标点、数字)
    if (btn.dataset.mode === 'punctuation') {
        btn.classList.toggle('active');
        state.includePunctuation = btn.classList.contains('active');
        resetTest();
    }

    if (btn.dataset.mode === 'numbers') {
        btn.classList.toggle('active');
        state.includeNumbers = btn.classList.contains('active');
        resetTest();
    }
}

// ============================================
// 事件监听初始化
// ============================================
function initEventListeners() {
    // 监听隐藏输入框的事件
    elements.hiddenInput.addEventListener('input', handleInput);
    elements.hiddenInput.addEventListener('keydown', handleKeydown);
    elements.hiddenInput.addEventListener('focus', handleFocus);
    elements.hiddenInput.addEventListener('blur', handleBlur);
    // 窗口失焦时，确保也能触发暂停逻辑
    window.addEventListener('blur', handleBlur);

    // 点击测试区域，聚焦输入框
    elements.wordsContainer.addEventListener('click', () => {
        elements.hiddenInput.focus();
    });

    elements.focusOverlay.addEventListener('click', () => {
        elements.hiddenInput.focus();
    });

    // 监听配置栏点击
    document.querySelector('.config-bar').addEventListener('click', handleConfigClick);

    // 监听操作按钮
    elements.restartBtn.addEventListener('click', resetTest);
    elements.nextTestBtn.addEventListener('click', resetTest);

    // 监听 AI 按钮
    if (elements.aiModeBtn) {
        elements.aiModeBtn.addEventListener('click', () => toggleAIMode());
    }
}

// ============================================
// 初始化入口
// ============================================
function init() {
    // 生成初始单词
    state.generatedWords = generateWords(100);

    // 渲染 DOM
    renderWords();

    // 挂载事件
    initEventListeners();

    // 初始化计时器文本
    elements.liveTimer.textContent = state.testDuration;

    // 自动聚焦
    setTimeout(() => {
        elements.hiddenInput.focus();
    }, 100);

    console.log('TypeMaster initialized!');
}

// ============================================
// 图表绘制 (Canvas)
// ============================================
function drawChart() {
    const canvas = elements.wpmChart;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;

    // 动态设置 Canvas 尺寸以匹配容器
    canvas.width = container.clientWidth - 32; // 减去 padding
    canvas.height = container.clientHeight - 40; // 减去图例空间

    const width = canvas.width;
    const height = canvas.height;
    const padding = { top: 20, right: 40, bottom: 30, left: 55 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // 清空画布
    ctx.clearRect(0, 0, width, height);

    // 获取数据源
    const wpmData = state.wpmHistory;
    const rawData = state.rawWpmHistory;
    const burstData = state.burstHistory;
    const errorData = state.errorHistory;
    const labels = state.timeLabels;

    if (wpmData.length < 2) return;

    // 计算 Y 轴刻度
    const maxWpm = Math.max(...wpmData, ...rawData, ...burstData, 10) * 1.2;
    // 强制错误刻度为 4 的倍数，以便均匀分布
    const maxDataError = Math.max(...errorData, 1);
    const maxErrors = Math.ceil((maxDataError * 1.5) / 4) * 4;
    const xStep = chartWidth / (wpmData.length - 1);

    // 保存图表信息供 Tooltip 使用
    window.chartInfo = {
        padding,
        xStep,
        wpmData,
        rawData,
        burstData,
        errorData,
        labels,
        maxWpm,
        chartHeight,
        chartWidth
    };

    // 绘制网格线
    ctx.strokeStyle = 'rgba(100, 102, 105, 0.3)';
    ctx.lineWidth = 1;

    // 水平网格线 (5条)
    for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();

        // 左轴标签 (WPM)
        const wpmValue = Math.round(maxWpm * (1 - i / 4));
        ctx.fillStyle = '#646669';
        ctx.font = '10px Roboto Mono';
        ctx.textAlign = 'right';
        ctx.fillText(wpmValue, padding.left - 5, y + 4);

        // 右轴标签 (Errors)
        const errorValue = Math.round(maxErrors * (1 - i / 4));
        ctx.textAlign = 'left';
        ctx.fillStyle = '#646669';
        if (errorValue > 0 || i === 4) {
            if (Math.max(...errorData) > 0) {
                ctx.fillText(errorValue, width - padding.right + 5, y + 4);
            }
        }
    }

    // X 轴标签 (时间)
    ctx.textAlign = 'center';
    ctx.fillStyle = '#646669';
    const labelStep = Math.max(1, Math.floor(labels.length / 6)); // 如果数据太多，跳过部分标签
    for (let i = 0; i < labels.length; i += labelStep) {
        const x = padding.left + i * xStep;
        ctx.fillText(labels[i], x, height - 10);
    }

    // 绘制错误标记 (红色 X)
    ctx.fillStyle = '#ca4754';
    ctx.font = 'bold 12px Roboto Mono';
    ctx.textAlign = 'center';
    for (let i = 0; i < errorData.length; i++) {
        // 如果当前时刻有新增错误
        if (errorData[i] > (i > 0 ? errorData[i - 1] : 0)) {
            const x = padding.left + i * xStep;
            // 映射到右轴高度
            const y = padding.top + chartHeight - (errorData[i] / maxErrors) * chartHeight;
            ctx.fillText('×', x, y);
        }
    }

    // 坐标映射帮助函数
    const mapPoint = (val, i) => ({
        x: padding.left + i * xStep,
        y: padding.top + chartHeight - (val / maxWpm) * chartHeight
    });

    const baselineY = padding.top + chartHeight;

    // 1. 绘制 Burst 线 (灰色实线)
    const burstPoints = burstData.map(mapPoint);
    ctx.strokeStyle = '#646669';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    drawSmoothLine(ctx, burstPoints, baselineY);

    // 2. 绘制 Raw WPM 线 (黄色虚线)
    const rawPoints = rawData.map(mapPoint);
    ctx.strokeStyle = '#e2b714';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    drawSmoothLine(ctx, rawPoints, baselineY);
    ctx.setLineDash([]);

    // 3. 绘制 WPM 线 (黄色实线)
    const wpmPoints = wpmData.map(mapPoint);
    ctx.strokeStyle = '#e2b714';
    ctx.lineWidth = 2.5;
    drawSmoothLine(ctx, wpmPoints, baselineY);

    // 绘制 WPM 数据点 (小圆点)
    ctx.fillStyle = '#e2b714';
    wpmPoints.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
    });

    // 绘制 WPM 轴标题
    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#646669';
    ctx.font = '12px Roboto Mono';
    ctx.fillText('Words per Minute', 0, 0);
    ctx.restore();

    // 设置 Tooltip 交互监听 (仅一次)
    setupChartTooltip();
}

// 绘制平滑曲线 (贝塞尔曲线)
function drawSmoothLine(ctx, points, baselineY) {
    if (points.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[Math.max(0, i - 1)];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[Math.min(points.length - 1, i + 2)];

        // 计算控制点 (Catmull-Rom 插值)
        let cp1x = p1.x + (p2.x - p0.x) / 6;
        let cp1y = p1.y + (p2.y - p0.y) / 6;
        let cp2x = p2.x - (p3.x - p1.x) / 6;
        let cp2y = p2.y - (p3.y - p1.y) / 6;

        // 限制 Y 轴不超过基线 (防止溢出)
        if (baselineY) {
            cp1y = Math.min(cp1y, baselineY);
            cp2y = Math.min(cp2y, baselineY);
        }

        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }
    ctx.stroke();
}

// 图表 Tooltip 鼠标交互
function setupChartTooltip() {
    const canvas = elements.wpmChart;
    const tooltip = elements.chartTooltip;
    const container = elements.chartContainer;

    if (!canvas || !tooltip || !container) return;

    // 清除旧监听器
    canvas.onmousemove = null;
    canvas.onmouseleave = null;

    canvas.onmousemove = function (e) {
        const info = window.chartInfo;
        if (!info) return;

        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;

        // 查找最近的数据点
        const dataIndex = Math.round((mouseX - info.padding.left) / info.xStep);

        // 如果鼠标在有效数据范围内
        if (dataIndex >= 0 && dataIndex < info.wpmData.length) {
            const wpm = info.wpmData[dataIndex];
            const raw = info.rawData[dataIndex];
            const burst = info.burstData[dataIndex];
            const errors = info.errorData[dataIndex];
            const time = info.labels[dataIndex];

            // 更新 Tooltip 内容
            tooltip.querySelector('.tooltip-time').textContent = time;
            tooltip.querySelector('.tooltip-wpm').textContent = wpm;
            tooltip.querySelector('.tooltip-raw').textContent = raw;
            tooltip.querySelector('.tooltip-burst').textContent = burst;
            tooltip.querySelector('.tooltip-errors').textContent = errors;

            // 定位 Tooltip (跟随鼠标，防止溢出右边界)
            const tooltipX = Math.min(mouseX + 10, container.clientWidth - 120);
            const tooltipY = 30;
            tooltip.style.left = tooltipX + 'px';
            tooltip.style.top = tooltipY + 'px';

            tooltip.classList.add('visible');
        }
    };

    canvas.onmouseleave = function () {
        tooltip.classList.remove('visible');
    };
}

// 启动应用程序
init();
