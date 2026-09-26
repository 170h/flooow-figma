import React from 'react';
import { COLOR_MIXED_ICON, MixedDashChip, DASH_24_SVG } from './icons';

/**
 * 피그마 UI3 공식 드롭다운 선택 체크 아이콘 (16×16px)
 */
export const DropdownCheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M11.0839 4.22264C11.2371 3.99289 11.5475 3.93082 11.7773 4.08396C12.007 4.23714 12.0691 4.54756 11.916 4.77732L7.91596 10.7773C7.83287 10.902 7.69784 10.9833 7.54877 10.998C7.39988 11.0126 7.25223 10.9593 7.14643 10.8535L4.14643 7.85349C3.9512 7.65823 3.95118 7.34171 4.14643 7.14646C4.34168 6.95122 4.6582 6.95124 4.85346 7.14646L7.42182 9.71482L11.0839 4.22264Z"
      fill="currentColor"
    />
  </svg>
);

export type DropdownMixedVariant =
  | 'icon'       // 아이콘 + 텍스트 라벨이 있는 옵션 (예: Size 높이 모드 -> 16px 체크 + 24px 대시 + "Mixed")
  | 'chip'       // 컬러칩 + 텍스트 라벨이 있는 옵션 (예: StepBadges 배지 색상, Phase 선택 -> 16px 체크 + 컬러칩 대시 + "Mixed")
  | 'icon-only'; // 아이콘(그래픽)만으로 이루어진 옵션 (예: Connect 단자 스타일 -> 16px 체크 + "Mixed" 텍스트만 표시)

export interface DropdownMixedItemProps {
  /**
   * 드롭다운 옵션 항목의 구성 형태:
   * - 'icon': 옵션에 24×24 아이콘과 텍스트가 있는 경우 -> [ 16×16 체크 ] + [ 24×24 슬롯 내 '-' 대시 ] + [ "Mixed" 텍스트 ]
   * - 'chip': 옵션에 컬러칩과 텍스트가 있는 경우 -> [ 16×16 체크 ] + [ 컬러칩 슬롯 내 '-' 대시 ] + [ "Mixed" 텍스트 ]
   * - 'icon-only': 옵션이 텍스트 없이 그래픽/아이콘만으로 이루어진 경우 -> [ 16×16 체크 ] + [ 중앙 "Mixed" 텍스트 ]
   */
  variant: DropdownMixedVariant;
  /** chip 크기 (기본값: 14) */
  chipSize?: number;
  /** 클릭 이벤트 핸들러 */
  onClick?: (e: React.MouseEvent) => void;
  /** 추가 클래스 */
  className?: string;
  /** 추가 인라인 스타일 */
  style?: React.CSSProperties;
  /** 하단 보더 구분선 표시 여부 (기본값: true) */
  showDivider?: boolean;
}

/**
 * 모든 드롭다운 메뉴의 Mixed 상태 공통 컴포넌트
 */
export function DropdownMixedItem({
  variant,
  chipSize = 16,
  onClick,
  className = '',
  style,
  showDivider = true,
}: DropdownMixedItemProps) {
  return (
    <>
      {variant === 'icon' && (
        <div
          className={`size-mode-menu-item figma-dropdown-item selected ${className}`.trim()}
          data-value="mixed"
          style={style}
          onClick={onClick}
        >
          <span className="size-mode-menu-item-check figma-dropdown-check-slot">
            <DropdownCheckIcon />
          </span>
          <span className="size-mode-menu-item-icon figma-dropdown-icon-slot">
            {DASH_24_SVG}
          </span>
          <span className="size-mode-menu-item-label figma-dropdown-label">Mixed</span>
        </div>
      )}

      {variant === 'chip' && (
        <div
          className={`figma-dropdown-item selected ${className}`.trim()}
          data-value="mixed"
          style={{ width: '100%', cursor: onClick ? 'pointer' : 'default', ...style }}
          onClick={onClick}
        >
          <span className="figma-dropdown-check-slot">
            <DropdownCheckIcon />
          </span>
          <span className="figma-dropdown-icon-slot">
            <MixedDashChip size={chipSize} theme="dark" />
          </span>
          <span className="figma-dropdown-label" style={{ fontSize: '11px', fontWeight: 600 }}>
            Mixed
          </span>
        </div>
      )}

      {variant === 'icon-only' && (
        <div
          className={`terminal-ui3-item selected ${className}`.trim()}
          data-value="mixed"
          style={{
            width: '100%',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 4px',
            borderRadius: '6px',
            cursor: onClick ? 'pointer' : 'default',
            color: '#ffffff',
            userSelect: 'none',
            boxSizing: 'border-box',
            ...style,
          }}
          onClick={onClick}
        >
          <span
            style={{
              width: '20px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <DropdownCheckIcon />
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              height: '16px',
              fontSize: '11px',
              fontWeight: 500,
              color: '#ffffff',
            }}
          >
            Mixed
          </span>
        </div>
      )}

      {showDivider && (
        <hr
          className="phase-popover-divider"
          style={{ margin: '4px 0', border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.1)', width: '100%' }}
        />
      )}
    </>
  );
}
