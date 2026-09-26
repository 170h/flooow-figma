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
    contentH = activePanel.scrollHeight;
  } else {
    const panels = root.querySelector('.tab-panels') as HTMLElement | null;
    contentH = panels ? panels.scrollHeight : 0;
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
      cancelAnimationFrame(timerRef.current);
    }
    timerRef.current = requestAnimationFrame(() => {
      const root = document.getElementById('plugin-root');
      if (!root) return;

      const idealHeight = getPluginIdealHeight(root);
      if (idealHeight > 100 && Math.abs(idealHeight - lastHeightRef.current) >= 2) {
        lastHeightRef.current = idealHeight;
        parent.postMessage({
          pluginMessage: { type: 'RESIZE_WINDOW', width: 360, height: idealHeight }
        }, '*');
      }
    });
  }, []);

  useEffect(() => {
    const root = document.getElementById('plugin-root');

    // 초기 및 지연 리사이즈
    const t1 = setTimeout(() => autoResizeWindow(), 50);
    const t2 = setTimeout(() => autoResizeWindow(), 200);

    // ResizeObserver로 탭 패널 내부 크기 변화 감지
    if (window.ResizeObserver && root) {
      const ro = new ResizeObserver(() => autoResizeWindow());
      ro.observe(root);
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
