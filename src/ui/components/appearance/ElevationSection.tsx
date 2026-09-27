import React from 'react';
import { useApp } from '../../context/AppContext';
import { useSelectionSummary } from '../../hooks/useSelectionSummary';
import { Switch } from '../shared/Switch';

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
  const {
    uiState,
    setLastNodeConfig,
    applyElevationToNodes,
    removeStepBadgesFromNodes,
    applyStatusToNode,
    activeAppearanceSection,
    setActiveAppearanceSection,
    autoResizeWindow
  } = useApp();
  const summary = useSelectionSummary();

  const isSectionOpen = activeAppearanceSection === 'elevation';

  // 선택된 레벨 (Mixed 상태인 경우 선택 하이라이트 해제)
  const isElevationMixed = summary.isMultiFlowNode && summary.elevation.isMixed;
  const currentLevel = summary.isMultiFlowNode
    ? summary.elevation.value
    : (typeof uiState.selectedElevation === 'number' ? uiState.selectedElevation : 0);

  function handleToggle(checked: boolean) {
    if (checked) {
      setActiveAppearanceSection('elevation');
      setLastNodeConfig({ elevationOn: true, stepBadgesOn: false, statusOn: false });
      removeStepBadgesFromNodes();
      applyStatusToNode('');
      const targetLevel = typeof currentLevel === 'number' ? currentLevel : 0;
      applyElevationToNodes(targetLevel);
    } else {
      setActiveAppearanceSection(null);
      setLastNodeConfig({ elevationOn: false });
      applyElevationToNodes(null);
    }
    requestAnimationFrame(() => {
      autoResizeWindow();
    });
  }

  function selectElevation(level: number) {
    setActiveAppearanceSection('elevation');
    setLastNodeConfig({ elevationOn: true, elevation: level, stepBadgesOn: false, statusOn: false });
    removeStepBadgesFromNodes();
    applyStatusToNode('');
    applyElevationToNodes(level);
    requestAnimationFrame(() => {
      autoResizeWindow();
    });
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
        <Switch
          id="toggle-elevation"
          checked={isSectionOpen}
          isMixed={isElevationMixed}
          onChange={handleToggle}
        />
      </div>
      <div className="section-body">
        <div className={`elevation-cards-container${isSectionOpen ? ' active' : ''}`} id="elevation-options">
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
