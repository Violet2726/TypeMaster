'use client';

import { useEffect, useRef, useState } from 'react';
import './overlays.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HudData {
  score: number;
  wave: number;
  combo: number;
  maxCombo: number;
  lives: number;
  maxLives: number;
  accuracy: number;
}

interface GameplayHudProps {
  data: HudData;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function GameplayHud({ data }: GameplayHudProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const animRef = useRef<number>(0);
  const targetRef = useRef(0);
  const velocityRef = useRef(0);

  // Smooth score animation
  useEffect(() => {
    targetRef.current = data.score;
  }, [data.score]);

  useEffect(() => {
    let active = true;
    const tick = () => {
      if (!active) return;
      const target = targetRef.current;
      const diff = target - displayScore;
      velocityRef.current += diff * 8 * (1 / 60);
      velocityRef.current *= 0.85;
      const next = displayScore + velocityRef.current;
      if (Math.abs(diff) < 1) {
        setDisplayScore(target);
        velocityRef.current = 0;
      } else {
        setDisplayScore(next);
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => { active = false; cancelAnimationFrame(animRef.current); };
  }, [displayScore]);

  const comboPercent = data.combo > 0 ? Math.min(100, ((data.combo % 10) / 10) * 100) : 0;

  return (
    <div className="gameplay-hud">
      {/* Left: Score + Combo */}
      <div className="gameplay-hud__left">
        <div className="hud-glass hud-glass--score">
          <span className="hud-glass__icon">{'\u2605'}</span>
          <span className="hud-glass__value">{Math.round(displayScore).toLocaleString()}</span>
        </div>
        {data.combo > 2 && (
          <div className="hud-glass hud-glass--combo">
            <span className="hud-glass__icon">{'\u26A1'}</span>
            <span className="hud-glass__value">x{data.combo}</span>
            <div className="hud-combo-bar">
              <div className="hud-combo-bar__fill" style={{ width: `${comboPercent}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Right: Wave + Lives */}
      <div className="gameplay-hud__right">
        <div className="hud-glass hud-glass--wave">
          <span className="hud-glass__icon">{'\u25B6'}</span>
          <span className="hud-glass__value">{data.wave}</span>
          <span className="hud-glass__label">WAVE</span>
        </div>
        <div className="hud-glass hud-glass--lives">
          <div className="hud-lives">
            {Array.from({ length: data.maxLives }).map((_, i) => (
              <div
                key={i}
                className={`hud-lives__dot${i >= data.lives ? ' hud-lives__dot--empty' : ''}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
