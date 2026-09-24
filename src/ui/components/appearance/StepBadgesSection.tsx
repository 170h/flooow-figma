import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';

type BadgeColorMode = 'White' | 'Black' | 'Style';

/**
 * ⚠️ [CRITICAL RULE - DO NOT MODIFY ICONS]
 * Step Badges 섹션의 모든 공식 아이콘(BADGE_CORNERS 4개 코너 아이콘, step-number-icon)은
 * 원본 규격 24x24 (width=24, height=24, viewBox="0 0 24 24") 고정이며,
 * 어떤 경우에도 임의로 SVG 패스를 새로 만들거나 크기/모양을 수정/교체해서는 안 됩니다.
 */
const BADGE_CORNERS = [
  {
    pos: 'TOP_LEFT',
    title: 'Top-Left',
    svg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M15.98 7.5H9.93C9.71 6.64 8.93 6 8 6C6.9 6 6 6.9 6 8C6 8.92 6.63 9.69 7.48 9.92V16C7.48 16.28 7.7 16.5 7.98 16.5H15.98C16.26 16.5 16.48 16.28 16.48 16V8C16.48 7.72 16.26 7.5 15.98 7.5ZM7 8C7 7.45 7.45 7 8 7C8.55 7 9 7.45 9 8C9 8.55 8.55 9 8 9C7.45 9 7 8.55 7 8ZM15.48 15.5H8.48V9.94C9.19 9.76 9.75 9.21 9.93 8.5H15.48V15.5Z" fill="currentColor"/>
      </svg>
    ),
  },
  {
    pos: 'TOP_RIGHT',
    title: 'Top-Right',
    svg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M18 8C18 6.9 17.1 6 16 6C15.07 6 14.29 6.64 14.07 7.5H8C7.72 7.5 7.5 7.72 7.5 8V16C7.5 16.28 7.72 16.5 8 16.5H16C16.28 16.5 16.5 16.28 16.5 16V9.93C17.36 9.71 18 8.93 18 8ZM8.5 15.5V8.5H14.07C14.25 9.2 14.8 9.75 15.5 9.93V15.5H8.5ZM16 9C15.45 9 15 8.55 15 8C15 7.45 15.45 7 16 7C16.55 7 17 7.45 17 8C17 8.55 16.55 9 16 9Z" fill="currentColor"/>
      </svg>
    ),
  },
  {
    pos: 'BOTTOM_LEFT',
    title: 'Bottom-Left',
    svg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M15.98 7.5H7.98C7.7 7.5 7.48 7.72 7.48 8V14.08C6.63 14.31 6 15.08 6 16C6 17.1 6.9 18 8 18C8.93 18 9.71 17.36 9.93 16.5H15.98C16.26 16.5 16.48 16.28 16.48 16V8C16.48 7.72 16.26 7.5 15.98 7.5ZM8 17C7.45 17 7 16.55 7 16C7 15.45 7.45 15 8 15C8.55 15 9 15.45 9 16C9 16.55 8.55 17 8 17ZM15.48 15.5H9.93C9.75 14.79 9.19 14.24 8.48 14.06V8.5H15.48V15.5Z" fill="currentColor"/>
      </svg>
    ),
  },
  {
    pos: 'BOTTOM_RIGHT',
    title: 'Bottom-Right',
    svg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M16.5 14.07V8C16.5 7.72 16.28 7.5 16 7.5H8C7.72 7.5 7.5 7.72 7.5 8V16C7.5 16.28 7.72 16.5 8 16.5H14.07C14.29 17.36 15.07 18 16 18C17.1 18 18 17.1 18 16C18 15.07 17.36 14.29 16.5 14.07ZM14.07 15.5H8.5V8.5H15.5V14.07C14.8 14.25 14.25 14.8 14.07 15.5ZM16 17C15.45 17 15 16.55 15 16C15 15.45 15.45 15 16 15C16.55 15 17 15.45 17 16C17 16.55 16.55 17 16 17Z" fill="currentColor"/>
      </svg>
    ),
  },
] as const;

const BADGE_SHAPES = [
  { id: 'Square', label: 'Square' },
  { id: 'Circle', label: 'Circle' },
  { id: 'RoundBox', label: 'Round Box' },
] as const;

