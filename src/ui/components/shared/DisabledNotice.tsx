import React, { useCallback, useEffect, useRef, useState } from 'react';

export type DisabledNoticePhase = 'hidden' | 'shown' | 'fading';

const VISIBLE_MS = 2500;
const FADE_MS = 200;

/**
 * 비활성화된 섹션을 클릭하면 사유 칩을 잠시 표시하는 훅.
 * shown(2.5s) → fading(0.2s) → hidden. 재클릭 시 타이머를 갱신한다.
 */
export function useDisabledNotice(visibleMs: number = VISIBLE_MS) {
  const [phase, setPhase] = useState<DisabledNoticePhase>('hidden');
  const timersRef = useRef<number[]>([]);

  const flash = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
    setPhase('shown');
    timersRef.current.push(window.setTimeout(() => setPhase('fading'), visibleMs));
    timersRef.current.push(window.setTimeout(() => setPhase('hidden'), visibleMs + FADE_MS));
  }, [visibleMs]);

  useEffect(
    () => () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
    },
    []
  );

  return { phase, flash };
}

/**
 * 다운로드 에셋 원본 인라인 (UI3 1027510:3048 칩 좌측 마크, 9x12 렌더).
 * 손으로 그린 벡터가 아니라 get_figma_data/download_figma_images로 받은 바이트 그대로이다.
 */
function NoticeTail() {
  return (
    <svg
      className="disabled-notice-tail"
      width="9"
      height="12"
      viewBox="0 0 9 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect y="6" width="6" height="6" transform="rotate(-45 0 6)" style={{ fill: 'var(--color-notice-bg)' }} />
    </svg>
  );
}

export function DisabledNoticeChip({ text, fading }: { text: string; fading: boolean }) {
  return (
    <span className={`disabled-notice-chip${fading ? ' hiding' : ''}`}>
      <NoticeTail />
      <span className="disabled-notice-text">{text}</span>
    </span>
  );
}
