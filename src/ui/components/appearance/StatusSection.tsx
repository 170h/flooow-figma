import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useSelectionSummary } from '../../hooks/useSelectionSummary';

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
 */
export function StatusSection() {
  const {
    uiState,
    setUIState,
    setLastNodeConfig,
    applyStatusToNode,
    selectedNodes,
    autoResizeWindow
  } = useApp();
  const summary = useSelectionSummary();
  const [isOn, setIsOn] = useState(false);
  const { selectedStatus } = uiState;

  // 선택된 노드의 상태와 UI 동기화
  React.useEffect(() => {
    if (summary.isSingleFlowNode) {
      const node = selectedNodes[0];
      if (node && node.status) {
        setIsOn(true);
        setUIState({ selectedStatus: node.status });
      } else {
        setIsOn(false);
      }
    } else if (summary.isMultiFlowNode) {
      // 복수 노드 선택 시: 하나라도 상태가 있으면 패널 활성화
      const hasAnyStatus = summary.statusOn.hasValue;
      setIsOn(hasAnyStatus);
      if (!summary.status.isMixed && summary.status.value) {
        setUIState({ selectedStatus: summary.status.value });
      }
    }
  }, [summary.isSingleFlowNode, summary.isMultiFlowNode, summary.status.isMixed, summary.status.value, summary.statusOn.hasValue, selectedNodes, setUIState]);

  const isStatusMixed = summary.isMultiFlowNode && summary.status.isMixed;
  const activeStatus = isStatusMixed ? undefined : (summary.isMultiFlowNode ? summary.status.value : selectedStatus);

  function handleToggle(checked: boolean) {
    setIsOn(checked);
    setLastNodeConfig({ statusOn: checked });
    const el = document.getElementById('status-options');
    if (el) el.classList.toggle('active', checked);
    if (checked) {
      const targetStatus = activeStatus || selectedStatus || 'in_progress';
      applyStatusToNode(targetStatus);
    } else {
      applyStatusToNode('');
    }
    autoResizeWindow();
  }

  function selectStatus(status: string) {
    setIsOn(true);
    setUIState({ selectedStatus: status });
    setLastNodeConfig({ status, statusOn: true });
    const el = document.getElementById('status-options');
    if (el) el.classList.add('active');
    applyStatusToNode(status);
    autoResizeWindow();
  }

  return (
    <div className="section-block">
      <div className="section-header toggle-row">
        <span className="section-title">
          Status
          {summary.isMultiFlowNode && (summary.statusOn.isMixed || isStatusMixed) && (
            <span style={{ fontSize: '11px', color: 'var(--figma-color-text-tertiary, #999)', marginLeft: '6px', fontWeight: 'normal' }}>
              (Mixed)
            </span>
          )}
        </span>
        <label className="switch">
          <input type="checkbox" id="toggle-status" checked={isOn} onChange={e => handleToggle(e.target.checked)} />
          <span className="slider" />
        </label>
      </div>
      <div className="section-body">
        <div className={`chip-group${isOn ? ' active' : ''}`} id="status-options">
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
    </div>
  );
}
