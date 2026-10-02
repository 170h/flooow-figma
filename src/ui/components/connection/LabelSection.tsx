import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Switch } from '../shared/Switch';
import {
  FillColorIcon,
  StrokeColorIcon,
  IcTextAlignLeft,
  IcTextAlignCenter,
  IcTextAlignRight,
} from '../shared/icons';
import { ConnectorLabelBoxStyle, ConnectorLabelAlign } from '../../../types';

interface StyleOption {
  label: string;
  value: ConnectorLabelBoxStyle;
}

const STYLE_OPTIONS: StyleOption[] = [
  { label: 'Box', value: 'BOX' },
  { label: 'Capsule', value: 'CAPSULE' },
  { label: 'Round box', value: 'ROUNDED_BOX' },
  { label: 'line', value: 'LINE' },
];

/**
 * 피그마 UI3 공식 24×24px 컬러 팔레트 SVG 아이콘
 */
const PALETTE_ICON_SVG = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7.04976 7.04976C9.78343 4.31609 14.2165 4.31609 16.9502 7.04976C18.1125 8.2121 18.7807 9.685 18.9541 11.2011C19.1539 12.9507 17.5939 14 16.2246 14H15C14.4477 14 14 14.4477 14 15V16.2246C14 17.594 12.9499 19.1542 11.2002 18.9541C9.68423 18.7806 8.21195 18.1123 7.04976 16.9502C4.31609 14.2165 4.31609 9.78343 7.04976 7.04976ZM16.2421 7.75777C13.899 5.41463 10.1009 5.41463 7.75777 7.75777C5.41463 10.1009 5.41463 13.899 7.75777 16.2421C8.75465 17.239 10.0147 17.8122 11.3144 17.9609C12.2846 18.0718 13 17.2011 13 16.2246V15C13 13.8954 13.8954 13 15 13H16.2246C17.2011 13 18.0718 12.2846 17.9609 11.3144C17.8123 10.0147 17.239 8.75467 16.2421 7.75777ZM13 8.00003C13 8.55232 12.5523 9.00003 12 9.00003C11.4477 9.00003 11 8.55232 11 8.00003C11 7.44775 11.4477 7.00003 12 7.00003C12.5523 7.00003 13 7.44775 13 8.00003ZM9.86617 10.5002C10.1423 10.0219 9.97843 9.41032 9.50014 9.13417C9.02185 8.85803 8.41026 9.02191 8.13411 9.5002C7.85797 9.97849 8.02185 10.5901 8.50014 10.8662C8.97843 11.1424 9.59002 10.9785 9.86617 10.5002ZM15.5001 10.8662C15.0218 11.1424 14.4103 10.9785 14.1341 10.5002C13.858 10.0219 14.0218 9.41032 14.5001 9.13417C14.9784 8.85803 15.59 9.02191 15.8662 9.5002C16.1423 9.97849 15.9784 10.5901 15.5001 10.8662ZM8.13411 14.5002C8.41026 14.9785 9.02185 15.1424 9.50014 14.8662C9.97843 14.5901 10.1423 13.9785 9.86617 13.5002C9.59002 13.0219 8.97843 12.858 8.50014 13.1342C8.02185 13.4103 7.85797 14.0219 8.13411 14.5002Z"
      fill="currentColor"
    />
  </svg>
);

/**
 * HEX 색상 문자열 정규화 (앞 # 보장 및 대문자 변환)
 */
function normalizeHex(hex: string): string {
  const clean = hex.replace('#', '').trim();
  if (/^[0-9A-Fa-f]{6}$/.test(clean)) {
    return `#${clean.toUpperCase()}`;
  }
  return hex.startsWith('#') ? hex.toUpperCase() : `#${hex.toUpperCase()}`;
}

/**
 * Label 섹션 (Figma UI3 1027430:2049 디자인 스펙)
 * - 1행: Label 타이틀 + 토글 스위치
 * - 2행: Add a label 텍스트 인풋
 * - 3행: [배경색 인풋박스(Style 컴포넌트)] [보더색 인풋박스(Style 컴포넌트)] [정렬 세그먼트(StepBadges 컴포넌트)]
 * - 4행: [Box] [Capsule] [Round box] [line] 프리셋 칩(Size 컴포넌트)
 */
