import React from 'react';
import { useApp } from '../../context/AppContext';

interface Phase {
  id: string;
  name: string;
  color: string | null;
}

interface PhasePopoverProps {
  phases: Phase[];
  onSelectPhase: (id: string, name: string, color: string) => void;
}

/**
 * Phase 선택 팝오버
 */
export function PhasePopover({ phases, onSelectPhase }: PhasePopoverProps) {
  const { phasePopoverOpen, phasePopoverPos, setPhasePopoverOpen, uiState } = useApp();
  const { selectedPhase } = uiState;

  if (!phasePopoverOpen) return null;

  return (
    <div
      id="popover-phase"
      className="popover-phase-select active"
      style={{ position: 'fixed', top: phasePopoverPos.top, left: phasePopoverPos.left, zIndex: 999 }}
      onMouseLeave={() => setPhasePopoverOpen(false)}
    >
      {/* None 옵션 */}
      <div
        className={`phase-menu-item${selectedPhase === 'none' ? ' selected' : ''}`}
        data-phase="none"
        onClick={() => { onSelectPhase('none', 'None', '#EA2039'); setPhasePopoverOpen(false); }}
      >
        <div className="phase-item-check-slot">
          <svg className="phase-check-icon" width="8" height="7" viewBox="0 0 8 7" fill="none">
            <path d="M1 3.5L3 5.5L7 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="phase-item-icon-slot">
          <div className="phase-checkerboard-14" />
        </div>
        <span className="phase-item-label">None</span>
      </div>

      <hr className="phase-popover-divider" />

      {/* 동적 Phase 목록 */}
      {phases.filter(p => p.id !== 'none').map(phase => (
        <div
          key={phase.id}
          className={`phase-menu-item${selectedPhase === phase.id ? ' selected' : ''}`}
          data-phase={phase.id}
          onClick={() => { onSelectPhase(phase.id, phase.name, phase.color || '#EA2039'); setPhasePopoverOpen(false); }}
        >
          <div className="phase-item-check-slot">
            <svg className="phase-check-icon" width="8" height="7" viewBox="0 0 8 7" fill="none">
              <path d="M1 3.5L3 5.5L7 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="phase-item-icon-slot">
            <div className="phase-chip-14" style={{ background: phase.color || '#EA2039' }} />
          </div>
          <span className="phase-item-label">{phase.name}</span>
        </div>
      ))}
    </div>
  );
}
