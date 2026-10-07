import React, { useState, useEffect, useRef } from 'react';
import { t } from "../../../i18n";
import {
  SCREEN_NODE_CONSTRAINTS,
  clampScreenWidth,
  clampScreenHeight,
  clampScreenCornerRadius,
} from '../../../domain/nodeDomain';

// ============================================================
// Props 정의 — useApp() 의존성 없이 완전 독립 컴포넌트
// ============================================================
interface SizeModalProps {
  mode: 'add' | 'edit';
  initialName?: string;
  initialW?: number;
  initialH?: number;
  initialRadius?: number;
  initialSizeMode?: 'fixed' | 'hug' | 'fit';
  /** 저장 시 호출 - 프리셋 데이터 전달 */
  onSave: (preset: {
    name: string;
    w: number;
    h: number;
    radius: number;
    sizeMode: 'fixed' | 'hug' | 'fit';
  }) => void;
  onClose: () => void;
}

// ============================================================
// 아이콘 상수 (피그마 UI3 공식 24x24px)
// ============================================================

const FIXED_SVG = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M14 6C14.2761 6 14.5 6.22386 14.5 6.5C14.5 6.77614 14.2761 7 14 7H12V16H14C14.2761 16 14.5 16.2239 14.5 16.5C14.5 16.7761 14.2761 17 14 17H9C8.72386 17 8.5 16.7761 8.5 16.5C8.5 16.2239 8.72386 16 9 16H11V7H9C8.72386 7 8.5 6.77614 8.5 6.5C8.5 6.22386 8.72386 6 9 6H14Z" fill="currentColor" />
  </svg>
);

const HUG_SVG = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M11.4999 13C11.6325 13 11.7597 13.0527 11.8535 13.1464L14.8535 16.1464C15.0487 16.3417 15.0487 16.6582 14.8535 16.8535C14.6582 17.0487 14.3417 17.0487 14.1464 16.8535L11.4999 14.207L8.85346 16.8535C8.6582 17.0487 8.34169 17.0487 8.14643 16.8535C7.95119 16.6582 7.95119 16.3417 8.14643 16.1464L11.1464 13.1464C11.2402 13.0527 11.3674 13 11.4999 13ZM14.1464 7.14644C14.3417 6.95119 14.6582 6.95118 14.8535 7.14644C15.0487 7.3417 15.0487 7.65821 14.8535 7.85347L11.8535 10.8535C11.7597 10.9472 11.6325 10.9999 11.4999 11C11.3674 10.9999 11.2402 10.9472 11.1464 10.8535L8.14643 7.85347C7.95119 7.65821 7.95119 7.3417 8.14643 7.14644C8.34169 6.9512 8.6582 6.9512 8.85346 7.14644L11.4999 9.79292L14.1464 7.14644Z" fill="currentColor" />
  </svg>
);

const FIT_SVG = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M9.5 14C9.77614 14 10 14.2239 10 14.5V17.5C10 17.7761 9.77614 18 9.5 18C9.22386 18 9 17.7761 9 17.5V15.707L6.85352 17.8535C6.65825 18.0488 6.34175 18.0488 6.14648 17.8535C5.95122 17.6583 5.95122 17.3417 6.14648 17.1465L8.29297 15H6.5C6.22386 15 6 14.7761 6 14.5C6 14.2239 6.22386 14 6.5 14H9.5ZM17.5 14C17.7761 14 18 14.2239 18 14.5C18 14.7761 17.7761 15 17.5 15H15.707L17.8535 17.1465C18.0488 17.3417 18.0488 17.6583 17.8535 17.8535C17.6583 18.0488 17.3417 18.0488 17.1465 17.8535L15 15.707V17.5C15 17.7761 14.7761 18 14.5 18C14.2239 18 14 17.7761 14 17.5V14.5C14 14.2239 14.2239 14 14.5 14H17.5ZM9.5 6C9.77614 6 10 6.22386 10 6.5V9.5C10 9.77614 9.77614 10 9.5 10H6.5C6.22386 10 6 9.77614 6 9.5C6 9.22386 6.22386 9 6.5 9H8.29297L6.14648 6.85352C5.95122 6.65825 5.95122 6.34175 6.14648 6.14648C6.34175 5.95122 6.65825 5.95122 6.85352 6.14648L9 8.29297V6.5C9 6.22386 9.22386 6 9.5 6ZM17.1465 6.14648C17.3417 5.95122 17.6583 5.95122 17.8535 6.14648C18.0488 6.34175 18.0488 6.65825 17.8535 6.85352L15.707 9H17.5C17.7761 9 18 9.22386 18 9.5C18 9.77614 17.7761 10 17.5 10H14.5C14.2239 10 14 9.77614 14 9.5V6.5C14 6.22386 14.2239 6 14.5 6C14.7761 6 15 6.22386 15 6.5V8.29297L17.1465 6.14648Z" fill="currentColor" />
  </svg>
);

