import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useApp } from './context/AppContext';
import { useFigmaMessage } from './hooks/useFigmaMessage';
import { useAutoResize } from './hooks/useAutoResize';
import { useSelectionSummary } from './hooks/useSelectionSummary';

import { NodePanel } from './components/node/NodePanel';
import { AppearancePanel } from './components/appearance/AppearancePanel';
import { ConnectionPanel } from './components/connection/ConnectionPanel';
import { FigmaTooltip } from './components/shared/Tooltip';
import { ContextMenu } from './components/popovers/ContextMenu';
import { SizeModal } from './components/modals/SizeModal';
import { FigmaDesignPickerModal } from './components/modals/FigmaDesignPickerModal';
import { StyleModal } from './components/modals/StyleModal';
import { ConnectorColorModal } from './components/modals/ConnectorColorModal';
import { FillColorModal } from './components/modals/FillColorModal';
import { StrokeColorModal } from './components/modals/StrokeColorModal';

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
    contextMenuOpen, setContextMenuOpen,
    applyCurrentNodeState,
    lastNodeConfig,
    setLastNodeConfig,
    showToast,
    autoResizeWindow,
    stylePresets,
    selectedStylePresetId,
    setSelectedStylePresetId,
    selectedSizePresetId,
    sizePresets,
    addSizePreset,
    updateSizePreset,
  } = useApp();

  // SizeModal onSave 핸들러 (매 렌더마다 새 함수 생성 방지)
  const handleAddSizeSave = useCallback((preset: { name: string; w: number; h: number; radius: number; sizeMode: 'fixed' | 'hug' | 'fit' }) => {
    addSizePreset(preset);
  }, [addSizePreset]);

  // edit 대상 프리셋
  const editSizePreset = sizePresets?.find(p => p.id === selectedSizePresetId) || sizePresets?.[0];

  const handleEditSizeSave = useCallback((preset: { name: string; w: number; h: number; radius: number; sizeMode: 'fixed' | 'hug' | 'fit' }) => {
    if (editSizePreset) updateSizePreset(editSizePreset.id, preset);
  }, [editSizePreset, updateSizePreset]);

  const summary = useSelectionSummary();
  const nodeCount = selectedNodes.length;

  // 피그잼 일반 오브젝트 판별 (플로우 노드/커넥터가 아닌 네이티브 객체)
  const isFigjamSelected = summary.isFigJamObject;
  const isSingleFigjam = isFigjamSelected && nodeCount === 1;
  const isMultiFigjam = isFigjamSelected && nodeCount >= 2;

  // 커넥터 여부 판별
  const allConnectors = nodeCount > 0 && selectedNodes.every(n => n && n.isConnector);
  const isSingleConn = nodeCount === 1 && allConnectors;
  const isMultiConn = nodeCount >= 2 && allConnectors;
  const isConnSel = isSingleConn || isMultiConn;

  // CTA 레이블
  const ctaLabel = getCtaLabel(currentTab, isConnSel, nodeCount);

  // 탭 자동 전환 제어 (선택 조건에 따른 적절한 탭으로 자동 이동)
  useEffect(() => {
    if (isSingleFigjam) {
      // 1. 피그잼 단일 오브젝트 선택: 기본 Node 탭 유지
      if (currentTab !== 'node') setCurrentTab('node');
    } else if (isMultiFigjam) {
      // 2. 피그잼 오브젝트 2개 이상 복수 선택: Connection 탭 자동 이동
      if (currentTab !== 'connection') setCurrentTab('connection');
    } else if (isConnSel) {
      // 3. 커넥터 선택: Connection 탭 자동 이동
      if (currentTab !== 'connection') setCurrentTab('connection');
    } else if (nodeCount === 0) {
      // 4. 선택 없음(생성 모드): Node 탭 유지
      if (currentTab !== 'node') setCurrentTab('node');
    } else if (nodeCount === 1) {
      // 5. 플로우 노드 단 1개 선택: Connection 탭에 있었으면 Node 탭으로 복귀
      if (currentTab === 'connection') setCurrentTab('node');
    }
  }, [isSingleFigjam, isMultiFigjam, isConnSel, nodeCount, currentTab, setCurrentTab]);


  // 탭 전환 후 autoResize
  useEffect(() => {
    autoResizeWindow();
  }, [currentTab, autoResizeWindow]);

  // FigJam 오브젝트 선택/해제 시 autoResize
  // isSingleFigjam/isMultiFigjam 변화 시 .tab-panel들이 DOM에서 교체되어
  // ResizeObserver가 감지하지 못하므로 명시적으로 창 크기를 재계산한다.
  useEffect(() => {
    autoResizeWindow();
  }, [isSingleFigjam, isMultiFigjam, autoResizeWindow]);

  // 입력 필드 클릭/포커스 시 텍스트 전체 자동 선택 (Figma UI3 인스펙터 UX 표준)
  useEffect(() => {
    let newlyFocusedInput: HTMLInputElement | null = null;

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target instanceof HTMLInputElement &&
        (target.type === 'text' || target.type === 'number' || !target.type) &&
        !target.readOnly &&
        !target.disabled
      ) {
        newlyFocusedInput = target;
        // Tab 키 등 포커스 진입 시 전체 선택
        requestAnimationFrame(() => {
          target.select();
        });
      } else {
        newlyFocusedInput = null;
      }
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target instanceof HTMLInputElement &&
        (target.type === 'text' || target.type === 'number' || !target.type) &&
        !target.readOnly &&
        !target.disabled
      ) {
        // 새로 포커스된 순간 마우스 클릭 시 전체 선택 보장 (이후 동일 인풋 재클릭 시에는 정상 커서 이동 가능)
        if (newlyFocusedInput === target) {
          target.select();
          newlyFocusedInput = null;
        }
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('click', handleClick);
    };
  }, []);

  // 탭 전환
  function switchTab(tabId: string) {
    if (isSingleFigjam) return;
    if (isMultiFigjam && tabId !== 'connection') return;

    // 노드 1개 이하일 때 Connection 탭 클릭 차단
    if (tabId === 'connection' && !isConnSel && nodeCount < 2) return;
    if (tabId === 'appearance' && (nodeCount === 0 || isConnSel || isFigjamSelected)) return;
    if (tabId === 'node' && (isConnSel || isFigjamSelected)) return;

    // disabled 탭은 클릭 차단
    const btn = document.getElementById(`tab-btn-${tabId}`);
    if (btn?.classList.contains('disabled')) return;
    setCurrentTab(tabId);
  }

  // 전역 클릭으로 팝오버 닫기
  function handleRootClick(e: React.MouseEvent) {
    const target = e.target as HTMLElement;
    const isPopoverTrigger = target.closest(
      '#btn-size-more, #btn-style-more, #btn-size-mode-dropdown, #popover-context, #popover-size-mode, .figma-dropdown-wrapper, .figma-dropdown-menu, .terminal-ui3-menu',
    );

    if (!isPopoverTrigger) {
      closeAllPopovers();
    }
  }

  // Context menu 핸들러
  function handleContextEdit() {
    setContextMenuOpen(false);
  }

  function handleContextDelete() {
    setContextMenuOpen(false);
  }

  const titleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (titleDebounceRef.current) {
        clearTimeout(titleDebounceRef.current);
      }
    };
  }, []);

  // 타이틀 배너 렌더링
  function renderTitleBanner() {
    // 0-1. 피그잼 단일 오브젝트 선택: 'Figjam object' (라벨 텍스트)
    if (isSingleFigjam) {
      return (
        <div className="figjam-title-label">
          Figjam object
        </div>
      );
    }
    // 0-2. 피그잼 복수 오브젝트 선택: 'N Figjam objects selected' (다중 인디케이터)
    if (isMultiFigjam) {
      return (
        <div id="multi-selection-indicator" className="multi-selection-indicator" style={{ width: '100%', display: 'flex' }}>
          <span id="multi-selection-text">{`${nodeCount} Figjam objects selected`}</span>
        </div>
      );
    }
    // 1. 커넥터 단일 선택: 'Connector' 라벨 (읽기 전용)
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
    // 2. 다중 선택 (커넥터 및 플로우 노드 포함): 다중 선택 인디케이터
    if (nodeCount >= 2) {
      // 선택 텍스트 생성
      const flowNodeCount = selectedNodes.filter(n => n && n.isFlowNode).length;
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
    // 3. 단일 노드 or 0개: 타이틀 입력 (노드 ID를 key로 부여하여 선택 변경 시 defaultValue 갱신)
    const activeNodeId = nodeCount === 1 ? (selectedNodes[0]?.id || 'single') : 'none';
    return (
      <div id="single-title-wrap" style={{ width: '100%' }}>
        <input
          key={activeNodeId}
          type="text"
          id="node-title-input"
          className="node-title-input"
          maxLength={32}
          defaultValue={nodeCount === 1 ? (selectedNodes[0]?.title || selectedNodes[0]?.name || 'Screen') : 'Screen'}
          placeholder="Enter node title"
          onInput={() => {
            if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current);
            titleDebounceRef.current = setTimeout(() => applyCurrentNodeState(), 400);
          }}
        />
      </div>
    );
  }

  return (
    <div id="plugin-root" onClick={handleRootClick}>
      {/* 1. 타이틀 배너 */}
      <div className="title-banner">
        <div style={{ flex: 1, minWidth: 0 }}>
          {renderTitleBanner()}
        </div>
      </div>

      {/* 2. 메인 탭 세그먼트 컨트롤 */}
      <nav className="main-tabs-wrapper">
        <div className="segmented-control" role="tablist">
          {TABS.map(tab => {
            const isConnectionDisabled =
              isSingleFigjam ||
              (!isConnSel && nodeCount < 2);
            const isAppearanceDisabled =
              isFigjamSelected ||
              nodeCount === 0 ||
              isConnSel;
            const isNodeDisabled =
              isFigjamSelected ||
              isConnSel;
            const isDisabled =
              tab.id === 'connection' ? isConnectionDisabled :
              tab.id === 'appearance' ? isAppearanceDisabled :
              isNodeDisabled;

            const isActive = !isSingleFigjam && currentTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                className={`tab-btn${isActive ? ' active' : ''}${isDisabled ? ' disabled' : ''}`}
                disabled={isDisabled}
                role="tab"
                onClick={() => switchTab(tab.id)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      <hr className="section-divider" />

      {/* 3. 탭 패널들 — 피그잼 단일 오브젝트 선택 시 Select a Flooow node 그레이 카드만 노출 */}
      <main className="tab-panels">
        {isSingleFigjam ? (
          <div className="figjam-empty-card">
            <span>Select a Flooow node</span>
          </div>
        ) : (
          <>
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
          </>
        )}
      </main>

      {/* 4. 푸터: connection 탭이 아닐 때 CTA 버튼 노출 (FigJam 단일 선택 포함) */}
      {currentTab !== 'connection' && (
        <footer className="app-footer">
          <button
            id="btn-main-cta"
            className={`btn-cta-primary${isFigjamSelected ? ' disabled' : ''}`}
            type="button"
            disabled={isFigjamSelected}
            onClick={isFigjamSelected ? undefined : handleMainAction}
          >
            {ctaLabel}
          </button>
        </footer>
      )}

      {/* 팝오버 레이어 */}
      <ContextMenu onEdit={handleContextEdit} onDelete={handleContextDelete} />

      {/* 모달 레이어 */}
      {activeModal === 'add-size' && (
        <SizeModal
          mode="add"
          initialW={lastNodeConfig.width || 375}
          initialH={lastNodeConfig.height || 812}
          initialRadius={lastNodeConfig.cornerRadius || 0}
          initialSizeMode={(lastNodeConfig.sizeMode as 'fixed' | 'hug' | 'fit') || 'fixed'}
          onSave={handleAddSizeSave}
          onClose={() => setActiveModal('none')}
        />
      )}
      {activeModal === 'edit-size' && (
        <SizeModal
          mode="edit"
          initialName={editSizePreset?.name || 'Custom'}
          initialW={editSizePreset?.w || 375}
          initialH={editSizePreset?.h || 812}
          initialRadius={editSizePreset?.radius ?? 0}
          initialSizeMode={editSizePreset?.sizeMode || 'fixed'}
          onSave={handleEditSizeSave}
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
          mode="add"
          initialColor={uiState.selectedColor}
          isMixed={summary.isMultiFlowNode ? summary.color.isMixed : false}
          onClose={() => setActiveModal('none')}
        />
      )}
      {activeModal === 'edit-style' && (
        <StyleModal
          mode="edit"
          editingPresetId={selectedStylePresetId}
          initialColor={uiState.selectedColor}
          isMixed={summary.isMultiFlowNode ? summary.color.isMixed : false}
          onClose={() => setActiveModal('none')}
        />
      )}
      {activeModal === 'connector-color' && (() => {
        const isConnectorColorMixed = summary.isMultiConnector
          ? summary.connectorColor.isMixed
          : false;

        return (
          <ConnectorColorModal
            initialColor={isConnectorColorMixed ? '' : (uiState.selectedConnectorColor || '#000000')}
            isMixed={isConnectorColorMixed}
            onApply={(colorHex) => {
              const formatted = colorHex.toUpperCase();
              setUIState({ selectedConnectorColor: formatted });

              // 선택된 커넥터가 있는 경우 모든 커넥터에 즉시 색상 변경 메시지 전송 (실시간 즉시 어플라이)
              const connNodes = selectedNodes.filter((n) => n && n.isConnector);
              if (connNodes.length > 0) {
                connNodes.forEach((c) => {
                  parent.postMessage(
                    {
                      pluginMessage: {
                        type: 'UPDATE_CONNECTOR_PROPERTIES',
                        payload: {
                          connectorId: c.id,
                          colorHex: formatted,
                        },
                      },
                    },
                    '*'
                  );
                });
              }
            }}
            onClose={() => setActiveModal('none')}
          />
        );
      })()}
      {activeModal === 'fill-color' && (() => {
        const isFillMixed = summary.isMultiFlowNode ? summary.color.isMixed : false;
        const currentFill = (summary.isMultiFlowNode
          ? summary.color.value
          : (summary.isSingleFlowNode ? summary.color.value : uiState.selectedColor)
        ) || uiState.selectedColor || '#FFFFFF';

        return (
          <FillColorModal
            initialColor={currentFill}
            isMixed={isFillMixed}
            onApply={(colorHex) => {
              setUIState({ selectedColor: colorHex });
              setLastNodeConfig({ color: colorHex });
              applyCurrentNodeState(undefined, { colorHex });
            }}
            onClose={() => setActiveModal('none')}
          />
        );
      })()}
      {activeModal === 'stroke-color' && (() => {
        const isStrokeMixed = summary.isMultiFlowNode ? summary.strokeColor.isMixed : false;
        const isWeightMixed = summary.isMultiFlowNode ? summary.strokeWeight.isMixed : false;

        const currentStrokeColor = (summary.isMultiFlowNode
          ? summary.strokeColor.value
          : (summary.isSingleFlowNode ? summary.strokeColor.value : uiState.selectedStrokeColor)
        ) || uiState.selectedStrokeColor || '#000000';

        const rawWeight = summary.isMultiFlowNode
          ? summary.strokeWeight.value
          : (summary.isSingleFlowNode ? summary.strokeWeight.value : uiState.selectedStrokeWeight);
        const currentStrokeWeight = typeof rawWeight === 'number'
          ? rawWeight
          : (typeof uiState.selectedStrokeWeight === 'number' ? uiState.selectedStrokeWeight : 1.5);

        return (
          <StrokeColorModal
            initialColor={currentStrokeColor}
            initialWeight={currentStrokeWeight}
            isColorMixed={isStrokeMixed}
            isWeightMixed={isWeightMixed}
            onApply={(strokeColor, strokeWeight) => {
              setUIState({ selectedStrokeColor: strokeColor, selectedStrokeWeight: strokeWeight });
              setLastNodeConfig({ strokeColor, strokeWeight });
              applyCurrentNodeState(undefined, { strokeColor, strokeWeight });
            }}
            onClose={() => setActiveModal('none')}
          />
        );
      })()}

      {/* 툴팁 */}
      <FigmaTooltip />
    </div>
  );
}
