import { useEffect, useRef, useCallback } from 'react';

/**
 * 플러그인 창 높이 자동 조절 훅
 * ResizeObserver로 #plugin-root 크기 변화를 감지하여 Figma에 RESIZE_WINDOW 메시지를 전송한다.
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
      const totalHeight = Math.ceil(root.offsetHeight || root.getBoundingClientRect().height);
      if (totalHeight > 100 && Math.abs(totalHeight - lastHeightRef.current) >= 2) {
        lastHeightRef.current = totalHeight;
        parent.postMessage({
          pluginMessage: { type: 'RESIZE_WINDOW', width: 360, height: totalHeight }
        }, '*');
      }
    });
  }, []);

  useEffect(() => {
    // 초기 리사이즈
    const initTimer = setTimeout(() => autoResizeWindow(), 50);

    // ResizeObserver로 DOM 변화 감지
    if (window.ResizeObserver) {
      const root = document.getElementById('plugin-root');
      if (root) {
        const ro = new ResizeObserver(() => autoResizeWindow());
        ro.observe(root);
        return () => {
          clearTimeout(initTimer);
          ro.disconnect();
        };
      }
    }

    return () => clearTimeout(initTimer);
  }, [autoResizeWindow]);

  return { autoResizeWindow };
}
