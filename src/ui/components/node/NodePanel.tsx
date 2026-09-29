import React from "react";
import { TypeSection } from "./TypeSection";
import { DescriptionSection } from "./DescriptionSection";
import { FigmaLinkSection } from "./FigmaLinkSection";
import { StatusSection } from "../appearance/StatusSection";
import { StepBadgesSection } from "../appearance/StepBadgesSection";

/**
 * Node 탭 내용 - Type + Description + Status + Step Badges + Figma Screen Link
 */
export function NodePanel(_props?: any) {
  return (
    <>
      <TypeSection />
      <hr className="section-divider" />
      <DescriptionSection />
      <hr className="section-divider" />
      <StatusSection />
      <hr className="section-divider" />
      <StepBadgesSection />
      <hr className="section-divider" />
      <FigmaLinkSection />
    </>
  );
}
