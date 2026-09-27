import React, { useState, useRef } from 'react';
import { ColorWheelField } from '../shared/ColorWheelField';
import { StrokeColorIcon } from '../shared/icons';

// 피그마 UI3 공식 24×24px 닫기 SVG 아이콘
const CLOSE_SVG = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M16.6464 6.64645C16.8417 6.45118 17.1582 6.45118 17.3535 6.64645C17.5487 6.84171 17.5487 7.15822 17.3535 7.35348L12.707 12L17.3535 16.6464C17.5487 16.8417 17.5487 17.1582 17.3535 17.3535C17.1582 17.5487 16.8417 17.5487 16.6464 17.3535L12 12.707L7.35348 17.3535C7.15822 17.5487 6.84171 17.5487 6.64645 17.3535C6.45118 17.1582 6.45118 16.8417 6.64645 16.6464L11.2929 12L6.64645 7.35348C6.45123 7.15821 6.4512 6.84169 6.64645 6.64645C6.8417 6.45125 7.15823 6.45125 7.35348 6.64645L12 11.2929L16.6464 6.64645Z"
      fill="currentColor"
    />
  </svg>
);

// 피그마 UI3 공식 스트로크 두께 SVG 아이콘 (Stroke Weight, 24×24)
const STROKE_ICON_SVG = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M17.25 14C17.6642 14 18 14.3358 18 14.75V17.25C18 17.6642 17.6642 18 17.25 18H6.75C6.33579 18 6 17.6642 6 17.25V14.75C6 14.3358 6.33579 14 6.75 14H17.25ZM7 17H17V15H7V17ZM17.25 9C17.6642 9 18 9.33579 18 9.75V11.25C18 11.6642 17.6642 12 17.25 12H6.75C6.33579 12 6 11.6642 6 11.25V9.75C6 9.33579 6.33579 9 6.75 9H17.25ZM7 11H17V10H7V11ZM17.5 6C17.7761 6 18 6.22386 18 6.5C18 6.77614 17.7761 7 17.5 7H6.5C6.22386 7 6 6.77614 6 6.5C6 6.22386 6.22386 6 6.5 6H17.5Z"
      fill="currentColor"
    />
  </svg>
);

export interface StrokeColorModalProps {
  initialColor: string;
  initialWeight: number;
  isColorMixed?: boolean;
  isWeightMixed?: boolean;
  onApply: (strokeColor: string, strokeWeight: number) => void;
  onClose: () => void;
}

/**
 * Stroke 컬러/두께 선택 다이얼로그 (피그마 UI3 공식 규격)
 * - 스타일 모달의 Stroke 섹션을 독립 다이얼로그로 분리
 * - 두께 입력 박스 (STROKE_ICON_SVG + number input)
 * - StrokeColorIcon (None/보더 토글 지원)
 * - ColorWheelField (16진수 입력 + 원형 컬러휠)
 * - Cancel(원래 상태 복원) 및 Save(최종 상태 확정)
 */
