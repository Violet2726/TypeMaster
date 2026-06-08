let audioContext = null;

function getAudioContext() {
    if (typeof window === 'undefined') {
        return null;
    }

    const AudioContextRef = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextRef) {
        return null;
    }

    if (!audioContext) {
        audioContext = new AudioContextRef();
    }

    if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {});
    }

    return audioContext;
}

function playTone(context, frequency, duration, gainValue, waveform = 'sine') {
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    const now = context.currentTime;

    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(frequency, now);
    gainNode.gain.setValueAtTime(gainValue, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
}

export function playTypingSound(type) {
    const context = getAudioContext();
    if (!context) {
        return;
    }

    if (type === 'error') {
        playTone(context, 180, 0.08, 0.018, 'triangle');
        return;
    }

    if (type === 'confirm') {
        playTone(context, 520, 0.05, 0.014, 'square');
        return;
    }

    if (type === 'backspace') {
        playTone(context, 260, 0.04, 0.01, 'sawtooth');
        return;
    }

    playTone(context, 420, 0.03, 0.01, 'square');
}
