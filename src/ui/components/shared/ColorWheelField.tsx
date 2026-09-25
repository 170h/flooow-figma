import React, { useState, useRef, useEffect, useCallback } from 'react';

// ---- 색상 변환 유틸리티 (Hex <-> HSV) ----

/**
 * Hex 문자열을 HSV로 변환
 * @param hex 16진수 색상 코드
 * @param fallbackHue 무채색(채도 0 또는 명도 0)일 때 유지할 Hue 값
 */
export function hexToHsv(hex: string, fallbackHue = 0): { h: number; s: number; v: number } {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const r = (parseInt(clean.substring(0, 2), 16) || 0) / 255;
  const g = (parseInt(clean.substring(2, 4), 16) || 0) / 255;
  const b = (parseInt(clean.substring(4, 6), 16) || 0) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  // 무채색(흰색, 검은색, 회색 등)일 때는 기존 Hue 각도를 유지
  if (d === 0 || max === 0) {
    return {
      h: fallbackHue,
      s: 0,
      v: Math.round(max * 100),
    };
  }

  let h = 0;
  const s = d / max;
  const v = max;

  switch (max) {
    case r:
      h = (g - b) / d + (g < b ? 6 : 0);
      break;
    case g:
      h = (b - r) / d + 2;
      break;
    case b:
      h = (r - g) / d + 4;
      break;
  }
  h /= 6;

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100),
  };
}

export function hsvToHex(h: number, s: number, v: number): string {
  const sNorm = Math.max(0, Math.min(100, s)) / 100;
  const vNorm = Math.max(0, Math.min(100, v)) / 100;
  const c = vNorm * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = vNorm - c;

  let r = 0, g = 0, b = 0;
  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h <= 360) {
    r = c; g = 0; b = x;
  }

  const rHex = Math.round((r + m) * 255).toString(16).padStart(2, '0');
  const gHex = Math.round((g + m) * 255).toString(16).padStart(2, '0');
  const bHex = Math.round((b + m) * 255).toString(16).padStart(2, '0');

  return `${rHex}${gHex}${bHex}`.toUpperCase();
}

export interface ColorWheelFieldProps {
  value: string; // 예: 'EA2039' 또는 '#EA2039'
  onChange: (hex: string) => void;
  onEnter?: () => void;
  isOpen?: boolean;
  onToggleOpen?: (open: boolean) => void;
  extraControl?: React.ReactNode;
  extraControlPosition?: 'left' | 'right';
}

/**
 * 피그마 UI3 표준 일체형 컬러 입력 필드 및 원형 컬러휠 컴포넌트
 * - Hex 입력 필드 + 컬러 칩
 * - 무지개 도넛 컬러 휠 토글 버튼
 * - 원형 컬러 휠 (Hue 링 + 2D 채도/명도 디스크)
 * - 채도/명도 조절 시 Hue가 안정적으로 고정되는 정밀 HSV 동기화 시스템
 */
