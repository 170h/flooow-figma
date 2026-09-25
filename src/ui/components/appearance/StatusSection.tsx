import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

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
  const [isOn, setIsOn] = useState(false);
  const { selectedStatus } = uiState;

  // 선택된 노드의 상태와 UI 동기화
  React.useEffect(() => {
    if (selectedNodes && selectedNodes.length === 1) {
      const node = selectedNodes[0];
      if (node.status) {
        setIsOn(true);
        setUIState({ selectedStatus: node.status });
      } else {
        setIsOn(false);
      }
    }
  }, [selectedNodes, setUIState]);

  function handleToggle(checked: boolean) {
    setIsOn(checked);
    setLastNodeConfig({ statusOn: checked });
    const el = document.getElementById('status-options');
    if (el) el.classList.toggle('active', checked);
    if (checked) {
      const targetStatus = selectedStatus || 'in_progress';
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
        <span className="section-title">Status</span>
        <label className="switch">
          <input type="checkbox" id="toggle-status" checked={isOn} onChange={e => handleToggle(e.target.checked)} />
          <span className="slider" />
        </label>
      </div>
      <div className="section-body">
        <div className={`chip-group${isOn ? ' active' : ''}`} id="status-options">
          {STATUSES.map(s => (
            <button
              key={s.id}
              type="button"
              className={`chip-btn${selectedStatus === s.id ? ' active' : ''}`}
              data-status={s.id}
              data-bullet-color={s.color}
              onClick={() => selectStatus(s.id)}
            >
              <span className="tab-bullet" style={{ backgroundColor: s.color }} />
              <span className="tab-label">{s.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
