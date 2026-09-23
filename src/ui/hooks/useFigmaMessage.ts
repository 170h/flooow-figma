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
