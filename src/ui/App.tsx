import React, { useCallback, useEffect, useState, useRef } from 'react';
import { labelFillIsDefault, labelStrokeFollowsConnector, useApp } from './context/AppContext';
import { getDefaultNodeTitle } from '../domain/nodeDomain';
import { useFigmaMessage } from './hooks/useFigmaMessage';
import { useAutoResize } from './hooks/useAutoResize';
import { useSelectionSummary } from './hooks/useSelectionSummary';
import { t } from '../i18n';

import { NodePanel } from './components/node/NodePanel';
import { AppearancePanel } from './components/appearance/AppearancePanel';
import { ConnectionPanel } from './components/connection/ConnectionPanel';
import { FigmaTooltip } from './components/shared/Tooltip';
import { ContextMenu } from './components/popovers/ContextMenu';
import { isUnlimitedEntitlement, planShortName } from '../entitlementGate';
import { IcChevronRight } from './components/shared/icons';
import { SizeModal } from './components/modals/SizeModal';
import { FigmaDesignPickerModal } from './components/modals/FigmaDesignPickerModal';
import { StyleModal } from './components/modals/StyleModal';
import { ConnectorColorModal } from './components/modals/ConnectorColorModal';
import { FillColorModal } from './components/modals/FillColorModal';
import { StrokeColorModal } from './components/modals/StrokeColorModal';
import { SubscriptionModal } from './components/modals/SubscriptionModal';

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
  nodeCount: number,
): string {
  if (nodeCount >= 2) return 'Apply to All';
  if (nodeCount === 1) return 'Apply';
  return 'Create Node';
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
    nodeOptionState, setNodeOptionState,
    contextMenuOpen, setContextMenuOpen,
    applyCurrentNodeState,
    lastConnectorConfig,
    setLastConnectorConfig,
    markConnectorDirty,
    showToast,
    autoResizeWindow,
    stylePresets,
    selectedStylePresetId,
    setSelectedStylePresetId,
    selectedSizePresetId,
    sizePresets,
    addSizePreset,
    updateSizePreset,
    multiDraft,
    hasMultiDraft,
    updateMultiDraft,
    isApplyingMultiDraft,
    hasSingleChanges,
    triggerFormChange,
    canUndo,
    handleUndo,
    hasConnectorLabelDraft,
    connectorDirty,
    endpointDirty,
    connectorLabelDraft,
    updateConnectorLabelDraft,
    flooowUsage,
    usageCounting,
    requestFlooowUsage,
    planIssue,
    retryPlanLoad,
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
  const flooowCount = selectedNodes.filter((n) => n && n.isFlowNode).length;
  const figjamObjectCount = selectedNodes.filter((n) => n && !n.isFlowNode && !n.isConnector).length;
  const isMixedNodeAndFigjam = flooowCount > 0 && figjamObjectCount > 0;

  // 커넥터 여부 판별
  const allConnectors = nodeCount > 0 && selectedNodes.every(n => n && n.isConnector);
  const isSingleConn = nodeCount === 1 && allConnectors;
  const isMultiConn = nodeCount >= 2 && allConnectors;
  const isConnSel = isSingleConn || isMultiConn;

  // CTA 레이블 (Node, Appearance, Connection 통합 적용 버튼)
  const ctaLabel = getCtaLabel(nodeCount);

  // 탭 자동 전환 제어 (선택 조건에 따른 적절한 탭으로 자동 이동)
  useEffect(() => {
    if (isSingleFigjam) {
      // 1. 피그잼 단일 오브젝트 선택: 기본 Node 탭 유지
      if (currentTab !== 'node') setCurrentTab('node');
    } else if (isMixedNodeAndFigjam || isMultiFigjam) {
      // 2. 피그잼 복수, 또는 노드+피그잼 혼합: Connection 탭 자동 이동
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
  }, [isSingleFigjam, isMultiFigjam, isMixedNodeAndFigjam, isConnSel, nodeCount, currentTab, setCurrentTab]);


  // 탭 전환 후 autoResize
  useEffect(() => {
    autoResizeWindow();
  }, [currentTab, autoResizeWindow]);

  // 타입 변경으로 섹션이 접혀도 패널 박스만으로는 줄어든 높이가 안 잡히는 경우가 있다.
  const nodeLayoutKey = [
    nodeOptionState.nodeType,
    nodeOptionState.branchVariant ?? '',
    multiDraft.nodeType ?? '',
    multiDraft.branchVariant ?? '',
    selectedNodes.map((n) => `${n?.flowNodeType ?? ''}:${n?.branchVariant ?? ''}`).join(','),
  ].join('|');
  useEffect(() => {
    autoResizeWindow();
  }, [nodeLayoutKey, autoResizeWindow]);

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
        // Tab 키 등 포커스 진입 시 전체 선택 (빈 값이거나 Mixed 상태일 때는 select 방지)
        requestAnimationFrame(() => {
          const isMixedOrEmpty = target.value === '' || target.placeholder === 'Mixed';
          if (!isMixedOrEmpty) {
            target.select();
          }
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
        // 새로 포커스된 순간 마우스 클릭 시 전체 선택 보장 (빈 값이거나 Mixed 상태일 때는 select 방지)
        if (newlyFocusedInput === target) {
          const isMixedOrEmpty = target.value === '' || target.placeholder === 'Mixed';
          if (!isMixedOrEmpty) {
            target.select();
          }
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
    if ((isMultiFigjam || isMixedNodeAndFigjam) && tabId !== 'connection') return;

    // 노드 1개 이하일 때 Connection 탭 클릭 차단
    if (tabId === 'connection' && !isConnSel && nodeCount < 2) return;
    if (tabId === 'appearance' && (nodeCount === 0 || isConnSel || isFigjamSelected || isMixedNodeAndFigjam)) return;
    if (tabId === 'node' && (isConnSel || isFigjamSelected || isMixedNodeAndFigjam)) return;

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
          Figma object
        </div>
      );
    }
    // 0-1b. 노드 + 피그잼 오브젝트: Connection 전용 인디케이터
    if (isMixedNodeAndFigjam) {
      const nodeLabel = flooowCount === 1 ? '1 Node' : `${flooowCount} Nodes`;
      const figjamLabel = figjamObjectCount === 1 ? '1 Figma object' : `${figjamObjectCount} Figma objects`;
      return (
        <div id="multi-selection-indicator" className="multi-selection-indicator" style={{ width: '100%', display: 'flex' }}>
          <span id="multi-selection-text">{`${nodeLabel} and ${figjamLabel} selected`}</span>
        </div>
      );
    }
    // 0-2. 피그잼 복수 오브젝트 선택: 'N Figjam objects selected' (다중 인디케이터)
    if (isMultiFigjam) {
      return (
        <div id="multi-selection-indicator" className="multi-selection-indicator" style={{ width: '100%', display: 'flex' }}>
          <span id="multi-selection-text">{`${nodeCount} Figma objects selected`}</span>
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
          defaultValue={nodeCount === 1
            ? (selectedNodes[0]?.title || selectedNodes[0]?.name || getDefaultNodeTitle(selectedNodes[0]?.flowNodeType || selectedNodes[0]?.nodeType, selectedNodes[0]?.branchVariant))
            : getDefaultNodeTitle(nodeOptionState.nodeType, nodeOptionState.branchVariant)}
          placeholder="Enter node title"
          onInput={() => {
            if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current);
            titleDebounceRef.current = setTimeout(() => applyCurrentNodeState(), 400);
          }}
        />
      </div>
    );
  }

  const planLoading = flooowUsage === null && planIssue === null;

  return (
    <div id="plugin-root" onClick={handleRootClick} onInput={triggerFormChange} onChange={triggerFormChange}>
      {/* 1. 타이틀 배너 */}
      <div className="title-banner">
        <div style={{ flex: 1, minWidth: 0 }}>
          {renderTitleBanner()}
        </div>
      </div>

      {/* 2. 메인 탭 세그먼트 컨트롤 */}
      <nav className="main-tabs-wrapper">
        <div className={`segmented-control${planLoading || planIssue ? ' disabled' : ''}`} role="tablist">
          {TABS.map(tab => {
            const isConnectionDisabled =
              isSingleFigjam ||
              (!isConnSel && nodeCount < 2);
            const isAppearanceDisabled =
              isFigjamSelected ||
              isMixedNodeAndFigjam ||
              nodeCount === 0 ||
              isConnSel;
            const isNodeDisabled =
              isFigjamSelected ||
              isMixedNodeAndFigjam ||
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
                disabled={isDisabled || planLoading || planIssue !== null}
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
        {planLoading ? null : planIssue ? (
          <div className="figjam-empty-card is-error">
            <span>
              {planIssue === 'blocked'
                ? "Figma didn't respond, so Flooow can't edit this file right now."
                : "Couldn't load your plan. Refresh to try again."}
            </span>
          </div>
        ) : isSingleFigjam ? (
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

      {/* 4. 푸터: 왼쪽 구독 상태(Free Plan) + 오른쪽 액션 영역 */}
      {(() => {
        const isMultiFlow = nodeCount >= 2 && !isConnSel && !isFigjamSelected && !isMixedNodeAndFigjam;

        // Quota UI는 Core FLOOOW_USAGE만 사용 (UI 자체 계산 금지).
        // usage 미수신(null) 상태에서는 어떤 수치도 가정하지 않는다.
        const usageBlocked = flooowUsage !== null && !flooowUsage.canCreate;
        const unlimited = isUnlimitedEntitlement(flooowUsage?.entitlement);
        const planBadgeText = flooowUsage === null
          ? ''
          : `${planShortName(flooowUsage.entitlement)} Plan`;
        const limitReached = usageBlocked && !unlimited;
        const meterText = flooowUsage === null
          ? ''
          : unlimited
            ? 'Unlimited elements'
            : limitReached
              ? 'Limit reached in this project'
              : `${flooowUsage.total} / ${flooowUsage.limit} elements`;

        return (
          <footer className="app-footer">
            {/* 왼쪽: 구독 정보 로딩 중에는 플랜 묶음 대신 스피너 */}
            <div
              className={`footer-left${planLoading ? '' : ' footer-clickable'}`}
              onClick={planLoading || planIssue ? undefined : () => {
                setActiveModal('subscription');
                requestFlooowUsage();
              }}
              title={planLoading || planIssue ? undefined : 'Plan & Usage'}
            >
              {planLoading ? (
                <span className="footer-plan-spinner" role="status" aria-label="Loading plan" />
              ) : planIssue ? null : (
                <div className="footer-plan-block">
                  <div className="footer-plan-row">
                    <span className={`footer-plan-title${unlimited ? ' paid' : ''}`}>{planBadgeText}</span>
                    <span className={`footer-plan-chevron${unlimited ? ' paid' : ''}`}>
                      <IcChevronRight />
                    </span>
                  </div>
                  <span
                    className={`footer-usage-meter${limitReached ? ' limit-reached' : ''}`}
                    title={meterText}
                  >
                    {meterText}
                  </span>
                </div>
              )}
            </div>

            {/* 오른쪽: 선택 상태에 따른 액션 버튼 (단일 선택 시 버튼 없음) */}
            <div className="footer-right">
              {planLoading ? null : planIssue ? (
                <button className="btn-ghost" type="button" onClick={retryPlanLoad}>
                  Refresh
                </button>
              ) : nodeCount === 1 ? null : isMultiFlow || isMultiConn ? (
                /* 노드 복수 선택·커넥터만 복수 선택: Undo(초안 취소) + Apply to All */
                <>
                  <button
                    id="btn-undo"
                    className="btn-ghost"
                    type="button"
                    disabled={isMultiConn ? (!hasConnectorLabelDraft && !canUndo && !endpointDirty) : (!hasMultiDraft && !canUndo && !endpointDirty)}
                    onClick={handleUndo}
                  >
                    Undo
                  </button>
                  <button
                    id="btn-main-cta"
                    className={`btn-cta-primary${(isMultiConn ? (!hasConnectorLabelDraft && !connectorDirty && !endpointDirty) : (!hasMultiDraft && !endpointDirty)) || isApplyingMultiDraft ? ' disabled' : ''}`}
                    type="button"
                    disabled={(isMultiConn ? (!hasConnectorLabelDraft && !connectorDirty && !endpointDirty) : (!hasMultiDraft && !endpointDirty)) || isApplyingMultiDraft}
                    onClick={handleMainAction}
                  >
                    Apply to All
                  </button>
                </>
              ) : (
                /* 기타 상태 (0개 선택 생성 모드, 커넥터 선택 등) */
                <>
                  {(isConnSel && canUndo) && (
                    <button
                      id="btn-undo"
                      className="btn-ghost"
                      type="button"
                      onClick={handleUndo}
                    >
                      Undo
                    </button>
                  )}
                  <button
                    id="btn-main-cta"
                    className={`btn-cta-primary${((isFigjamSelected && !isMultiFigjam) || (!isConnSel && usageBlocked)) ? ' disabled' : ''}`}
                    type="button"
                    disabled={(isFigjamSelected && !isMultiFigjam) || (!isConnSel && usageBlocked)}
                    title={!isConnSel && usageBlocked ? t('tipQuotaBlocked') : undefined}
                    onClick={handleMainAction}
                  >
                    {isConnSel ? 'Apply' : (
                      <>
                        <svg className="create-node-plus" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                          <path d="M8 3.25c.331 0 .6.269.6.6v3.55H12.15a.6.6 0 0 1 0 1.2H8.6V12.15a.6.6 0 0 1-1.2 0V8.6H3.85a.6.6 0 0 1 0-1.2h3.55V3.85c0-.331.269-.6.6-.6Z" fill="currentColor" />
                        </svg>
                        Create Node
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </footer>
        );
      })()}

      {/* 팝오버 레이어 */}
      <ContextMenu onEdit={handleContextEdit} onDelete={handleContextDelete} />

      {/* 모달 레이어 */}
      {activeModal === 'add-size' && (
        <SizeModal
          mode="add"
          initialW={nodeOptionState.width || 375}
          initialH={nodeOptionState.height || 812}
          initialRadius={nodeOptionState.cornerRadius || 0}
          initialSizeMode={(nodeOptionState.sizeMode as 'fixed' | 'hug' | 'fit') || 'fixed'}
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
          initialColor={nodeOptionState.fillColor}
          isMixed={summary.isMultiFlowNode ? summary.color.isMixed : false}
          onClose={() => setActiveModal('none')}
        />
      )}
      {activeModal === 'edit-style' && (
        <StyleModal
          mode="edit"
          editingPresetId={selectedStylePresetId}
          initialColor={nodeOptionState.fillColor}
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
              const fillIsDefault = labelFillIsDefault(
                lastConnectorConfig.labelFillColor,
                uiState.selectedConnectorColor
              );
              const strokeFollows = labelStrokeFollowsConnector(
                lastConnectorConfig.labelStrokeColor,
                uiState.selectedConnectorColor
              );
              setUIState({ selectedConnectorColor: formatted });

              const connNodes = selectedNodes.filter((n) => n && n.isConnector);
              console.log('[FLOOOW-CONN-COLOR] ui apply', {
                colorHex: formatted,
                selected: selectedNodes.map((n) => ({ id: n?.id, isConnector: n?.isConnector, type: n?.flowNodeType })),
                connCount: connNodes.length,
              });
              if (connNodes.length === 0) {
                console.log('[FLOOOW-CONN-COLOR] ui apply skipped: no connector in selection');
              }
              connNodes.forEach((c) => {
                console.log('[FLOOOW-CONN-COLOR] post', { connectorId: c.id, colorHex: formatted });
                parent.postMessage(
                  {
                    pluginMessage: {
                      type: 'UPDATE_CONNECTOR_PROPERTIES',
                      payload: {
                        connectorId: c.id,
                        colorHex: formatted,
                        ...(fillIsDefault ? { labelFillColor: '#FFFFFF' } : {}),
                        ...(strokeFollows ? { labelStrokeColor: formatted } : {}),
                      },
                    },
                  },
                  '*'
                );
              });
            }}
            onClose={() => setActiveModal('none')}
          />
        );
      })()}
      {activeModal === 'fill-color' && (() => {
        const isFillMixed = summary.isMultiFlowNode
          ? (multiDraft.colorHex !== undefined ? false : summary.color.isMixed)
          : false;
        const currentFill = multiDraft.colorHex !== undefined
          ? multiDraft.colorHex
          : ((summary.isMultiFlowNode
              ? summary.color.value
              : (summary.isSingleFlowNode ? summary.color.value : nodeOptionState.fillColor)
            ) || nodeOptionState.fillColor || '#FFFFFF');

        return (
          <FillColorModal
            initialColor={currentFill}
            isMixed={isFillMixed}
            onApply={(colorHex) => {
              if (selectedNodes.length >= 2) {
                updateMultiDraft({ colorHex });
              } else {
                setNodeOptionState({ fillColor: colorHex });
                applyCurrentNodeState(undefined, { colorHex });
              }
            }}
            onClose={() => setActiveModal('none')}
          />
        );
      })()}
      {activeModal === 'stroke-color' && (() => {
        const isStrokeMixed = summary.isMultiFlowNode
          ? (multiDraft.strokeColor !== undefined ? false : summary.strokeColor.isMixed)
          : false;
        const isWeightMixed = summary.isMultiFlowNode
          ? (multiDraft.strokeWeight !== undefined ? false : summary.strokeWeight.isMixed)
          : false;

        const currentStrokeColor = multiDraft.strokeColor !== undefined
          ? multiDraft.strokeColor
          : ((summary.isMultiFlowNode
              ? summary.strokeColor.value
              : (summary.isSingleFlowNode ? summary.strokeColor.value : nodeOptionState.strokeColor)
            ) || nodeOptionState.strokeColor || '#000000');

        const rawWeight = summary.isMultiFlowNode
          ? summary.strokeWeight.value
          : (summary.isSingleFlowNode ? summary.strokeWeight.value : nodeOptionState.strokeWeight);
        const currentStrokeWeight = multiDraft.strokeWeight !== undefined
          ? multiDraft.strokeWeight
          : (typeof rawWeight === 'number'
              ? rawWeight
              : (typeof nodeOptionState.strokeWeight === 'number' ? nodeOptionState.strokeWeight : 1.5));

        return (
          <StrokeColorModal
            initialColor={currentStrokeColor}
            initialWeight={currentStrokeWeight}
            isColorMixed={isStrokeMixed}
            isWeightMixed={isWeightMixed}
            onApply={(strokeColor, strokeWeight) => {
              if (selectedNodes.length >= 2) {
                updateMultiDraft({ strokeColor, strokeWeight });
              } else {
                setNodeOptionState({ strokeColor, strokeWeight });
                applyCurrentNodeState(undefined, { strokeColor, strokeWeight });
              }
            }}
            onClose={() => setActiveModal('none')}
          />
        );
      })()}
      {activeModal === 'label-fill-color' && (
        <FillColorModal
          title="Label Fill"
          showStylePresets
          isMixed={isMultiConn && connectorLabelDraft.labelFillColor === undefined && summary.connectorLabelFillColor.isMixed}
          initialColor={
            connectorLabelDraft.labelFillColor
            || (isMultiConn && !summary.connectorLabelFillColor.isMixed ? summary.connectorLabelFillColor.value : undefined)
            || lastConnectorConfig.labelFillColor
            || '#FFFFFF'
          }
          onApply={(colorHex) => {
            // None(투명)은 'None'으로 정규화 (어피어런스 Style과 동일 규격)
            const clean = colorHex.toLowerCase() === 'none' ? 'None' : colorHex.toUpperCase();
            if (isMultiConn) {
              updateConnectorLabelDraft({ labelFillColor: clean });
            } else {
              setLastConnectorConfig({ labelFillColor: clean });
              markConnectorDirty();
            }
          }}
          onClose={() => setActiveModal('none')}
        />
      )}
      {activeModal === 'label-stroke-color' && (
        <StrokeColorModal
          title="Label Stroke"
          showStylePresets
          hideWeightControl={true}
          isColorMixed={isMultiConn && connectorLabelDraft.labelStrokeColor === undefined && summary.connectorLabelStrokeColor.isMixed}
          initialColor={
            connectorLabelDraft.labelStrokeColor
            || (isMultiConn && !summary.connectorLabelStrokeColor.isMixed ? summary.connectorLabelStrokeColor.value : undefined)
            || lastConnectorConfig.labelStrokeColor
            || uiState.selectedConnectorColor
            || '#000000'
          }
          initialWeight={(lastConnectorConfig.labelStrokeColor || '').toLowerCase() === 'none' ? 0 : 1}
          onApply={(strokeColor, strokeWeight) => {
            // 두께 0 또는 None이면 보더 삭제('None'), 그 외에는 HEX 저장
            const isStrokeNone = strokeWeight === 0 || strokeColor.toLowerCase() === 'none';
            const clean = isStrokeNone ? 'None' : strokeColor.toUpperCase();
            if (isMultiConn) {
              updateConnectorLabelDraft({ labelStrokeColor: clean });
            } else {
              setLastConnectorConfig({ labelStrokeColor: clean });
              markConnectorDirty();
            }
          }}
          onClose={() => setActiveModal('none')}
        />
      )}
      {activeModal === 'subscription' && (
        <SubscriptionModal
          usage={flooowUsage}
          scanning={usageCounting}
          onClose={() => setActiveModal('none')}
        />
      )}

      {/* 툴팁 */}
      <FigmaTooltip />
    </div>
  );
}
