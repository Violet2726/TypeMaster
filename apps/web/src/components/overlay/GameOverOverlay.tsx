'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import './overlays.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GameOverData {
  score: number;
  wave: number;
  wpm: number;
  accuracy: number;
  maxCombo: number;
  enemiesDefeated: number;
  duration: number;
  isBest: boolean;
}

interface GameOverOverlayProps {
  data: GameOverData;
  onAction: (action: string) => void;
}

// ---------------------------------------------------------------------------
// Rating
// ---------------------------------------------------------------------------

function getRating(score: number): { letter: string; color: string; label: string; subtitle: string } {
  if (score >= 5000) return { letter: 'S', color: '#ffd700', label: '\u4F20\u5947', subtitle: 'Absolute mastery' };
  if (score >= 3000) return { letter: 'A', color: '#32d74b', label: '\u5353\u8D8A', subtitle: 'Outstanding performance' };
  if (score >= 1500) return { letter: 'B', color: '#0a84ff', label: '\u51FA\u8272', subtitle: 'Strong typing skills' };
  if (score >= 500) return { letter: 'C', color: '#ff9f0a', label: '\u826F\u597D', subtitle: 'Room to grow' };
  return { letter: 'D', color: '#ff453a', label: '\u52A0\u6CB9', subtitle: 'Keep practicing!' };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function GameOverOverlay({ data, onAction }: GameOverOverlayProps) {
  const [visible, setVisible] = useState(false);
  const rating = getRating(data.score);
  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // Staggered entrance animation
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'r' || e.key === 'R') { onAction('retry'); return; }
    if (e.key === 'Escape') { onAction('menu'); return; }
  }, [onAction]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  if (!visible) return null;

  return (
    <div className="overlay-backdrop">
      <div className="glass-panel pause-panel" style={{ width: 400 }}>

        {/* Rating Badge */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: `${rating.color}20`,
            border: `2px solid ${rating.color}60`,
            boxShadow: `0 0 32px ${rating.color}30`,
            marginBottom: 12,
          }}>
            <span style={{
              fontSize: 36,
              fontWeight: 800,
              color: rating.color,
              lineHeight: 1,
            }}>{rating.letter}</span>
          </div>
          <div style={{
            fontSize: 13,
            fontWeight: 600,
            color: rating.color,
            letterSpacing: 1,
            textTransform: 'uppercase' as const,
          }}>{rating.label}</div>
          <div style={{
            fontSize: 12,
            color: 'rgba(255,255,255,0.4)',
            marginTop: 2,
          }}>{rating.subtitle}</div>
        </div>

        {/* Score */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            fontSize: 48,
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: -1,
            lineHeight: 1.1,
            fontVariantNumeric: 'tabular-nums',
          }}>{data.score.toLocaleString()}</div>
          <div style={{
            fontSize: 11,
            fontWeight: 500,
            color: 'rgba(255,255,255,0.35)',
            textTransform: 'uppercase' as const,
            letterSpacing: 1,
            marginTop: 4,
          }}>{'\u6700\u7EC8\u5206\u6570'}</div>
          {data.isBest && (
            <div style={{
              display: 'inline-block',
              marginTop: 8,
              padding: '4px 12px',
              borderRadius: 8,
              background: 'rgba(255,215,0,0.15)',
              border: '1px solid rgba(255,215,0,0.3)',
              fontSize: 11,
              fontWeight: 700,
              color: '#ffd700',
              letterSpacing: 1,
            }}>{'\u65B0\u8BB0\u5F55'}</div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="pause-stats" style={{ marginBottom: 24 }}>
          <div className="pause-stat-card">
            <div className="pause-stat-card__value">{data.wave}</div>
            <div className="pause-stat-card__label">{'\u6CE2\u6B21'}</div>
          </div>
          <div className="pause-stat-card">
            <div className="pause-stat-card__value">{data.wpm}</div>
            <div className="pause-stat-card__label">WPM</div>
          </div>
          <div className="pause-stat-card">
            <div className="pause-stat-card__value">{data.accuracy}%</div>
            <div className="pause-stat-card__label">{'\u51C6\u786E\u7387'}</div>
          </div>
          <div className="pause-stat-card">
            <div className="pause-stat-card__value">{data.maxCombo}</div>
            <div className="pause-stat-card__label">{'\u6700\u9AD8\u8FDE\u51FB'}</div>
          </div>
          <div className="pause-stat-card">
            <div className="pause-stat-card__value">{data.enemiesDefeated}</div>
            <div className="pause-stat-card__label">{'\u51FB\u8D25\u654C\u4EBA'}</div>
          </div>
          <div className="pause-stat-card">
            <div className="pause-stat-card__value">{formatDuration(data.duration)}</div>
            <div className="pause-stat-card__label">{'\u6E38\u620F\u65F6\u957F'}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => onAction('retry')}
            style={{
              flex: 1,
              padding: '12px 0',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #0a84ff, #5e5ce6)',
              color: '#ffffff',
              fontSize: 15,
              fontWeight: 600,
              fontFamily: 'inherit',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(10,132,255,0.3)',
              transition: 'transform 0.2s ease',
            }}
          >{'\u518D\u6765\u4E00\u5C40'} <kbd style={{
            display: 'inline-block', padding: '1px 6px', borderRadius: 4,
            background: 'rgba(255,255,255,0.2)', fontSize: 11, marginLeft: 6,
            fontFamily: "'SF Mono', monospace",
          }}>R</kbd></button>
          <button
            onClick={() => onAction('menu')}
            style={{
              flex: 1,
              padding: '12px 0',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.6)',
              fontSize: 15,
              fontWeight: 600,
              fontFamily: 'inherit',
              cursor: 'pointer',
              transition: 'transform 0.2s ease',
            }}
          >{'\u8FD4\u56DE\u83DC\u5355'} <kbd style={{
            display: 'inline-block', padding: '1px 6px', borderRadius: 4,
            background: 'rgba(255,255,255,0.06)', fontSize: 11, marginLeft: 6,
            fontFamily: "'SF Mono', monospace",
          }}>Esc</kbd></button>
        </div>

        <div className="pause-footer" style={{ marginTop: 16 }}>
          <kbd>R</kbd> {'\u91CD\u8BD5'} &nbsp; <kbd>Esc</kbd> {'\u8FD4\u56DE'}
        </div>
      </div>
    </div>
  );
}
