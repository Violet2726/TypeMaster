'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import './idle-screen.css';

// ---------------------------------------------------------------------------
// Mode definitions
// ---------------------------------------------------------------------------

interface GameMode {
  id: string;
  key: string;
  icon: string;
  label: string;
  desc: string;
  color: string;
}

const GAME_MODES: GameMode[] = [
  { id: 'adventure', key: 'Enter', icon: '★', label: '冒险模式', desc: '三幕Roguelike打字冒险', color: '#0a84ff' },
  { id: 'daily', key: 'D', icon: '◆', label: '每日挑战', desc: '今日特别词库+排行', color: '#ff9f0a' },
  { id: 'practice', key: 'P', icon: '●', label: '练习模式', desc: '无压力自由打字', color: '#34c759' },
];

// ---------------------------------------------------------------------------
// Stats interface
// ---------------------------------------------------------------------------

interface PlayerStats {
  totalGames: number;
  bestScore: number;
  bestWpm: number;
  avgAccuracy: number;
}

function loadStats(): PlayerStats {
  try {
    const raw = localStorage.getItem('typemaster-stats');
    if (raw) {
      const data = JSON.parse(raw);
      return {
        totalGames: data.totalGames || 0,
        bestScore: data.bestScore || 0,
        bestWpm: data.bestWpm || 0,
        avgAccuracy: data.avgAccuracy || 0,
      };
    }
  } catch {}
  return { totalGames: 0, bestScore: 0, bestWpm: 0, avgAccuracy: 0 };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface IdleScreenOverlayProps {
  onAction: (action: string) => void;
}

export default function IdleScreenOverlay({ onAction }: IdleScreenOverlayProps) {
  const [stats, setStats] = useState<PlayerStats>({ totalGames: 0, bestScore: 0, bestWpm: 0, avgAccuracy: 0 });
  const [selectedIdx, setSelectedIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setStats(loadStats());
  }, []);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      setSelectedIdx(i => (i - 1 + GAME_MODES.length) % GAME_MODES.length);
      return;
    }
    if (e.key === 'ArrowRight') {
      setSelectedIdx(i => (i + 1) % GAME_MODES.length);
      return;
    }
    if (e.key === 'Enter') {
      onAction(GAME_MODES[selectedIdx].id);
      return;
    }
    const match = GAME_MODES.find(m => m.key.toLowerCase() === e.key.toLowerCase());
    if (match) {
      onAction(match.id);
    }
  }, [selectedIdx, onAction]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  return (
    <div className="idle-overlay idle-overlay--dim" ref={containerRef}>
      {/* Hero */}
      <div className="idle-hero">
        <p className="idle-hero__eyebrow">TYPING MASTER</p>
        <h1 className="idle-hero__title"><span>{'打字突袭'}</span></h1>
        <p className="idle-hero__subtitle">{'用键盘征服一切'}</p>
      </div>

      {/* Stats */}
      {stats.totalGames > 0 && (
        <div className="idle-stats">
          <div className="idle-stats__item">
            <div className="idle-stats__value">{stats.totalGames}</div>
            <div className="idle-stats__label">{'总局数'}</div>
          </div>
          <div className="idle-stats__item">
            <div className="idle-stats__value">{stats.bestScore.toLocaleString()}</div>
            <div className="idle-stats__label">{'最高分'}</div>
          </div>
          <div className="idle-stats__item">
            <div className="idle-stats__value">{stats.bestWpm}</div>
            <div className="idle-stats__label">{'峰值WPM'}</div>
          </div>
          <div className="idle-stats__item">
            <div className="idle-stats__value">{stats.avgAccuracy}%</div>
            <div className="idle-stats__label">{'平均准确'}</div>
          </div>
        </div>
      )}

      {/* Mode cards */}
      <div className="idle-modes">
        {GAME_MODES.map((mode, i) => (
          <div
            key={mode.id}
            className={`idle-mode-card${i === selectedIdx ? ' idle-mode-card--selected' : ''}`}
            onClick={() => onAction(mode.id)}
            onMouseEnter={() => setSelectedIdx(i)}
            tabIndex={0}
            role="button"
            aria-label={mode.label}
          >
            <span className="idle-mode-card__key">{mode.key}</span>
            <span className="idle-mode-card__icon">{mode.icon}</span>
            <span className="idle-mode-card__label">{mode.label}</span>
            <span className="idle-mode-card__desc">{mode.desc}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button className="idle-cta" onClick={() => onAction('adventure')}>
        <span className="idle-cta__key">{'⏎'}</span>
        {'开始冒险'}
      </button>

      {/* Hint */}
      <div className="idle-hint">
        <kbd>{'←'}</kbd> <kbd>{'→'}</kbd> {'导航'} &nbsp; <kbd>Enter</kbd> {'选择'} &nbsp; {'或直接点击卡片'}
      </div>
    </div>
  );
}
