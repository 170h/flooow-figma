import React from 'react';
import { PhaseSection } from './PhaseSection';
import { TypeSection } from './TypeSection';
import { DescriptionSection } from './DescriptionSection';

/**
 * Node 탭 내용 - Phase + Type + Description 섹션
 * (section 래퍼는 App.tsx에서 관리)
 */
export function NodePanel(_props?: any) {
  return (
    <>
      <PhaseSection />
      <hr className="section-divider" />
      <TypeSection />
      <hr className="section-divider" />
      <DescriptionSection />
    </>
  );
}
