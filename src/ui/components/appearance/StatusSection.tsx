import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useSelectionSummary } from '../../hooks/useSelectionSummary';
import { Switch } from '../shared/Switch';
import {
  type WorkflowStatus,
  supportsOption,
  getMutationTargets,
  computeOptionSwitchState,
  type OptionSwitchState,
  getOptionCapability,
} from '../../../types';

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
 * Screen 타입일 때만 지원, 그 외 타입(Shape, Bridge, FigmaObject)은 unsupported (비활성/접힘) 처리
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

  const [isOpen, setIsOpen] = useState<boolean | null>(null);

  const userActionLockRef = React.useRef<number>(0);
  const prevSelectedNodeIdRef = React.useRef<string | null>(null);

  const { selectedStatus } = uiState;

  // Option Capability Matrix 기반 스위치 상태 산출
  const rawOptionState = React.useMemo(() => {
    if (selectedNodes.length === 0) {
      const creationType = uiState.selectedNodeType || lastNodeConfig.nodeType || 'Screen';
      const isAllowed = getOptionCapability([{ flowNodeType: creationType, isFlowNode: true }], 'status') !== 'UNSUPPORTED';
      if (!isAllowed) {
        return {
          state: 'OFF' as const,
          supportedCount: 0,
          unsupportedCount: 1,
          supportedNodes: [],
          unsupportedNodes: [],
          checked: false,
          isMixed: false,
          disabled: true,
          isOpen: false,
        };
      }
      const on = Boolean(lastNodeConfig.statusOn);
      return {
        state: (on ? 'ON' : 'OFF') as OptionSwitchState,
        supportedCount: 1,
        unsupportedCount: 0,
        supportedNodes: [],
        unsupportedNodes: [],
        checked: on,
        isMixed: false,
        disabled: false,
        isOpen: on,
      };
    }
    return computeOptionSwitchState(selectedNodes, 'status', (n) => Boolean(n.status));
  }, [selectedNodes, uiState.selectedNodeType, lastNodeConfig.nodeType, lastNodeConfig.statusOn]);

  // 선택된 노드의 상태와 UI 동기화 (사용자 조작 직후 600ms 동안은 중간 응답 덮어쓰기 방지)
  React.useEffect(() => {
    const isUserLocked = Date.now() - userActionLockRef.current < 600;
    const currentNodeId = selectedNodes.length === 1 ? selectedNodes[0]?.id : (selectedNodes.length > 1 ? 'MULTI' : null);
    const isDifferentNode = currentNodeId !== prevSelectedNodeIdRef.current;
    prevSelectedNodeIdRef.current = currentNodeId;

    if (isDifferentNode) {
      setIsOpen(null);
    }

    if (!isUserLocked || isDifferentNode) {
      if (rawOptionState.supportedCount > 0) {
        const supported = rawOptionState.supportedNodes;
        if (supported.length === 1) {
          const node = supported[0];
          if (node && node.status) {
            setUIState({ selectedStatus: node.status });
          }
        } else {
          const firstStatus = supported.find((n) => n.status)?.status;
          const allSame = supported.every((n) => n.status === firstStatus);
          if (allSame && firstStatus) {
            setUIState({ selectedStatus: firstStatus });
          }
        }
      }
    }
  }, [rawOptionState, selectedNodes, setUIState]);

  // Multi Draft 상태 반영
  const isTypeDrafted = multiDraft.nodeType !== undefined;
  const isDraftAllowed = isTypeDrafted
    ? getOptionCapability([{ flowNodeType: multiDraft.nodeType, isFlowNode: true }], 'status') !== 'UNSUPPORTED'
    : true;

  const isStatusDrafted = multiDraft.status !== undefined;
  const effectiveIsOpen = !isDraftAllowed || rawOptionState.disabled
    ? false
    : (isStatusDrafted
        ? Boolean(multiDraft.status)
        : (isOpen !== null ? isOpen : rawOptionState.isOpen));

  const effectiveState = React.useMemo(() => {
    if (selectedNodes.length < 2 && (!isDraftAllowed || rawOptionState.disabled || rawOptionState.state === 'MIXED_DISABLED')) {
      return {
        state: 'OFF' as const,
        checked: false,
        isMixed: false,
        disabled: true,
        isOpen: false,
      };
    }
    if (!isDraftAllowed || rawOptionState.state === 'MIXED_DISABLED') {
      return {
        state: 'MIXED_DISABLED' as const,
        checked: false,
        isMixed: true,
        disabled: true,
        isOpen: false,
      };
    }
    if (isStatusDrafted) {
      const on = Boolean(multiDraft.status);
      return {
        state: (on ? 'ON' : 'OFF') as OptionSwitchState,
        checked: on,
        isMixed: false,
        disabled: false,
        isOpen: on,
      };
    }
    return {
      state: rawOptionState.state,
      checked: rawOptionState.checked,
      isMixed: rawOptionState.isMixed,
      disabled: rawOptionState.disabled,
      isOpen: effectiveIsOpen,
    };
  }, [selectedNodes.length, isDraftAllowed, rawOptionState, isStatusDrafted, multiDraft.status, effectiveIsOpen]);

  // Mixed 상태 판별: 지원 노드들 중에서 상태값이 서로 다른 경우
  const isStatusMixed = React.useMemo(() => {
    if (isStatusDrafted) return false;
    if (effectiveState.disabled) return false;
    const supported = rawOptionState.supportedNodes;
    if (supported.length <= 1) return false;
    const firstStatus = supported[0]?.status;
    return supported.some((n) => n.status !== firstStatus);
  }, [isStatusDrafted, effectiveState.disabled, rawOptionState.supportedNodes]);

  const activeStatus = isStatusDrafted
    ? (multiDraft.status || undefined)
    : (isStatusMixed ? undefined : (rawOptionState.supportedNodes.find((n) => n.status)?.status || selectedStatus));

  // 다중 선택 시 Mixed 상태에서 각 상태별 지원 노드 수 산출
  const statusCounts = React.useMemo(() => {
    if (!isStatusMixed) return {};
    const counts: Record<string, number> = {};
    for (const n of rawOptionState.supportedNodes) {
      if (n.status) {
        counts[n.status] = (counts[n.status] || 0) + 1;
      }
    }
    return counts;
  }, [isStatusMixed, rawOptionState.supportedNodes]);

  function handleToggle(checked: boolean) {
    if (effectiveState.disabled) return;
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

    if (selectedNodes.length === 1 && !supportsOption(selectedNodes[0], 'status')) {
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
    if (effectiveState.disabled) return;
    userActionLockRef.current = Date.now();
    setIsOpen(true);

    if (selectedNodes.length >= 2) {
      updateMultiDraft({ status: status as WorkflowStatus });
      requestAnimationFrame(() => {
        autoResizeWindow();
      });
      return;
    }

    if (selectedNodes.length === 1 && !supportsOption(selectedNodes[0], 'status')) {
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
      style={{ paddingBottom: effectiveState.isOpen ? '12px' : '0px' }}
    >
      <div className="section-header toggle-row">
        <span className={`section-title${effectiveState.disabled ? ' disabled' : ''}`}>
          Status
        </span>
        <Switch
          id="toggle-status"
          checked={effectiveState.checked}
          isMixed={effectiveState.isMixed}
          onChange={handleToggle}
          disabled={effectiveState.disabled}
        />
      </div>
      {effectiveState.isOpen && (
        <div className="section-body" style={{ display: 'flex', marginTop: '6px' }}>
          <div className="chip-group active" id="status-options" style={{ display: 'flex' }}>
            {STATUSES.map(s => {
              const isChipActive = !isStatusMixed && activeStatus === s.id;
              const count = statusCounts[s.id] || 0;
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
                  {count > 0 && <span className="tab-badge">{count}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
