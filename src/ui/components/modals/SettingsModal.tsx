import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { t } from "../../../i18n";
import type { AppLocale, ExportScope } from "../../../types";
import { SUPPORTED_LOCALES } from "../../../i18n";

// 피그마 UI3 공식 24×24px 닫기 SVG 아이콘 ( FillColorModal 템플릿과 동일 )
const CLOSE_SVG = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M16.6464 6.64645C16.8417 6.45118 17.1582 6.45118 17.3535 6.64645C17.5487 6.84171 17.5487 7.15822 17.3535 7.35348L12.707 12L17.3535 16.6464C17.5487 16.8417 17.5487 17.1582 17.3535 17.3535C17.1582 17.5487 16.8417 17.5487 16.6464 17.3535L12 12.707L7.35348 17.3535C7.15822 17.5487 6.84171 17.5487 6.64645 17.3535C6.45118 17.1582 6.45118 16.8417 6.64645 16.6464L11.2929 12L6.64645 7.35348C6.45123 7.15821 6.4512 6.84169 6.64645 6.64645C6.8417 6.45125 7.15823 6.45125 7.35348 6.64645L12 11.2929L16.6464 6.64645Z"
      fill="currentColor"
    />
  </svg>
);

// 공식 아이콘 24×24 (다운로드 원본 그대로, currentColor 매핑)
const ICON_COPY = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.5 6C14.3284 6 15 6.67157 15 7.5V9H16.5C17.3284 9 18 9.67157 18 10.5V16.5C18 17.3284 17.3284 18 16.5 18H10.5C9.67157 18 9 17.3284 9 16.5V15H7.5C6.67157 15 6 14.3284 6 13.5V7.5C6 6.67157 6.67157 6 7.5 6H13.5ZM15 13.5C15 14.3284 14.3284 15 13.5 15H10V16.5C10 16.7761 10.2239 17 10.5 17H16.5C16.7761 17 17 16.7761 17 16.5V10.5C17 10.2239 16.7761 10 16.5 10H15V13.5ZM7.5 7C7.22386 7 7 7.22386 7 7.5V13.5C7 13.7761 7.22386 14 7.5 14H13.5C13.7761 14 14 13.7761 14 13.5V7.5C14 7.22386 13.7761 7 13.5 7H7.5Z" fill="currentColor" />
  </svg>
);

const ICON_EXPORT = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.5 15C17.7761 15 18 15.2239 18 15.5V16.5C18 17.3284 17.3284 18 16.5 18H7.5C6.67157 18 6 17.3284 6 16.5V15.5C6 15.2239 6.22386 15 6.5 15C6.77614 15 7 15.2239 7 15.5V16.5C7 16.7761 7.22386 17 7.5 17H16.5C16.7761 17 17 16.7761 17 16.5V15.5C17 15.2239 17.2239 15 17.5 15ZM12 5C12.2761 5 12.5 5.22386 12.5 5.5V12.293L14.6465 10.1465C14.8417 9.95122 15.1583 9.95122 15.3535 10.1465C15.5488 10.3417 15.5488 10.6583 15.3535 10.8535L12.3535 13.8535C12.1583 14.0488 11.8417 14.0488 11.6465 13.8535L8.64648 10.8535C8.45122 10.6583 8.45122 10.3417 8.64648 10.1465C8.84175 9.95122 9.15825 9.95122 9.35352 10.1465L11.5 12.293V5.5C11.5 5.22386 11.7239 5 12 5Z" fill="currentColor" />
  </svg>
);

const ICON_THEME_LIGHT = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3.62069V3M12 21V20.3793M20.3793 12H21M3 12H3.62069M17.9256 6.07501L18.3645 5.63611M5.63546 18.3639L6.07435 17.925M17.9256 17.925L18.3645 18.3639M5.63546 5.63607L6.07435 6.07496M16.9534 11.9661C16.9534 14.7084 14.7303 16.9316 11.9879 16.9316C9.2455 16.9316 7.02236 14.7084 7.02236 11.9661C7.02236 9.22368 9.2455 7.00054 11.9879 7.00054C14.7303 7.00054 16.9534 9.22368 16.9534 11.9661Z" strokeLinecap="round" stroke="currentColor" />
  </svg>
);

const ICON_THEME_DARK = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 13.9248C18.3421 14.1243 17.6441 14.2316 16.921 14.2316C12.9703 14.2316 9.7677 11.0289 9.7677 7.07819C9.7677 6.35542 9.8749 5.65767 10.0743 5C7.13757 5.89061 5 8.61897 5 11.8466C5 15.7973 8.20263 19 12.1533 19C15.3812 19 18.1097 16.862 19 13.9248Z" strokeLinejoin="round" stroke="currentColor" />
  </svg>
);

const ICON_THEME_SYSTEM = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 16V18M9 19H15M6 16H18C19.1046 16 20 15.1046 20 14V7C20 5.89543 19.1046 5 18 5H6C4.89543 5 4 5.89543 4 7V14C4 15.1046 4.89543 16 6 16Z" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" />
  </svg>
);

