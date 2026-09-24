import React, { useCallback, useEffect, useState } from 'react';
import { useApp } from './context/AppContext';
import { useFigmaMessage } from './hooks/useFigmaMessage';
import { useAutoResize } from './hooks/useAutoResize';

import { NodePanel } from './components/node/NodePanel';
import { AppearancePanel } from './components/appearance/AppearancePanel';
import { ConnectionPanel } from './components/connection/ConnectionPanel';
import { FigmaTooltip } from './components/shared/Tooltip';
import { PhasePopover } from './components/popovers/PhasePopover';
import { ContextMenu } from './components/popovers/ContextMenu';
import { PhaseModal, PhaseData } from './components/modals/PhaseModal';
import { SizeModal } from './components/modals/SizeModal';
import { FigmaDesignPickerModal } from './components/modals/FigmaDesignPickerModal';
import { StyleModal } from './components/modals/StyleModal';

// ============================================================
// 탭 버튼 목록
// ============================================================
const TABS = [
  { id: 'node', label: 'Node' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'connection', label: 'Connection' },
] as const;

// ============================================================
// 메인 CTA 버튼 텍스트 결정 (원본 updateFooterForTab 로직)
// ============================================================
function getCtaLabel(
  currentTab: string,
  isConnectorSelected: boolean,
  nodeCount: number,
): string {
  if (isConnectorSelected) {
    if (nodeCount === 1) return 'Update Connector';
    return 'Connect';
  }
  if (currentTab === 'connection') {
    if (nodeCount >= 2) return 'Connect';
    return 'Connect';
  }
  if (nodeCount >= 2) return 'Update All';
  if (nodeCount === 1) return 'Update';
  return 'Create';
}

