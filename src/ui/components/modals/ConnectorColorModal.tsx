import React, { useState, useRef, useEffect, useCallback } from 'react';

// 피그마 UI3 공식 24×24px 닫기 SVG 아이콘
const CLOSE_SVG = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M16.6464 6.64645C16.8417 6.45118 17.1582 6.45118 17.3535 6.64645C17.5487 6.84171 17.5487 7.15822 17.3535 7.35348L12.707 12L17.3535 16.6464C17.5487 16.8417 17.5487 17.1582 17.3535 17.3535C17.1582 17.5487 16.8417 17.5487 16.6464 17.3535L12 12.707L7.35348 17.3535C7.15822 17.5487 6.84171 17.5487 6.64645 17.3535C6.45118 17.1582 6.45118 16.8417 6.64645 16.6464L11.2929 12L6.64645 7.35348C6.45123 7.15821 6.4512 6.84169 6.64645 6.64645C6.8417 6.45125 7.15823 6.45125 7.35348 6.64645L12 11.2929L16.6464 6.64645Z"
      fill="currentColor"
    />
  </svg>
);



import { ColorWheelField } from '../shared/ColorWheelField';
import { useApp } from '../../context/AppContext';

export interface ConnectorColorModalProps {
  initialColor: string;
  onSave: (colorHex: string) => void;
  onClose: () => void;
}

/**
 * Connector Color 모달 (Figma UI3 Node 1027394:7443 공식 디자인)
 * - 상단: Connector Color 타이틀 및 닫기 버튼
 * - 색상 프리셋 그리드: 5개 + 4개 카드 (White 선택 시 퍼플 링)
 * - 일체형 ColorWheelField: 16진수 입력 필드 + 레인보우 도넛 휠 배지 + 원형 컬러 휠(Hue) + 2D 채도/명도 디스크
 * - Cancel / Save 버튼
 */
export function ConnectorColorModal({
  initialColor,
  onSave,
  onClose,
}: ConnectorColorModalProps) {
  const { stylePresets } = useApp();
  const [colorHex, setColorHex] = useState(() => initialColor.replace('#', '').toUpperCase());
  const [showWheel, setShowWheel] = useState(false);

  // 상단 5개, 하단 나머지 행으로 분할
  const presetsRow1 = stylePresets.slice(0, 5);
  const presetsRow2 = stylePresets.slice(5);

  // 초기값 동기화
  useEffect(() => {
    setColorHex(initialColor.replace('#', '').toUpperCase());
  }, [initialColor]);

  // 1. 프리셋 색상 선택
  function handleSelectPreset(hex: string) {
    setColorHex(hex.replace('#', '').toUpperCase());
  }

  // 2. 저장 핸들러
  function handleSave() {
    const finalHex = `#${colorHex.padStart(6, '0')}`;
    onSave(finalHex);
    onClose();
  }

  const currentFormattedHex = `#${colorHex.padStart(6, '0')}`;

  return (
    <div
      id="modal-connector-color-backdrop"
      className="popover-backdrop"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="modal-connector-color"
        className="conn-color-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. 모달 헤더 (Connector Color + 닫기 버튼) */}
        <div className="conn-color-modal-header">
          <span className="conn-color-modal-title">Connector Color</span>
          <button
            type="button"
            className="style-modal-close-btn"
            onClick={onClose}
            title="Close"
          >
            {CLOSE_SVG}
          </button>
        </div>

        <div className="conn-color-modal-divider" />

        {/* 2. 컬러 프리셋 카드 그리드 (스타일 프리셋과 동일한 스타일로 동기화) */}
        <div className="conn-color-presets-wrapper">
          {/* 상단 1행 (5개) */}
          <div className="conn-color-presets-row">
            {presetsRow1.map((preset) => {
              const isSelected = currentFormattedHex.toUpperCase() === preset.fillColor.toUpperCase();
              const hasBorder = (preset.strokeWeight ?? 0) > 0;
              return (
                <button
                  key={preset.id}
                  type="button"
                  className={`conn-preset-card${isSelected ? ' selected' : ''}`}
                  style={{
                    backgroundColor: preset.fillColor,
                    border: hasBorder ? `${preset.strokeWeight}px solid ${preset.strokeColor}` : 'none',
                    boxSizing: 'border-box',
                    boxShadow: hasBorder && !isSelected ? 'none' : undefined,
                  }}
                  data-color={preset.fillColor.toLowerCase()}
                  onClick={() => handleSelectPreset(preset.fillColor)}
                  title={preset.name || preset.fillColor}
                />
              );
            })}
          </div>

          {/* 하단 2행 (4개) */}
          <div className="conn-color-presets-row">
            {presetsRow2.map((preset) => {
              const isSelected = currentFormattedHex.toUpperCase() === preset.fillColor.toUpperCase();
              const hasBorder = (preset.strokeWeight ?? 0) > 0;
              return (
                <button
                  key={preset.id}
                  type="button"
                  className={`conn-preset-card${isSelected ? ' selected' : ''}`}
                  style={{
                    backgroundColor: preset.fillColor,
                    border: hasBorder ? `${preset.strokeWeight}px solid ${preset.strokeColor}` : 'none',
                    boxSizing: 'border-box',
                    boxShadow: hasBorder && !isSelected ? 'none' : undefined,
                  }}
                  data-color={preset.fillColor.toLowerCase()}
                  onClick={() => handleSelectPreset(preset.fillColor)}
                  title={preset.name || preset.fillColor}
                />
              );
            })}
          </div>
        </div>

        <div className="conn-color-modal-divider" />

        {/* 3. Hex 입력 필드 + 무지개 컬러 휠 도넛 링 아이콘 + 원형 컬러휠 (ColorWheelField) */}
        <ColorWheelField
          value={colorHex}
          onChange={(newHex) => setColorHex(newHex)}
          onEnter={handleSave}
          isOpen={showWheel}
          onToggleOpen={setShowWheel}
        />

        {/* 4. 하단 구분선 (다른 모달과 동일한 보더 라인) */}
        <div className="conn-color-modal-divider" />

        {/* 5. 모달 푸터 버튼 (Cancel / Save) */}
        <div className="conn-color-modal-footer">
          <button
            type="button"
            className="conn-btn-cancel"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="conn-btn-save"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