const CHEVRON_SVG = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M9.7673 6.76777C9.96256 6.5725 10.28 6.5725 10.4753 6.76777C10.6702 6.96296 10.6702 7.2796 10.4753 7.4748L7.99972 9.94941L5.52511 7.4748C5.32985 7.27953 5.32985 6.96303 5.52511 6.76777C5.72037 6.5725 6.03688 6.5725 6.23214 6.76777L7.99972 8.53534L9.7673 6.76777Z" fill="currentColor" />
  </svg>
);

const CHECK_SVG = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M6.5 8.5L8 10L10 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Export 범위 라디오 (공식 16×16 규격 — 다운로드 원본 그대로, currentColor 매핑)
const RADIO_ON_SVG = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 0C12.4183 0 16 3.58172 16 8C16 12.4183 12.4183 16 8 16C3.58172 16 0 12.4183 0 8C0 3.58172 3.58172 0 8 0ZM8 1C4.13401 1 1 4.13401 1 8C1 11.866 4.13401 15 8 15C11.866 15 15 11.866 15 8C15 4.13401 11.866 1 8 1Z" fill="currentColor" />
    <circle cx="8" cy="8" r="4" fill="currentColor" />
  </svg>
);

const RADIO_OFF_SVG = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 0C12.4183 0 16 3.58172 16 8C16 12.4183 12.4183 16 8 16C3.58172 16 0 12.4183 0 8C0 3.58172 3.58172 0 8 0ZM8 1C4.13401 1 1 4.13401 1 8C1 11.866 4.13401 15 8 15C11.866 15 15 11.866 15 8C15 4.13401 11.866 1 8 1Z" fill="currentColor" />
  </svg>
);

// 드롭다운 표시용 언어명 (디자인 표기 그대로 영문명 사용)
const LOCALE_LABELS: Record<AppLocale, string> = {
  ko: 'Korean',
  en: 'English',
  ja: 'Japanese',
  'zh-CN': 'Simplified Chinese',
  'zh-TW': 'Traditional Chinese',
  es: 'Spanish',
  de: 'German',
  fr: 'French',
};

export type SettingsThemeMode = 'light' | 'dark' | 'system';

export interface SettingsModalProps {
  onClose: () => void;
  onCopy: (scope: ExportScope) => void;
  onDownload: (scope: ExportScope) => void;
  /** Theme 섹션 표시 여부 (figma형에만 true) */
  showTheme: boolean;
  themeMode?: SettingsThemeMode;
  onThemeChange?: (mode: SettingsThemeMode) => void;
  /** Export 범위 보드 라벨 (에디터 용어 구분 — FigJam "Entire board" / Figma "Entire canvas") */
  boardLabel: string;
}

/**
 * Settings 모달 (Figma UI3 규격 — 헤더 40 + 섹션 + 푸터 OK)
 * - Theme: Light/Dark/System 세그먼트 (showTheme일 때만)
 * - Language: 8개 로케일 드롭다운 (인라인 확장)
 * - Export: Copy for AI / Download JSON (Secondary 버튼)
 */
