import React, { useState, useRef } from "react";
import { useApp } from "../../context/AppContext";
import { ColorWheelField } from "../shared/ColorWheelField";
import { StrokeColorIcon, FillColorIcon } from "../shared/icons";

// 피그마 UI3 공식 24×24px 닫기 SVG 아이콘
const CLOSE_SVG = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M16.6464 6.64645C16.8417 6.45118 17.1582 6.45118 17.3535 6.64645C17.5487 6.84171 17.5487 7.15822 17.3535 7.35348L12.707 12L17.3535 16.6464C17.5487 16.8417 17.5487 17.1582 17.3535 17.3535C17.1582 17.5487 16.8417 17.5487 16.6464 17.3535L12 12.707L7.35348 17.3535C7.15822 17.5487 6.84171 17.5487 6.64645 17.3535C6.45118 17.1582 6.45118 16.8417 6.64645 16.6464L11.2929 12L6.64645 7.35348C6.45123 7.15821 6.4512 6.84169 6.64645 6.64645C6.8417 6.45125 7.15823 6.45125 7.35348 6.64645L12 11.2929L16.6464 6.64645Z"
      fill="currentColor"
    />
  </svg>
);

// 피그마 UI3 공식 커넥션 라인 두께 SVG 아이콘 (Stroke Weight, 24×24)
const STROKE_ICON_SVG = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M17.25 14C17.6642 14 18 14.3358 18 14.75V17.25C18 17.6642 17.6642 18 17.25 18H6.75C6.33579 18 6 17.6642 6 17.25V14.75C6 14.3358 6.33579 14 6.75 14H17.25ZM7 17H17V15H7V17ZM17.25 9C17.6642 9 18 9.33579 18 9.75V11.25C18 11.6642 17.6642 12 17.25 12H6.75C6.33579 12 6 11.6642 6 11.25V9.75C6 9.33579 6.33579 9 6.75 9H17.25ZM7 11H17V10H7V11ZM17.5 6C17.7761 6 18 6.22386 18 6.5C18 6.77614 17.7761 7 17.5 7H6.5C6.22386 7 6 6.77614 6 6.5C6 6.22386 6.22386 6 6.5 6H17.5Z"
      fill="currentColor"
    />
  </svg>
);

interface StyleModalProps {
  mode?: "add" | "edit";
  editingPresetId?: string | null;
  onClose: () => void;
  initialColor?: string;
  isMixed?: boolean;
}

/**
 * 피그마 UI3 공식 Add style / Edit style 모달
 * - Fill: ColorWheelField (Hex 입력 필드 + 무지개 도넛 컬러 휠 + 원형 컬러휠 + 투명/None 지원)
 * - Stroke: ColorWheelField (Hex 입력 + 도넛 컬러 휠 + Stroke 두께 입력 박스 + 원형 컬러휠 + StrokeColorIcon)
 */
