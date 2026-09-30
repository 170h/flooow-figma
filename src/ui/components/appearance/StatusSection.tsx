import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useSelectionSummary } from '../../hooks/useSelectionSummary';
import { Switch } from '../shared/Switch';
import { normalizeNodeType, type WorkflowStatus } from '../../../types';

const STATUSES = [
  { id: 'draft', label: 'Draft', color: '#9CA3AF' },
  { id: 'wireframe', label: 'Wireframe', color: '#6B7280' },
  { id: 'in_progress', label: 'In Progress', color: '#3B82F6' },
  { id: 'in_review', label: 'In Review', color: '#FF9E42' },
  { id: 'revision', label: 'Revision', color: '#F24822' },
  { id: 'approved', label: 'Approved', color: '#8B5CF6' },
  { id: 'ready_for_dev', label: 'Ready for Dev', color: '#16A34A' },
  { id: 'done', label: 'Done', color: '#374151' },
] as const;

/**
 * Status 섹션 - 토글 스위치 + 8종 상태 칩 (토글형)
 * Screen 타입일 때만 활성화, 그 외 타입은 비활성(dimmed) 처리
 */
export function StatusSection() {
  const {
    uiState,
    setUIState,
    lastNodeConfig,
    setLastNodeConfig,
    applyStatusToNode,
    selectedNodes,
    autoResizeWindow,
    multiDraft,
    updateMultiDraft,
  } = useApp();
  const summary = useSelectionSummary();

  const [isOpen, setIsOpen] = useState(() => {
    if (selectedNodes.length === 1 && selectedNodes[0]?.isFlowNode) {
      return Boolean(selectedNodes[0]?.status);
    }
    return Boolean(lastNodeConfig.statusOn);
  });

  const userActionLockRef = React.useRef<number>(0);
  const prevSelectedNodeIdRef = React.useRef<string | null>(null);

  const { selectedStatus } = uiState;

  // Screen 타입일 때만 Status 허용 (DescriptionSection의 isDescriptionAllowed 패턴과 동일)
  const isStatusAllowed = (() => {
    if (multiDraft.nodeType !== undefined) {
      return normalizeNodeType(multiDraft.nodeType) === 'Screen';
    }
    if (summary.isMultiFlowNode) {
      return !summary.nodeType.isMixed && normalizeNodeType(summary.nodeType.value) === 'Screen';
    }
    if (selectedNodes.length === 1) {
      const rawType = selectedNodes[0]?.flowNodeType || (selectedNodes[0]?.nodeType === 'FRAME' ? 'Screen' : selectedNodes[0]?.nodeType);
      return normalizeNodeType(rawType) === 'Screen';
    }
    const creationType = uiState.selectedNodeType || lastNodeConfig.nodeType || 'Screen';
    return normalizeNodeType(creationType) === 'Screen';
  })();

  // 선택된 노드의 상태와 UI 동기화 (사용자 조작 직후 600ms 동안은 중간 응답 덮어쓰기 방지)
  React.useEffect(() => {
    const isUserLocked = Date.now() - userActionLockRef.current < 600;
    const currentNodeId = selectedNodes.length === 1 ? selectedNodes[0]?.id : (selectedNodes.length > 1 ? 'MULTI' : null);
    const isDifferentNode = currentNodeId !== prevSelectedNodeIdRef.current;
    prevSelectedNodeIdRef.current = currentNodeId;

    if (!isUserLocked || isDifferentNode) {
      if (summary.isSingleFlowNode) {
        const node = selectedNodes[0];
        const hasStatus = Boolean(node && node.status);
        setIsOpen(hasStatus);
        if (node && node.status) {
          setUIState({ selectedStatus: node.status });
        }
      } else if (summary.isMultiFlowNode) {
        const hasStatus = summary.statusOn.hasValue;
        setIsOpen(hasStatus);
        if (!summary.status.isMixed && summary.status.value) {
          setUIState({ selectedStatus: summary.status.value });
        }
      } else {
        setIsOpen(Boolean(lastNodeConfig.statusOn));
      }
    }
  }, [summary.isSingleFlowNode, summary.isMultiFlowNode, summary.status.isMixed, summary.status.value, summary.statusOn.hasValue, selectedNodes, lastNodeConfig.statusOn, setUIState]);

  const isStatusDrafted = multiDraft.status !== undefined;
  const effectiveIsOpen = isStatusDrafted ? Boolean(multiDraft.status) : isOpen;
  const isStatusMixed = isStatusDrafted ? false : (summary.isMultiFlowNode && summary.status.isMixed);
  const activeStatus = isStatusDrafted
    ? (multiDraft.status || undefined)
    : (isStatusMixed ? undefined : (summary.isMultiFlowNode ? summary.status.value : selectedStatus));

  function handleToggle(checked: boolean) {
    userActionLockRef.current = Date.now();
    setIsOpen(checked);

    if (selectedNodes.length >= 2) {
      if (checked) {
        const targetStatus = activeStatus || selectedStatus || 'draft';
        updateMultiDraft({ status: targetStatus as WorkflowStatus });
      } else {
        updateMultiDraft({ status: '' as WorkflowStatus });
      }
      requestAnimationFrame(() => {
        autoResizeWindow();
      });
      return;
    }

    setLastNodeConfig({ statusOn: checked });
    if (checked) {
      const targetStatus = activeStatus || selectedStatus || 'draft';
      applyStatusToNode(targetStatus);
    } else {
      applyStatusToNode('');
    }
    requestAnimationFrame(() => {
      autoResizeWindow();
    });
  }

  function selectStatus(status: string) {
    userActionLockRef.current = Date.now();
    setIsOpen(true);

    if (selectedNodes.length >= 2) {
      updateMultiDraft({ status: status as WorkflowStatus });
      requestAnimationFrame(() => {
        autoResizeWindow();
      });
      return;
    }

    setUIState({ selectedStatus: status });
    setLastNodeConfig({ status, statusOn: true });
    applyStatusToNode(status);
    requestAnimationFrame(() => {
      autoResizeWindow();
    });
  }

  return (
    <div
      className="section-block"
      style={{ paddingBottom: effectiveIsOpen && isStatusAllowed ? '12px' : '0px' }}
    >
      <div className="section-header toggle-row">
        <span className={`section-title${!isStatusAllowed ? ' disabled' : ''}`}>
          Status
        </span>
        <Switch
          id="toggle-status"
          checked={effectiveIsOpen && isStatusAllowed}
          isMixed={isStatusAllowed && !isStatusDrafted && (summary.statusOn.isMixed || isStatusMixed)}
          onChange={handleToggle}
          disabled={!isStatusAllowed}
        />
      </div>
      {effectiveIsOpen && isStatusAllowed && (
        <div className="section-body" style={{ marginTop: '6px' }}>
          <div className="chip-group active" id="status-options" style={{ display: 'flex' }}>
            {STATUSES.map(s => {
              const isChipActive = !isStatusMixed && activeStatus === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  className={`chip-btn${isChipActive ? ' active' : ''}`}
                  data-status={s.id}
                  data-bullet-color={s.color}
                  onClick={() => selectStatus(s.id)}
                >
                  <span className="tab-bullet" style={{ backgroundColor: s.color }} />
                  <span className="tab-label">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
