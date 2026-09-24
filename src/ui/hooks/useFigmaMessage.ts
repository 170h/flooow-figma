import { useEffect, useRef } from 'react';
import { useApp, NodeInfo } from '../context/AppContext';

/**
 * Figma 플러그인 → UI 방향 메시지 처리 훅
 * window.onmessage로 수신된 pluginMessage를 파싱하여 AppContext 상태를 업데이트한다.
 */
export function useFigmaMessage() {
  const {
    handleSelectionChange,
    setCurrentTab,
    setUIState,
    setLastNodeConfig,
    showToast,
  } = useApp();

  const handlerRef = useRef<((event: MessageEvent) => void) | null>(null);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const msg = event.data?.pluginMessage;
      if (!msg) return;

      switch (msg.type) {
        case 'SELECTION_CHANGED': {
          const { count, nodes, meta } = msg;
          handleSelectionChange(count || 0, nodes || [], meta || {});

          // 노드 속성 복원
          if (nodes && nodes.length === 1) {
            const node = nodes[0] as NodeInfo;

            // Node 탭 관련
            const titleEl = document.getElementById('node-title-input') as HTMLInputElement | null;
            const descEl = document.getElementById('node-description-input') as HTMLTextAreaElement | null;
            const wEl = document.getElementById('input-size-w') as HTMLInputElement | null;
            const hEl = document.getElementById('input-size-h') as HTMLInputElement | null;
            if (titleEl) titleEl.value = node.title || node.name || 'Untitled';
            if (descEl && node.description) descEl.value = node.description;
            if (wEl && node.width) wEl.value = String(node.width);
            if (hEl && node.height) hEl.value = String(node.height);

            if (node.flowNodeType) {
              setUIState({ selectedNodeType: node.flowNodeType });
            }

            const fixedValEl = document.getElementById('size-mode-val-fixed');
            const hugValEl = document.getElementById('size-mode-val-hug');
            if (fixedValEl && node.height) fixedValEl.textContent = String(node.height);
            if (hugValEl && node.hugHeight) hugValEl.textContent = String(node.hugHeight);

            if (node.sizeMode) {
              setLastNodeConfig({ sizeMode: node.sizeMode, width: node.width, height: node.height });
              const textEl = document.getElementById('size-mode-current-text');
              const iconEl = document.getElementById('size-mode-current-icon');
              const FIXED_SVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 6C14.2761 6 14.5 6.22386 14.5 6.5C14.5 6.77614 14.2761 7 14 7H12V16H14C14.2761 16 14.5 16.2239 14.5 16.5C14.5 16.7761 14.2761 17 14 17H9C8.72386 17 8.5 16.7761 8.5 16.5C8.5 16.2239 8.72386 16 9 16H11V7H9C8.72386 7 8.5 6.77614 8.5 6.5C8.5 6.22386 8.72386 6 9 6H14Z" fill="currentColor"/></svg>`;
              const HUG_SVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.4999 13C11.6325 13 11.7597 13.0527 11.8535 13.1464L14.8535 16.1464C15.0487 16.3417 15.0487 16.6582 14.8535 16.8535C14.6582 17.0487 14.3417 17.0487 14.1464 16.8535L11.4999 14.207L8.85346 16.8535C8.6582 17.0487 8.34169 17.0487 8.14643 16.8535C7.95119 16.6582 7.95119 16.3417 8.14643 16.1464L11.1464 13.1464C11.2402 13.0527 11.3674 13 11.4999 13ZM14.1464 7.14644C14.3417 6.95119 14.6582 6.95118 14.8535 7.14644C15.0487 7.3417 15.0487 7.65821 14.8535 7.85347L11.8535 10.8535C11.7597 10.9472 11.6325 10.9999 11.4999 11C11.3674 10.9999 11.2402 10.9472 11.1464 10.8535L8.14643 7.85347C7.95119 7.65821 7.95119 7.3417 8.14643 7.14644C8.34169 6.9512 8.6582 6.9512 8.85346 7.14644L11.4999 9.79292L14.1464 7.14644Z" fill="currentColor"/></svg>`;
              if (textEl) textEl.textContent = node.sizeMode === 'hug' ? 'Hug contents' : 'Fixed height';
              if (iconEl) iconEl.innerHTML = node.sizeMode === 'hug' ? HUG_SVG : FIXED_SVG;
            }
          }
          break;
        }

        case 'INIT_DONE':
        case 'READY': {
          // 초기화 완료 후 처리 (필요 시 확장)
          break;
        }

        case 'SWITCH_TAB': {
          if (msg.tab) setCurrentTab(msg.tab);
          break;
        }

        default:
          break;
      }
    };

    handlerRef.current = handler;
    window.addEventListener('message', handler);

    // 플러그인 초기화 메시지 전송
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('nodes') === '2') {
      // 개발 테스트 모드
    } else {
      parent.postMessage({ pluginMessage: { type: 'INIT' } }, '*');
    }

    return () => {
      window.removeEventListener('message', handler);
    };
  }, [handleSelectionChange, setCurrentTab, setUIState, setLastNodeConfig, showToast]);
}
