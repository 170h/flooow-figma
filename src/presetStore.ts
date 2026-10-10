/**
 * presetStore.ts — 사용자 프리셋 영속화용 순수 헬퍼 (Figma API·React 무의존)
 *
 * 신뢰 저장소(figma.clientStorage, Figma 관리·사용자별)와
 * iframe localStorage(동기 부트스트랩 캐시) 사이의 envelope 규칙을 한곳에 둔다.
 * - 저장 형태: { savedAt: number, items: unknown[] }
 * - 구형 plain array도 읽는다 (savedAt = 0 취급 → 다음 저장 때 envelope으로 승격).
 * - newer-wins: 들어온 savedAt이 로컬보다 클 때만 적용한다.
 */

export type PresetKind = 'style' | 'size';

export interface PresetEnvelope {
  savedAt: number;
  items: unknown[];
}

/** Core clientStorage 키 (Core·UI 공유 상수, 드리프트 방지) */
export const PRESET_STORAGE_KEYS: Record<PresetKind, string> = {
  style: 'flooow_style_presets',
  size: 'flooow_size_presets',
};

/** iframe localStorage 키 (동기 부트스트랩 캐시) */
export const PRESET_LOCAL_KEYS: Record<PresetKind, string> = {
  style: 'ui_flow_style_presets',
  size: 'ui_flow_size_presets',
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null) return null;
  return value as Record<string, unknown>;
}

/**
 * 저장된 원시값 → envelope.
 * - 구형 array → { savedAt: 0, items } (다음 저장 때 envelope으로 승격)
 * - 파싱 불가·빈 배열 → null (호출자가 기본값을 유지한다)
 */
export function parsePresetEnvelope(raw: unknown): PresetEnvelope | null {
  if (Array.isArray(raw)) {
    return raw.length > 0 ? { savedAt: 0, items: raw } : null;
  }
  const rec = asRecord(raw);
  if (!rec) return null;
  if (typeof rec.savedAt !== 'number' || !Number.isFinite(rec.savedAt)) return null;
  if (!Array.isArray(rec.items) || rec.items.length === 0) return null;
  return { savedAt: Math.max(0, Math.floor(rec.savedAt)), items: rec.items };
}

/** 들어온 envelope이 로컬보다 새로울 때만 적용한다 (동일 시각은 로컬 유지). */
export function isStoredNewer(
  localSavedAt: number,
  stored: PresetEnvelope | null | undefined
): stored is PresetEnvelope {
  if (!stored) return false;
  return stored.savedAt > localSavedAt;
}

export function makePresetEnvelope(items: unknown[]): PresetEnvelope {
  return { savedAt: Date.now(), items };
}

/** 사용자가 추가할 수 있는 커스텀 스타일 프리셋 최대 개수 (기본 프리셋 제외) */
export const MAX_CUSTOM_STYLE_PRESETS = 7;

export interface CustomPresetLike {
  id: string;
  isDefault?: boolean;
}

/** 기본 프리셋을 제외한 사용자 추가 개수 (삭제·수정 가능분과 일치) */
export function countCustomStylePresets(
  presets: ReadonlyArray<CustomPresetLike> | null | undefined,
  defaultIds: ReadonlySet<string>
): number {
  if (!Array.isArray(presets)) return 0;
  let count = 0;
  for (const p of presets) {
    if (p && typeof p.id === 'string' && !p.isDefault && !defaultIds.has(p.id)) count++;
  }
  return count;
}
