import React, { useEffect, useRef, useCallback } from 'react';

interface TooltipState {
  visible: boolean;
  text: string;
  x: number;
  y: number;
}

/**
 * 피그마 UI3 스타일 플로팅 툴팁
 * data-tooltip 속성을 가진 요소에 마우스오버 시 표시된다.
 */
export function FigmaTooltip() {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<TooltipState>({ visible: false, text: '', x: 0, y: 0 });
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((target: Element, text: string) => {
    if (showTimerRef.current) clearTimeout(showTimerRef.current);
    showTimerRef.current = setTimeout(() => {
      const rect = target.getBoundingClientRect();
      const tooltip = tooltipRef.current;
      if (!tooltip) return;

      tooltip.textContent = text;
      tooltip.style.visibility = 'hidden';
      tooltip.style.display = 'block';
      const tw = tooltip.offsetWidth;
      const th = tooltip.offsetHeight;

      let x = rect.left + rect.width / 2 - tw / 2;
      let y = rect.top - th - 6;
      if (y < 4) y = rect.bottom + 6;
      if (x < 4) x = 4;
      if (x + tw > window.innerWidth - 4) x = window.innerWidth - tw - 4;

      tooltip.style.left = `${x}px`;
      tooltip.style.top = `${y}px`;
      tooltip.style.visibility = 'visible';
    }, 600);
  }, []);

  const hide = useCallback(() => {
    if (showTimerRef.current) clearTimeout(showTimerRef.current);
    const tooltip = tooltipRef.current;
    if (tooltip) tooltip.style.display = 'none';
  }, []);

  useEffect(() => {
    const handleMouseOver = (e: MouseEvent) => {
      const target = (e.target as Element).closest('[data-tooltip]');
      if (target) show(target, target.getAttribute('data-tooltip') || '');
    };
    const handleMouseOut = (e: MouseEvent) => {
      const target = (e.target as Element).closest('[data-tooltip]');
      if (target) hide();
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);
    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
    };
  }, [show, hide]);

  return (
    <div
      ref={tooltipRef}
      className="figma-tooltip"
      style={{ display: 'none', position: 'fixed', zIndex: 9999 }}
    />
  );
}
