import React, { useState, useRef } from "react";
import { ColorWheelField } from "../shared/ColorWheelField";
import { FillColorIcon } from "../shared/icons";

// 피그마 UI3 공식 24×24px 닫기 SVG 아이콘
const CLOSE_SVG = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M16.6464 6.64645C16.8417 6.45118 17.1582 6.45118 17.3535 6.64645C17.5487 6.84171 17.5487 7.15822 17.3535 7.35348L12.707 12L17.3535 16.6464C17.5487 16.8417 17.5487 17.1582 17.3535 17.3535C17.1582 17.5487 16.8417 17.5487 16.6464 17.3535L12 12.707L7.35348 17.3535C7.15822 17.5487 6.84171 17.5487 6.64645 17.3535C6.45118 17.1582 6.45118 16.8417 6.64645 16.6464L11.2929 12L6.64645 7.35348C6.45123 7.15821 6.4512 6.84169 6.64645 6.64645C6.8417 6.45125 7.15823 6.45125 7.35348 6.64645L12 11.2929L16.6464 6.64645Z"
      fill="currentColor"
    />
  </svg>
);

export interface FillColorModalProps {
  title?: string;
  initialColor: string;
  isMixed?: boolean;
  onApply: (colorHex: string) => void;
  onClose: () => void;
}

/**
 * Fill 컬러 선택 다이얼로그 (피그마 UI3 공식 규격)
 * - 스타일 모달의 Fill 섹션을 독립 다이얼로그로 분리
 * - FillColorIcon (투명/None 토글 지원)
 * - ColorWheelField (16진수 입력 + 원형 컬러휠)
 * - Cancel(원래 색상 복원) 및 Save(최종 색상 확정)
 */
export function FillColorModal({
  title,
  initialColor,
  isMixed = false,
  onApply,
  onClose,
}: FillColorModalProps) {
  const rawInit = initialColor || "#FFFFFF";
  const isInitialNone =
    !isMixed &&
    (rawInit.toLowerCase() === "none" ||
      rawInit.toLowerCase() === "transparent");

  const resolvedColor = (isInitialNone ? "FFFFFF" : rawInit)
    .replace("#", "")
    .trim()
    .toUpperCase();
  const validFill = resolvedColor.length === 6 ? resolvedColor : "FFFFFF";

  const [fillHex, setFillHex] = useState(isMixed ? "" : validFill);
  const [isNone, setIsNone] = useState(isInitialNone);
  const [isFillMixed, setIsFillMixed] = useState(Boolean(isMixed));
  const [showWheel, setShowWheel] = useState(true);

  // 직전 유효 색상 기억 (투명 해제 시 복원용)
  const lastValidFillRef = useRef<string>(validFill);

  // 색상 변경 핸들러 (실시간 프리뷰 적용)
  const handleColorChange = (hex: string) => {
    setIsFillMixed(false);
    setFillHex(hex);
    lastValidFillRef.current = hex;
    if (isNone) {
      setIsNone(false);
    }
    onApply(`#${hex}`);
  };

  // None(투명) 토글 핸들러
  const handleNoneToggle = (none: boolean) => {
    if (none) {
      if (fillHex && fillHex.length === 6) {
        lastValidFillRef.current = fillHex;
      }
      setIsNone(true);
      onApply("None");
    } else {
      setIsNone(false);
      const restore =
        fillHex && fillHex.length === 6
          ? fillHex
          : lastValidFillRef.current || "FFFFFF";
      setFillHex(restore);
      onApply(`#${restore}`);
    }
  };

  // Fill 칩 클릭 핸들러 (배경 투명/None 원클릭 토글)
  const handleChipClick = () => {
    handleNoneToggle(!isNone);
  };

  // 취소 처리 (원래 색상으로 롤백 후 닫기)
  // C-04: 초기 상태가 None이었으면 Cancel 시 None을 복원 (초기 색상으로 롤백되지 않도록)
  const handleCancel = () => {
    onApply(isInitialNone ? "None" : initialColor);
    onClose();
  };

  // 저장 처리 (최종 색상 확정 후 닫기)
  const handleSave = () => {
    const resolvedFill = fillHex.trim() ? fillHex : validFill;
    const finalColor = isNone
      ? "None"
      : `#${
          resolvedFill.length === 3
            ? resolvedFill
                .split("")
                .map((c) => c + c)
                .join("")
            : resolvedFill
        }`;
    onApply(finalColor);
    onClose();
  };

  return (
    <div
      id="modal-fill-color-backdrop"
      className="popover-backdrop"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleCancel();
      }}
    >
      <div
        id="modal-fill-color"
        className="style-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 (Fill 타이틀 + 닫기 버튼) */}
        <div className="style-modal-header">
          <span className="style-modal-title">
            {title || "Fill"}
            {isFillMixed && (
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
            onClick={handleCancel}
            title="Close"
          >
            {CLOSE_SVG}
          </button>
        </div>

        {/* 모달 바디 (Fill 컬러 입력 필드 + 컬러휠 컴포넌트) */}
        <div className="style-modal-body" style={{ padding: "12px 16px" }}>
          <div
            className="style-section-group"
            style={{ display: "flex", flexDirection: "column" }}
          >
            <ColorWheelField
              value={fillHex}
              isMixed={isFillMixed}
              isNone={isNone}
              onNoneToggle={handleNoneToggle}
              onMixedClear={() => setIsFillMixed(false)}
              onChange={handleColorChange}
              onEnter={handleSave}
              isOpen={showWheel}
              onToggleOpen={setShowWheel}
              customChip={
                <FillColorIcon
                  color={`#${fillHex}`}
                  isNone={isNone}
                  isMixed={isFillMixed}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChipClick();
                  }}
                  title={
                    isFillMixed
                      ? "Fill color (Mixed)"
                      : isNone
                        ? "배경 켜기"
                        : "배경 끄기 (None)"
                  }
                />
              }
            />
          </div>
        </div>

        {/* 모달 푸터 (Cancel + Save 버튼) */}
        <div className="style-modal-footer">
          <button
            type="button"
            className="btn-phase-modal-cancel"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-phase-modal-save"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
