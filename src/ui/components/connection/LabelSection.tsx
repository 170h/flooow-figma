import React, { useState, useEffect, useRef } from 'react';
import { useApp, NodeInfo } from '../../context/AppContext';
import { Switch } from '../shared/Switch';
import {
  FillColorIcon,
  StrokeColorIcon,
  IcTextAlignLeft,
  IcTextAlignCenter,
  IcTextAlignRight,
} from '../shared/icons';
import { ConnectorLabelBoxStyle, ConnectorLabelAlign } from '../../../types';
import { useSelectionSummary } from '../../hooks/useSelectionSummary';

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
 * None(배경 투명 / 보더 삭제) 컬러 값 판별
 */
function isNoneColor(color?: string): boolean {
  const c = (color || '').trim().toLowerCase();
  return c === 'none' || c === 'transparent';
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
    selectedNodes,
    isConnectorSelected,
    lastConnectorConfig,
    setLastConnectorConfig,
    markConnectorDirty,
    autoResizeWindow,
    setActiveModal,
    connectorLabelDraft,
    updateConnectorLabelDraft,
  } = useApp();

  const summary = useSelectionSummary();
  const connCount = selectedNodes.filter(n => n && n.isConnector).length;
  const flowCount = selectedNodes.filter(n => n && !n.isConnector).length;
  // 노드와 커넥터가 함께 선택된 경우에만 Label 편집을 막는다
  const isMixedWithNodes = connCount > 0 && flowCount > 0;
  const isMultiConnector = summary.isMultiConnector;

  const [isOn, setIsOn] = useState(lastConnectorConfig.labelOn || false);
  const draftOn = connectorLabelDraft.labelOn;
  const isLabelOnMixed = isMultiConnector && draftOn === undefined && summary.connectorLabelOn.isMixed;
  const effectiveIsOn = isMixedWithNodes
    ? false
    : isMultiConnector
      ? (draftOn !== undefined ? draftOn : Boolean(summary.connectorLabelOn.value) || isLabelOnMixed)
      : isOn;

  const [labelText, setLabelText] = useState(lastConnectorConfig.labelText || '');
  const [fillColor, setFillColor] = useState(lastConnectorConfig.labelFillColor || '#FFFFFF');
  const [strokeColor, setStrokeColor] = useState(lastConnectorConfig.labelStrokeColor || '#000000');
  const [fillHexInput, setFillHexInput] = useState((lastConnectorConfig.labelFillColor || '#FFFFFF').replace('#', ''));
  const [strokeHexInput, setStrokeHexInput] = useState((lastConnectorConfig.labelStrokeColor || '#000000').replace('#', ''));
  const [align, setAlign] = useState<ConnectorLabelAlign>(lastConnectorConfig.labelAlign || 'LEFT');
  const [colorEditing, setColorEditing] = useState<'fill' | 'stroke' | null>(null);
  const [boxStyle, setBoxStyle] = useState<ConnectorLabelBoxStyle>(lastConnectorConfig.labelBoxStyle || 'BOX');

  // 직전 유효 컬러 기억 (None 해제 시 복원용)
  const lastValidFillRef = useRef<string>(isNoneColor(fillColor) ? '#FFFFFF' : fillColor);
  const lastValidStrokeRef = useRef<string>(isNoneColor(strokeColor) ? '#000000' : strokeColor);
  useEffect(() => {
    if (!isNoneColor(fillColor)) lastValidFillRef.current = fillColor;
  }, [fillColor]);
  useEffect(() => {
    if (!isNoneColor(strokeColor)) lastValidStrokeRef.current = strokeColor;
  }, [strokeColor]);

  const labelDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const labelInputRef = useRef<HTMLInputElement | null>(null);
  const lastSelectedNodeIdRef = useRef<string | null>(null);
  const isFocusedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (labelDebounceRef.current) {
        clearTimeout(labelDebounceRef.current);
      }
    };
  }, []);

  // 외부(노드 선택 변경 등) 동기화
  useEffect(() => {
    const validNodes = (selectedNodes || []).filter((n): n is NodeInfo => Boolean(n));
    const currentNodeId = validNodes.length === 1
      ? validNodes[0]?.id
      : (validNodes.length > 1 ? 'MULTI' : 'NONE');
    const isDifferentNode = currentNodeId !== lastSelectedNodeIdRef.current;
    if (isDifferentNode) {
      lastSelectedNodeIdRef.current = currentNodeId;
    }

    if (isMultiConnector || isMixedWithNodes) return;

    const activeEl = typeof document !== 'undefined' ? document.activeElement : null;
    const isInputFocused = isFocusedRef.current || (labelInputRef.current !== null && activeEl === labelInputRef.current);

    // isOn은 노드가 실제로 바뀐 경우에만 외부 값으로 덮어씀
    // 같은 노드에서 labelText만 변경되었을 때 effect가 재실행되더라도
    // 사용자가 토글로 설정한 isOn 상태를 보존한다
    // 입력 포커스 중 벡터→그룹 승격으로 id가 바뀌어도 토글/텍스트를 덮어쓰지 않음
    if (isDifferentNode && !isInputFocused) {
      setIsOn(lastConnectorConfig.labelOn || false);
    }

    if (lastConnectorConfig.labelText !== undefined) {
      // 포커스 중인 입력 필드는 외부 SELECTION_CHANGED 역동기화로 덮어쓰지 않음 (GEMINI.md §12)
      if (!isInputFocused) {
        setLabelText(lastConnectorConfig.labelText);
        if (labelInputRef.current && labelInputRef.current.value !== lastConnectorConfig.labelText) {
          labelInputRef.current.value = lastConnectorConfig.labelText;
        }
      }
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
    selectedNodes,
    lastConnectorConfig.labelOn,
    lastConnectorConfig.labelText,
    lastConnectorConfig.labelFillColor,
    lastConnectorConfig.labelStrokeColor,
    lastConnectorConfig.labelAlign,
    lastConnectorConfig.labelBoxStyle,
    isMultiConnector,
    isMixedWithNodes,
  ]);

  const displayText = isMultiConnector
    ? (connectorLabelDraft.labelText !== undefined
        ? connectorLabelDraft.labelText
        : (summary.connectorLabel.isMixed ? '' : (summary.connectorLabel.value || '')))
    : labelText;
  const isTextMixed = isMultiConnector && connectorLabelDraft.labelText === undefined && summary.connectorLabel.isMixed;
  const displayFill = isMultiConnector
    ? (connectorLabelDraft.labelFillColor ?? (summary.connectorLabelFillColor.isMixed ? '' : (summary.connectorLabelFillColor.value || '#FFFFFF')))
    : fillColor;
  const isFillMixed = isMultiConnector && connectorLabelDraft.labelFillColor === undefined && summary.connectorLabelFillColor.isMixed;
  const displayStroke = isMultiConnector
    ? (connectorLabelDraft.labelStrokeColor ?? (summary.connectorLabelStrokeColor.isMixed ? '' : (summary.connectorLabelStrokeColor.value || '#000000')))
    : strokeColor;
  const isStrokeMixed = isMultiConnector && connectorLabelDraft.labelStrokeColor === undefined && summary.connectorLabelStrokeColor.isMixed;
  const displayAlign = isMultiConnector
    ? (connectorLabelDraft.labelAlign ?? (summary.connectorLabelAlign.isMixed ? undefined : summary.connectorLabelAlign.value))
    : align;
  const isAlignMixed = isMultiConnector && connectorLabelDraft.labelAlign === undefined && summary.connectorLabelAlign.isMixed;
  const displayBoxStyle = isMultiConnector
    ? (connectorLabelDraft.labelBoxStyle ?? (summary.connectorLabelBoxStyle.isMixed ? undefined : summary.connectorLabelBoxStyle.value))
    : boxStyle;
  const isStyleMixed = isMultiConnector && connectorLabelDraft.labelBoxStyle === undefined && summary.connectorLabelBoxStyle.isMixed;
  const showMixedTag = isLabelOnMixed || isTextMixed || isFillMixed || isStrokeMixed || isAlignMixed || isStyleMixed;
  const isFillNone = !isFillMixed && isNoneColor(displayFill || fillColor);
  const isStrokeNone = !isStrokeMixed && isNoneColor(displayStroke || strokeColor);

  function handleToggle(checked: boolean) {
    if (isMixedWithNodes) return;
    if (isMultiConnector) {
      updateConnectorLabelDraft({ labelOn: checked });
      autoResizeWindow();
      return;
    }
    if (labelDebounceRef.current) clearTimeout(labelDebounceRef.current);
    setIsOn(checked);
    setLastConnectorConfig({ labelOn: checked });
    autoResizeWindow();
    setTimeout(() => markConnectorDirty(), 0);
  }

  /**
   * 라벨 최대 글자수 = 입력필드에 한 줄로 보이는 폭까지.
   * 텍스트가 입력필드 폭을 넘으면(scrollWidth > clientWidth) 넘치지 않을 때까지 끝 글자를 잘라냄.
   * (글자 폭을 직접 반영하므로 한글/영문 폭 차이도 자동 대응, IME 조합 중에는 호출하지 않음)
   */
  function clampToInputWidth(el: HTMLInputElement) {
    while (el.value.length > 0 && el.scrollWidth > el.clientWidth) {
      el.value = el.value.slice(0, -1);
    }
  }

  function handleInput(e: React.FormEvent<HTMLInputElement>) {
    const nativeEvt = e.nativeEvent as InputEvent;
    // IME 조합 중에는 글자가 확정되지 않았으므로 조합 종료(onCompositionEnd) 시점에 제한 적용
    if (!nativeEvt.isComposing) {
      clampToInputWidth(e.currentTarget);
    }
    const val = e.currentTarget.value;
    if (isMultiConnector) {
      updateConnectorLabelDraft({ labelText: val });
      return;
    }
    setLabelText(val);
    setLastConnectorConfig({ labelText: val });
    if (labelDebounceRef.current) clearTimeout(labelDebounceRef.current);
    labelDebounceRef.current = setTimeout(() => {
      markConnectorDirty();
    }, 250);
  }

  function handleFillColorSelect(color: string) {
    const norm = normalizeHex(color);
    if (isMultiConnector) {
      updateConnectorLabelDraft({ labelFillColor: norm });
      return;
    }
    setFillColor(norm);
    setFillHexInput(norm.replace('#', ''));
    setLastConnectorConfig({ labelFillColor: norm });
    setTimeout(() => markConnectorDirty(), 0);
  }

  // 배경 투명(None) 적용
  function handleFillNone() {
    if (isMultiConnector) {
      updateConnectorLabelDraft({ labelFillColor: 'None' });
      return;
    }
    setFillColor('None');
    setFillHexInput('None');
    setLastConnectorConfig({ labelFillColor: 'None' });
    setTimeout(() => markConnectorDirty(), 0);
  }

  // Fill 칩 클릭: 배경 끄기/켜기 토글
  function handleFillChipClick() {
    if (isFillNone) {
      handleFillColorSelect(lastValidFillRef.current || '#FFFFFF');
    } else {
      handleFillNone();
    }
  }

  function handleFillHexChange(raw: string) {
    if (raw.trim().toLowerCase() === 'none') {
      handleFillNone();
      return;
    }
    setFillHexInput(raw);
  }

  function handleFillHexBlur() {
    const clean = fillHexInput.replace('#', '').trim();
    if (clean === '' || clean.toLowerCase() === 'none') {
      if (!isFillNone) handleFillNone();
    } else if (/^[0-9A-Fa-f]{6}$/.test(clean)) {
      handleFillColorSelect(`#${clean}`);
    } else {
      setFillHexInput(isFillNone ? 'None' : (displayFill || fillColor).replace('#', ''));
    }
  }

  function handleStrokeColorSelect(color: string) {
    const norm = normalizeHex(color);
    if (isMultiConnector) {
      updateConnectorLabelDraft({ labelStrokeColor: norm });
      return;
    }
    setStrokeColor(norm);
    setStrokeHexInput(norm.replace('#', ''));
    setLastConnectorConfig({ labelStrokeColor: norm });
    setTimeout(() => markConnectorDirty(), 0);
  }

  // 보더 삭제(None) 적용
  function handleStrokeNone() {
    if (isMultiConnector) {
      updateConnectorLabelDraft({ labelStrokeColor: 'None' });
      return;
    }
    setStrokeColor('None');
    setStrokeHexInput('None');
    setLastConnectorConfig({ labelStrokeColor: 'None' });
    setTimeout(() => markConnectorDirty(), 0);
  }

  // Stroke 칩 클릭: 보더 끄기/켜기 토글
  function handleStrokeChipClick() {
    if (isStrokeNone) {
      handleStrokeColorSelect(lastValidStrokeRef.current || '#000000');
    } else {
      handleStrokeNone();
    }
  }

  function handleStrokeHexChange(raw: string) {
    if (raw.trim().toLowerCase() === 'none') {
      handleStrokeNone();
      return;
    }
    setStrokeHexInput(raw);
  }

  function handleStrokeHexBlur() {
    const clean = strokeHexInput.replace('#', '').trim();
    if (clean === '' || clean.toLowerCase() === 'none') {
      if (!isStrokeNone) handleStrokeNone();
    } else if (/^[0-9A-Fa-f]{6}$/.test(clean)) {
      handleStrokeColorSelect(`#${clean}`);
    } else {
      setStrokeHexInput(isStrokeNone ? 'None' : (displayStroke || strokeColor).replace('#', ''));
    }
  }

  function handleAlignSelect(newAlign: ConnectorLabelAlign) {
    if (isMultiConnector) {
      updateConnectorLabelDraft({ labelAlign: newAlign });
      return;
    }
    setAlign(newAlign);
    setLastConnectorConfig({ labelAlign: newAlign });
    setTimeout(() => markConnectorDirty(), 0);
  }

  function handleBoxStyleSelect(newStyle: ConnectorLabelBoxStyle) {
    if (isMultiConnector) {
      updateConnectorLabelDraft({ labelBoxStyle: newStyle });
      return;
    }
    setBoxStyle(newStyle);
    setLastConnectorConfig({ labelBoxStyle: newStyle });
    setTimeout(() => markConnectorDirty(), 0);
  }

  return (
    <div className="section-block" style={{ paddingBottom: effectiveIsOn ? '12px' : '0px' }}>
      {/* 1행: Label 타이틀 및 스위치 */}
      <div className="section-header toggle-row">
        <span className={`section-title${isMixedWithNodes ? ' disabled' : ''}`}>
          Label
          {showMixedTag && <span className="section-mixed-label">(Mixed)</span>}
        </span>
        <Switch
          id="toggle-conn-label"
          checked={isMultiConnector ? (draftOn !== undefined ? draftOn : Boolean(summary.connectorLabelOn.value)) : effectiveIsOn}
          isMixed={isLabelOnMixed}
          disabled={isMixedWithNodes}
          onChange={handleToggle}
        />
      </div>

      {effectiveIsOn && (
        <div className="section-body">
          <div className="conn-label-body">
            {/* 2행: 텍스트 입력 인풋 (INV-05 DOM truth 규격) */}
            <input
              ref={labelInputRef}
              type="text"
              id="input-conn-label"
              className="conn-label-input"
              data-tooltip="Label text"
              placeholder={isTextMixed ? 'Mixed' : 'Add a label'}
              {...(isMultiConnector
                ? { value: displayText }
                : { defaultValue: lastConnectorConfig.labelText || '' })}
              onFocus={() => { isFocusedRef.current = true; }}
              onBlur={() => {
                isFocusedRef.current = false;
                markConnectorDirty();
              }}
              onInput={handleInput}
              onCompositionEnd={e => {
                // 한글 등 IME 조합이 끝난 뒤 폭 제한 적용 후 변경 내용 반영
                clampToInputWidth(e.currentTarget);
                handleInput(e);
              }}
              spellCheck={false}
              autoComplete="off"
            />

            {/* 3행: [배경색 인풋] [보더색 인풋] [텍스트 정렬 세그먼트] */}
            <div className="style-inputs-row">
              {/* (1) Fill Color 컨트롤 박스 (Style 컴포넌트 규격) */}
              <div className="style-input-box style-color-input-box" data-tooltip="Label fill color">
                {/* 컬러 칩 (클릭 시 배경 투명 None 토글) */}
                <FillColorIcon
                  color={isFillNone ? lastValidFillRef.current : (displayFill || fillColor)}
                  isNone={isFillNone}
                  isMixed={isFillMixed}
                  onClick={handleFillChipClick}
                />
                <input
                  type="text"
                  className={`style-text-input${isFillNone ? ' is-none' : ''}`}
                  value={isMultiConnector && colorEditing !== 'fill'
                    ? (isFillMixed ? '' : (isFillNone ? 'None' : (displayFill || '').replace('#', '')))
                    : fillHexInput}
                  maxLength={6}
                  placeholder={isFillMixed ? 'Mixed' : (isFillNone ? 'None' : 'FFFFFF')}
                  onChange={e => handleFillHexChange(e.target.value)}
                  onBlur={() => { setColorEditing(null); handleFillHexBlur(); }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleFillHexBlur();
                  }}
                  onFocus={e => {
                    setColorEditing('fill');
                    setFillHexInput(isFillMixed || isFillNone ? '' : (displayFill || fillColor).replace('#', ''));
                    e.currentTarget.select();
                  }}
                  spellCheck={false}
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="style-palette-action-btn"
                  onClick={() => setActiveModal('label-fill-color')}
                >
                  {PALETTE_ICON_SVG}
                </button>
              </div>

              {/* (2) Stroke Color 컨트롤 박스 (Style 컴포넌트 규격) */}
              <div className="style-input-box style-color-input-box" data-tooltip="Label stroke color">
                <button
                  type="button"
                  className="style-stroke-btn"
                  data-tooltip={isStrokeMixed ? 'Mixed stroke' : (isStrokeNone ? 'Show border' : 'Hide border')}
                  onClick={handleStrokeChipClick}
                >
                  <StrokeColorIcon
                    color={isStrokeNone ? lastValidStrokeRef.current : (displayStroke || strokeColor)}
                    isNone={isStrokeNone}
                    isMixed={isStrokeMixed}
                  />
                </button>
                <input
                  type="text"
                  className={`style-text-input${isStrokeNone ? ' is-none' : ''}`}
                  value={isMultiConnector && colorEditing !== 'stroke'
                    ? (isStrokeMixed ? '' : (isStrokeNone ? 'None' : (displayStroke || '').replace('#', '')))
                    : strokeHexInput}
                  maxLength={6}
                  placeholder={isStrokeMixed ? 'Mixed' : (isStrokeNone ? 'None' : '000000')}
                  onChange={e => handleStrokeHexChange(e.target.value)}
                  onBlur={() => { setColorEditing(null); handleStrokeHexBlur(); }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleStrokeHexBlur();
                  }}
                  onFocus={e => {
                    setColorEditing('stroke');
                    setStrokeHexInput(isStrokeMixed || isStrokeNone ? '' : (displayStroke || strokeColor).replace('#', ''));
                    e.currentTarget.select();
                  }}
                  spellCheck={false}
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="style-palette-action-btn"
                  onClick={() => setActiveModal('label-stroke-color')}
                >
                  {PALETTE_ICON_SVG}
                </button>
              </div>

              {/* (3) 텍스트 가로 정렬 세그먼트 (StepBadges corner-position-group 규격) */}
              <div className="corner-position-group">
                <button
                  type="button"
                  className={`corner-btn${displayAlign === 'LEFT' ? ' active' : ''}`}
                  data-tooltip="Align left"
                  onClick={() => handleAlignSelect('LEFT')}
                >
                  <IcTextAlignLeft size={16} />
                </button>
                <button
                  type="button"
                  className={`corner-btn${displayAlign === 'CENTER' ? ' active' : ''}`}
                  data-tooltip="Align center"
                  onClick={() => handleAlignSelect('CENTER')}
                >
                  <IcTextAlignCenter size={16} />
                </button>
                <button
                  type="button"
                  className={`corner-btn${displayAlign === 'RIGHT' ? ' active' : ''}`}
                  data-tooltip="Align right"
                  onClick={() => handleAlignSelect('RIGHT')}
                >
                  <IcTextAlignRight size={16} />
                </button>
              </div>
            </div>

            {/* 4행: 스타일 형태 프리셋 칩 (Size chip-group 규격) */}
            <div className="chip-group" style={{ marginTop: '4px', flexWrap: 'wrap', gap: '4px' }}>
              {STYLE_OPTIONS.map(opt => {
                const isActive = displayBoxStyle === opt.value;
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