const COLOR_OPTIONS: { id: BadgeColorMode; label: string }[] = [
  { id: 'Style', label: 'Style' },
  { id: 'White', label: 'White' },
  { id: 'Black', label: 'Black' },
];

/**
 * Step Badges 섹션 - 피그마 UI3 공식 사양
 * 싱글 노드: 1027248:4148 (실시간 반영, 2행)
 * 복수 노드: 1027377:2473 (Mixed 표시, 3행 Add Step Badges 버튼)
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
  const [colorDropdownOpen, setColorDropdownOpen] = useState(false);
  const [stepNumText, setStepNumText] = useState('1');
  const [isMixed, setIsMixed] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const isMultiMode = selectedNodes.length > 1;
  const selectedBadgeCorner = uiState.selectedBadgeCorner || 'TOP_LEFT';
  const selectedBadgeShape = uiState.selectedBadgeShape || 'Square';
  const selectedBadgeColorMode: BadgeColorMode = uiState.selectedBadgeColorMode || 'Style';

function isHexHighSaturation(hex: string): boolean {
  const clean = hex.replace('#', '');
  if (clean.length !== 6 && clean.length !== 3) return false;
  const num = parseInt(clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean, 16);
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (delta < 0.15) return false;
  const l = (max + min) / 2;
  const s = l > 0 && l < 1 ? delta / (1 - Math.abs(2 * l - 1)) : 0;
  return s >= 0.25;
}

function isHexDark(hex: string): boolean {
  const clean = hex.replace('#', '');
  if (clean.length !== 6 && clean.length !== 3) return false;
  const num = parseInt(clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean, 16);
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  return lum < 0.6;
}

  // 현재 노드의 배경색 및 보더색 추출 (Style / White 모드 스와치 표시용)
  const firstNode = selectedNodes[0];
  const nodeBgColorHex = firstNode?.fillColorHex || '#E11D48';
  const hasNodeStroke = (firstNode?.strokeWeight || 0) > 0 && !!firstNode?.strokeColorHex;
  const isDarkNode = isHexDark(nodeBgColorHex);
  const isHighSat = isHexHighSaturation(nodeBgColorHex);

  // Style 모드 보더: 노드 보더가 있으면 노드 보더색, 보더 0이면 어두운/유채색 노드는 흰색(#FFFFFF), 밝은 노드는 #D1D5DB
  const styleSwatchBorderColor = hasNodeStroke
    ? firstNode?.strokeColorHex!
    : isDarkNode
    ? '#FFFFFF'
    : '#D1D5DB';

  // White 모드 보더: 노드 보더가 있으면 노드 보더색, 보더 0이고 채도가 높으면 노드 배경색, 어두운 무채색은 흰색, 밝은 무채색은 #D1D5DB
  const whiteSwatchBorderColor = hasNodeStroke
    ? firstNode?.strokeColorHex!
    : isHighSat
    ? nodeBgColorHex
    : isDarkNode
    ? '#FFFFFF'
    : '#D1D5DB';

  // 선택된 노드의 상태 동기화
  useEffect(() => {
    if (selectedNodes && selectedNodes.length > 0) {
      const hasStep = selectedNodes.some(n => n.stepNumber !== undefined);
      setIsOn(hasStep);

      if (selectedNodes.length === 1) {
        setIsMixed(false);
        const node = selectedNodes[0];
        if (node.stepNumber !== undefined) {
          setStepNumText(String(node.stepNumber));
        } else {
          setStepNumText('1');
        }
        if (node.badgeCorner) {
          setUIState({ selectedBadgeCorner: node.badgeCorner });
        }
        if (node.badgeShape) {
          setUIState({ selectedBadgeShape: node.badgeShape });
        }
        if (node.badgeColorMode) {
          setUIState({ selectedBadgeColorMode: node.badgeColorMode });
        }
      } else {
        // 복수 선택
        const stepNums = selectedNodes.map(n => n.stepNumber).filter(n => n !== undefined);
        const allSame = stepNums.length > 0 && stepNums.every(v => v === stepNums[0]);
        if (allSame) {
          setIsMixed(false);
          setStepNumText(String(stepNums[0]));
        } else {
          setIsMixed(true);
          setStepNumText('');
        }

        const firstWithBadge = selectedNodes.find(n => n.badgeCorner || n.badgeShape || n.badgeColorMode);
        if (firstWithBadge) {
          if (firstWithBadge.badgeCorner) setUIState({ selectedBadgeCorner: firstWithBadge.badgeCorner });
          if (firstWithBadge.badgeShape) setUIState({ selectedBadgeShape: firstWithBadge.badgeShape });
          if (firstWithBadge.badgeColorMode) setUIState({ selectedBadgeColorMode: firstWithBadge.badgeColorMode });
        }
      }
    } else {
      setIsOn(false);
      setIsMixed(false);
      setStepNumText('1');
    }
  }, [selectedNodes, setUIState]);

  // 드롭다운 외부 클릭 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setColorDropdownOpen(false);
      }
    }
    if (colorDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [colorDropdownOpen]);

  function getNumberValue(): number {
    const parsed = parseInt(stepNumText, 10);
    return isNaN(parsed) || parsed < 1 ? 1 : parsed;
  }

  function handleToggle(checked: boolean) {
    setIsOn(checked);
    setLastNodeConfig({ stepBadgesOn: checked });
    autoResizeWindow();

    if (checked) {
      applyStepBadges(getNumberValue(), selectedBadgeCorner, selectedBadgeShape, selectedBadgeColorMode);
    } else {
      removeStepBadgesFromNodes();
    }
  }

  function handleCornerSelect(pos: string) {
    setUIState({ selectedBadgeCorner: pos });
    setLastNodeConfig({ badgeCorner: pos });
    if (isOn && !isMultiMode) {
      applyStepBadges(getNumberValue(), pos, selectedBadgeShape, selectedBadgeColorMode);
    }
  }

  function handleShapeSelect(shape: string) {
    setUIState({ selectedBadgeShape: shape });
    setLastNodeConfig({ badgeShape: shape });
    if (isOn && !isMultiMode) {
      applyStepBadges(getNumberValue(), selectedBadgeCorner, shape, selectedBadgeColorMode);
    }
  }

  function handleColorSelect(mode: BadgeColorMode) {
    setUIState({ selectedBadgeColorMode: mode });
    setLastNodeConfig({ badgeColorMode: mode });
    setColorDropdownOpen(false);
    if (isOn && !isMultiMode) {
      applyStepBadges(getNumberValue(), selectedBadgeCorner, selectedBadgeShape, mode);
    }
  }

  function handleNumberBlurOrEnter() {
    setIsMixed(false);
    const val = getNumberValue();
    setStepNumText(String(val));
    setLastNodeConfig({ stepNumber: val });
    if (isOn && !isMultiMode) {
      applyStepBadges(val, selectedBadgeCorner, selectedBadgeShape, selectedBadgeColorMode);
    }
  }

  // 복수 선택 시 하단 보라색 버튼 클릭: 순차 부여
  function handleAddStepBadgesMulti() {
    const start = getNumberValue();
    applyStepBadges(start, selectedBadgeCorner, selectedBadgeShape, selectedBadgeColorMode);
  }

  // 컬러 스와치 렌더러
  function renderColorSwatch(mode: BadgeColorMode, size = 14) {
    if (mode === 'White') {
      return (
        <span
          style={{
            width: size,
            height: size,
            borderRadius: 3,
            backgroundColor: '#FFFFFF',
            border: `1.5px solid ${whiteSwatchBorderColor}`,
            display: 'inline-block',
            flexShrink: 0,
            boxSizing: 'border-box',
          }}
        />
      );
    }
    if (mode === 'Black') {
      return (
        <span
          style={{
            width: size,
            height: size,
            borderRadius: 3,
            backgroundColor: '#18181B',
            border: '1.5px solid #FFFFFF',
            display: 'inline-block',
            flexShrink: 0,
            boxSizing: 'border-box',
          }}
        />
      );
    }
    // Style: 노드 배경색, 보더는 노드 보더 컬러 (보더 0이면 흰색)
    return (
      <span
        style={{
          width: size,
          height: size,
          borderRadius: 3,
          backgroundColor: nodeBgColorHex,
          border: `1.5px solid ${styleSwatchBorderColor}`,
          boxShadow: '0 0 0 0.5px rgba(0,0,0,0.1)',
          display: 'inline-block',
          flexShrink: 0,
          boxSizing: 'border-box',
        }}
      />
    );
  }

  return (
    <div className="section-block step-badges-section" style={{ paddingBottom: isOn ? '12px' : '0px' }}>
      {/* 상단 헤더: Step Badges + 보라색 토글 스위치 */}
      <div className="section-header toggle-row">
        <span className="section-title">Step Badges</span>
        <label className="switch">
          <input
            type="checkbox"
            id="toggle-step-badges"
            checked={isOn}
            onChange={e => handleToggle(e.target.checked)}
          />
          <span className="slider" />
        </label>
      </div>

      {isOn && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
          {/* Row 1: [#] [숫자 or Mixed] (w: 100) + 코너 위치 4버튼 (w: 220) */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%' }}>
            {/* 좌측 Numeric Input */}
            <div
              style={{
                width: '100px',
                height: '28px',
                backgroundColor: '#F3F4F6',
                borderRadius: '6px',
                padding: '0 6px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                flexShrink: 0,
                boxSizing: 'border-box',
              }}
            >
              <svg
                id="step-number-icon"
                data-tooltip={isMultiMode ? 'Start Number' : 'Number'}
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                style={{ color: '#111827', flexShrink: 0 }}
              >
                <path
                  d="M16 18C17.1046 18 18 17.1046 18 16V8C18 6.89543 17.1046 6 16 6H8C6.89543 6 6 6.89543 6 8V16C6 17.1046 6.89543 18 8 18H16ZM8 17C7.44772 17 7 16.5523 7 16V8C7 7.44772 7.44772 7 8 7H16C16.5523 7 17 7.44772 17 8V16C17 16.5523 16.5523 17 16 17H8ZM10.4502 14.9971C10.7249 15.0245 10.9695 14.8245 10.9971 14.5498L11.0518 14H12.5479L12.5029 14.4502C12.4755 14.7249 12.6755 14.9695 12.9502 14.9971C13.2249 15.0245 13.4695 14.8245 13.4971 14.5498L13.5518 14H14.5C14.7761 14 15 13.7761 15 13.5C15 13.2239 14.7761 13 14.5 13H13.6523L13.8525 11H14.5C14.7761 11 15 10.7761 15 10.5C15 10.2239 14.7761 10 14.5 10H13.9521L13.9971 9.5498C14.0245 9.27507 13.8245 9.03045 13.5498 9.00293C13.2751 8.97546 13.0305 9.17547 13.0029 9.4502L12.9482 10H11.4521L11.4971 9.5498C11.5245 9.27507 11.3245 9.03045 11.0498 9.00293C10.7751 8.97546 10.5305 9.17547 10.5029 9.4502L10.4482 10H9.5C9.22386 10 9 10.2239 9 10.5C9 10.7761 9.22386 11 9.5 11H10.3477L10.1475 13H9.5C9.22386 13 9 13.2239 9 13.5C9 13.7761 9.22386 14 9.5 14H10.0479L10.0029 14.4502C9.97546 14.7249 10.1755 14.9695 10.4502 14.9971ZM11.1523 13L11.3525 11H12.8477L12.6475 13H11.1523Z"
                  fill="currentColor"
                />
              </svg>
              <input
                type="text"
                id="input-step-number"
                value={isMixed ? '' : stepNumText}
                placeholder={isMixed ? 'Mixed' : '1'}
                onChange={e => {
                  setIsMixed(false);
                  setStepNumText(e.target.value.replace(/[^0-9]/g, ''));
                }}
                onBlur={handleNumberBlurOrEnter}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleNumberBlurOrEnter();
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                style={{
                  width: '100%',
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '11px',
                  fontWeight: 500,
                  color: isMixed ? '#6B7280' : '#111827',
                  padding: 0,
                }}
              />
            </div>

            {/* 우측 Corner Position Controls (4버튼) */}
            <div
              style={{
                flex: 1,
                height: '28px',
                backgroundColor: '#F3F4F6',
                borderRadius: '6px',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                boxSizing: 'border-box',
              }}
            >
              {BADGE_CORNERS.map(c => {
                const active = selectedBadgeCorner === c.pos;
                return (
                  <button
                    key={c.pos}
                    type="button"
                    title={c.title}
                    onClick={() => handleCornerSelect(c.pos)}
                    style={{
                      flex: 1,
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: 'none',
                      borderRadius: '4px',
                      backgroundColor: active ? '#FFFFFF' : 'transparent',
                      boxShadow: active ? '0 1px 2px rgba(0,0,0,0.12)' : 'none',
                      color: active ? '#111827' : '#9CA3AF',
                      cursor: 'pointer',
                      padding: 0,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {c.svg}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 2: 컬러 드롭다운 (w: 100) + 셰이프 선택 (Square, Circle, Round Box) */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%' }}>
            {/* 좌측 Color Dropdown */}
            <div ref={dropdownRef} style={{ position: 'relative', width: '100px', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => setColorDropdownOpen(!colorDropdownOpen)}
                style={{
                  width: '100%',
                  height: '24px',
                  backgroundColor: '#F3F4F6',
                  borderRadius: '6px',
                  padding: '0 8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: 'none',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {renderColorSwatch(selectedBadgeColorMode)}
                  <span style={{ fontSize: '11px', fontWeight: 500, color: '#111827' }}>
                    {selectedBadgeColorMode}
                  </span>
                </div>
                {/* Chevron Down 아이콘 */}
                <svg width="8" height="5" viewBox="0 0 8 5" fill="none" style={{ color: '#6B7280' }}>
                  <path d="M1 1L4 4L7 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {/* 드롭다운 메뉴 */}
              {colorDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '28px',
                    left: 0,
                    width: '110px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '6px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
                    padding: '4px',
                    zIndex: 100,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}
                >
                  {COLOR_OPTIONS.map(opt => {
                    const active = selectedBadgeColorMode === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleColorSelect(opt.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '5px 8px',
                          borderRadius: '4px',
                          border: 'none',
                          backgroundColor: active ? '#F3F4F6' : 'transparent',
                          cursor: 'pointer',
                          width: '100%',
                          textAlign: 'left',
                        }}
                        onMouseEnter={e => {
                          if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = '#F9FAFB';
                        }}
                        onMouseLeave={e => {
                          if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                        }}
                      >
                        {renderColorSwatch(opt.id, 12)}
                        <span style={{ fontSize: '11px', fontWeight: active ? 600 : 500, color: '#111827' }}>
                          {opt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 우측 Shape Segmented Controls (Square, Circle, Round Box) */}
            <div
              style={{
                flex: 1,
                height: '24px',
                backgroundColor: '#F3F4F6',
                borderRadius: '6px',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {BADGE_SHAPES.map(s => {
                const active = selectedBadgeShape === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleShapeSelect(s.id)}
                    style={{
                      flex: 1,
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: 'none',
                      borderRadius: '4px',
                      backgroundColor: active ? '#FFFFFF' : 'transparent',
                      boxShadow: active ? '0 1px 2px rgba(0,0,0,0.12)' : 'none',
                      color: active ? '#111827' : '#6B7280',
                      fontWeight: 400,
                      fontSize: '11px',
                      cursor: 'pointer',
                      padding: 0,
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 3 (복수 노드 선택 시에만 표시): 우측 정렬 보라색 [✨ Add Step Badges] 버튼 */}
          {isMultiMode && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', marginTop: '4px' }}>
              <button
                type="button"
                onClick={handleAddStepBadgesMulti}
                style={{
                  height: '28px',
                  backgroundColor: '#8638E5',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0 12px',
                  fontSize: '11px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(134, 56, 229, 0.25)',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#7320D6';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#8638E5';
                }}
              >
                {/* 반짝이/별 아이콘 */}
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 1L9.5 5.5L14 7L9.5 8.5L8 13L6.5 8.5L2 7L6.5 5.5L8 1Z" fill="currentColor" />
                  <path d="M12.5 11L13.25 12.5L14.75 13.25L13.25 14L12.5 15.5L11.75 14L10.25 13.25L11.75 12.5L12.5 11Z" fill="currentColor" />
                </svg>
                <span>Add Step Badges</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
