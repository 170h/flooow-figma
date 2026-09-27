import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useSelectionSummary } from '../../hooks/useSelectionSummary';
import { Switch } from '../shared/Switch';

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
    removeStepBadgesFromNodes,
    applyElevationToNodes,
    activeAppearanceSection,
    setActiveAppearanceSection,
    selectedNodes,
    autoResizeWindow
  } = useApp();
  const summary = useSelectionSummary();
  const isSectionOpen = activeAppearanceSection === 'status';
  const { selectedStatus } = uiState;

  // 선택된 노드의 상태와 UI 동기화
  React.useEffect(() => {
    if (summary.isSingleFlowNode) {
      const node = selectedNodes[0];
      if (node && node.status) {
        setUIState({ selectedStatus: node.status });
      }
    } else if (summary.isMultiFlowNode) {
      if (!summary.status.isMixed && summary.status.value) {
        setUIState({ selectedStatus: summary.status.value });
      }
    }
  }, [summary.isSingleFlowNode, summary.isMultiFlowNode, summary.status.isMixed, summary.status.value, selectedNodes, setUIState]);

  const isStatusMixed = summary.isMultiFlowNode && summary.status.isMixed;
  const activeStatus = isStatusMixed ? undefined : (summary.isMultiFlowNode ? summary.status.value : selectedStatus);

  function handleToggle(checked: boolean) {
    if (checked) {
      setActiveAppearanceSection('status');
      setLastNodeConfig({ statusOn: true, stepBadgesOn: false, elevationOn: false });
      removeStepBadgesFromNodes();
      applyElevationToNodes(null);
      const targetStatus = activeStatus || selectedStatus || 'in_progress';
      applyStatusToNode(targetStatus);
    } else {
      setActiveAppearanceSection(null);
      setLastNodeConfig({ statusOn: false });
      applyStatusToNode('');
    }
    requestAnimationFrame(() => {
      autoResizeWindow();
    });
  }

  function selectStatus(status: string) {
    setActiveAppearanceSection('status');
    setUIState({ selectedStatus: status });
    setLastNodeConfig({ status, statusOn: true, stepBadgesOn: false, elevationOn: false });
    removeStepBadgesFromNodes();
    applyElevationToNodes(null);
    applyStatusToNode(status);
    requestAnimationFrame(() => {
      autoResizeWindow();
    });
  }

  return (
    <div className="section-block" style={{ paddingBottom: isSectionOpen ? '12px' : '0px' }}>
      <div className="section-header toggle-row">
        <span className="section-title">
          Status
          {summary.isMultiFlowNode && (summary.statusOn.isMixed || isStatusMixed) && (
            <span style={{ fontSize: '11px', color: 'var(--figma-color-text-tertiary, #999)', marginLeft: '6px', fontWeight: 'normal' }}>
              (Mixed)
            </span>
          )}
        </span>
        <Switch
          id="toggle-status"
          checked={isSectionOpen}
          isMixed={summary.isMultiFlowNode && summary.statusOn.isMixed}
          onChange={handleToggle}
        />
      </div>
      {isSectionOpen && (
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
