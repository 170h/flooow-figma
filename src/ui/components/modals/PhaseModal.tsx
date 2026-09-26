import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ColorWheelField } from '../shared/ColorWheelField';

// 피그마 UI3 공식 24×24px 닫기 SVG 아이콘
const CLOSE_SVG = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M16.6464 6.64645C16.8417 6.45118 17.1582 6.45118 17.3535 6.64645C17.5487 6.84171 17.5487 7.15822 17.3535 7.35348L12.707 12L17.3535 16.6464C17.5487 16.8417 17.5487 17.1582 17.3535 17.3535C17.1582 17.5487 16.8417 17.5487 16.6464 17.3535L12 12.707L7.35348 17.3535C7.15822 17.5487 6.84171 17.5487 6.64645 17.3535C6.45118 17.1582 6.45118 16.8417 6.64645 16.6464L11.2929 12L6.64645 7.35348C6.45123 7.15821 6.4512 6.84169 6.64645 6.64645C6.8417 6.45125 7.15823 6.45125 7.35348 6.64645L12 11.2929L16.6464 6.64645Z"
      fill="currentColor"
    />
  </svg>
);

export interface PhaseData {
  id: string;
  name: string;
  color: string;
}

interface PhaseModalProps {
  editingPhase?: PhaseData | null;
  onSave: (phase: PhaseData) => void;
  onClose: () => void;
}

/**
 * 피그마 UI3 공식 Add/Edit Phase 모달 (피그마 노드 1027248:4797)
 * - Name 필드
 * - Background Color: ColorWheelField (Hex 입력 필드 + 무지개 도넛 컬러 휠 + 원형 컬러휠)
 */
export function PhaseModal({ editingPhase, onSave, onClose }: PhaseModalProps) {
  const { activeModal } = useApp();
  const isOpen = activeModal === 'phase';

  const [name, setName] = useState(editingPhase?.name || '');

  // 컬러 상태
  const initialColor = (editingPhase?.color || '#EA2039').replace('#', '').trim().toUpperCase();
  const validHex = initialColor.length === 6 ? initialColor : 'EA2039';

  const [colorHex, setColorHex] = useState(validHex);
  const [pickerOpen, setPickerOpen] = useState(false);

  // 모달 열림 또는 편집 대상 변경 시 폼 필드 동기화
  useEffect(() => {
    if (isOpen) {
      setName(editingPhase?.name || '');
      const rawColor = (editingPhase?.color || '#EA2039').replace('#', '').trim().toUpperCase();
      setColorHex(rawColor.length === 6 ? rawColor : 'EA2039');
      setPickerOpen(false);
    }
  }, [editingPhase, isOpen]);

  // 저장 처리
  function handleSave() {
    if (!name.trim()) return;
    const finalColor = `#${colorHex.padStart(6, '0')}`;
    onSave({
      id: editingPhase?.id || `phase-${Date.now()}`,
      name: name.trim(),
      color: finalColor,
    });
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div
      id="modal-backdrop"
      className="popover-backdrop"
      style={{ display: 'flex' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="modal-phase"
        className="style-modal-card"
        style={{ display: 'flex' }}
      >
        {/* 모달 헤더 (피그마 노드 1027248:4797) */}
        <div className="style-modal-header">
          <span className="style-modal-title">
            {editingPhase ? 'Edit Phase' : 'Add Phase'}
          </span>
          <button
            type="button"
            className="style-modal-close-btn"
            onClick={onClose}
            title="Close"
          >
            {CLOSE_SVG}
          </button>
        </div>

        {/* 모달 바디 */}
        <div className="style-modal-body" style={{ padding: '12px 16px' }}>
          {/* 1. Name 필드 */}
          <div className="style-section-group" style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              className="style-section-header"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: 24,
                marginBottom: 6,
              }}
            >
              <span className="style-section-label" style={{ fontSize: 11, fontWeight: 550, color: '#FFFFFF', letterSpacing: 0 }}>
                Name
              </span>
            </div>
            <input
              type="text"
              id="input-phase-modal-name"
              className="phase-text-input"
              placeholder="Phase Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
              style={{
                height: 28,
                letterSpacing: 0,
              }}
            />
          </div>

          {/* 중간 구분선 (1px Divider) */}
          <div className="style-divider" style={{ margin: '12px 0' }} />

          {/* 2. Background Color 필드 */}
          <div className="style-section-group" style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Background Color 헤더 행 */}
            <div
              className="style-section-header"
              style={{
                display: 'flex',
                alignItems: 'center',
                height: 24,
                marginBottom: 6,
              }}
            >
              <span className="style-section-label" style={{ fontSize: 11, fontWeight: 550, color: '#FFFFFF', letterSpacing: 0 }}>
                Background Color
              </span>
            </div>

            {/* Background Color 입력 박스 + 원형 컬러휠 */}
            <ColorWheelField
              value={colorHex}
              onChange={(hex) => setColorHex(hex)}
              onEnter={handleSave}
              isOpen={pickerOpen}
              onToggleOpen={setPickerOpen}
            />
          </div>
        </div>

        {/* 모달 푸터 (피그마 노드 1027248:4797) */}
        <div className="style-modal-footer">
          <button
            type="button"
            className="btn-phase-modal-cancel"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            id="btn-save-phase"
            className="btn-phase-modal-save"
            onClick={handleSave}
            disabled={!name.trim()}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
