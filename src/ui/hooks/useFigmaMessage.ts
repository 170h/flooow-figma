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
    setDesignFrames,
    showToast,
  } = useApp();

  const handlerRef = useRef<((event: MessageEvent) => void) | null>(null);
  const prevNodeIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const msg = event.data?.pluginMessage;
      if (!msg) return;

      switch (msg.type) {
        case 'SELECTION_CHANGED': {
          const { count, nodes, meta, suggestedSourceMagnet, suggestedTargetMagnet } = msg;
          handleSelectionChange(count || 0, nodes || [], meta || {});

          // 노드 이동 또는 커넥터 선택에 따른 최적 마그넷(연결 포인트) 기즈모 실시간 업데이트
          if (suggestedSourceMagnet && suggestedTargetMagnet) {
            setUIState({
              sourceMagnet: suggestedSourceMagnet,
              targetMagnet: suggestedTargetMagnet,
            });
          }

          const currentNodeId = (nodes && nodes.length === 1 && nodes[0]?.id)
            ? nodes[0].id
            : (nodes && nodes.length > 1 ? 'MULTI' : null);
          const isDifferentNode = currentNodeId !== prevNodeIdRef.current;
          prevNodeIdRef.current = currentNodeId;

          // 노드 속성 복원 (플러그인으로 생성된 플로우 노드에 대해서만 허용)
          if (nodes && nodes.length === 1) {
            const node = nodes[0] as NodeInfo;

            if (node.isFlowNode) {
              // Node 탭 관련
              const titleEl = document.getElementById('node-title-input') as HTMLInputElement | null;
              const descEl = document.getElementById('node-description-input') as HTMLTextAreaElement | null;
              const wEl = document.getElementById('input-size-w') as HTMLInputElement | null;
              const hEl = document.getElementById('input-size-h') as HTMLInputElement | null;
              const rEl = document.getElementById('input-size-radius') as HTMLInputElement | null;

              // 노드 선택 대상이 실제로 변경되었을 때만 텍스트 및 토글 상태를 덮어씀
              if (isDifferentNode) {
                const hasDesc = Boolean(node.description && node.description.trim());
                const descToggleEl = document.getElementById('toggle-description') as HTMLInputElement | null;
                if (descToggleEl) descToggleEl.checked = hasDesc;
                if (titleEl) titleEl.value = node.title || node.name || 'Untitled';
                if (descEl) descEl.value = node.description || '';
                setLastNodeConfig({ descriptionOn: hasDesc });
              }
              if (wEl && node.width) wEl.value = String(node.width);
              if (hEl && node.height) hEl.value = String(node.height);
              if (rEl && typeof node.cornerRadius === 'number') rEl.value = String(node.cornerRadius);

              if (node.flowNodeType) {
                setUIState({ selectedNodeType: node.flowNodeType });
              }

              const fixedValEl = document.getElementById('size-mode-val-fixed');
              const hugValEl = document.getElementById('size-mode-val-hug');
              if (fixedValEl && node.height) fixedValEl.textContent = String(node.height);
              if (hugValEl && node.hugHeight) hugValEl.textContent = String(node.hugHeight);

              if (node.sizeMode) {
                setLastNodeConfig({
                  sizeMode: node.sizeMode,
                  width: node.width,
                  height: node.height,
                  cornerRadius: node.cornerRadius ?? 0,
                });
              } else if (typeof node.cornerRadius === 'number') {
                setLastNodeConfig({ cornerRadius: node.cornerRadius });
              }

              // 상태(status) 복원
              const currentStatus = node.status || msg.currentStatus;
              if (currentStatus) {
                setUIState({ selectedStatus: currentStatus });
                setLastNodeConfig({ status: currentStatus, statusOn: true });
                const toggleEl = document.getElementById('toggle-status') as HTMLInputElement | null;
                if (toggleEl) toggleEl.checked = true;
                const statusOptionsEl = document.getElementById('status-options');
                if (statusOptionsEl) statusOptionsEl.classList.add('active');
              } else {
                setLastNodeConfig({ statusOn: false });
                const toggleEl = document.getElementById('toggle-status') as HTMLInputElement | null;
                if (toggleEl) toggleEl.checked = false;
                const statusOptionsEl = document.getElementById('status-options');
                if (statusOptionsEl) statusOptionsEl.classList.remove('active');
              }

              // Figma Screen Link 복원
              const figmaLink = node.figmaLink || '';
              if (figmaLink) {
                setLastNodeConfig({ singleLinkOn: true, singleLinkUrl: figmaLink });
                const linkToggleEl = document.getElementById('toggle-single-figma-link') as HTMLInputElement | null;
                if (linkToggleEl) linkToggleEl.checked = true;
                const linkUrlEl = document.getElementById('single-screen-url') as HTMLInputElement | null;
                if (linkUrlEl) linkUrlEl.value = figmaLink;
              } else {
                setLastNodeConfig({ singleLinkOn: false, singleLinkUrl: '' });
                const linkToggleEl = document.getElementById('toggle-single-figma-link') as HTMLInputElement | null;
                if (linkToggleEl) linkToggleEl.checked = false;
                const linkUrlEl = document.getElementById('single-screen-url') as HTMLInputElement | null;
                if (linkUrlEl) linkUrlEl.value = '';
              }
            } else if (!node.isFlowNode && !node.isConnector) {
              const titleEl = document.getElementById('node-title-input') as HTMLInputElement | null;
              if (titleEl) titleEl.value = 'Figjam object';
            }
          } else if (!nodes || nodes.length === 0) {
            // 선택 해제 시 (새로운 노드 생성 대기 모드): 실제로 선택이 해제된 순간에만 리셋
            if (isDifferentNode) {
              const titleEl = document.getElementById('node-title-input') as HTMLInputElement | null;
              const descEl = document.getElementById('node-description-input') as HTMLTextAreaElement | null;
              const descToggleEl = document.getElementById('toggle-description') as HTMLInputElement | null;
              const hEl = document.getElementById('input-size-h') as HTMLInputElement | null;
              const fixedValEl = document.getElementById('size-mode-val-fixed');
              if (titleEl) titleEl.value = 'Untitled';
              if (descEl) descEl.value = '';
              if (descToggleEl) descToggleEl.checked = false;
              if (hEl) hEl.value = '90';
              if (fixedValEl) fixedValEl.textContent = '90';
              setLastNodeConfig({ descriptionOn: false, height: 90 });
            }
          }
          break;
        }

        case 'INIT_DONE':
        case 'READY': {
          // 초기화 완료 후 처리 (필요 시 확장)
          break;
        }

        case 'DESIGN_FRAMES_LOADED': {
          setDesignFrames(msg.frames || []);
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
