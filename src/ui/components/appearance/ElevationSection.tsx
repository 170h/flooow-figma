import React from 'react';
import { useApp } from '../../context/AppContext';
import { useSelectionSummary } from '../../hooks/useSelectionSummary';

/**
 * Elevation 섹션 - 토글 스위치 + 5단계 엘리베이션 카드 (토글형)
 * Figma 노드에 실시간으로 그림자(Drop Shadow) 효과를 적용 및 동기화합니다.
 */
const ELEVATION_LEVELS = [
  { level: 0, label: 'E100', desc: 'Shapes' },
  { level: 1, label: 'E200', desc: 'Stickies, Comments' },
  { level: 2, label: 'E300', desc: 'Tooltips' },
  { level: 3, label: 'E400', desc: 'Menus, Panels' },
  { level: 4, label: 'E500', desc: 'Modals, Dialogs' },
];

export function ElevationSection() {
  const { uiState, lastNodeConfig, applyElevationToNodes, autoResizeWindow } = useApp();
  const summary = useSelectionSummary();

  // 단일 노드 또는 복수 노드에 따른 켜짐 상태 계산
  const isOn = summary.isMultiFlowNode
    ? (summary.elevationOn.isMixed ? true : Boolean(summary.elevationOn.value))
    : Boolean(lastNodeConfig.elevationOn);

  // 선택된 레벨 (Mixed 상태인 경우 선택 하이라이트 해제)
  const isElevationMixed = summary.isMultiFlowNode && summary.elevation.isMixed;
  const currentLevel = summary.isMultiFlowNode
    ? summary.elevation.value
    : (typeof uiState.selectedElevation === 'number' ? uiState.selectedElevation : 0);

  function handleToggle(checked: boolean) {
    const targetLevel = typeof currentLevel === 'number' ? currentLevel : 0;
    applyElevationToNodes(checked ? targetLevel : null);
    autoResizeWindow();
  }

  function selectElevation(level: number) {
    applyElevationToNodes(level);
  }

  return (
    <div className="section-block">
      <div className="section-header toggle-row">
        <span className="section-title">
          Elevation
          {summary.isMultiFlowNode && (summary.elevationOn.isMixed || isElevationMixed) && (
            <span style={{ fontSize: '11px', color: 'var(--figma-color-text-tertiary, #999)', marginLeft: '6px', fontWeight: 'normal' }}>
              (Mixed)
            </span>
          )}
        </span>
        <label className="switch">
          <input
            type="checkbox"
            id="toggle-elevation"
            checked={isOn}
            onChange={(e) => handleToggle(e.target.checked)}
          />
          <span className="slider" />
        </label>
      </div>
      <div className="section-body">
        <div className={`elevation-cards-container${isOn ? ' active' : ''}`} id="elevation-options">
          {ELEVATION_LEVELS.map(({ level, label, desc }) => {
            const isSelected = !isElevationMixed && currentLevel === level;
            return (
              <div
                key={level}
                className={`elevation-card elev-${level}${isSelected ? ' selected' : ''}`}
                title={`${label} (${desc})`}
                aria-label={`${label} (${desc})`}
                onClick={() => selectElevation(level)}
              >
                <div className="elevation-inner-box" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
