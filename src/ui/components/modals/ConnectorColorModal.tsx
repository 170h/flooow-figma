import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { t } from "../../../i18n";

// 피그마 UI3 공식 24×24px 닫기 SVG 아이콘
const CLOSE_SVG = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M16.6464 6.64645C16.8417 6.45118 17.1582 6.45118 17.3535 6.64645C17.5487 6.84171 17.5487 7.15822 17.3535 7.35348L12.707 12L17.3535 16.6464C17.5487 16.8417 17.5487 17.1582 17.3535 17.3535C17.1582 17.5487 16.8417 17.5487 16.6464 17.3535L12 12.707L7.35348 17.3535C7.15822 17.5487 6.84171 17.5487 6.64645 17.3535C6.45118 17.1582 6.45118 16.8417 6.64645 16.6464L11.2929 12L6.64645 7.35348C6.45123 7.15821 6.4512 6.84169 6.64645 6.64645C6.8417 6.45125 7.15823 6.45125 7.35348 6.64645L12 11.2929L16.6464 6.64645Z"
      fill="currentColor"
    />
  </svg>
);

import { ColorWheelField } from "../shared/ColorWheelField";
import { useApp, StylePreset } from "../../context/AppContext";

// 스타일 프리셋 중 보더컬러가 있는 것은 보더 컬러만, 없는 것은 배경 컬러 반환 (커넥터 라인 컬러)
function getPresetLineColor(preset: StylePreset): string {
  const hasBorder = (preset.strokeWeight ?? 0) > 0 && !!preset.strokeColor;
  return (hasBorder ? preset.strokeColor : preset.fillColor).toUpperCase();
}

export interface ConnectorColorModalProps {
  initialColor: string;
  onApply: (colorHex: string) => void;
  onClose: () => void;
  isMixed?: boolean;
}

/**
 * Connector Color 모달 (Figma UI3 Node 1027394:7443 공식 디자인)
 * - 상단: Connector Color 타이틀 및 닫기 버튼
 * - 색상 프리셋 그리드: 중복 제거된 단일 라인 컬러 카드 (White 선택 시 퍼플 링)
 * - 일체형 ColorWheelField: 16진수 입력 필드 + 레인보우 도넛 휠 배지 + 원형 컬러 휠(Hue) + 2D 채도/명도 디스크
 * - Cancel / Apply 버튼
 */
