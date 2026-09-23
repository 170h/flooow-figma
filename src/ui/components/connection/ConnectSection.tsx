import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';

// ============================================================
// Terminal 아이콘 SVG 데이터
// ============================================================

const TERMINAL_ICONS_BTN: Record<string, Record<string, string>> = {
  start: {
    MIXED: `<span class="phase-dash-icon" style="background:currentColor;display:inline-block;margin:auto;"></span>`,
    NONE: `<svg width="52" height="16" viewBox="0 0 52 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M51.5 8.5H0.5C0.22 8.5 0 8.28 0 8C0 7.72 0.22 7.5 0.5 7.5H51.5C51.78 7.5 52 7.72 52 8C52 8.28 51.78 8.5 51.5 8.5Z" fill="currentColor"/></svg>`,
    ARROW: `<svg width="52" height="16" viewBox="0 0 52 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M51.5 7.49999H1.71L4.6 4.59999C4.8 4.39999 4.8 4.08999 4.6 3.88999C4.4 3.68999 4.09 3.68999 3.89 3.88999L0.15 7.64999C-0.05 7.84999 -0.05 8.15999 0.15 8.35999L3.9 12.11C4 12.21 4.13 12.26 4.25 12.26C4.37 12.26 4.51 12.21 4.6 12.11C4.8 11.91 4.8 11.6 4.6 11.4L1.7 8.49999H51.5C51.78 8.49999 52 8.26999 52 7.99999C52 7.72999 51.78 7.49999 51.5 7.49999Z" fill="currentColor"/></svg>`,
    TRIANGLE_ARROW: `<svg width="52" height="16" viewBox="0 0 52 16" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#sb_ta)"><path d="M5.46814 5.10914C5.92528 4.84248 6.49939 5.17269 6.49939 5.70192V8.00758H51.5004C51.7763 8.00782 52.0004 8.23158 52.0004 8.50758C52.0001 8.78337 51.7762 9.00734 51.5004 9.00758H6.49939V11.3132C6.49913 11.8092 5.9947 12.1306 5.55506 11.949L5.46814 11.906L0.657595 9.10035C0.204355 8.83578 0.20458 8.17957 0.657595 7.91481L5.46814 5.10914ZM1.62732 8.50758L5.49939 10.7664V6.24781L1.62732 8.50758Z" fill="currentColor"/></g><defs><clipPath id="sb_ta"><rect width="52" height="16" fill="white"/></clipPath></defs></svg>`,
    REVERSED_TRIANGLE_ARROW: `<svg width="52" height="16" viewBox="0 0 52 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 5.68769C0 5.15847 0.574114 4.82826 1.03125 5.09492L5.8418 7.90059C5.88887 7.92807 5.93047 7.96026 5.96777 7.99531C5.97846 7.99463 5.98914 7.99238 6 7.99238H51.5C51.7761 7.99238 51.9999 8.21634 52 8.49238C52 8.76852 51.7761 8.99238 51.5 8.99238H6C5.98911 8.99238 5.97849 8.98916 5.96777 8.98848C5.93018 9.02394 5.88937 9.05838 5.8418 9.08613L1.03125 11.8918L0.944336 11.9348C0.504762 12.1162 0.000329443 11.7949 0 11.299V5.68769ZM1 10.7521L4.87207 8.49336L1 6.23359V10.7521Z" fill="currentColor"/></svg>`,
    CIRCLE: `<svg width="52" height="16" viewBox="0 0 52 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.5 4.5C5.2642 4.5 6.72245 5.80543 6.96387 7.50293C6.97584 7.50207 6.98781 7.5 7 7.5H51.5C51.7761 7.5 52 7.72386 52 8C52 8.27611 51.7761 8.5 51.5 8.5H7C6.98779 8.5 6.97586 8.49695 6.96387 8.49609C6.72286 10.1941 5.26453 11.5 3.5 11.5C1.567 11.5 0 9.933 0 8C0 6.067 1.567 4.5 3.5 4.5ZM3.5 5.5C2.11929 5.5 1 6.61929 1 8C1 9.38071 2.11929 10.5 3.5 10.5C4.88071 10.5 6 9.38071 6 8C6 6.61929 4.88071 5.5 3.5 5.5Z" fill="currentColor"/></svg>`,
    DIAMOND: `<svg width="52" height="16" viewBox="0 0 52 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.29294 4.70706C3.68345 4.31664 4.3165 4.31664 4.707 4.70706L7.49997 7.50003H51.5C51.776 7.50011 52 7.72394 52 8.00003C51.9999 8.27605 51.776 8.49995 51.5 8.50003H7.49997L4.707 11.293C4.34096 11.659 3.76185 11.6815 3.36911 11.3614L3.29294 11.293L0.707002 8.70706C0.316578 8.31656 0.316579 7.68351 0.707002 7.293L3.29294 4.70706ZM1.41403 8.00003L3.99997 10.586L6.58591 8.00003L3.99997 5.4141L1.41403 8.00003Z" fill="currentColor"/></svg>`,
  },
  end: {
    MIXED: `<span class="phase-dash-icon" style="background:currentColor;display:inline-block;margin:auto;"></span>`,
    NONE: `<svg width="52" height="16" viewBox="0 0 52 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M51.5 9H0.5C0.22 9 0 8.78 0 8.5C0 8.22 0.22 8 0.5 8H51.5C51.78 8 52 8.22 52 8.5C52 8.78 51.78 9 51.5 9Z" fill="currentColor"/></svg>`,
    ARROW: `<svg width="52" height="16" viewBox="0 0 52 16" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#eb_a)"><path d="M0.5 8.50001L50.29 8.50001L47.4 11.4C47.2 11.6 47.2 11.91 47.4 12.11C47.6 12.31 47.91 12.31 48.11 12.11L51.85 8.35001C52.05 8.15001 52.05 7.84001 51.85 7.64001L48.1 3.89001C48 3.79001 47.87 3.74001 47.75 3.74001C47.63 3.74001 47.49 3.79001 47.4 3.89001C47.2 4.09001 47.2 4.40001 47.4 4.60001L50.3 7.50001L0.5 7.50001C0.22 7.50001 0 7.73 0 8C0 8.27001 0.22 8.50001 0.5 8.50001Z" fill="currentColor"/></g><defs><clipPath id="eb_a"><rect width="52" height="16" fill="white"/></clipPath></defs></svg>`,
    TRIANGLE_ARROW: `<svg width="52" height="16" viewBox="0 0 52 16" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#eb_ta)"><path d="M46.5319 11.8909C46.0747 12.1575 45.5006 11.8273 45.5006 11.2981V8.99242L0.499632 8.99242C0.223691 8.99218 -0.000368451 8.76842 -0.000368451 8.49242C-0.000126574 8.21663 0.22384 7.99266 0.499632 7.99242L45.5006 7.99242V5.68676C45.5009 5.1908 46.0053 4.86943 46.4449 5.05101L46.5319 5.09398L51.3424 7.89965C51.7956 8.16422 51.7954 8.82043 51.3424 9.08519L46.5319 11.8909ZM50.3727 8.49242L46.5006 6.23363V10.7522L50.3727 8.49242Z" fill="currentColor"/></g><defs><clipPath id="eb_ta"><rect width="52" height="16" fill="white"/></clipPath></defs></svg>`,
    REVERSED_TRIANGLE_ARROW: `<svg width="52" height="16" viewBox="0 0 52 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M52 11.2981C52 11.8273 51.4259 12.1575 50.9688 11.8909L46.1582 9.08519C46.1111 9.05771 46.0695 9.02552 46.0322 8.99047C46.0215 8.99115 46.0109 8.9934 46 8.9934L0.5 8.9934C0.223931 8.9934 0.000117217 8.76944 0 8.4934C0 8.21725 0.223859 7.9934 0.5 7.9934L46 7.9934C46.0109 7.9934 46.0215 7.99662 46.0322 7.9973C46.0698 7.96184 46.1106 7.9274 46.1582 7.89965L50.9688 5.09398L51.0557 5.05101C51.4952 4.8696 51.9997 5.19092 52 5.68676V11.2981ZM51 6.23363L47.1279 8.49242L51 10.7522V6.23363Z" fill="currentColor"/></svg>`,
    CIRCLE: `<svg width="52" height="16" viewBox="0 0 52 16" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#eb_c)"><path d="M48.5 11.5C46.7358 11.5 45.2776 10.1946 45.0361 8.49707C45.0242 8.49793 45.0122 8.5 45 8.5L0.500001 8.49999C0.223859 8.49999 0 8.27613 0 7.99999C3.3643e-05 7.72388 0.22388 7.49999 0.500001 7.49999L45 7.5C45.0122 7.5 45.0241 7.50304 45.0361 7.50391C45.2771 5.80594 46.7355 4.5 48.5 4.5C50.433 4.5 52 6.067 52 8C52 9.933 50.433 11.5 48.5 11.5ZM48.5 10.5C49.8807 10.5 51 9.38071 51 8C51 6.61929 49.8807 5.5 48.5 5.5C47.1193 5.5 46 6.61929 46 8C46 9.38071 47.1193 10.5 48.5 10.5Z" fill="currentColor"/></g><defs><clipPath id="eb_c"><rect width="52" height="16" fill="white"/></clipPath></defs></svg>`,
    DIAMOND: `<svg width="52" height="16" viewBox="0 0 52 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M47.293 4.69229C47.659 4.32662 48.2382 4.30408 48.6309 4.62393L48.707 4.69229L51.293 7.27823C51.6833 7.66865 51.6832 8.30177 51.293 8.69229L48.707 11.2782C48.3165 11.6687 47.6835 11.6687 47.293 11.2782L44.5 8.48526H0.5C0.223928 8.48518 0 8.26135 0 7.98526C0.000344652 7.70946 0.224141 7.48534 0.5 7.48526H44.5L47.293 4.69229ZM45.4141 7.98526L48 10.5712L50.5859 7.98526L48 5.39932L45.4141 7.98526Z" fill="currentColor"/></svg>`,
  },
};

