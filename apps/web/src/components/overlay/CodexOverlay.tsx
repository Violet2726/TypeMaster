'use client';

import { BookOpen, X } from 'lucide-react';
import './overlays.css';

interface CodexEntry {
  id: string;
  name?: string;
  nameZh?: string;
  role?: string;
  hint?: string;
  summary?: string;
  discovered?: boolean;
  defeated?: boolean;
}

interface CodexOverlayProps {
  codex?: {
    discovered?: number;
    total?: number;
    monsters?: CodexEntry[];
    guardians?: CodexEntry[];
  } | null;
  onClose: () => void;
}

function CodexList({ title, entries }: { title: string; entries: CodexEntry[] }) {
  return (
    <div className="raid-codex-section">
      <h3>{title}</h3>
      <div className="raid-codex-list">
        {entries.map((entry) => (
          <div key={entry.id} className={`raid-codex-entry${entry.discovered ? ' is-open' : ''}`}>
            <span aria-hidden="true"><BookOpen size={15} strokeWidth={2.2} /></span>
            <strong>{entry.discovered ? (entry.nameZh || entry.name || entry.id) : '未发现'}</strong>
            <small>{entry.discovered ? (entry.hint || entry.summary || entry.role || '已记录') : '在裂隙中遭遇后解锁'}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CodexOverlay({ codex, onClose }: CodexOverlayProps) {
  const monsters = codex?.monsters || [];
  const guardians = codex?.guardians || [];

  return (
    <div className="raid-overlay" role="dialog" aria-modal="true" aria-label="裂隙图鉴">
      <section className="raid-panel raid-panel--codex">
        <div className="raid-panel__heading raid-panel__heading--row">
          <div>
            <span>Rift Codex</span>
            <h2>裂隙图鉴</h2>
            <p>{codex?.discovered || 0}/{codex?.total || 0} 已记录。图鉴来自本地 v6 Raid 结果，不迁移旧存档。</p>
          </div>
          <button type="button" className="raid-icon-action" onClick={onClose} autoFocus aria-label="关闭图鉴">
            <X aria-hidden="true" size={18} strokeWidth={2.2} />
          </button>
        </div>
        <CodexList title="怪物" entries={monsters} />
        <CodexList title="Guardian" entries={guardians} />
      </section>
    </div>
  );
}