export function LabelSection() {
  const {
    lastConnectorConfig,
    setLastConnectorConfig,
    applyCurrentConnectorState,
    autoResizeWindow,
    setActiveModal,
  } = useApp();

  const [isOn, setIsOn] = useState(lastConnectorConfig.labelOn || false);
  const [labelText, setLabelText] = useState(lastConnectorConfig.labelText || '');
  const [fillColor, setFillColor] = useState(lastConnectorConfig.labelFillColor || '#EA2039');
  const [strokeColor, setStrokeColor] = useState(lastConnectorConfig.labelStrokeColor || '#EA2039');
  const [fillHexInput, setFillHexInput] = useState((lastConnectorConfig.labelFillColor || '#EA2039').replace('#', ''));
  const [strokeHexInput, setStrokeHexInput] = useState((lastConnectorConfig.labelStrokeColor || '#EA2039').replace('#', ''));
  const [align, setAlign] = useState<ConnectorLabelAlign>(lastConnectorConfig.labelAlign || 'LEFT');
  const [boxStyle, setBoxStyle] = useState<ConnectorLabelBoxStyle>(lastConnectorConfig.labelBoxStyle || 'BOX');

  const labelDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (labelDebounceRef.current) {
        clearTimeout(labelDebounceRef.current);
      }
    };
  }, []);

  // 외부(노드 선택 변경 등) 동기화
  useEffect(() => {
    setIsOn(lastConnectorConfig.labelOn || false);
    if (lastConnectorConfig.labelText !== undefined) {
      setLabelText(lastConnectorConfig.labelText);
    }
    if (lastConnectorConfig.labelFillColor) {
      setFillColor(lastConnectorConfig.labelFillColor);
      setFillHexInput(lastConnectorConfig.labelFillColor.replace('#', ''));
    }
    if (lastConnectorConfig.labelStrokeColor) {
      setStrokeColor(lastConnectorConfig.labelStrokeColor);
      setStrokeHexInput(lastConnectorConfig.labelStrokeColor.replace('#', ''));
    }
    if (lastConnectorConfig.labelAlign) {
      setAlign(lastConnectorConfig.labelAlign);
    }
    if (lastConnectorConfig.labelBoxStyle) {
      setBoxStyle(lastConnectorConfig.labelBoxStyle);
    }
  }, [
    lastConnectorConfig.labelOn,
    lastConnectorConfig.labelText,
    lastConnectorConfig.labelFillColor,
    lastConnectorConfig.labelStrokeColor,
    lastConnectorConfig.labelAlign,
    lastConnectorConfig.labelBoxStyle,
  ]);

  function handleToggle(checked: boolean) {
    if (labelDebounceRef.current) clearTimeout(labelDebounceRef.current);
    setIsOn(checked);
    setLastConnectorConfig({ labelOn: checked });
    autoResizeWindow();
    setTimeout(() => applyCurrentConnectorState(), 0);
  }

  function handleTextChange(val: string) {
    setLabelText(val);
    setLastConnectorConfig({ labelText: val });
    if (labelDebounceRef.current) clearTimeout(labelDebounceRef.current);
    labelDebounceRef.current = setTimeout(() => {
      applyCurrentConnectorState();
    }, 250);
  }

  function handleFillColorSelect(color: string) {
    const norm = normalizeHex(color);
    setFillColor(norm);
    setFillHexInput(norm.replace('#', ''));
    setLastConnectorConfig({ labelFillColor: norm });
    setTimeout(() => applyCurrentConnectorState(), 0);
  }

  function handleFillHexBlur() {
    const clean = fillHexInput.replace('#', '').trim();
    if (/^[0-9A-Fa-f]{6}$/.test(clean)) {
      handleFillColorSelect(`#${clean}`);
    } else {
      setFillHexInput(fillColor.replace('#', ''));
    }
  }

  function handleStrokeColorSelect(color: string) {
    const norm = normalizeHex(color);
    setStrokeColor(norm);
    setStrokeHexInput(norm.replace('#', ''));
    setLastConnectorConfig({ labelStrokeColor: norm });
    setTimeout(() => applyCurrentConnectorState(), 0);
  }

  function handleStrokeHexBlur() {
    const clean = strokeHexInput.replace('#', '').trim();
    if (/^[0-9A-Fa-f]{6}$/.test(clean)) {
      handleStrokeColorSelect(`#${clean}`);
    } else {
      setStrokeHexInput(strokeColor.replace('#', ''));
    }
  }

  function handleAlignSelect(newAlign: ConnectorLabelAlign) {
    setAlign(newAlign);
    setLastConnectorConfig({ labelAlign: newAlign });
    setTimeout(() => applyCurrentConnectorState(), 0);
  }

  function handleBoxStyleSelect(newStyle: ConnectorLabelBoxStyle) {
    setBoxStyle(newStyle);
    setLastConnectorConfig({ labelBoxStyle: newStyle });
    setTimeout(() => applyCurrentConnectorState(), 0);
  }

  return (
    <div className="section-block" style={{ paddingBottom: isOn ? '12px' : '0px' }}>
      {/* 1행: Label 타이틀 및 스위치 */}
      <div className="section-header toggle-row">
        <span className="section-title">Label</span>
        <Switch
          id="toggle-conn-label"
          checked={isOn}
          onChange={handleToggle}
        />
      </div>

      {isOn && (
        <div className="section-body">
          <div className="conn-label-body">
            {/* 2행: 텍스트 입력 인풋 */}
            <input
              type="text"
              id="input-conn-label"
              className="conn-label-input"
              placeholder="Add a label"
              value={labelText}
              onChange={e => handleTextChange(e.target.value)}
              spellCheck={false}
              autoComplete="off"
            />

            {/* 3행: [배경색 인풋] [보더색 인풋] [텍스트 정렬 세그먼트] */}
            <div className="style-inputs-row">
              {/* (1) Fill Color 컨트롤 박스 (Style 컴포넌트 규격) */}
              <div className="style-input-box style-color-input-box">
                <FillColorIcon
                  color={fillColor}
                  isNone={false}
                  onClick={() => setActiveModal('label-fill-color')}
                  title="Fill color"
                />
                <input
                  type="text"
                  className="style-text-input"
                  value={fillHexInput}
                  maxLength={6}
                  placeholder="FFFFFF"
                  onChange={e => setFillHexInput(e.target.value)}
                  onBlur={handleFillHexBlur}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleFillHexBlur();
                  }}
                  onFocus={e => e.currentTarget.select()}
                  spellCheck={false}
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="style-palette-action-btn"
                  title="Fill color picker"
                  onClick={() => setActiveModal('label-fill-color')}
                >
                  {PALETTE_ICON_SVG}
                </button>
              </div>

              {/* (2) Stroke Color 컨트롤 박스 (Style 컴포넌트 규격) */}
              <div className="style-input-box style-color-input-box">
                <button
                  type="button"
                  className="style-stroke-btn"
                  title="Stroke color"
                  onClick={() => setActiveModal('label-stroke-color')}
                >
                  <StrokeColorIcon
                    color={strokeColor}
                    isNone={false}
                  />
                </button>
                <input
                  type="text"
                  className="style-text-input"
                  value={strokeHexInput}
                  maxLength={6}
                  placeholder="000000"
                  onChange={e => setStrokeHexInput(e.target.value)}
                  onBlur={handleStrokeHexBlur}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleStrokeHexBlur();
                  }}
                  onFocus={e => e.currentTarget.select()}
                  spellCheck={false}
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="style-palette-action-btn"
                  title="Stroke color picker"
                  onClick={() => setActiveModal('label-stroke-color')}
                >
                  {PALETTE_ICON_SVG}
                </button>
              </div>

              {/* (3) 텍스트 가로 정렬 세그먼트 (StepBadges corner-position-group 규격) */}
              <div className="corner-position-group">
                <button
                  type="button"
                  className={`corner-btn${align === 'LEFT' ? ' active' : ''}`}
                  title="Align left"
                  onClick={() => handleAlignSelect('LEFT')}
                >
                  <IcTextAlignLeft size={16} />
                </button>
                <button
                  type="button"
                  className={`corner-btn${align === 'CENTER' ? ' active' : ''}`}
                  title="Align center"
                  onClick={() => handleAlignSelect('CENTER')}
                >
                  <IcTextAlignCenter size={16} />
                </button>
                <button
                  type="button"
                  className={`corner-btn${align === 'RIGHT' ? ' active' : ''}`}
                  title="Align right"
                  onClick={() => handleAlignSelect('RIGHT')}
                >
                  <IcTextAlignRight size={16} />
                </button>
              </div>
            </div>

            {/* 4행: 스타일 형태 프리셋 칩 (Size chip-group 규격) */}
            <div className="chip-group" style={{ marginTop: '4px', flexWrap: 'wrap', gap: '4px' }}>
              {STYLE_OPTIONS.map(opt => {
                const isActive = boxStyle === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`chip-btn${isActive ? ' active' : ''}`}
                    onClick={() => handleBoxStyleSelect(opt.value)}
                  >
                    <span className="tab-label">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
