import React from 'react';
import { SizeSection } from './SizeSection';
import { StyleSection } from './StyleSection';
import { ElevationSection } from './ElevationSection';
import { StatusSection } from './StatusSection';
import { StepBadgesSection } from './StepBadgesSection';

/**
 * Appearance 탭 내용 - Size + Style + Elevation + Status + StepBadges
 * (section 래퍼는 App.tsx에서 관리)
 */
export function AppearancePanel(_props?: any) {
  return (
    <>
      <SizeSection />
      <hr className="section-divider" />
      <StyleSection />
      <hr className="section-divider" />
      <StepBadgesSection />
      <hr className="section-divider" />
      <StatusSection />
      <hr className="section-divider" />
      <ElevationSection />
    </>
  );
}
