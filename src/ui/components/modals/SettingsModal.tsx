import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { t } from "../../../i18n";
import type { AppLocale, ExportScope } from "../../../types";
import { SUPPORTED_LOCALES } from "../../../i18n";
import { IcCheckLarge } from "../shared/icons";

// 피그마 UI3 공식 24×24px 닫기 SVG 아이콘 ( FillColorModal 템플릿과 동일 )
const CLOSE_SVG = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M16.6464 6.64645C16.8417 6.45118 17.1582 6.45118 17.3535 6.64645C17.5487 6.84171 17.5487 7.15822 17.3535 7.35348L12.707 12L17.3535 16.6464C17.5487 16.8417 17.5487 17.1582 17.3535 17.3535C17.1582 17.5487 16.8417 17.5487 16.6464 17.3535L12 12.707L7.35348 17.3535C7.15822 17.5487 6.84171 17.5487 6.64645 17.3535C6.45118 17.1582 6.45118 16.8417 6.64645 16.6464L11.2929 12L6.64645 7.35348C6.45123 7.15821 6.4512 6.84169 6.64645 6.64645C6.8417 6.45125 7.15823 6.45125 7.35348 6.64645L12 11.2929L16.6464 6.64645Z"
      fill="currentColor"
    />
  </svg>
);

// UI3 icon.24.codeSnippet (1027528:2198)
const ICON_CODE = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.64648 7.14648C8.84175 6.95122 9.15825 6.95122 9.35352 7.14648C9.54878 7.34175 9.54878 7.65825 9.35352 7.85352L5.20703 12L9.35352 16.1465C9.54878 16.3417 9.54878 16.6583 9.35352 16.8535C9.15825 17.0488 8.84175 17.0488 8.64648 16.8535L4.14648 12.3535C3.95122 12.1583 3.95122 11.8417 4.14648 11.6465L8.64648 7.14648ZM15.3535 7.14648C15.1583 6.95122 14.8417 6.95122 14.6465 7.14648C14.4512 7.34175 14.4512 7.65825 14.6465 7.85352L18.793 12L14.6465 16.1465C14.4512 16.3417 14.4512 16.6583 14.6465 16.8535C14.8417 17.0488 15.1583 17.0488 15.3535 16.8535L19.8535 12.3535C20.0488 12.1583 20.0488 11.8417 19.8535 11.6465L15.3535 7.14648Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
  </svg>
);

const ICON_EXPORT = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.5 15C17.7761 15 18 15.2239 18 15.5V16.5C18 17.3284 17.3284 18 16.5 18H7.5C6.67157 18 6 17.3284 6 16.5V15.5C6 15.2239 6.22386 15 6.5 15C6.77614 15 7 15.2239 7 15.5V16.5C7 16.7761 7.22386 17 7.5 17H16.5C16.7761 17 17 16.7761 17 16.5V15.5C17 15.2239 17.2239 15 17.5 15ZM12 5C12.2761 5 12.5 5.22386 12.5 5.5V12.293L14.6465 10.1465C14.8417 9.95122 15.1583 9.95122 15.3535 10.1465C15.5488 10.3417 15.5488 10.6583 15.3535 10.8535L12.3535 13.8535C12.1583 14.0488 11.8417 14.0488 11.6465 13.8535L8.64648 10.8535C8.45122 10.6583 8.45122 10.3417 8.64648 10.1465C8.84175 9.95122 9.15825 9.95122 9.35352 10.1465L11.5 12.293V5.5C11.5 5.22386 11.7239 5 12 5Z" fill="currentColor" />
  </svg>
);

const CHEVRON_SVG = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M9.7673 6.76777C9.96256 6.5725 10.28 6.5725 10.4753 6.76777C10.6702 6.96296 10.6702 7.2796 10.4753 7.4748L7.99972 9.94941L5.52511 7.4748C5.32985 7.27953 5.32985 6.96303 5.52511 6.76777C5.72037 6.5725 6.03688 6.5725 6.23214 6.76777L7.99972 8.53534L9.7673 6.76777Z" fill="currentColor" />
  </svg>
);

const CHECK_SVG = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M11.0839 4.22264C11.2371 3.99289 11.5475 3.93082 11.7773 4.08396C12.007 4.23714 12.0691 4.54756 11.916 4.77732L7.91596 10.7773C7.83287 10.902 7.69784 10.9833 7.54877 10.998C7.39988 11.0126 7.25223 10.9593 7.14643 10.8535L4.14643 7.85349C3.9512 7.65823 3.95118 7.34171 4.14643 7.14646C4.34168 6.95122 4.6582 6.95124 4.85346 7.14646L7.42182 9.71482L11.0839 4.22264Z" fill="currentColor" />
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

