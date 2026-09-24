import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

const BADGE_CORNERS = [
  { pos: 'TOP_LEFT', title: 'Top-Left', svg: '<path d="M15.98 7.5H9.93C9.71 6.64 8.93 6 8 6C6.9 6 6 6.9 6 8C6 8.92 6.63 9.69 7.48 9.92V16C7.48 16.28 7.7 16.5 7.98 16.5H15.98C16.26 16.5 16.48 16.28 16.48 16V8C16.48 7.72 16.26 7.5 15.98 7.5ZM7 8C7 7.45 7.45 7 8 7C8.55 7 9 7.45 9 8C9 8.55 8.55 9 8 9C7.45 9 7 8.55 7 8ZM15.48 15.5H8.48V9.94C9.19 9.76 9.75 9.21 9.93 8.5H15.48V15.5Z" fill="currentColor"/>' },
  { pos: 'TOP_RIGHT', title: 'Top-Right', svg: '<path d="M18 8C18 6.9 17.1 6 16 6C15.07 6 14.29 6.64 14.07 7.5H8C7.72 7.5 7.5 7.72 7.5 8V16C7.5 16.28 7.72 16.5 8 16.5H16C16.28 16.5 16.5 16.28 16.5 16V9.93C17.36 9.71 18 8.93 18 8ZM8.5 15.5V8.5H14.07C14.25 9.2 14.8 9.75 15.5 9.93V15.5H8.5ZM16 9C15.45 9 15 8.55 15 8C15 7.45 15.45 7 16 7C16.55 7 17 7.45 17 8C17 8.55 16.55 9 16 9Z" fill="currentColor"/>' },
  { pos: 'BOTTOM_LEFT', title: 'Bottom-Left', svg: '<path d="M15.98 7.5H7.98C7.7 7.5 7.48 7.72 7.48 8V14.08C6.63 14.31 6 15.08 6 16C6 17.1 6.9 18 8 18C8.93 18 9.71 17.36 9.93 16.5H15.98C16.26 16.5 16.48 16.28 16.48 16V8C16.48 7.72 16.26 7.5 15.98 7.5ZM8 17C7.45 17 7 16.55 7 16C7 15.45 7.45 15 8 15C8.55 15 9 15.45 9 16C9 16.55 8.55 17 8 17ZM15.48 15.5H9.93C9.75 14.79 9.19 14.24 8.48 14.06V8.5H15.48V15.5Z" fill="currentColor"/>' },
  { pos: 'BOTTOM_RIGHT', title: 'Bottom-Right', svg: '<path d="M16.5 14.07V8C16.5 7.72 16.28 7.5 16 7.5H8C7.72 7.5 7.5 7.72 7.5 8V16C7.5 16.28 7.72 16.5 8 16.5H14.07C14.29 17.36 15.07 18 16 18C17.1 18 18 17.1 18 16C18 15.07 17.36 14.29 16.5 14.07ZM14.07 15.5H8.5V8.5H15.5V14.07C14.8 14.25 14.25 14.8 14.07 15.5ZM16 17C15.45 17 15 16.55 15 16C15 15.45 15.45 15 16 15C16.55 15 17 15.45 17 16C17 16.55 16.55 17 16 17Z" fill="currentColor"/>' },
] as const;

const BADGE_SHAPES = ['Square', 'Circle', 'RoundBox'] as const;

/**
 * Step Badges 섹션 - 토글 + 숫자 입력 + 코너 위치 + 뱃지 모양
 */