export function ColorWheelField({
  value,
  onChange,
  onEnter,
  isOpen,
  onToggleOpen,
  extraControl,
  extraControlPosition = 'right',
}: ColorWheelFieldProps) {
  const cleanHex = value.replace('#', '').toUpperCase();
  const [colorHex, setColorHex] = useState(cleanHex);
  const [colorHsv, setColorHsv] = useState(() => hexToHsv(cleanHex));
  const [internalOpen, setInternalOpen] = useState(false);

  const wheelRef = useRef<HTMLDivElement>(null);
  const innerDiscRef = useRef<HTMLDivElement>(null);
  const isInteractingRef = useRef(false);

  const isWheelOpen = isOpen !== undefined ? isOpen : internalOpen;

  const toggleWheel = () => {
    const next = !isWheelOpen;
    if (onToggleOpen) {
      onToggleOpen(next);
    } else {
      setInternalOpen(next);
    }
  };

  // 외부 value 변경 동기화 (내부 드래그 인터랙션 중이거나 이미 같은 색상이면 Hue 보존을 위해 무시)
  useEffect(() => {
    if (isInteractingRef.current) return;
    const nextClean = value.replace('#', '').toUpperCase();
    if (nextClean === colorHex) return;

    setColorHex(nextClean);
    setColorHsv((prev) => hexToHsv(nextClean, prev.h));
  }, [value, colorHex]);

  // Hex 입력 변경
  function handleHexChange(e: React.ChangeEvent<HTMLInputElement>) {
    let val = e.target.value.replace('#', '').toUpperCase().replace(/[^0-9A-F]/g, '');
    if (val.length > 6) val = val.slice(0, 6);
    setColorHex(val);

    if (val.length === 6) {
      setColorHsv((prev) => hexToHsv(val, prev.h));
      onChange(val);
    }
  }

  function handleHexBlur() {
    let clean = colorHex.trim();
    if (clean.length === 3) {
      clean = clean.split('').map((c) => c + c).join('').toUpperCase();
    }
    if (clean.length === 6 && /^[0-9A-F]{6}$/i.test(clean)) {
      setColorHex(clean.toUpperCase());
      setColorHsv((prev) => hexToHsv(clean.toUpperCase(), prev.h));
      onChange(clean.toUpperCase());
    } else {
      const fallback = hsvToHex(colorHsv.h, colorHsv.s, colorHsv.v);
      setColorHex(fallback);
      onChange(fallback);
    }
  }

  // Hue 링 드래그 계산 (함수형 업데이트로 채도/명도 보존)
  const updateHueFromPoint = useCallback(
    (clientX: number, clientY: number) => {
      if (!wheelRef.current) return;
      const rect = wheelRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = clientX - centerX;
      const dy = clientY - centerY;

      const rad = Math.atan2(dy, dx);
      let deg = Math.round((rad * 180) / Math.PI + 90);
      if (deg < 0) deg += 360;
      if (deg >= 360) deg -= 360;

      setColorHsv((prev) => {
        const nextHsv = { ...prev, h: deg };
        const nextHex = hsvToHex(nextHsv.h, nextHsv.s, nextHsv.v);
        setColorHex(nextHex);
        onChange(nextHex);
        return nextHsv;
      });
    },
    [onChange]
  );

  const startHueDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!wheelRef.current) return;
    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // 마우스 클릭 위치가 내부 디스크 영역(반경 54px 이하)인데
    // 사용자가 Hue 핸들을 직접 클릭한 것이 아니라면 내부 디스크의 동작을 방해하지 않음
    const target = e.target as HTMLElement | null;
    const isTargetHueKnob = target?.classList.contains('conn-wheel-hue-knob');
    if (!isTargetHueKnob && dist < 54) {
      return;
    }

    isInteractingRef.current = true;
    updateHueFromPoint(e.clientX, e.clientY);

    const onMove = (ev: MouseEvent) => updateHueFromPoint(ev.clientX, ev.clientY);
    const onUp = () => {
      isInteractingRef.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // 2D 디스크 채도/명도 드래그 계산 (Hue가 절대 변경되지 않도록 확실하게 고정)
  const updateSatValFromPoint = useCallback(
    (clientX: number, clientY: number) => {
      if (!innerDiscRef.current) return;
      const rect = innerDiscRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const radius = rect.width / 2;

      let dx = clientX - centerX;
      let dy = clientY - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // 원 바깥으로 나간 경우 원 둘레(radius)로 클램핑하여 포인터 중심이 서클 끝까지 도달
      if (dist > radius) {
        dx = (dx / dist) * radius;
        dy = (dy / dist) * radius;
      }

      // 원형 좌표 (-1 ~ 1) -> 정사각 HSV 좌표 (-1 ~ 1) Squircular 매핑
      // 원 둘레 각 모서리 방향(우상단: 순수 원색 100%, 좌상단: 순수 화이트 0%, 하단: 순수 블랙)에 완전 도달
      const nx = radius > 0 ? dx / radius : 0;
      const ny = radius > 0 ? dy / radius : 0;
      const maxCoord = Math.max(Math.abs(nx), Math.abs(ny));
      const factor = maxCoord > 0 ? Math.sqrt(nx * nx + ny * ny) / maxCoord : 1;
      const u = Math.max(-1, Math.min(1, nx * factor));
      const v = Math.max(-1, Math.min(1, ny * factor));

      const s = Math.round(Math.max(0, Math.min(100, ((u + 1) / 2) * 100)));
      const vVal = Math.round(Math.max(0, Math.min(100, ((1 - v) / 2) * 100)));

      setColorHsv((prev) => {
        // 기존의 Hue(prev.h)는 고정하고 채도(s)와 명도(vVal)만 갱신
        const nextHsv = { ...prev, s, v: vVal };
        const nextHex = hsvToHex(nextHsv.h, nextHsv.s, nextHsv.v);
        setColorHex(nextHex);
        onChange(nextHex);
        return nextHsv;
      });
    },
    [onChange]
  );

  const startSatValDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    isInteractingRef.current = true;
    updateSatValFromPoint(e.clientX, e.clientY);

    const onMove = (ev: MouseEvent) => updateSatValFromPoint(ev.clientX, ev.clientY);
    const onUp = () => {
      isInteractingRef.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // Hue 손잡이 좌표 (원형 링 직경 168px, 중심선 R = 74px, 링 두께 20px)
  const hueAngleRad = (colorHsv.h * Math.PI) / 180;
  const hueKnobRadius = 74;
  const wheelCenter = 84;
  const hueKnobX = wheelCenter + hueKnobRadius * Math.sin(hueAngleRad);
  const hueKnobY = wheelCenter - hueKnobRadius * Math.cos(hueAngleRad);

  // 내부 Sat/Val 손잡이 좌표 (직경 108px, R_disc = 54px)
  // 정사각 HSV -> 원형 디스크 좌표 역매핑: 포인터 중심이 서클 외곽 둘레 끝(R = 54px)까지 정확히 위치
  const discRadius = 54;
  const discCenter = 54;
  const normU = (colorHsv.s / 100) * 2 - 1;
  const normV = 1 - (colorHsv.v / 100) * 2;
  const maxSquare = Math.max(Math.abs(normU), Math.abs(normV));
  const distSquare = Math.sqrt(normU * normU + normV * normV);
  const invFactor = distSquare > 0 ? maxSquare / distSquare : 1;
  const satValX = discCenter + normU * invFactor * discRadius;
  const satValY = discCenter + normV * invFactor * discRadius;

  const currentFormattedHex = `#${colorHex.padStart(6, '0')}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* 1. Hex 입력 필드 + 무지개 도넛 토글 버튼 (+ 선택적 extraControl) */}
      <div className="conn-color-input-row">
        {extraControlPosition === 'left' && extraControl}

        <div className="conn-modal-hex-box">
          <span
            className="conn-modal-hex-chip"
            style={{ backgroundColor: currentFormattedHex }}
          />
          <input
            type="text"
            size={1}
            className="conn-modal-hex-input"
            value={colorHex}
            maxLength={6}
            onChange={handleHexChange}
            onBlur={handleHexBlur}
            onKeyDown={(e) => e.key === 'Enter' && onEnter && onEnter()}
            spellCheck={false}
            autoComplete="off"
          />
        </div>

        {/* 무지개 도넛 컬러 휠 토글 버튼 */}
        <button
          type="button"
          className={`conn-modal-wheel-donut-btn${isWheelOpen ? ' selected' : ''}`}
          title={isWheelOpen ? 'Hide color wheel' : 'Show color wheel'}
          onClick={toggleWheel}
        >
          <span className="conn-modal-wheel-donut-icon" />
        </button>

        {extraControlPosition === 'right' && extraControl}
      </div>

      {/* 2. 원형 컬러 휠 (Hue) + 채도/명도 2D 디스크 */}
      {isWheelOpen && (
        <div className="conn-color-wheel-wrapper">
          <div
            ref={wheelRef}
            className="conn-color-wheel-ring"
            onMouseDown={startHueDrag}
          >
            {/* 내부 어두운 여백 링 */}
            <div className="conn-color-wheel-gap" />

            {/* 내부 채도/명도 2D 컬러 디스크 */}
            <div
              ref={innerDiscRef}
              className="conn-color-inner-disc"
              style={{
                backgroundColor: `hsl(${colorHsv.h}, 100%, 50%)`,
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                startSatValDrag(e);
              }}
            >
              <div className="conn-disc-tint-layer" />
              <div className="conn-disc-shade-layer" />
              <div
                className="conn-disc-handle"
                style={{
                  left: `${satValX}px`,
                  top: `${satValY}px`,
                  backgroundColor: currentFormattedHex,
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  startSatValDrag(e);
                }}
              />
            </div>

            {/* 외부 Hue 조절 핸들 (28px 서클, 직접 드래그 우선권) */}
            <div
              className="conn-wheel-hue-knob"
              style={{
                left: `${hueKnobX}px`,
                top: `${hueKnobY}px`,
                backgroundColor: `hsl(${colorHsv.h}, 100%, 50%)`,
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                startHueDrag(e);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
