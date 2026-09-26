import React, { useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { MixedDashChip } from '../shared/icons';
import { PhasePopover } from '../popovers/PhasePopover';

const CHEVRON_SVG = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M9.7673 6.76777C9.96256 6.5725 10.28 6.5725 10.4753 6.76777C10.6702 6.96296 10.6702 7.2796 10.4753 7.4748L7.99972 9.94941L5.52511 7.4748C5.32985 7.27953 5.32985 6.96303 5.52511 6.76777C5.72037 6.5725 6.03688 6.5725 6.23214 6.76777L7.99972 8.53534L9.7673 6.76777Z"
      fill="currentColor"
    />
  </svg>
);

/**
 * Phase 섹션 - 피그마 UI3 Node 탭 Phase 드롭다운 + Add/More 액션
 */
export function PhaseSection() {
  const {
    uiState,
    setUIState,
    setActiveModal,
    setPhasePopoverOpen,
    setContextMenuOpen,
    setContextMenuPos,
    contextMenuTarget,
    setContextMenuTarget,
    phasePopoverOpen,
    contextMenuOpen,
    setLastNodeConfig,
    phases,
  } = useApp();

  const dropdownRef = useRef<HTMLDivElement>(null);
  const btnMoreRef = useRef<HTMLButtonElement>(null);

  // 드롭다운 외부 클릭 시에만 안전하게 닫기 (mousedown 기준, 다른 섹션 드롭다운과 통일)
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setPhasePopoverOpen(false);
      }
    }
    if (phasePopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [phasePopoverOpen, setPhasePopoverOpen]);

  function togglePhasePopover(e: React.MouseEvent) {
    e.stopPropagation();
    setPhasePopoverOpen(!phasePopoverOpen);
    setContextMenuOpen(false);
  }

  function handleSelectPhase(id: string, name: string, color: string) {
    setUIState({ selectedPhase: id });
    setLastNodeConfig({ phase: id, phaseName: name, phaseColor: color });
    parent.postMessage({ pluginMessage: { type: 'SET_PHASE', phaseId: id, phaseName: name, phaseColor: color } }, '*');
    setPhasePopoverOpen(false);
  }

  function toggleContextMenu(e: React.MouseEvent) {
    e.stopPropagation();
    if (contextMenuOpen && contextMenuTarget === 'phase') {
      setContextMenuOpen(false);
      return;
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const popoverHeight = 85;
    const spaceBelow = window.innerHeight - rect.bottom;
    let top = spaceBelow >= popoverHeight + 8 ? rect.bottom + 4 : Math.max(8, rect.top - popoverHeight - 4);
    let left = Math.max(8, rect.right - 82);

    setContextMenuPos({ top, left });
    setContextMenuTarget('phase');
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
      return <MixedDashChip size={24} style={{ borderRadius: '5px' }} />;
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
            type="button"
            className="btn-action-icon"
            title="Phase 추가"
            onClick={() => setActiveModal('phase')}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 6C12.2761 6 12.5 6.22386 12.5 6.5V11.5H17.5C17.7761 11.5 18 11.7239 18 12C18 12.2761 17.7761 12.5 17.5 12.5H12.5V17.5C12.5 17.7761 12.2761 18 12 18C11.7239 18 11.5 17.7761 11.5 17.5V12.5H6.5C6.22386 12.5 6 12.2761 6 12C6 11.7239 6.22386 11.5 6.5 11.5H11.5V6.5C11.5 6.22386 11.7239 6 12 6Z" fill="currentColor"/></svg>
          </button>
          <button
            type="button"
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
        <div
          ref={dropdownRef}
          className="phase-dropdown-wrapper"
          style={{ position: 'relative', width: '100%' }}
        >
          <button
            type="button"
            id="btn-phase-select"
            className={`phase-dropdown-btn${phasePopoverOpen ? ' active' : ''}`}
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
            <div
              className="phase-btn-arrow"
              style={{
                transform: phasePopoverOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {CHEVRON_SVG}
            </div>
          </button>

          {/* Phase 팝오버 메뉴 (인라인 absolute 배치로 뷰포트 계산 오류 및 깜빡임 원천 차단) */}
          {phasePopoverOpen && (
            <PhasePopover
              phases={phases}
              onSelectPhase={handleSelectPhase}
            />
          )}
        </div>
      </div>
    </div>
  );
}
