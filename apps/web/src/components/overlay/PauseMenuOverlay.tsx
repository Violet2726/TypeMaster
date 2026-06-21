'use client';

import { useState, useEffect, useCallback } from 'react';
import './overlays.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PauseStats {
  score: number;
  wave: number;
  combo: number;
  maxCombo: number;
  lives: number;
  maxLives: number;
  enemiesDefeated: number;
  accuracy: number;
  wpm: number;
  duration: number;
}

interface PauseMenuOverlayProps {
  stats: PauseStats;
  onAction: (action: string) => void;
}

// ---------------------------------------------------------------------------
// Menu items
// ---------------------------------------------------------------------------

const MENU_ITEMS = [
  { id: 'continue', label: '\u7EE7\u7EED', sub: 'Return to game', icon: '\u25B6', key: 'Esc', accent: 'continue' },
  { id: 'settings', label: '\u8BBE\u7F6E', sub: 'Sound, display', icon: '\u2699', key: 'S', accent: 'settings' },
  { id: 'restart', label: '\u91CD\u65B0\u5F00\u59CB', sub: 'New game', icon: '\u21BB', key: 'R', accent: 'restart' },
  { id: 'quit', label: '\u9000\u51FA', sub: 'Back to menu', icon: '\u2716', key: 'Q', accent: 'quit' },
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PauseMenuOverlay({ stats, onAction }: PauseMenuOverlayProps) {
  const [tab, setTab] = useState<'menu' | 'stats'>('menu');
  const [selectedIdx, setSelectedIdx] = useState(0);

  const handleKey = useCallback((e: KeyboardEvent) => {
    // Tab switching
    if (e.key === 'Tab') {
      e.preventDefault();
      setTab(t => t === 'menu' ? 'stats' : 'menu');
      return;
    }

    if (tab === 'stats') {
      if (e.key === 'Escape') { onAction('continue'); return; }
      return;
    }

    // Menu navigation
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      setSelectedIdx(i => Math.max(0, i - 1));
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      setSelectedIdx(i => Math.min(MENU_ITEMS.length - 1, i + 1));
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      onAction(MENU_ITEMS[selectedIdx].id);
      return;
    }
    if (e.key === 'Escape') { onAction('continue'); return; }

    // Direct shortcuts
    const match = MENU_ITEMS.find(m => m.key.toLowerCase() === e.key.toLowerCase());
    if (match) onAction(match.id);
  }, [tab, selectedIdx, onAction]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="overlay-backdrop">
      <div className="glass-panel pause-panel">
        <h2 className="pause-panel__title">{'\u5DF2\u6682\u505C'}</h2>

        {/* Segmented Control */}
        <div className="seg-control" role="tablist">
          <button
            className={`seg-control__btn${tab === 'menu' ? ' seg-control__btn--active' : ''}`}
            onClick={() => setTab('menu')}
            role="tab"
            aria-selected={tab === 'menu'}
          >
            {'\u83DC\u5355'}
          </button>
          <button
            className={`seg-control__btn${tab === 'stats' ? ' seg-control__btn--active' : ''}`}
            onClick={() => setTab('stats')}
            role="tab"
            aria-selected={tab === 'stats'}
          >
            {'\u7EDF\u8BA1'}
          </button>
        </div>

        {/* Content */}
        {tab === 'menu' ? (
          <div className="pause-panel__menu">
            {MENU_ITEMS.map((item, i) => (
              <button
                key={item.id}
                className={`pause-menu-item pause-menu-item--${item.accent}`}
                onClick={() => onAction(item.id)}
                onMouseEnter={() => setSelectedIdx(i)}
                autoFocus={i === 0}
              >
                <span className="pause-menu-item__icon">{item.icon}</span>
                <span className="pause-menu-item__text">
                  <span className="pause-menu-item__label">{item.label}</span>
                  <span className="pause-menu-item__sublabel">{item.sub}</span>
                </span>
                <span className="pause-menu-item__key">{item.key}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="pause-stats">
            <div className="pause-stat-card pause-stat-card--highlight">
              <div className="pause-stat-card__value">{stats.score.toLocaleString()}</div>
              <div className="pause-stat-card__label">{'\u5206\u6570'}</div>
            </div>
            <div className="pause-stat-card">
              <div className="pause-stat-card__value">{stats.wave}</div>
              <div className="pause-stat-card__label">{'\u6CE2\u6B21'}</div>
            </div>
            <div className="pause-stat-card">
              <div className="pause-stat-card__value">{stats.wpm}</div>
              <div className="pause-stat-card__label">WPM</div>
            </div>
            <div className="pause-stat-card">
              <div className="pause-stat-card__value">{stats.accuracy}%</div>
              <div className="pause-stat-card__label">{'\u51C6\u786E\u7387'}</div>
            </div>
            <div className="pause-stat-card">
              <div className="pause-stat-card__value">{stats.combo}</div>
              <div className="pause-stat-card__label">{'\u5F53\u524D\u8FDE\u51FB'}</div>
            </div>
            <div className="pause-stat-card">
              <div className="pause-stat-card__value">{stats.maxCombo}</div>
              <div className="pause-stat-card__label">{'\u6700\u9AD8\u8FDE\u51FB'}</div>
            </div>
            <div className="pause-stat-card">
              <div className="pause-stat-card__value">{stats.enemiesDefeated}</div>
              <div className="pause-stat-card__label">{'\u51FB\u8D25\u654C\u4EBA'}</div>
            </div>
            <div className="pause-stat-card">
              <div className="pause-stat-card__value">{formatDuration(stats.duration)}</div>
              <div className="pause-stat-card__label">{'\u6E38\u620F\u65F6\u957F'}</div>
            </div>
          </div>
        )}

        <div className="pause-footer">
          <kbd>Tab</kbd> {'\u5207\u6362\u6807\u7B7E'} &nbsp; <kbd>{'\u2191'}</kbd><kbd>{'\u2193'}</kbd> {'\u5BFC\u822A'} &nbsp; <kbd>Enter</kbd> {'\u9009\u62E9'}
        </div>
      </div>
    </div>
  );
}
