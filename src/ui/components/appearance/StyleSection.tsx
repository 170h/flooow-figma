import React from 'react';
import { useApp } from '../../context/AppContext';

const SWATCHES = [
  '#ffffff', '#000000', '#EA2039', '#EB4C46',
  '#E03E3E', '#E05638', '#DF6246', '#EB5757', '#8638E5',
];

/**
 * Style 섹션 - 컬러 스와치 그리드 (9칸)
 */
export function StyleSection() {
  const { uiState, setUIState, setLastNodeConfig, applyCurrentNodeState, setActiveModal } = useApp();
  const { selectedColor } = uiState;

  function selectSwatch(color: string) {
    setUIState({ selectedColor: color });
    setLastNodeConfig({ color });
    setTimeout(() => applyCurrentNodeState(), 0);
  }

  return (
    <div className="section-block">
      <div className="section-header">
        <span className="section-title">Style</span>
        <div className="section-actions">
          <button className="btn-action-icon" title="Add style" onClick={() => setActiveModal('add-style')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 6C12.2761 6 12.5 6.22386 12.5 6.5V11.5H17.5C17.7761 11.5 18 11.7239 18 12C18 12.2761 17.7761 12.5 17.5 12.5H12.5V17.5C12.5 17.7761 12.2761 18 12 18C11.7239 18 11.5 17.7761 11.5 17.5V12.5H6.5C6.22386 12.5 6 12.2761 6 12C6 11.7239 6.22386 11.5 6.5 11.5H11.5V6.5C11.5 6.22386 11.7239 6 12 6Z" fill="currentColor"/></svg>
          </button>
        </div>
      </div>
      <div className="section-body">
        <div className="swatches-grid" id="style-swatches">
          {SWATCHES.map(color => (
            <div
              key={color}
              className={`swatch-item${selectedColor === color ? ' selected' : ''}`}
              style={{ background: color }}
              data-color={color}
              onClick={() => selectSwatch(color)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
