import React from 'react';
import { useApp } from '../../context/AppContext';

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
  const isOn = Boolean(lastNodeConfig.elevationOn);
  const selectedElevation = typeof uiState.selectedElevation === 'number' ? uiState.selectedElevation : 0;

  function handleToggle(checked: boolean) {
    applyElevationToNodes(checked ? selectedElevation : null);
    autoResizeWindow();
  }

  function selectElevation(level: number) {
    applyElevationToNodes(level);
  }

  return (
    <div className="section-block">
      <div className="section-header toggle-row">
        <span className="section-title">Elevation</span>
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
          {ELEVATION_LEVELS.map(({ level, label, desc }) => (
            <div
              key={level}
              className={`elevation-card elev-${level}${selectedElevation === level ? ' selected' : ''}`}
              title={`${label} (${desc})`}
              aria-label={`${label} (${desc})`}
              onClick={() => selectElevation(level)}
            >
              <div className="elevation-inner-box" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