const RADIUS_SVG = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M15.5 8C15.7761 8 16 8.22386 16 8.5C16 8.77614 15.7761 9 15.5 9H12.5C11.7917 9 11.2902 9.00022 10.8984 9.03223C10.5126 9.06377 10.2769 9.12345 10.0918 9.21777C9.71554 9.40951 9.40951 9.71554 9.21777 10.0918C9.12345 10.2769 9.06377 10.5126 9.03223 10.8984C9.00022 11.2902 9 11.7917 9 12.5V15.5C9 15.7761 8.77614 16 8.5 16C8.22386 16 8 15.7761 8 15.5V12.5C8 11.8082 8.00003 11.2593 8.03613 10.8174C8.07272 10.3696 8.14901 9.98732 8.32715 9.6377C8.61472 9.07347 9.07347 8.61472 9.6377 8.32715C9.98732 8.14901 10.3696 8.07272 10.8174 8.03613C11.2593 8.00003 11.8082 8 12.5 8H15.5Z" fill="currentColor" />
  </svg>
);

const CHECK_SVG = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M11.0839 4.22264C11.2371 3.99289 11.5475 3.93082 11.7773 4.08396C12.007 4.23714 12.0691 4.54756 11.916 4.77732L7.91596 10.7773C7.83287 10.902 7.69784 10.9833 7.54877 10.998C7.39988 11.0126 7.25223 10.9593 7.14643 10.8535L4.14643 7.85349C3.9512 7.65823 3.95118 7.34171 4.14643 7.14646C4.34168 6.95122 4.6582 6.95124 4.85346 7.14646L7.42182 9.71482L11.0839 4.22264Z" fill="currentColor" />
  </svg>
);

