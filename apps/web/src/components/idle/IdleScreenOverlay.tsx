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
  { id: 'adventure', key: 'Enter', icon: '\u2694\uFE0F', label: '\u5192\u9669\u6A21\u5F0F', desc: '\u4E09\u5E55Roguelike\u6253\u5B57\u5192\u9669', color: '#0a84ff' },
  { id: 'daily', key: 'D', icon: '\uD83D\uDCC5', label: '\u6BCF\u65E5\u6311\u6218', desc: '\u4ECA\u65E5\u7279\u522B\u8BCD\u5E93+\u6392\u884C', color: '#ff9f0a' },
  { id: 'practice', key: 'P', icon: '\uD83C\uDFB2', label: '\u7EC3\u4E60\u6A21\u5F0F', desc: '\u65E0\u538B\u529B\u81EA\u7531\u6253\u5B57', color: '#34c759' },
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
    <div className="idle-overlay" ref={containerRef}>
      {/* Hero */}
      <div className="idle-hero">
        <p className="idle-hero__eyebrow">TYPING MASTER</p>
        <h1 className="idle-hero__title"><span>{'\u6253\u5B57\u7A81\u88AD'}</span></h1>
        <p className="idle-hero__subtitle">{'\u7528\u952E\u76D8\u5F81\u670D\u4E00\u5207'}</p>
      </div>

      {/* Stats */}
      {stats.totalGames > 0 && (
        <div className="idle-stats">
          <div className="idle-stats__item">
            <div className="idle-stats__value">{stats.totalGames}</div>
            <div className="idle-stats__label">{'\u603B\u5C40\u6570'}</div>
          </div>
          <div className="idle-stats__item">
            <div className="idle-stats__value">{stats.bestScore.toLocaleString()}</div>
            <div className="idle-stats__label">{'\u6700\u9AD8\u5206'}</div>
          </div>
          <div className="idle-stats__item">
            <div className="idle-stats__value">{stats.bestWpm}</div>
            <div className="idle-stats__label">{'\u5CF0\u503CWPM'}</div>
          </div>
          <div className="idle-stats__item">
            <div className="idle-stats__value">{stats.avgAccuracy}%</div>
            <div className="idle-stats__label">{'\u5E73\u5747\u51C6\u786E'}</div>
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
        <span className="idle-cta__key">{'\u23CE'}</span>
        {'\u5F00\u59CB\u5192\u9669'}
      </button>

      {/* Hint */}
      <div className="idle-hint">
        <kbd>{'\u2190'}</kbd> <kbd>{'\u2192'}</kbd> {'\u5BFC\u822A'} &nbsp; <kbd>Enter</kbd> {'\u9009\u62E9'} &nbsp; {'\u6216\u76F4\u63A5\u70B9\u51FB\u5361\u7247'}
      </div>
    </div>
  );
}
