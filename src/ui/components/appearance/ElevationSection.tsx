import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

/**
 * Elevation 섹션 - 토글 스위치 + 5단계 엘리베이션 카드 (토글형)
 */
export function ElevationSection() {
  const { uiState, setUIState, setLastNodeConfig, applyCurrentNodeState, autoResizeWindow } = useApp();
  const [isOn, setIsOn] = useState(false);
  const { selectedElevation } = uiState;

  function handleToggle(checked: boolean) {
    setIsOn(checked);
    setLastNodeConfig({ elevationOn: checked });
    const el = document.getElementById('elevation-options');
    if (el) el.classList.toggle('active', checked);
    applyCurrentNodeState();
    autoResizeWindow();
  }

  function selectElevation(level: number) {
    setUIState({ selectedElevation: level });
    setLastNodeConfig({ elevation: level });
    document.querySelectorAll('.elevation-card').forEach(c => c.classList.remove('selected'));
    document.querySelector(`.elev-${level}`)?.classList.add('selected');
    applyCurrentNodeState();
  }

  return (
    <div className="section-block">
      <div className="section-header toggle-row">
        <span className="section-title">Elevation</span>
        <label className="switch">
          <input type="checkbox" id="toggle-elevation" checked={isOn} onChange={e => handleToggle(e.target.checked)} />
          <span className="slider" />
        </label>
      </div>
      <div className="section-body">
        <div className={`elevation-cards-container${isOn ? ' active' : ''}`} id="elevation-options">
          {[0, 1, 2, 3, 4].map(level => (
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
