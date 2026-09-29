import React, { useCallback, useEffect, useState } from 'react';
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
    const isPopoverTrigger =
      target.closest('#btn-size-more') ||
      target.closest('#btn-style-more') ||
      target.closest('#btn-size-mode-dropdown') ||
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

  // Context menu 핸들러
  function handleContextEdit() {
    setContextMenuOpen(false);
  }

  function handleContextDelete() {
    setContextMenuOpen(false);
  }

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
    // 3. 단일 노드 or 0개: 타이틀 입력
    return (
      <div id="single-title-wrap" style={{ width: '100%' }}>
        <input
          type="text"
          id="node-title-input"
          className="node-title-input"
          maxLength={32}
          defaultValue={nodeCount === 1 ? (selectedNodes[0]?.title || selectedNodes[0]?.name || 'Screen') : 'Screen'}
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
        <div style={{ flex: 1, minWidth: 0, marginRight: '8px' }}>
          {renderTitleBanner()}
        </div>
        <button
            type="button"
            id="btn-header-settings"
            className="btn-action-icon"
            title="Settings"
            data-tooltip="Settings"
            onClick={() => {
              showToast('Settings 메뉴입니다.');
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M13.2118 18.8955C12.8175 18.9644 12.4124 19 11.9999 19C11.6905 19 11.3854 18.9796 11.0858 18.9404L10.788 18.8955C10.092 18.7739 9.74773 18.1555 9.7499 17.6348C9.7512 17.2849 9.57075 16.9479 9.2499 16.7627C8.96936 16.6008 8.64204 16.5896 8.3622 16.707L8.24501 16.7656L8.1581 16.8115C7.70859 17.0267 7.06175 17.0052 6.63662 16.499C6.18276 15.9584 5.8085 15.3474 5.5331 14.6846L5.42177 14.3965C5.1802 13.7332 5.54323 13.1273 5.99501 12.8691C6.2988 12.6953 6.4999 12.3706 6.4999 12C6.49988 11.6294 6.29881 11.3046 5.99501 11.1309C5.54321 10.8727 5.18014 10.2668 5.42177 9.60352C5.70389 8.82934 6.11784 8.11892 6.63662 7.50098C7.08996 6.96123 7.79554 6.9726 8.24501 7.23438C8.54732 7.41038 8.92911 7.42241 9.2499 7.2373C9.57076 7.05205 9.75121 6.71515 9.7499 6.36523C9.74772 5.84453 10.092 5.22612 10.788 5.10449C11.1823 5.0356 11.5873 5 11.9999 5C12.4124 5 12.8175 5.03561 13.2118 5.10449C13.9078 5.22612 14.2521 5.84452 14.2499 6.36523C14.2486 6.71516 14.429 7.05205 14.7499 7.2373C15.0707 7.42244 15.4525 7.41036 15.7548 7.23438C16.2042 6.9726 16.9098 6.96129 17.3632 7.50098C17.882 8.11892 18.2969 8.82934 18.579 9.60352C18.8204 10.2666 18.4574 10.8727 18.0058 11.1309C17.7017 11.3046 17.4999 11.6293 17.4999 12C17.4999 12.3708 17.7017 12.6954 18.0058 12.8691C18.4574 13.1273 18.8204 13.7334 18.579 14.3965C18.2969 15.1707 17.882 15.8811 17.3632 16.499C16.938 17.0052 16.2912 17.0267 15.8417 16.8115L15.7548 16.7656C15.4524 16.5896 15.0707 16.5785 14.7499 16.7637C14.4292 16.9489 14.2486 17.285 14.2499 17.6348C14.2521 18.1555 13.9078 18.7739 13.2118 18.8955ZM10.9599 17.9102C11.2976 17.9692 11.6452 18 11.9999 18C12.3546 18 12.7022 17.9692 13.0399 17.9102C13.167 17.8879 13.2503 17.7687 13.2499 17.6396C13.247 16.9456 13.6058 16.2694 14.2499 15.8975C14.8939 15.5257 15.6591 15.5522 16.2587 15.9014C16.3701 15.9661 16.5147 15.9542 16.5976 15.8555C17.0425 15.3255 17.3971 14.7173 17.6386 14.0547C17.6827 13.9335 17.6216 13.8013 17.5097 13.7373C16.9068 13.3928 16.4999 12.7441 16.4999 12C16.4999 11.2559 16.9068 10.6072 17.5097 10.2627C17.6216 10.1987 17.6827 10.0665 17.6386 9.94531C17.3971 9.28272 17.0425 8.67453 16.5976 8.14453C16.5147 8.04584 16.3701 8.03387 16.2587 8.09863C15.6591 8.44785 14.8939 8.47434 14.2499 8.10254C13.6058 7.73058 13.247 7.05442 13.2499 6.36035C13.2503 6.23134 13.167 6.11205 13.0399 6.08984C12.7022 6.03082 12.3546 6 11.9999 6C11.6452 6 11.2976 6.03081 10.9599 6.08984C10.8328 6.11209 10.7495 6.23137 10.7499 6.36035C10.7528 7.05444 10.394 7.73059 9.7499 8.10254C9.10609 8.47424 8.34161 8.4476 7.74208 8.09863C7.63067 8.03375 7.48514 8.04579 7.40224 8.14453C6.95735 8.67452 6.60272 9.28273 6.36123 9.94531C6.31705 10.0665 6.37909 10.1987 6.49111 10.2627C7.09373 10.6072 7.49988 11.2561 7.4999 12C7.4999 12.7439 7.09372 13.3928 6.49111 13.7373C6.37909 13.8013 6.31705 13.9335 6.36123 14.0547C6.60272 14.7173 6.95735 15.3255 7.40224 15.8555C7.48514 15.9542 7.63067 15.9663 7.74208 15.9014C8.34161 15.5524 9.10609 15.5258 9.7499 15.8975C10.394 16.2694 10.7528 16.9456 10.7499 17.6396C10.7495 17.7686 10.8328 17.8879 10.9599 17.9102ZM12 13.5C12.8284 13.5 13.5 12.8284 13.5 12C13.5 11.1716 12.8284 10.5 12 10.5C11.1715 10.5 10.5 11.1716 10.5 12C10.5 12.8284 11.1715 13.5 12 13.5ZM12 9.5C13.3807 9.5 14.5 10.6193 14.5 12C14.5 13.3807 13.3807 14.5 12 14.5C10.6193 14.5 9.49997 13.3807 9.49997 12C9.49997 10.6193 10.6193 9.5 12 9.5Z"
                fill="currentColor"
              />
            </svg>
          </button>
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