export function SettingsModal({
  onClose,
  onCopy,
  onDownload,
  showTheme,
  themeMode = 'system',
  onThemeChange,
  boardLabel,
}: SettingsModalProps) {
  const { locale, setLocale, selectedNodes } = useApp();
  const [langOpen, setLangOpen] = useState(false);

  // Export 범위: 선택이 있으면 Selection 자동, 없으면 Entire board + Selection 비활성화
  const hasSelection = selectedNodes.length > 0;
  const [exportScope, setExportScope] = useState<ExportScope>(() => (
    hasSelection ? 'selection' : 'board'
  ));
  const effectiveScope: ExportScope =
    exportScope === 'selection' && !hasSelection ? 'board' : exportScope;

  const themeTabs: Array<{ mode: SettingsThemeMode; icon: React.ReactNode }> = [
    { mode: 'light', icon: ICON_THEME_LIGHT },
    { mode: 'dark', icon: ICON_THEME_DARK },
    { mode: 'system', icon: ICON_THEME_SYSTEM },
  ];

  return (
    <div
      id="modal-settings-backdrop"
      className="popover-backdrop active"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="modal-settings"
        className="subscription-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 (Settings 타이틀 + 닫기 버튼) */}
        <div className="subscription-modal-header">
          <span className="subscription-modal-title">Settings</span>
          <button
            type="button"
            className="subscription-modal-close-btn"
            onClick={onClose}
            data-tooltip={t('tipClose')}
          >
            {CLOSE_SVG}
          </button>
        </div>

        {/* 모달 바디 */}
        <div className="subscription-modal-body">
          {/* Theme 섹션 (figma형) */}
          {showTheme && (
            <div className="subscription-plan-section">
              <div className="subscription-plan-label-row">
                <div className="subscription-section-label">Theme</div>
              </div>
              <div
                style={{
                  display: 'flex', alignItems: 'stretch',
                  width: '168px', height: '32px',
                  background: 'var(--color-bg-tertiary)', borderRadius: '5px',
                  boxSizing: 'border-box',
                }}
              >
                {themeTabs.map(({ mode, icon }) => {
                  const isActive = themeMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => onThemeChange?.(mode)}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isActive ? 'var(--color-bg-secondary)' : 'transparent',
                        border: isActive ? '1px solid #444444' : '1px solid transparent',
                        borderRadius: '5px', color: '#FFFFFF', cursor: 'pointer',
                        boxSizing: 'border-box', padding: 0,
                      }}
                    >
                      {icon}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Language 섹션 */}
          <div className="subscription-plan-section">
            <div className="subscription-plan-label-row">
              <div className="subscription-section-label">Language</div>
            </div>
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLangOpen((v) => !v);
                }}
                style={{
                  display: 'flex', alignItems: 'center',
                  width: '100%', height: '24px',
                  background: 'var(--color-bg-secondary)',
                  border: '1px solid #444444', borderRadius: '5px',
                  color: '#FFFFFF', cursor: 'pointer',
                  padding: '0 0 0 8px', boxSizing: 'border-box',
                  fontSize: '11px', fontWeight: 450, lineHeight: '16px',
                }}
              >
                <span style={{ flex: 1, textAlign: 'left' }}>{LOCALE_LABELS[locale]}</span>
                <span style={{
                  display: 'flex', alignItems: 'center',
                  transform: langOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.15s ease',
                }}>
                  {CHEVRON_SVG}
                </span>
              </button>
              {langOpen && (
                <div
                  style={{
                    display: 'flex', flexDirection: 'column', gap: '2px',
                    marginTop: '4px', padding: '5px',
                    background: '#1e1e1e',
                    borderRadius: '13px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
                    boxSizing: 'border-box',
                  }}
                >
                  {SUPPORTED_LOCALES.map((loc) => {
                    const isSelected = locale === loc;
                    return (
                      <div
                        key={loc}
                        onClick={() => {
                          setLocale(loc);
                          setLangOpen(false);
                        }}
                        style={{
                          width: '100%', minHeight: '24px',
                          display: 'flex', alignItems: 'center', gap: '4px',
                          padding: '0 4px', borderRadius: '6px',
                          cursor: 'pointer', color: '#ffffff',
                          userSelect: 'none', boxSizing: 'border-box',
                          fontSize: '11px', fontWeight: 450, lineHeight: '16px',
                          background: isSelected ? '#8C4CF6' : 'transparent',
                        }}
                      >
                        <span style={{
                          width: '16px', height: '16px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, opacity: isSelected ? 1 : 0,
                        }}>
                          {CHECK_SVG}
                        </span>
                        <span style={{ flex: 1 }}>{LOCALE_LABELS[loc]}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Export 섹션 */}
          <div className="subscription-plan-section">
            <div className="subscription-plan-label-row">
              <div className="subscription-section-label">Export</div>
            </div>
            {/* Export 범위 라디오 (공식 규격: 16px 라디오 + 라벨, space-between) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
              {(['board', 'selection'] as const).map((kind) => {
                const selectionEmpty = kind === 'selection' && !hasSelection;
                const active = effectiveScope === kind && !selectionEmpty;
                return (
                  <button
                    key={kind}
                    type="button"
                    disabled={selectionEmpty}
                    onClick={() => setExportScope(kind)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '4px',
                      background: 'none', border: 'none', padding: 0,
                      color: '#FFFFFF', cursor: selectionEmpty ? 'default' : 'pointer',
                      opacity: selectionEmpty ? 0.4 : 1,
                      fontSize: '11px', fontWeight: 450, lineHeight: '16px',
                    }}
                  >
                    {active ? RADIO_ON_SVG : RADIO_OFF_SVG}
                    <span>{kind === 'board' ? boardLabel : 'Selection'}</span>
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '4px 0' }}>
              <button
                type="button"
                onClick={() => onCopy(effectiveScope)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  width: '168px', height: '24px',
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '5px',
                  color: '#FFFFFF', cursor: 'pointer',
                  padding: '4px 8px 4px 4px', boxSizing: 'border-box',
                  fontSize: '11px', fontWeight: 450, lineHeight: '16px',
                }}
              >
                {ICON_COPY}
                <span style={{ flex: 1, textAlign: 'center' }}>Copy for AI</span>
              </button>
              <button
                type="button"
                onClick={() => onDownload(effectiveScope)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  width: '168px', height: '24px',
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '5px',
                  color: '#FFFFFF', cursor: 'pointer',
                  padding: '4px 8px 4px 4px', boxSizing: 'border-box',
                  fontSize: '11px', fontWeight: 450, lineHeight: '16px',
                }}
              >
                {ICON_EXPORT}
                <span style={{ flex: 1, textAlign: 'center' }}>Download JSON</span>
              </button>
            </div>
          </div>
        </div>

        {/* 모달 푸터 (OK) */}
        <div className="subscription-modal-footer">
          <button
            type="button"
            className="btn-cta-primary"
            onClick={onClose}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