export interface SettingsModalProps {
  onClose: () => void;
  onCopy: (scope: ExportScope) => void;
  onDownload: (scope: ExportScope) => void;
  /** 마크다운이 클립보드에 저장된 직후 */
  copied?: boolean;
  /** 내보내기·클립보드 저장이 진행 중 */
  copying?: boolean;
  /** Export 범위 보드 라벨 (에디터 용어 구분 — FigJam "Entire board" / Figma "Entire canvas") */
  boardLabel: string;
}

/**
 * Settings 모달 (Figma UI3 규격 — 헤더 40 + 섹션 + 푸터 OK)
 * - Language: 8개 로케일 드롭다운 (인라인 확장)
 * - Export: Copy as Markdown / Download JSON (Secondary 버튼)
 */
export function SettingsModal({
  onClose,
  onCopy,
  onDownload,
  boardLabel,
  copied = false,
  copying = false,
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
        <div className="subscription-modal-body" style={{ paddingBottom: 16 }}>
          {/* Language 섹션 */}
          <div className="subscription-plan-section" style={{ paddingBottom: 16 }}>
            <div className="subscription-plan-label-row">
              <div className="subscription-section-label">Language</div>
            </div>
            <div className="figma-dropdown-wrapper">
              <button
                type="button"
                className={`settings-lang-trigger${langOpen ? ' active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setLangOpen((v) => !v);
                }}
                style={{
                  display: 'flex', alignItems: 'center',
                  width: '100%', height: '28px',
                  background: 'var(--color-bg)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-text-onbrand)', cursor: 'pointer',
                  padding: '0 4px 0 8px', boxSizing: 'border-box',
                  fontSize: '11px', fontWeight: 'var(--font-weight-default, 450)', lineHeight: '16px',
                }}
              >
                <span style={{ flex: 1, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{LOCALE_LABELS[locale]}</span>
                <span className="figma-dropdown-chevron-icon settings-lang-chevron">
                  {CHEVRON_SVG}
                </span>
              </button>
              {langOpen && (
                <div className="figma-dropdown-menu settings-lang-menu active">
                  {SUPPORTED_LOCALES.map((loc) => {
                    const isSelected = locale === loc;
                    return (
                      <div
                        key={loc}
                        onClick={() => {
                          setLocale(loc);
                          setLangOpen(false);
                        }}
                        className={`figma-dropdown-item${isSelected ? ' selected' : ''}`}
                      >
                        <span className="figma-dropdown-check-slot">{CHECK_SVG}</span>
                        <span className="figma-dropdown-label">{LOCALE_LABELS[loc]}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="conn-color-modal-divider" style={{ margin: 0 }} />

          {/* Export 섹션 */}
          <div className="subscription-plan-section" style={{ paddingTop: 16, paddingBottom: 0 }}>
            <div className="subscription-plan-label-row" style={{ height: 'auto', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: '2px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div className="subscription-section-label">Export Flow</div>
                <span style={{ fontSize: '9px', fontWeight: 450, lineHeight: '12px', color: 'var(--color-text-secondary)' }}>Beta</span>
              </div>
              <div style={{ fontSize: '9px', fontWeight: 450, lineHeight: '12px', color: 'var(--color-text-secondary)' }}>
                Export your flows for AI analysis, development, and automation.
              </div>
            </div>
            {/* Export 범위 라디오 (공식 규격: 16px 라디오 + 라벨, space-between) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
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
                      color: 'var(--color-text-onbrand)', cursor: selectionEmpty ? 'default' : 'pointer',
                      opacity: selectionEmpty ? 0.4 : 1,
                      fontSize: '11px', fontWeight: 'var(--font-weight-default, 450)', lineHeight: '16px',
                    }}
                  >
                    {active ? RADIO_ON_SVG : RADIO_OFF_SVG}
                    <span>{kind === 'board' ? boardLabel : 'Selection'}</span>
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '4px 0 0' }}>
              <button
                type="button"
                className="settings-export-btn"
                disabled={copying}
                onClick={() => onCopy(effectiveScope)}
              >
                {copying ? (
                  <span style={{ width: 24, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
                    <span className="settings-export-spinner" role="status" aria-label="Copying" />
                  </span>
                ) : copied ? <IcCheckLarge /> : ICON_CODE}
                <span style={{ whiteSpace: 'nowrap' }}>{copied && !copying ? 'Copied to clipboard' : 'Copy as Markdown'}</span>
              </button>
              <button
                type="button"
                className="settings-export-btn"
                onClick={() => onDownload(effectiveScope)}
              >
                {ICON_EXPORT}
                <span>Download JSON</span>
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