export function StyleModal({
  mode = "add",
  editingPresetId,
  onClose,
  initialColor,
  isMixed = false,
}: StyleModalProps) {
  const {
    uiState,
    setUIState,
    setLastNodeConfig,
    applyCurrentNodeState,
    stylePresets,
    addStylePreset,
    updateStylePreset,
    showToast,
    selectedNodes,
  } = useApp();

  // 수정 대상 프리셋 조회
  const targetPreset =
    mode === "edit" && editingPresetId
      ? stylePresets.find((p) => p.id === editingPresetId)
      : null;

  // Fill 상태: 수정 모드일 때는 targetPreset을 우선, 아니면 initialColor/uiState를 반영
  const rawInitFill = targetPreset
    ? targetPreset.fillColor
    : initialColor || uiState.selectedColor || "#EA2039";

  const isInitialFillNone =
    !isMixed &&
    (rawInitFill.toLowerCase() === "none" ||
      rawInitFill.toLowerCase() === "transparent");

  const resolvedColor = (isInitialFillNone ? "EA2039" : rawInitFill)
    .replace("#", "")
    .trim()
    .toUpperCase();
  const validFill = resolvedColor.length === 6 ? resolvedColor : "EA2039";

  const firstSelectedNode = selectedNodes.length > 0 ? selectedNodes[0] : null;
  const initialStrokeWeight = targetPreset
    ? targetPreset.strokeWeight
    : firstSelectedNode
      ? (firstSelectedNode.strokeWeight ?? 0)
      : (uiState.selectedStrokeWeight ?? 0);

  const initialStrokeHex = (
    targetPreset
      ? targetPreset.strokeColor
      : firstSelectedNode?.strokeColorHex ||
        uiState.selectedStrokeColor ||
        "#000000"
  )
    .replace("#", "")
    .trim()
    .toUpperCase();
  const validStrokeHex =
    initialStrokeHex.length === 6 ? initialStrokeHex : "000000";

  const [fillHex, setFillHex] = useState(isMixed ? "" : validFill);
  const [isFillNone, setIsFillNone] = useState(isInitialFillNone);
  const [isFillMixed, setIsFillMixed] = useState(Boolean(isMixed));
  const [strokeHex, setStrokeHex] = useState(validStrokeHex);
  const [strokeWeight, setStrokeWeight] = useState(initialStrokeWeight);

  // 직전 유효 색상 기억 (투명 해제 시 복원용)
  const lastValidFillRef = useRef<string>(validFill);

  // 현재 열려있는 컬러 피커 ('fill' | 'stroke' | null) - 기본값 'fill'
  const [activePicker, setActivePicker] = useState<"fill" | "stroke" | null>(
    "fill",
  );

  // Fill 칩 클릭 핸들러 (배경 투명/None 토글)
  const handleFillChipClick = () => {
    if (isFillNone) {
      setIsFillNone(false);
      setFillHex(lastValidFillRef.current || "EA2039");
    } else {
      if (fillHex && fillHex.length === 6) {
        lastValidFillRef.current = fillHex;
      }
      setIsFillNone(true);
    }
  };

  // 저장 처리
  function handleSave() {
    const resolvedFill = fillHex.trim() ? fillHex : validFill;
    const finalFillColor = isFillNone
      ? "None"
      : `#${
          resolvedFill.length === 3
            ? resolvedFill
                .split("")
                .map((c) => c + c)
                .join("")
            : resolvedFill
        }`;
    const finalStrokeColor = `#${
      strokeHex.length === 3
        ? strokeHex
            .split("")
            .map((c) => c + c)
            .join("")
        : strokeHex
    }`;
    const finalStrokeWeight = Math.max(0, strokeWeight);

    if (mode === "edit" && editingPresetId) {
      updateStylePreset(editingPresetId, {
        name:
          targetPreset?.name ||
          (isFillNone ? "Custom None" : `Custom ${finalFillColor}`),
        fillColor: finalFillColor,
        strokeWeight: finalStrokeWeight,
        strokeColor: finalStrokeColor,
      });
    } else {
      addStylePreset({
        name: isFillNone ? "Custom None" : `Custom ${finalFillColor}`,
        fillColor: finalFillColor,
        strokeWeight: finalStrokeWeight,
        strokeColor: finalStrokeColor,
      });
      showToast("새 스타일이 추가되었습니다.", "success");
    }

    // UI 상태 갱신
    setUIState({
      selectedColor: finalFillColor,
      selectedStrokeWeight: finalStrokeWeight,
      selectedStrokeColor: finalStrokeColor,
      ...(mode === "edit" && editingPresetId
        ? { selectedStylePresetId: editingPresetId }
        : {}),
    });
    setLastNodeConfig({
      color: finalFillColor,
      strokeWeight: finalStrokeWeight,
      strokeColor: finalStrokeColor,
    });

    // 캔버스에 선택된 노드가 있다면 즉시 스타일 동기화 반영
    if (selectedNodes.length > 0) {
      applyCurrentNodeState(undefined, {
        colorHex: finalFillColor,
        strokeWeight: finalStrokeWeight,
        strokeColor: finalStrokeColor,
      });
    }

    onClose();
  }

  const modalTitle = mode === "edit" ? "Edit style" : "Add style";

  return (
    <div
      id="modal-style-backdrop"
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
        id="modal-style"
        className="style-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 (Add style / Edit style 타이틀 + 닫기 버튼) */}
        <div className="style-modal-header">
          <span className="style-modal-title">
            {modalTitle}
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
            onClick={onClose}
            title="Close"
          >
            {CLOSE_SVG}
          </button>
        </div>

        {/* 모달 바디 */}
        <div className="style-modal-body" style={{ padding: "12px 16px" }}>
          {/* ==================== 1. Fill 섹션 ==================== */}
          <div
            className="style-section-group"
            style={{ display: "flex", flexDirection: "column" }}
          >
            {/* Fill 헤더 행 */}
            <div
              className="style-section-header"
              style={{
                display: "flex",
                alignItems: "center",
                height: 24,
                marginBottom: 6,
              }}
            >
              <span
                className="style-section-label"
                style={{
                  fontSize: 11,
                  fontWeight: 550,
                  color: "#FFFFFF",
                  letterSpacing: 0,
                }}
              >
                Fill
              </span>
            </div>

            {/* Fill 컬러 입력 필드 + 컬러휠 컴포넌트 */}
            <ColorWheelField
              value={fillHex}
              isMixed={isFillMixed}
              isNone={isFillNone}
              onNoneToggle={(none) => {
                if (none) {
                  if (fillHex && fillHex.length === 6) {
                    lastValidFillRef.current = fillHex;
                  }
                  setIsFillNone(true);
                } else {
                  setIsFillNone(false);
                  if (isFillNone && (!fillHex || fillHex.length !== 6)) {
                    setFillHex(lastValidFillRef.current || "EA2039");
                  }
                }
              }}
              onMixedClear={() => setIsFillMixed(false)}
              onChange={(hex) => {
                setIsFillMixed(false);
                setFillHex(hex);
                lastValidFillRef.current = hex;
                if (isFillNone) {
                  setIsFillNone(false);
                }
              }}
              onEnter={handleSave}
              isOpen={activePicker === "fill"}
              onToggleOpen={(open) => setActivePicker(open ? "fill" : null)}
              customChip={
                <FillColorIcon
                  color={`#${fillHex}`}
                  isNone={isFillNone}
                  isMixed={isFillMixed}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFillChipClick();
                  }}
                  title={
                    isFillMixed
                      ? "Fill color (Mixed)"
                      : isFillNone
                        ? "배경 켜기"
                        : "배경 끄기 (None)"
                  }
                />
              }
            />
          </div>

          {/* 중간 구분선 (1px Divider) */}
          <div className="style-divider" style={{ margin: "12px 0" }} />

          {/* ==================== 2. Stroke 섹션 ==================== */}
          <div
            className="style-section-group"
            style={{ display: "flex", flexDirection: "column" }}
          >
            {/* Stroke 헤더 행 */}
            <div
              className="style-section-header"
              style={{
                display: "flex",
                alignItems: "center",
                height: 24,
                marginBottom: 6,
              }}
            >
              <span
                className="style-section-label"
                style={{
                  fontSize: 11,
                  fontWeight: 550,
                  color: "#FFFFFF",
                  letterSpacing: 0,
                }}
              >
                Stroke
              </span>
            </div>

            {/* Stroke 라인 두께 박스 + 컬러 입력 필드 + 컬러휠 아이콘 */}
            <ColorWheelField
              value={strokeHex}
              isNone={strokeWeight === 0}
              onNoneToggle={(none) =>
                setStrokeWeight(
                  none ? 0 : strokeWeight > 0 ? strokeWeight : 1.5,
                )
              }
              onChange={(hex) => {
                setStrokeHex(hex);
                if (strokeWeight === 0) {
                  setStrokeWeight(1.5);
                }
              }}
              onEnter={handleSave}
              isOpen={activePicker === "stroke"}
              onToggleOpen={(open) => setActivePicker(open ? "stroke" : null)}
              customChip={
                <StrokeColorIcon
                  color={`#${strokeHex}`}
                  isNone={strokeWeight === 0}
                  onClick={(e) => {
                    e.stopPropagation();
                    setStrokeWeight((prev) => (prev === 0 ? 1.5 : 0));
                  }}
                  title={strokeWeight === 0 ? "보더 켜기" : "보더 끄기 (None)"}
                />
              }
              extraControlPosition="left"
              extraControl={
                <div className="stroke-width-box">
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "rgba(255, 255, 255, 0.6)",
                      flexShrink: 0,
                    }}
                  >
                    {STROKE_ICON_SVG}
                  </span>
                  <input
                    type="number"
                    className="prefix-input"
                    min={0}
                    max={50}
                    value={strokeWeight}
                    onChange={(e) =>
                      setStrokeWeight(parseFloat(e.target.value) || 0)
                    }
                    onKeyDown={(e) => e.key === "Enter" && handleSave()}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      letterSpacing: 0,
                    }}
                  />
                </div>
              }
            />
          </div>
        </div>

        {/* 모달 푸터 (Cancel + Save 버튼) */}
        <div className="style-modal-footer">
          <button
            type="button"
            className="btn-phase-modal-cancel"
            onClick={onClose}
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
