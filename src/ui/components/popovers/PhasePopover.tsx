import React from 'react';
import { useApp } from '../../context/AppContext';
import { DropdownMixedItem } from '../shared/DropdownMixedItem';

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
      style={{
        position: 'absolute',
        top: 'calc(100% + 4px)',
        right: 0,
        zIndex: 1060,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Mixed 상태: 컬러칩이 포함된 옵션이므로 16x16 체크 + 컬러칩 위치의 '-' 대시 아이콘 + Mixed 라벨 */}
      {selectedPhase === 'mixed' && (
        <DropdownMixedItem
          variant="chip"
          chipSize={14}
          className="phase-menu-item"
          onClick={() => setPhasePopoverOpen(false)}
        />
      )}

      {/* None 옵션 */}
      <div
        className={`phase-menu-item${selectedPhase === 'none' ? ' selected' : ''}`}
        data-phase="none"
        onClick={() => { onSelectPhase('none', 'None', '#EA2039'); setPhasePopoverOpen(false); }}
      >
        <div className="phase-item-check-slot">
          <svg className="phase-check-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M11.0839 4.22264C11.2371 3.99289 11.5475 3.93082 11.7773 4.08396C12.007 4.23714 12.0691 4.54756 11.916 4.77732L7.91596 10.7773C7.83287 10.902 7.69784 10.9833 7.54877 10.998C7.39988 11.0126 7.25223 10.9593 7.14643 10.8535L4.14643 7.85349C3.9512 7.65823 3.95118 7.34171 4.14643 7.14646C4.34168 6.95122 4.6582 6.95124 4.85346 7.14646L7.42182 9.71482L11.0839 4.22264Z" fill="currentColor" />
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
            <svg className="phase-check-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M11.0839 4.22264C11.2371 3.99289 11.5475 3.93082 11.7773 4.08396C12.007 4.23714 12.0691 4.54756 11.916 4.77732L7.91596 10.7773C7.83287 10.902 7.69784 10.9833 7.54877 10.998C7.39988 11.0126 7.25223 10.9593 7.14643 10.8535L4.14643 7.85349C3.9512 7.65823 3.95118 7.34171 4.14643 7.14646C4.34168 6.95122 4.6582 6.95124 4.85346 7.14646L7.42182 9.71482L11.0839 4.22264Z" fill="currentColor" />
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
