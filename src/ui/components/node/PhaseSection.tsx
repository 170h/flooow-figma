import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';

/**
 * Phase 섹션 - 피그마 UI3 Node 탭 Phase 드롭다운 + Add/More 액션
 */
export function PhaseSection() {
  const {
    uiState,
    setUIState,
    setActiveModal,
    setPhasePopoverOpen,
    setPhasePopoverPos,
    setContextMenuOpen,
    setContextMenuPos,
    phasePopoverOpen,
    contextMenuOpen,
    applyCurrentNodeState,
    setLastNodeConfig,
  } = useApp();

  // Phase 목록 (런타임에서 추가/편집/삭제 가능)
  const [phases, setPhases] = useState([
    { id: 'none', name: 'None', color: null as string | null },
  ]);

  const btnPhaseRef = useRef<HTMLButtonElement>(null);
  const btnMoreRef = useRef<HTMLButtonElement>(null);

  function togglePhasePopover(e: React.MouseEvent) {
    e.stopPropagation();
    if (phasePopoverOpen) {
      setPhasePopoverOpen(false);
      return;
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const popoverWidth = 180;
    const popoverHeight = 160;
    const spaceBelow = window.innerHeight - rect.bottom;

    let top = spaceBelow >= popoverHeight + 8 ? rect.bottom + 4 : Math.max(8, rect.top - popoverHeight - 4);
    let left = Math.max(8, rect.right - popoverWidth);

    setPhasePopoverPos({ top, left });
    setPhasePopoverOpen(true);
    setContextMenuOpen(false);
  }

  function toggleContextMenu(e: React.MouseEvent) {
    e.stopPropagation();
    if (contextMenuOpen) {
      setContextMenuOpen(false);
      return;
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const popoverHeight = 85;
    const spaceBelow = window.innerHeight - rect.bottom;
    let top = spaceBelow >= popoverHeight + 8 ? rect.bottom + 4 : Math.max(8, rect.top - popoverHeight - 4);
    let left = Math.max(8, rect.right - 82);

    setContextMenuPos({ top, left });
    setContextMenuOpen(true);
    setPhasePopoverOpen(false);
  }

  const { selectedPhase } = uiState;

  // 현재 Phase 아이콘 렌더링
  function renderPhaseIcon() {
    if (selectedPhase === 'none') {
      return <div className="phase-checkerboard-24" />;
    }
    if (selectedPhase === 'mixed') {
      return <div className="icon-phase-mixed-24"><div className="phase-mixed-dash" /></div>;
    }
    const phase = phases.find(p => p.id === selectedPhase);
    return <div className="phase-chip-24" style={{ background: phase?.color || '#EA2039' }} />;
  }

  function getCurrentPhaseName() {
    if (selectedPhase === 'none') return 'None';
    if (selectedPhase === 'mixed') return 'Mixed';
    return phases.find(p => p.id === selectedPhase)?.name || 'Phase';
  }

  return (
    <div className="section-block">
      <div className="section-header">
        <span className="section-title">Phase</span>
        <div className="section-actions">
          <button
            className="btn-action-icon"
            title="Phase 추가"
            onClick={() => setActiveModal('phase')}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 6C12.2761 6 12.5 6.22386 12.5 6.5V11.5H17.5C17.7761 11.5 18 11.7239 18 12C18 12.2761 17.7761 12.5 17.5 12.5H12.5V17.5C12.5 17.7761 12.2761 18 12 18C11.7239 18 11.5 17.7761 11.5 17.5V12.5H6.5C6.22386 12.5 6 12.2761 6 12C6 11.7239 6.22386 11.5 6.5 11.5H11.5V6.5C11.5 6.22386 11.7239 6 12 6Z" fill="currentColor"/></svg>
          </button>
          <button
            id="btn-phase-more"
            ref={btnMoreRef}
            className="btn-action-icon btn-more-icon"
            title="More options"
            onClick={toggleContextMenu}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="4" cy="8" r="1" fill="currentColor"/><circle cx="8" cy="8" r="1" fill="currentColor"/><circle cx="12" cy="8" r="1" fill="currentColor"/></svg>
          </button>
        </div>
      </div>
      <div className="section-body">
        <button
          id="btn-phase-select"
          ref={btnPhaseRef}
          className="phase-dropdown-btn"
          onClick={togglePhasePopover}
        >
          <div className="phase-btn-left">
            <div id="current-phase-icon" className="phase-btn-icon-wrap">
              {renderPhaseIcon()}
            </div>
            <span id="current-phase-text" className="phase-btn-label">
              {getCurrentPhaseName()}
            </span>
          </div>
          <div className="phase-btn-arrow">
            <svg width="8" height="5" viewBox="0 0 8 5" fill="none"><path d="M1 1L4 4L7 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </button>
      </div>
    </div>
  );
}
