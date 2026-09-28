import React from 'react';
import { BookOpen, Check, X } from 'lucide-react';
import './roadmap-sh.css';

// Quick-action toolbar shown on node hover: Learning / Done / Skip.
// Clicking the currently-active status resets the node to not-started.
const OPTIONS = [
  { key: 'in-progress', label: 'Learning', Icon: BookOpen, cls: 'rm-hb-learning' },
  { key: 'done', label: 'Done', Icon: Check, cls: 'rm-hb-done' },
  { key: 'skipped', label: 'Skip', Icon: X, cls: 'rm-hb-skip' },
];

function NodeHoverBar({ status, onPick }) {
  return (
    <div className="rm-hoverbar" onClick={(e) => e.stopPropagation()}>
      {OPTIONS.map(({ key, label, Icon, cls }) => (
        <button
          key={key}
          type="button"
          className={`rm-hb-btn ${cls}${status === key ? ' is-active' : ''}`}
          title={status === key ? `${label} (click to reset)` : `Mark as ${label}`}
          onClick={(e) => {
            e.stopPropagation();
            onPick(status === key ? 'not-started' : key);
          }}
        >
          <Icon className="w-3.5 h-3.5" strokeWidth={2.5} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}

export default NodeHoverBar;
