import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ConnectorTerminalType } from '../../types';

// ============================================================
// Figma UI3 공식 킷 기반 커넥터 터미널 옵션 및 SVG
// - 드롭다운 버튼: -short가 빠진 기본(52x16) 아이콘
// - 드롭다운 메뉴: -short(36x16) 아이콘 (Figma 1027261:5984, 6029, 6009, 6054)
// ============================================================

export type TerminalOption = 'NONE' | 'BAR' | 'ARROW' | 'CIRCLE' | 'DIAMOND' | 'SQUARE';

const TERMINAL_OPTIONS: TerminalOption[] = [
  'NONE',
  'BAR',
  'ARROW',
  'CIRCLE',
  'DIAMOND',
  'SQUARE',
];

// 1. 드롭다운 버튼용 아이콘 (52x16 - "-short"가 빠진 기본 아이콘)
const TERMINAL_SVGS_BTN: Record<'start' | 'end', Record<TerminalOption, string>> = {
  start: {
    NONE: `<svg width="52" height="16" viewBox="0 0 52 16" fill="none"><path d="M2 8H50" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>`,
    BAR: `<svg width="52" height="16" viewBox="0 0 52 16" fill="none"><path d="M2 8H50" stroke="currentColor" stroke-width="1.2"/><path d="M2 3.5V12.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>`,
    ARROW: `<svg width="52" height="16" viewBox="0 0 52 16" fill="none"><path d="M2 8H50" stroke="currentColor" stroke-width="1.2"/><path d="M7 3.5L2 8L7 12.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    CIRCLE: `<svg width="52" height="16" viewBox="0 0 52 16" fill="none"><path d="M9 8H50" stroke="currentColor" stroke-width="1.2"/><circle cx="5.5" cy="8" r="3.5" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>`,
    DIAMOND: `<svg width="52" height="16" viewBox="0 0 52 16" fill="none"><path d="M9.5 8H50" stroke="currentColor" stroke-width="1.2"/><path d="M5.5 3.5L1.5 8L5.5 12.5L9.5 8Z" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linejoin="round"/></svg>`,
    SQUARE: `<svg width="52" height="16" viewBox="0 0 52 16" fill="none"><path d="M9 8H50" stroke="currentColor" stroke-width="1.2"/><rect x="2" y="4.5" width="7" height="7" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>`,
  },
  end: {
    NONE: `<svg width="52" height="16" viewBox="0 0 52 16" fill="none"><path d="M2 8H50" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>`,
    BAR: `<svg width="52" height="16" viewBox="0 0 52 16" fill="none"><path d="M2 8H50" stroke="currentColor" stroke-width="1.2"/><path d="M50 3.5V12.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>`,
    ARROW: `<svg width="52" height="16" viewBox="0 0 52 16" fill="none"><path d="M2 8H50" stroke="currentColor" stroke-width="1.2"/><path d="M45 3.5L50 8L45 12.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    CIRCLE: `<svg width="52" height="16" viewBox="0 0 52 16" fill="none"><path d="M2 8H43" stroke="currentColor" stroke-width="1.2"/><circle cx="46.5" cy="8" r="3.5" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>`,
    DIAMOND: `<svg width="52" height="16" viewBox="0 0 52 16" fill="none"><path d="M2 8H42.5" stroke="currentColor" stroke-width="1.2"/><path d="M46.5 3.5L42.5 8L46.5 12.5L50.5 8Z" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linejoin="round"/></svg>`,
    SQUARE: `<svg width="52" height="16" viewBox="0 0 52 16" fill="none"><path d="M2 8H43" stroke="currentColor" stroke-width="1.2"/><rect x="43" y="4.5" width="7" height="7" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>`,
  },
};

// 2. 드롭다운 메뉴용 아이콘 (36x16 - "-short" 아이콘)
const TERMINAL_SVGS_SHORT: Record<'start' | 'end', Record<TerminalOption, string>> = {
  start: {
    NONE: `<svg width="36" height="16" viewBox="0 0 36 16" fill="none"><path d="M4 8H32" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>`,
    BAR: `<svg width="36" height="16" viewBox="0 0 36 16" fill="none"><path d="M4 8H32" stroke="currentColor" stroke-width="1.2"/><path d="M4 3.5V12.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>`,
    ARROW: `<svg width="36" height="16" viewBox="0 0 36 16" fill="none"><path d="M4 8H32" stroke="currentColor" stroke-width="1.2"/><path d="M8 4L4 8L8 12" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    CIRCLE: `<svg width="36" height="16" viewBox="0 0 36 16" fill="none"><path d="M8 8H32" stroke="currentColor" stroke-width="1.2"/><circle cx="5" cy="8" r="2.5" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>`,
    DIAMOND: `<svg width="36" height="16" viewBox="0 0 36 16" fill="none"><path d="M8.5 8H32" stroke="currentColor" stroke-width="1.2"/><path d="M5 4.5L1.5 8L5 11.5L8.5 8Z" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linejoin="round"/></svg>`,
    SQUARE: `<svg width="36" height="16" viewBox="0 0 36 16" fill="none"><path d="M8 8H32" stroke="currentColor" stroke-width="1.2"/><rect x="2.5" y="5.5" width="5" height="5" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>`,
  },
  end: {
    NONE: `<svg width="36" height="16" viewBox="0 0 36 16" fill="none"><path d="M4 8H32" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>`,
    BAR: `<svg width="36" height="16" viewBox="0 0 36 16" fill="none"><path d="M4 8H32" stroke="currentColor" stroke-width="1.2"/><path d="M32 3.5V12.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>`,
    ARROW: `<svg width="36" height="16" viewBox="0 0 36 16" fill="none"><path d="M4 8H32" stroke="currentColor" stroke-width="1.2"/><path d="M28 4L32 8L28 12" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    CIRCLE: `<svg width="36" height="16" viewBox="0 0 36 16" fill="none"><path d="M4 8H28" stroke="currentColor" stroke-width="1.2"/><circle cx="31" cy="8" r="2.5" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>`,
    DIAMOND: `<svg width="36" height="16" viewBox="0 0 36 16" fill="none"><path d="M4 8H27.5" stroke="currentColor" stroke-width="1.2"/><path d="M31 4.5L27.5 8L31 11.5L34.5 8Z" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linejoin="round"/></svg>`,
    SQUARE: `<svg width="36" height="16" viewBox="0 0 36 16" fill="none"><path d="M4 8H28" stroke="currentColor" stroke-width="1.2"/><rect x="28.5" y="5.5" width="5" height="5" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>`,
  },
};

const LINE_COLOR_OPTIONS = [
  { value: '#000000', label: '#000000' },
  { value: '#EA2039', label: '#EA2039' },
  { value: '#8638E5', label: '#8638E5' },
  { value: '#5F92F3', label: '#5F92F3' },
];

// 피그마 UI3 표준 체크마크 SVG
const CHECK_SVG = (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
    <path
      d="M11.0839 4.22264C11.2371 3.99289 11.5475 3.93082 11.7773 4.08396C12.007 4.23714 12.0691 4.54756 11.916 4.77732L7.91596 10.7773C7.83287 10.902 7.69784 10.9833 7.54877 10.998C7.39988 11.0126 7.25223 10.9593 7.14643 10.8535L4.14643 7.85349C3.9512 7.65823 3.95118 7.34171 4.14643 7.14646C4.34168 6.95122 4.6582 6.95124 4.85346 7.14646L7.42182 9.71482L11.0839 4.22264Z"
      fill="currentColor"
    />
  </svg>
);

// 피그마 표준 16x16 셰브론 SVG
const CHEVRON_SVG = (
  <svg className="figma-dropdown-chevron-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M9.7673 6.76777C9.96256 6.5725 10.28 6.5725 10.4753 6.76777C10.6702 6.96296 10.6702 7.2796 10.4753 7.4748L7.99972 9.94941L5.52511 7.4748C5.32985 7.27953 5.32985 6.96303 5.52511 6.76777C5.72037 6.5725 6.03688 6.5725 6.23214 6.76777L7.99972 8.53534L9.7673 6.76777Z"
      fill="currentColor"
    />
  </svg>
);

/**
 * Connect 섹션 - 피그마 UI3 키트 공식 디자인 완벽 반영
 * (Figma 1027261:5984, 6029, 6009, 6054)
 * - 드롭다운 메뉴: -short 아이콘 사용
 * - 드롭다운 버튼: -short가 빠진 기본(52x16) 아이콘 사용
 */
export function ConnectSection() {
  const { uiState, setUIState, applyCurrentConnectorState, selectedNodes } = useApp();
  const { selectedLinePattern, selectedRoutingType, sourceMagnet, targetMagnet } = uiState;

  // 드롭다운 열림 상태
  const [startTermPopupOpen, setStartTermPopupOpen] = useState(false);
  const [endTermPopupOpen, setEndTermPopupOpen] = useState(false);
  const [colorDropdownOpen, setColorDropdownOpen] = useState(false);

  // 드롭다운 선택 값 상태
  const [startTermVal, setStartTermVal] = useState<ConnectorTerminalType>('NONE');
  const [endTermVal, setEndTermVal] = useState<ConnectorTerminalType>('ARROW');
  const [selectedColor, setSelectedColor] = useState<string>('#000000');

  // 외부 클릭 시 모든 커넥션 드롭다운 닫기
  useEffect(() => {
    function handleDocClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest('#wrap-start-terminal')) {
        setStartTermPopupOpen(false);
      }
      if (!target.closest('#wrap-end-terminal')) {
        setEndTermPopupOpen(false);
      }
      if (!target.closest('#wrap-conn-color')) {
        setColorDropdownOpen(false);
      }
    }
    document.addEventListener('click', handleDocClick);
    return () => document.removeEventListener('click', handleDocClick);
  }, []);

  // 선택된 노드 변경 시 터미널 및 컬러 상태 동기화
  useEffect(() => {
    const count = selectedNodes.length;
    const allConnectors = count > 0 && selectedNodes.every(n => n && n.isConnector);
    if (!allConnectors) return;

    if (count > 1) {
      const startTerms = selectedNodes.map(n => n.connectorStartTerminal).filter(Boolean);
      const endTerms = selectedNodes.map(n => n.connectorEndTerminal).filter(Boolean);
      if (startTerms.length > 0) {
        const allSame = startTerms.every(t => t === startTerms[0]);
        const val = (allSame ? startTerms[0] : 'MIXED') as ConnectorTerminalType;
        setStartTermVal(val);
        const sel = document.getElementById('select-start-terminal') as HTMLSelectElement | null;
        if (sel) sel.value = val;
      }
      if (endTerms.length > 0) {
        const allSame = endTerms.every(t => t === endTerms[0]);
        const val = (allSame ? endTerms[0] : 'MIXED') as ConnectorTerminalType;
        setEndTermVal(val);
        const sel = document.getElementById('select-end-terminal') as HTMLSelectElement | null;
        if (sel) sel.value = val;
      }
    } else if (count === 1) {
      const node = selectedNodes[0];
      if (node.connectorStartTerminal) {
        setStartTermVal(node.connectorStartTerminal as ConnectorTerminalType);
        const sel = document.getElementById('select-start-terminal') as HTMLSelectElement | null;
        if (sel) sel.value = node.connectorStartTerminal;
      }
      if (node.connectorEndTerminal) {
        setEndTermVal(node.connectorEndTerminal as ConnectorTerminalType);
        const sel = document.getElementById('select-end-terminal') as HTMLSelectElement | null;
        if (sel) sel.value = node.connectorEndTerminal;
      }
      if (node.connectorColorHex) {
        setSelectedColor(node.connectorColorHex);
        const colSel = document.getElementById('conn-line-color') as HTMLSelectElement | null;
        if (colSel) colSel.value = node.connectorColorHex;
      }
    }
  }, [selectedNodes]);

  function selectLinePattern(pattern: string, el: HTMLElement | null = null) {
    setUIState({ selectedLinePattern: pattern });
    document.querySelectorAll('.line-style-btn').forEach(b => b.classList.remove('active'));
    if (!el) {
      document.querySelectorAll('.line-style-btn').forEach(b => {
        const onclick = b.getAttribute('onclick') || '';
        if (onclick.includes(`'${pattern}'`)) b.classList.add('active');
      });
    } else {
      el.classList.add('active');
    }
    setTimeout(() => applyCurrentConnectorState(), 0);
  }

  function selectRoutingType(type: string) {
    setUIState({ selectedRoutingType: type });
    setTimeout(() => applyCurrentConnectorState(), 0);
  }

  function selectAnchor(nodeIndex: 1 | 2, pos: string) {
    document.querySelectorAll(`.anchor-handle[data-node="${nodeIndex}"]`).forEach(h => h.classList.remove('active'));
    document.querySelector(`.anchor-handle[data-node="${nodeIndex}"][data-pos="${pos}"]`)?.classList.add('active');
    if (nodeIndex === 1) setUIState({ sourceMagnet: pos });
    if (nodeIndex === 2) setUIState({ targetMagnet: pos });
    setTimeout(() => applyCurrentConnectorState(), 0);
  }

  function selectTerminal(side: 'start' | 'end', value: ConnectorTerminalType) {
    const selectEl = document.getElementById(`select-${side}-terminal`) as HTMLSelectElement | null;
    if (selectEl) selectEl.value = value;

    if (side === 'start') {
      setStartTermVal(value);
      setStartTermPopupOpen(false);
    } else {
      setEndTermVal(value);
      setEndTermPopupOpen(false);
    }
    if (value !== 'MIXED') setTimeout(() => applyCurrentConnectorState(), 0);
  }

  function selectColor(colorHex: string) {
    setSelectedColor(colorHex);
    setColorDropdownOpen(false);
    const selectEl = document.getElementById('conn-line-color') as HTMLSelectElement | null;
    if (selectEl) selectEl.value = colorHex;
    setTimeout(() => applyCurrentConnectorState(), 0);
  }

  // 드롭다운 버튼 전용 그래픽: "-short"가 빠진 기본(52x16) 아이콘 사용
  function renderTerminalButtonGraphic(side: 'start' | 'end', val: ConnectorTerminalType) {
    if (val === 'MIXED') {
      return (
        <span
          className="phase-dash-icon"
          style={{ background: 'currentColor', display: 'inline-block', margin: 'auto' }}
        />
      );
    }
    const opt: TerminalOption = (val as TerminalOption) in TERMINAL_SVGS_BTN[side]
      ? (val as TerminalOption)
      : (side === 'start' ? 'NONE' : 'ARROW');
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          maxWidth: '52px',
          height: '16px',
        }}
        dangerouslySetInnerHTML={{ __html: TERMINAL_SVGS_BTN[side][opt] }}
      />
    );
  }

  const ROUTING_TYPES = [
    { type: 'ORTHOGONAL', title: '직각 (Orthogonal)', svg: '<g clip-path="url(#clip_orth)"><path d="M11.4999 18.1H5.8999V17.1H10.9999V6.40002C10.9999 6.12002 11.2199 5.90002 11.4999 5.90002H17.0999V6.90002H11.9999V17.6C11.9999 17.88 11.7799 18.1 11.4999 18.1Z" fill="currentColor"/></g><defs><clipPath id="clip_orth"><rect width="11.2" height="12.2" fill="white" transform="translate(5.8999 5.90002)"/></clipPath></defs>' },
    { type: 'S_CURVE', title: 'S자 곡선 (S-curve)', svg: '<g clip-path="url(#clip_sc)"><path d="M9.1999 18.1H6.3999C6.1199 18.1 5.8999 17.88 5.8999 17.6C5.8999 17.32 6.1199 17.1 6.3999 17.1H9.1999C10.4699 17.1 11.4999 16.07 11.4999 14.8V9.20002C11.4999 7.38002 12.9799 5.90002 14.7999 5.90002H17.5999C17.8799 5.90002 18.0999 6.12002 18.0999 6.40002C18.0999 6.68002 17.8799 6.90002 17.5999 6.90002H14.7999C13.5299 6.90002 12.4999 7.93002 12.4999 9.20002V14.8C12.4999 16.62 11.0199 18.1 9.1999 18.1Z" fill="currentColor"/></g><defs><clipPath id="clip_sc"><rect width="12.2" height="12.2" fill="white" transform="translate(5.8999 5.90002)"/></clipPath></defs>' },
    { type: 'CURVED', title: '부드러운 곡선 (Curve)', svg: '<g clip-path="url(#clip_cv)"><path d="M6.3999 18.1C6.1299 18.1 5.8999 17.88 5.8999 17.61C5.8999 17.33 6.1199 17.11 6.3999 17.1C10.4799 17.06 10.9599 14.69 11.5099 11.94C12.0699 9.17002 12.7099 6.02002 17.5899 5.90002H17.5999C17.8699 5.90002 18.0899 6.12002 18.0999 6.39002C18.0999 6.67002 17.8899 6.90002 17.6099 6.90002C13.5299 7.00002 13.0399 9.38002 12.4899 12.14C11.9299 14.91 11.2899 18.05 6.4099 18.1H6.3999Z" fill="currentColor"/></g><defs><clipPath id="clip_cv"><rect width="12.2" height="12.2" fill="white" transform="translate(5.8999 5.90002)"/></clipPath></defs>' },
    { type: 'STRAIGHT', title: '직선 (Straight)', svg: '<path d="M17.2714 6.02145C17.4667 5.82618 17.7832 5.82618 17.9785 6.02145C18.1737 6.21671 18.1737 6.53322 17.9785 6.72848L6.72848 17.9785C6.53322 18.1737 6.21671 18.1737 6.02145 17.9785C5.82618 17.7832 5.82618 17.4667 6.02145 17.2714L17.2714 6.02145Z" fill="currentColor"/>' },
  ];

  return (
    <div className="section-block">
      <div className="section-header">
        <span className="section-title">Connect</span>
      </div>
      <div className="section-body">
        {/* 색상 + 선 패턴 */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {/* 표준 피그마 컬러 드롭다운 */}
          <div className="figma-dropdown-wrapper" id="wrap-conn-color" style={{ width: '110px', flexShrink: 0 }}>
            <button
              type="button"
              id="btn-conn-line-color"
              className={`figma-dropdown-btn${colorDropdownOpen ? ' active' : ''}`}
              title="Line color"
              onClick={(e) => {
                e.stopPropagation();
                setColorDropdownOpen(!colorDropdownOpen);
                setStartTermPopupOpen(false);
                setEndTermPopupOpen(false);
              }}
            >
              <div className="figma-dropdown-btn-content">
                <span
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '3px',
                    backgroundColor: selectedColor,
                    border: '1px solid rgba(0, 0, 0, 0.15)',
                    display: 'inline-block',
                    flexShrink: 0,
                    marginLeft: '4px',
                    marginRight: '2px',
                  }}
                />
                <span className="figma-dropdown-current-text" style={{ fontSize: '11px', fontWeight: 500 }}>
                  {selectedColor}
                </span>
              </div>
              <span
                style={{
                  transform: colorDropdownOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {CHEVRON_SVG}
              </span>
            </button>

            {/* 외부 스크립트 호환용 숨겨진 select */}
            <select
              id="conn-line-color"
              style={{ display: 'none' }}
              value={selectedColor}
              onChange={(e) => selectColor(e.target.value)}
            >
              {LINE_COLOR_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.value}
                </option>
              ))}
            </select>

            {/* 표준 피그마 드롭다운 메뉴 */}
            {colorDropdownOpen && (
              <div
                className="figma-dropdown-menu active"
                id="popup-conn-line-color"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  left: 0,
                  right: 'auto',
                  width: '130px',
                  padding: '6px',
                  zIndex: 1050,
                }}
              >
                {LINE_COLOR_OPTIONS.map((c) => {
                  const isSelected = selectedColor.toUpperCase() === c.value.toUpperCase();
                  return (
                    <div
                      key={c.value}
                      className={`figma-dropdown-item${isSelected ? ' selected' : ''}`}
                      style={{ width: '100%' }}
                      onClick={() => selectColor(c.value)}
                    >
                      <span className="figma-dropdown-check-slot" style={{ width: '18px' }}>
                        {isSelected && CHECK_SVG}
                      </span>
                      <span
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '3px',
                          backgroundColor: c.value,
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          display: 'inline-block',
                          marginRight: '6px',
                          flexShrink: 0,
                        }}
                      />
                      <span className="figma-dropdown-label">{c.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="line-style-segment" style={{ flex: 1 }}>
            {[
              { pattern: 'SOLID', title: 'Solid', path: 'M18.5 11C18.7761 11 19 11.2239 19 11.5C19 11.7761 18.7761 12 18.5 12H5.5C5.22386 12 5 11.7761 5 11.5C5 11.2239 5.22386 11 5.5 11H18.5Z' },
              { pattern: 'DASHED', title: 'Dashed', path: 'M7.5 12C7.77614 12 8 12.2239 8 12.5C8 12.7761 7.77614 13 7.5 13H5.5C5.22386 13 5 12.7761 5 12.5C5 12.2239 5.22386 12 5.5 12H7.5ZM13 12C13.2761 12 13.5 12.2239 13.5 12.5C13.5 12.7761 13.2761 13 13 13H11C10.7239 13 10.5 12.7761 10.5 12.5C10.5 12.2239 10.7239 12 11 12H13ZM18.5 12C18.7761 12 19 12.2239 19 12.5C19 12.7761 18.7761 13 18.5 13H16.5C16.2239 13 16 12.7761 16 12.5C16 12.2239 16.2239 12 16.5 12H18.5Z' },
            ].map(({ pattern, title, path }) => (
              <button key={pattern}
                className={`line-style-btn${selectedLinePattern === pattern ? ' active' : ''}`}
                title={title}
                onClick={e => selectLinePattern(pattern, e.currentTarget)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d={path} fill="currentColor"/></svg>
              </button>
            ))}
            <button
              className={`line-style-btn${selectedLinePattern === 'DOTTED' ? ' active' : ''}`}
              title="Dotted"
              onClick={e => selectLinePattern('DOTTED', e.currentTarget)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="6" cy="12" r="1.2" fill="currentColor"/>
                <circle cx="9" cy="12" r="1.2" fill="currentColor"/>
                <circle cx="12" cy="12" r="1.2" fill="currentColor"/>
                <circle cx="15" cy="12" r="1.2" fill="currentColor"/>
                <circle cx="18" cy="12" r="1.2" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>

        {/* 앵커 연결 캔버스 */}
        <div className="connect-canvas-box" id="conn-anchor-preview-box">
          <div className="node-preview-card" id="preview-node-1">
            {(['TOP', 'RIGHT', 'BOTTOM', 'LEFT'] as const).map(pos => (
              <div key={pos}
                className={`anchor-handle anchor-${pos.toLowerCase()}${sourceMagnet === pos ? ' active' : ''}`}
                data-node="1" data-pos={pos}
                onClick={() => selectAnchor(1, pos)} />
            ))}
            <span id="preview-node-1-text">Node 1</span>
          </div>
          <div className="node-preview-card" id="preview-node-2">
            {(['TOP', 'RIGHT', 'BOTTOM', 'LEFT'] as const).map(pos => (
              <div key={pos}
                className={`anchor-handle anchor-${pos.toLowerCase()}${targetMagnet === pos ? ' active' : ''}`}
                data-node="2" data-pos={pos}
                onClick={() => selectAnchor(2, pos)} />
            ))}
            <span id="preview-node-2-text">Node 2</span>
          </div>
        </div>

        {/* 두께 + 라우팅 */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <div className="input-scrubber-box" style={{ width: '70px' }}>
            <svg data-tooltip="Stroke width" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M17.25 14C17.6642 14 18 14.3358 18 14.75V17.25C18 17.6642 17.6642 18 17.25 18H6.75C6.33579 18 6 17.6642 6 17.25V14.75C6 14.3358 6.33579 14 6.75 14H17.25ZM7 17H17V15H7V17ZM17.25 9C17.6642 9 18 9.33579 18 9.75V11.25C18 11.6642 17.6642 12 17.25 12H6.75C6.33579 12 6 11.6642 6 11.25V9.75C6 9.33579 6.33579 9 6.75 9H17.25ZM7 11H17V10H7V11ZM17.5 6C17.7761 6 18 6.22386 18 6.5C18 6.77614 17.7761 7 17.5 7H6.5C6.22386 7 6 6.77614 6 6.5C6 6.22386 6.22386 6 6.5 6H17.5Z" fill="currentColor"/></svg>
            <input type="number" id="input-stroke-weight" defaultValue={1.5} step={0.5} min={1} max={10}
              onBlur={() => applyCurrentConnectorState()}
              onKeyDown={e => e.key === 'Enter' && applyCurrentConnectorState()} />
          </div>
          <div className="routing-types-grid" style={{ flex: 1 }}>
            {ROUTING_TYPES.map(r => (
              <button key={r.type}
                className={`routing-btn${selectedRoutingType === r.type ? ' active' : ''}`}
                title={r.title}
                onClick={() => selectRoutingType(r.type)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" dangerouslySetInnerHTML={{ __html: r.svg }} />
              </button>
            ))}
          </div>
        </div>

        {/* 단자 + 오프셋 */}
        <div className="terminal-offset-row">
          <div className="input-scrubber-box" style={{ width: '70px' }}>
            <input type="number" id="input-start-offset" placeholder="Offset" defaultValue={0} />
          </div>

          {/* 시작 단자 (Start Terminal) */}
          <div className="figma-dropdown-wrapper" id="wrap-start-terminal" style={{ width: '100%' }}>
            {/* 드롭다운 버튼: -short가 빠진 기본(52x16) 아이콘 사용 */}
            <button
              type="button"
              id="btn-start-terminal"
              className={`figma-dropdown-btn${startTermPopupOpen ? ' active' : ''}`}
              title="Start terminal"
              style={{ padding: '0 4px 0 6px' }}
              onClick={(e) => {
                e.stopPropagation();
                setStartTermPopupOpen(!startTermPopupOpen);
                setEndTermPopupOpen(false);
                setColorDropdownOpen(false);
              }}
            >
              <div className="figma-dropdown-btn-content" style={{ justifyContent: 'center' }}>
                <span id="icon-start-terminal" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                  {renderTerminalButtonGraphic('start', startTermVal)}
                </span>
              </div>
              <span
                style={{
                  transform: startTermPopupOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {CHEVRON_SVG}
              </span>
            </button>

            {/* 외부 스크립트 호환용 숨겨진 select */}
            <select id="select-start-terminal" style={{ display: 'none' }} value={startTermVal} onChange={() => {}}>
              {['MIXED', 'NONE', 'BAR', 'ARROW', 'CIRCLE', 'DIAMOND', 'SQUARE'].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>

            {/* 드롭다운 메뉴: -short(36x16) 아이콘 사용 (Figma 1027261:5984 / 6009) */}
            {startTermPopupOpen && (
              <div
                className="terminal-ui3-menu"
                id="popup-start-terminal"
                style={{
                  position: 'absolute',
                  bottom: 'calc(100% + 4px)',
                  top: 'auto',
                  left: 0,
                  right: 'auto',
                  width: '76px',
                  background: '#1e1e1e',
                  borderRadius: '13px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
                  padding: '5px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  zIndex: 1050,
                  boxSizing: 'border-box',
                }}
              >
                {/* 1027261:5984 Mixed 상태 헤더 */}
                {startTermVal === 'MIXED' && (
                  <>
                    <div
                      className="terminal-ui3-item selected"
                      style={{
                        width: '100%',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        padding: '0 4px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 500,
                        userSelect: 'none',
                      }}
                      onClick={() => selectTerminal('start', 'MIXED')}
                    >
                      <span style={{ width: '12px', height: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {CHECK_SVG}
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: 500, color: '#ffffff' }}>Mixed</span>
                    </div>
                    <hr style={{ margin: '3px 0', border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.1)', width: '100%' }} />
                  </>
                )}

                {/* 6개 단자 옵션: -short 아이콘 사용 */}
                {TERMINAL_OPTIONS.map((opt) => {
                  const isSelected = startTermVal === opt;
                  return (
                    <div
                      key={opt}
                      className={`terminal-ui3-item${isSelected ? ' selected' : ''}`}
                      style={{
                        width: '100%',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 4px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        color: '#ffffff',
                        userSelect: 'none',
                        boxSizing: 'border-box',
                        transition: 'background 0.12s',
                      }}
                      onClick={() => selectTerminal('start', opt)}
                    >
                      {/* 선택 체크마크 슬롯 */}
                      <span style={{ width: '12px', height: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: isSelected ? 1 : 0 }}>
                        {CHECK_SVG}
                      </span>
                      {/* 중앙 단자 그래픽: -short(36x16) 아이콘 */}
                      <span
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 1, height: '16px' }}
                        dangerouslySetInnerHTML={{ __html: TERMINAL_SVGS_SHORT.start[opt] }}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 끝 단자 (End Terminal) */}
          <div className="figma-dropdown-wrapper" id="wrap-end-terminal" style={{ width: '100%' }}>
            {/* 드롭다운 버튼: -short가 빠진 기본(52x16) 아이콘 사용 */}
            <button
              type="button"
              id="btn-end-terminal"
              className={`figma-dropdown-btn${endTermPopupOpen ? ' active' : ''}`}
              title="End terminal"
              style={{ padding: '0 4px 0 6px' }}
              onClick={(e) => {
                e.stopPropagation();
                setEndTermPopupOpen(!endTermPopupOpen);
                setStartTermPopupOpen(false);
                setColorDropdownOpen(false);
              }}
            >
              <div className="figma-dropdown-btn-content" style={{ justifyContent: 'center' }}>
                <span id="icon-end-terminal" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                  {renderTerminalButtonGraphic('end', endTermVal)}
                </span>
              </div>
              <span
                style={{
                  transform: endTermPopupOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {CHEVRON_SVG}
              </span>
            </button>

            {/* 외부 스크립트 호환용 숨겨진 select */}
            <select id="select-end-terminal" style={{ display: 'none' }} value={endTermVal} onChange={() => {}}>
              {['MIXED', 'NONE', 'BAR', 'ARROW', 'CIRCLE', 'DIAMOND', 'SQUARE'].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>

            {/* 드롭다운 메뉴: -short(36x16) 아이콘 사용 (Figma 1027261:6029 / 6054) */}
            {endTermPopupOpen && (
              <div
                className="terminal-ui3-menu"
                id="popup-end-terminal"
                style={{
                  position: 'absolute',
                  bottom: 'calc(100% + 4px)',
                  top: 'auto',
                  left: 'auto',
                  right: 0,
                  width: '76px',
                  background: '#1e1e1e',
                  borderRadius: '13px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
                  padding: '5px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  zIndex: 1050,
                  boxSizing: 'border-box',
                }}
              >
                {/* 1027261:6029 Mixed 상태 헤더 */}
                {endTermVal === 'MIXED' && (
                  <>
                    <div
                      className="terminal-ui3-item selected"
                      style={{
                        width: '100%',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        padding: '0 4px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 500,
                        userSelect: 'none',
                      }}
                      onClick={() => selectTerminal('end', 'MIXED')}
                    >
                      <span style={{ width: '12px', height: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {CHECK_SVG}
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: 500, color: '#ffffff' }}>Mixed</span>
                    </div>
                    <hr style={{ margin: '3px 0', border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.1)', width: '100%' }} />
                  </>
                )}

                {/* 6개 단자 옵션: -short 아이콘 사용 */}
                {TERMINAL_OPTIONS.map((opt) => {
                  const isSelected = endTermVal === opt;
                  return (
                    <div
                      key={opt}
                      className={`terminal-ui3-item${isSelected ? ' selected' : ''}`}
                      style={{
                        width: '100%',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 4px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        color: '#ffffff',
                        userSelect: 'none',
                        boxSizing: 'border-box',
                        transition: 'background 0.12s',
                      }}
                      onClick={() => selectTerminal('end', opt)}
                    >
                      {/* 선택 체크마크 슬롯 */}
                      <span style={{ width: '12px', height: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: isSelected ? 1 : 0 }}>
                        {CHECK_SVG}
                      </span>
                      {/* 중앙 단자 그래픽: -short(36x16) 아이콘 */}
                      <span
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 1, height: '16px' }}
                        dangerouslySetInnerHTML={{ __html: TERMINAL_SVGS_SHORT.end[opt] }}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 끝 오프셋 */}
          <div className="input-scrubber-box" style={{ width: '70px' }}>
            <input type="number" id="input-end-offset" placeholder="Offset" defaultValue={0} />
          </div>
        </div>
      </div>
    </div>
  );
}