export function ConnectorColorModal({
  initialColor,
  onApply,
  onClose,
  isMixed: initialIsMixed = false,
}: ConnectorColorModalProps) {
  const { stylePresets } = useApp();
  const [colorHex, setColorHex] = useState(() =>
    initialIsMixed ? "" : initialColor.replace("#", "").toUpperCase(),
  );
  const [isMixed, setIsMixed] = useState(Boolean(initialIsMixed));
  const [showWheel, setShowWheel] = useState(false);

  // 기본 무채색 3종(White, Gray, Black) + 스타일 프리셋의 고유 컬러(중복 제외)
  const uniqueColorPresets = useMemo(() => {
    const seen = new Set<string>();
    const result: { id: string; name?: string; color: string }[] = [];

    // 1. 기본 무채색 4종 (화이트, 라이트 그레이, 그레이, 블랙)
    const baseColors = [
      { id: "conn-default-white", name: "White", color: "#FFFFFF" },
      { id: "conn-default-light-gray", name: "Light Gray", color: "#B3B3B3" },
      { id: "conn-default-gray", name: "Gray", color: "#757575" },
      { id: "conn-default-black", name: "Black", color: "#000000" },
    ];

    for (const base of baseColors) {
      seen.add(base.color.toUpperCase());
      result.push(base);
    }

    // 2. 스타일 프리셋에서 중복되지 않는 라인 컬러 순차 추가
    for (const preset of stylePresets) {
      const lineColor = getPresetLineColor(preset);
      if (!seen.has(lineColor)) {
        seen.add(lineColor);
        result.push({
          id: preset.id,
          name: preset.name,
          color: lineColor,
        });
      }
    }
    return result;
  }, [stylePresets]);

  // 상단 5개, 하단 나머지 행으로 분할
  const presetsRow1 = uniqueColorPresets.slice(0, 5);
  const presetsRow2 = uniqueColorPresets.slice(5);

  // 초기값 동기화
  useEffect(() => {
    if (!initialIsMixed) {
      setColorHex(initialColor.replace("#", "").toUpperCase());
    } else {
      setColorHex("");
    }
  }, [initialColor, initialIsMixed]);

  useEffect(() => {
    setIsMixed(Boolean(initialIsMixed));
  }, [initialIsMixed]);

  // 1. 프리셋 색상 선택 (컬러칩 클릭 시 어플라이 버튼 없이 즉시 적용 및 모달 닫기)
  function handleSelectPreset(hex: string) {
    setIsMixed(false);
    const formatted = hex.replace("#", "").toUpperCase();
    setColorHex(formatted);
    onApply(`#${formatted}`);
    onClose();
  }

  // 2. 취소 핸들러 (원래 색상으로 복원 후 닫기)
  function handleCancel() {
    if (!initialIsMixed) {
      onApply(initialColor);
    }
    onClose();
  }

  // 3. 적용 핸들러 (현재 선택된 컬러 확정 적용 후 닫기)
  function handleApply() {
    if (!colorHex || colorHex.trim() === "") {
      onClose();
      return;
    }
    const finalHex = `#${
      colorHex.length === 3
        ? colorHex
            .split("")
            .map((c) => c + c)
            .join("")
        : colorHex
    }`;
    onApply(finalHex);
    onClose();
  }

  const currentFormattedHex = colorHex
    ? `#${
        colorHex.length === 3
          ? colorHex
              .split("")
              .map((c) => c + c)
              .join("")
          : colorHex
      }`
    : "";

  return (
    <div
      id="modal-connector-color-backdrop"
      className="popover-backdrop"
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
        id="modal-connector-color"
        className="conn-color-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. 모달 헤더 (Connector Color + 닫기 버튼) */}
        <div className="conn-color-modal-header">
          <span className="conn-color-modal-title">
            Connector Color
            {isMixed && (
              <span
                style={{
                  fontSize: "11px",
                  color: "var(--figma-color-text-tertiary, #999)",
                  marginLeft: "6px",
                  fontWeight: "normal",
                }}
              >
                (Mixed)
              </span>
            )}
          </span>
          <button
            type="button"
            className="style-modal-close-btn"
            onClick={onClose}
            data-tooltip={t('tipClose')}
          >
            {CLOSE_SVG}
          </button>
        </div>

        <div className="conn-color-modal-divider" />

        {/* 2. 컬러 프리셋 카드 그리드 (중복 제거된 라인 반영 컬러 단일 솔리드로 표시, Mixed일 때는 활성 칩 없음) */}
        <div className="conn-color-presets-wrapper">
          {/* 상단 1행 */}
          {presetsRow1.length > 0 && (
            <div className="conn-color-presets-row">
              {presetsRow1.map((item) => {
                const isSelected =
                  !isMixed &&
                  currentFormattedHex.toUpperCase() ===
                    item.color.toUpperCase();
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`conn-preset-card${isSelected ? " selected" : ""}`}
                    style={{
                      backgroundColor: item.color,
                    }}
                    data-color={item.color.toLowerCase()}
                    onClick={() => handleSelectPreset(item.color)}
                  />
                );
              })}
            </div>
          )}

          {/* 하단 2행 */}
          {presetsRow2.length > 0 && (
            <div className="conn-color-presets-row">
              {presetsRow2.map((item) => {
                const isSelected =
                  !isMixed &&
                  currentFormattedHex.toUpperCase() ===
                    item.color.toUpperCase();
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`conn-preset-card${isSelected ? " selected" : ""}`}
                    style={{
                      backgroundColor: item.color,
                    }}
                    data-color={item.color.toLowerCase()}
                    onClick={() => handleSelectPreset(item.color)}
                  />
                );
              })}
            </div>
          )}
        </div>

        <div className="conn-color-modal-divider" />

        {/* 3. Hex 입력 필드 + 무지개 컬러 휠 도넛 링 아이콘 + 원형 컬러휠 (ColorWheelField) */}
        <ColorWheelField
          value={colorHex}
          isMixed={isMixed}
          onMixedClear={() => setIsMixed(false)}
          onChange={(newHex) => {
            setIsMixed(false);
            setColorHex(newHex);
            if (newHex.length === 6) {
              onApply(`#${newHex.toUpperCase()}`);
            }
          }}
          onEnter={handleApply}
          isOpen={showWheel}
          onToggleOpen={setShowWheel}
        />

        {/* 4. 하단 구분선 (다른 모달과 동일한 보더 라인) */}
        <div className="conn-color-modal-divider" />

        {/* 5. 모달 푸터 버튼 (Cancel / Apply) */}
        <div className="conn-color-modal-footer">
          <button
            type="button"
            className="conn-btn-cancel"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button type="button" className="conn-btn-save" onClick={handleApply}>
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