// ============================================================
// SizeModal 컴포넌트
// useApp() 미사용: AppContext 리렌더로부터 완전 격리
// 초기값은 마운트 시 props에서 1회만 읽음 (useState 초기화)
// ============================================================
export function SizeModal({
  mode,
  initialName = '',
  initialW = 375,
  initialH = 812,
  initialRadius = 0,
  initialSizeMode = 'fixed',
  onSave,
  onClose,
}: SizeModalProps) {
  // useState 초기화 시 props에서 1회만 읽음 -> 이후 Context 리렌더와 무관
  const [name, setName] = useState(initialName);
  const [w, setW] = useState(initialW);
  const [h, setH] = useState(initialH);
  const [radius, setRadius] = useState(initialRadius);
  const [sizeMode, setSizeMode] = useState<'fixed' | 'hug' | 'fit'>(initialSizeMode);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      window.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  function handleRadiusChange(e: React.ChangeEvent<HTMLInputElement>) {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val)) val = 0;
    if (val > SCREEN_NODE_CONSTRAINTS.MAX_CORNER_RADIUS) val = SCREEN_NODE_CONSTRAINTS.MAX_CORNER_RADIUS;
    if (val < SCREEN_NODE_CONSTRAINTS.MIN_CORNER_RADIUS) val = SCREEN_NODE_CONSTRAINTS.MIN_CORNER_RADIUS;
    setRadius(val);
  }

  function handleSave() {
    const finalName = name.trim() || 'Custom';
    const finalW = clampScreenWidth(w || 250);
    const finalH = clampScreenHeight(h || 100);
    const finalRadius = clampScreenCornerRadius(radius || 0);
    onSave({ name: finalName, w: finalW, h: finalH, radius: finalRadius, sizeMode });
    onClose();
  }

  const title = mode === 'add' ? 'Add Size' : 'Edit Size';

  return (
    <div
      id="modal-backdrop"
      className="popover-backdrop"
      style={{ display: 'flex' }}
      onClick={(e) => {
        // 이벤트 버블링 차단: App의 handleRootClick -> closeAllPopovers() 호출 방지
        e.stopPropagation();
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id={`modal-${mode}-size`}
        className="size-modal-card"
        style={{ display: 'flex', overflow: 'visible', position: 'relative' }}
      >
        {/* 모달 헤더 */}
        <div className="size-modal-header">
          <span className="size-modal-title">{title}</span>
          <button className="size-modal-close-btn" onClick={onClose} data-tooltip={t('tipClose')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M16.6464 6.64645C16.8417 6.45118 17.1582 6.45118 17.3535 6.64645C17.5487 6.84171 17.5487 7.15822 17.3535 7.35348L12.707 12L17.3535 16.6464C17.5487 16.8417 17.5487 17.1582 17.3535 17.3535C17.1582 17.5487 16.8417 17.5487 16.6464 17.3535L12 12.707L7.35348 17.3535C7.15822 17.5487 6.84171 17.5487 6.64645 17.3535C6.45118 17.1582 6.45118 16.8417 6.64645 16.6464L11.2929 12L6.64645 7.35348C6.45123 7.15821 6.4512 6.84169 6.64645 6.64645C6.8417 6.45125 7.15823 6.45125 7.35348 6.64645L12 11.2929L16.6464 6.64645Z" fill="currentColor" />
            </svg>
          </button>
        </div>

        {/* 모달 바디 */}
        <div className="size-modal-body" style={{ overflow: 'visible' }}>

          {/* Name 필드 */}
          <div className="phase-field-group">
            <div className="phase-field-label-row">
              <span className="phase-field-label">Name</span>
            </div>
            <div className="phase-input-row-wrapper">
              <input
                type="text"
                id={`input-${mode}-size-name`}
                className="phase-text-input"
                placeholder="Custom"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                autoFocus
              />
            </div>
          </div>

          {/* Size 필드 */}
          <div className="phase-field-group" style={{ paddingBottom: 12, overflow: 'visible' }}>
            <div className="phase-field-label-row">
              <span className="phase-field-label">Size</span>
            </div>
            <div className="phase-input-row-wrapper" style={{ gap: '6px' }}>
              <div className="prefix-input-box">
                <span className="prefix-label">W</span>
                <input
                  type="number"
                  id={`input-${mode}-size-w`}
                  className="prefix-input"
                  value={w}
                  min={SCREEN_NODE_CONSTRAINTS.MIN_WIDTH}
                  max={SCREEN_NODE_CONSTRAINTS.MAX_WIDTH}
                  onChange={(e) => setW(parseInt(e.target.value, 10) || 0)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                />
              </div>
              <div className="prefix-input-box">
                <span className="prefix-label">H</span>
                <input
                  type="number"
                  id={`input-${mode}-size-h`}
                  className="prefix-input"
                  value={h}
                  min={SCREEN_NODE_CONSTRAINTS.MIN_HEIGHT}
                  max={SCREEN_NODE_CONSTRAINTS.MAX_HEIGHT}
                  onChange={(e) => setH(parseInt(e.target.value, 10) || 0)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                />
              </div>
            </div>

            {/* Corner Radius */}
            <div className="phase-input-row-wrapper">
              <div className="icon-input-box">
                <span className="icon-input-slot" style={{ width: 24, height: 24 }}>
                  {RADIUS_SVG}
                </span>
                <input
                  type="number"
                  id={`input-${mode}-size-radius`}
                  className="prefix-input"
                  value={radius}
                  min={SCREEN_NODE_CONSTRAINTS.MIN_CORNER_RADIUS}
                  max={SCREEN_NODE_CONSTRAINTS.MAX_CORNER_RADIUS}
                  onChange={handleRadiusChange}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                />
              </div>
            </div>

            {/* Height Mode Dropdown */}
            <div
              className="phase-input-row-wrapper figma-dropdown-wrapper"
              ref={dropdownRef}
              style={{ position: 'relative' }}
            >
              <div
                className={`size-dropdown-box${dropdownOpen ? ' active' : ''}`}
                onClick={() => setDropdownOpen(!dropdownOpen)}
                data-tooltip={t('tipSizeMode')}
                tabIndex={0}
                style={{ cursor: 'pointer' }}
              >
                <div className="size-dropdown-left" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {sizeMode === 'hug' ? HUG_SVG : sizeMode === 'fit' ? FIT_SVG : FIXED_SVG}
                  </span>
                  <span id={`text-${mode}-size-mode`} style={{ fontSize: 11, color: '#ffffff' }}>
                    {sizeMode === 'fixed' ? t('sizeModeFixed') : sizeMode === 'fit' ? t('sizeModeFit') : t('sizeModeHug')}
                  </span>
                </div>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                  style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease', flexShrink: 0 }}>
                  <path d="M9.7673 6.76777C9.96256 6.5725 10.28 6.5725 10.4753 6.76777C10.6702 6.96296 10.6702 7.2796 10.4753 7.4748L7.99972 9.94941L5.52511 7.4748C5.32985 7.27953 5.32985 6.96303 5.52511 6.76777C5.72037 6.5725 6.03688 6.5725 6.23214 6.76777L7.99972 8.53534L9.7673 6.76777Z" fill="currentColor" />
                </svg>
              </div>

              {/* 드롭다운 메뉴 팝오버 */}
              {dropdownOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 4px)', left: 0, width: '100%',
                  background: '#222222', border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 8, padding: 4, boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                  zIndex: 200, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 2,
                  animation: 'modalFadeIn 0.12s ease-out',
                }}>
                  {/* Fixed height 항목 */}
                  <div
                    onClick={() => { setSizeMode('fixed'); setDropdownOpen(false); }}
                    style={{ height: 28, padding: '0 6px', borderRadius: 5, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 11, color: '#ffffff', background: 'transparent', transition: 'background 0.12s, color 0.12s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#8C4CF6'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{ width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{sizeMode === 'fixed' && CHECK_SVG}</span>
                    <span style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{FIXED_SVG}</span>
                    <span style={{ flex: 1, whiteSpace: 'nowrap' }}>{t('sizeModeFixed')}</span>
                  </div>
                  {/* Hug contents 항목 */}
                  <div
                    onClick={() => { setSizeMode('hug'); setDropdownOpen(false); }}
                    style={{ height: 28, padding: '0 6px', borderRadius: 5, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 11, color: '#ffffff', background: 'transparent', transition: 'background 0.12s, color 0.12s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#8C4CF6'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{ width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{sizeMode === 'hug' && CHECK_SVG}</span>
                    <span style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{HUG_SVG}</span>
                    <span style={{ flex: 1, whiteSpace: 'nowrap' }}>{t('sizeModeHug')}</span>
                  </div>
                  {/* Fit contents 항목 */}
                  <div
                    onClick={() => { setSizeMode('fit'); setDropdownOpen(false); }}
                    style={{ height: 28, padding: '0 6px', borderRadius: 5, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 11, color: '#ffffff', background: sizeMode === 'fit' ? '#8C4CF6' : 'transparent', transition: 'background 0.12s, color 0.12s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#8C4CF6'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = sizeMode === 'fit' ? '#8C4CF6' : 'transparent'; }}
                  >
                    <span style={{ width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{sizeMode === 'fit' && CHECK_SVG}</span>
                    <span style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{FIT_SVG}</span>
                    <span style={{ flex: 1, whiteSpace: 'nowrap' }}>{t('sizeModeFit')}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 모달 푸터 */}
        <div className="size-modal-footer">
          <button type="button" className="btn-phase-modal-cancel" onClick={onClose}>Cancel</button>
          <button type="button" className="btn-phase-modal-save" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}
