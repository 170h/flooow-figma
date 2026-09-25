import React from 'react';
import { useApp } from '../../context/AppContext';
import { useSelectionSummary } from '../../hooks/useSelectionSummary';

const NODE_TYPES = [
  'Screen', 'Action', 'Decision', 'System',
  'Database', 'Terminator', 'True', 'False', 'Error',
] as const;

/**
 * Type 섹션 - 9종 노드 타입 칩 그룹
 */
export function TypeSection() {
  const { uiState, setUIState, applyCurrentNodeState, setLastNodeConfig } = useApp();
  const summary = useSelectionSummary();
  const { selectedNodeType } = uiState;

  const isTypeMixed = summary.isMultiFlowNode && summary.nodeType.isMixed;
  const activeType = isTypeMixed ? undefined : (summary.isMultiFlowNode ? summary.nodeType.value : selectedNodeType);

  function selectNodeType(type: string) {
    setUIState({ selectedNodeType: type });
    setLastNodeConfig({ nodeType: type });
    // DOM 기반 applyCurrentNodeState가 최신 selectedNodeType을 읽도록 약간 딜레이
    setTimeout(() => applyCurrentNodeState(), 0);
  }

  return (
    <div className="section-block">
      <div className="section-header">
        <span className="section-title">
          Type
          {isTypeMixed && (
            <span style={{ fontSize: '11px', color: 'var(--figma-color-text-tertiary, #999)', marginLeft: '6px', fontWeight: 'normal' }}>
              (Mixed)
            </span>
          )}
        </span>
      </div>
      <div className="section-body">
        <div className="chip-group" id="node-type-chips">
          {NODE_TYPES.map(type => {
            const isActive = !isTypeMixed && activeType === type;
            return (
              <button
                key={type}
                className={`chip-btn${isActive ? ' active' : ''}`}
                data-type={type}
                onClick={() => selectNodeType(type)}
              >
                {type}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
