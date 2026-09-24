import React, { useState, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';

// 피그마 UI3 공식 24×24px 닫기 SVG 아이콘
const CLOSE_SVG = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M16.6464 6.64645C16.8417 6.45118 17.1582 6.45118 17.3535 6.64645C17.5487 6.84171 17.5487 7.15822 17.3535 7.35348L12.707 12L17.3535 16.6464C17.5487 16.8417 17.5487 17.1582 17.3535 17.3535C17.1582 17.5487 16.8417 17.5487 16.6464 17.3535L12 12.707L7.35348 17.3535C7.15822 17.5487 6.84171 17.5487 6.64645 17.3535C6.45118 17.1582 6.45118 16.8417 6.64645 16.6464L11.2929 12L6.64645 7.35348C6.45123 7.15821 6.4512 6.84169 6.64645 6.64645C6.8417 6.45125 7.15823 6.45125 7.35348 6.64645L12 11.2929L16.6464 6.64645Z"
      fill="currentColor"
    />
  </svg>
);

// 피그마 UI3 팔레트 아이콘 (🎨)
const PALETTE_SVG = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M8 1.5C4.41 1.5 1.5 4.41 1.5 8C1.5 11.59 4.41 14.5 8 14.5C8.69 14.5 9.25 13.94 9.25 13.25C9.25 12.93 9.12 12.64 8.91 12.43C8.7 12.22 8.57 11.93 8.57 11.61C8.57 10.92 9.13 10.36 9.82 10.36H11.25C13.04 10.36 14.5 8.9 14.5 7.11C14.5 4.02 11.59 1.5 8 1.5ZM4.25 8C3.7 8 3.25 7.55 3.25 7C3.25 6.45 3.7 6 4.25 6C4.8 6 5.25 6.45 5.25 7C5.25 7.55 4.8 8 4.25 8ZM6.25 5C5.7 5 5.25 4.55 5.25 4C5.25 3.45 5.7 3 6.25 3C6.8 3 7.25 3.45 7.25 4C7.25 4.55 6.8 5 6.25 5ZM9.75 5C9.2 5 8.75 4.55 8.75 4C8.75 3.45 9.2 3 9.75 3C10.3 3 10.75 3.45 10.75 4C10.75 4.55 10.3 5 9.75 5ZM11.75 8C11.2 8 10.75 7.55 10.75 7C10.75 6.45 11.2 6 11.75 6C12.3 6 12.75 6.45 12.75 7C12.75 7.55 12.3 8 11.75 8Z"
      fill="currentColor"
    />
  </svg>
);

// ---- 색상 변환 유틸리티 (Hex <-> HSV) ----

function hexToHsv(hex: string): { h: number; s: number; v: number } {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const r = (parseInt(clean.substring(0, 2), 16) || 0) / 255;
  const g = (parseInt(clean.substring(2, 4), 16) || 0) / 255;
  const b = (parseInt(clean.substring(4, 6), 16) || 0) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100),
  };
}

function hsvToHex(h: number, s: number, v: number): string {
  const sNorm = Math.max(0, Math.min(100, s)) / 100;
  const vNorm = Math.max(0, Math.min(100, v)) / 100;
  const c = vNorm * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = vNorm - c;

  let r = 0, g = 0, b = 0;
  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h <= 360) {
    r = c; g = 0; b = x;
  }

  const rHex = Math.round((r + m) * 255).toString(16).padStart(2, '0');
  const gHex = Math.round((g + m) * 255).toString(16).padStart(2, '0');
  const bHex = Math.round((b + m) * 255).toString(16).padStart(2, '0');

  return `${rHex}${gHex}${bHex}`.toUpperCase();
}

function getHueSliderPercent(h: number): number {
  if (h >= 350 || h <= 5) return 0;
  return (h / 360) * 100;
}

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
 */