// ============================================================
// App 컴포넌트
// ============================================================
export function App() {
  // 훅 활성화
  useFigmaMessage();
  useAutoResize();

  const {
    currentTab, setCurrentTab,
    selectedNodes, isConnectorSelected,
    handleMainAction,
    closeAllPopovers,
    activeModal, setActiveModal,
    uiState, setUIState,
    phasePopoverOpen, setPhasePopoverOpen,
    contextMenuOpen, setContextMenuOpen,
    applyCurrentNodeState,
    setLastNodeConfig,
    showToast,
    autoResizeWindow,
  } = useApp();

  // Phase 관리 (로컬 상태)
  const [phases, setPhases] = useState<PhaseData[]>([
    { id: 'phase-1', name: 'Phase 1', color: '#EA2039' },
    { id: 'phase-2', name: 'Phase 2', color: '#8638E5' },
  ]);
  const [editingPhase, setEditingPhase] = useState<PhaseData | null>(null);

  const nodeCount = selectedNodes.length;

  // 커넥터 여부 판별
  const allConnectors = nodeCount > 0 && selectedNodes.every(n => n && n.isConnector);
  const isSingleConn = nodeCount === 1 && allConnectors;
  const isMultiConn = nodeCount >= 2 && allConnectors;
  const isConnSel = isSingleConn || isMultiConn;

  // CTA 레이블
  const ctaLabel = getCtaLabel(currentTab, isConnSel, nodeCount);

  // 탭 활성/비활성 제어
  useEffect(() => {
    const tabNode = document.getElementById('tab-btn-node');
    const tabAppearance = document.getElementById('tab-btn-appearance');
    const tabConnection = document.getElementById('tab-btn-connection');

    if (isConnSel) {
      // 커넥터 선택: Node/Appearance 비활성 → Connection 강제 이동
      tabNode?.classList.add('disabled');
      tabAppearance?.classList.add('disabled');
      tabConnection?.classList.remove('disabled');
      if (currentTab !== 'connection') setCurrentTab('connection');
    } else if (nodeCount === 0) {
      // 선택 없음(생성 모드): Appearance/Connection 비활성
      tabNode?.classList.remove('disabled');
      tabAppearance?.classList.add('disabled');
      tabConnection?.classList.add('disabled');
      if (currentTab !== 'node') setCurrentTab('node');
    } else {
      // 일반 노드 선택: 전체 활성
      tabNode?.classList.remove('disabled');
      tabAppearance?.classList.remove('disabled');
      tabConnection?.classList.remove('disabled');
    }
  }, [isConnSel, nodeCount, currentTab, setCurrentTab]);


  // 탭 전환 후 autoResize
  useEffect(() => {
    autoResizeWindow();
  }, [currentTab, autoResizeWindow]);

  // 탭 전환
  function switchTab(tabId: string) {
    // disabled 탭은 클릭 차단
    const btn = document.getElementById(`tab-btn-${tabId}`);
    if (btn?.classList.contains('disabled')) return;
    setCurrentTab(tabId);
  }

  // 전역 클릭으로 팝오버 닫기
  function handleRootClick(e: React.MouseEvent) {
    const target = e.target as HTMLElement;
    const isPopoverTrigger =
      target.closest('#btn-phase-select') ||
      target.closest('#btn-phase-more') ||
      target.closest('#btn-size-more') ||
      target.closest('#btn-style-more') ||
      target.closest('#btn-size-mode-dropdown') ||
      target.closest('#popover-phase') ||
      target.closest('#popover-context') ||
      target.closest('#popover-size-mode') ||
      target.closest('.figma-dropdown-wrapper') ||
      target.closest('.figma-dropdown-menu') ||
      target.closest('.terminal-ui3-menu') ||
      target.closest('.terminal-dropdown-wrap');

    if (!isPopoverTrigger) {
      closeAllPopovers();
    }
  }

  // Phase 저장
  function handleSavePhase(phase: PhaseData) {
    setPhases(prev => {
      const idx = prev.findIndex(p => p.id === phase.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = phase;
        return next;
      }
      return [...prev, phase];
    });
    setUIState({ selectedPhase: phase.id });
    setLastNodeConfig({ phase: phase.id, phaseName: phase.name, phaseColor: phase.color });
    parent.postMessage({ pluginMessage: { type: 'SET_PHASE', phaseId: phase.id, phaseName: phase.name, phaseColor: phase.color } }, '*');
  }

  // Phase 선택
  function handleSelectPhase(id: string, name: string, color: string) {
    setUIState({ selectedPhase: id });
    setLastNodeConfig({ phase: id, phaseName: name, phaseColor: color });
    parent.postMessage({ pluginMessage: { type: 'SET_PHASE', phaseId: id, phaseName: name, phaseColor: color } }, '*');
    setPhasePopoverOpen(false);
  }

  // Context menu 핸들러
  function handleContextEdit() {
    setContextMenuOpen(false);
    const currentPhaseId = uiState.selectedPhase;
    if (currentPhaseId && currentPhaseId !== 'none') {
      const phase = phases.find(p => p.id === currentPhaseId);
      if (phase) {
        setEditingPhase(phase);
        setActiveModal('phase');
      }
    }
  }

  function handleContextDelete() {
    setContextMenuOpen(false);
    const currentPhaseId = uiState.selectedPhase;
    if (currentPhaseId && currentPhaseId !== 'none') {
      setPhases(prev => prev.filter(p => p.id !== currentPhaseId));
      setUIState({ selectedPhase: 'none' });
      setLastNodeConfig({ phase: 'none', phaseName: 'None', phaseColor: '#EA2039' });
      parent.postMessage({ pluginMessage: { type: 'SET_PHASE', phaseId: 'none', phaseName: 'None', phaseColor: '#EA2039' } }, '*');
      showToast('Phase가 삭제되었습니다.');
    }
  }

  // 타이틀 배너 렌더링
  function renderTitleBanner() {
    // 커넥터 단일 선택: 'Connector' 라벨 (읽기 전용)
    if (isSingleConn) {
      return (
        <div id="single-title-wrap" style={{ width: '100%' }}>
          <input
            type="text"
            id="node-title-input"
            className="node-title-input"
            value="Connector"
            readOnly
            onChange={() => {}}
          />
        </div>
      );
    }
    // 다중 선택 (커넥터 포함): 다중 선택 인디케이터
    if (nodeCount >= 2) {
      // 선택 텍스트 생성
      const flowNodeCount = selectedNodes.filter(n => n && !n.isConnector).length;
      const connCount = selectedNodes.filter(n => n && n.isConnector).length;
      let selText = '';
      if (connCount > 0 && flowNodeCount === 0) {
        selText = `${connCount} connector${connCount > 1 ? 's' : ''} selected`;
      } else if (flowNodeCount > 0 && connCount === 0) {
        selText = `${flowNodeCount} node${flowNodeCount > 1 ? 's' : ''} selected`;
      } else {
        selText = `${nodeCount} objects selected`;
      }
      return (
        <div id="multi-selection-indicator" className="multi-selection-indicator" style={{ width: '100%', display: 'flex' }}>
          <span id="multi-selection-text">{selText}</span>
        </div>
      );
    }
    // 단일 노드 or 0개: 타이틀 입력
    return (
      <div id="single-title-wrap" style={{ width: '100%' }}>
        <input
          type="text"
          id="node-title-input"
          className="node-title-input"
          defaultValue={nodeCount === 1 ? (selectedNodes[0]?.title || selectedNodes[0]?.name || 'Untitled') : 'Welcome'}
          placeholder="Enter node title"
          onInput={() => {
            clearTimeout((window as any)._titleDebounce);
            (window as any)._titleDebounce = setTimeout(() => applyCurrentNodeState(), 400);
          }}
        />
      </div>
    );
  }

  return (
    <div id="plugin-root" onClick={handleRootClick}>
      {/* 1. 타이틀 배너 */}
      <div className="title-banner">
        {renderTitleBanner()}
      </div>

      {/* 2. 메인 탭 세그먼트 컨트롤 */}
      <nav className="main-tabs-wrapper">
        <div className="segmented-control" role="tablist">
          {TABS.map(tab => (
            <button
              key={tab.id}
              id={`tab-btn-${tab.id}`}
              className={`tab-btn${currentTab === tab.id ? ' active' : ''}`}
              role="tab"
              onClick={() => switchTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <hr className="section-divider" />

      {/* 3. 탭 패널들 — currentTab 상태로 직접 제어 */}
      <main className="tab-panels">
        <section
          id="panel-node"
          className="tab-panel"
          style={{ display: currentTab === 'node' ? 'block' : 'none' }}
        >
          <NodePanel />
        </section>
        <section
          id="panel-appearance"
          className="tab-panel"
          style={{ display: currentTab === 'appearance' ? 'block' : 'none' }}
        >
          <AppearancePanel />
        </section>
        <section
          id="panel-connection"
          className="tab-panel"
          style={{ display: currentTab === 'connection' ? 'block' : 'none' }}
        >
          <ConnectionPanel />
        </section>
      </main>

      {/* 4. CTA 버튼 */}
      <footer className="app-footer">
        <button
          id="btn-main-cta"
          className="btn-cta-primary"
          type="button"
          onClick={handleMainAction}
        >
          {ctaLabel}
        </button>
      </footer>

      {/* 팝오버 레이어 */}
      <PhasePopover phases={phases} onSelectPhase={handleSelectPhase} />
      <ContextMenu onEdit={handleContextEdit} onDelete={handleContextDelete} />

      {/* 모달 레이어 */}
      {activeModal === 'phase' && (
        <PhaseModal
          editingPhase={editingPhase}
          onSave={handleSavePhase}
          onClose={() => { setActiveModal('none'); setEditingPhase(null); }}
        />
      )}
      {activeModal === 'add-size' && (
        <SizeModal
          mode="add"
          onClose={() => setActiveModal('none')}
        />
      )}
      {activeModal === 'edit-size' && (
        <SizeModal
          mode="edit"
          onClose={() => setActiveModal('none')}
        />
      )}
      {activeModal === 'figma-design-picker' && (
        <FigmaDesignPickerModal
          onClose={() => setActiveModal('none')}
        />
      )}
      {activeModal === 'add-style' && (
        <StyleModal
          initialColor={uiState.selectedColor}
          onClose={() => setActiveModal('none')}
        />
      )}

      {/* 툴팁 */}
      <FigmaTooltip />
    </div>
  );
}
