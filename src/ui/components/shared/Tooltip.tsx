import React, { useEffect, useRef, useCallback } from 'react';

/**
 * 피그마 UI3 스타일 플로팅 툴팁
 * data-tooltip 속성을 가진 요소에 마우스오버 시 표시된다.
 */
export function FigmaTooltip() {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentTargetRef = useRef<Element | null>(null);

  const hide = useCallback(() => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
    currentTargetRef.current = null;
    const tooltip = tooltipRef.current;
    if (tooltip) {
      tooltip.classList.remove('visible', 'arrow-top');
      tooltip.style.display = 'none';
    }
  }, []);

  const show = useCallback((target: Element, text: string) => {
    if (!text || !text.trim()) {
      hide();
      return;
    }

    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
    }

    currentTargetRef.current = target;

    showTimerRef.current = setTimeout(() => {
      const tooltip = tooltipRef.current;
      if (!tooltip || currentTargetRef.current !== target) return;

      tooltip.textContent = text;
      tooltip.style.display = 'block';
      tooltip.classList.remove('visible', 'arrow-top');

      const rect = target.getBoundingClientRect();
      const tipRect = tooltip.getBoundingClientRect();

      // 대상 요소 상단 중앙 배치 (말꼬리 화살표 5px 고려 6px 갭)
      let top = rect.top - tipRect.height - 6;
      let left = rect.left + rect.width / 2 - tipRect.width / 2;

      // 화면 상단 공간 부족 시 하단에 배치 및 위쪽 화살표(arrow-top) 적용
      if (top < 4) {
        top = rect.bottom + 6;
        tooltip.classList.add('arrow-top');
      } else {
        tooltip.classList.remove('arrow-top');
      }

      // 화면 좌우 경계 이탈 방지
      if (left < 6) left = 6;
      if (left + tipRect.width > window.innerWidth - 6) {
        left = window.innerWidth - tipRect.width - 6;
      }

      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;

      // 리플로우 강제 후 visible 클래스 부여 (opacity: 1 활성화)
      void tooltip.offsetWidth;
      tooltip.classList.add('visible');
    }, 150); // 피그마 공식 인터랙션 딜레이 (150ms)
  }, [hide]);

  useEffect(() => {
    const handleMouseOver = (e: MouseEvent) => {
      const targetElement = e.target as Element;
      // 폼 입력 필드는 툴팁 방지
      if (targetElement.matches?.('input, textarea, select')) {
        hide();
        return;
      }

      const target = targetElement.closest?.('[data-tooltip]');
      if (!target) return;

      const text = target.getAttribute('data-tooltip');
      if (!text) return;

      // 이미 동일한 타깃 요소에 호버 중이면 타이머 재설정 방지
      if (currentTargetRef.current === target) return;

      show(target, text);
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = (e.target as Element).closest?.('[data-tooltip]');
      if (!target) return;

      const related = e.relatedTarget as Node | null;
      if (related && target.contains(related)) {
        // target 내부 요소(예: button 내부 svg, path 등) 간 이동 시 닫지 않음
        return;
      }

      hide();
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
    };
  }, [show, hide]);

  return (
    <div
      ref={tooltipRef}
      className="figma-tooltip"
      style={{ display: 'none', position: 'fixed', zIndex: 99999 }}
    />
  );
}
