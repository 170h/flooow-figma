import React from 'react';
import { useApp } from '../../context/AppContext';

/**
 * Elevation 섹션 - 토글 스위치 + 5단계 엘리베이션 카드 (토글형)
 * Figma 노드에 실시간으로 그림자(Drop Shadow) 효과를 적용 및 동기화합니다.
 */
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
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={`elevation-card elev-${level}${selectedElevation === level ? ' selected' : ''}`}
              title={level === 0 ? 'None (Level 0)' : `Level ${level}`}
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
