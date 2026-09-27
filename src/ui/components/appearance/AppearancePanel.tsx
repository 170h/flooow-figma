import React from 'react';
import { SizeSection } from './SizeSection';
import { StyleSection } from './StyleSection';
import { StepBadgesSection } from './StepBadgesSection';
import { ElevationSection } from './ElevationSection';

/**
 * Appearance 탭 내용 - Size + Style + Step Badges + Elevation
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
      <ElevationSection />
    </>
  );
}