const TERMINAL_OPTIONS = ['NONE', 'ARROW', 'TRIANGLE_ARROW', 'REVERSED_TRIANGLE_ARROW', 'CIRCLE', 'DIAMOND'] as const;
type TerminalValue = typeof TERMINAL_OPTIONS[number] | 'MIXED';

/**
 * Connect 섹션 - 색상/선패턴, 앵커 캔버스, 두께/라우팅, 터미널 드롭다운
 */
export function ConnectSection() {
  const { uiState, setUIState, applyCurrentConnectorState } = useApp();
  const { selectedLinePattern, selectedRoutingType, sourceMagnet, targetMagnet } = uiState;
  const [startTermPopupOpen, setStartTermPopupOpen] = React.useState(false);
  const [endTermPopupOpen, setEndTermPopupOpen] = React.useState(false);
  const [startTermVal, setStartTermVal] = React.useState<TerminalValue>('NONE');
  const [endTermVal, setEndTermVal] = React.useState<TerminalValue>('ARROW');

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

  function selectTerminal(side: 'start' | 'end', value: TerminalValue) {
    const selectEl = document.getElementById(`select-${side}-terminal`) as HTMLSelectElement | null;
    if (selectEl) selectEl.value = value;
    const iconEl = document.getElementById(`icon-${side}-terminal`);
    if (iconEl && TERMINAL_ICONS_BTN[side]?.[value]) {
      iconEl.innerHTML = TERMINAL_ICONS_BTN[side][value];
    }
    if (side === 'start') {
      setStartTermVal(value);
      setStartTermPopupOpen(false);
    } else {
      setEndTermVal(value);
      setEndTermPopupOpen(false);
    }
    if (value !== 'MIXED') setTimeout(() => applyCurrentConnectorState(), 0);
  }

  useEffect(() => {
    // 초기 터미널 아이콘 렌더링
    const startIconEl = document.getElementById('icon-start-terminal');
    const endIconEl = document.getElementById('icon-end-terminal');
    if (startIconEl) startIconEl.innerHTML = TERMINAL_ICONS_BTN.start.NONE;
    if (endIconEl) endIconEl.innerHTML = TERMINAL_ICONS_BTN.end.ARROW;
  }, []);

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
          <select id="conn-line-color" className="select-dropdown-box" style={{ width: '110px' }}
            onChange={() => setTimeout(() => applyCurrentConnectorState(), 0)}>
            <option value="#EA2039">■ EA2039</option>
            <option value="#8638E5">■ 8638E5</option>
            <option value="#000000">■ 000000</option>
            <option value="#5F92F3">■ 5F92F3</option>
          </select>
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

          {/* 시작 단자 */}
          <div className="terminal-dropdown-wrap" id="wrap-start-terminal">
            <button className="terminal-dropdown-btn" id="btn-start-terminal"
              title="Start terminal"
              onClick={e => { e.stopPropagation(); setStartTermPopupOpen(!startTermPopupOpen); setEndTermPopupOpen(false); }}>
              <span id="icon-start-terminal" className="td-btn-icon" />
              <svg className="td-chevron" width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M2 3L4 5L6 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <select id="select-start-terminal" style={{ display: 'none' }}>
              {['MIXED', 'NONE', 'ARROW', 'TRIANGLE_ARROW', 'REVERSED_TRIANGLE_ARROW', 'CIRCLE', 'DIAMOND'].map(v => (
                <option key={v} value={v}>{v.replace(/_/g, ' ')}</option>
              ))}
            </select>
            {startTermPopupOpen && (
              <div className="terminal-dropdown-popup open" id="popup-start-terminal"
                style={{ position: 'fixed', bottom: '60px', left: '20px', zIndex: 1000 }}>
                {TERMINAL_OPTIONS.map(val => (
                  <div key={val}
                    className={`terminal-popup-item${startTermVal === val ? ' selected' : ''}`}
                    data-value={val}
                    onClick={() => selectTerminal('start', val)}>
                    <span className="td-item-icon" id={`td-item-icon-start-${val}`}
                      dangerouslySetInnerHTML={{ __html: TERMINAL_ICONS_BTN.start[val] || '' }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 끝 단자 */}
          <div className="terminal-dropdown-wrap" id="wrap-end-terminal">
            <button className="terminal-dropdown-btn" id="btn-end-terminal"
              title="End terminal"
              onClick={e => { e.stopPropagation(); setEndTermPopupOpen(!endTermPopupOpen); setStartTermPopupOpen(false); }}>
              <span id="icon-end-terminal" className="td-btn-icon" />
              <svg className="td-chevron" width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M2 3L4 5L6 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <select id="select-end-terminal" style={{ display: 'none' }}>
              {['MIXED', 'NONE', 'ARROW', 'TRIANGLE_ARROW', 'REVERSED_TRIANGLE_ARROW', 'CIRCLE', 'DIAMOND'].map(v => (
                <option key={v} value={v}>{v.replace(/_/g, ' ')}</option>
              ))}
            </select>
            {endTermPopupOpen && (
              <div className="terminal-dropdown-popup open" id="popup-end-terminal"
                style={{ position: 'fixed', bottom: '60px', right: '20px', zIndex: 1000 }}>
                {TERMINAL_OPTIONS.map(val => (
                  <div key={val}
                    className={`terminal-popup-item${endTermVal === val ? ' selected' : ''}`}
                    data-value={val}
                    onClick={() => selectTerminal('end', val)}>
                    <span className="td-item-icon" id={`td-item-icon-end-${val}`}
                      dangerouslySetInnerHTML={{ __html: TERMINAL_ICONS_BTN.end[val] || '' }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
