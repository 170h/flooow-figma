import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { analyzeSelection, SelectionSummary } from '../utils/selectionUtils';

/**
 * 현재 선택된 노드들(단일/복수)의 각 설정 항목별 공통값과 Mixed 여부를 반환하는 커스텀 훅
 */
export function useSelectionSummary(): SelectionSummary {
  const { selectedNodes } = useApp();

  return useMemo(() => {
    return analyzeSelection(selectedNodes);
  }, [selectedNodes]);
}

export * from '../utils/selectionUtils';