export function PhaseModal({ editingPhase, onSave, onClose }: PhaseModalProps) {
  const { activeModal } = useApp();
  const isOpen = activeModal === 'phase';

  const [name, setName] = useState(editingPhase?.name || '');

  // 컬러 상태
  const initialColor = (editingPhase?.color || '#EA2039').replace('#', '').trim().toUpperCase();
  const validHex = initialColor.length === 6 ? initialColor : 'EA2039';

  const [colorHex, setColorHex] = useState(validHex);
  const [colorHsv, setColorHsv] = useState(() => hexToHsv(validHex));
  const [pickerOpen, setPickerOpen] = useState(false);

  // DOM 드래그 참조
  const hueBarRef = useRef<HTMLDivElement>(null);
  const satValRef = useRef<HTMLDivElement>(null);

  // 1. 헥스 수동 입력 핸들러
  function handleHexChange(value: string) {
    const clean = value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6).toUpperCase();
    setColorHex(clean);
    if (clean.length === 6) {
      setColorHsv(hexToHsv(clean));
    }
  }

  // 2. Hue 슬라이더 드래그 핸들러
  const handleHueDrag = useCallback(
    (e: MouseEvent | React.MouseEvent) => {
      if (!hueBarRef.current) return;
      const rect = hueBarRef.current.getBoundingClientRect();
      const clientX = 'clientX' in e ? e.clientX : (e as MouseEvent).clientX;
      const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const h = Math.round(percent * 360);

      const nextHsv = { ...colorHsv, h };
      setColorHsv(nextHsv);
      setColorHex(hsvToHex(nextHsv.h, nextHsv.s, nextHsv.v));
    },
    [colorHsv]
  );

  const startHueDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    handleHueDrag(e);

    const onMove = (ev: MouseEvent) => handleHueDrag(ev);
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // 3. Saturation / Value 2D 캔버스 드래그 핸들러
  const handleSatValDrag = useCallback(
    (e: MouseEvent | React.MouseEvent) => {
      if (!satValRef.current) return;
      const rect = satValRef.current.getBoundingClientRect();
      const clientX = 'clientX' in e ? e.clientX : (e as MouseEvent).clientX;
      const clientY = 'clientY' in e ? e.clientY : (e as MouseEvent).clientY;

      const s = Math.round(Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * 100);
      const v = Math.round(Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height)) * 100);

      const nextHsv = { ...colorHsv, s, v };
      setColorHsv(nextHsv);
      setColorHex(hsvToHex(nextHsv.h, nextHsv.s, nextHsv.v));
    },
    [colorHsv]
  );

  const startSatValDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    handleSatValDrag(e);

    const onMove = (ev: MouseEvent) => handleSatValDrag(ev);
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // 4. 저장 처리
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
                justifyContent: 'space-between',
                height: 24,
                marginBottom: 6,
              }}
            >
              <span className="style-section-label" style={{ fontSize: 11, fontWeight: 550, color: '#FFFFFF', letterSpacing: 0 }}>
                Background Color
              </span>
              <button
                type="button"
                className={`style-palette-btn${pickerOpen ? ' active' : ''}`}
                onClick={() => setPickerOpen(!pickerOpen)}
                title="Toggle color picker"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: pickerOpen ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)',
                  cursor: 'pointer',
                  padding: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 4,
                  transition: 'color 0.15s ease, background 0.15s ease',
                }}
              >
                {PALETTE_SVG}
              </button>
            </div>

            {/* Background Color 입력 박스 */}
            <div
              className={`style-color-box${pickerOpen ? ' active' : ''}`}
              onClick={() => setPickerOpen(true)}
            >
              <div
                className="style-color-chip"
                style={{ background: `#${colorHex.padStart(6, '0')}` }}
                onClick={(e) => {
                  e.stopPropagation();
                  setPickerOpen(!pickerOpen);
                }}
              />
              <input
                type="text"
                className="style-color-hex-text"
                value={colorHex}
                maxLength={6}
                onFocus={(e) => {
                  setPickerOpen(true);
                  e.currentTarget.select();
                }}
                onChange={(e) => handleHexChange(e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            {/* 인라인 컬러 피커 (채도/밝기 위 + 색상선택 게이지 아래) */}
            {pickerOpen && (
              <div style={{ marginTop: 10, animation: 'modalFadeIn 0.12s ease-out' }}>
                {/* 1) Saturation / Value 2D 피커 캔버스 (위) */}
                <div
                  ref={satValRef}
                  className="style-sat-val-picker"
                  onMouseDown={startSatValDrag}
                  style={{
                    backgroundColor: `hsl(${colorHsv.h}, 100%, 50%)`,
                    marginBottom: 12,
                  }}
                >
                  <div
                    className="style-sat-val-thumb"
                    style={{
                      left: `${colorHsv.s}%`,
                      top: `${100 - colorHsv.v}%`,
                    }}
                  />
                </div>

                {/* 2) Hue 슬라이더 (색상선택 게이지, 아래, 높이 10px, 서클 안쪽은 순수 색상) */}
                <div
                  ref={hueBarRef}
                  className="style-hue-slider"
                  style={{ margin: 0 }}
                  onMouseDown={startHueDrag}
                >
                  <div
                    className="style-hue-thumb"
                    style={{
                      left: `${getHueSliderPercent(colorHsv.h)}%`,
                      background: `hsl(${colorHsv.h}, 100%, 50%)`,
                    }}
                  />
                </div>
              </div>
            )}
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
