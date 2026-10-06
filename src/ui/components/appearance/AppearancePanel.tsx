import React from 'react';
import { SizeSection } from './SizeSection';
import { StyleSection } from './StyleSection';
import { ElevationSection } from './ElevationSection';

/**
 * Appearance 탭 내용 - Size + Style + Elevation
 * 각 섹션의 open 상태는 섹션별 로컬 effective 상태가 단일 진실 공급원이다
 * (Status/StepBadges는 NodePanel에서 동일 방식으로 독립 동작, multiple-open).
 */
export function AppearancePanel(_props?: any) {
  return (
    <>
      <SizeSection />
      <hr className="section-divider" />
      <StyleSection />
      <hr className="section-divider" />
      <ElevationSection />
    </>
  );
}
