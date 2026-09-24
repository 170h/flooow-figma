import React, { useState, useRef, useEffect, useCallback } from 'react';
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

// 피그마 UI3 스트로크 선 가로 3개 아이콘 (Stroke Weight)
const STROKE_ICON_SVG = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M2.5 4.5H13.5M2.5 8H13.5M2.5 11.5H13.5"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
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

interface StyleModalProps {
  onClose: () => void;
  initialColor?: string;
}

// 빨간색 계열(355~360도 및 0~5도)은 슬라이더 좌측 시작점(0%)으로 자연스럽게 보정
function getHueSliderPercent(h: number): number {
  if (h >= 350 || h <= 5) return 0;
  return (h / 360) * 100;
}

/**
 * 피그마 UI3 공식 Add Style 모달
 * - 피그마 노드 1027248:4648 (기본 축소 모드)
 * - 피그마 노드 1027376:1405 (인라인 컬러 피커 확장 모드)
 */
export function StyleModal({ onClose, initialColor }: StyleModalProps) {
  const {
    uiState,
    setUIState,
    setLastNodeConfig,
    applyCurrentNodeState,
    addStylePreset,
    showToast,
    selectedNodes,
  } = useApp();

  // Fill 상태: 사용자가 현재 선택한 컬러를 최우선으로 반영
  const resolvedColor = (initialColor || uiState.selectedColor || '#EA2039')
    .replace('#', '')
    .trim()
    .toUpperCase();
  const validFill = resolvedColor.length === 6 ? resolvedColor : 'EA2039';

  const [fillHex, setFillHex] = useState(validFill);
  const [fillHsv, setFillHsv] = useState(() => hexToHsv(validFill));

  // Stroke 상태
  const [strokeHex, setStrokeHex] = useState(validFill);
  const [strokeHsv, setStrokeHsv] = useState(() => hexToHsv(validFill));
  const [strokeWeight, setStrokeWeight] = useState(0);

  // 현재 열려있는 컬러 피커 ('fill' | 'stroke' | null) - 기본값 'fill'로 피그마 1027376:1405 디자인 렌더
  const [activePicker, setActivePicker] = useState<'fill' | 'stroke' | null>('fill');

  // DOM 드래그 참조
  const hueBarRef = useRef<HTMLDivElement>(null);
  const satValRef = useRef<HTMLDivElement>(null);

  // 1. 헥스 인풋 수동 변경 처리
  function handleHexChange(type: 'fill' | 'stroke', value: string) {
    const clean = value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6).toUpperCase();
    if (type === 'fill') {
      setFillHex(clean);
      if (clean.length === 6) {
        setFillHsv(hexToHsv(clean));
      }
    } else {
      setStrokeHex(clean);
      if (clean.length === 6) {
        setStrokeHsv(hexToHsv(clean));
      }
    }
  }

  // 2. Hue 슬라이더 드래그 핸들러
  const handleHueDrag = useCallback(
    (e: MouseEvent | React.MouseEvent) => {
      if (!hueBarRef.current || !activePicker) return;
      const rect = hueBarRef.current.getBoundingClientRect();
      const clientX = 'clientX' in e ? e.clientX : (e as MouseEvent).clientX;
      const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const h = Math.round(percent * 360);

      if (activePicker === 'fill') {
        const nextHsv = { ...fillHsv, h };
        setFillHsv(nextHsv);
        setFillHex(hsvToHex(nextHsv.h, nextHsv.s, nextHsv.v));
      } else {
        const nextHsv = { ...strokeHsv, h };
        setStrokeHsv(nextHsv);
        setStrokeHex(hsvToHex(nextHsv.h, nextHsv.s, nextHsv.v));
      }
    },
    [activePicker, fillHsv, strokeHsv]
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
      if (!satValRef.current || !activePicker) return;
      const rect = satValRef.current.getBoundingClientRect();
      const clientX = 'clientX' in e ? e.clientX : (e as MouseEvent).clientX;
      const clientY = 'clientY' in e ? e.clientY : (e as MouseEvent).clientY;

      const s = Math.round(Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * 100);
      const v = Math.round(Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height)) * 100);

      if (activePicker === 'fill') {
        const nextHsv = { ...fillHsv, s, v };
        setFillHsv(nextHsv);
        setFillHex(hsvToHex(nextHsv.h, nextHsv.s, nextHsv.v));
      } else {
        const nextHsv = { ...strokeHsv, s, v };
        setStrokeHsv(nextHsv);
        setStrokeHex(hsvToHex(nextHsv.h, nextHsv.s, nextHsv.v));
      }
    },
    [activePicker, fillHsv, strokeHsv]
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
    const finalFillColor = `#${fillHex.padStart(6, '0')}`;
    const finalStrokeColor = `#${strokeHex.padStart(6, '0')}`;
    const finalStrokeWeight = Math.max(0, strokeWeight);

    // 1) 신규 스타일 프리셋 등록 (갤러리 카드에 보더 사이즈, 컬러가 그대로 반영됨)
    addStylePreset({
      fillColor: finalFillColor,
      strokeWeight: finalStrokeWeight,
      strokeColor: finalStrokeColor,
    });

    // 2) 피그마 플러그인 백엔드에 업데이트 전송
    if (selectedNodes && selectedNodes.length > 0) {
      selectedNodes.forEach((node) => {
        parent.postMessage(
          {
            pluginMessage: {
              type: 'UPDATE_FLOW_NODE',
              payload: {
                nodeId: node.id,
                colorHex: finalFillColor,
                strokeColor: finalStrokeColor,
                strokeWeight: finalStrokeWeight,
              },
            },
          },
          '*'
        );
      });
    }

    onClose();
  }

  // 현재 활성화된 피커의 HSV 정보
  const currentHsv = activePicker === 'stroke' ? strokeHsv : fillHsv;
  const currentHex = activePicker === 'stroke' ? strokeHex : fillHex;

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
        id="modal-add-style"
        className="style-modal-card"
        style={{ display: 'flex' }}
      >
        {/* 모달 헤더 (피그마 UI3: Add Style + X 닫기 버튼) */}
        <div className="style-modal-header">
          <span className="style-modal-title">Add Style</span>
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
          {/* ==================== 1. Fill 섹션 ==================== */}
          <div className="style-section-group" style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Fill 헤더 행 */}
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
                Fill
              </span>
              <button
                type="button"
                className={`style-palette-btn${activePicker === 'fill' ? ' active' : ''}`}
                onClick={() => setActivePicker(activePicker === 'fill' ? null : 'fill')}
                title="Toggle color picker"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: activePicker === 'fill' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)',
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

            {/* Fill 컬러 박스 (호버 및 셀렉트 시 반응형 보더) */}
            <div
              className={`style-color-box${activePicker === 'fill' ? ' active' : ''}`}
              onClick={() => setActivePicker('fill')}
            >
              <div
                className="style-color-chip"
                style={{ background: `#${fillHex.padStart(6, '0')}` }}
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePicker(activePicker === 'fill' ? null : 'fill');
                }}
              />
              <input
                type="text"
                className="style-color-hex-text"
                value={fillHex}
                maxLength={6}
                onFocus={(e) => {
                  setActivePicker('fill');
                  e.currentTarget.select();
                }}
                onChange={(e) => handleHexChange('fill', e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            {/* 인라인 컬러 피커 (Fill 선택 시 확장 렌더: 피그마 노드 1027376:1405) */}
            {activePicker === 'fill' && (
              <div style={{ marginTop: 10, animation: 'modalFadeIn 0.12s ease-out' }}>
                {/* 1) Saturation / Value 2D 피커 캔버스 (위) */}
                <div
                  ref={satValRef}
                  className="style-sat-val-picker"
                  onMouseDown={startSatValDrag}
                  style={{
                    backgroundColor: `hsl(${fillHsv.h}, 100%, 50%)`,
                    marginBottom: 12,
                  }}
                >
                  {/* Sat/Val 원형 링 셀렉터 핸들 */}
                  <div
                    className="style-sat-val-thumb"
                    style={{
                      left: `${fillHsv.s}%`,
                      top: `${100 - fillHsv.v}%`,
                    }}
                  />
                </div>

                {/* 2) Hue 슬라이더 (색상선택 게이지, 아래) */}
                <div
                  ref={hueBarRef}
                  className="style-hue-slider"
                  style={{ margin: 0 }}
                  onMouseDown={startHueDrag}
                >
                  <div
                    className="style-hue-thumb"
                    style={{
                      left: `${getHueSliderPercent(fillHsv.h)}%`,
                      background: `hsl(${fillHsv.h}, 100%, 50%)`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 중간 구분선 (1px Divider) */}
          <div className="style-divider" style={{ margin: '12px 0' }} />

          {/* ==================== 2. Stroke 섹션 ==================== */}
          <div className="style-section-group" style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Stroke 헤더 행 */}
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
                Stroke
              </span>
              <button
                type="button"
                className={`style-palette-btn${activePicker === 'stroke' ? ' active' : ''}`}
                onClick={() => setActivePicker(activePicker === 'stroke' ? null : 'stroke')}
                title="Toggle color picker"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: activePicker === 'stroke' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)',
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

            {/* Stroke 컨트롤 행 (컬러 박스 + 두께 박스) */}
            <div className="style-control-row">
              {/* Stroke 컬러 박스 */}
              <div
                className={`style-color-box${activePicker === 'stroke' ? ' active' : ''}`}
                onClick={() => setActivePicker('stroke')}
              >
                <div
                  className="style-color-chip"
                  style={{ background: `#${strokeHex.padStart(6, '0')}` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePicker(activePicker === 'stroke' ? null : 'stroke');
                  }}
                />
                <input
                  type="text"
                  className="style-color-hex-text"
                  value={strokeHex}
                  maxLength={6}
                  onFocus={(e) => {
                    setActivePicker('stroke');
                    e.currentTarget.select();
                  }}
                  onChange={(e) => handleHexChange('stroke', e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>

              {/* Stroke 두께 인풋 박스 */}
              <div className="stroke-width-box">
                <span
                  style={{
                    width: 16,
                    height: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'rgba(255, 255, 255, 0.6)',
                    marginRight: 4,
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
                  onChange={(e) => setStrokeWeight(parseInt(e.target.value, 10) || 0)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    letterSpacing: 0,
                  }}
                />
              </div>
            </div>

            {/* 인라인 컬러 피커 (Stroke 선택 시 확장 렌더) */}
            {activePicker === 'stroke' && (
              <div style={{ marginTop: 10, animation: 'modalFadeIn 0.12s ease-out' }}>
                {/* 1) Saturation / Value 2D 피커 캔버스 (위) */}
                <div
                  ref={satValRef}
                  className="style-sat-val-picker"
                  onMouseDown={startSatValDrag}
                  style={{
                    backgroundColor: `hsl(${strokeHsv.h}, 100%, 50%)`,
                    marginBottom: 12,
                  }}
                >
                  {/* Sat/Val 원형 링 셀렉터 핸들 */}
                  <div
                    className="style-sat-val-thumb"
                    style={{
                      left: `${strokeHsv.s}%`,
                      top: `${100 - strokeHsv.v}%`,
                    }}
                  />
                </div>

                {/* 2) Hue 슬라이더 (색상선택 게이지, 아래) */}
                <div
                  ref={hueBarRef}
                  className="style-hue-slider"
                  style={{ margin: 0 }}
                  onMouseDown={startHueDrag}
                >
                  <div
                    className="style-hue-thumb"
                    style={{
                      left: `${getHueSliderPercent(strokeHsv.h)}%`,
                      background: `hsl(${strokeHsv.h}, 100%, 50%)`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 모달 푸터 (Cancel + Save 버튼) */}
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
