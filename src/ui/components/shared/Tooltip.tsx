import React, { useEffect, useRef, useCallback } from 'react';

/**
 * 피그마 UI3 스타일 플로팅 툴팁
 * data-tooltip 속성을 가진 요소에 마우스오버 시 표시된다.
 * - 첫 진입: 150ms 머무르면 표시
 * - 표시 중 다른 대상으로 이동: 대기 없이 즉시 표시 (500ms 유예 포함)
 * - 포커스된 입력 필드(타이핑 중)에는 표시하지 않음
 */
const INITIAL_DELAY = 500; // 첫 진입 대기 (데스크톱 표준 400~500ms)
const SWITCH_GRACE = 500; // 전환 즉시 표시 유예

export function FigmaTooltip() {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentTargetRef = useRef<Element | null>(null);
  const lastHideAtRef = useRef(0);

  const isVisible = useCallback(() => {
    const tooltip = tooltipRef.current;
    return Boolean(
      tooltip && tooltip.style.display === 'block' && tooltip.classList.contains('visible')
    );
  }, []);

  const render = useCallback((target: Element, text: string) => {
    const tooltip = tooltipRef.current;
    if (!tooltip) return;

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
  }, []);

  const hide = useCallback(() => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
    const wasVisible = isVisible();
    currentTargetRef.current = null;
    const tooltip = tooltipRef.current;
    if (tooltip) {
      tooltip.classList.remove('visible', 'arrow-top');
      tooltip.style.display = 'none';
    }
    if (wasVisible) lastHideAtRef.current = Date.now();
  }, [isVisible]);

  const show = useCallback((target: Element, text: string, immediate: boolean) => {
    if (!text || !text.trim()) {
      hide();
      return;
    }

    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }

    currentTargetRef.current = target;

    // 이미 표시 중이거나 유예 내 전환이면 대기 없이 즉시 표시
    if (immediate) {
      render(target, text);
      return;
    }

    showTimerRef.current = setTimeout(() => {
      const tooltip = tooltipRef.current;
      if (!tooltip || currentTargetRef.current !== target) return;
      render(target, text);
    }, INITIAL_DELAY);
  }, [hide, render]);

  useEffect(() => {
    const isEditableFocused = (scope: Element): boolean => {
      const active = document.activeElement as Element | null;
      if (!active || active === document.body) return false;
      const editable =
        active.matches?.('input, textarea, select') ||
        active.getAttribute?.('contenteditable') === 'true';
      return Boolean(editable && scope.contains(active));
    };

    const handleMouseOver = (e: MouseEvent) => {
      const targetElement = e.target as Element;
      const target = targetElement.closest?.('[data-tooltip]');
      if (!target) return;

      const text = target.getAttribute('data-tooltip');
      if (!text) return;

      // 이미 동일한 타깃 요소에 호버 중이면 타이머 재설정 방지
      if (currentTargetRef.current === target) return;

      // 타이핑 중인 입력 필드에는 툴팁을 띄우지 않음
      if (isEditableFocused(target)) {
        hide();
        return;
      }

      const instant = isVisible() || (Date.now() - lastHideAtRef.current < SWITCH_GRACE);
      show(target, text, instant);
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = (e.target as Element).closest?.('[data-tooltip]');
      if (!target) return;

      const related = e.relatedTarget as Node | null;
      if (related && target.contains(related)) {
        // target 내부 요소(예: button 내부 svg, path 등) 간 이동 시 닫지 않음
        return;
      }

      // 다른 툴팁 대상으로 바로 이동하면 숨기지 않고 mouseover에 맡김 (즉시 전환, 깜박임 방지)
      const relatedEl = related as Element | null;
      const next = relatedEl?.closest?.('[data-tooltip]');
      if (next && next !== target) return;

      hide();
    };

    const handleFocusIn = (e: FocusEvent) => {
      const focused = e.target as Element | null;
      if (!focused) return;
      if (
        focused.matches?.('input, textarea, select') ||
        focused.getAttribute?.('contenteditable') === 'true'
      ) {
        hide();
      }
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);
    document.addEventListener('focusin', handleFocusIn);

    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      document.removeEventListener('focusin', handleFocusIn);
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
    };
  }, [show, hide, isVisible]);

  return (
    <div
      ref={tooltipRef}
      className="figma-tooltip"
      style={{ display: 'none', position: 'fixed', zIndex: 99999 }}
    />
  );
}
