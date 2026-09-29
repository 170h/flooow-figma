import { useEffect, useRef, useCallback } from 'react';

/**
 * 플러그인의 자연스러운 전체 높이(스크롤 없이 표시하기 위해 필요한 높이)를 계산한다.
 */
export function getPluginIdealHeight(root: HTMLElement): number {
  const titleBanner = root.querySelector('.title-banner') as HTMLElement | null;
  const tabsWrapper = root.querySelector('.main-tabs-wrapper') as HTMLElement | null;
  const divider = root.querySelector('.section-divider') as HTMLElement | null;
  const footer = root.querySelector('.app-footer') as HTMLElement | null;

  // 현재 활성화된 패널 탐색 (style="display: block" 또는 .active)
  const activePanel = (root.querySelector('.tab-panel[style*="display: block"]') as HTMLElement | null)
    || (root.querySelector('.tab-panel.active') as HTMLElement | null);

  let contentH = 0;
  if (activePanel) {
    // 플로팅 팝오버(Size, Terminal 드롭다운 등)가 열렸을 때
    // scrollHeight가 비정상적으로 팽창하여 플러그인 윈도우 창이 들썩이며 깜빡이는 현상 완벽 방지
    const panelRect = activePanel.getBoundingClientRect();
    const scrollTop = (activePanel.parentElement as HTMLElement | null)?.scrollTop || 0;
    let maxBottom = 0;
    const children = activePanel.children;
    for (let i = 0; i < children.length; i++) {
      const el = children[i] as HTMLElement;
      // 플로팅 메뉴 오버레이는 창 크기 계산에서 완전 제외 (GEMINI.md 영구 보존 규칙)
      if (
        el.classList.contains('figma-dropdown-menu') ||
        el.classList.contains('popover-context-menu') ||
        el.classList.contains('popover-size-mode') ||
        el.classList.contains('size-mode-menu-popover')
      ) {
        continue;
      }
      const childRect = el.getBoundingClientRect();
      const relativeBottom = Math.round(childRect.bottom - panelRect.top + scrollTop);
      if (relativeBottom > maxBottom) {
        maxBottom = relativeBottom;
      }
    }
    contentH = maxBottom > 0 ? maxBottom : activePanel.offsetHeight;
  } else {
    const panels = root.querySelector('.tab-panels') as HTMLElement | null;
    contentH = panels ? panels.offsetHeight : 0;
  }

  const titleH = titleBanner ? titleBanner.offsetHeight : 40;
  const tabsH = tabsWrapper ? tabsWrapper.offsetHeight : 36;
  const dividerH = divider ? divider.offsetHeight : 1;
  const footerH = (footer && footer.offsetParent !== null) ? footer.offsetHeight : 0;

  // 패널의 콘텐츠 높이(contentH: 섹션 펼침 시 CSS 12px 패딩 자동 포함, 접힘 시 0px)를 정확히 반영
  return Math.ceil(titleH + tabsH + dividerH + contentH + footerH);
}

/**
 * 플러그인 창 높이 자동 조절 훅
 * ResizeObserver로 내부 패널 크기 변화를 감지하여 Figma에 RESIZE_WINDOW 메시지를 전송한다.
 */
export function useAutoResize() {
  const lastHeightRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  const autoResizeWindow = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      const root = document.getElementById('plugin-root');
      if (!root) return;

      const idealHeight = getPluginIdealHeight(root);
      if (idealHeight > 100 && Math.abs(idealHeight - lastHeightRef.current) >= 2) {
        lastHeightRef.current = idealHeight;
        parent.postMessage({
          pluginMessage: { type: 'RESIZE_WINDOW', width: 360, height: idealHeight }
        }, '*');
      }
    }, 35);
  }, []);

  useEffect(() => {
    const root = document.getElementById('plugin-root');

    // 초기 및 지연 리사이즈
    const t1 = setTimeout(() => autoResizeWindow(), 50);
    const t2 = setTimeout(() => autoResizeWindow(), 200);

    // ResizeObserver로 탭 패널 내부 크기 변화만 정밀 감지 (root 관찰 피드백 루프 원천 차단)
    if (window.ResizeObserver && root) {
      const ro = new ResizeObserver(() => autoResizeWindow());
      const panels = root.querySelectorAll('.tab-panel');
      panels.forEach((p) => ro.observe(p));
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        ro.disconnect();
      };
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [autoResizeWindow]);

  return { autoResizeWindow };
}
