import React, { useMemo } from "react";
import { useApp } from "../../context/AppContext";

interface StylePresetColorGridProps {
  /** fill: 노드 스타일의 배경색 / stroke: 노드 스타일의 보더색(두께 > 0) */
  mode: "fill" | "stroke";
  /** 현재 선택된 HEX (# 없음, 대소문자 무관). None/Mixed 상태면 빈 문자열 */
  currentHex: string;
  /** 칩 클릭 시 호출 (# 없는 6자리 대문자 HEX) */
  onSelect: (hex: string) => void;
}

const BASE_COLORS = [
  { id: "base-white", color: "#FFFFFF" },
  { id: "base-gray", color: "#757575" },
  { id: "base-black", color: "#000000" },
];

function isNoneLike(color?: string): boolean {
  const c = (color || "").trim().toLowerCase();
  return c === "" || c === "none" || c === "transparent";
}

/**
 * 노드 스타일 프리셋에서 가져온 컬러 칩 그리드 (ConnectorColorModal과 동일한 규격)
 * - 기본 무채색 3종(White, Gray, Black) + 스타일 프리셋의 고유 컬러(중복 제외)
 * - 상단 5개 / 하단 나머지 행으로 분할
 */
export function StylePresetColorGrid({
  mode,
  currentHex,
  onSelect,
}: StylePresetColorGridProps) {
  const { stylePresets } = useApp();

  const colors = useMemo(() => {
    const seen = new Set<string>();
    const result: { id: string; color: string; name?: string }[] = [];

    for (const base of BASE_COLORS) {
      seen.add(base.color);
      result.push(base);
    }

    for (const preset of stylePresets) {
      let raw: string | undefined;
      if (mode === "fill") {
        raw = preset.fillColor;
      } else {
        raw = (preset.strokeWeight ?? 0) > 0 ? preset.strokeColor : undefined;
      }
      if (isNoneLike(raw)) continue;
      const color = (raw as string).toUpperCase();
      if (!/^#[0-9A-F]{6}$/.test(color) || seen.has(color)) continue;
      seen.add(color);
      result.push({ id: preset.id, name: preset.name, color });
    }
    return result;
  }, [stylePresets, mode]);

  const selected = currentHex ? `#${currentHex.replace("#", "").toUpperCase()}` : "";
  const rows = [colors.slice(0, 5), colors.slice(5)].filter((r) => r.length > 0);

  return (
    <div className="conn-color-presets-wrapper color-preset-section">
      {rows.map((row, idx) => (
        <div className="conn-color-presets-row" key={idx}>
          {row.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`conn-preset-card${selected === item.color ? " selected" : ""}`}
              style={{ backgroundColor: item.color }}
              data-color={item.color.toLowerCase()}
              data-tooltip={item.name ? `${item.name} ${item.color}` : item.color}
              onClick={() => onSelect(item.color.replace("#", ""))}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