export function StepBadgesSection() {
  const {
    uiState,
    setUIState,
    setLastNodeConfig,
    applyStepBadges,
    removeStepBadgesFromNodes,
    selectedNodes,
    autoResizeWindow,
  } = useApp();
  const [isOn, setIsOn] = useState(false);
  const { selectedBadgeCorner = 'TOP_LEFT', selectedBadgeShape = 'Square' } = uiState;
  const isMultiMode = selectedNodes.length > 1;

  // 선택된 노드의 스텝 뱃지 상태 동기화
  useEffect(() => {
    if (selectedNodes && selectedNodes.length > 0) {
      const hasStep = selectedNodes.some(n => n.stepNumber !== undefined);
      setIsOn(hasStep);

      const firstWithStep = selectedNodes.find(n => n.stepNumber !== undefined);
      if (firstWithStep) {
        const numInput = document.getElementById('input-step-number') as HTMLInputElement | null;
        if (numInput && firstWithStep.stepNumber !== undefined) {
          numInput.value = String(firstWithStep.stepNumber);
        }
        if (firstWithStep.badgeCorner) {
          setUIState({ selectedBadgeCorner: firstWithStep.badgeCorner });
        }
        if (firstWithStep.badgeShape) {
          setUIState({ selectedBadgeShape: firstWithStep.badgeShape });
        }
      }
    } else {
      setIsOn(false);
    }
  }, [selectedNodes, setUIState]);

  function getStepNumberValue(): number {
    const numInput = document.getElementById('input-step-number') as HTMLInputElement | null;
    return parseInt(numInput?.value || '1', 10) || 1;
  }

  function handleToggle(checked: boolean) {
    setIsOn(checked);
    setLastNodeConfig({ stepBadgesOn: checked });
    const el = document.getElementById('step-badges-options');
    if (el) el.classList.toggle('active', checked);

    if (checked) {
      applyStepBadges(getStepNumberValue(), selectedBadgeCorner, selectedBadgeShape);
    } else {
      removeStepBadgesFromNodes();
    }
    autoResizeWindow();
  }

  function selectBadgeCorner(pos: string) {
    setUIState({ selectedBadgeCorner: pos });
    setLastNodeConfig({ badgeCorner: pos });
    if (isOn) {
      applyStepBadges(getStepNumberValue(), pos, selectedBadgeShape);
    }
  }

  function selectBadgeShape(shape: string) {
    setUIState({ selectedBadgeShape: shape });
    setLastNodeConfig({ badgeShape: shape });
    if (isOn) {
      applyStepBadges(getStepNumberValue(), selectedBadgeCorner, shape);
    }
  }

  function handleNumberChange(val: number) {
    setLastNodeConfig({ stepNumber: val });
    if (isOn) {
      applyStepBadges(val, selectedBadgeCorner, selectedBadgeShape);
    }
  }

  return (
    <div className="section-block">
      <div className="section-header toggle-row">
        <span className="section-title">Step Badges</span>
        <label className="switch">
          <input type="checkbox" id="toggle-step-badges" checked={isOn} onChange={e => handleToggle(e.target.checked)} />
          <span className="slider" />
        </label>
      </div>
      <div className="section-body">
        <div className={`step-badges-container${isOn ? ' active' : ''}`} id="step-badges-options">
          <div className="step-badges-row">
            <div className="input-scrubber-box" id="step-number-box" style={{ width: '80px' }}>
              <svg
                id="step-number-icon"
                data-tooltip={isMultiMode ? 'Start Number' : 'Number'}
                width="24" height="24" viewBox="0 0 24 24" fill="none"
              >
                <path d="M16 18C17.1046 18 18 17.1046 18 16V8C18 6.89543 17.1046 6 16 6H8C6.89543 6 6 6.89543 6 8V16C6 17.1046 6.89543 18 8 18H16ZM8 17C7.44772 17 7 16.5523 7 16V8C7 7.44772 7.44772 7 8 7H16C16.5523 7 17 7.44772 17 8V16C17 16.5523 16.5523 17 16 17H8ZM10.4502 14.9971C10.7249 15.0245 10.9695 14.8245 10.9971 14.5498L11.0518 14H12.5479L12.5029 14.4502C12.4755 14.7249 12.6755 14.9695 12.9502 14.9971C13.2249 15.0245 13.4695 14.8245 13.4971 14.5498L13.5518 14H14.5C14.7761 14 15 13.7761 15 13.5C15 13.2239 14.7761 13 14.5 13H13.6523L13.8525 11H14.5C14.7761 11 15 10.7761 15 10.5C15 10.2239 14.7761 10 14.5 10H13.9521L13.9971 9.5498C14.0245 9.27507 13.8245 9.03045 13.5498 9.00293C13.2751 8.97546 13.0305 9.17547 13.0029 9.4502L12.9482 10H11.4521L11.4971 9.5498C11.5245 9.27507 11.3245 9.03045 11.0498 9.00293C10.7751 8.97546 10.5305 9.17547 10.5029 9.4502L10.4482 10H9.5C9.22386 10 9 10.2239 9 10.5C9 10.7761 9.22386 11 9.5 11H10.3477L10.1475 13H9.5C9.22386 13 9 13.2239 9 13.5C9 13.7761 9.22386 14 9.5 14H10.0479L10.0029 14.4502C9.97546 14.7249 10.1755 14.9695 10.4502 14.9971ZM11.1523 13L11.3525 11H12.8477L12.6475 13H11.1523Z" fill="currentColor"/>
              </svg>
              <input type="number" id="input-step-number" defaultValue={1} min={1}
                onChange={e => handleNumberChange(parseInt(e.target.value, 10) || 1)}
                onBlur={e => handleNumberChange(parseInt(e.target.value, 10) || 1)} />
            </div>
            <div className="corner-position-group">
              {BADGE_CORNERS.map(c => (
                <button
                  key={c.pos}
                  className={`corner-btn${selectedBadgeCorner === c.pos ? ' active' : ''}`}
                  title={c.title}
                  onClick={() => selectBadgeCorner(c.pos)}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" dangerouslySetInnerHTML={{ __html: c.svg }} />
                </button>
              ))}
            </div>
          </div>
          <div className="chip-group" style={{ marginTop: '4px' }}>
            {BADGE_SHAPES.map(shape => (
              <button
                key={shape}
                className={`chip-btn${selectedBadgeShape === shape ? ' active' : ''}`}
                onClick={() => selectBadgeShape(shape)}
              >
                {shape === 'RoundBox' ? 'Round Box' : shape}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