export function StrokeColorModal({
  initialColor,
  initialWeight,
  isColorMixed = false,
  isWeightMixed = false,
  onApply,
  onClose,
}: StrokeColorModalProps) {
  const rawInit = initialColor || '#000000';
  const isInitialNone =
    !isColorMixed &&
    (initialWeight === 0 ||
      rawInit.toLowerCase() === 'none' ||
      rawInit.toLowerCase() === 'transparent');

  const resolvedColor = (isInitialNone ? '000000' : rawInit)
    .replace('#', '')
    .trim()
    .toUpperCase();
  const validStroke = resolvedColor.length === 6 ? resolvedColor : '000000';

  const [strokeHex, setStrokeHex] = useState(isColorMixed ? '' : validStroke);
  const [strokeWeight, setStrokeWeight] = useState(isWeightMixed ? 0 : initialWeight);
  const [showWheel, setShowWheel] = useState(true);

  // 직전 유효 상태 기억 (복원용)
  const lastValidColorRef = useRef<string>(validStroke);
  const lastValidWeightRef = useRef<number>(initialWeight > 0 ? initialWeight : 1.5);

  // 색상 변경 핸들러 (실시간 프리뷰 적용)
  const handleColorChange = (hex: string) => {
    setStrokeHex(hex);
    lastValidColorRef.current = hex;
    const targetWeight = strokeWeight === 0 ? (lastValidWeightRef.current || 1.5) : strokeWeight;
    if (strokeWeight === 0) {
      setStrokeWeight(targetWeight);
    }
    onApply(`#${hex}`, targetWeight);
  };

  // 두께 변경 핸들러 (실시간 프리뷰 적용)
  const handleWeightChange = (newWeight: number) => {
    const valid = Math.max(0, newWeight);
    setStrokeWeight(valid);
    if (valid > 0) {
      lastValidWeightRef.current = valid;
    }
    const color = `#${(strokeHex.trim() ? strokeHex : validStroke).padStart(6, '0')}`;
    onApply(color, valid);
  };

  // 보더 토글 핸들러 (None ↔ 유효 두께)
  const handleNoneToggle = (none: boolean) => {
    if (none) {
      setStrokeWeight(0);
      const color = `#${(strokeHex.trim() ? strokeHex : validStroke).padStart(6, '0')}`;
      onApply(color, 0);
    } else {
      const restoreWeight = lastValidWeightRef.current || 1.5;
      setStrokeWeight(restoreWeight);
      const color = `#${(strokeHex.trim() ? strokeHex : validStroke).padStart(6, '0')}`;
      onApply(color, restoreWeight);
    }
  };

  // Stroke 칩 클릭 핸들러 (보더 켜기/끄기 원클릭 토글)
  const handleChipClick = () => {
    handleNoneToggle(strokeWeight > 0);
  };

  // 취소 처리 (원래 상태로 롤백 후 닫기)
  const handleCancel = () => {
    onApply(initialColor, initialWeight);
    onClose();
  };

  // 저장 처리 (최종 상태 확정 후 닫기)
  const handleSave = () => {
    const finalColor = `#${(strokeHex.trim() ? strokeHex : validStroke).padStart(6, '0')}`;
    const finalWeight = Math.max(0, strokeWeight);
    onApply(finalColor, finalWeight);
    onClose();
  };

  return (
    <div
      id="modal-stroke-color-backdrop"
      className="popover-backdrop"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleCancel();
      }}
    >
      <div
        id="modal-stroke-color"
        className="style-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 (Stroke 타이틀 + 닫기 버튼) */}
        <div className="style-modal-header">
          <span className="style-modal-title">
            Stroke
            {(isColorMixed || isWeightMixed) && (
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--figma-color-text-tertiary, #999)',
                  marginLeft: '6px',
                  fontWeight: 'normal',
                }}
              >
                (Mixed)
              </span>
            )}
          </span>
          <button
            type="button"
            className="style-modal-close-btn"
            onClick={handleCancel}
            title="Close"
          >
            {CLOSE_SVG}
          </button>
        </div>

        {/* 모달 바디 (Stroke 라인 두께 박스 + 컬러 입력 필드 + 컬러휠 아이콘) */}
        <div className="style-modal-body" style={{ padding: '12px 16px' }}>
          <div className="style-section-group" style={{ display: 'flex', flexDirection: 'column' }}>
            <ColorWheelField
              value={strokeHex}
              isNone={strokeWeight === 0}
              onNoneToggle={handleNoneToggle}
              onChange={handleColorChange}
              onEnter={handleSave}
              isOpen={showWheel}
              onToggleOpen={setShowWheel}
              customChip={
                <StrokeColorIcon
                  color={`#${strokeHex}`}
                  isNone={strokeWeight === 0}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChipClick();
                  }}
                  title={strokeWeight === 0 ? '보더 켜기' : '보더 끄기 (None)'}
                />
              }
              extraControlPosition="left"
              extraControl={
                <div className="stroke-width-box">
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'rgba(255, 255, 255, 0.6)',
                      flexShrink: 0,
                    }}
                  >
                    {STROKE_ICON_SVG}
                  </span>
                  <input
                    type="number"
                    className="prefix-input"
                    min={0}
                    max={50}
                    value={strokeWeight}
                    onChange={(e) => handleWeightChange(parseInt(e.target.value, 10) || 0)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      letterSpacing: 0,
                    }}
                  />
                </div>
              }
            />
          </div>
        </div>

        {/* 모달 푸터 (Cancel + Save 버튼) */}
        <div className="style-modal-footer">
          <button
            type="button"
            className="btn-phase-modal-cancel"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-phase-modal-save"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
