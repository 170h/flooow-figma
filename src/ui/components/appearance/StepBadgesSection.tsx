import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useSelectionSummary } from '../../hooks/useSelectionSummary';
import { DropdownMixedItem } from '../shared/DropdownMixedItem';
import { COLOR_MIXED_ICON, MixedDashChip } from '../shared/icons';

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
    lastNodeConfig,
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

  const summary = useSelectionSummary();
  const isMultiMode = summary.isMultiFlowNode;
  const isCornerMixed = isMultiMode && summary.badgeCorner.isMixed;
  const isShapeMixed = isMultiMode && summary.badgeShape.isMixed;
  const isColorModeMixed = isMultiMode && summary.badgeColorMode.isMixed;

  // start number가 정의되어 있는지 여부 (빈 값이 아니고, Mixed가 아니며 유효한 숫자)
  const isStartNumberDefined = !isMixed && stepNumText.trim() !== '' && !isNaN(parseInt(stepNumText, 10));
  const selectedBadgeCorner = isCornerMixed ? undefined : (summary.isMultiFlowNode && summary.badgeCorner.value ? summary.badgeCorner.value : (uiState.selectedBadgeCorner || 'TOP_LEFT'));
  const selectedBadgeShape = isShapeMixed ? undefined : (summary.isMultiFlowNode && summary.badgeShape.value ? summary.badgeShape.value : (uiState.selectedBadgeShape || 'Square'));
  const selectedBadgeColorMode: BadgeColorMode | undefined = isColorModeMixed ? undefined : (summary.isMultiFlowNode && summary.badgeColorMode.value ? (summary.badgeColorMode.value as BadgeColorMode) : (uiState.selectedBadgeColorMode || 'Style'));

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

        if (!summary.badgeCorner.isMixed && summary.badgeCorner.value) {
          setUIState({ selectedBadgeCorner: summary.badgeCorner.value });
        }
        if (!summary.badgeShape.isMixed && summary.badgeShape.value) {
          setUIState({ selectedBadgeShape: summary.badgeShape.value });
        }
        if (!summary.badgeColorMode.isMixed && summary.badgeColorMode.value) {
          setUIState({ selectedBadgeColorMode: summary.badgeColorMode.value as BadgeColorMode });
        }
      }
    } else {
      // 선택된 노드가 없는 경우 (새 노드 생성 모드): 이전 상태 캐시 복원 및 번호 +1 증가 적용
      const cachedOn = Boolean(lastNodeConfig.stepBadgesOn);
      setIsOn(cachedOn);
      setIsMixed(false);
      const nextStepNum = (typeof lastNodeConfig.stepNumber === 'number' && lastNodeConfig.stepNumber > 0)
        ? lastNodeConfig.stepNumber + 1
        : 1;
      setStepNumText(String(nextStepNum));
      if (lastNodeConfig.badgeCorner) {
        setUIState({ selectedBadgeCorner: lastNodeConfig.badgeCorner });
      }
      if (lastNodeConfig.badgeShape) {
        setUIState({ selectedBadgeShape: lastNodeConfig.badgeShape });
      }
      if (lastNodeConfig.badgeColorMode) {
        setUIState({ selectedBadgeColorMode: lastNodeConfig.badgeColorMode });
      }
    }
  }, [selectedNodes, summary.badgeCorner.isMixed, summary.badgeCorner.value, summary.badgeShape.isMixed, summary.badgeShape.value, summary.badgeColorMode.isMixed, summary.badgeColorMode.value, lastNodeConfig.stepBadgesOn, lastNodeConfig.stepNumber, lastNodeConfig.badgeCorner, lastNodeConfig.badgeShape, lastNodeConfig.badgeColorMode, setUIState]);

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

  // 스텝 배지 기본값(1) 리셋 핸들러
  function handleResetNumber() {
    setIsMixed(false);
    setStepNumText('1');
    setLastNodeConfig({ stepNumber: 1 });
    if (isOn && !isMultiMode) {
      applyStepBadges(1, selectedBadgeCorner, selectedBadgeShape, selectedBadgeColorMode);
    }
    const input = document.getElementById('input-step-number') as HTMLInputElement | null;
    if (input) {
      input.focus();
      input.select();
    }
  }

  // 복수 선택 시 하단 보라색 버튼 클릭: 순차 부여
  function handleAddStepBadgesMulti() {
    const start = getNumberValue();
    applyStepBadges(start, selectedBadgeCorner, selectedBadgeShape, selectedBadgeColorMode);
  }

  // 컬러 스와치 렌더러 (컬러 입력필드 컬러칩 스타일과 동일한 투명 보더 반영)
  function renderColorSwatch(mode: BadgeColorMode, size = 16) {
    if (mode === 'White') {
      return (
        <span
          style={{
            width: size,
            height: size,
            borderRadius: 3,
            backgroundColor: '#FFFFFF',
            border: 'none',
            boxShadow: 'inset 0 0 0 1px var(--color-chip-border)',
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
            border: 'none',
            boxShadow: 'inset 0 0 0 1px var(--color-chip-border)',
            display: 'inline-block',
            flexShrink: 0,
            boxSizing: 'border-box',
          }}
        />
      );
    }
    // Style: 노드 배경색, 노드에 보더가 있으면 노드 보더 반영, 없으면 컬러 입력필드 컬러칩과 동일하게 투명 보더
    return (
      <span
        style={{
          width: size,
          height: size,
          borderRadius: 3,
          backgroundColor: nodeBgColorHex,
          border: hasNodeStroke ? `${Math.min(firstNode?.strokeWeight || 1, 2)}px solid ${firstNode?.strokeColorHex}` : 'none',
          boxShadow: hasNodeStroke ? undefined : 'inset 0 0 0 1px var(--color-chip-border)',
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
                data-tooltip={isMultiMode ? 'Start Number (Reset: 1)' : 'Number (Reset: 1)'}
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                style={{ color: '#111827', flexShrink: 0, cursor: 'pointer' }}
                onClick={handleResetNumber}
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
                  fontWeight: 400,
                  color: isMixed ? 'var(--color-text-primary, #000000)' : '#111827',
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
            {/* 좌측 Color Dropdown (피그마 기본 표준 드롭다운 컴포넌트) */}
            <div
              ref={dropdownRef}
              className="figma-dropdown-wrapper"
              style={{ width: '100px', flexShrink: 0 }}
            >
              <button
                type="button"
                className={`figma-dropdown-btn${colorDropdownOpen ? ' active' : ''}`}
                onClick={() => setColorDropdownOpen(!colorDropdownOpen)}
              >
                <div className="figma-dropdown-btn-content">
                  <span className="figma-dropdown-current-icon">
                    {selectedBadgeColorMode ? renderColorSwatch(selectedBadgeColorMode, 16) : <MixedDashChip size={16} />}
                  </span>
                  <span className="figma-dropdown-current-text">
                    {selectedBadgeColorMode || 'Mixed'}
                  </span>
                </div>
                <svg
                  className="figma-dropdown-chevron-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  style={{
                    transform: colorDropdownOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.15s ease',
                  }}
                >
                  <path
                    d="M9.7673 6.76777C9.96256 6.5725 10.28 6.5725 10.4753 6.76777C10.6702 6.96296 10.6702 7.2796 10.4753 7.4748L7.99972 9.94941L5.52511 7.4748C5.32985 7.27953 5.32985 6.96303 5.52511 6.76777C5.72037 6.5725 6.03688 6.5725 6.23214 6.76777L7.99972 8.53534L9.7673 6.76777Z"
                    fill="currentColor"
                  />
                </svg>
              </button>

              {/* 피그마 기본 스타일의 드롭다운 메뉴 */}
              {colorDropdownOpen && (
                <div
                  className="figma-dropdown-menu active"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 'auto',
                    width: '130px',
                    display: 'flex',
                    zIndex: 1050,
                  }}
                >
                  {/* Mixed 상태: 컬러칩이 포함된 옵션이므로 16x16 체크 + 스와치 위치의 '-' 대시 아이콘 + Mixed 라벨 */}
                  {(isColorModeMixed || !selectedBadgeColorMode) && (
                    <DropdownMixedItem
                      variant="chip"
                      chipSize={16}
                      onClick={() => setColorDropdownOpen(false)}
                    />
                  )}
                  {COLOR_OPTIONS.map(opt => {
                    const active = selectedBadgeColorMode === opt.id;
                    return (
                      <div
                        key={opt.id}
                        className={`figma-dropdown-item${active ? ' selected' : ''}`}
                        style={{ width: '100%', cursor: 'pointer' }}
                        onClick={() => handleColorSelect(opt.id)}
                      >
                        {/* 선두 체크 슬롯 (선택된 항목일 때 체크 아이콘 16x16) */}
                        <span className="figma-dropdown-check-slot">
                          {active && (
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path
                                d="M11.0839 4.22264C11.2371 3.99289 11.5475 3.93082 11.7773 4.08396C12.007 4.23714 12.0691 4.54756 11.916 4.77732L7.91596 10.7773C7.83287 10.902 7.69784 10.9833 7.54877 10.998C7.39988 11.0126 7.25223 10.9593 7.14643 10.8535L4.14643 7.85349C3.9512 7.65823 3.95118 7.34171 4.14643 7.14646C4.34168 6.95122 4.6582 6.95124 4.85346 7.14646L7.42182 9.71482L11.0839 4.22264Z"
                                fill="currentColor"
                              />
                            </svg>
                          )}
                        </span>
                        {/* 스와치 (24x24 슬롯 내 16px 칩 중앙 정렬) */}
                        <span className="figma-dropdown-icon-slot">
                          {renderColorSwatch(opt.id, 16)}
                        </span>
                        {/* 라벨 */}
                        <span className="figma-dropdown-label" style={{ fontSize: '11px', fontWeight: active ? 600 : 500 }}>
                          {opt.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 우측 Shape Segmented Controls (Square, Circle, Round Box) */}
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
              {BADGE_SHAPES.map(s => {
                const active = selectedBadgeShape === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleShapeSelect(s.id)}
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

          {/* Row 3 (복수 노드 선택 시 표시): 좌측 설명 문구 + 우측 24px 디폴트 버튼 사이즈 [✨ Add Step Badges] */}
          {isMultiMode && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                marginTop: '4px',
                gap: '8px',
              }}
            >
              <span
                style={{
                  fontSize: '9px',
                  lineHeight: '1.3',
                  color: 'var(--color-text-secondary, #6B7280)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title="Starts numbering from the start number."
              >
                Starts numbering from the start number.
              </span>
              <button
                type="button"
                className="btn-add-step-badges"
                disabled={!isStartNumberDefined}
                onClick={handleAddStepBadgesMulti}
                title={!isStartNumberDefined ? 'Please define a start number' : 'Add Step Badges'}
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
