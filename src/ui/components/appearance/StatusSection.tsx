import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

const STATUSES = [
  { id: 'draft', label: 'Draft', color: '#9CA3AF' },
  { id: 'wireframe', label: 'Wireframe', color: '#6B7280' },
  { id: 'in_progress', label: 'In Progress', color: '#3B82F6' },
  { id: 'in_review', label: 'In Review', color: '#CA8A04' },
  { id: 'revision', label: 'Revision', color: '#EA580C' },
  { id: 'approved', label: 'Approved', color: '#8B5CF6' },
  { id: 'ready_for_dev', label: 'Ready for Dev', color: '#16A34A' },
  { id: 'done', label: 'Done', color: '#374151' },
] as const;

/**
 * Status 섹션 - 토글 스위치 + 8종 상태 칩 (토글형)
 */
export function StatusSection() {
  const { uiState, setUIState, setLastNodeConfig, applyCurrentNodeState, autoResizeWindow } = useApp();
  const [isOn, setIsOn] = useState(false);
  const { selectedStatus } = uiState;

  function handleToggle(checked: boolean) {
    setIsOn(checked);
    setLastNodeConfig({ statusOn: checked });
    const el = document.getElementById('status-options');
    if (el) el.classList.toggle('active', checked);
    applyCurrentNodeState();
    autoResizeWindow();
  }

  function selectStatus(status: string) {
    setUIState({ selectedStatus: status });
    setLastNodeConfig({ status });
    if (!isOn) {
      setIsOn(true);
      setLastNodeConfig({ statusOn: true });
      const el = document.getElementById('status-options');
      if (el) el.classList.add('active');
      autoResizeWindow();
    }
    applyCurrentNodeState();
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
