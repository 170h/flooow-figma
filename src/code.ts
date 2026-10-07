import type {
  WorkflowStatus,
  PluginAction,
  CoreToUIMessage,
  FlowNodePayload,
  UpdateNodePayload,
  NodePatchPayload,
  ConnectPointsPayload,
  ConnectChainPayload,
  SelectedNodeInfo,
  BadgePosition,
  BadgeShape,
  MagnetPosition,
  ConnectorStrokePattern,
  ConnectorRoutingType,
  ConnectorTerminalType,
  ConnectorLabelBoxStyle,
  ConnectorLabelAlign,
  DiagramNodeType,
  BranchVariant,
  DesignFrameItem,
  ConnectedConnectorDetail,
  MultiNodeConnectorDetail,
} from './types';
import {
  STATUS_CONFIG,
  normalizeNodeType,
  normalizeBranchVariant,
  getBranchVariantSpec,
  branchVariantHasTitle,
  getBranchVariantDefaultFill,
  branchVariantUsesStroke,
  BRANCH_VARIANT_LABELS,
  isDefaultNodeTitle,
  getDefaultNodeTitle,
  NODE_TYPE_SHAPE_SPECS,
  SCREEN_NODE_CONSTRAINTS,
  clampScreenWidth,
  clampScreenHeight,
  clampScreenCornerRadius,
  clampStrokeWeight,
  supportsOption,
  getMutationTargets,
} from './domain/nodeDomain';
import {
  createOrthogonalVectorConnector,
  updateOrthogonalVectorConnector,
  applyConnectorLabelStyle,
  registerConnectorInRegistry,
  refreshConnectorRegistry,
  syncConnectorsForMovedNodes,
  getOptimalMagnetPair,
  sceneNodePageBox,
  copyConnectorData,
  getLabelPlacement,
  readPrevLabelVertical,
  getLabelSizeHint,
  LABEL_FONT_SIZE,
  calculateRoutingPoints,
  getMagnetPoint,
  placeNodeAtWorldCenter,
  Box,
} from './customConnector';
import { orderNodesForChain, makePairKey, resolveCreatedPairMagnets } from './chainOrder';
import { setAppLocale, t } from './i18n';
import { countFlooowElements, type FlooowElementCount } from './elementCount';
import {
  canCreateFlooowElements,
  assembleFlooowUsage,
  isUnlimitedEntitlement,
  normalizePaymentStatus,
  type CreateEntitlement,
  type CreateGateResult,
  type FlooowUsageState,
} from './entitlementGate';

// [FLOOOW-STARTUP] 계측 전용 로그 (startup freeze 정지 지점 추적용, 로직 변경 없음)
const STARTUP_T0: number =
  typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now();
function slog(label: string): void {
  try {
    const now =
      typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now();
    console.log(`[FLOOOW-STARTUP] ${label} +${Math.round(now - STARTUP_T0)}ms`);
  } catch (_) {
    // 계측 로그 실패는 본 로직에 영향 없음
  }
}

// RGB 객체를 6자리 HEX 문자열로 변환하는 헬퍼
function rgbToHexColor(rgb: RGB): string {
  const toHex = (c: number) => Math.round(Math.max(0, Math.min(1, c)) * 255).toString(16).padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase();
}

// 커넥터 단자 타입 정규화 및 레거시(BAR, SQUARE) fallback 헬퍼
function normalizeConnectorTerminal(term: string | undefined, defaultTerm: ConnectorTerminalType = 'NONE'): ConnectorTerminalType {
  if (!term || term === 'BAR' || term === 'SQUARE') return defaultTerm;
  if (term === 'ARROW' || term === 'CIRCLE' || term === 'DIAMOND' || term === 'NONE' || term === 'MIXED' || term === 'TRIANGLE_ARROW' || term === 'REVERSED_TRIANGLE_ARROW') {
    return term as ConnectorTerminalType;
  }
  return defaultTerm;
}

// 플러그인 UI 창 열기 (Figma 신규 디자인 규격 360px 폭 및 라이트 테마 대응)
slog('01 showUI:start');
figma.showUI(__html__, {
  width: 360,
  height: 486,
  themeColors: true,
  title: 'Flooow',
});
slog('02 showUI:done');

// ============================================================
// 피그마 UI3 공식 규격 엘레베이션 효과 (Figma Node 2012:307470)
// E100(0: Shapes), E200(1: Stickies), E300(2: Tooltips), E400(3: Menus), E500(4: Modals)
// ============================================================

// 1) 라이트 모드 엘레베이션 (Light Mode)
const ELEVATION_EFFECTS_LIGHT: Record<number, Effect[]> = {
  // E100 (Shapes): 0 0 0.5px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.15)
  0: [
    {
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.3 },
      offset: { x: 0, y: 0 },
      radius: 0.5,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL',
    },
    {
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.15 },
      offset: { x: 0, y: 1 },
      radius: 3,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL',
    },
  ],

  // E200 (Stickies, Comments): 0 0 0.5px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.1), 0 3px 8px rgba(0,0,0,0.1)
  1: [
    {
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.18 },
      offset: { x: 0, y: 0 },
      radius: 0.5,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL',
    },
    {
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.1 },
      offset: { x: 0, y: 1 },
      radius: 3,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL',
    },
    {
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.1 },
      offset: { x: 0, y: 3 },
      radius: 8,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL',
    },
  ],

  // E300 (Tooltips): 0 0 0.5px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.1), 0 5px 12px rgba(0,0,0,0.13)
  2: [
    {
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.15 },
      offset: { x: 0, y: 0 },
      radius: 0.5,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL',
    },
    {
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.1 },
      offset: { x: 0, y: 1 },
      radius: 3,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL',
    },
    {
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.13 },
      offset: { x: 0, y: 5 },
      radius: 12,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL',
    },
  ],

  // E400 (Menus, Panels): 0 0 0.5px rgba(0,0,0,0.12), 0 2px 5px rgba(0,0,0,0.15), 0 10px 16px rgba(0,0,0,0.12)
  3: [
    {
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.12 },
      offset: { x: 0, y: 0 },
      radius: 0.5,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL',
    },
    {
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.15 },
      offset: { x: 0, y: 2 },
      radius: 5,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL',
    },
    {
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.12 },
      offset: { x: 0, y: 10 },
      radius: 16,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL',
    },
  ],

  // E500 (Modals, Dialogs): 0 0 0.5px rgba(0,0,0,0.08), 0 2px 5px rgba(0,0,0,0.15), 0 10px 24px rgba(0,0,0,0.18)
  4: [
    {
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.08 },
      offset: { x: 0, y: 0 },
      radius: 0.5,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL',
    },
    {
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.15 },
      offset: { x: 0, y: 2 },
      radius: 5,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL',
    },
    {
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.18 },
      offset: { x: 0, y: 10 },
      radius: 24,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL',
    },
  ],
};

// 2) 다크 모드 엘레베이션 (Dark Mode)
const ELEVATION_EFFECTS_DARK: Record<number, Effect[]> = {
  // E100 (Shapes): inset 0 .5px 0 rgba(255,255,255,0.1), inset 0 0 0.5px rgba(255,255,255,0.35), 0 0 0.5px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.4)
  0: [
    {
      type: 'INNER_SHADOW',
      color: { r: 1, g: 1, b: 1, a: 0.1 },
      offset: { x: 0, y: 0.5 },
      radius: 0,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL',
    },
    {
      type: 'INNER_SHADOW',
      color: { r: 1, g: 1, b: 1, a: 0.35 },
      offset: { x: 0, y: 0 },
      radius: 0.5,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL',
    },
    {
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.5 },
      offset: { x: 0, y: 0 },
      radius: 0.5,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL',
    },
    {
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.4 },
      offset: { x: 0, y: 1 },
      radius: 3,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL',
    },
  ],

  // E200 (Stickies, Comments): inset 0 .5px 0 rgba(255,255,255,0.08), inset 0 0 .5px rgba(255,255,255,0.35), 0 1px 3px rgba(0,0,0,0.35), 0 3px 8px rgba(0,0,0,0.4)
  1: [
    {
      type: 'INNER_SHADOW',
      color: { r: 1, g: 1, b: 1, a: 0.08 },
      offset: { x: 0, y: 0.5 },
      radius: 0,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL',
    },
    {
      type: 'INNER_SHADOW',
      color: { r: 1, g: 1, b: 1, a: 0.35 },
      offset: { x: 0, y: 0 },
      radius: 0.5,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL',
    },
    {
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.35 },
      offset: { x: 0, y: 1 },
      radius: 3,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL',
    },
    {
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.4 },
      offset: { x: 0, y: 3 },
      radius: 8,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL',
    },
  ],

  // E300 (Tooltips): inset 0 .5px 0 rgba(255,255,255,0.08), inset 0 0 .5px rgba(255,255,255,0.35), 0 1px 3px rgba(0,0,0,0.5), 0 5px 12px rgba(0,0,0,0.35)
  2: [
    {
      type: 'INNER_SHADOW',
      color: { r: 1, g: 1, b: 1, a: 0.08 },
      offset: { x: 0, y: 0.5 },
      radius: 0,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL',
    },
    {
      type: 'INNER_SHADOW',
      color: { r: 1, g: 1, b: 1, a: 0.35 },
      offset: { x: 0, y: 0 },
      radius: 0.5,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL',
    },
    {
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.5 },
      offset: { x: 0, y: 1 },
      radius: 3,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL',
    },
    {
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.35 },
      offset: { x: 0, y: 5 },
      radius: 12,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL',
    },
  ],

  // E400 (Menus, Panels): inset 0 .5px 0 rgba(255,255,255,0.08), inset 0 0 .5px rgba(255,255,255,0.35), 0 2px 5px rgba(0,0,0,0.35), 0 10px 16px rgba(0,0,0,0.35)
  3: [
    {
      type: 'INNER_SHADOW',
      color: { r: 1, g: 1, b: 1, a: 0.08 },
      offset: { x: 0, y: 0.5 },
      radius: 0,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL',
    },
    {
      type: 'INNER_SHADOW',
      color: { r: 1, g: 1, b: 1, a: 0.35 },
      offset: { x: 0, y: 0 },
      radius: 0.5,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL',
    },
    {
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.35 },
      offset: { x: 0, y: 2 },
      radius: 5,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL',
    },
    {
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.35 },
      offset: { x: 0, y: 10 },
      radius: 16,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL',
    },
  ],

  // E500 (Modals, Dialogs): inset 0 .5px 0 rgba(255,255,255,0.08), inset 0 0 .5px rgba(255,255,255,0.35), 0 3px 5px rgba(0,0,0,0.35), 0 10px 24px rgba(0,0,0,0.45)
  4: [
    {
      type: 'INNER_SHADOW',
      color: { r: 1, g: 1, b: 1, a: 0.08 },
      offset: { x: 0, y: 0.5 },
      radius: 0,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL',
    },
    {
      type: 'INNER_SHADOW',
      color: { r: 1, g: 1, b: 1, a: 0.35 },
      offset: { x: 0, y: 0 },
      radius: 0.5,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL',
    },
    {
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.35 },
      offset: { x: 0, y: 3 },
      radius: 5,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL',
    },
    {
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.45 },
      offset: { x: 0, y: 10 },
      radius: 24,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL',
    },
  ],
};

function getElevationEffects(level: number, isDark = false): Effect[] {
  return isDark
    ? (ELEVATION_EFFECTS_DARK[level] || ELEVATION_EFFECTS_LIGHT[level] || [])
    : (ELEVATION_EFFECTS_LIGHT[level] || []);
}

/**
 * FigJam 텍스트 팔레트의 Black / White.
 * Black은 #000000이 아니라 #1E1E1E다. 0x1E/255가 아니면 FigJam이 커스텀 색으로 취급한다.
 */
const FIGMA_TEXT_BLACK: RGB = { r: 0x1e / 255, g: 0x1e / 255, b: 0x1e / 255 };
const FIGMA_TEXT_WHITE: RGB = { r: 1, g: 1, b: 1 };

/** 부모에 붙은 뒤 기본 텍스트 스타일이 색을 덮어쓰지 않도록 다시 지정한다. */
function applyFigmaTextFill(text: TextNode, fill: SolidPaint): void {
  try {
    if (text.fillStyleId) text.fillStyleId = '';
  } catch (_) {}
  text.fills = [fill];
}

/**
 * 스타일 채움색 명도에 따른 타이틀 및 디스크립션 텍스트 Paint.
 * 노드 테마(light/dark)는 보지 않는다.
 * - 밝은 채움: FigJam Black #1E1E1E. 어두운 채움: White #FFFFFF
 * - 디스크립션: 같은 베이스에 알파값(opacity)으로 명도를 부드럽게 낮춤
 */
function getTextFillsByBackground(bgColor: RGB): {
  titleFill: SolidPaint;
  descFill: SolidPaint;
  isBgDark: boolean;
} {
  const luminance = 0.299 * bgColor.r + 0.587 * bgColor.g + 0.114 * bgColor.b;
  const isBgDark = luminance < 0.5;

  const baseColor: RGB = isBgDark ? FIGMA_TEXT_WHITE : FIGMA_TEXT_BLACK;
  const descOpacity = isBgDark ? 0.7 : 0.6;

  return {
    titleFill: {
      type: 'SOLID',
      color: baseColor,
      opacity: 1,
    },
    descFill: {
      type: 'SOLID',
      color: baseColor,
      opacity: descOpacity,
    },
    isBgDark,
  };
}

/**
 * 노드 배경색의 채도와 명도를 분석하여 스테이터스 뱃지의 배경 및 텍스트 색상을 반환
 * - 노드 배경색이 일정 채도(Saturation) 이상인 유채색인 경우:
 *   스타일 컬러와의 색상 충돌 방지를 위해 무채색 뱃지로 전환
 *   - 노드가 어두운 배경(Luminance < 0.5): 흰색 배경에 검정 글자
 *   - 노드가 밝은 배경(Luminance >= 0.5): 검정 배경에 흰색 글자
 * - 노드 배경색이 무채색(흰색, 그레이, 블랙 등)인 경우:
 *   STATUS_CONFIG의 고유 스테이터스 색상(초록, 파랑, 오렌지 등) 유지
 */
function getStatusBadgeColors(
  status: WorkflowStatus,
  nodeBgColor: RGB,
  isDarkTheme = false
): {
  badgeBg: RGB;
  badgeTextColor: RGB;
  isMonochrome: boolean;
} {
  const cfg = STATUS_CONFIG[status];
  const defaultBg = cfg ? cfg.color : { r: 0.5, g: 0.5, b: 0.5 };
  const defaultText = cfg ? cfg.textColor : { r: 1, g: 1, b: 1 };

  // 1. 채도(Saturation) 계산 (HSV 기반)
  const max = Math.max(nodeBgColor.r, nodeBgColor.g, nodeBgColor.b);
  const min = Math.min(nodeBgColor.r, nodeBgColor.g, nodeBgColor.b);
  const delta = max - min;
  const saturation = max === 0 ? 0 : delta / max;

  // 채도 임계값: saturation >= 0.15 및 delta >= 0.08이면 유채색으로 판별
  const isChromatic = saturation >= 0.15 && delta >= 0.08;

  if (isChromatic) {
    // 2. 명도(Luminance) 계산
    const luminance = 0.299 * nodeBgColor.r + 0.587 * nodeBgColor.g + 0.114 * nodeBgColor.b;
    const isBgDark = isDarkTheme || luminance < 0.5;

    if (isBgDark) {
      // 어두운 유채색 배경: 화이트 배경에 노드의 배경색 글자
      return {
        badgeBg: { r: 1, g: 1, b: 1 },
        badgeTextColor: nodeBgColor,
        isMonochrome: true,
      };
    } else {
      // 밝은 유채색 배경: 블랙 배경에 노드의 배경색 글자
      return {
        badgeBg: { r: 0, g: 0, b: 0 },
        badgeTextColor: nodeBgColor,
        isMonochrome: true,
      };
    }
  }

  // 무채색 배경인 경우 원래 스테이터스 컬러 유지
  return {
    badgeBg: defaultBg,
    badgeTextColor: defaultText,
    isMonochrome: false,
  };
}

/**
 * 노드의 라운드니스(cornerRadius)와 status가 떨어진 간격(10px)을 기반으로
 * status 뱃지의 최적 코너 라운드니스 계산 (중첩 코너 곡률 공식: R_inner = max(0, R_outer - offset))
 */
function getStatusBadgeCornerRadius(nodeCornerRadius: number, offset = 10): number {
  return Math.max(0, Math.round(nodeCornerRadius - offset));
}


// 필수 폰트 사전 로드
async function loadRequiredFonts() {
  await Promise.all([
    figma.loadFontAsync({ family: 'Inter', style: 'Regular' }),
    figma.loadFontAsync({ family: 'Inter', style: 'Medium' }),
    figma.loadFontAsync({ family: 'Inter', style: 'Bold' }),
  ]);
}

// UI로 메시지 전송 헬퍼
function postToUI(msg: CoreToUIMessage) {
  figma.ui.postMessage(msg);
}

// 토스트 알림 전송 (피그마/피그잼 네이티브 노티로만 표시)
function notify(message: string, level: 'info' | 'success' | 'warning' | 'error' = 'info') {
  figma.notify(message, { error: level === 'error' });
}

/**
 * 프로토콜(http, https, figma 등)이 누락된 URL에 자동으로 https://를 붙여 유효한 링크로 정규화합니다.
 */
function normalizeUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * URL이 피그마 링크(figma.com 또는 figma://)인지 확인합니다.
 */
function isFigmaUrl(url: string): boolean {
  if (!url) return false;
  const clean = url.trim().toLowerCase();
  return clean.includes('figma.com/') || clean.startsWith('figma://');
}

/**
 * 노드 하단 왼쪽에 링크 아이콘(피그마 링크: icon.16.pen / 일반 링크: icon.16.linkedobject)을 생성/갱신합니다.
 * 피그마 API 제약(TextNode만 hyperlink 지원)을 고려하여 아이콘 위에 16x16 투명 TextNode 오버레이를 배치합니다.
 */
async function updateFigmaLinkBadge(
  card: FrameNode,
  figmaLink?: string,
  isBgDark = false,
  clearCache = false
) {
  const existingBadge = card.children.find(
    (c) => safeGetPluginData(c, 'is_figma_link_badge') === 'true' || c.name === 'FigmaLinkBadge'
  ) as FrameNode | undefined;

  const rawLink = (figmaLink || '').trim();
  const trimmedLink = normalizeUrl(rawLink);

  // 링크가 없는 경우: 기존 뱃지 제거 및 메타데이터 삭제 (토글 시에는 캐시 유지)
  if (!trimmedLink) {
    if (existingBadge) {
      existingBadge.remove();
    }
    card.setPluginData('figma_link', '');
    if (clearCache) {
      card.setPluginData('cached_figma_link', '');
    }
    return;
  }

  // 링크 메타데이터 및 캐시 저장
  card.setPluginData('figma_link', trimmedLink);
  card.setPluginData('cached_figma_link', trimmedLink);

  const iconColor = isBgDark ? '#FFFFFF' : '#000000';
  const isFigma = isFigmaUrl(trimmedLink);

  // 1. icon.16.pen SVG (피그마 링크용 - 피그마 UI3 원본 사양)
  const penSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
  <path d="M3.72849 3.02145C4.83925 3.13055 9.67484 3.67513 11 4.99997C11.8888 5.88903 12.2722 7.28337 12.1123 8.59665L13.2988 9.79294C13.6863 10.1839 13.6851 10.8148 13.2959 11.2041L11.1748 13.3252C10.7832 13.7168 10.1478 13.7154 9.75779 13.3222L8.56052 12.1162C7.25778 12.2648 5.8809 11.8808 4.99998 11C3.6753 9.67487 3.13064 4.83971 3.02146 3.72849C3.00717 3.58223 3.06014 3.43984 3.16404 3.33591L3.33591 3.16403C3.43991 3.06006 3.58214 3.00708 3.72849 3.02145ZM7.74119 7.03415C7.82376 7.01208 7.91045 6.99997 7.99998 6.99997C8.55226 6.99997 8.99998 7.44769 8.99998 7.99997C8.99997 8.55225 8.55226 8.99997 7.99998 8.99997C7.44771 8.99995 6.99998 8.55224 6.99998 7.99997C6.99998 7.91045 7.01209 7.82375 7.03416 7.74118L4.16306 4.87009C4.24914 5.50937 4.36996 6.29249 4.53416 7.08005C4.68675 7.81193 4.87047 8.52441 5.08689 9.11911C5.3135 9.74173 5.53564 10.1215 5.70701 10.2929C6.33123 10.917 7.38392 11.243 8.44627 11.122L8.92966 11.0674L9.27049 11.4121L10.4668 12.6181L12.5888 10.497L11.4023 9.30075L11.0615 8.957L11.1201 8.47556C11.2505 7.40454 10.9231 6.33743 10.2929 5.707C10.1215 5.53565 9.74187 5.31345 9.11912 5.08688C8.52433 4.87051 7.81203 4.68665 7.08006 4.53415C6.29249 4.37008 5.50946 4.24895 4.87009 4.16306L7.74119 7.03415Z" fill="${iconColor}" fill-opacity="0.9"/>
</svg>`;

  // 2. icon.16.linkedobject SVG (일반 웹/외부 링크용 - 피그마 UI3 원본 사양)
  const linkedObjectSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
  <path d="M8.73242 10.7324C8.92757 10.5374 9.24419 10.5376 9.43945 10.7324C9.63415 10.9277 9.63446 11.2444 9.43945 11.4395C8.85388 12.0251 8.85413 12.9747 9.43945 13.5605C10.0253 14.1459 10.9749 14.1461 11.5605 13.5605C11.7556 13.3656 12.0723 13.3659 12.2676 13.5605C12.4624 13.7558 12.4626 14.0725 12.2676 14.2676C11.2914 15.2437 9.70875 15.2434 8.73242 14.2676C7.75658 13.2913 7.75632 11.7086 8.73242 10.7324ZM11.5 3C12.3284 3 13 3.67157 13 4.5V6.5C13 6.77614 12.7761 7 12.5 7C12.2239 7 12 6.77614 12 6.5V4.5C12 4.22386 11.7761 4 11.5 4H4.5C4.22386 4 4 4.22386 4 4.5V11.5C4 11.7761 4.22386 12 4.5 12H6.5C6.77614 12 7 12.2239 7 12.5C7 12.7761 6.77614 13 6.5 13H4.5L4.34668 12.9922C3.64069 12.9205 3.07949 12.3593 3.00781 11.6533L3 11.5V4.5C3 3.67157 3.67157 3 4.5 3H11.5ZM12.1465 10.1465C12.3416 9.95137 12.6582 9.95165 12.8535 10.1465C13.0483 10.3418 13.0486 10.6584 12.8535 10.8535L10.8535 12.8535C10.6584 13.0486 10.3418 13.0483 10.1465 12.8535C9.95165 12.6582 9.95137 12.3416 10.1465 12.1465L12.1465 10.1465ZM10.7324 8.73242C11.7086 7.75632 13.2913 7.75658 14.2676 8.73242C15.2434 9.70875 15.2437 11.2914 14.2676 12.2676C14.0725 12.4626 13.7558 12.4624 13.5605 12.2676C13.3659 12.0723 13.3656 11.7556 13.5605 11.5605C14.1461 10.9749 14.1459 10.0253 13.5605 9.43945C12.9747 8.85413 12.0251 8.85388 11.4395 9.43945C11.2444 9.63446 10.9277 9.63415 10.7324 9.43945C10.5376 9.24419 10.5374 8.92757 10.7324 8.73242Z" fill="${iconColor}" fill-opacity="0.9"/>
</svg>`;

  let badge = existingBadge;
  if (!badge) {
    badge = figma.createFrame();
    badge.name = 'FigmaLinkBadge';
    badge.fills = [];
    badge.clipsContent = true;
    badge.resize(16, 16);
    badge.cornerRadius = 2;
    badge.setPluginData('is_figma_link_badge', 'true');
    card.appendChild(badge);
  } else {
    badge.clipsContent = true;
    badge.cornerRadius = 2;
    // 기존 자식 노드 제거
    while (badge.children.length > 0) {
      badge.children[0].remove();
    }
  }

  // 1. 피그마 링크 여부에 따라 pen 또는 linkedobject SVG 노드 생성 (16×16)
  const targetSvg = isFigma ? penSvg : linkedObjectSvg;
  const svgNode = figma.createNodeFromSvg(targetSvg);
  svgNode.name = isFigma ? 'icon.16.pen' : 'icon.16.linkedobject';
  svgNode.resize(16, 16);
  badge.appendChild(svgNode);
  svgNode.x = 0;
  svgNode.y = 0;
  svgNode.locked = true;

  // 2. 아이콘 크기(16×16)와 완벽히 1:1로 겹치는 투명 텍스트 링크 오버레이
  const linkText = figma.createText();
  linkText.name = 'LinkOverlay';
  linkText.characters = '█'; // 16x16 블록 문자로 정사각형 영역 확보
  linkText.fontSize = 16;
  linkText.lineHeight = { value: 16, unit: 'PIXELS' };
  linkText.textAlignHorizontal = 'CENTER';
  linkText.textAlignVertical = 'CENTER';
  linkText.textAutoResize = 'NONE';
  linkText.resize(16, 16);
  linkText.x = 0;
  linkText.y = 0;
  linkText.opacity = 0; // 완전 투명
  linkText.hyperlink = { type: 'URL', value: trimmedLink };
  badge.appendChild(linkText);

  // 3. 카드 내 하단 왼쪽 절대 배치
  if (card.layoutMode !== 'NONE') {
    badge.layoutPositioning = 'ABSOLUTE';
  }
  badge.constraints = { horizontal: 'MIN', vertical: 'MAX' };
  badge.x = 16;
  badge.y = card.height - badge.height - 10;
}

// 안전한 플러그인 데이터 조회 헬퍼 (피그잼 네이티브 노드 중 getPluginData가 없거나 함수가 아닌 경우 TypeError 방지)
function safeGetPluginData(node: any, key: string): string {
  if (node && typeof node.getPluginData === 'function') {
    try {
      return node.getPluginData(key) || '';
    } catch (_) {
      return '';
    }
  }
  return '';
}

// 선택된 요소 또는 조상 중 커넥터(커스텀 벡터 직각 커넥터) 탐색
function findConnectorNode(node: BaseNode | null): SceneNode | null {
  if (!node) return null;
  let curr: BaseNode | null = node;

  while (curr && curr.type !== 'PAGE' && curr.type !== 'DOCUMENT') {
    if (
      safeGetPluginData(curr, 'is_custom_connector') === 'true' ||
      safeGetPluginData(curr, 'is_flow_connector') === 'true'
    ) {
      // 만약 부모가 커스텀 커넥터 그룹이라면 최상위 커넥터 그룹을 반환
      let topConnector: SceneNode = curr as SceneNode;
      let parentScan: BaseNode | null = curr.parent;
      while (parentScan && parentScan.type !== 'PAGE' && parentScan.type !== 'DOCUMENT') {
        if (
          safeGetPluginData(parentScan, 'is_custom_connector') === 'true' ||
          safeGetPluginData(parentScan, 'is_flow_connector') === 'true'
        ) {
          topConnector = parentScan as SceneNode;
        }
        parentScan = parentScan.parent;
      }
      return topConnector;
    }
    curr = curr.parent;
  }
  return null;
}

// 선택된 요소의 조상 중 Flow Node 탐색 (FrameNode 및 ShapeWithTextNode 모두 완벽 지원)
function findFlowNode(node: BaseNode | null): (FrameNode | ShapeWithTextNode) | null {
  if (!node) return null;

  // 커넥터 또는 커넥터 내부 자식이면 플로우 노드로 매핑하지 않음
  if (findConnectorNode(node)) return null;

  let curr: BaseNode | null = node;

  while (curr && curr.type !== 'PAGE' && curr.type !== 'DOCUMENT') {
    if (
      safeGetPluginData(curr, 'is_flow_node') === 'true' ||
      Boolean(safeGetPluginData(curr, 'node_type'))
    ) {
      return curr as FrameNode | ShapeWithTextNode;
    }
    curr = curr.parent;
  }
  return null;
}

// 캔버스 내 플로우 노드 개수 확인 (태그 자동 넘버링: p1, p2, p3...)
function getNextFlowTag(): string {
  slog('20 getNextFlowTag:start');
  try {
    slog('21 getNextFlowTag:findAll:start');
    const flowNodes = figma.currentPage.findAll((node) => {
      try {
        if (!node) return false;
        if (node.type !== 'FRAME' && node.type !== 'SHAPE_WITH_TEXT') return false;
        return safeGetPluginData(node, 'is_flow_node') === 'true';
      } catch (_) {
        return false;
      }
    });
    slog(`22 getNextFlowTag:findAll:done count=${flowNodes.length}`);
    const tag = `p${flowNodes.length + 1}`;
    slog(`23 getNextFlowTag:done tag=${tag}`);
    return tag;
  } catch (_) {
    slog('23 getNextFlowTag:done tag=p1 (fallback)');
    return 'p1';
  }
}

// ---------------------------------------------------------------------------
// Usage session / project index (FigJam과 동일)
// - startup과 생성·삭제 갱신에서는 figma.root.findAll()을 호출하지 않는다.
// - full scan은 Free 생성 제한(approveNewElements)과 Free Usage refresh에서만 한다.
// - Pro/Dev는 저장된 usage index/cache만 반환한다. entitlement 확인은 findAll을 타지 않는다.
// - 삭제된 노드는 pluginData를 읽을 수 없으므로, 세션에서 추적 중인 top-level id만 차감한다.
// ---------------------------------------------------------------------------

const USAGE_INDEX_KEY = 'flooow_usage_index';
const USAGE_TRACK_KEY = 'flooow_usage_track';
const USAGE_FILE_ID_KEY = 'flooow_usage_file_id';
/** 문서 노드 id는 모든 파일에서 '0:0'이라 프로젝트 키로 쓸 수 없다. */
const LEGACY_SHARED_PROJECT_ID = '0:0';

let sessionNodes = 0;
let sessionConnectors = 0;
/** 이번 세션에서 정체를 확인한 top-level id. 없는 id의 DELETE는 무시한다. */
const trackedNodes = new Set<string>();
const trackedConnectors = new Set<string>();
/** true면 id 집합이 현재 프로젝트의 완전한 목록이다. 부분 집합은 저장하지 않는다. */
let trackComplete = false;
/** clientStorage index 한 프로젝트 값. 예전 저장분은 숫자(합계)만 있을 수 있다. */
type UsageIndexEntry = { nodes: number; connectors: number };

/** Pro/Dev 모달이 프로젝트별 index 합계를 보고 있는 동안만 true. */
let showIndexedTotal = false;
let indexSumCache: FlooowElementCount | null = null;
/** 모달이 연 뒤 생성·삭제가 clientStorage 왕복 전에 합계를 고칠 때 쓰는 사본. */
let loadedUsageIndex: Record<string, UsageIndexEntry> | null = null;
let usageIndexChain: Promise<void> = Promise.resolve();

function sessionElementCount(): FlooowElementCount {
  return {
    nodes: sessionNodes,
    connectors: sessionConnectors,
    total: sessionNodes + sessionConnectors,
  };
}

function isRemovedSceneNode(node: BaseNode | RemovedNode): node is RemovedNode {
  return 'removed' in node && node.removed === true;
}

/** elementCount와 같은 규칙으로 top-level Flooow element를 가린다. 라벨·untagged native는 제외. */
function classifyTrackedElement(node: BaseNode | null): { id: string; kind: 'node' | 'connector' } | null {
  if (!node || node.type === 'PAGE' || node.type === 'DOCUMENT') return null;
  if (isRemovedSceneNode(node)) return null;
  const conn = findConnectorNode(node);
  if (conn) {
    if (conn.name === 'ConnectorLabel' || safeGetPluginData(conn, 'is_connector_label') === 'true') {
      return null;
    }
    const tagged =
      safeGetPluginData(conn, 'is_custom_connector') === 'true' ||
      safeGetPluginData(conn, 'is_flow_connector') === 'true';
    if (!tagged) return null;
    return { id: conn.id, kind: 'connector' };
  }
  const flow = findFlowNode(node);
  if (!flow) return null;
  return { id: flow.id, kind: 'node' };
}

/** 현재 프로젝트 개수를 Figma 파일(document pluginData)에 남긴다. clientStorage와 별개다. */
function persistTrack(): void {
  const count = sessionElementCount();
  const payload: {
    nodes: number;
    connectors: number;
    total: number;
    complete: boolean;
    n?: string[];
    c?: string[];
  } = {
    nodes: count.nodes,
    connectors: count.connectors,
    total: count.total,
    complete: trackComplete,
  };
  if (trackComplete) {
    payload.n = [...trackedNodes];
    payload.c = [...trackedConnectors];
  }
  try {
    figma.root.setPluginData(USAGE_TRACK_KEY, JSON.stringify(payload));
  } catch (_) {
    /* document pluginData를 쓸 수 없으면 세션 메모리만 유지 */
  }
}

function restoreTrackFromRoot(): boolean {
  let raw = '';
  try {
    raw = figma.root.getPluginData(USAGE_TRACK_KEY) || '';
  } catch (_) {
    return false;
  }
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw) as {
      n?: unknown;
      c?: unknown;
      nodes?: unknown;
      connectors?: unknown;
      total?: unknown;
      complete?: unknown;
    };
    const idList = (value: unknown): string[] =>
      Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
    const asCount = (value: unknown): number | null =>
      typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : null;

    const hasIdList = Array.isArray(parsed.n) || Array.isArray(parsed.c);
    const complete = parsed.complete === true || (parsed.complete == null && hasIdList);
    if (complete && hasIdList) {
      const nodes = idList(parsed.n);
      const connectors = idList(parsed.c);
      trackedNodes.clear();
      trackedConnectors.clear();
      for (const id of nodes) trackedNodes.add(id);
      for (const id of connectors) trackedConnectors.add(id);
      sessionNodes = trackedNodes.size;
      sessionConnectors = trackedConnectors.size;
      trackComplete = true;
      return true;
    }

    const total = asCount(parsed.total);
    const nodes = asCount(parsed.nodes);
    const connectors = asCount(parsed.connectors);
    if (total == null && nodes == null) return false;
    trackedNodes.clear();
    trackedConnectors.clear();
    sessionNodes = nodes ?? total ?? 0;
    sessionConnectors = connectors ?? 0;
    trackComplete = false;
    return true;
  } catch (_) {
    return false;
  }
}

function usageIndexEntry(nodes: number, connectors: number): UsageIndexEntry {
  return {
    nodes: Math.max(0, Math.floor(nodes)),
    connectors: Math.max(0, Math.floor(connectors)),
  };
}

function sameUsageIndexEntry(a: UsageIndexEntry, b: UsageIndexEntry): boolean {
  return a.nodes === b.nodes && a.connectors === b.connectors;
}

/** 숫자만 있는 예전 항목은 합계를 노드에 둔다. 그 파일을 다시 열면 노드/커넥터로 나뉜다. */
function parseUsageIndexEntry(value: unknown): UsageIndexEntry | null {
  const asCount = (n: unknown): number | null =>
    typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.floor(n)) : null;
  if (typeof value === 'number') {
    const total = asCount(value);
    return total != null && total > 0 ? usageIndexEntry(total, 0) : null;
  }
  if (!value || typeof value !== 'object') return null;
  const rec = value as { nodes?: unknown; connectors?: unknown; total?: unknown };
  const nodes = asCount(rec.nodes);
  const connectors = asCount(rec.connectors);
  if (nodes == null && connectors == null) {
    const total = asCount(rec.total);
    return total != null && total > 0 ? usageIndexEntry(total, 0) : null;
  }
  const entry = usageIndexEntry(nodes ?? 0, connectors ?? 0);
  return entry.nodes + entry.connectors > 0 ? entry : null;
}

function logUsage(label: string, detail: Record<string, unknown>): void {
  try {
    console.log(`[FLOOOW-USAGE] ${label}`, detail);
  } catch (_) {
    /* 진단 로그 실패는 합산에 영향 없음 */
  }
}

async function readUsageIndex(): Promise<Record<string, UsageIndexEntry>> {
  const raw = await figma.clientStorage.getAsync(USAGE_INDEX_KEY);
  const index: Record<string, UsageIndexEntry> = {};
  const dropped: string[] = [];
  if (raw && typeof raw === 'object') {
    for (const [projectId, value] of Object.entries(raw as Record<string, unknown>)) {
      const entry = parseUsageIndexEntry(value);
      if (entry) index[projectId] = entry;
      else dropped.push(projectId);
    }
  }
  logUsage('index:read', {
    file: figma.root.name,
    projectId: usageProjectId(),
    fileKey: figma.fileKey ?? null,
    rawType: raw == null ? 'empty' : typeof raw,
    raw,
    parsed: index,
    dropped,
  });
  return index;
}

function sumUsageIndex(index: Record<string, UsageIndexEntry>): FlooowElementCount {
  let nodes = 0;
  let connectors = 0;
  for (const entry of Object.values(index)) {
    nodes += entry.nodes;
    connectors += entry.connectors;
  }
  return { nodes, connectors, total: nodes + connectors };
}

function rememberUsageIndex(index: Record<string, UsageIndexEntry>): void {
  loadedUsageIndex = index;
  indexSumCache = sumUsageIndex(index);
}

/** 파일마다 다른 키. fileKey가 없으면 이 문서 pluginData에 만든 id를 쓴다. */
function usageProjectId(): string {
  const fileKey = figma.fileKey;
  if (fileKey) return fileKey;
  try {
    const stored = figma.root.getPluginData(USAGE_FILE_ID_KEY);
    if (stored && stored !== LEGACY_SHARED_PROJECT_ID) return stored;
    const created = `file-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    figma.root.setPluginData(USAGE_FILE_ID_KEY, created);
    return created;
  } catch (_) {
    return LEGACY_SHARED_PROJECT_ID;
  }
}

/** 0이면 해당 프로젝트 키를 지운다. 다른 프로젝트 항목은 읽기만 한다. */
async function commitUsageIndex(
  projectId: string,
  count: FlooowElementCount
): Promise<Record<string, UsageIndexEntry>> {
  const index = await readUsageIndex();
  let changed = false;
  if (projectId !== LEGACY_SHARED_PROJECT_ID && LEGACY_SHARED_PROJECT_ID in index) {
    delete index[LEGACY_SHARED_PROJECT_ID];
    changed = true;
  }
  const entry = usageIndexEntry(count.nodes, count.connectors);
  if (entry.nodes + entry.connectors === 0) {
    if (projectId in index) {
      delete index[projectId];
      changed = true;
    }
  } else if (!index[projectId] || !sameUsageIndexEntry(index[projectId], entry)) {
    index[projectId] = entry;
    changed = true;
  }
  if (!changed) return index;
  await figma.clientStorage.setAsync(USAGE_INDEX_KEY, index);
  logUsage('index:write', {
    file: figma.root.name,
    projectId,
    fileKey: figma.fileKey ?? null,
    wrote: entry.nodes + entry.connectors === 0 ? null : entry,
    index,
  });
  return index;
}

function enqueueUsageIndex(count: FlooowElementCount): void {
  const projectId = usageProjectId();
  usageIndexChain = usageIndexChain
    .then(() => commitUsageIndex(projectId, count))
    .then((index) => {
      if (showIndexedTotal) rememberUsageIndex(index);
    })
    .catch((err) => {
      console.error('[FLOOOW-USAGE] index:write:failed', err);
    });
}

function postFlooowUsage(refresh = false): void {
  const entitlement = getCreateEntitlement();
  const usage = assembleFlooowUsage(sessionElementCount(), entitlement);
  const appliedSum = Boolean(showIndexedTotal && isUnlimitedEntitlement(entitlement) && indexSumCache);
  if (appliedSum && indexSumCache) {
    usage.nodes = indexSumCache.nodes;
    usage.connectors = indexSumCache.connectors;
    usage.total = indexSumCache.total;
  }
  logUsage('post', {
    file: figma.root.name,
    projectId: usageProjectId(),
    refresh,
    entitlement,
    showIndexedTotal,
    appliedSum,
    session: sessionElementCount(),
    indexSum: indexSumCache,
    posted: { nodes: usage.nodes, connectors: usage.connectors, total: usage.total },
  });
  postToUI({
    type: 'FLOOOW_USAGE',
    usage,
    refresh: refresh || undefined,
  });
}

function postFlooowPlanIssue(error: 'retryable' | 'blocked'): void {
  // usage는 메시지 형식용이다. UI는 error가 있으면 이 값을 구독 상태로 쓰지 않는다.
  postToUI({
    type: 'FLOOOW_USAGE',
    usage: assembleFlooowUsage({ nodes: 0, connectors: 0, total: 0 }, 'FREE'),
    error,
  });
}

/** startup: 저장해 둔 id 또는 이 프로젝트의 index 값만 복원한다. root.findAll() 없음. */
async function restoreUsageSession(): Promise<void> {
  if (restoreTrackFromRoot()) {
    logUsage('restore:track', {
      file: figma.root.name,
      projectId: usageProjectId(),
      session: sessionElementCount(),
      trackComplete,
    });
    enqueueUsageIndex(sessionElementCount());
    return;
  }
  try {
    const index = await readUsageIndex();
    const cached = index[usageProjectId()];
    if (cached) {
      trackedNodes.clear();
      trackedConnectors.clear();
      sessionNodes = cached.nodes;
      sessionConnectors = cached.connectors;
      trackComplete = false;
    }
    logUsage('restore:index', {
      file: figma.root.name,
      projectId: usageProjectId(),
      cached: cached ?? null,
      session: sessionElementCount(),
    });
  } catch (err) {
    console.error('[FLOOOW-USAGE] restore:failed', err);
  }
}

function forgetTracked(id: string): boolean {
  if (trackedNodes.delete(id)) {
    sessionNodes = Math.max(0, sessionNodes - 1);
    return true;
  }
  if (trackedConnectors.delete(id)) {
    sessionConnectors = Math.max(0, sessionConnectors - 1);
    return true;
  }
  return false;
}

/**
 * 그룹으로 승격된 커넥터는 top id만 남긴다.
 * 직전에 센 자식 id를 여기서 빼야 replacement·group 생성이 두 번 증가하지 않는다.
 */
function forgetWrappedConnectors(created: SceneNode, topId: string): boolean {
  if (!('findAll' in created)) return false;
  let changed = false;
  let descendants: ReadonlyArray<SceneNode> = [];
  try {
    descendants = created.findAll(() => true);
  } catch (_) {
    return false;
  }
  for (const descendant of descendants) {
    if (descendant.id === topId) continue;
    if (trackedConnectors.delete(descendant.id)) {
      sessionConnectors = Math.max(0, sessionConnectors - 1);
      changed = true;
    }
  }
  return changed;
}

/** 이미 추적 중인 id는 다시 더하지 않는다. */
function trackSceneNode(node: SceneNode): boolean {
  const classified = classifyTrackedElement(node);
  if (!classified) return false;
  // 자식이 만들어질 때 이미 있는 부모를 다시 세지 않는다. top-level 생성만 반영한다.
  if (classified.id !== node.id) return false;
  if (classified.kind === 'connector') {
    const collapsed = forgetWrappedConnectors(node, classified.id);
    if (trackedConnectors.has(classified.id)) return collapsed;
    trackedConnectors.add(classified.id);
    sessionConnectors += 1;
    return true;
  }
  if (trackedNodes.has(classified.id)) return false;
  trackedNodes.add(classified.id);
  sessionNodes += 1;
  return true;
}

function publishUsageChange(_delta: number): void {
  persistTrack();
  const count = sessionElementCount();
  const projectId = usageProjectId();
  if (showIndexedTotal && loadedUsageIndex) {
    if (count.total === 0) delete loadedUsageIndex[projectId];
    else loadedUsageIndex[projectId] = usageIndexEntry(count.nodes, count.connectors);
    indexSumCache = sumUsageIndex(loadedUsageIndex);
  }
  enqueueUsageIndex(count);
  postFlooowUsage(false);
}

/**
 * 현재 프로젝트만 fresh scan.
 * Free 생성 제한과 Free Usage refresh 전용.
 * startup / selection / documentchange / Pro·Dev에서는 호출하지 않는다.
 */
function scanCurrentProject(): FlooowElementCount {
  const allNodes = figma.root.findAll(() => true);
  const count = countFlooowElements(allNodes);
  const nodes = new Set<string>();
  const connectors = new Set<string>();
  for (const node of allNodes) {
    const classified = classifyTrackedElement(node);
    if (!classified) continue;
    if (classified.kind === 'node') nodes.add(classified.id);
    else connectors.add(classified.id);
  }
  trackedNodes.clear();
  trackedConnectors.clear();
  for (const id of nodes) trackedNodes.add(id);
  for (const id of connectors) trackedConnectors.add(id);
  sessionNodes = count.nodes;
  sessionConnectors = count.connectors;
  trackComplete = true;
  persistTrack();
  return count;
}

/** Pro/Dev 모달 refresh: 저장 index와 세션 cache만 합친다. root.findAll() 없음. */
async function publishUnlimitedUsageFromCache(): Promise<void> {
  const projectId = usageProjectId();
  const session = sessionElementCount();
  logUsage('sum:start', {
    file: figma.root.name,
    projectId,
    session,
    trackComplete,
    entitlement: getCreateEntitlement(),
  });
  const pending = usageIndexChain.then(async () => {
    const index =
      session.total > 0 || trackComplete
        ? await commitUsageIndex(projectId, session)
        : await readUsageIndex();
    showIndexedTotal = true;
    rememberUsageIndex(index);
    logUsage('sum:done', {
      file: figma.root.name,
      projectId,
      index,
      sum: indexSumCache,
    });
  });
  usageIndexChain = pending.then(
    () => undefined,
    () => undefined
  );
  try {
    await pending;
  } catch (err) {
    console.error('[FLOOOW-USAGE] sum:failed', err);
  }
  postFlooowUsage(true);
}

async function refreshUsageFromScan(): Promise<void> {
  const projectId = usageProjectId();
  const entitlement = getCreateEntitlement();
  if (isUnlimitedEntitlement(entitlement)) {
    await publishUnlimitedUsageFromCache();
    return;
  }
  let count: FlooowElementCount;
  try {
    count = scanCurrentProject();
  } catch (err) {
    console.error('[usage refresh 실패]', err);
    postFlooowUsage(true);
    return;
  }
  const pending = usageIndexChain.then(async () => {
    const index = await commitUsageIndex(projectId, count);
    showIndexedTotal = isUnlimitedEntitlement(entitlement);
    rememberUsageIndex(index);
    postFlooowUsage(true);
  });
  usageIndexChain = pending.then(
    () => undefined,
    () => undefined
  );
  try {
    await pending;
  } catch (err) {
    console.error('[usage index 실패]', err);
    postFlooowUsage(true);
  }
}

// 개발 빌드 판별. setPaymentStatusInDevelopment는 개발 모드에서만 성공한다.
// 현재 status를 그대로 다시 기록해 결제 상태를 바꾸지 않고, 결과는 한 번만 캐시한다.
let figmaPluginDevelopment: boolean | null = null;
function isFigmaPluginDevelopment(): boolean {
  if (figmaPluginDevelopment !== null) return figmaPluginDevelopment;
  try {
    const payments = figma.payments;
    const type = payments?.status?.type;
    if (!payments || (type !== 'PAID' && type !== 'UNPAID' && type !== 'NOT_SUPPORTED')) {
      figmaPluginDevelopment = false;
      return false;
    }
    payments.setPaymentStatusInDevelopment({ type });
    figmaPluginDevelopment = true;
  } catch (_) {
    figmaPluginDevelopment = false;
  }
  return figmaPluginDevelopment;
}

// Create Gate entitlement (Step 4): Figma Plugin Payments 실측.
// - 개발 런타임 → DEV_ACTIVE (Pro와 동일 권한, 표시 이름 Dev). 배포본에서는 이 분기가 열리지 않는다.
// - 배포본: PAID → PAID_ACTIVE, 그 외 → FREE.
// - clientStorage/pluginData/UI 값은 절대 사용하지 않는다 (위조 불가 구조).
function getCreateEntitlement(): CreateEntitlement {
  try {
    if (isFigmaPluginDevelopment()) return 'DEV_ACTIVE';
    return normalizePaymentStatus(figma.payments?.status?.type);
  } catch (_) {
    return 'FREE';
  }
}



// CREATE 직렬화 mutex: recount → approve → actual create를 하나의
// critical section에서 수행하여 동시 CREATE race를 방지한다.
let createGateQueue: Promise<void> = Promise.resolve();
function runCreateExclusive<T>(task: () => Promise<T> | T): Promise<T> {
  const run = createGateQueue.then(task, task);
  createGateQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

// 생성 승인. Free만 현재 프로젝트를 fresh scan해서 20개 제한을 본다.
// Pro/Dev는 count를 계산하지 않고 바로 허용한다.
function approveNewElements(requestedCount: number): CreateGateResult {
  const entitlement = getCreateEntitlement();
  if (isUnlimitedEntitlement(entitlement)) {
    return canCreateFlooowElements({
      currentCount: 0,
      requestedCount,
      entitlement,
    });
  }
  const count = scanCurrentProject();
  enqueueUsageIndex(count);
  postFlooowUsage(false);
  return canCreateFlooowElements({
    currentCount: count.total,
    requestedCount,
    entitlement,
  });
}

function notifyLimitReached(result: CreateGateResult): void {
  notify(
    t('limitReached', { current: result.currentCount, limit: result.limit }),
    'warning'
  );
}

// FigJam Node 객체 자체를 Source of Truth로 하여 실제 Title/Description 텍스트 추출
function extractNodeText(node: SceneNode): { title: string; description: string } {
  let title = '';
  let description = '';

  if (node.type === 'FRAME' || 'findAll' in node) {
    const frame = node as FrameNode;
    // 1. node_role 플러그인 데이터 또는 이름으로 명시적 자식 검색
    const titleTextNode = frame.findOne(
      (c) => Boolean(c && c.type === 'TEXT' && (c.name === 'TitleText' || safeGetPluginData(c, 'node_role') === 'title'))
    ) as TextNode | null;
    const descTextNode = frame.findOne(
      (c) => Boolean(c && c.type === 'TEXT' && (c.name === 'DescText' || safeGetPluginData(c, 'node_role') === 'desc'))
    ) as TextNode | null;

    if (titleTextNode) {
      title = titleTextNode.characters || node.name || '';
    }
    if (descTextNode) {
      description = descTextNode.characters;
    }

    // 2. 명시적 역할이 없는 일반 텍스트 노드인 경우 순서대로 추출
    if (!title) {
      const allTexts = frame.findAll((n) => {
        try {
          return Boolean(n && n.type === 'TEXT');
        } catch (_) {
          return false;
        }
      }) as TextNode[];
      if (allTexts.length > 0) title = allTexts[0].characters;
      if (allTexts.length > 1 && !description) {
        description = allTexts[1].characters;
      }
    }
  } else if (node.type === 'SHAPE_WITH_TEXT') {
    const shape = node as ShapeWithTextNode;
    const lines = shape.text.characters.split('\n');
    if (lines.length > 0) title = lines[0];
    if (lines.length > 1) description = lines.slice(1).join('\n');
  } else if (node.type === 'STICKY') {
    const sticky = node as StickyNode;
    const lines = sticky.text.characters.split('\n');
    if (lines.length > 0) title = lines[0];
    if (lines.length > 1) description = lines.slice(1).join('\n');
  }

  // 3. Fallback: 노드 이름 및 하위 호환 레거시 pluginData
  if (!title) {
    title = node.name || safeGetPluginData(node, 'node_title') || 'Untitled';
  }
  if (!description) {
    description = safeGetPluginData(node, 'node_desc') || '';
  }

  return { title, description };
}

// 헤더 프레임 판별 헬퍼 (StepBadge, StatusBadge, FigmaLinkBadge 등 다른 수평 프레임 배제)
function isHeaderFrame(c: SceneNode): boolean {
  if (c.type !== 'FRAME') return false;
  if (c.name === 'Header') return true;
  if (c.name.startsWith('[Step]') || safeGetPluginData(c, 'is_step_badge') === 'true') return false;
  if (c.name === 'StatusBadge' || safeGetPluginData(c, 'is_status_badge') === 'true') return false;
  if (c.name === 'FigmaLinkBadge' || safeGetPluginData(c, 'is_figma_link_badge') === 'true') return false;
  const lm = (c as FrameNode).layoutMode;
  return lm === 'HORIZONTAL' || lm === 'VERTICAL';
}

// 브릿지 필은 타이틀 폭이 수십 px로 고정된다. textAutoResize HEIGHT는 그 폭을 유지하므로,
// 다른 노드로 바꿀 때 헤더가 그 폭을 끌어안고 타이틀이 한 줄로 남는다.
// 카드 안쪽 폭으로 다시 맞춘 뒤 가로는 부모를 채우고 세로는 줄바꿈에 맡긴다.
// Decision 타이틀은 TRUNCATE 고정 높이라, 페이지에 있는 동안 resize하면
// 오토레이아웃 밖으로 빠져 마름모와 좌표가 갈라진다. 카드 자식으로 둔 뒤 중앙에 고정한다.
function syncTitleWidthToCard(card: FrameNode, cardWidth: number, nodeType: DiagramNodeType) {
  const titleText = card.findOne(
    (c) => c.type === 'TEXT' && (c.name === 'TitleText' || safeGetPluginData(c, 'node_role') === 'title')
  ) as TextNode | null;
  if (!titleText) return;

  const header = card.children.find(isHeaderFrame) as FrameNode | undefined;
  if (header) {
    if (header.layoutMode !== 'VERTICAL') {
      try { header.layoutMode = 'VERTICAL'; } catch (_) {}
    }
    try { header.primaryAxisSizingMode = 'AUTO'; } catch (_) {}
    try { header.layoutSizingVertical = 'HUG'; } catch (_) {}
    try { header.layoutSizingHorizontal = 'FILL'; } catch (_) {
      try { header.layoutAlign = 'STRETCH'; } catch (_) {}
    }
  }

  if (nodeType === 'Decision') {
    bindShapeTitle(titleText, 'decision');
    return;
  }

  const pl = typeof card.paddingLeft === 'number' ? card.paddingLeft : 0;
  const pr = typeof card.paddingRight === 'number' ? card.paddingRight : 0;
  const strokeExtra = (typeof card.strokeWeight === 'number' && Array.isArray(card.strokes) && card.strokes.length > 0)
    ? card.strokeWeight * 2
    : 0;
  const availW = Math.max(10, Math.round(cardWidth - pl - pr - strokeExtra));
  const truncate = false;

  try { titleText.maxWidth = null; } catch (_) {}
  if (!truncate) {
    try { titleText.maxHeight = null; } catch (_) {}
  }
  try {
    if (titleText.textAutoResize !== 'NONE') titleText.textAutoResize = 'NONE';
  } catch (_) {}
  try {
    titleText.resize(availW, truncate ? 54 : Math.max(18, Math.round(titleText.height) || 18));
  } catch (_) {}
  try { titleText.textAutoResize = truncate ? 'TRUNCATE' : 'HEIGHT'; } catch (_) {}
  try { titleText.layoutSizingHorizontal = 'FILL'; } catch (_) {
    try { titleText.layoutAlign = 'STRETCH'; } catch (_) {}
  }
  try { titleText.layoutPositioning = 'AUTO'; } catch (_) {}
  if (safeGetPluginData(card, 'branch_variant') === 'TAG') {
    titleText.maxLines = 1;
  }
}

// 선택 변경(handleSelectionChange) 등 순수 투영(Projection) 경로 전용:
// 캔버스 노드(primaryAxisSizingMode, resize, min/maxHeight, descText.maxLines/characters 등)를
// 절대 단 하나도 변조(Mutation)하지 않고 순수 읽기만으로 Hug 높이를 산출하는 완전한 Read-Only 헬퍼
function calculateCardReadOnlyHugHeight(card: FrameNode): number {
  if (card.primaryAxisSizingMode === 'AUTO') {
    return Math.max(SCREEN_NODE_CONSTRAINTS.MIN_HEIGHT, Math.round(card.height));
  }

  if (card.layoutMode === 'VERTICAL') {
    try {
      const headerRow = card.children.find(isHeaderFrame) as FrameNode | undefined;
      const titleText = headerRow
        ? (headerRow.children.find((c) => c.type === 'TEXT' && (c.name === 'TitleText' || safeGetPluginData(c, 'node_role') === 'title')) as TextNode | undefined)
        : (card.children.find((c) => c.type === 'TEXT' && (c.name === 'TitleText' || safeGetPluginData(c, 'node_role') === 'title')) as TextNode | undefined);
      const titleH = headerRow ? Math.round(headerRow.height) : (titleText ? Math.max(18, Math.round(titleText.height)) : 18);

      const descText = card.children.find(
        (c) => c.name === 'DescText' || safeGetPluginData(c, 'node_role') === 'desc'
      ) as TextNode | undefined;

      const descH = descText ? Math.round(descText.height) : 0;
      const pt = typeof card.paddingTop === 'number' ? card.paddingTop : 14;
      const hasStatus = Boolean(safeGetPluginData(card, 'workflow_status'));
      const hasLink = Boolean(safeGetPluginData(card, 'figma_link'));
      const hasBottomBadge = hasStatus || hasLink;
      const hasDesc = descH > 0;
      const pb = typeof card.paddingBottom === 'number'
        ? card.paddingBottom
        : (hasBottomBadge ? 36 : (hasDesc ? 16 : 14));
      const itemSpacing = hasDesc ? (typeof card.itemSpacing === 'number' ? card.itemSpacing : 8) : 0;

      const calculatedH = Math.round(pt + titleH + itemSpacing + descH + pb);
      return Math.max(SCREEN_NODE_CONSTRAINTS.MIN_HEIGHT, calculatedH);
    } catch (_) {
      // 실패 시 기본 크기 반환
    }
  }

  return Math.max(SCREEN_NODE_CONSTRAINTS.MIN_HEIGHT, Math.round(card.height));
}

// 카드의 전체 내용(헤더 + 패딩 + 설명 텍스트 전체 + 상태 뱃지 여백)을 모두 수용하기 위한 최소 Hug 높이 정밀 산출
// 피그마 네이티브 오토레이아웃 렌더링 엔진을 Source of Truth로 사용하여 1픽셀의 오차도 없이 일원화 (최소 49px 보장)
function calculateCardHugHeight(card: FrameNode, textCharacters?: string): number {
  const isAuto = card.primaryAxisSizingMode === 'AUTO';
  if (isAuto && textCharacters === undefined) {
    return Math.max(SCREEN_NODE_CONSTRAINTS.MIN_HEIGHT, Math.round(card.height));
  }

  // VERTICAL 오토레이아웃 노드(Screen 카드 등)인 경우:
  // 프레임 자체의 sizingMode / resize / min·maxHeight를 임시 변경하지 않고,
  // 내부 자식 요소(Header, DescText)와 패딩/간격의 실측치로 Hug 높이를 산출하여 documentchange mutation을 원천 차단함
  if (card.layoutMode === 'VERTICAL') {
    try {
      const headerRow = card.children.find(isHeaderFrame) as FrameNode | undefined;
      const titleText = headerRow
        ? (headerRow.children.find((c) => c.type === 'TEXT' && (c.name === 'TitleText' || safeGetPluginData(c, 'node_role') === 'title')) as TextNode | undefined)
        : (card.children.find((c) => c.type === 'TEXT' && (c.name === 'TitleText' || safeGetPluginData(c, 'node_role') === 'title')) as TextNode | undefined);
      const titleH = headerRow ? Math.round(headerRow.height) : (titleText ? Math.max(18, Math.round(titleText.height)) : 18);

      const descText = card.children.find(
        (c) => c.name === 'DescText' || safeGetPluginData(c, 'node_role') === 'desc'
      ) as TextNode | undefined;

      let descH = 0;
      if (descText) {
        const prevChars = descText.characters;
        const targetChars = textCharacters !== undefined ? textCharacters : prevChars;
        if (targetChars.length > 0) {
          const prevMaxLines = descText.maxLines;
          const needRestoreMaxLines = prevMaxLines !== null;
          const needRestoreChars = textCharacters !== undefined && textCharacters !== prevChars;

          if (needRestoreMaxLines) {
            descText.maxLines = null;
          }
          if (needRestoreChars) {
            descText.characters = textCharacters;
          }

          descH = Math.round(descText.height);

          if (needRestoreMaxLines) {
            descText.maxLines = prevMaxLines;
          }
          if (needRestoreChars) {
            descText.characters = prevChars;
          }
        }
      }

      const pt = typeof card.paddingTop === 'number' ? card.paddingTop : 14;
      const hasStatus = Boolean(safeGetPluginData(card, 'workflow_status'));
      const hasLink = Boolean(safeGetPluginData(card, 'figma_link'));
      const hasBottomBadge = hasStatus || hasLink;
      const hasDesc = descH > 0;
      const pb = typeof card.paddingBottom === 'number'
        ? card.paddingBottom
        : (hasBottomBadge ? 36 : (hasDesc ? 16 : 14));
      const itemSpacing = hasDesc ? (typeof card.itemSpacing === 'number' ? card.itemSpacing : 8) : 0;

      const calculatedH = Math.round(pt + titleH + itemSpacing + descH + pb);
      return Math.max(SCREEN_NODE_CONSTRAINTS.MIN_HEIGHT, calculatedH);
    } catch (_) {
      // 실패 시 fallback
    }
  }

  const prevSizingMode = card.primaryAxisSizingMode;
  const prevHeight = card.height;
  const prevMinHeight = card.minHeight;
  const prevMaxHeight = card.maxHeight;

  const descText = card.children.find(
    (c) => c.name === 'DescText' || safeGetPluginData(c, 'node_role') === 'desc'
  ) as TextNode | undefined;
  const prevMaxLines = descText ? descText.maxLines : null;
  const prevDescChars = descText ? descText.characters : '';

  try {
    card.minHeight = null;
    card.maxHeight = null;
    if (descText) {
      descText.maxLines = null;
      if (textCharacters !== undefined && textCharacters !== prevDescChars) {
        descText.characters = textCharacters;
      }
    }
    card.primaryAxisSizingMode = 'AUTO';

    const hugH = Math.round(card.height);

    // 즉시 원래 상태로 완벽 복원
    card.primaryAxisSizingMode = prevSizingMode;
    card.resize(card.width, prevHeight);
    card.minHeight = prevMinHeight;
    card.maxHeight = prevMaxHeight;
    if (descText) {
      if (prevMaxLines !== null) descText.maxLines = prevMaxLines;
      if (textCharacters !== undefined && textCharacters !== prevDescChars) {
        descText.characters = prevDescChars;
      }
    }

    return Math.max(SCREEN_NODE_CONSTRAINTS.MIN_HEIGHT, hugH);
  } catch (_) {
    return Math.max(SCREEN_NODE_CONSTRAINTS.MIN_HEIGHT, Math.round(card.height));
  }
}

/**
 * 텍스트가 줄바꿈 없이 한 줄로 표시될 때의 실제 픽셀 너비를 정확하게 측정합니다.
 * Figma C++ 코어 엔진이 글리프 메트릭(HarfBuzz)을 계산할 수 있도록 일시적으로 currentPage에 마운트한 후 측정하고 즉시 제거합니다.
 */
async function measureSingleLineTextWidth(
  text: string,
  fontName: FontName,
  fontSize: number
): Promise<number> {
  const trimmed = text.trim();
  if (!trimmed) return 0;

  await figma.loadFontAsync(fontName);
  const measureNode = figma.createText();
  // 캔버스 렌더 트리에 마운트하여 글리프 셰이핑과 textAutoResize가 정상 작동하도록 보장
  measureNode.x = -99999;
  measureNode.y = -99999;
  figma.currentPage.appendChild(measureNode);

  try {
    measureNode.fontName = fontName;
    measureNode.fontSize = fontSize;
    measureNode.lineHeight = { value: 18, unit: 'PIXELS' };
    measureNode.textAutoResize = 'WIDTH_AND_HEIGHT';

    let maxLineW = 0;
    // 줄바꿈이 있는 경우 각 라인 중 가장 긴 라인의 너비 측정
    const lines = trimmed.split('\n');
    for (const line of lines) {
      const l = line.trim();
      if (l) {
        measureNode.characters = l;
        // 서브픽셀 렌더링 및 Figma 오토레이아웃 줄바꿈 방지를 위해 올림 + 2px 안전 여유분 부여
        const w = Math.ceil(measureNode.width) + 2;
        if (w > maxLineW) {
          maxLineW = w;
        }
      }
    }
    return maxLineW;
  } finally {
    measureNode.remove();
  }
}

// 스페이스 1칸 어드밴스 (Inter Bold 13px 기준, 세션 캐시).
// 'a a'와 'aa' 측정값 차이로 산출한다. 앞뒤 스페이스 trim 내성이라 끝공백 폭 측정에 쓴다.
let cachedSpaceAdvanceW: number | null = null;
async function measureSpaceAdvance(): Promise<number> {
  if (cachedSpaceAdvanceW !== null) return cachedSpaceAdvanceW;
  const font: FontName = { family: 'Inter', style: 'Bold' };
  const withSpace = await measureSingleLineTextWidth('a a', font, 13);
  const withoutSpace = await measureSingleLineTextWidth('aa', font, 13);
  cachedSpaceAdvanceW = Math.max(0, withSpace - withoutSpace);
  return cachedSpaceAdvanceW;
}

/** 플러그인 타이틀 입력(maxLength 32)과 같은 글자 수 제한 */
const TITLE_CHAR_LIMIT = 32;
const TAG_TITLE_PAD_X = 12;

/** Screen 디스크립션(Inter Regular 11px) 고정 라인하이트 */
const DESC_LINE_HEIGHT = 15;

function clampTitleChars(title: string): string {
  const chars = Array.from(title);
  return chars.length > TITLE_CHAR_LIMIT ? chars.slice(0, TITLE_CHAR_LIMIT).join('') : title;
}

async function resolveTagCardWidth(title: string, minWidth: number): Promise<number> {
  const textW = await measureSingleLineTextWidth(
    title || 'Tag',
    { family: 'Inter', style: 'Bold' },
    13
  );
  return Math.max(minWidth, textW + TAG_TITLE_PAD_X * 2 + 4);
}

/**
 * 도형 타이틀을 오토레이아웃 안에 둔다.
 * Decision에서 TRUNCATE + resize를 하면 텍스트가 마름모 밖으로 빠진다.
 */
function bindShapeTitle(titleText: TextNode, kind: 'decision' | 'tag' | 'shape') {
  try { titleText.layoutPositioning = 'AUTO'; } catch (_) {}
  titleText.layoutAlign = 'STRETCH';
  try { titleText.layoutSizingHorizontal = 'FILL'; } catch (_) {}
  try { titleText.layoutSizingVertical = 'HUG'; } catch (_) {}
  try { titleText.maxWidth = null; } catch (_) {}
  try { titleText.maxHeight = null; } catch (_) {}
  titleText.textAlignHorizontal = 'CENTER';
  titleText.textAlignVertical = 'CENTER';
  try { titleText.lineHeight = { value: kind === 'tag' ? 22 : 18, unit: 'PIXELS' }; } catch (_) {}
  try { titleText.textAutoResize = 'HEIGHT'; } catch (_) {}
  titleText.textTruncation = 'ENDING';
  titleText.maxLines = kind === 'tag' ? 1 : 3;
}

/**
 * Screen 노드의 내부 고정/비가변 요소(Status 뱃지, Figma Link 아이콘 등)가
 * 노드 박스 밖으로 탈출하거나 서로 겹치거나 잘리지 않고 정상 배치되기 위한 최소 너비를 계산합니다.
 */
async function calculateMinimumInternalContentWidth(
  status: string | undefined,
  figmaLink: string | undefined
): Promise<number> {
  const hasStatus = Boolean(status && STATUS_CONFIG[status as WorkflowStatus]);
  const hasLink = Boolean(figmaLink && figmaLink.trim());

  if (!hasStatus && !hasLink) {
    return SCREEN_NODE_CONSTRAINTS.MIN_WIDTH;
  }

  let statusBadgeW = 0;
  if (hasStatus) {
    const cfg = STATUS_CONFIG[status as WorkflowStatus];
    const label = (cfg.label || status || '').toUpperCase();
    const statusFont: FontName = { family: 'Inter', style: 'Bold' };
    const labelW = await measureSingleLineTextWidth(label, statusFont, 9);
    statusBadgeW = labelW + 18; // 좌우 패딩 9 + 9 = 18
  }

  if (hasStatus && hasLink) {
    // Link 좌측(16) + Link 폭(16) + 최소 gap(8) + Status 뱃지 폭 + 우측 마진(10)
    return 16 + 16 + 8 + statusBadgeW + 10;
  }

  if (hasStatus) {
    // Status만 존재: Status 좌측 정렬 여백(16) + Status 뱃지 폭 + 우측 마진(10)
    // 카드의 좌측 기본 패딩 16px와 정렬되어 박스 밖 탈출(-44px 버그)을 완벽 차단함
    return 16 + statusBadgeW + 10;
  }

  // Link만 존재: Link 좌측(16) + Link 폭(16) + 우측 패딩(16)
  return 16 + 16 + 16;
}

/**
 * Screen 노드의 Fit Contents 모드에 필요한 자동 너비를 정밀하게 계산합니다.
 * 
 * 최종 공식:
 * Fit Width = clampScreenWidth(max(
 *   MIN_WIDTH (49),
 *   Title 1줄을 수용하는 최소 Width (Title 실측 1줄폭 + 좌우 패딩 32px),
 *   내부 고정 요소들이 정상 배치되는 최소 Width (Status, Link가 겹치거나 밖으로 나가지 않는 최소 크기)
 * ))
 * 
 * Description은 Width 결정 기준이 아니며, 확정된 너비 안에서 wrapping되어 Height에만 반영됩니다.
 */
async function calculateScreenFitWidth(
  card: FrameNode,
  title: string,
  status: string | undefined,
  figmaLink: string | undefined
): Promise<number> {
  const pl = typeof card.paddingLeft === 'number' ? card.paddingLeft : 16;
  const pr = typeof card.paddingRight === 'number' ? card.paddingRight : 16;
  const strokeOffset = (typeof card.strokeWeight === 'number' ? card.strokeWeight : 1.5) * 2;

  // 1. Title 측정 (Inter Bold 13px, 줄바꿈 없는 1줄 폭)
  const rawTitle = title || '';
  const trimmedTitle = rawTitle.trim();
  let measuredTitleW = 0;
  if (trimmedTitle) {
    const titleFont: FontName = { family: 'Inter', style: 'Bold' };
    measuredTitleW = await measureSingleLineTextWidth(trimmedTitle, titleFont, 13);
  }
  // 앞뒤 스페이스도 카드 폭에 반영한다. 타이핑 중 characters에는 스페이스가 살아있는데
  // 측정만 trim 기준이면 스페이스 키에서 카드가 안 늘고 다음 글자에서야 따라와 두 줄↔한 줄 진동이 된다.
  const leadingSpaces = (rawTitle.match(/^[ \u00A0]+/) || [''])[0].length;
  const trailingSpaces = (rawTitle.match(/[ \u00A0]+$/) || [''])[0].length;
  const edgeSpaceCount = rawTitle ? leadingSpaces + trailingSpaces : 0;
  const edgeSpaceW = edgeSpaceCount > 0 ? (await measureSpaceAdvance()) * edgeSpaceCount : 0;
  // Title 1줄 실측 폭 + 앞뒤 스페이스 폭 + 좌우 패딩(32px) + 스트로크 보더 오프셋(약 3px) + 단어 래핑 방지 호흡 여유(8px)
  const titleRequiredW = measuredTitleW > 0 || edgeSpaceW > 0
    ? measuredTitleW + edgeSpaceW + pl + pr + Math.ceil(strokeOffset) + 8
    : SCREEN_NODE_CONSTRAINTS.MIN_WIDTH;

  // 2. 내부 고정/비가변 요소(Status, Link)가 겹치거나 밖으로 나가지 않기 위한 최소 너비
  const internalRequiredW = await calculateMinimumInternalContentWidth(status, figmaLink);

  // 3. 최종 Fit Width = max(49, titleRequiredW, internalRequiredW)
  const fitW = Math.max(SCREEN_NODE_CONSTRAINTS.MIN_WIDTH, titleRequiredW, internalRequiredW);

  return clampScreenWidth(fitW);
}

// 텍스트 노드의 현재 폰트를 안전하게 사전 로드하는 헬퍼
async function ensureTextNodeFontsLoaded(textNode: TextNode | TextSublayerNode) {
  if (!textNode) return;
  try {
    const len = textNode.characters.length;
    if (len > 0) {
      const fontNames = textNode.getRangeAllFontNames(0, len);
      for (const fn of fontNames) {
        await figma.loadFontAsync(fn);
      }
    } else {
      if ('fontName' in textNode && textNode.fontName !== figma.mixed) {
        await figma.loadFontAsync(textNode.fontName as FontName);
      } else {
        await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
      }
    }
  } catch (e) {
    try {
      await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
      await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
    } catch (_) {}
  }
}

// 설명 텍스트 말줄임(...) 처리 함수
// 디스크립션 박스는 기본적으로 auto(maxLines = null, textAutoResize = 'HEIGHT')로 동작합니다.
// 1. Hug contents 모드이거나,
// 2. Fixed height 모드이더라도 카드 높이가 텍스트 전체를 담을 수 있을 만큼 충분한 경우 (currentHeight >= hugH - 4)
//    -> maxLines = null로 유지하여 어떠한 말줄임(...)도 생기지 않습니다.
// 3. 오직 카드가 작아서 텍스트가 카드 바깥으로 실제로 넘칠 때에만 가용 높이에 맞추어 maxLines(...)를 적용합니다.
async function updateDescTextTruncation(card: FrameNode, descText: TextNode, currentHeight: number, textCharacters?: string, targetWidth?: number) {
  try {
    // 디스크립션 고정 라인하이트 15px 수렴 (1회성: 이미 15px이면 쓰기 없음)
    try {
      const truncLh = descText.lineHeight as { unit?: string; value?: number } | string | undefined;
      if (
        typeof truncLh !== 'object' ||
        truncLh === null ||
        (truncLh as { unit?: string }).unit !== 'PIXELS' ||
        Math.round((truncLh as { value?: number }).value || 0) !== DESC_LINE_HEIGHT
      ) {
        descText.lineHeight = { value: DESC_LINE_HEIGHT, unit: 'PIXELS' };
      }
    } catch (_) {}
    const descFont: FontName = { family: 'Inter', style: 'Regular' };
    await figma.loadFontAsync(descFont);
    await ensureTextNodeFontsLoaded(descText);

    // 폰트 패밀리 Inter, 스타일 Regular, 폰트 크기 11px 고정
    const len = descText.characters.length;
    if (len > 0) {
      try {
        descText.setRangeFontName(0, len, descFont);
      } catch (_) {
        try { descText.fontName = descFont; } catch (_) {}
      }
      try {
        descText.setRangeFontSize(0, len, 11);
      } catch (_) {
        try { descText.fontSize = 11; } catch (_) {}
      }
    } else {
      try { descText.fontName = descFont; } catch (_) {}
      try { descText.fontSize = 11; } catch (_) {}
    }

    descText.textAlignHorizontal = 'LEFT';
    if (descText.layoutAlign !== 'STRETCH') {
      descText.layoutAlign = 'STRETCH';
    }
    if (descText.textAutoResize !== 'HEIGHT') {
      descText.textAutoResize = 'HEIGHT';
    }

    const pl = typeof card.paddingLeft === 'number' ? card.paddingLeft : 16;
    const pr = typeof card.paddingRight === 'number' ? card.paddingRight : 16;
    const strokeOffset = (typeof card.strokeWeight === 'number' ? card.strokeWeight : 0) * 2;
    const effectiveCardW = typeof targetWidth === 'number' && targetWidth > 0 ? targetWidth : card.width;
    const availW = Math.max(10, effectiveCardW - pl - pr - strokeOffset);
    if (Math.abs(descText.width - availW) > 1) {
      try { descText.resize(availW, descText.height); } catch (_) {}
    }

    // Fit/Hug 모드 판별: pluginData의 size_mode를 우선 사용 (primaryAxisSizingMode는 min/max 잠금으로 인해 FIXED일 수 있음)
    const sMode = (safeGetPluginData(card, 'size_mode') || safeGetPluginData(card, 'screen_size_mode') || '').toLowerCase();
    const isFitOrHug = sMode === 'fit' || sMode === 'hug' || card.primaryAxisSizingMode === 'AUTO';

    if (isFitOrHug) {
      // Fit/Hug: 전체 텍스트 표시 — lockTextFontSizeAndAutoResize의 DISABLED 정책과 일치시켜 깜박임 방지
      if (descText.textTruncation !== 'DISABLED') {
        descText.textTruncation = 'DISABLED';
      }
      if (descText.maxLines !== null) {
        descText.maxLines = null;
      }
      return;
    }

    // Fixed 모드: 기존 ENDING + maxLines 동작 유지
    if (descText.textTruncation !== 'ENDING') {
      descText.textTruncation = 'ENDING';
    }

    const hugH = calculateCardHugHeight(card, textCharacters);
    // 카드 높이가 텍스트 전체를 담을 수 있는 크기(Hug 높이) 이상이거나 여유가 있으면 말줄임 불필요 (기본 Auto 유지)
    if (currentHeight >= hugH - 4) {
      descText.maxLines = null;
      return;
    }

    // 박스 높이를 실제로 벗어나는 경우에만 가용 줄수 계산하여 말줄임
    const statusBadge = card.children.find(
      (c) => safeGetPluginData(c, 'is_status_badge') === 'true' || c.name === 'StatusBadge'
    );
    const pb = statusBadge ? 36 : 16;
    const headerRow = card.children.find(isHeaderFrame) as FrameNode | undefined;
    const headerH = headerRow ? headerRow.height : 20;

    const availableH = Math.max(14, currentHeight - 14 - pb - 8 - Math.round(headerH));
    // 디스크립션 고정 라인하이트(DESC_LINE_HEIGHT) 기준 가용 줄수 계산
    descText.maxLines = Math.max(1, Math.floor(availableH / DESC_LINE_HEIGHT));
  } catch (err) {
    console.warn('updateDescTextTruncation failed:', err);
  }
}

// ----------------------------------------------------
// 노드 2D 공간 배치 기반 중심 좌표 및 좌상단 좌표 추출
// ----------------------------------------------------
function getNodeCenter(node: SceneNode): { x: number; y: number } {
  if ('absoluteBoundingBox' in node && node.absoluteBoundingBox) {
    return {
      x: node.absoluteBoundingBox.x + node.absoluteBoundingBox.width / 2,
      y: node.absoluteBoundingBox.y + node.absoluteBoundingBox.height / 2,
    };
  }
  const x = 'x' in node ? (node as any).x : 0;
  const y = 'y' in node ? (node as any).y : 0;
  const w = 'width' in node ? (node as any).width : 0;
  const h = 'height' in node ? (node as any).height : 0;
  return { x: x + w / 2, y: y + h / 2 };
}

function getNodeTopLeft(node: SceneNode): { x: number; y: number } {
  if ('absoluteBoundingBox' in node && node.absoluteBoundingBox) {
    return {
      x: node.absoluteBoundingBox.x,
      y: node.absoluteBoundingBox.y,
    };
  }
  const x = 'x' in node ? (node as any).x : 0;
  const y = 'y' in node ? (node as any).y : 0;
  return { x, y };
}

// ----------------------------------------------------
// 복수 노드 선택 시 상대적으로 위쪽 혹은 왼쪽에 위치한 노드를 우선 정렬
// (가로 흐름: 왼쪽 노드 우선 / 세로 흐름: 위쪽 노드 우선)
// ----------------------------------------------------
function sortNodesBySpatialPosition(nodes: SceneNode[]): SceneNode[] {
  if (nodes.length <= 1) return nodes;

  const centers = new Map<string, { x: number; y: number }>();
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    const center = getNodeCenter(node);
    centers.set(node.id, center);
    if (center.x < minX) minX = center.x;
    if (center.x > maxX) maxX = center.x;
    if (center.y < minY) minY = center.y;
    if (center.y > maxY) maxY = center.y;
  }

  const spanX = maxX - minX;
  const spanY = maxY - minY;

  return [...nodes].sort((a, b) => {
    const posA = centers.get(a.id) || { x: 0, y: 0 };
    const posB = centers.get(b.id) || { x: 0, y: 0 };

    if (spanX >= spanY) {
      // 주로 가로(수평) 흐름: 상대적으로 왼쪽(x 작음) 우선, 같으면 위쪽(y 작음) 우선
      if (Math.abs(posA.x - posB.x) > 1) {
        return posA.x - posB.x;
      }
      return posA.y - posB.y;
    } else {
      // 주로 세로(수직) 흐름: 상대적으로 위쪽(y 작음) 우선, 같으면 왼쪽(x 작음) 우선
      if (Math.abs(posA.y - posB.y) > 1) {
        return posA.y - posB.y;
      }
      return posA.x - posB.x;
    }
  });
}

// 선택된 노드들 사이의 기존 커넥터 Pair Key Set 수집 (findAll 1회 수행)
function buildPairKeySet(nodeIds: string[]): Set<string> {
  const nodeIdSet = new Set(nodeIds);
  const pairKeys = new Set<string>();
  if (nodeIdSet.size < 2) return pairKeys;

  const connectors = figma.currentPage.findAll((n) => {
    try {
      if (!n) return false;
      if (n.type === 'GROUP' || n.type === 'VECTOR') {
        const isCustom = safeGetPluginData(n, 'is_custom_connector') === 'true' || safeGetPluginData(n, 'is_flow_connector') === 'true';
        if (!isCustom) return false;
        if (safeGetPluginData(n, 'is_connector_label') === 'true' || n.name === 'ConnectorLabel') return false;

        let sId = safeGetPluginData(n, 'source_node_id');
        let tId = safeGetPluginData(n, 'target_node_id');
        if ((!sId || !tId) && n.type === 'GROUP') {
          const vChild = (n as GroupNode).findOne((child) => child.type === 'VECTOR');
          if (vChild) {
            sId = sId || safeGetPluginData(vChild, 'source_node_id');
            tId = tId || safeGetPluginData(vChild, 'target_node_id');
          }
        }
        return Boolean(sId && tId && nodeIdSet.has(sId) && nodeIdSet.has(tId) && sId !== tId);
      }
      return false;
    } catch (_) {
      return false;
    }
  });

  for (const rawConn of connectors) {
    let sId: string | undefined;
    let tId: string | undefined;

    sId = safeGetPluginData(rawConn, 'source_node_id');
    tId = safeGetPluginData(rawConn, 'target_node_id');
    if ((!sId || !tId) && rawConn.type === 'GROUP') {
      const vChild = (rawConn as GroupNode).findOne((child) => child.type === 'VECTOR');
      if (vChild) {
        sId = sId || safeGetPluginData(vChild, 'source_node_id');
        tId = tId || safeGetPluginData(vChild, 'target_node_id');
      }
    }

    if (sId && tId && nodeIdSet.has(sId) && nodeIdSet.has(tId) && sId !== tId) {
      pairKeys.add(makePairKey(sId, tId));
    }
  }

  return pairKeys;
}

// 선택 영역 변경 감지 시 UI 갱신 (바탕화면 클릭 ➔ 빈 폼 / 노드 클릭 ➔ 상세 수정 폼)
/**
 * Startup 중복 스캔 coalesce 상태 (TOP 2).
 * - 모듈-init `handleSelectionChange()`와 INIT 수신 `handleSelectionChange()`가
 *   back-to-back으로 같은 page-wide scan을 반복하는 것만 막는다.
 * - 일반 selectionchange / 생성 / 수정 / documentchange 경로의 handleSelectionChange는
 *   이 가드를 거치지 않고 그대로 실행된다.
 * - selection 최신값 보존: startupSyncDone 전에 selection이 바뀌면 skip하지 않고 실행한다.
 */
let startupSelectionSyncDone = false;
let startupSelectionSnapshot: string | null = null;

function captureSelectionSnapshot(): string {
  try {
    return figma.currentPage.selection.map((n) => n.id).sort().join(',');
  } catch (_) {
    return '';
  }
}

/** Startup 1회차 실행 직후 스냅샷 기록 (INIT 중복 실행 판정용). */
function markStartupSelectionSynced(): void {
  startupSelectionSyncDone = true;
  startupSelectionSnapshot = captureSelectionSnapshot();
}

/**
 * INIT 수신 시 startup 중복 실행 여부 판정.
 * - startup 1회차가 아직 끝나지 않았거나, 그 사이 selection이 바뀌었으면 실행한다.
 * - 같은 selection에 대한 2회차 반복일 때만 true(skip)를 반환한다.
 */
function shouldSkipInitSelectionSync(): boolean {
  if (!startupSelectionSyncDone) return false;
  return captureSelectionSnapshot() === startupSelectionSnapshot;
}
/** 기즈모 카드에 보여줄 엔드포인트 타입. 플로우 노드가 아니면 Figma object. */
function gizmoEndpointTypeLabel(node: SceneNode | null): string {
  if (!node) return '';
  const isFlow =
    safeGetPluginData(node, 'is_flow_node') === 'true' ||
    Boolean(safeGetPluginData(node, 'node_type'));
  if (!isFlow) return 'Figma object';
  const flowType = normalizeNodeType(safeGetPluginData(node, 'node_type') || 'Screen');
  if (flowType === 'Branch') {
    return BRANCH_VARIANT_LABELS[normalizeBranchVariant(safeGetPluginData(node, 'branch_variant'))];
  }
  return flowType;
}

async function handleSelectionChange() {
  slog('10 handleSelectionChange:start');
  slog('11 loadRequiredFonts:start');
  await loadRequiredFonts();
  slog('12 loadRequiredFonts:done');
  const rawSelection = figma.currentPage.selection;
  slog(`13 selection:resolved count=${rawSelection.length}`);

  // 1. 커넥터 및 플로우 노드 정확 매핑 (자식/선/라벨 클릭 시에도 정확한 최상위 엔티티로 매핑)
  const resolvedNodesMap = new Map<string, SceneNode>();
  for (const node of rawSelection) {
    const connNode = findConnectorNode(node);
    if (connNode) {
      resolvedNodesMap.set(connNode.id, connNode);
      continue;
    }

    const flowParent = findFlowNode(node);
    if (flowParent) {
      resolvedNodesMap.set(flowParent.id, flowParent);
    } else {
      resolvedNodesMap.set(node.id, node);
    }
  }

  const allResolvedNodes = Array.from(resolvedNodesMap.values());

  // 2. 카테고리별 엄격 분리:
  // - connNodes: 커넥터 노드
  // - flowNodes: UI 플로우 노드 (is_flow_node === 'true')
  // - otherObjects: 그 외 일반 객체 (피그잼 스티키 노트, 기본 도형, 일반 프레임/텍스트 등)
  const connNodes = allResolvedNodes.filter((n) => Boolean(findConnectorNode(n)));
  const nonConnNodes = allResolvedNodes.filter((n) => !findConnectorNode(n));
  const flowNodes = nonConnNodes.filter((n) => {
    return (
      safeGetPluginData(n, 'is_flow_node') === 'true' ||
      Boolean(safeGetPluginData(n, 'node_type'))
    );
  });
  const otherObjects = nonConnNodes.filter((n) => !flowNodes.includes(n));

  const flowNodeCount = flowNodes.length;
  const otherObjectCount = otherObjects.length;
  const connectorCount = connNodes.length;

  // UI 편집 대상 노드 결정:
  // - 플로우 노드와 일반 객체가 함께 있으면 둘 다 전달 (Connection 전용, Node/Appearance는 UI에서 비활성)
  // - 플로우 노드만 있으면 플로우 노드만 전달하여 일반 객체의 속성 오염/훼손 방지
  // - 플로우 노드가 전혀 없고 커넥터만 있으면 커넥터 전달
  // - 플로우 노드와 커넥터가 없고 일반 객체만 있으면 일반 객체 전달
  let uniqueNodes: SceneNode[] = [];
  if (flowNodeCount > 0 && otherObjectCount > 0 && connectorCount === 0) {
    uniqueNodes = [...flowNodes, ...otherObjects];
  } else if (flowNodeCount > 0) {
    uniqueNodes = flowNodes;
  } else if (connectorCount > 0 && otherObjectCount === 0) {
    uniqueNodes = connNodes;
  } else {
    uniqueNodes = otherObjects;
  }

  // 복수 노드 선택 시: 2개 노드는 기존 가로/세로 우선 정렬, 3개 이상은 행 묶음 기반 순차 체인 정렬
  if (uniqueNodes.length === 2) {
    uniqueNodes = sortNodesBySpatialPosition(uniqueNodes);
  } else if (uniqueNodes.length >= 3) {
    uniqueNodes = orderNodesForChain(uniqueNodes);
  }

  // 커넥터 선택 시 연결된 엔드포인트 노드들을 캔버스 2D 공간 배치(위/왼쪽 우선)로 정렬하여 수집
  let multiConnectorSortedNodeNames: string[] = [];
  let multiConnectorSortedNodeTypes: string[] = [];
  if (connectorCount > 0 && flowNodeCount === 0) {
    const endpointNodeMap = new Map<string, SceneNode>();
    for (const c of connNodes) {
      const srcId = safeGetPluginData(c, 'source_node_id');
      const tgtId = safeGetPluginData(c, 'target_node_id');
      if (srcId) {
        const srcNode = figma.getNodeById(srcId) as SceneNode | null;
        if (srcNode) endpointNodeMap.set(srcNode.id, srcNode);
      }
      if (tgtId) {
        const tgtNode = figma.getNodeById(tgtId) as SceneNode | null;
        if (tgtNode) endpointNodeMap.set(tgtNode.id, tgtNode);
      }
    }
    const endpointNodes = Array.from(endpointNodeMap.values());
    if (endpointNodes.length > 0) {
      const sortedEndpoints = sortNodesBySpatialPosition(endpointNodes);
      multiConnectorSortedNodeNames = sortedEndpoints.map((n) => n.name);
      multiConnectorSortedNodeTypes = sortedEndpoints.map((n) => gizmoEndpointTypeLabel(n));
    }
  }

  const nodes: SelectedNodeInfo[] = await Promise.all(uniqueNodes.map(async (node) => {
    const isFlowNode =
      safeGetPluginData(node, 'is_flow_node') === 'true' ||
      Boolean(safeGetPluginData(node, 'node_type'));



    let title = '';
    let description = '';
    let tag = safeGetPluginData(node, 'node_tag') || '';
    let connectorLabel: string | undefined;
    let connectorLabelOn: boolean | undefined;
    let connectorLabelBoxStyle: ConnectorLabelBoxStyle | undefined;
    let connectorLabelAlign: ConnectorLabelAlign | undefined;
    let connectorLabelFillColor: string | undefined;
    let connectorLabelStrokeColor: string | undefined;
    let connectorLineType: 'ELBOWED' | 'STRAIGHT' | 'CURVED' | undefined;
    let connectorColorHex: string | undefined;
    let connectorStrokeWeight: number | undefined;
    let connectorStrokePattern: ConnectorStrokePattern | undefined;
    let connectorRoutingType: ConnectorRoutingType | undefined;
    let connectorStartTerminal: ConnectorTerminalType | undefined;
    let connectorEndTerminal: ConnectorTerminalType | undefined;
    let connectorStartOffset: number = 0;
    let connectorEndOffset: number = 0;

    let connectorSourceNodeName: string | undefined;
    let connectorTargetNodeName: string | undefined;
    let connectorSourceNodeType: string | undefined;
    let connectorTargetNodeType: string | undefined;
    let connectorSourceMagnet: MagnetPosition | undefined;
    let connectorTargetMagnet: MagnetPosition | undefined;
    let connectorIsReversed = false;

    const isCustomConnector =
      node.getPluginData('is_custom_connector') === 'true' ||
      node.getPluginData('is_flow_connector') === 'true';
    const isConnector = isCustomConnector;

    if (isConnector) {
        // 커스텀 벡터 직각 커넥터 (그룹 또는 벡터 노드)
        connectorLabel = node.getPluginData('connector_label') || '';
        const rawCustomLabelOn = node.getPluginData('connector_label_on');
        connectorLabelOn = rawCustomLabelOn !== '' ? rawCustomLabelOn === 'true' : Boolean(connectorLabel);
        connectorLabelBoxStyle = (node.getPluginData('connector_label_box_style') as ConnectorLabelBoxStyle) || 'BOX';
        connectorLabelAlign = (node.getPluginData('connector_label_align') as ConnectorLabelAlign) || 'CENTER';
        connectorLineType = 'ELBOWED';
        connectorRoutingType = (node.getPluginData('connector_routing') as ConnectorRoutingType) || 'ORTHOGONAL';
        connectorColorHex = node.getPluginData('connector_color');
        const labelColorFallback = connectorColorHex || '#000000';
        connectorLabelFillColor = node.getPluginData('connector_label_fill_color') || '#FFFFFF';
        connectorLabelStrokeColor = node.getPluginData('connector_label_stroke_color') || labelColorFallback;
        const savedWeight = node.getPluginData('connector_weight');
        connectorStrokeWeight = savedWeight ? parseFloat(savedWeight) : undefined;
        connectorStrokePattern = (node.getPluginData('connector_pattern') as ConnectorStrokePattern) || 'SOLID';
        connectorStartTerminal = normalizeConnectorTerminal(node.getPluginData('start_terminal'), 'NONE');
        connectorEndTerminal = normalizeConnectorTerminal(node.getPluginData('end_terminal'), 'ARROW');
        const rawStartOff = node.getPluginData('start_offset');
        const rawEndOff = node.getPluginData('end_offset');
        connectorStartOffset = rawStartOff ? parseFloat(rawStartOff) : 0;
        connectorEndOffset = rawEndOff ? parseFloat(rawEndOff) : 0;

        // 연결된 소스 및 타깃 노드 정보 및 마그넷 위치 추출
        const srcId = node.getPluginData('source_node_id');
        const tgtId = node.getPluginData('target_node_id');
        let sourceEndpointNode: SceneNode | null = null;
        let targetEndpointNode: SceneNode | null = null;
        if (srcId) {
          sourceEndpointNode = figma.getNodeById(srcId) as SceneNode | null;
          if (sourceEndpointNode) {
            connectorSourceNodeName = sourceEndpointNode.name;
            connectorSourceNodeType = gizmoEndpointTypeLabel(sourceEndpointNode);
          }
        }
        if (tgtId) {
          targetEndpointNode = figma.getNodeById(tgtId) as SceneNode | null;
          if (targetEndpointNode) {
            connectorTargetNodeName = targetEndpointNode.name;
            connectorTargetNodeType = gizmoEndpointTypeLabel(targetEndpointNode);
          }
        }
        connectorSourceMagnet = (node.getPluginData('source_magnet') as MagnetPosition) || 'RIGHT';
        connectorTargetMagnet = (node.getPluginData('target_magnet') as MagnetPosition) || 'LEFT';

        let vectorChild: VectorNode | null = null;
        if (node.type === 'VECTOR') {
          vectorChild = node as VectorNode;
        } else if ('findOne' in node) {
          vectorChild = (node as GroupNode).findOne((n) => n.type === 'VECTOR') as VectorNode | null;
        }

        if (vectorChild) {
          if (!connectorColorHex && Array.isArray(vectorChild.strokes) && vectorChild.strokes.length > 0) {
            const first = vectorChild.strokes[0];
            if (first.type === 'SOLID') connectorColorHex = rgbToHexColor(first.color);
          }
          if (connectorStrokeWeight === undefined && typeof vectorChild.strokeWeight === 'number') {
            connectorStrokeWeight = vectorChild.strokeWeight;
          }
          if (!connectorSourceMagnet) {
            connectorSourceMagnet = (vectorChild.getPluginData('source_magnet') as MagnetPosition) || 'RIGHT';
          }
          if (!connectorTargetMagnet) {
            connectorTargetMagnet = (vectorChild.getPluginData('target_magnet') as MagnetPosition) || 'LEFT';
          }
          if (connectorStartOffset === 0 && vectorChild.getPluginData('start_offset')) {
            connectorStartOffset = parseFloat(vectorChild.getPluginData('start_offset')) || 0;
          }
          if (connectorEndOffset === 0 && vectorChild.getPluginData('end_offset')) {
            connectorEndOffset = parseFloat(vectorChild.getPluginData('end_offset')) || 0;
          }
        }

        // 연결된 두 노드의 캔버스 상 위치를 비교하여 상대적으로 위/왼쪽 노드가 기즈모 왼쪽(우선)에 오도록 정렬
        if (sourceEndpointNode && targetEndpointNode) {
          const sorted = sortNodesBySpatialPosition([sourceEndpointNode, targetEndpointNode]);
          if (sorted[0].id === targetEndpointNode.id) {
            connectorIsReversed = true;
            connectorSourceNodeName = targetEndpointNode.name;
            connectorTargetNodeName = sourceEndpointNode.name;
            connectorSourceNodeType = gizmoEndpointTypeLabel(targetEndpointNode);
            connectorTargetNodeType = gizmoEndpointTypeLabel(sourceEndpointNode);

            const tempMagnet = connectorSourceMagnet;
            connectorSourceMagnet = connectorTargetMagnet;
            connectorTargetMagnet = tempMagnet;

            const tempTerm = connectorStartTerminal;
            connectorStartTerminal = connectorEndTerminal;
            connectorEndTerminal = tempTerm;

            const tempOffset = connectorStartOffset;
            connectorStartOffset = connectorEndOffset;
            connectorEndOffset = tempOffset;
          }
        }
      title = 'Connector';
    } else {
      // 플로우 노드: 실제 FigJam 자식 텍스트 객체로부터 최신 텍스트 추출 (Source of Truth)
      const extracted = extractNodeText(node);
      title = extracted.title;
      description = extracted.description;
    }

    const savedType = node.getPluginData('node_type') as DiagramNodeType;
    const flowNodeType: DiagramNodeType | undefined = isFlowNode ? (savedType || 'Screen') : undefined;
    const savedStatus = isFlowNode ? (node.getPluginData('workflow_status') as WorkflowStatus) : undefined;

    let sizeMode: 'fixed' | 'hug' | 'fit' = 'fixed';
    let hugHeight = Math.round(node.height);

    if (isFlowNode && node.type === 'FRAME') {
      const frame = node as FrameNode;
      const isAutoPrimary = frame.primaryAxisSizingMode === 'AUTO';
      const isAutoCounter = frame.counterAxisSizingMode === 'AUTO';
      const savedSizeMode = frame.getPluginData('size_mode');

      // resize()가 primaryAxisSizingMode를 FIXED로 되돌릴 수 있으므로 pluginData를 우선한다
      if (savedSizeMode === 'fit' || (isAutoPrimary && isAutoCounter)) {
        sizeMode = 'fit';
      } else if (savedSizeMode === 'hug' || isAutoPrimary) {
        sizeMode = 'hug';
      } else {
        sizeMode = 'fixed';
      }

      // Hug contents 높이: status 유무(패딩 36px vs 16px)를 항상 정확하게 반영하여 순수 Read-Only로 실시간 산출
      hugHeight = calculateCardReadOnlyHugHeight(frame);
    }

    let nodeFillColor: string | undefined;
    let nodeStrokeColor: string | undefined;
    let nodeStrokeWeight: number | undefined;

    if (isFlowNode && node.type === 'FRAME') {
      const frame = node as FrameNode;
      const shapeVector = frame.children.find(
        (c) => (c.name === 'ShapeVector' || c.name === 'DiamondShape') && c.type === 'VECTOR'
      ) as VectorNode | undefined;
      if (shapeVector) {
        if (Array.isArray(shapeVector.fills) && shapeVector.fills.length > 0 && shapeVector.fills[0].type === 'SOLID') {
          nodeFillColor = rgbToHexColor(shapeVector.fills[0].color);
        }
        if (Array.isArray(shapeVector.strokes) && shapeVector.strokes.length > 0 && shapeVector.strokes[0].type === 'SOLID') {
          nodeStrokeColor = rgbToHexColor(shapeVector.strokes[0].color);
        }
        if (typeof shapeVector.strokeWeight === 'number') {
          nodeStrokeWeight = shapeVector.strokeWeight;
        }
      }
    }

    if (!nodeFillColor && 'fills' in node && Array.isArray(node.fills)) {
      if (node.fills.length === 0) {
        nodeFillColor = 'None';
      } else {
        const firstFill = node.fills[0];
        if (firstFill.type === 'SOLID') {
          nodeFillColor = rgbToHexColor(firstFill.color);
        }
      }
    }
    if (!nodeStrokeColor && 'strokes' in node && Array.isArray(node.strokes) && node.strokes.length > 0) {
      const firstStroke = node.strokes[0];
      if (firstStroke.type === 'SOLID') {
        nodeStrokeColor = rgbToHexColor(firstStroke.color);
      }
    }
    if (nodeStrokeWeight === undefined && 'strokeWeight' in node && typeof (node as any).strokeWeight === 'number') {
      nodeStrokeWeight = (node as any).strokeWeight;
    }
    if (isConnector && typeof connectorStrokeWeight === 'number') {
      nodeStrokeWeight = connectorStrokeWeight;
    }
    let cornerRadius = 0;
    if ('cornerRadius' in node && typeof (node as any).cornerRadius === 'number') {
      cornerRadius = Math.round((node as any).cornerRadius);
    }
    if (isFlowNode && flowNodeType) {
      const nSpec = NODE_TYPE_SHAPE_SPECS[flowNodeType];
      if (nSpec && typeof nSpec.cornerRadius === 'number' && nSpec.cornerRadius > 0 && cornerRadius === 0) {
        cornerRadius = nSpec.cornerRadius;
      }
    }



    const pos = getNodeTopLeft(node);

    let isDescriptionOn = false;
    if (isFlowNode && flowNodeType === 'Screen' && node.type === 'FRAME') {
      const frameNode = node as FrameNode;
      const descChild = frameNode.children.find(
        (c) => c.type === 'TEXT' && (c.name === 'DescText' || safeGetPluginData(c, 'node_role') === 'desc')
      );
      isDescriptionOn = Boolean(descChild) || safeGetPluginData(node, 'description_on') === 'true';
    }

    return {
      id: node.id,
      name: node.name,
      isFlowNode,
      isConnector,
      nodeType: node.type,
      flowNodeType,
      branchVariant: flowNodeType === 'Branch'
        ? normalizeBranchVariant(node.getPluginData('branch_variant'))
        : undefined,
      status: savedStatus || undefined,
      title,
      description,
      descriptionOn: isDescriptionOn,
      tag,
      theme: (node.getPluginData('node_theme') as 'light' | 'dark') || 'light',
      figmaLink: node.getPluginData('figma_link'),
      cachedFigmaLink: node.getPluginData('cached_figma_link') || node.getPluginData('figma_link') || undefined,
      connectorLabel,
      connectorLabelOn,
      connectorLabelBoxStyle,
      connectorLabelAlign,
      connectorLabelFillColor,
      connectorLabelStrokeColor,
      connectorLineType,
      connectorColorHex,
      connectorStrokeWeight,
      connectorStrokePattern,
      connectorRoutingType,
      connectorStartTerminal,
      connectorEndTerminal,
      connectorStartOffset,
      connectorEndOffset,
      connectorSourceNodeName,
      connectorTargetNodeName,
      connectorSourceNodeType,
      connectorTargetNodeType,
      connectorSourceMagnet,
      connectorTargetMagnet,
      connectorIsReversed,
      connectedNodeNames: multiConnectorSortedNodeNames.length > 0 ? multiConnectorSortedNodeNames : undefined,
      connectedNodeTypes: multiConnectorSortedNodeTypes.length > 0 ? multiConnectorSortedNodeTypes : undefined,
      width: Math.round(node.width),
      height: Math.round(node.height),
      cornerRadius,
      hugHeight,
      sizeMode,
      stepNumber: node.getPluginData('step_number') ? parseInt(node.getPluginData('step_number'), 10) : undefined,
      badgeCorner: node.getPluginData('badge_corner') || undefined,
      badgeShape: node.getPluginData('badge_shape') || undefined,
      badgeColorMode: (node.getPluginData('badge_color_mode') as 'White' | 'Black' | 'Style') || undefined,
      elevationOn: node.getPluginData('node_elevation') !== '',
      elevation: node.getPluginData('node_elevation') !== '' ? parseInt(node.getPluginData('node_elevation'), 10) : undefined,
      fillColorHex: nodeFillColor,
      strokeColorHex: nodeStrokeColor,
      strokeWeight: nodeStrokeWeight,
      x: Math.round(pos.x),
      y: Math.round(pos.y),
    };
  }));

  let currentStatus: WorkflowStatus | undefined;
  if (uniqueNodes.length === 1) {
    const saved = uniqueNodes[0].getPluginData('workflow_status') as WorkflowStatus;
    if (saved) currentStatus = saved;
  }

  // 에디터 기즈모 추천 마그넷(연결 포인트) 산출
  let suggestedSourceMagnet: MagnetPosition | undefined;
  let suggestedTargetMagnet: MagnetPosition | undefined;
  let existingSourceMagnets: MagnetPosition[] = [];
  let existingTargetMagnets: MagnetPosition[] = [];
  let connectedConnectorCount = 0;

  if (connectorCount === 1 && nodes.length > 0) {
    // 커넥터 선택 시: 해당 커넥터의 실제 연결 포인트(마그넷)를 기즈모에 연동
    suggestedSourceMagnet = nodes[0].connectorSourceMagnet;
    suggestedTargetMagnet = nodes[0].connectorTargetMagnet;
  } else if (uniqueNodes.length === 2 && connectorCount === 0) {
    // 2개 노드 선택 시: 선택된 두 노드 사이에 이미 연결되어 있는 커넥터 탐색 (기존 2-node 로직 보존)
    const sourceId = uniqueNodes[0].id;
    const targetIds = uniqueNodes.slice(1).map((n) => n.id);

    const foundConnectors = figma.currentPage.findAll((n) => {
      try {
        if (!n) return false;
        if (n.type === 'GROUP' || n.type === 'VECTOR') {
          const isCustom = safeGetPluginData(n, 'is_custom_connector') === 'true' || safeGetPluginData(n, 'is_flow_connector') === 'true';
          if (!isCustom) return false;
          let sId = safeGetPluginData(n, 'source_node_id');
          let tId = safeGetPluginData(n, 'target_node_id');
          if ((!sId || !tId) && n.type === 'GROUP') {
            const vChild = (n as GroupNode).findOne((child) => child.type === 'VECTOR');
            if (vChild) {
              sId = sId || safeGetPluginData(vChild, 'source_node_id');
              tId = tId || safeGetPluginData(vChild, 'target_node_id');
            }
          }
          return (sId === sourceId && targetIds.includes(tId || '')) ||
                 (tId === sourceId && targetIds.includes(sId || ''));
        }
        return false;
      } catch (_) {
        return false;
      }
    });

    // 중복 방지 (커스텀 커넥터의 그룹과 내부 벡터가 동시에 매칭될 수 있으므로 고유 루트 커넥터로 집계)
    const uniqueConnectorsMap = new Map<string, SceneNode>();
    for (const rawConn of foundConnectors) {
      const topConn = findConnectorNode(rawConn) || (rawConn as SceneNode);
      if (topConn) {
        uniqueConnectorsMap.set(topConn.id, topConn);
      }
    }

    connectedConnectorCount = uniqueConnectorsMap.size;
    const connectedConnectorIds = Array.from(uniqueConnectorsMap.keys());

    const connectedConnectors: ConnectedConnectorDetail[] = [];

    if (connectedConnectorCount > 0) {
      const srcMags: MagnetPosition[] = [];
      const tgtMags: MagnetPosition[] = [];

      for (const c of Array.from(uniqueConnectorsMap.values())) {
        let isForward = true;
        let sMag: MagnetPosition | undefined;
        let tMag: MagnetPosition | undefined;

        let sId = safeGetPluginData(c, 'source_node_id');
          sMag = (safeGetPluginData(c, 'source_magnet') as MagnetPosition) || undefined;
          tMag = (safeGetPluginData(c, 'target_magnet') as MagnetPosition) || undefined;
          if ((!sMag || !tMag) && c.type === 'GROUP') {
            const vChild = (c as GroupNode).findOne((child) => child.type === 'VECTOR');
            if (vChild) {
              sId = sId || safeGetPluginData(vChild, 'source_node_id');
              sMag = sMag || (safeGetPluginData(vChild, 'source_magnet') as MagnetPosition) || undefined;
              tMag = tMag || (safeGetPluginData(vChild, 'target_magnet') as MagnetPosition) || undefined;
            }
          }
          isForward = sId === sourceId;
          if (isForward) {
            if (sMag) srcMags.push(sMag);
            if (tMag) tgtMags.push(tMag);
          } else {
            if (tMag) srcMags.push(tMag);
            if (sMag) tgtMags.push(sMag);
          }

        connectedConnectors.push({
          id: c.id,
          isReversed: !isForward,
          sourceMagnet: sMag,
          targetMagnet: tMag,
        });
      }

      existingSourceMagnets = Array.from(new Set(srcMags));
      existingTargetMagnets = Array.from(new Set(tgtMags));

      if (existingSourceMagnets.length === 1) {
        suggestedSourceMagnet = existingSourceMagnets[0];
      }
      if (existingTargetMagnets.length === 1) {
        suggestedTargetMagnet = existingTargetMagnets[0];
      }
    }

    postToUI({
      type: 'SELECTION_CHANGED',
      count: flowNodeCount + otherObjectCount + connectorCount,
      nodes,
      currentStatus,
      nextSuggestedTag: getNextFlowTag(),
      flowNodeCount,
      otherObjectCount,
      connectorCount,
      suggestedSourceMagnet,
      suggestedTargetMagnet,
      existingSourceMagnets,
      existingTargetMagnets,
      connectedConnectorCount,
      hasExistingConnection: connectedConnectorCount > 0,
      connectedConnectorIds,
      connectedConnectors,
    });
    slog('14 handleSelectionChange:done branch=2nodes');
    return;
  } else if (uniqueNodes.length >= 3) {
    // 3개 이상 노드 선택 시: 순차 체인 기준 인접 Pair 검사 및 상태 집계
    const orderedNodeIds = uniqueNodes.map((n) => n.id);
    const existingPairKeys = buildPairKeySet(orderedNodeIds);

    let chainTotalPairs = 0;
    let chainConnectedPairs = 0;

    for (let i = 0; i < orderedNodeIds.length - 1; i++) {
      chainTotalPairs++;
      const pKey = makePairKey(orderedNodeIds[i], orderedNodeIds[i + 1]);
      if (existingPairKeys.has(pKey)) {
        chainConnectedPairs++;
      }
    }

    const chainMissingPairs = chainTotalPairs - chainConnectedPairs;
    const hasExistingConnection = chainMissingPairs === 0;

    // 선택된 노드들 사이에 실제로 연결된 커넥터 탐색 (체인 여부 무관, Gizmo 상태용)
    const selectedNodeIdSet = new Set(uniqueNodes.map((n) => n.id));

    const foundConnectors = figma.currentPage.findAll((n) => {
      try {
        if (!n) return false;
        if (n.type === 'GROUP' || n.type === 'VECTOR') {
          const isCustom = safeGetPluginData(n, 'is_custom_connector') === 'true' || safeGetPluginData(n, 'is_flow_connector') === 'true';
          if (!isCustom) return false;
          let sId = safeGetPluginData(n, 'source_node_id');
          let tId = safeGetPluginData(n, 'target_node_id');
          if ((!sId || !tId) && n.type === 'GROUP') {
            const vChild = (n as GroupNode).findOne((child) => child.type === 'VECTOR');
            if (vChild) {
              sId = sId || safeGetPluginData(vChild, 'source_node_id');
              tId = tId || safeGetPluginData(vChild, 'target_node_id');
            }
          }
          return Boolean(sId && tId && selectedNodeIdSet.has(sId) && selectedNodeIdSet.has(tId));
        }
        return false;
      } catch (_) {
        return false;
      }
    });

    const uniqueConnectorsMap = new Map<string, SceneNode>();
    for (const rawConn of foundConnectors) {
      const topConn = findConnectorNode(rawConn) || (rawConn as SceneNode);
      if (topConn) {
        uniqueConnectorsMap.set(topConn.id, topConn);
      }
    }

    const multiNodeConnectors: MultiNodeConnectorDetail[] = [];
    for (const c of Array.from(uniqueConnectorsMap.values())) {
      let sId: string | undefined;
      let tId: string | undefined;
      let sMag: MagnetPosition | undefined;
      let tMag: MagnetPosition | undefined;

      sId = safeGetPluginData(c, 'source_node_id') || undefined;
      tId = safeGetPluginData(c, 'target_node_id') || undefined;
        sMag = (safeGetPluginData(c, 'source_magnet') as MagnetPosition) || undefined;
        tMag = (safeGetPluginData(c, 'target_magnet') as MagnetPosition) || undefined;
        if ((!sMag || !tMag || !sId || !tId) && c.type === 'GROUP') {
          const vChild = (c as GroupNode).findOne((child) => child.type === 'VECTOR');
          if (vChild) {
            sId = sId || safeGetPluginData(vChild, 'source_node_id') || undefined;
            tId = tId || safeGetPluginData(vChild, 'target_node_id') || undefined;
            sMag = sMag || (safeGetPluginData(vChild, 'source_magnet') as MagnetPosition) || undefined;
            tMag = tMag || (safeGetPluginData(vChild, 'target_magnet') as MagnetPosition) || undefined;
          }
        }

      if (sId && tId) {
        multiNodeConnectors.push({
          id: c.id,
          sourceId: sId,
          targetId: tId,
          sourceMagnet: sMag,
          targetMagnet: tMag,
        });
      }
    }

    postToUI({
      type: 'SELECTION_CHANGED',
      count: flowNodeCount + otherObjectCount + connectorCount,
      nodes,
      currentStatus,
      nextSuggestedTag: getNextFlowTag(),
      flowNodeCount,
      otherObjectCount,
      connectorCount,
      suggestedSourceMagnet: undefined,
      suggestedTargetMagnet: undefined,
      existingSourceMagnets: [],
      existingTargetMagnets: [],
      connectedConnectorCount: chainConnectedPairs,
      hasExistingConnection,
      connectedConnectorIds: [],
      connectedConnectors: [],
      orderedNodeIds,
      chainTotalPairs,
      chainConnectedPairs,
      chainMissingPairs,
      multiNodeConnectors,
    });
    slog('14 handleSelectionChange:done branch=3plus');
    return;
  }

  postToUI({
    type: 'SELECTION_CHANGED',
    count: flowNodeCount + otherObjectCount + connectorCount,
    nodes,
    currentStatus,
    nextSuggestedTag: getNextFlowTag(),
    flowNodeCount,
    otherObjectCount,
    connectorCount,
    suggestedSourceMagnet,
    suggestedTargetMagnet,
    existingSourceMagnets,
    existingTargetMagnets,
    connectedConnectorCount,
    hasExistingConnection: false,
    connectedConnectorIds: [],
    connectedConnectors: [],
  });
  slog('14 handleSelectionChange:done branch=default');
}

figma.on('selectionchange', handleSelectionChange);

// ----------------------------------------------------
// 1. 안전한 폰트 로드 및 텍스트 변경 헬퍼
// ----------------------------------------------------
async function safeSetCharacters(textNode: TextNode | TextSublayerNode, newText: string) {
  if (!textNode) return;
  const len = textNode.characters.length;
  try {
    if (len > 0) {
      const fontNames = textNode.getRangeAllFontNames(0, len);
      for (const fn of fontNames) {
        await figma.loadFontAsync(fn);
      }
    } else {
      if ('fontName' in textNode && textNode.fontName !== figma.mixed) {
        await figma.loadFontAsync(textNode.fontName as FontName);
      } else {
        await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
      }
    }
  } catch (e) {
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
    await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
  }
  textNode.characters = newText;
}

// 설명 텍스트용: 폰트 Inter Regular 및 11px 고정, 텍스트 박스 자동 리사이즈 모드 고정 헬퍼
async function lockTextFontSizeAndAutoResize(textNode: TextNode, targetSize: number) {
  try {
    const descFont: FontName = { family: 'Inter', style: 'Regular' };
    await figma.loadFontAsync(descFont);
    await ensureTextNodeFontsLoaded(textNode);

    // 1. 폰트 패밀리 Inter 및 스타일 Regular, 폰트 사이즈(11px) 고정
    const len = textNode.characters.length;
    if (len > 0) {
      let needsFont = true;
      let needsSize = true;
      try {
        const fn = textNode.getRangeFontName(0, 1);
        if (fn !== figma.mixed && fn.family === descFont.family && fn.style === descFont.style) {
          needsFont = false;
        }
      } catch (_) {}
      try {
        const fs = textNode.getRangeFontSize(0, 1);
        if (fs !== figma.mixed && fs === targetSize) {
          needsSize = false;
        }
      } catch (_) {}

      if (needsFont) {
        try {
          textNode.setRangeFontName(0, len, descFont);
        } catch (_) {
          try { textNode.fontName = descFont; } catch (_) {}
        }
      }
      if (needsSize) {
        try {
          textNode.setRangeFontSize(0, len, targetSize);
        } catch (_) {
          try { textNode.fontSize = targetSize; } catch (_) {}
        }
      }
    } else {
      try { textNode.fontName = descFont; } catch (_) {}
      try { textNode.fontSize = targetSize; } catch (_) {}
    }

    if (textNode.textAlignHorizontal !== 'LEFT') {
      textNode.textAlignHorizontal = 'LEFT';
    }

    if (textNode.parent && 'layoutMode' in textNode.parent) {
      const parentFrame = textNode.parent as FrameNode;
      if (parentFrame.layoutMode === 'NONE') {
        const card = (parentFrame.parent && 'layoutMode' in parentFrame.parent) ? (parentFrame.parent as FrameNode) : parentFrame;
        const pl = typeof card.paddingLeft === 'number' ? card.paddingLeft : 16;
        const pr = typeof card.paddingRight === 'number' ? card.paddingRight : 16;
        const strokeOffset = (typeof card.strokeWeight === 'number' ? card.strokeWeight : 0) * 2;
        const availW = Math.max(10, card.width - pl - pr - strokeOffset);
        if (Math.abs(textNode.width - availW) > 1) {
          try { textNode.resize(availW, textNode.height); } catch (_) {}
        }
      }
    }

    if (textNode.layoutAlign !== 'STRETCH') {
      textNode.layoutAlign = 'STRETCH';
    }

    // 2. 텍스트 박스 크기 조절 모드 고정 (너비는 부모 프레임에 맞춤, 높이는 내용에 맞춰 자동 조절)
    if (textNode.textAutoResize !== 'HEIGHT') {
      textNode.textAutoResize = 'HEIGHT';
    }

    // 영역 초과 시 말줄임(...) 처리 (Fit/Hug Screen 노드는 전체 내용 수용을 위해 DISABLED 유지, Fixed 및 비Screen은 ENDING 유지)
    const flowNodeCandidate = findFlowNode(textNode);
    const isScreenCard = flowNodeCandidate && flowNodeCandidate.type === 'FRAME' && normalizeNodeType(safeGetPluginData(flowNodeCandidate, 'node_type')) === 'Screen';
    const sMode = isScreenCard ? (safeGetPluginData(flowNodeCandidate, 'size_mode') || safeGetPluginData(flowNodeCandidate, 'screen_size_mode') || 'fixed') : null;
    if (sMode === 'fit' || sMode === 'hug') {
      if (textNode.textTruncation !== 'DISABLED') {
        textNode.textTruncation = 'DISABLED';
      }
    } else {
      if (textNode.textTruncation !== 'ENDING') {
        textNode.textTruncation = 'ENDING';
      }
    }
  } catch (err) {
    console.warn('폰트 사이즈 및 리사이즈 모드 고정 실패:', err);
  }
}

// 피그잼 텍스트 에디터의 서식 변경(폰트 크기·굵기/폰트, 링크, 밑줄·취소선, 목록) 차단 헬퍼
// - 표준 규격과 다른 세그먼트가 있을 때만 쓰기(멱등) → documentchange 무한 재진입 및 불필요한 커서 방해 방지
// - 글자 색(fills) 등 그 외 속성은 건드리지 않음. 서식이 수정되었으면 true 반환
async function lockTextEditorStyle(
  textNode: TextNode,
  target: { family: string; style: string; size: number }
): Promise<boolean> {
  try {
    if (!textNode || textNode.removed || textNode.characters.length === 0) return false;

    const isDeviating = (seg: {
      fontName: FontName;
      fontSize: number;
      hyperlink: HyperlinkTarget | null;
      textDecoration: TextDecoration;
      listOptions: { type: string };
    }) =>
      seg.fontName.family !== target.family ||
      seg.fontName.style !== target.style ||
      seg.fontSize !== target.size ||
      seg.hyperlink !== null ||
      seg.textDecoration !== 'NONE' ||
      (seg.listOptions && seg.listOptions.type !== 'NONE');

    const fields = ['fontName', 'fontSize', 'hyperlink', 'textDecoration', 'listOptions'] as const;
    if (!textNode.getStyledTextSegments([...fields]).some(isDeviating)) return false;

    await figma.loadFontAsync({ family: target.family, style: target.style });
    await ensureTextNodeFontsLoaded(textNode);
    if (textNode.removed) return false;

    // 폰트 로딩 대기 중 내용이 바뀌었을 수 있으므로 세그먼트 재조회
    const segments = textNode.getStyledTextSegments([...fields]);
    for (const seg of segments) {
      if (!isDeviating(seg)) continue;
      if (seg.hyperlink !== null) {
        try { textNode.setRangeHyperlink(seg.start, seg.end, null); } catch (_) {}
      }
      if (seg.textDecoration !== 'NONE') {
        try { textNode.setRangeTextDecoration(seg.start, seg.end, 'NONE'); } catch (_) {}
      }
      if (seg.listOptions && seg.listOptions.type !== 'NONE') {
        try { textNode.setRangeListOptions(seg.start, seg.end, { type: 'NONE' }); } catch (_) {}
      }
      if (seg.fontName.family !== target.family || seg.fontName.style !== target.style) {
        try { textNode.setRangeFontName(seg.start, seg.end, { family: target.family, style: target.style }); } catch (_) {}
      }
      if (seg.fontSize !== target.size) {
        try { textNode.setRangeFontSize(seg.start, seg.end, target.size); } catch (_) {}
      }
    }
    return true;
  } catch (err) {
    console.warn('텍스트 에디터 서식 잠금 실패:', err);
    return false;
  }
}

// 타이틀 텍스트용: 피그잼 캔버스 서식(블릿, 링크, 볼드, 취소선 등) 일체 반영 차단 및 Inter Bold 13px 표준 고정, 오직 텍스트 내용만 유지
async function enforceTitleStandardStyle(textNode: TextNode, flowNode?: FrameNode | BaseNode | null) {
  try {
    const targetFont: FontName = { family: 'Inter', style: 'Bold' };
    const targetSize = 13;

    // 스타일 채움색만으로 타이틀 글자색을 정한다. node_theme은 쓰지 않는다.
    let bgColor: RGB = { r: 1, g: 1, b: 1 };
    if (flowNode && 'fills' in flowNode) {
      const fNode = flowNode as FrameNode;
      if (Array.isArray(fNode.fills) && fNode.fills.length > 0 && fNode.fills[0].type === 'SOLID') {
        bgColor = fNode.fills[0].color;
      } else if ('children' in fNode) {
        const shape = fNode.children.find(
          (c) => c.name === 'ShapeVector' || c.name === 'DiamondShape'
        );
        if (shape && 'fills' in shape && Array.isArray(shape.fills) && shape.fills[0]?.type === 'SOLID') {
          bgColor = shape.fills[0].color;
        }
      }
    }
    const { titleFill } = getTextFillsByBackground(bgColor);

    // 1. 필요한 폰트 사전 로드
    try {
      await Promise.all([
        figma.loadFontAsync(targetFont),
        figma.loadFontAsync({ family: 'Inter', style: 'Regular' }),
        figma.loadFontAsync({ family: 'Inter', style: 'Medium' }),
      ]);
    } catch (_) {}

    let len = textNode.characters.length;
    if (len > 0) {
      try {
        const currentFonts = textNode.getRangeAllFontNames(0, len);
        for (const fn of currentFonts) {
          try { await figma.loadFontAsync(fn); } catch (_) {}
        }
      } catch (_) {}
    }

    // 2. 텍스트 내용에서 불릿 기호(•, -, *, 번호 등) 및 불필요한 줄바꿈 제거 (순수 타이틀 텍스트만 유지)
    const originalText = textNode.characters;
    const cleanedText = originalText
      .split('\n')
      .map((line) => line.replace(/^[\s\u2022\u25E6\u2023\u2043\u2219\u25AA\u25AB\-\*]+(?:\s+|$)/, '').trim())
      .filter((line) => line.length > 0)
      .join(' ');

    if (cleanedText !== originalText && cleanedText.length > 0) {
      // 타이핑 중 앞뒤 일반 스페이스 차이만 있으면 characters를 덮어쓰지 않는다.
      // (매 키스트로크마다 trim된 값으로 되돌리면 스페이스 입력이 씹히고 커서가 튄다.
      //  불릿·줄바꿈 등 스페이스 아닌 문자 차이가 있을 땐 기존대로 보정한다.)
      const originalCore = originalText.replace(/[ \u00A0]/g, '');
      const cleanedCore = cleanedText.replace(/[ \u00A0]/g, '');
      if (originalCore !== cleanedCore) {
        textNode.characters = cleanedText;
        len = textNode.characters.length;
      }
    }

    // 표준 여부 사전 판정(읽기만 수행). 이미 표준이면 서식 쓰기를 생략해
    // 타이핑 중 커서·줄바꿈 간섭과 핸들러 지연을 줄인다. 최종 상태는 기존 로직과 동일.
    let needsTitleStyleFix = false;
    if (len > 0) {
      try {
        const checkSegments = textNode.getStyledTextSegments([
          'hyperlink',
          'textDecoration',
          'listOptions',
          'fontName',
          'fontSize',
        ]);
        needsTitleStyleFix = checkSegments.some((seg) =>
          seg.hyperlink !== null ||
          seg.textDecoration !== 'NONE' ||
          (seg.listOptions && seg.listOptions.type !== 'NONE') ||
          seg.fontName.family !== targetFont.family ||
          seg.fontName.style !== targetFont.style ||
          seg.fontSize !== targetSize
        );
      } catch (_) { needsTitleStyleFix = true; }
      if (!needsTitleStyleFix && Array.isArray(textNode.fills) && textNode.fills.length === 0) {
        needsTitleStyleFix = true;
      }
    }

    if (len > 0 && needsTitleStyleFix) {
      // 3. getStyledTextSegments로 세그먼트별 서식(링크, 블릿, 취소선, 볼드 등) 정밀 차단 및 제거
      try {
        const segments = textNode.getStyledTextSegments([
          'hyperlink',
          'textDecoration',
          'listOptions',
          'fontName',
          'fontSize',
        ]);
        for (const seg of segments) {
          // 링크 제거
          if (seg.hyperlink !== null) {
            try { textNode.setRangeHyperlink(seg.start, seg.end, null); } catch (_) {}
          }
          // 취소선, 밑줄 제거
          if (seg.textDecoration !== 'NONE') {
            try { textNode.setRangeTextDecoration(seg.start, seg.end, 'NONE'); } catch (_) {}
          }
          // 불릿 / 번호 목록 서식 제거
          if (seg.listOptions && seg.listOptions.type !== 'NONE') {
            try { textNode.setRangeListOptions(seg.start, seg.end, { type: 'NONE' }); } catch (_) {}
          }
          // 볼드 토글 및 폰트 변경 차단 (Inter Bold 고정)
          if (seg.fontName.family !== targetFont.family || seg.fontName.style !== targetFont.style) {
            try { textNode.setRangeFontName(seg.start, seg.end, targetFont); } catch (_) {}
          }
          // 폰트 크기 고정 (13px)
          if (seg.fontSize !== targetSize) {
            try { textNode.setRangeFontSize(seg.start, seg.end, targetSize); } catch (_) {}
          }
        }
      } catch (_) {}

      // 전체 범위 일괄 초기화 (이중 안전장치) - 피그잼 속성에서 수정한 타이틀 컬러(Fills)는 보존
      try { textNode.setRangeFontName(0, len, targetFont); } catch (_) {}
      try { textNode.setRangeFontSize(0, len, targetSize); } catch (_) {}
      if (Array.isArray(textNode.fills) && textNode.fills.length === 0) {
        try { textNode.setRangeFills(0, len, [titleFill]); } catch (_) {}
      }
      try { textNode.setRangeTextDecoration(0, len, 'NONE'); } catch (_) {}
      try { textNode.setRangeHyperlink(0, len, null); } catch (_) {}
      try { textNode.setRangeListOptions(0, len, { type: 'NONE' }); } catch (_) {}
      try { textNode.setRangeIndentation(0, len, 0); } catch (_) {}
    } else if (len === 0) {
      try { textNode.fontName = targetFont; } catch (_) {}
      try { textNode.fontSize = targetSize; } catch (_) {}
      if (Array.isArray(textNode.fills) && textNode.fills.length === 0) {
        try { textNode.fills = [titleFill]; } catch (_) {}
      }
      try { textNode.textDecoration = 'NONE'; } catch (_) {}
      try { textNode.hyperlink = null; } catch (_) {}
    }

    // 4. 텍스트 박스 리사이즈 모드 및 정렬/말줄임 고정 (도형 노드는 중앙 정렬)
    const rawNodeType = flowNode ? safeGetPluginData(flowNode, 'node_type') : '';
    const nType = normalizeNodeType(rawNodeType);
    const nSpec = NODE_TYPE_SHAPE_SPECS[nType] || NODE_TYPE_SHAPE_SPECS.Screen;
    const isShape = !nSpec.allowDescription;

    if (isShape) {
      textNode.textAlignHorizontal = 'CENTER';
      textNode.textAlignVertical = 'CENTER';
      textNode.layoutAlign = 'STRETCH';
      try { textNode.lineHeight = { value: 18, unit: 'PIXELS' }; } catch (_) {}

      if (nType === 'Decision') {
        bindShapeTitle(textNode, 'decision');
      } else if (nType === 'Branch' && flowNode && safeGetPluginData(flowNode, 'branch_variant') === 'TAG') {
        bindShapeTitle(textNode, 'tag');
      } else {
        try { textNode.maxHeight = null; } catch (_) {}
        if (textNode.textAutoResize !== 'HEIGHT') {
          textNode.textAutoResize = 'HEIGHT';
        }
        textNode.textTruncation = 'ENDING';
        textNode.maxLines = 3;
      }
    } else {
      if (textNode.parent && textNode.parent.type === 'FRAME' && textNode.parent.name === 'Header') {
        const headerFrame = textNode.parent as FrameNode;
        if (headerFrame.layoutMode !== 'VERTICAL') {
          try { headerFrame.layoutMode = 'VERTICAL'; } catch (_) {}
        }
        headerFrame.primaryAxisSizingMode = 'AUTO';
        headerFrame.primaryAxisAlignItems = 'MIN';
        headerFrame.counterAxisAlignItems = 'MIN';
        try { headerFrame.layoutSizingVertical = 'HUG'; } catch (_) {}
        try { headerFrame.layoutSizingHorizontal = 'FILL'; } catch (_) {
          try { headerFrame.layoutAlign = 'STRETCH'; } catch (_) {}
        }
      }

      if (textNode.textAutoResize !== 'HEIGHT') {
        textNode.textAutoResize = 'HEIGHT';
      }
      textNode.textAlignHorizontal = 'LEFT';
      textNode.textAlignVertical = 'TOP';
      try { textNode.lineHeight = { value: 18, unit: 'PIXELS' }; } catch (_) {}
      textNode.layoutAlign = 'STRETCH';
      try { textNode.layoutSizingHorizontal = 'FILL'; } catch (_) {}
      textNode.textTruncation = 'DISABLED';
      textNode.maxLines = null;
    }

    // 5. 카드 레이어 이름 동기화
    if (flowNode && 'name' in flowNode && textNode.characters.trim()) {
      if (flowNode.name !== textNode.characters.trim()) {
        flowNode.name = textNode.characters.trim();
      }
    }
  } catch (err) {
    console.warn('타이틀 표준 스타일 고정 실패:', err);
  }
}





// ----------------------------------------------------
// 2. 쉐이프로 생성되었던 구형 노드를 완벽한 직각 프레임 카드로 마이그레이션
// ----------------------------------------------------
async function convertShapeToFrameNode(shape: ShapeWithTextNode): Promise<FrameNode> {
  await loadRequiredFonts();

  const extracted = extractNodeText(shape);
  const title = extracted.title;
  const desc = extracted.description;
  const theme = (shape.getPluginData('node_theme') as 'light' | 'dark') || 'light';
  const status = (shape.getPluginData('workflow_status') as WorkflowStatus) || undefined;
  const stepStr = shape.getPluginData('step_number');
  const stepNumber = stepStr ? parseInt(stepStr, 10) : undefined;
  const width = Math.max(SCREEN_NODE_CONSTRAINTS.MIN_WIDTH, Math.round(shape.width));
  const height = Math.max(SCREEN_NODE_CONSTRAINTS.MIN_HEIGHT, Math.round(shape.height));
  const x = shape.x;
  const y = shape.y;
  const parent = shape.parent || figma.currentPage;

  const isDark = theme === 'dark';
  let bgColor: RGB = isDark ? { r: 0.14, g: 0.14, b: 0.15 } : { r: 1, g: 1, b: 1 };
  if (Array.isArray(shape.fills) && shape.fills.length > 0 && shape.fills[0].type === 'SOLID') {
    bgColor = shape.fills[0].color;
  }
  const { titleFill, descFill, isBgDark } = getTextFillsByBackground(bgColor);
  const borderColor: RGB = isBgDark ? { r: 0.28, g: 0.28, b: 0.3 } : { r: 0.15, g: 0.15, b: 0.18 };

  const card = figma.createFrame();
  card.name = title;
  card.x = x;
  card.y = y;
  card.layoutMode = 'VERTICAL';
  card.primaryAxisSizingMode = 'FIXED';
  card.counterAxisSizingMode = 'FIXED';
  card.resize(width, height);
  card.cornerRadius = 0; // 완전 직각
  card.strokeWeight = 1.5;
  card.strokes = [{ type: 'SOLID', color: borderColor }];
  card.fills = [{ type: 'SOLID', color: bgColor }];
  card.strokeAlign = 'INSIDE';
  if ('strokesIncludedInLayout' in card) {
    card.strokesIncludedInLayout = true;
  }
  card.clipsContent = false; // 스텝 배지(-11px 돌출) 및 엘리베이션이 잘리지 않도록 클리핑 해제
  const hasShapeStatus = Boolean(status && STATUS_CONFIG[status]);
  card.paddingTop = 14;
  card.paddingBottom = hasShapeStatus ? 36 : 16;
  card.paddingLeft = 16;
  card.paddingRight = 16;
  card.itemSpacing = 8;
  card.primaryAxisAlignItems = 'MIN';
  card.counterAxisAlignItems = 'MIN';

  // 캔버스 기즈모 리사이즈 원천 차단 (현재 크기로 min/max 완전 고정)
  card.minWidth = width;
  card.maxWidth = width;
  card.minHeight = height;
  card.maxHeight = height;

  // 헤더 행 (타이틀 수용 공간)
  const headerRow = figma.createFrame();
  headerRow.name = 'Header';
  headerRow.layoutMode = 'VERTICAL';
  headerRow.layoutAlign = 'STRETCH';
  headerRow.primaryAxisSizingMode = 'AUTO';
  headerRow.counterAxisSizingMode = 'AUTO';
  headerRow.primaryAxisAlignItems = 'MIN';
  headerRow.counterAxisAlignItems = 'MIN';
  headerRow.itemSpacing = 0;
  headerRow.fills = [];

  const titleText = figma.createText();
  titleText.name = 'TitleText';
  titleText.fontName = { family: 'Inter', style: 'Bold' };
  titleText.fontSize = 13;
  titleText.lineHeight = { value: 18, unit: 'PIXELS' };
  titleText.characters = title;
  applyFigmaTextFill(titleText, titleFill);
  titleText.textAlignHorizontal = 'LEFT';
  titleText.textAlignVertical = 'TOP';
  titleText.textAutoResize = 'HEIGHT';
  titleText.textTruncation = 'DISABLED';
  titleText.maxLines = null;
  titleText.setPluginData('node_role', 'title');
  headerRow.appendChild(titleText);
  titleText.layoutAlign = 'STRETCH';

  card.appendChild(headerRow);
  applyFigmaTextFill(titleText, titleFill);

  // 상태 뱃지 복원 (타이틀과 독립하여 카드 우하단에 위치)
  if (status && STATUS_CONFIG[status]) {
    const cfg = STATUS_CONFIG[status];
    const { badgeBg, badgeTextColor } = getStatusBadgeColors(status, bgColor, isDark);
    const statusBadge = figma.createFrame();
    statusBadge.name = 'StatusBadge';
    statusBadge.layoutMode = 'HORIZONTAL';
    statusBadge.primaryAxisSizingMode = 'AUTO';
    statusBadge.counterAxisSizingMode = 'AUTO';
    statusBadge.primaryAxisAlignItems = 'CENTER';
    statusBadge.counterAxisAlignItems = 'CENTER';
    statusBadge.paddingLeft = 9;
    statusBadge.paddingRight = 9;
    statusBadge.paddingTop = 3;
    statusBadge.paddingBottom = 3;
    statusBadge.cornerRadius = getStatusBadgeCornerRadius(card.cornerRadius);
    statusBadge.fills = [{ type: 'SOLID', color: badgeBg }];
    statusBadge.setPluginData('is_status_badge', 'true');

    const badgeText = figma.createText();
    badgeText.name = 'StatusText';
    badgeText.fontName = { family: 'Inter', style: 'Bold' };
    badgeText.fontSize = 9;
    badgeText.characters = cfg.label.toUpperCase();
    badgeText.textAutoResize = 'WIDTH_AND_HEIGHT';
    badgeText.fills = [{ type: 'SOLID', color: badgeTextColor }];
    badgeText.locked = true; // 캔버스에서 텍스트 직접 편집 차단
    statusBadge.appendChild(badgeText);

    statusBadge.locked = true; // 상태 배지 잠금
    card.appendChild(statusBadge);
    if ((card.layoutMode as any) !== 'NONE') {
      statusBadge.layoutPositioning = 'ABSOLUTE';
    }
    statusBadge.constraints = { horizontal: 'MAX', vertical: 'MAX' };
    statusBadge.x = card.width - statusBadge.width - 10;
    statusBadge.y = card.height - statusBadge.height - 10;
  }

  // 설명 텍스트
  const descText = figma.createText();
  descText.name = 'DescText';
  descText.fontName = { family: 'Inter', style: 'Regular' };
  descText.fontSize = 11;
  descText.lineHeight = { value: DESC_LINE_HEIGHT, unit: 'PIXELS' };
  descText.characters = desc;
  applyFigmaTextFill(descText, descFill);
  descText.textAlignHorizontal = 'LEFT';
  descText.setPluginData('node_role', 'desc');
  card.appendChild(descText);
  applyFigmaTextFill(descText, descFill);

  descText.layoutAlign = 'STRETCH';
  descText.textAutoResize = 'HEIGHT';
  await updateDescTextTruncation(card, descText, height, desc);

  // 스텝 번호 뱃지 복원
  if (stepNumber) {
    const stepBadge = figma.createFrame();
    stepBadge.name = `[Step] ${stepNumber}`;
    card.appendChild(stepBadge);
    if ((card.layoutMode as any) !== 'NONE') {
      stepBadge.layoutPositioning = 'ABSOLUTE';
    }
    stepBadge.layoutMode = 'HORIZONTAL';
    stepBadge.primaryAxisAlignItems = 'CENTER';
    stepBadge.counterAxisAlignItems = 'CENTER';
    stepBadge.paddingLeft = 4;
    stepBadge.paddingRight = 4;
    stepBadge.paddingTop = 0;
    stepBadge.paddingBottom = 0;
    try {
      stepBadge.minWidth = 24;
      stepBadge.minHeight = 24;
      stepBadge.maxHeight = 24;
    } catch (e) {}
    stepBadge.counterAxisSizingMode = 'FIXED';
    stepBadge.primaryAxisSizingMode = 'AUTO';
    stepBadge.resize(24, 24);

    const bShape = card.getPluginData('badge_shape');
    if (bShape === 'Circle') {
      stepBadge.cornerRadius = 999;
    } else if (bShape === 'RoundBox') {
      stepBadge.cornerRadius = 5;
    } else {
      stepBadge.cornerRadius = 0;
    }

    stepBadge.fills = [{ type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.14 } }];
    stepBadge.strokes = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    stepBadge.strokeWeight = 1.5;
    stepBadge.setPluginData('is_step_badge', 'true');

    const numText = figma.createText();
    numText.name = 'NumText';
    numText.fontName = { family: 'Inter', style: 'Bold' };
    numText.fontSize = 11;
    numText.characters = `${stepNumber}`;
    numText.textAutoResize = 'WIDTH_AND_HEIGHT';
    numText.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    stepBadge.appendChild(numText);

    const bCorner = card.getPluginData('badge_corner');
    const bw = Math.max(24, Math.round(stepBadge.width));
    const bh = 24;
    const offset = 11;
    if (bCorner === 'TOP_RIGHT') {
      stepBadge.x = card.width - bw + offset;
      stepBadge.y = -offset;
      stepBadge.constraints = { horizontal: 'MAX', vertical: 'MIN' };
    } else if (bCorner === 'BOTTOM_LEFT') {
      stepBadge.x = -offset;
      stepBadge.y = card.height - bh + offset;
      stepBadge.constraints = { horizontal: 'MIN', vertical: 'MAX' };
    } else if (bCorner === 'BOTTOM_RIGHT') {
      stepBadge.x = card.width - bw + offset;
      stepBadge.y = card.height - bh + offset;
      stepBadge.constraints = { horizontal: 'MAX', vertical: 'MAX' };
    } else {
      stepBadge.x = -offset;
      stepBadge.y = -offset;
      stepBadge.constraints = { horizontal: 'MIN', vertical: 'MIN' };
    }
  }

  const elevData = shape.getPluginData('node_elevation');
  if (elevData !== '') {
    const elev = parseInt(elevData, 10);
    card.setPluginData('node_elevation', elevData);
    card.effects = getElevationEffects(elev, isDark);
    card.clipsContent = false;
  }

  card.setPluginData('is_flow_node', 'true');
  card.setPluginData('schema_version', '2');
  card.setPluginData('node_theme', theme);
  if (status) card.setPluginData('workflow_status', status);
  if (stepNumber) card.setPluginData('step_number', `${stepNumber}`);

  parent.appendChild(card);

  shape.remove();
  return card;
}

/**
 * 피그잼(FigJam)에서 FrameNode는 cornerRadius를 렌더링하지 않으므로,
 * Junction, Diamond, Capsule 형태는 프레임 내부에 정밀한 커스텀 벡터 배경을 배치하여
 * 화이트보드 캔버스에서도 완벽한 도형 비주얼 및 4방위 자석 커넥터 스냅을 100% 보장합니다.
 */
function getJunctionCapsulePath(w: number, h: number): string {
  const r = h / 2;
  const k = r * 0.55228475;
  const straightEnd = Math.max(r, w - r);
  return `M ${r} 0 L ${straightEnd} 0 C ${straightEnd + k} 0 ${w} ${r - k} ${w} ${r} C ${w} ${r + k} ${straightEnd + k} ${h} ${straightEnd} ${h} L ${r} ${h} C ${r - k} ${h} 0 ${r + k} 0 ${r} C 0 ${r - k} ${r - k} 0 ${r} 0 Z`;
}

function getJunctionEllipsePath(w: number, h: number): string {
  const rx = w / 2;
  const ry = h / 2;
  const kx = rx * 0.55228475;
  const ky = ry * 0.55228475;
  return `M ${rx} 0 C ${rx + kx} 0 ${w} ${ry - ky} ${w} ${ry} C ${w} ${ry + ky} ${rx + kx} ${h} ${rx} ${h} C ${rx - kx} ${h} 0 ${ry + ky} 0 ${ry} C 0 ${ry - ky} ${rx - kx} 0 ${rx} 0 Z`;
}

function getShapeVectorData(
  nodeType: DiagramNodeType,
  w: number,
  h: number,
  branchVariant?: BranchVariant
): string | null {
  if (nodeType === 'Branch') {
    const variant = branchVariant || 'CIRCLE';
    if (variant === 'SQUARE') {
      return `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z`;
    }
    if (variant === 'DIAMOND') {
      return `M ${w / 2} 0 L ${w} ${h / 2} L ${w / 2} ${h} L 0 ${h / 2} Z`;
    }
    if (variant === 'TAG') {
      return getJunctionCapsulePath(w, h);
    }
    return getJunctionEllipsePath(w, h);
  }
  if (nodeType === 'Connector' || nodeType === 'Junction') {
    return getJunctionEllipsePath(w, h);
  }
  if (nodeType === 'Decision' || nodeType === 'Diamond') {
    // 140 x 140 완벽 마름모 경로
    return `M ${w / 2} 0 L ${w} ${h / 2} L ${w / 2} ${h} L 0 ${h / 2} Z`;
  }
  if (nodeType === 'Terminator' || nodeType === 'Pill' || nodeType === 'Capsule') {
    // 180 x 90 완벽 캡슐(알약) 경로 (양쪽 반원 + 중앙 직사각형)
    const r = h / 2;
    const k = r * 0.55228475;
    const straightEnd = Math.max(r, w - r);
    return `M ${r} 0 L ${straightEnd} 0 C ${straightEnd + k} 0 ${w} ${r - k} ${w} ${r} C ${w} ${r + k} ${straightEnd + k} ${h} ${straightEnd} ${h} L ${r} ${h} C ${r - k} ${h} 0 ${r + k} 0 ${r} C 0 ${r - k} ${r - k} 0 ${r} 0 Z`;
  }
  return null;
}

/**
 * Figma 공식 SVG 파서(createNodeFromSvg)를 통해 Junction, Diamond, Capsule 형태의
 * 네이티브 벡터 노드를 정밀하게 생성합니다.
 * 피그잼 화이트보드 캔버스에서도 100% 렌더링되며, 4방위 자석 커넥터 스냅과 프레임 정렬을 온전히 보장합니다.
 */
const BRANCH_CHECK_MARK =
  'M21.2016 9.4138C21.4835 8.9309 22.1031 8.76812 22.5861 9.04987C23.069 9.33174 23.2318 9.95136 22.95 10.4344L15.8614 22.5863C15.6952 22.8711 15.4009 23.057 15.0723 23.0847C14.7435 23.1121 14.4213 22.978 14.2099 22.7247L9.14664 16.6488C8.78876 16.2193 8.84608 15.5809 9.2752 15.2227C9.70465 14.8649 10.3431 14.9222 10.7012 15.3513L14.8389 20.3177L21.2016 9.4138Z';
const BRANCH_CROSS_MARK =
  'M20.347 10.2205C20.7425 9.82499 21.3835 9.82499 21.779 10.2205C22.1745 10.6159 22.1745 11.2569 21.779 11.6524L17.4317 15.9997L21.779 20.347C22.1745 20.7425 22.1745 21.3835 21.779 21.779C21.3835 22.1745 20.7425 22.1745 20.347 21.779L15.9997 17.4317L11.6524 21.779C11.2569 22.1745 10.6159 22.1745 10.2205 21.779C9.82499 21.3835 9.82499 20.7425 10.2205 20.347L14.5678 15.9997L10.2205 11.6524C9.82504 11.2569 9.82501 10.6159 10.2205 10.2205C10.6159 9.82506 11.257 9.82506 11.6524 10.2205L15.9997 14.5678L20.347 10.2205Z';

function removeBranchMark(card: FrameNode) {
  for (const child of [...card.children]) {
    if (child.name === 'BranchMark' || child.name === 'JunctionMark') {
      child.remove();
    }
  }
}

function attachBranchMark(card: FrameNode, variant: BranchVariant, w: number, h: number, bgColor: RGB) {
  removeBranchMark(card);
  if (variant !== 'CHECK' && variant !== 'CROSS') return;
  const markD = variant === 'CHECK' ? BRANCH_CHECK_MARK : BRANCH_CROSS_MARK;
  // 타이틀과 동일하게 배경 명도 0.5를 기준으로 기호를 검정/화이트로 전환
  const markColor = getTextFillsByBackground(bgColor).titleFill.color;
  const markHex = rgbToHexColor(markColor);
  // viewBox 32 좌표를 유지해야 원 중앙에 맞는다. 벡터만 꺼내 x/y를 0으로 두면 왼쪽 위로 붙는다.
  const svgStr = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="${markD}" fill="${markHex}"/></svg>`;
  try {
    const imported = figma.createNodeFromSvg(svgStr);
    imported.name = 'BranchMark';
    imported.fills = [];
    imported.strokes = [];
    imported.clipsContent = false;
    const vectors = imported.findAll((n) => n.type === 'VECTOR') as VectorNode[];
    for (const vector of vectors) {
      vector.fills = [{ type: 'SOLID', color: markColor }];
      vector.strokes = [];
      try { vector.strokeWeight = 0; } catch (_) {}
    }
    const originalParent = imported.parent;
    card.appendChild(imported);
    if (originalParent && originalParent !== card) {
      originalParent.remove();
    }
    if (card.layoutMode !== 'NONE') {
      imported.layoutPositioning = 'ABSOLUTE';
    }
    const scale = Math.min(w, h) / 32;
    if (Math.abs(scale - 1) > 0.001) {
      try { imported.rescale(scale); } catch (_) {}
    }
    imported.x = (w - imported.width) / 2;
    imported.y = (h - imported.height) / 2;
    imported.locked = true;
  } catch (err) {
    console.error('attachBranchMark error:', err);
  }
}

function createShapeVectorNode(
  nodeType: DiagramNodeType,
  w: number,
  h: number,
  bgColor: RGB,
  strokeColor: RGB,
  strokeWeight: number,
  branchVariant?: BranchVariant,
  fillNone?: boolean
): VectorNode | FrameNode | null {
  const pathD = getShapeVectorData(nodeType, w, h, branchVariant);
  if (!pathD) return null;

  const bgHex = rgbToHexColor(bgColor);
  const strokeHex = rgbToHexColor(strokeColor);
  const sw = typeof strokeWeight === 'number' && strokeWeight >= 0 ? strokeWeight : 1.5;
  const fillAttr = fillNone ? 'none' : bgHex;
  const strokeAttr = sw > 0 ? `stroke="${strokeHex}" stroke-width="${sw}"` : '';

  const svgStr = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="${pathD}" fill="${fillAttr}" ${strokeAttr}/></svg>`;

  try {
    const imported = figma.createNodeFromSvg(svgStr);
    const vector = imported.children.find((c) => c.type === 'VECTOR') as VectorNode | undefined;
    let targetNode: VectorNode | FrameNode = imported;
    if (vector) {
      targetNode = vector;
    }
    targetNode.name = 'ShapeVector';
    // SVG import 기본값에 의존하지 않고 스트로크 상태를 명시한다.
    // (무보더 벡터의 strokeWeight 기본값이 리딩·리싱크 경로에서 보더를 되살리는 문제 방지)
    try {
      if ('strokeWeight' in targetNode && typeof (targetNode as VectorNode).strokeWeight === 'number') {
        (targetNode as VectorNode).strokeWeight = sw > 0 ? sw : 0;
      }
    } catch (_) {}
    if (sw <= 0) {
      try {
        if ('strokes' in targetNode) (targetNode as VectorNode).strokes = [];
      } catch (_) {}
    }
    return targetNode;
  } catch (err) {
    console.error('createShapeVectorNode error:', err);
    return null;
  }
}

/**
 * 생성된 커스텀 SVG 도형 노드를 프레임 카드에 ABSOLUTE로 완벽하게 부착합니다.
 */
function attachShapeVectorNode(
  card: FrameNode,
  nodeType: DiagramNodeType,
  w: number,
  h: number,
  bgColor: RGB,
  strokeColor: RGB,
  strokeWeight: number,
  insertAtBottom: boolean = false,
  branchVariant?: BranchVariant,
  fillNone?: boolean
): VectorNode | FrameNode | null {
  const shape = createShapeVectorNode(nodeType, w, h, bgColor, strokeColor, strokeWeight, branchVariant, fillNone);
  if (!shape) return null;

  const originalParent = shape.parent;
  if (insertAtBottom) {
    card.insertChild(0, shape);
  } else {
    card.appendChild(shape);
  }
  if (
    originalParent &&
    originalParent !== card &&
    originalParent.type !== 'PAGE' &&
    originalParent.type !== 'DOCUMENT'
  ) {
    originalParent.remove();
  }

  if (card.layoutMode !== 'NONE') {
    shape.layoutPositioning = 'ABSOLUTE';
  }
  shape.x = 0;
  shape.y = 0;
  shape.locked = true;
  if (branchVariant) {
    attachBranchMark(card, branchVariant, w, h, bgColor);
  } else {
    removeBranchMark(card);
  }
  return shape;
}

// ----------------------------------------------------
// 3. UI Flow Node 카드 생성 (직각 모서리 + 고정 폰트 + 세련된 레이아웃)
// ----------------------------------------------------
async function createFlowNode(payload: FlowNodePayload) {
  try {
    // Create Gate: 신규 Node 1개 승인 (거부 시 생성하지 않음)
    const createGate = approveNewElements(1);
    if (!createGate.allowed) {
      notifyLimitReached(createGate);
      return;
    }

    await loadRequiredFonts();

    const nodeType = normalizeNodeType(payload.nodeType || 'Screen');
    const branchVariant = nodeType === 'Branch'
      ? normalizeBranchVariant(payload.branchVariant)
      : undefined;
    const spec = (branchVariant
      ? getBranchVariantSpec(branchVariant)
      : NODE_TYPE_SHAPE_SPECS[nodeType]) || NODE_TYPE_SHAPE_SPECS.Screen;
    const isShapeNode = !spec.allowDescription;

    const rawTitle = payload.title !== undefined ? payload.title.trim() : '';
    let title = branchVariant
      ? (isDefaultNodeTitle(rawTitle) ? BRANCH_VARIANT_LABELS[branchVariant] : rawTitle)
      : (rawTitle || getDefaultNodeTitle(nodeType));
    if (branchVariant === 'TAG') {
      title = clampTitleChars(title);
    }
    // 도형 노드인 경우 스펙 규격(Process: 120x120, Junction variant, Decision: 140x140, Terminator: 180x90) 최우선 보장
    let width = isShapeNode ? spec.width : (payload.width ? clampScreenWidth(payload.width) : spec.width);
    if (branchVariant === 'TAG') {
      width = await resolveTagCardWidth(title, spec.width);
    }
    const height = isShapeNode ? spec.height : (payload.height ? clampScreenHeight(payload.height) : spec.height);
    const defaultRadius = spec.cornerRadius !== undefined ? spec.cornerRadius : 0;
    const cornerRadius = isShapeNode ? defaultRadius : (typeof payload.cornerRadius === 'number' ? clampScreenCornerRadius(payload.cornerRadius) : defaultRadius);
    const description = isShapeNode ? '' : (payload.description || '').trim();
    const theme = payload.theme || 'light';

    const isDark = theme === 'dark';
    const isFillNone = payload.colorHex?.toLowerCase() === 'none' || payload.colorHex?.toLowerCase() === 'transparent';
    let bgColor: RGB = isDark ? { r: 0.14, g: 0.14, b: 0.15 } : { r: 1, g: 1, b: 1 };
    if (!isFillNone && payload.colorHex) {
      bgColor = hexToRgbColor(payload.colorHex);
    } else if (!isFillNone && branchVariant) {
      bgColor = hexToRgbColor(getBranchVariantDefaultFill(branchVariant));
    }
    const { titleFill, descFill, isBgDark } = getTextFillsByBackground(
      isFillNone ? { r: 1, g: 1, b: 1 } : bgColor
    );

    const borderColor: RGB = isBgDark ? { r: 0.28, g: 0.28, b: 0.3 } : { r: 0.15, g: 0.15, b: 0.18 };

    // 1. 메인 카드 프레임
    const card = figma.createFrame();
    card.name = title;
    card.layoutMode = 'VERTICAL';
    card.primaryAxisSizingMode = 'FIXED';
    card.counterAxisSizingMode = 'FIXED';
    card.resize(width, height);
    card.cornerRadius = cornerRadius;
    const cardStrokes: Paint[] = typeof payload.strokeWeight === 'number' && payload.strokeWeight === 0
      ? []
      : [{ type: 'SOLID', color: payload.strokeColor ? hexToRgbColor(payload.strokeColor) : borderColor }];
    const cardStrokeWeight = branchVariant && !branchVariantUsesStroke(branchVariant)
      ? 0
      : (typeof payload.strokeWeight === 'number' ? clampStrokeWeight(payload.strokeWeight) : 1.5);

    const vectorPathData = getShapeVectorData(nodeType, width, height, branchVariant);

    if (vectorPathData) {
      // Junction, Diamond, Capsule은 프레임 fills/strokes를 비우고 내부에 정밀 벡터 배치
      card.fills = [];
      card.strokes = [];
      card.strokeWeight = 0;
      card.cornerRadius = 0;
    } else {
      card.fills = isFillNone ? [] : [{ type: 'SOLID', color: bgColor }];
      card.strokes = cardStrokes;
      card.strokeWeight = cardStrokeWeight;
      card.strokeAlign = 'INSIDE';
      if ('strokesIncludedInLayout' in card) {
        card.strokesIncludedInLayout = true;
      }
    }
    card.clipsContent = false; // 스텝 배지(-11px 돌출) 및 엘리베이션이 잘리지 않도록 클리핑 해제

    let effectiveCreateW = width;
    const isCreateFit = !isShapeNode && payload.sizeMode === 'fit';
    const isCreateHug = !isShapeNode && (payload.sizeMode === 'hug' || (!payload.sizeMode && nodeType === 'Screen'));

    // 캔버스 기즈모 리사이즈 원천 차단 (현재 크기로 min/max 완전 고정)
    card.minWidth = width;
    card.maxWidth = width;
    card.minHeight = height;
    card.maxHeight = height;

    if (isShapeNode) {
      // Process, Junction, Decision, Terminator: 디스크립션 없이 타이틀만 정중앙 정렬
      const showBranchTitle = Boolean(branchVariant && branchVariantHasTitle(branchVariant));
      const hPad = branchVariant
        ? (showBranchTitle ? TAG_TITLE_PAD_X : 0)
        : (nodeType === 'Decision' ? 24 : (nodeType === 'Junction' || nodeType === 'Connector' ? 18 : 12));
      card.paddingLeft = hPad;
      card.paddingRight = hPad;
      card.paddingTop = branchVariant ? (showBranchTitle ? 5 : 0) : 12;
      card.paddingBottom = branchVariant ? (showBranchTitle ? 5 : 0) : 12;
      card.primaryAxisAlignItems = 'CENTER';
      card.counterAxisAlignItems = 'CENTER';
      card.itemSpacing = 0;

      if (vectorPathData) {
        // 커스텀 SVG 벡터 배경 (Junction, Diamond, Capsule 등)
        const strokeCol = payload.strokeColor
          ? hexToRgbColor(payload.strokeColor)
          : (branchVariant ? hexToRgbColor('#1E1E1E') : borderColor);
        attachShapeVectorNode(card, nodeType, width, height, bgColor, strokeCol, cardStrokeWeight, false, branchVariant, isFillNone);
      }

      const titleText = figma.createText();
      titleText.name = 'TitleText';
      titleText.fontName = { family: 'Inter', style: 'Bold' };
      titleText.fontSize = 13;
      titleText.lineHeight = { value: showBranchTitle ? 22 : 18, unit: 'PIXELS' };
      titleText.characters = showBranchTitle || !branchVariant ? title : '';
      applyFigmaTextFill(titleText, titleFill);
      titleText.textAlignHorizontal = 'CENTER';
      titleText.textAlignVertical = 'CENTER';
      titleText.layoutAlign = 'STRETCH';
      titleText.visible = !branchVariant || showBranchTitle;
      bindShapeTitle(
        titleText,
        nodeType === 'Decision' ? 'decision' : (showBranchTitle ? 'tag' : 'shape')
      );
      titleText.setPluginData('node_role', 'title');
      card.appendChild(titleText);
      applyFigmaTextFill(titleText, titleFill);
    } else {
      // Screen 노드: 상단 헤더 + 설명문 레이아웃
      const hasStatus = Boolean(payload.status && STATUS_CONFIG[payload.status]);
      const hasLink = Boolean(payload.figmaLink && payload.figmaLink.trim());
      const hasBottomBar = hasStatus || hasLink;

      // 스크린 타이틀은 설명 유무와 관계없이 카드 위쪽에 붙인다.
      card.paddingTop = 14;
      card.paddingBottom = !description && !hasBottomBar ? 14 : (hasBottomBar ? 36 : 16);
      card.primaryAxisAlignItems = 'MIN';
      card.paddingLeft = 16;
      card.paddingRight = 16;
      card.itemSpacing = 8;
      card.counterAxisAlignItems = 'MIN';

      // 2. 헤더 행 (타이틀 수용 공간)
      const headerRow = figma.createFrame();
      headerRow.name = 'Header';
      headerRow.layoutMode = 'VERTICAL';
      headerRow.layoutAlign = 'STRETCH';
      headerRow.primaryAxisSizingMode = 'AUTO';
      headerRow.counterAxisSizingMode = 'AUTO';
      headerRow.primaryAxisAlignItems = 'MIN';
      headerRow.counterAxisAlignItems = 'MIN';
      headerRow.itemSpacing = 0;
      headerRow.paddingLeft = 0;
      headerRow.paddingRight = 0;
      headerRow.paddingTop = 0;
      headerRow.paddingBottom = 0;
      headerRow.fills = [];

      // 3. 타이틀 텍스트 (13px Bold 고정, 글자 수 길어지면 자동 줄바꿈)
      const titleText = figma.createText();
      titleText.name = 'TitleText';
      titleText.fontName = { family: 'Inter', style: 'Bold' };
      titleText.fontSize = 13;
      titleText.lineHeight = { value: 18, unit: 'PIXELS' };
      titleText.characters = title;
      applyFigmaTextFill(titleText, titleFill);
      titleText.textAutoResize = 'HEIGHT';

      if (isCreateFit) {
        effectiveCreateW = await calculateScreenFitWidth(
          card,
          title,
          payload.status,
          payload.figmaLink
        );
      } else if (isCreateHug) {
        effectiveCreateW = clampScreenWidth(width);
      }

      if (isCreateFit || isCreateHug) {
        card.counterAxisSizingMode = 'FIXED';
        card.minHeight = SCREEN_NODE_CONSTRAINTS.MIN_HEIGHT;
        card.maxHeight = null;
        card.minWidth = effectiveCreateW;
        card.maxWidth = effectiveCreateW;
        card.resize(effectiveCreateW, Math.max(SCREEN_NODE_CONSTRAINTS.MIN_HEIGHT, card.height));
        card.primaryAxisSizingMode = 'AUTO';
        card.counterAxisSizingMode = 'FIXED';
        card.setPluginData('size_mode', isCreateFit ? 'fit' : 'hug');
      }

      titleText.textTruncation = 'DISABLED';
      titleText.maxLines = null;
      titleText.textAlignHorizontal = 'LEFT';
      titleText.textAlignVertical = 'TOP';
      titleText.setPluginData('node_role', 'title');
      headerRow.appendChild(titleText);
      titleText.layoutAlign = 'STRETCH';

      card.appendChild(headerRow);
      applyFigmaTextFill(titleText, titleFill);

      // 4. 설명 텍스트 (11px Regular 고정) - 설명이 있는 경우에만 생성
      if (description) {
        const descText = figma.createText();
        descText.name = 'DescText';
        descText.fontName = { family: 'Inter', style: 'Regular' };
        descText.fontSize = 11;
        descText.lineHeight = { value: DESC_LINE_HEIGHT, unit: 'PIXELS' };
        descText.characters = description;
        applyFigmaTextFill(descText, descFill);
        descText.textAlignHorizontal = 'LEFT';
        descText.setPluginData('node_role', 'desc');
        card.appendChild(descText);
        applyFigmaTextFill(descText, descFill);

        descText.layoutAlign = 'STRETCH';
        const descStrokeOffset = (typeof card.strokeWeight === 'number' ? card.strokeWeight : 0) * 2;
        const descAvailW = Math.max(10, effectiveCreateW - card.paddingLeft - card.paddingRight - descStrokeOffset);
        descText.resize(descAvailW, descText.height);
        descText.textAutoResize = 'HEIGHT';
        if (!isShapeNode && (payload.sizeMode === 'fit' || payload.sizeMode === 'hug')) {
          descText.maxLines = null;
          descText.textTruncation = 'DISABLED';
        } else {
          await updateDescTextTruncation(card, descText, height, description, effectiveCreateW);
        }
      }
    }

    // 메타데이터 보관 (FigJam 네이티브 객체 속성을 Source of Truth로 사용하므로 중복 데이터 제거)
    card.name = title;
    card.setPluginData('is_flow_node', 'true');
    card.setPluginData('schema_version', '2');
    card.setPluginData('node_theme', theme);
    card.setPluginData('node_type', nodeType);
    if (branchVariant) {
      card.setPluginData('branch_variant', branchVariant);
    } else {
      card.setPluginData('branch_variant', '');
    }
    if (!isShapeNode) {
      if (description) card.setPluginData('node_desc', description);
      card.setPluginData('description_on', (description || payload.descriptionOn) ? 'true' : '');
      card.setPluginData('screen_width', String(width));
      card.setPluginData('screen_height', String(height));
      card.setPluginData('screen_corner_radius', String(cornerRadius));
      card.setPluginData('screen_size_mode', payload.sizeMode || (nodeType === 'Screen' ? 'hug' : 'fixed'));
    } else if (payload.description) {
      card.setPluginData('node_desc', payload.description);
    }
    if (!isShapeNode && payload.status) {
      card.setPluginData('workflow_status', payload.status);
      if (STATUS_CONFIG[payload.status]) {
        const cfg = STATUS_CONFIG[payload.status];
        const { badgeBg, badgeTextColor } = getStatusBadgeColors(payload.status, bgColor, isDark);
        const statusBadge = figma.createFrame();
        statusBadge.name = 'StatusBadge';
        statusBadge.layoutMode = 'HORIZONTAL';
        statusBadge.primaryAxisSizingMode = 'AUTO';
        statusBadge.counterAxisSizingMode = 'AUTO';
        statusBadge.primaryAxisAlignItems = 'CENTER';
        statusBadge.counterAxisAlignItems = 'CENTER';
        statusBadge.paddingLeft = 9;
        statusBadge.paddingRight = 9;
        statusBadge.paddingTop = 3;
        statusBadge.paddingBottom = 3;
        statusBadge.cornerRadius = getStatusBadgeCornerRadius(card.cornerRadius);
        statusBadge.fills = [{ type: 'SOLID', color: badgeBg }];
        statusBadge.setPluginData('is_status_badge', 'true');

        const badgeText = figma.createText();
        badgeText.name = 'StatusText';
        badgeText.fontName = { family: 'Inter', style: 'Bold' };
        badgeText.fontSize = 9;
        badgeText.characters = cfg.label.toUpperCase();
        badgeText.textAutoResize = 'WIDTH_AND_HEIGHT';
        badgeText.fills = [{ type: 'SOLID', color: badgeTextColor }];
        badgeText.locked = true; // 캔버스에서 텍스트 직접 수정 차단
        statusBadge.appendChild(badgeText);

        statusBadge.locked = true; // 상태 배지 잠금
        card.appendChild(statusBadge);
        if ((card.layoutMode as any) !== 'NONE') {
          statusBadge.layoutPositioning = 'ABSOLUTE';
        }
        statusBadge.constraints = { horizontal: 'MAX', vertical: 'MAX' };
        statusBadge.x = card.width - statusBadge.width - 10;
        statusBadge.y = card.height - statusBadge.height - 10;
      }
    }

    // Figma Screen Link 펜 아이콘 뱃지(하단 왼쪽) 생성 (Screen 노드 등에서만 허용)
    if (!isShapeNode) {
      await updateFigmaLinkBadge(card, payload.figmaLink, isBgDark);

      if (isCreateFit || isCreateHug) {
        const finalCreateH = Math.max(SCREEN_NODE_CONSTRAINTS.MIN_HEIGHT, Math.round(card.height));
        card.resize(effectiveCreateW, finalCreateH);
        card.primaryAxisSizingMode = 'AUTO';
        card.counterAxisSizingMode = 'FIXED';
        const statusBadge = card.children.find(
          (c) => safeGetPluginData(c, 'is_status_badge') === 'true' || c.name === 'StatusBadge'
        ) as FrameNode | undefined;
        if (statusBadge) {
          statusBadge.x = effectiveCreateW - statusBadge.width - 10;
          statusBadge.y = card.height - statusBadge.height - 10;
        }
        const linkBadge = card.children.find(
          (c) => safeGetPluginData(c, 'is_figma_link_badge') === 'true' || c.name === 'FigmaLinkBadge'
        ) as FrameNode | undefined;
        if (linkBadge) {
          linkBadge.x = 16;
          linkBadge.y = card.height - linkBadge.height - 10;
        }
      }
    }

    // 엘리베이션(그림자) 효과 적용
    if (supportsOption(card, 'elevation') && typeof payload.elevation === 'number') {
      card.setPluginData('node_elevation', `${payload.elevation}`);
      card.effects = getElevationEffects(payload.elevation, isBgDark);
      card.clipsContent = false;
    } else {
      card.setPluginData('node_elevation', '');
      card.effects = [];
    }

    // 스텝 배지(Step Badge) 생성
    if (supportsOption(card, 'stepBadge') && typeof payload.badgeNumber === 'number' && payload.badgeNumber > 0) {
      await applyStepBadgeToSingleCard(
        card,
        payload.badgeNumber,
        payload.badgePosition || 'TOP_LEFT',
        payload.badgeShape || 'Square',
        payload.badgeColorMode || 'Style'
      );
    }

    // 위치 지정
    const selection = figma.currentPage.selection;
    if (selection.length > 0) {
      const last = selection[selection.length - 1];
      card.x = last.x + last.width + 60;
      card.y = last.y;
    } else {
      const center = figma.viewport.center;
      card.x = center.x - Math.round(width / 2);
      card.y = center.y - Math.round(height / 2);
    }

    figma.currentPage.appendChild(card);
    if (nodeType === 'Decision' || branchVariant === 'TAG') {
      const createdTitle = card.findOne(
        (c) => c.type === 'TEXT' && (c.name === 'TitleText' || safeGetPluginData(c, 'node_role') === 'title')
      ) as TextNode | null;
      if (createdTitle) {
        bindShapeTitle(createdTitle, nodeType === 'Decision' ? 'decision' : 'tag');
      }
    }
    figma.currentPage.selection = [card];
    figma.viewport.scrollAndZoomIntoView([card]);

    handleSelectionChange();
    notify(t('nodeCreated', { title }), 'success');
  } catch (err) {
    notify(t('nodeCreateFailed', { error: String(err) }), 'error');
  }
}

// ----------------------------------------------------
// 3-1. 공통 노드 패치 코어 (Single Mutation Engine)
// - 단일 및 다중 선택의 모든 노드 속성 변경을 단일 경로로 처리
// - 캔버스 selection을 절대 변경하지 않음
// - Dormant Data(설명, 상태, 링크, 뱃지, 엘리베이션, Screen 치수)를 손실 없이 보존
// ----------------------------------------------------
export interface FlowNodePatch {
  nodeType?: DiagramNodeType;
  title?: string;
  description?: string;
  descriptionOn?: boolean;
  theme?: 'light' | 'dark';
  colorHex?: string;
  strokeColor?: string;
  strokeWeight?: number;
  strokeStyle?: 'SOLID' | 'DASHED';
  width?: number;
  height?: number;
  cornerRadius?: number;
  sizeMode?: 'fixed' | 'hug' | 'fit';
  status?: WorkflowStatus | '';
  figmaLink?: string;
  clearLinkCache?: boolean;
  elevation?: number | null;
  badgeNumber?: number;
  badgeCorner?: BadgePosition;
  badgePosition?: BadgePosition;
  badgeShape?: BadgeShape;
  badgeColorMode?: 'White' | 'Black' | 'Style';
  badgeOn?: boolean;
  branchVariant?: BranchVariant;
}

async function applyNodePatch(card: FrameNode, patch: FlowNodePatch): Promise<void> {
  // 1. 기즈모 및 제약조건 해제
  card.minWidth = null;
  card.maxWidth = null;
  card.minHeight = null;
  card.maxHeight = null;

  // 2. 노드 타입 및 Branch Variant 결정 (모든 Capability 판단은 TARGET 타입 기준)
  const prevRawType = safeGetPluginData(card, 'node_type') || 'Screen';
  const prevNodeType = normalizeNodeType(prevRawType);
  const rawType = patch.nodeType || prevRawType;
  const nodeType = normalizeNodeType(rawType);
  // 타깃 노드 타입을 선행 동기화하여 이후 모든 capability 판단이 목표 노드 타입을 기준으로 이루어지도록 보장
  card.setPluginData('node_type', nodeType);
  const supportsTargetOption = (opt: any) => supportsOption({ flowNodeType: nodeType, isFlowNode: true }, opt);

  const batchBranchVariant = nodeType === 'Branch'
    ? normalizeBranchVariant(patch.branchVariant || safeGetPluginData(card, 'branch_variant'))
    : undefined;
  const spec = (batchBranchVariant
    ? getBranchVariantSpec(batchBranchVariant)
    : NODE_TYPE_SHAPE_SPECS[nodeType]) || NODE_TYPE_SHAPE_SPECS.Screen;
  const isShapeNode = !spec.allowDescription;
  const isChangingToScreen = prevNodeType !== 'Screen' && nodeType === 'Screen';
  const prevBranchVariant = prevNodeType === 'Branch'
    ? normalizeBranchVariant(safeGetPluginData(card, 'branch_variant'))
    : undefined;

  // 기존 자식 ShapeVector 탐색
  const existingShapeVector = card.children.find(
    (c) => (c.name === 'ShapeVector' || c.name === 'DiamondShape') && (c.type === 'VECTOR' || c.type === 'FRAME')
  ) as (VectorNode | FrameNode) | undefined;

  // 3. 테마 및 색상 계산
  const prevTheme = (safeGetPluginData(card, 'node_theme') as 'light' | 'dark') || 'light';
  const isDark = (patch.theme !== undefined ? patch.theme : prevTheme) === 'dark';

  let isFillNone = false;
  let bgColor: RGB = isDark ? { r: 0.14, g: 0.14, b: 0.15 } : { r: 1, g: 1, b: 1 };

  if (patch.colorHex !== undefined) {
    isFillNone = patch.colorHex.toLowerCase() === 'none' || patch.colorHex.toLowerCase() === 'transparent';
    if (!isFillNone) {
      bgColor = hexToRgbColor(patch.colorHex);
    }
  } else {
    if (isShapeNode && existingShapeVector && 'fills' in existingShapeVector && Array.isArray(existingShapeVector.fills) && existingShapeVector.fills.length > 0 && existingShapeVector.fills[0].type === 'SOLID') {
      bgColor = existingShapeVector.fills[0].color;
      isFillNone = false;
    } else {
      const currentFill = card.fills;
      if (Array.isArray(currentFill) && currentFill.length > 0 && currentFill[0].type === 'SOLID') {
        bgColor = currentFill[0].color;
      } else if (!Array.isArray(currentFill) || currentFill.length === 0) {
        isFillNone = true;
      }
    }
  }

  const { titleFill, descFill, isBgDark } = getTextFillsByBackground(
    isFillNone ? { r: 1, g: 1, b: 1 } : bgColor
  );

  const borderColor: RGB = isBgDark ? { r: 0.28, g: 0.28, b: 0.3 } : { r: 0.15, g: 0.15, b: 0.18 };

  // 4. Fills 및 Strokes 적용
  const vectorPathData = getShapeVectorData(nodeType, card.width, card.height, batchBranchVariant);
  if (patch.colorHex !== undefined) {
    if (vectorPathData || isFillNone) {
      card.fills = [];
    } else {
      card.fills = [{ type: 'SOLID', color: bgColor }];
    }
  }

  if (card.layoutMode !== 'VERTICAL') {
    card.layoutMode = 'VERTICAL';
  }
  card.counterAxisAlignItems = isShapeNode ? 'CENTER' : 'MIN';
  card.primaryAxisAlignItems = isShapeNode ? 'CENTER' : 'MIN';
  if (isShapeNode) {
    card.itemSpacing = 0;
  }

  let existingStrokeWeight = 1.5;
  let existingStrokeColor: RGB | null = null;
  if (isShapeNode && existingShapeVector) {
    if ('strokeWeight' in existingShapeVector && typeof existingShapeVector.strokeWeight === 'number') {
      existingStrokeWeight = existingShapeVector.strokeWeight;
    }
    if ('strokes' in existingShapeVector && Array.isArray(existingShapeVector.strokes) && existingShapeVector.strokes.length > 0 && existingShapeVector.strokes[0]?.type === 'SOLID') {
      existingStrokeColor = existingShapeVector.strokes[0].color;
    }
  } else {
    if (typeof card.strokeWeight === 'number') {
      existingStrokeWeight = card.strokeWeight;
    }
    if (Array.isArray(card.strokes) && card.strokes.length > 0 && card.strokes[0]?.type === 'SOLID') {
      existingStrokeColor = card.strokes[0].color;
    }
  }

  const cardStrokeWeight = batchBranchVariant && !branchVariantUsesStroke(batchBranchVariant)
    ? 0
    : (patch.strokeWeight !== undefined ? clampStrokeWeight(patch.strokeWeight) : existingStrokeWeight);

  if (patch.strokeWeight !== undefined || patch.strokeColor !== undefined) {
    if (!vectorPathData) {
      if (cardStrokeWeight === 0) {
        card.strokes = [];
        card.strokeWeight = 0;
      } else {
        const strokeCol = patch.strokeColor ? hexToRgbColor(patch.strokeColor) : (existingStrokeColor || borderColor);
        card.strokes = [{ type: 'SOLID', color: strokeCol }];
        card.strokeWeight = cardStrokeWeight;
        card.strokeAlign = 'INSIDE';
        if ('strokesIncludedInLayout' in card) {
          card.strokesIncludedInLayout = true;
        }
      }
    }
  }

  // 5. 타이틀 결정
  const DEFAULT_SHAPE_NAMES = new Set([
    'Decision', 'Process', 'Connector', 'Terminator', 'Branch',
    'Action', 'System', 'Database', 'Square', 'Junction', 'Diamond', 'Pill', 'Capsule',
    'Check', 'Cross', 'Yes', 'No', 'True', 'False', 'Tag', 'Circle',
  ]);
  const currentTitle = patch.title !== undefined ? patch.title.trim() : (card.name || safeGetPluginData(card, 'node_title') || '');
  const incomingIsPlaceholder = !currentTitle
    || currentTitle === 'Untitled'
    || DEFAULT_SHAPE_NAMES.has(currentTitle)
    || (prevBranchVariant ? currentTitle === BRANCH_VARIANT_LABELS[prevBranchVariant] : false);
  const leavingUntitledBranch = prevNodeType === 'Branch'
    && nodeType !== 'Branch'
    && Boolean(prevBranchVariant && !branchVariantHasTitle(prevBranchVariant));

  const targetDefaultTitle = getDefaultNodeTitle(nodeType, batchBranchVariant);
  const branchVariantChanged = Boolean(
    batchBranchVariant && prevBranchVariant && batchBranchVariant !== prevBranchVariant
  );
  const nodeTypeChanged = prevNodeType !== nodeType;
  let effectiveTitle = currentTitle;
  if ((leavingUntitledBranch && incomingIsPlaceholder) || (isChangingToScreen && incomingIsPlaceholder)) {
    effectiveTitle = targetDefaultTitle;
  } else if (
    batchBranchVariant
    && isDefaultNodeTitle(currentTitle)
    && (
      nodeTypeChanged
      || branchVariantChanged
      || currentTitle === targetDefaultTitle
      || currentTitle === 'Branch'
      || currentTitle === 'Screen'
    )
  ) {
    // 선택한 Check / Cross / Tag 이름을 유지한다. 타입명 "Branch"로 덮지 않는다.
    effectiveTitle = targetDefaultTitle;
  } else if (patch.nodeType !== undefined && nodeType !== 'Branch' && !isChangingToScreen && DEFAULT_SHAPE_NAMES.has(currentTitle)) {
    effectiveTitle = nodeType;
  }
  if (batchBranchVariant === 'TAG') {
    effectiveTitle = clampTitleChars(effectiveTitle);
  }
  card.name = effectiveTitle;
  card.clipsContent = false;

  // 6. 치수(Size) 계산 및 Dormant Screen 치수 보존/복원
  const savedScreenW = safeGetPluginData(card, 'screen_width');
  const savedScreenH = safeGetPluginData(card, 'screen_height');
  const savedScreenR = safeGetPluginData(card, 'screen_corner_radius');
  const restoredScreenW = savedScreenW ? parseInt(savedScreenW, 10) : spec.width;
  const restoredScreenH = savedScreenH ? parseInt(savedScreenH, 10) : spec.height;
  const restoredScreenR = savedScreenR !== '' && savedScreenR !== undefined ? parseInt(savedScreenR, 10) : (spec.cornerRadius ?? 0);

  const prevSizeMode = (safeGetPluginData(card, 'size_mode') as 'fixed' | 'hug' | 'fit') || 'fixed';
  const effectiveSizeMode = (!isShapeNode && patch.sizeMode !== undefined) ? patch.sizeMode : prevSizeMode;
  const isChangingFromFitToFixed = prevSizeMode === 'fit' && effectiveSizeMode === 'fixed';

  let targetW: number;
  let targetH: number;
  let targetR: number;

  if (isShapeNode) {
    targetW = spec.width;
    targetH = spec.height;
    targetR = spec.cornerRadius ?? 0;
    if (batchBranchVariant === 'TAG') {
      targetW = await resolveTagCardWidth(effectiveTitle, spec.width);
    }
  } else if (isChangingToScreen) {
    targetW = patch.width !== undefined ? clampScreenWidth(patch.width) : (restoredScreenW ? clampScreenWidth(restoredScreenW) : spec.width);
    targetH = patch.height !== undefined ? clampScreenHeight(patch.height) : (restoredScreenH ? clampScreenHeight(restoredScreenH) : spec.height);
    targetR = patch.cornerRadius !== undefined ? clampScreenCornerRadius(patch.cornerRadius) : clampScreenCornerRadius(restoredScreenR);
  } else if (isChangingFromFitToFixed) {
    targetW = patch.width !== undefined ? clampScreenWidth(patch.width) : (restoredScreenW ? clampScreenWidth(restoredScreenW) : clampScreenWidth(card.width));
    targetH = patch.height !== undefined ? clampScreenHeight(patch.height) : (restoredScreenH ? clampScreenHeight(restoredScreenH) : clampScreenHeight(card.height));
    targetR = patch.cornerRadius !== undefined ? clampScreenCornerRadius(patch.cornerRadius) : (typeof card.cornerRadius === 'number' ? card.cornerRadius : 0);
  } else {
    targetW = patch.width !== undefined ? clampScreenWidth(patch.width) : clampScreenWidth(card.width);
    targetH = patch.height !== undefined ? clampScreenHeight(patch.height) : clampScreenHeight(card.height);
    targetR = patch.cornerRadius !== undefined ? clampScreenCornerRadius(patch.cornerRadius) : (typeof card.cornerRadius === 'number' ? card.cornerRadius : (spec.cornerRadius ?? 0));
  }

  if (nodeType === 'Screen' || nodeType === 'Process' || nodeType === 'Branch') {
    card.cornerRadius = targetR;
  } else {
    card.cornerRadius = spec.cornerRadius ?? 0;
  }

  // 7. 설명, 상태, 링크 유효값 계산
  const prevDesc = safeGetPluginData(card, 'node_desc') || '';
  const existingDescChild = card.children.find(
    (c) => c.name === 'DescText' || safeGetPluginData(c, 'node_role') === 'desc'
  ) as TextNode | undefined;

  const isDescOn = !isShapeNode && (
    patch.descriptionOn !== undefined
      ? patch.descriptionOn
      : (patch.description !== undefined ? Boolean(patch.description.trim()) : Boolean(existingDescChild || prevDesc.trim()))
  );

  let effectiveDesc = '';
  if (!isShapeNode) {
    if (patch.description !== undefined && patch.description.trim() !== '') {
      effectiveDesc = patch.description.trim();
    } else if (isChangingToScreen || isDescOn) {
      effectiveDesc = prevDesc.trim();
    } else {
      effectiveDesc = (patch.description !== undefined ? patch.description : prevDesc).trim();
    }
  }

  const prevStatus = (safeGetPluginData(card, 'workflow_status') || '') as WorkflowStatus;
  const effectiveStatus = (!isShapeNode
    ? (patch.status !== undefined
        ? patch.status
        : (isChangingToScreen ? prevStatus : prevStatus))
    : '') as WorkflowStatus;

  const prevFigmaLink = safeGetPluginData(card, 'figma_link') || safeGetPluginData(card, 'cached_figma_link') || '';
  const isExplicitLinkClear = Boolean(
    patch.clearLinkCache ||
    (!isChangingToScreen && patch.figmaLink !== undefined && patch.figmaLink.trim() === '')
  );
  const shouldClearLinkCache = isExplicitLinkClear;

  let effectiveLink = '';
  if (!isShapeNode) {
    if (isExplicitLinkClear) {
      effectiveLink = '';
    } else if (isChangingToScreen) {
      effectiveLink = (patch.figmaLink !== undefined && patch.figmaLink.trim() !== '')
        ? patch.figmaLink.trim()
        : prevFigmaLink;
    } else if (patch.figmaLink !== undefined) {
      effectiveLink = patch.figmaLink.trim();
    } else {
      effectiveLink = safeGetPluginData(card, 'figma_link') || '';
    }
  }

  let fitW: number | undefined;
  if (!isShapeNode && effectiveSizeMode === 'fit') {
    fitW = await calculateScreenFitWidth(
      card,
      effectiveTitle,
      effectiveStatus,
      effectiveLink
    );
  }

  // 8. Vector Path Shape 부착 또는 제거
  if (vectorPathData) {
    card.fills = [];
    card.strokes = [];
    card.strokeWeight = 0;
    card.cornerRadius = 0;

    if (existingShapeVector) {
      existingShapeVector.remove();
    }
    const defaultStrokeCol = existingStrokeColor || (batchBranchVariant ? hexToRgbColor('#1E1E1E') : borderColor);
    const strokeCol = patch.strokeColor
      ? hexToRgbColor(patch.strokeColor)
      : defaultStrokeCol;
    attachShapeVectorNode(card, nodeType, targetW, targetH, bgColor, strokeCol, cardStrokeWeight, true, batchBranchVariant, isFillNone);
  } else {
    if (existingShapeVector) {
      existingShapeVector.remove();
    }
    removeBranchMark(card);
  }

  // 9. Shape 전환 시 캔버스 뱃지 정리 (Dormant Data는 보존)
  if (isShapeNode) {
    const existingStatusBadge = card.children.find(
      (c) => safeGetPluginData(c, 'is_status_badge') === 'true' || c.name === 'StatusBadge'
    );
    if (existingStatusBadge) existingStatusBadge.remove();

    const existingLinkBadge = card.children.find(
      (c) => safeGetPluginData(c, 'is_figma_link_badge') === 'true' || c.name === 'FigmaLinkBadge'
    );
    if (existingLinkBadge) existingLinkBadge.remove();
  }

  // 10. Header 및 TitleText 갱신
  let titleText = card.findOne(
    (c) => c.type === 'TEXT' && (c.name === 'TitleText' || safeGetPluginData(c, 'node_role') === 'title')
  ) as TextNode | null;

  if (isShapeNode) {
    const existingHeader = card.children.find(isHeaderFrame) as FrameNode | undefined;
    if (existingHeader) {
      if (!titleText) {
        titleText = existingHeader.children.find((c) => c.type === 'TEXT') as TextNode | null;
      }
      if (titleText && titleText.parent === existingHeader) {
        card.appendChild(titleText);
      }
      existingHeader.remove();
    }

    if (!titleText) {
      titleText = figma.createText();
      titleText.name = 'TitleText';
      titleText.fontName = { family: 'Inter', style: 'Bold' };
      titleText.fontSize = 13;
      titleText.setPluginData('node_role', 'title');
      card.appendChild(titleText);
    }

    const showBranchTitle = Boolean(batchBranchVariant && branchVariantHasTitle(batchBranchVariant));
    titleText.layoutAlign = 'STRETCH';
    titleText.textAlignHorizontal = 'CENTER';
    titleText.textAlignVertical = 'CENTER';
    titleText.lineHeight = { value: showBranchTitle ? 22 : 18, unit: 'PIXELS' };
    titleText.visible = !batchBranchVariant || showBranchTitle;
    bindShapeTitle(
      titleText,
      nodeType === 'Decision' ? 'decision' : (showBranchTitle ? 'tag' : 'shape')
    );
    await safeSetCharacters(titleText, (batchBranchVariant && !showBranchTitle) ? '' : effectiveTitle);
    const hasExistingTitleFill = titleText.fills === figma.mixed || (Array.isArray(titleText.fills) && titleText.fills.length > 0);
    if (!hasExistingTitleFill || patch.colorHex) {
      applyFigmaTextFill(titleText, titleFill);
    }
  } else {
    let headerRow = card.children.find(isHeaderFrame) as FrameNode | undefined;
    if (!headerRow) {
      headerRow = figma.createFrame();
      headerRow.name = 'Header';
      headerRow.fills = [];
      card.insertChild(0, headerRow);
    }
    headerRow.layoutMode = 'VERTICAL';
    headerRow.layoutAlign = 'STRETCH';
    headerRow.primaryAxisSizingMode = 'AUTO';
    headerRow.counterAxisSizingMode = 'AUTO';
    headerRow.primaryAxisAlignItems = 'MIN';
    headerRow.counterAxisAlignItems = 'MIN';
    headerRow.itemSpacing = 0;
    headerRow.paddingLeft = 0;
    headerRow.paddingRight = 0;
    headerRow.paddingTop = 0;
    headerRow.paddingBottom = 0;

    if (!titleText) {
      titleText = figma.createText();
      titleText.name = 'TitleText';
      titleText.fontName = { family: 'Inter', style: 'Bold' };
      titleText.fontSize = 13;
      titleText.setPluginData('node_role', 'title');
      headerRow.appendChild(titleText);
    } else if (titleText.parent !== headerRow) {
      headerRow.appendChild(titleText);
    }

    titleText.visible = true;
    titleText.lineHeight = { value: 18, unit: 'PIXELS' };
    titleText.textAlignHorizontal = 'LEFT';
    titleText.textAlignVertical = 'TOP';
    titleText.layoutAlign = 'STRETCH';
    titleText.textAutoResize = 'HEIGHT';
    titleText.fontName = { family: 'Inter', style: 'Bold' };
    await safeSetCharacters(titleText, effectiveTitle);
    titleText.textTruncation = 'DISABLED';
    titleText.maxLines = null;
    try { titleText.maxHeight = null; } catch (_) {}
    const hasExistingTitleFill = titleText.fills === figma.mixed || (Array.isArray(titleText.fills) && titleText.fills.length > 0);
    if (!hasExistingTitleFill || patch.colorHex) {
      applyFigmaTextFill(titleText, titleFill);
    }
  }

  // 11. DescriptionText 갱신
  let descText = card.children.find(
    (c) => c.name === 'DescText' || safeGetPluginData(c, 'node_role') === 'desc'
  ) as TextNode | undefined;

  if (isShapeNode || !isDescOn || !effectiveDesc) {
    if (descText) {
      descText.remove();
      descText = undefined;
    }
  } else {
    const isNewDesc = !descText;
    if (!descText) {
      descText = figma.createText();
      descText.name = 'DescText';
      descText.setPluginData('node_role', 'desc');
    }

    descText.textAlignHorizontal = 'LEFT';
    descText.layoutAlign = 'STRETCH';
    const descStrokeOffset = (typeof card.strokeWeight === 'number' ? card.strokeWeight : 0) * 2;
    const descAvailW = Math.max(10, (fitW !== undefined ? fitW : targetW) - 32 - descStrokeOffset);
    descText.fontName = { family: 'Inter', style: 'Regular' };
    descText.fontSize = 11;
    descText.lineHeight = { value: DESC_LINE_HEIGHT, unit: 'PIXELS' };
    descText.characters = effectiveDesc;
    descText.textAutoResize = 'HEIGHT';
    descText.resize(descAvailW, descText.height || 16);

    if (!isShapeNode && (effectiveSizeMode === 'fit' || effectiveSizeMode === 'hug')) {
      descText.maxLines = null;
      try { descText.maxHeight = null; } catch (_) {}
      descText.textTruncation = 'DISABLED';
    } else if (isChangingToScreen || effectiveSizeMode === 'fixed') {
      descText.textTruncation = 'ENDING';
      const pb = (effectiveStatus || effectiveLink) ? 36 : 16;
      const headerRow = card.children.find(isHeaderFrame) as FrameNode | undefined;
      const headerH = headerRow ? headerRow.height : 18;
      const availableH = Math.max(14, targetH - 14 - pb - 8 - Math.round(headerH));
      descText.maxLines = Math.max(1, Math.floor(availableH / DESC_LINE_HEIGHT));
    } else {
      await updateDescTextTruncation(card, descText, targetH, effectiveDesc, targetW);
    }

    const hasExistingDescFill = descText.fills === figma.mixed || (Array.isArray(descText.fills) && descText.fills.length > 0);
    if (!hasExistingDescFill || patch.colorHex) {
      applyFigmaTextFill(descText, descFill);
    }

    if (isNewDesc || descText.parent !== card) {
      card.appendChild(descText);
    }
  }

  // 12. 패딩 설정
  const hasBottomBar = !isShapeNode && Boolean(effectiveStatus || effectiveLink);
  if (isShapeNode) {
    const showBranchTitle = Boolean(batchBranchVariant && branchVariantHasTitle(batchBranchVariant));
    const hPad = batchBranchVariant
      ? (showBranchTitle ? TAG_TITLE_PAD_X : 0)
      : (nodeType === 'Decision' ? 24 : 12);
    card.paddingLeft = hPad;
    card.paddingRight = hPad;
    card.paddingTop = batchBranchVariant ? (showBranchTitle ? 5 : 0) : 12;
    card.paddingBottom = batchBranchVariant ? (showBranchTitle ? 5 : 0) : 12;
    card.primaryAxisAlignItems = 'CENTER';
    card.counterAxisAlignItems = 'CENTER';
    card.itemSpacing = 0;
  } else {
    card.itemSpacing = 8;
    card.paddingLeft = 16;
    card.paddingRight = 16;
    card.paddingTop = 14;
    card.paddingBottom = hasBottomBar ? 36 : (isDescOn ? 16 : 14);
    card.primaryAxisAlignItems = 'MIN';
    card.counterAxisAlignItems = 'MIN';
  }

  // 13. 상태 뱃지 갱신
  let statusBadge = !isShapeNode ? (card.children.find(
    (c) => safeGetPluginData(c, 'is_status_badge') === 'true' || c.name === 'StatusBadge'
  ) as FrameNode | undefined) : undefined;

  if (!isShapeNode && effectiveStatus && STATUS_CONFIG[effectiveStatus]) {
    if (!statusBadge) {
      statusBadge = figma.createFrame();
      statusBadge.name = 'StatusBadge';
      statusBadge.layoutMode = 'HORIZONTAL';
      statusBadge.primaryAxisSizingMode = 'AUTO';
      statusBadge.counterAxisSizingMode = 'AUTO';
      statusBadge.primaryAxisAlignItems = 'CENTER';
      statusBadge.counterAxisAlignItems = 'CENTER';
      statusBadge.paddingLeft = 9;
      statusBadge.paddingRight = 9;
      statusBadge.paddingTop = 3;
      statusBadge.paddingBottom = 3;
      statusBadge.cornerRadius = getStatusBadgeCornerRadius(
        typeof card.cornerRadius === 'number' ? card.cornerRadius : 0
      );
      statusBadge.setPluginData('is_status_badge', 'true');

      const badgeText = figma.createText();
      badgeText.name = 'StatusText';
      badgeText.fontName = { family: 'Inter', style: 'Bold' };
      badgeText.fontSize = 9;
      const cfg = STATUS_CONFIG[effectiveStatus];
      if (cfg) {
        badgeText.characters = cfg.label.toUpperCase();
      }
      badgeText.textAutoResize = 'WIDTH_AND_HEIGHT';
      badgeText.locked = true;
      statusBadge.appendChild(badgeText);

      const badgeW = Math.round(badgeText.width + 18);
      const badgeH = Math.round(badgeText.height + 6);
      statusBadge.resize(badgeW, badgeH);

      card.appendChild(statusBadge);
      if ((card.layoutMode as any) !== 'NONE') {
        statusBadge.layoutPositioning = 'ABSOLUTE';
      }
      statusBadge.constraints = { horizontal: 'MAX', vertical: 'MAX' };
      statusBadge.locked = true;
    }

    statusBadge.paddingLeft = 9;
    statusBadge.paddingRight = 9;
    statusBadge.cornerRadius = getStatusBadgeCornerRadius(
      typeof card.cornerRadius === 'number' ? card.cornerRadius : 0
    );
    statusBadge.constraints = { horizontal: 'MAX', vertical: 'MAX' };

    const { badgeBg, badgeTextColor } = getStatusBadgeColors(effectiveStatus, bgColor, isDark);
    statusBadge.fills = [{ type: 'SOLID', color: badgeBg }];
    const bText = statusBadge.children.find((c) => c.type === 'TEXT') as TextNode | undefined;
    if (bText) {
      bText.locked = false;
      const statusLabel = STATUS_CONFIG[effectiveStatus]?.label || effectiveStatus;
      await safeSetCharacters(bText, statusLabel.toUpperCase());
      bText.fills = [{ type: 'SOLID', color: badgeTextColor }];
      bText.locked = true;
    }
  } else if (statusBadge && (!effectiveStatus || isShapeNode)) {
    statusBadge.remove();
    statusBadge = undefined;
  }

  // 14. 링크 뱃지 갱신
  if (!isShapeNode) {
    await updateFigmaLinkBadge(card, effectiveLink, isBgDark, shouldClearLinkCache);
  }

  // 15. 스텝 배지 갱신 & 보존
  const existingStepBadge = card.children.find(
    (c) => c.name.startsWith('[Step]') || safeGetPluginData(c, 'is_step_badge') === 'true'
  ) as FrameNode | undefined;

  if (!supportsTargetOption('stepBadge')) {
    // Step Badge 미지원 노드: 캔버스 뱃지만 정리하고 플러그인데이터는 보존
    if (existingStepBadge) existingStepBadge.remove();
  } else if (patch.badgeOn === false) {
    // 명시적 뱃지 해제 시에만 플러그인데이터 제거
    card.setPluginData('step_number', '');
    card.setPluginData('badge_corner', '');
    card.setPluginData('badge_shape', '');
    card.setPluginData('badge_color_mode', '');
    if (existingStepBadge) existingStepBadge.remove();
  } else if (
    patch.badgeOn === true ||
    patch.badgeNumber !== undefined ||
    patch.badgeCorner !== undefined ||
    patch.badgePosition !== undefined ||
    patch.badgeShape !== undefined ||
    patch.badgeColorMode !== undefined
  ) {
    const curNum = safeGetPluginData(card, 'step_number') ? parseInt(safeGetPluginData(card, 'step_number'), 10) : 1;
    const curCorner = safeGetPluginData(card, 'badge_corner') || 'TOP_LEFT';
    const curShape = safeGetPluginData(card, 'badge_shape') || 'Square';
    const curMode = (safeGetPluginData(card, 'badge_color_mode') as 'White' | 'Black' | 'Style') || 'Style';

    const finalNum = patch.badgeNumber !== undefined ? patch.badgeNumber : curNum;
    const finalCorner = patch.badgeCorner !== undefined ? patch.badgeCorner : (patch.badgePosition !== undefined ? patch.badgePosition : curCorner);
    const finalShape = patch.badgeShape !== undefined ? patch.badgeShape : curShape;
    const finalMode = patch.badgeColorMode !== undefined ? patch.badgeColorMode : curMode;

    await applyStepBadgeToSingleCard(card, finalNum, finalCorner as BadgePosition, finalShape as BadgeShape, finalMode as 'White' | 'Black' | 'Style');
  } else if (!existingStepBadge && safeGetPluginData(card, 'step_number') && isChangingToScreen) {
    // Step Badge 지원 노드로 복귀 시 보존된 dormant 뱃지 복원
    const savedNumStr = safeGetPluginData(card, 'step_number');
    const curNum = savedNumStr ? parseInt(savedNumStr, 10) : 1;
    const curCorner = (safeGetPluginData(card, 'badge_corner') as BadgePosition) || 'TOP_LEFT';
    const curShape = (safeGetPluginData(card, 'badge_shape') as BadgeShape) || 'Square';
    const curMode = (safeGetPluginData(card, 'badge_color_mode') as 'White' | 'Black' | 'Style') || 'Style';
    await applyStepBadgeToSingleCard(card, curNum, curCorner, curShape, curMode);
  } else if (existingStepBadge && patch.colorHex !== undefined) {
    const stepText = existingStepBadge.children.find((c) => c.type === 'TEXT') as TextNode | undefined;
    if (stepText) {
      const currentMode = (safeGetPluginData(card, 'badge_color_mode') as 'White' | 'Black' | 'Style') || 'Style';
      applyStepBadgeColors(existingStepBadge, stepText, currentMode, card);
    }
  }

  // 16. 최종 리사이즈 및 레이아웃
  const isHug = !isShapeNode && effectiveSizeMode === 'hug';
  const isFit = !isShapeNode && effectiveSizeMode === 'fit';
  const finalW = isFit && fitW !== undefined ? fitW : (nodeType === 'Screen' ? clampScreenWidth(targetW) : (batchBranchVariant ? targetW : Math.max(50, targetW)));
  const finalH = nodeType === 'Screen' ? clampScreenHeight(targetH) : (batchBranchVariant ? targetH : Math.max(40, targetH));

  card.minWidth = null;
  card.maxWidth = null;
  card.minHeight = null;
  card.maxHeight = null;

  if (isHug || isFit) {
    if (descText) {
      descText.maxLines = null;
      try { descText.maxHeight = null; } catch (_) {}
      descText.textTruncation = 'DISABLED';
      const descStrokeOffset = (typeof card.strokeWeight === 'number' ? card.strokeWeight : 0) * 2;
      const descAvailW = Math.max(10, finalW - card.paddingLeft - card.paddingRight - descStrokeOffset);
      try { descText.resize(descAvailW, descText.height); } catch (_) {}
    }
    const minH = nodeType === 'Screen' ? SCREEN_NODE_CONSTRAINTS.MIN_HEIGHT : 49;
    card.counterAxisSizingMode = 'FIXED';
    card.minWidth = finalW;
    card.maxWidth = finalW;
    card.minHeight = minH;
    card.maxHeight = null;
    card.primaryAxisSizingMode = 'AUTO';
    card.resize(finalW, Math.max(minH, card.height));
    syncTitleWidthToCard(card, finalW, nodeType);

    const autoH = Math.max(minH, Math.round(card.height));
    card.resize(finalW, autoH);
    card.primaryAxisSizingMode = 'AUTO';
    card.counterAxisSizingMode = 'FIXED';
    card.setPluginData('size_mode', isFit ? 'fit' : 'hug');
  } else {
    card.primaryAxisSizingMode = 'FIXED';
    card.counterAxisSizingMode = 'FIXED';
    card.resize(finalW, finalH);
    card.minWidth = finalW;
    card.maxWidth = finalW;
    card.minHeight = finalH;
    card.maxHeight = finalH;
    card.setPluginData('size_mode', effectiveSizeMode);
    syncTitleWidthToCard(card, finalW, nodeType);
  }

  const curH = card.height;
  if (statusBadge) {
    statusBadge.constraints = { horizontal: 'MAX', vertical: 'MAX' };
    statusBadge.x = finalW - statusBadge.width - 10;
    statusBadge.y = curH - statusBadge.height - 10;
  }
  const linkBadge = card.children.find(
    (c) => safeGetPluginData(c, 'is_figma_link_badge') === 'true' || c.name === 'FigmaLinkBadge'
  ) as FrameNode | undefined;
  if (linkBadge) {
    linkBadge.constraints = { horizontal: 'MIN', vertical: 'MAX' };
    linkBadge.x = 16;
    linkBadge.y = curH - linkBadge.height - 10;
  }

  const curStepBadge = card.children.find(
    (c) => c.name.startsWith('[Step]') || safeGetPluginData(c, 'is_step_badge') === 'true'
  ) as FrameNode | undefined;
  if (curStepBadge) {
    const stepCorner = safeGetPluginData(card, 'badge_corner') || 'TOP_LEFT';
    const bw = Math.max(24, Math.round(curStepBadge.width));
    const bh = 24;
    const badgeCoords = getStepBadgeCoordinates(nodeType, finalW, curH, bw, bh, stepCorner, batchBranchVariant);
    curStepBadge.x = badgeCoords.x;
    curStepBadge.y = badgeCoords.y;
    curStepBadge.constraints = badgeCoords.constraints;
  }

  const shapeVec = card.children.find(
    (c) => (c.name === 'ShapeVector' || c.name === 'DiamondShape')
  ) as (VectorNode | FrameNode) | undefined;
  if (shapeVec) {
    shapeVec.remove();
    if (isShapeNode) {
      const defaultStrokeCol = existingStrokeColor || (batchBranchVariant ? hexToRgbColor('#1E1E1E') : borderColor);
      const strokeCol = patch.strokeColor ? hexToRgbColor(patch.strokeColor) : defaultStrokeCol;
      attachShapeVectorNode(card, nodeType, finalW, finalH, bgColor, strokeCol, cardStrokeWeight, true, batchBranchVariant, isFillNone);
    }
  }

  // 17. PluginData 동기화 및 Dormant Data 보존
  card.setPluginData('is_flow_node', 'true');
  card.setPluginData('schema_version', '2');
  card.setPluginData('node_title', '');
  card.setPluginData('node_tag', '');
  card.setPluginData('node_width', '');
  card.setPluginData('node_height', '');

  if (nodeType === 'Screen') {
    if (!isFit) {
      card.setPluginData('screen_width', String(finalW));
      card.setPluginData('screen_height', String(isHug ? Math.round(card.height) : finalH));
    }
    card.setPluginData('screen_corner_radius', String(card.cornerRadius || 0));
    card.setPluginData('screen_size_mode', effectiveSizeMode);
  }

  if (supportsTargetOption('description')) {
    if (isChangingToScreen) {
      const descToSave = (patch.description !== undefined && patch.description.trim() !== '')
        ? patch.description.trim()
        : prevDesc;
      if (descToSave) {
        card.setPluginData('node_desc', descToSave);
      }
      if (patch.descriptionOn !== undefined) {
        card.setPluginData('description_on', patch.descriptionOn ? 'true' : '');
      } else if (descToSave) {
        card.setPluginData('description_on', 'true');
      }
    } else if (patch.description !== undefined) {
      if (patch.description === '') {
        card.setPluginData('node_desc', '');
      } else {
        card.setPluginData('node_desc', patch.description.trim());
      }
      if (patch.descriptionOn !== undefined) {
        card.setPluginData('description_on', patch.descriptionOn ? 'true' : '');
      }
    } else if (patch.descriptionOn !== undefined) {
      card.setPluginData('description_on', patch.descriptionOn ? 'true' : '');
    }
  }

  if (supportsTargetOption('status')) {
    if (isChangingToScreen) {
      const statusToSave = (patch.status !== undefined && patch.status !== '')
        ? patch.status
        : prevStatus;
      if (statusToSave) {
        card.setPluginData('workflow_status', statusToSave);
      }
    } else if (patch.status !== undefined) {
      card.setPluginData('workflow_status', patch.status);
    }
  }

  if (supportsTargetOption('figmaLink')) {
    if (shouldClearLinkCache) {
      card.setPluginData('figma_link', '');
      card.setPluginData('cached_figma_link', '');
    } else if (effectiveLink) {
      card.setPluginData('figma_link', effectiveLink);
      card.setPluginData('cached_figma_link', effectiveLink);
    }
  }

  if (supportsTargetOption('elevation')) {
    if (patch.elevation === null) {
      card.setPluginData('node_elevation', '');
      card.effects = [];
    } else if (typeof patch.elevation === 'number') {
      card.setPluginData('node_elevation', `${patch.elevation}`);
      card.effects = getElevationEffects(patch.elevation, isBgDark);
      card.clipsContent = false;
    } else if (patch.elevation === undefined) {
      // Screen/Shape 지원 타입 복귀 시 또는 colorHex 변경 시: 저장된 node_elevation으로 effects 복원 및 재적용
      const curElev = safeGetPluginData(card, 'node_elevation');
      if (curElev) {
        const lvl = parseInt(curElev, 10);
        if (!isNaN(lvl)) {
          card.effects = getElevationEffects(lvl, isBgDark);
          card.clipsContent = false;
        }
      }
    }
  } else {
    // Elevation 미지원 노드: visual effect만 끄고 node_elevation pluginData는 완벽 보존
    card.effects = [];
  }

  if (patch.theme) card.setPluginData('node_theme', patch.theme);
  if (patch.nodeType !== undefined) {
    card.setPluginData('node_type', nodeType);
  }
  if (batchBranchVariant) {
    card.setPluginData('branch_variant', batchBranchVariant);
  } else if (nodeType !== 'Branch') {
    card.setPluginData('branch_variant', '');
  }
}

// ----------------------------------------------------
// 4. 노드 상세정보 실시간 수정 기능
// ----------------------------------------------------
async function updateFlowNode(payload: UpdateNodePayload) {
  try {
    let rawNode = figma.getNodeById(payload.nodeId);
    if (!rawNode) {
      const selection = figma.currentPage.selection;
      if (selection.length > 0) rawNode = selection[0];
    }

    let flowNode = findFlowNode(rawNode) || (rawNode as FrameNode | ShapeWithTextNode | null);
    if (!flowNode) {
      notify(t('nodeNotFoundSelect'), 'warning');
      return;
    }

    // 쉐이프 노드인 경우 프레임 노드로 마이그레이션
    if (flowNode.type === 'SHAPE_WITH_TEXT') {
      flowNode = await convertShapeToFrameNode(flowNode as ShapeWithTextNode);
    }
    if (flowNode.type !== 'FRAME') return;

    await loadRequiredFonts();
    await applyNodePatch(flowNode as FrameNode, payload);

    // selection 재할당을 절대 하지 않음 (다중/단일 선택 100% 보존)
    handleSelectionChange();
    const title = (flowNode as FrameNode).name || payload.title || '노드';
    notify(t('nodeUpdated', { title }), 'success');
  } catch (err) {
    notify(t('nodeUpdateFailed', { error: String(err) }), 'error');
  }
}

// ----------------------------------------------------
// 4-1. 다중 선택(Multi Selection) 전용 배치 부분 업데이트 기능 (Batch Partial Update)
// - nodeIds 목록에 해당하는 각 노드에 patch 속성만 부분 적용 (Partial Patch)
// - 기존 updateFlowNode를 수정하지 않고 독립된 배치 경로로 실행
// - figma.currentPage.selection을 절대 변경하지 않음 (다중 선택 100% 보존)
// - 중간 SELECTION_CHANGED 발생을 차단하고, 전체 완료 후 최종 1회만 handleSelectionChange() 호출
// ----------------------------------------------------
async function batchUpdateFlowNodes(nodeIds: string[], patch: NodePatchPayload) {
  if (!nodeIds || nodeIds.length === 0 || !patch) return;

  try {
    await loadRequiredFonts();
    let updatedCount = 0;

    const targetCards: FrameNode[] = [];
    for (const id of nodeIds) {
      const rawNode = figma.getNodeById(id);
      if (!rawNode) continue;

      let flowNode = findFlowNode(rawNode) || (rawNode as FrameNode | ShapeWithTextNode | null);
      if (!flowNode) continue;

      if (flowNode.type === 'SHAPE_WITH_TEXT') {
        flowNode = await convertShapeToFrameNode(flowNode as ShapeWithTextNode);
      }
      if (flowNode.type === 'FRAME') {
        targetCards.push(flowNode as FrameNode);
      }
    }

    targetCards.sort((a, b) => a.x - b.x);

    let currentBadgeNum = patch.badgeNumber !== undefined ? patch.badgeNumber : undefined;

    for (const card of targetCards) {
      const itemPatch: FlowNodePatch = { ...patch };
      const rawType = patch.nodeType || safeGetPluginData(card, 'node_type') || 'Screen';
      const targetType = normalizeNodeType(rawType);
      const supportsBadge = supportsOption({ flowNodeType: targetType, isFlowNode: true }, 'stepBadge');

      if (currentBadgeNum !== undefined && supportsBadge) {
        itemPatch.badgeNumber = currentBadgeNum++;
      }
      await applyNodePatch(card, itemPatch);
      updatedCount++;
    }

    handleSelectionChange();
    if (updatedCount > 0) {
      notify(t('nodesBatchUpdated', { count: updatedCount }), 'success');
    }
  } catch (err) {
    notify(t('nodesBatchUpdateFailed', { error: String(err) }), 'error');
  }
}

// ----------------------------------------------------
// 5. 노드 박스 면적(Width / Height) 실시간 독립 조절 기능
// 폰트 크기나 내부 뱃지는 절대 스케일되지 않고 오직 박스 크기만 리사이즈됨
// ----------------------------------------------------
async function resizeNode(nodeId: string, width: number, height: number) {
  try {
    let rawNode = figma.getNodeById(nodeId);
    if (!rawNode) {
      const selection = figma.currentPage.selection;
      if (selection.length > 0) rawNode = selection[0];
    }

    let flowNode = findFlowNode(rawNode) || (rawNode as FrameNode | ShapeWithTextNode | null);
    if (!flowNode || !('resize' in flowNode)) return;

    if (flowNode.type === 'SHAPE_WITH_TEXT') {
      flowNode = await convertShapeToFrameNode(flowNode as ShapeWithTextNode);
    }

    const frame = flowNode as FrameNode;
    frame.minWidth = null;
    frame.maxWidth = null;
    frame.minHeight = null;
    frame.maxHeight = null;

    const rawNodeType = safeGetPluginData(frame, 'node_type');
    const nType = normalizeNodeType(rawNodeType);
    const nSpec = NODE_TYPE_SHAPE_SPECS[nType] || NODE_TYPE_SHAPE_SPECS.Screen;
    const isShape = !nSpec.allowDescription;

    const w = nType === 'Screen' ? clampScreenWidth(width) : Math.max(120, width);
    const h = nType === 'Screen' ? clampScreenHeight(height) : Math.max(50, height);

    if (frame.layoutMode !== 'VERTICAL') {
      frame.layoutMode = 'VERTICAL';
    }
    const targetAlign = isShape ? 'CENTER' : 'MIN';
    if (frame.counterAxisAlignItems !== targetAlign) {
      frame.counterAxisAlignItems = targetAlign;
    }
    if (frame.primaryAxisAlignItems !== targetAlign) {
      frame.primaryAxisAlignItems = targetAlign;
    }

    frame.resize(w, h);
    frame.primaryAxisSizingMode = 'FIXED';
    frame.counterAxisSizingMode = 'FIXED';
    frame.clipsContent = false; // 스텝 배지 및 엘리베이션이 잘리지 않도록 클리핑 해제

    frame.minWidth = w;
    frame.maxWidth = w;
    frame.minHeight = h;
    frame.maxHeight = h;

    // 헤더 타이틀 말줄임 및 정렬 동기화
    const title = frame.findOne(
      (c) => c.type === 'TEXT' && (c.name === 'TitleText' || safeGetPluginData(c, 'node_role') === 'title')
    ) as TextNode | undefined;
    if (title) {
      title.textAlignHorizontal = isShape ? 'CENTER' : 'LEFT';
      title.textAlignVertical = 'CENTER';
      try { title.lineHeight = { value: 18, unit: 'PIXELS' }; } catch (_) {}

      if (nType === 'Decision') {
        bindShapeTitle(title, 'decision');
      } else if (nType === 'Branch' && safeGetPluginData(frame, 'branch_variant') === 'TAG') {
        bindShapeTitle(title, 'tag');
      } else {
        try { title.maxHeight = null; } catch (_) {}

        if (isShape) {
          if (title.textAutoResize !== 'HEIGHT') {
            title.textAutoResize = 'HEIGHT';
          }
          title.textTruncation = 'ENDING';
          title.maxLines = 3;
        } else {
          const headerRow = frame.children.find(isHeaderFrame) as FrameNode | undefined;
          if (headerRow) {
            headerRow.layoutMode = 'VERTICAL';
            headerRow.primaryAxisSizingMode = 'AUTO';
            headerRow.primaryAxisAlignItems = 'MIN';
            headerRow.counterAxisAlignItems = 'MIN';
            try { headerRow.layoutSizingVertical = 'HUG'; } catch (_) {}
            try { headerRow.layoutSizingHorizontal = 'FILL'; } catch (_) {
              try { headerRow.layoutAlign = 'STRETCH'; } catch (_) {}
            }
          }
          if (title.layoutGrow !== 0) {
            try { title.layoutGrow = 0; } catch (_) {}
          }
          if (title.layoutAlign !== 'STRETCH') {
            try { title.layoutAlign = 'STRETCH'; } catch (_) {}
          }
          title.textAutoResize = 'HEIGHT';
          title.textTruncation = 'DISABLED';
          title.maxLines = null;
          title.textAlignVertical = 'TOP';
        }
      }
    }

    // 커스텀 도형 벡터(Junction, Diamond, Capsule) 크기 동기화
    const shapeVec = frame.children.find(
      (c) => (c.name === 'ShapeVector' || c.name === 'DiamondShape')
    ) as (VectorNode | FrameNode) | undefined;
    if (shapeVec) {
      let curBgColor: RGB = { r: 1, g: 1, b: 1 };
      let curStrokeColor: RGB = { r: 0.15, g: 0.15, b: 0.18 };
      let curStrokeWeight = 1.5;
      // fills가 비어 있으면 투명 상태이므로 재생성 때도 투명을 유지한다
      const curFillNone = !('fills' in shapeVec && Array.isArray(shapeVec.fills) && shapeVec.fills.length > 0);
      if ('fills' in shapeVec && Array.isArray(shapeVec.fills) && shapeVec.fills.length > 0 && shapeVec.fills[0].type === 'SOLID') {
        curBgColor = shapeVec.fills[0].color;
      }
      if ('strokes' in shapeVec && Array.isArray(shapeVec.strokes) && shapeVec.strokes.length > 0 && shapeVec.strokes[0].type === 'SOLID') {
        curStrokeColor = shapeVec.strokes[0].color;
      }
      if ('strokeWeight' in shapeVec && typeof shapeVec.strokeWeight === 'number') {
        curStrokeWeight = shapeVec.strokeWeight;
      }
      shapeVec.remove();
      const frameBranchVariant = nType === 'Branch'
        ? normalizeBranchVariant(safeGetPluginData(frame, 'branch_variant'))
        : undefined;
      attachShapeVectorNode(frame, nType, w, h, curBgColor, curStrokeColor, curStrokeWeight, true, frameBranchVariant, curFillNone);
    }

    // 상태 뱃지 탐색 및 패딩 동기화
    if (nType === 'Screen') {
      frame.strokeAlign = 'INSIDE';
      if ('strokesIncludedInLayout' in frame) {
        frame.strokesIncludedInLayout = true;
      }
    }
    const statusBadge = frame.children.find(
      (c) => safeGetPluginData(c, 'is_status_badge') === 'true' || c.name === 'StatusBadge'
    ) as FrameNode | undefined;
    const hasStatus = Boolean(statusBadge);
    frame.paddingBottom = hasStatus ? 36 : 16;

    // 설명 텍스트 말줄임 및 최대 줄수 동기화
    const desc = frame.children.find(
      (c) => c.name === 'DescText' || safeGetPluginData(c, 'node_role') === 'desc'
    ) as TextNode | undefined;
    if (desc) {
      desc.textAlignHorizontal = 'LEFT';
      desc.layoutAlign = 'STRETCH';
      const pl = typeof frame.paddingLeft === 'number' ? frame.paddingLeft : 16;
      const pr = typeof frame.paddingRight === 'number' ? frame.paddingRight : 16;
      const strokeOffset = (typeof frame.strokeWeight === 'number' ? frame.strokeWeight : 0) * 2;
      const availW = Math.max(10, w - pl - pr - strokeOffset);
      if (Math.abs(desc.width - availW) > 1) {
        try { desc.resize(availW, desc.height); } catch (_) {}
      }
      desc.textAutoResize = 'HEIGHT';
      await updateDescTextTruncation(frame, desc, h, undefined, w);
    }

    // 리사이즈 시 하단 오른쪽 박스 안쪽 상태 뱃지 위치 동기화
    if (statusBadge) {
      statusBadge.constraints = { horizontal: 'MAX', vertical: 'MAX' };
      statusBadge.x = w - statusBadge.width - 10;
      statusBadge.y = h - statusBadge.height - 10;
    }

    // 리사이즈 시 스텝 뱃지 위치 재동기화
    const stepBadge = frame.children.find(
      (c) => c.name.startsWith('[Step]') || safeGetPluginData(c, 'is_step_badge') === 'true'
    ) as FrameNode | undefined;
    if (stepBadge) {
      const stepCorner = safeGetPluginData(frame, 'badge_corner') || 'TOP_LEFT';
      const bw = Math.max(24, Math.round(stepBadge.width));
      const bh = 24;
      const badgeCoords = getStepBadgeCoordinates(
        nType,
        w,
        h,
        bw,
        bh,
        stepCorner,
        nType === 'Branch' ? normalizeBranchVariant(safeGetPluginData(frame, 'branch_variant')) : undefined
      );
      stepBadge.x = badgeCoords.x;
      stepBadge.y = badgeCoords.y;
      stepBadge.constraints = badgeCoords.constraints;
    }

    handleSelectionChange();
  } catch (err) {
    console.error('Resize failed', err);
  }
}


// ----------------------------------------------------
// 3. 피그잼 네이티브 커넥터(ELBOWED) 연결 (직각 & 보더 두께 일치)
// ----------------------------------------------------
function hexToRgbColor(hex: string): RGB {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return {
    r: isNaN(r) ? 0.18 : r,
    g: isNaN(g) ? 0.18 : g,
    b: isNaN(b) ? 0.22 : b,
  };
}

async function connectPoints(payload: ConnectPointsPayload) {
  try {
    let sourceNode = figma.getNodeById(payload.sourceNodeId) as SceneNode | null;
    let targetNode = figma.getNodeById(payload.targetNodeId) as SceneNode | null;

    if (!sourceNode || !targetNode) {
      notify(t('connectNodesNotFound'), 'warning');
      return;
    }

    const sourceFlow = findFlowNode(sourceNode);
    if (sourceFlow) sourceNode = sourceFlow;

    const targetFlow = findFlowNode(targetNode);
    if (targetFlow) targetNode = targetFlow;

    if (sourceNode.id === targetNode.id) {
      notify(t('connectNeedTwoDifferent'), 'warning');
      return;
    }

    await loadRequiredFonts();

    // BUG-CONNECTOR-02: 동일한 sourceNodeId -> targetNodeId 연결을 가진 기존 커넥터 탐색 및 제거 (중복 생성 방지)
    const targetSourceId = sourceNode.id;
    const targetDestId = targetNode.id;

    let existingConnector: SceneNode | null = null;
    try {
      const matchNode = figma.currentPage.findOne((n) => {
        try {
          if (!n) return false;

          // 커스텀 벡터 커넥터 검사 (GROUP 또는 단일 VECTOR)
          if (n.type === 'GROUP' || n.type === 'VECTOR') {
            const isCustom = safeGetPluginData(n, 'is_custom_connector') === 'true' || safeGetPluginData(n, 'is_flow_connector') === 'true';
            if (!isCustom) return false;

            if (safeGetPluginData(n, 'is_connector_label') === 'true' || n.name === 'ConnectorLabel') return false;

            let cSrc = safeGetPluginData(n, 'source_node_id');
            let cTgt = safeGetPluginData(n, 'target_node_id');

            if ((!cSrc || !cTgt) && n.type === 'GROUP') {
              const vChild = (n as GroupNode).findOne((child) => child.type === 'VECTOR');
              if (vChild) {
                cSrc = cSrc || safeGetPluginData(vChild, 'source_node_id');
                cTgt = cTgt || safeGetPluginData(vChild, 'target_node_id');
              }
            }

            return (cSrc === targetSourceId || cSrc === payload.sourceNodeId) &&
                   (cTgt === targetDestId || cTgt === payload.targetNodeId);
          }

          return false;
        } catch (_) {
          return false;
        }
      }) as SceneNode | null;

      if (matchNode) {
        existingConnector = findConnectorNode(matchNode) || matchNode;
      }
    } catch (err) {
      console.warn('기존 커넥터 탐색 중 오류 (생성 계속 진행):', err);
    }

    // 동일 pair 교체(net-zero) 성공 시에만 Gate 면제. 그 외(신규·제거 실패)는 +1 승인 필요.
    let replacedExisting = false;
    if (existingConnector && existingConnector.id !== sourceNode.id && existingConnector.id !== targetNode.id) {
      try {
        existingConnector.remove();
        replacedExisting = true;
      } catch (err) {
        console.warn('기존 커넥터 제거 실패:', err);
      }
    }

    // Create Gate: 신규 생성만 승인 (거부 시 생성하지 않음)
    if (!replacedExisting) {
      const createGate = approveNewElements(1);
      if (!createGate.allowed) {
        notifyLimitReached(createGate);
        return;
      }
    }

    let sourceMagnet = payload.sourceMagnet;
    let targetMagnet = payload.targetMagnet;
    const hasExplicitMagnets = Boolean(sourceMagnet && targetMagnet);
    if (!sourceMagnet || !targetMagnet) {
      const optimal = getOptimalMagnetPair(
        sceneNodePageBox(sourceNode),
        sceneNodePageBox(targetNode)
      );
      sourceMagnet = optimal.sourceMagnet;
      targetMagnet = optimal.targetMagnet;
    }

    const connector = await createSingleConnector(
      sourceNode,
      sourceMagnet,
      targetNode,
      targetMagnet,
      payload.label,
      payload.colorHex,
      payload.strokeWeight,
      payload.routingType,
      payload.startTerminal,
      payload.endTerminal,
      payload.strokePattern,
      payload.startOffset,
      payload.endOffset,
      payload.labelBoxStyle,
      payload.labelAlign,
      payload.labelFillColor,
      payload.labelStrokeColor
    );

    // 기즈모 수동 지정으로 생성되면 수동 고정 + 앵커를 기록한다. 자동 생성은 기록하지 않는다.
    if (hasExplicitMagnets) {
      try {
        const sourceBox = sceneNodePageBox(sourceNode);
        const targetBox = sceneNodePageBox(targetNode);
        const baseDx =
          targetBox.x + targetBox.width / 2 - (sourceBox.x + sourceBox.width / 2);
        const baseDy =
          targetBox.y + targetBox.height / 2 - (sourceBox.y + sourceBox.height / 2);
        connector.setPluginData('is_manual_magnet', 'true');
        connector.setPluginData('manual_base_dx', String(baseDx));
        connector.setPluginData('manual_base_dy', String(baseDy));
      } catch (_) {}
    }

    figma.currentPage.selection = [connector];
    handleSelectionChange();
    notify(payload.label ? t('connectDoneLabel', { label: payload.label }) : t('connectDone'), 'success');
  } catch (err) {
    notify(t('connectCreateFailed', { error: String(err) }), 'error');
  }
}

// 단일 커스텀 벡터 커넥터 생성 함수 (직각 ORTHOGONAL, 라운드니스 S_CURVE, 자유곡선 CURVED, 직선 STRAIGHT, 시작/끝 단자)
async function createSingleConnector(
  sourceNode: SceneNode,
  sourceMagnet: MagnetPosition,
  targetNode: SceneNode,
  targetMagnet: MagnetPosition,
  label?: string,
  colorHex?: string,
  strokeWeight?: number,
  routingType?: ConnectorRoutingType,
  startTerminal?: ConnectorTerminalType,
  endTerminal?: ConnectorTerminalType,
  strokePattern?: ConnectorStrokePattern,
  startOffset?: number,
  endOffset?: number,
  labelBoxStyle?: ConnectorLabelBoxStyle,
  labelAlign?: ConnectorLabelAlign,
  labelFillColor?: string,
  labelStrokeColor?: string
): Promise<VectorNode | GroupNode> {
  const connWeight = typeof strokeWeight === 'number' ? strokeWeight : 1.5;
  const connColor: RGB = colorHex ? hexToRgbColor(colorHex) : { r: 0, g: 0, b: 0 };

  // 커스텀 VectorNode 커넥터 생성 (선택된 라우팅 스타일 및 시작점/끝점 단자 형태에 맞춰 렌더링)
  return await createOrthogonalVectorConnector(
    sourceNode,
    sourceMagnet,
    targetNode,
    targetMagnet,
    {
      strokeWeight: connWeight,
      strokeColor: connColor,
      label,
      labelBoxStyle,
      labelAlign,
      labelFillColor,
      labelStrokeColor,
      sourceNodeId: sourceNode.id,
      targetNodeId: targetNode.id,
      routingType,
      startTerminal,
      endTerminal,
      startOffset,
      endOffset,
      strokePattern,
      labelOn: Boolean(label && label.trim()),
    }
  );
}

// 스마트 자동 직각 연결 (2개: 최단 방향 직각 연결 / 3개 이상: 캔버스 흐름에 따른 순차 연속 체인 연결 1->2->3...)
async function autoConnectSelected(label?: string) {
  try {
    const rawSelection = [...figma.currentPage.selection];
    if (rawSelection.length < 2) {
      notify(t('connectNeedTwoOrMore'), 'warning');
      return;
    }

    // 중복 제거 및 플로우 노드 매핑
    const nodesMap = new Map<string, SceneNode>();
    for (const n of rawSelection) {
      const flow = findFlowNode(n) || n;
      nodesMap.set(flow.id, flow);
    }
    let nodes = Array.from(nodesMap.values());
    if (nodes.length < 2) {
      notify(t('connectNeedTwoDifferentOrMore'), 'warning');
      return;
    }

    // 캔버스 배치 위치에 따라 상대적으로 위/왼쪽 노드 우선 정렬
    nodes = sortNodesBySpatialPosition(nodes);

    // Create Gate: 체인 전체 신규 수(N-1) 원자 승인 (거부 시 0개 생성)
    const autoGate = approveNewElements(nodes.length - 1);
    if (!autoGate.allowed) {
      notifyLimitReached(autoGate);
      return;
    }

    await loadRequiredFonts();

    // 1. 2개 선택인 경우: 정렬된 순서(출발: 위/왼쪽 -> 도착: 아래/오른쪽)로 최단 방향 직각 연결
    // 자동 연결이므로 getOptimalMagnetPair로 최단 쌍을 고른다 (수동 고정 없음).
    if (nodes.length === 2) {
      const sourceNode = nodes[0];
      const targetNode = nodes[1];

      const optimal = getOptimalMagnetPair(
        sceneNodePageBox(sourceNode),
        sceneNodePageBox(targetNode)
      );
      const sourceMagnet = optimal.sourceMagnet;
      const targetMagnet = optimal.targetMagnet;

      const conn = await createSingleConnector(sourceNode, sourceMagnet, targetNode, targetMagnet, label);
      figma.currentPage.selection = [conn];
      handleSelectionChange();
      notify(label ? t('autoConnectDoneLabel', { label }) : t('autoConnectDone'), 'success');
      return;
    }

    // 2. 3개 이상 선택인 경우: 정렬된 순차 체인 연결 (1->2->3...)

    const createdConnectors: SceneNode[] = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      const src = nodes[i];
      const tgt = nodes[i + 1];

      // 자동 체인이므로 getOptimalMagnetPair로 최단 쌍을 고른다 (수동 고정 없음).
      const optimal = getOptimalMagnetPair(
        sceneNodePageBox(src),
        sceneNodePageBox(tgt)
      );
      const srcMagnet = optimal.sourceMagnet;
      const tgtMagnet = optimal.targetMagnet;

      // 라벨이 입력된 경우 첫 번째 연결선에 표시
      const lineLabel = (i === 0 && label) ? label : undefined;
      const conn = await createSingleConnector(src, srcMagnet, tgt, tgtMagnet, lineLabel);
      createdConnectors.push(conn);
    }

    figma.currentPage.selection = createdConnectors;
    handleSelectionChange();
    notify(t('autoChainDone', { nodes: nodes.length, conns: createdConnectors.length }), 'success');
  } catch (err) {
    notify(t('autoConnectFailed', { error: String(err) }), 'error');
  }
}

// 3+ 노드 순차 체인 연결 (인접 Pair 단위 optimal magnet 생성, 기존 Pair skip, 순차 await)
async function connectChain(payload: ConnectChainPayload) {
  try {
    const rawIds = payload.orderedNodeIds || [];
    // 1. orderedNodeIds 중복 제거
    const uniqueIds: string[] = [];
    const seen = new Set<string>();
    for (const id of rawIds) {
      if (!seen.has(id)) {
        seen.add(id);
        uniqueIds.push(id);
      }
    }

    // 2. node 존재 여부 검증 및 플로우 노드 매핑
    const validNodes: SceneNode[] = [];
    for (const id of uniqueIds) {
      const node = figma.getNodeById(id) as SceneNode | null;
      if (node) {
        const flowNode = findFlowNode(node) || node;
        validNodes.push(flowNode);
      }
    }

    // 3. 유효 node가 2개 미만이면 종료
    if (validNodes.length < 2) {
      notify(t('connectNeedTwoOrMore'), 'warning');
      return;
    }

    await loadRequiredFonts();

    // 4. buildPairKeySet 1회 수행
    const validNodeIds = validNodes.map((n) => n.id);
    const existingPairKeys = buildPairKeySet(validNodeIds);

    let skippedCount = 0;

    // 4-1. 실제 신규 생성 pair 사전 확정 (원자적 Gate용: skip 제외 후 신규 수).
    // isFirstPair 규칙 보존을 위해 원본 loop index를 함께 보관한다.
    const pairsToCreate: Array<{ srcNode: SceneNode; tgtNode: SceneNode; pairIndex: number }> = [];
    for (let i = 0; i < validNodes.length - 1; i++) {
      const srcNode = validNodes[i];
      const tgtNode = validNodes[i + 1];

      // 동일 노드 간 연결 방지
      if (srcNode.id === tgtNode.id) {
        continue;
      }

      const pKey = makePairKey(srcNode.id, tgtNode.id);

      // 기존 Pair는 skip (기존 connector 절대 수정 안함)
      if (existingPairKeys.has(pKey)) {
        skippedCount++;
        continue;
      }

      pairsToCreate.push({ srcNode, tgtNode, pairIndex: i });
    }

    // Create Gate: 체인 전체 신규 수 원자 승인 (거부 시 0개 생성)
    const chainGate = approveNewElements(pairsToCreate.length);
    if (!chainGate.allowed) {
      notifyLimitReached(chainGate);
      return;
    }

    let createdCount = 0;

    // BUG-3: Gizmo Draft가 있으면 신규 pair에 반영한다.
    // - pairsToCreate의 첫 신규 pair: source = Start Draft, target = End Draft
    // - 그 다음 신규 pair: source/target = End Draft
    // - 기존 pair는 skip하므로 기존 connector를 절대 수정하지 않는다
    const chainSourceDraft = payload.sourceMagnet;
    const chainTargetDraft = payload.targetMagnet;

    // 5. 확정된 신규 Pair만 순서대로 생성
    for (let createdIndex = 0; createdIndex < pairsToCreate.length; createdIndex++) {
      const pair = pairsToCreate[createdIndex];
      const srcNode = pair.srcNode;
      const tgtNode = pair.tgtNode;
      const i = pair.pairIndex;

      const pKey = makePairKey(srcNode.id, tgtNode.id);

      // 새 Pair 생성: getOptimalMagnetPair로 최적 마그넷 계산
      const srcBox: Box = sceneNodePageBox(srcNode);
      const tgtBox: Box = sceneNodePageBox(tgtNode);
      const optimal = getOptimalMagnetPair(srcBox, tgtBox);
      const createdMagnets = resolveCreatedPairMagnets(
        createdIndex,
        chainSourceDraft,
        chainTargetDraft,
        optimal.sourceMagnet,
        optimal.targetMagnet,
      );
      const chainSourceMagnet = createdMagnets.sourceMagnet;
      const chainTargetMagnet = createdMagnets.targetMagnet;

      // Terminal / Label 규칙:
      // 첫 번째 커넥터(i === 0): 전달된 startTerminal, 전달된 endTerminal, 전달된 label
      // 이후 커넥터(i > 0): startTerminal = 'NONE', 전달된 endTerminal, label = undefined
      const isFirstPair = i === 0;
      const startTerminal = isFirstPair ? (payload.startTerminal || 'NONE') : 'NONE';
      const endTerminal = payload.endTerminal || 'ARROW';
      const label = isFirstPair ? payload.label : undefined;

      await createSingleConnector(
        srcNode,
        chainSourceMagnet,
        tgtNode,
        chainTargetMagnet,
        label,
        payload.colorHex,
        payload.strokeWeight,
        payload.routingType,
        startTerminal,
        endTerminal,
        payload.strokePattern,
        payload.startOffset,
        payload.endOffset,
        isFirstPair ? payload.labelBoxStyle : undefined,
        isFirstPair ? payload.labelAlign : undefined,
        isFirstPair ? payload.labelFillColor : undefined,
        isFirstPair ? payload.labelStrokeColor : undefined
      );

      existingPairKeys.add(pKey);
      createdCount++;
    }

    // 결과 집계 및 Core 알림
    if (createdCount === 0 && skippedCount > 0) {
      notify(t('chainExistsAll'), 'info');
    } else if (createdCount > 0 && skippedCount > 0) {
      notify(t('chainCreatedPartial', { created: createdCount, skipped: skippedCount }), 'success');
    } else if (createdCount > 0) {
      notify(t('chainCreated', { created: createdCount }), 'success');
    }

    // Selection 처리: createSingleConnector는 selection을 변경하지 않으므로 기존 노드 선택이 유지됨.
    // 생성 완료 후 handleSelectionChange를 정확히 1회 호출하여 최신 체인 상태 동기화
    await handleSelectionChange();
  } catch (err) {
    notify(t('chainFailed', { error: String(err) }), 'error');
  }
}

// 커넥터(선) 중앙 텍스트 수정 기능
async function updateConnectorLabel(connectorId: string, label: string) {
  try {
    const trimmed = label.trim();
    await updateConnectorProperties({
      connectorId,
      label,
      hasLabel: trimmed !== '',
    });
    notify(
      trimmed ? t('connectorLabelSet', { label: trimmed }) : t('connectorLabelCleared'),
      'success'
    );
    handleSelectionChange();
  } catch (err) {
    notify(t('connectorLabelFailed', { error: String(err) }), 'error');
  }
}

// 커넥터 종합 속성 업데이트 (색상, 두께, 패턴, 라우팅, 단자, 라벨)
async function updateConnectorProperties(payload: {
  connectorId: string;
  colorHex?: string;
  strokeWeight?: number;
  strokePattern?: ConnectorStrokePattern;
  routingType?: ConnectorRoutingType;
  startTerminal?: ConnectorTerminalType;
  endTerminal?: ConnectorTerminalType;
  startOffset?: number;
  endOffset?: number;
  sourceMagnet?: MagnetPosition;
  targetMagnet?: MagnetPosition;
  label?: string;
  hasLabel?: boolean;
  labelBoxStyle?: ConnectorLabelBoxStyle;
  labelAlign?: ConnectorLabelAlign;
  labelFillColor?: string;
  labelStrokeColor?: string;
  isReversed?: boolean;
}) {
  try {
    let node: SceneNode | null = figma.getNodeById(payload.connectorId) as SceneNode | null;
    if (!node) {
      const selection = figma.currentPage.selection;
      if (selection.length > 0) node = selection[0];
    }

    if (!node) {
      console.log('[FLOOOW-CONN-COLOR] core node missing', payload.connectorId, payload.colorHex);
      notify(t('connectorNotFound'), 'warning');
      return;
    }

    await loadRequiredFonts();

    // 만약 선택된 노드가 커넥터 그룹 내부의 노드라면 최상위 커넥터 그룹 노드로 승격
    let connectorRootNode: SceneNode = node;
    if (
      node.parent &&
      node.parent.type === 'GROUP' &&
      safeGetPluginData(node.parent, 'is_custom_connector') === 'true'
    ) {
      connectorRootNode = node.parent;
    }

    console.log('[FLOOOW-CONN-COLOR] core update', {
      connectorId: payload.connectorId,
      colorHex: payload.colorHex,
      nodeType: node.type,
      nodeId: node.id,
      rootType: connectorRootNode.type,
      rootId: connectorRootNode.id,
    });

    const currentStartOff = parseFloat(
      safeGetPluginData(connectorRootNode, 'start_offset') ||
      safeGetPluginData(node, 'start_offset') ||
      '0'
    ) || 0;
    const currentEndOff = parseFloat(
      safeGetPluginData(connectorRootNode, 'end_offset') ||
      safeGetPluginData(node, 'end_offset') ||
      '0'
    ) || 0;

    const rawStartOffset = typeof payload.startOffset === 'number'
      ? payload.startOffset
      : (payload.isReversed ? currentEndOff : currentStartOff);
    const rawEndOffset = typeof payload.endOffset === 'number'
      ? payload.endOffset
      : (payload.isReversed ? currentStartOff : currentEndOff);

    const effectiveStartTerm = payload.isReversed ? payload.endTerminal : payload.startTerminal;
    const effectiveEndTerm = payload.isReversed ? payload.startTerminal : payload.endTerminal;
    const effectiveStartMagnet = payload.isReversed ? payload.targetMagnet : payload.sourceMagnet;
    const effectiveEndMagnet = payload.isReversed ? payload.sourceMagnet : payload.targetMagnet;
    const effectiveStartOffset = payload.isReversed ? rawEndOffset : rawStartOffset;
    const effectiveEndOffset = payload.isReversed ? rawStartOffset : rawEndOffset;

    if (connectorRootNode.type === 'CONNECTOR') {
      const conn = connectorRootNode as ConnectorNode;

      const nativeSourceId = conn.connectorStart && 'endpointNodeId' in conn.connectorStart ? conn.connectorStart.endpointNodeId : undefined;
      const nativeTargetId = conn.connectorEnd && 'endpointNodeId' in conn.connectorEnd ? conn.connectorEnd.endpointNodeId : undefined;

      const hasOffset = (typeof effectiveStartOffset === 'number' && effectiveStartOffset > 0) ||
                        (typeof effectiveEndOffset === 'number' && effectiveEndOffset > 0);

      if (hasOffset && nativeSourceId && nativeTargetId) {
        const sourceNode = figma.getNodeById(nativeSourceId) as SceneNode | null;
        const targetNode = figma.getNodeById(nativeTargetId) as SceneNode | null;

        if (sourceNode && targetNode) {
          const colorHex = payload.colorHex || (Array.isArray(conn.strokes) && conn.strokes.length > 0 && conn.strokes[0].type === 'SOLID' ? rgbToHexColor(conn.strokes[0].color) : '#000000');
          const strokeWeight = typeof payload.strokeWeight === 'number' ? payload.strokeWeight : (typeof conn.strokeWeight === 'number' ? conn.strokeWeight : 1.5);
          const strokePattern = payload.strokePattern || (Array.isArray(conn.dashPattern) && conn.dashPattern.length > 0 ? (conn.dashPattern[0] <= 2 ? 'DOTTED' : 'DASHED') : 'SOLID');
          const routingType = payload.routingType || (conn.connectorLineType === 'STRAIGHT' ? 'STRAIGHT' : 'ORTHOGONAL');
          const startTerm = effectiveStartTerm && effectiveStartTerm !== 'MIXED' ? effectiveStartTerm : normalizeConnectorTerminal(conn.getPluginData('start_terminal'), 'NONE');
          const endTerm = effectiveEndTerm && effectiveEndTerm !== 'MIXED' ? effectiveEndTerm : normalizeConnectorTerminal(conn.getPluginData('end_terminal'), 'ARROW');
          const label = payload.hasLabel && payload.label !== undefined ? payload.label.trim() : (conn.text ? conn.text.characters : '');

          const sourceMag = effectiveStartMagnet || (conn.connectorStart && 'magnet' in conn.connectorStart ? conn.connectorStart.magnet as MagnetPosition : 'RIGHT');
          const targetMag = effectiveEndMagnet || (conn.connectorEnd && 'magnet' in conn.connectorEnd ? conn.connectorEnd.magnet as MagnetPosition : 'LEFT');

          const customConn = await createSingleConnector(
            sourceNode,
            sourceMag,
            targetNode,
            targetMag,
            label,
            colorHex,
            strokeWeight,
            routingType,
            startTerm,
            endTerm,
            strokePattern,
            effectiveStartOffset,
            effectiveEndOffset
          );

          conn.remove();
          figma.currentPage.selection = [customConn];
          notify(t('connectorOffsetConverted'), 'success');
          handleSelectionChange();
          return;
        }
      }

      if (typeof effectiveStartOffset === 'number') {
        conn.setPluginData('start_offset', String(effectiveStartOffset));
      }
      if (typeof effectiveEndOffset === 'number') {
        conn.setPluginData('end_offset', String(effectiveEndOffset));
      }

      if (typeof payload.strokeWeight === 'number') {
        conn.strokeWeight = payload.strokeWeight;
      }

      if (payload.strokePattern === 'DASHED') {
        conn.dashPattern = [4, 4];
      } else if (payload.strokePattern === 'DOTTED') {
        conn.dashPattern = [1.5, 3];
      } else if (payload.strokePattern === 'SOLID') {
        conn.dashPattern = [];
      }

      if (payload.routingType === 'STRAIGHT') {
        conn.connectorLineType = 'STRAIGHT';
      } else if (payload.routingType) {
        conn.connectorLineType = 'ELBOWED';
      }

      if (payload.colorHex) {
        conn.strokes = [{ type: 'SOLID', color: hexToRgbColor(payload.colorHex) }];
        conn.setPluginData('connector_color', payload.colorHex);
        const applied = Array.isArray(conn.strokes) && conn.strokes[0] && conn.strokes[0].type === 'SOLID'
          ? rgbToHexColor(conn.strokes[0].color)
          : 'none';
        console.log('[FLOOOW-CONN-COLOR] native stroke', {
          requested: payload.colorHex,
          applied,
          lineType: conn.connectorLineType,
        });
      }

      const mapCap = (term?: ConnectorTerminalType): ConnectorStrokeCap => {
        switch (term) {
          case 'ARROW':
          case 'TRIANGLE_ARROW':
          case 'REVERSED_TRIANGLE_ARROW':
            return 'ARROW_LINES';
          case 'DIAMOND':
            return 'DIAMOND_FILLED';
          case 'CIRCLE':
            return 'CIRCLE_FILLED';
          default:
            return 'NONE';
        }
      };
      if (effectiveStartTerm && effectiveStartTerm !== 'MIXED') {
        conn.connectorStartStrokeCap = mapCap(effectiveStartTerm);
        conn.setPluginData('start_terminal', effectiveStartTerm);
      }
      if (effectiveEndTerm && effectiveEndTerm !== 'MIXED') {
        conn.connectorEndStrokeCap = mapCap(effectiveEndTerm);
        conn.setPluginData('end_terminal', effectiveEndTerm);
      }

      if (payload.hasLabel !== undefined) {
        conn.setPluginData('connector_label_on', payload.hasLabel ? 'true' : 'false');
      }
      if (payload.hasLabel && payload.label !== undefined) {
        if (conn.text) {
          await safeSetCharacters(conn.text, payload.label.trim());
        }
      } else if (payload.hasLabel === false && conn.text) {
        await safeSetCharacters(conn.text, '');
      }

      if (effectiveStartMagnet && nativeSourceId) {
        conn.connectorStart = {
          endpointNodeId: nativeSourceId,
          magnet: effectiveStartMagnet,
        };
        conn.setPluginData('source_magnet', effectiveStartMagnet);
        conn.setPluginData('is_manual_magnet', 'true');
      }
      if (effectiveEndMagnet && nativeTargetId) {
        conn.connectorEnd = {
          endpointNodeId: nativeTargetId,
          magnet: effectiveEndMagnet,
        };
        conn.setPluginData('target_magnet', effectiveEndMagnet);
        conn.setPluginData('is_manual_magnet', 'true');
      }
    } else {
    // 커스텀 직각 벡터 커넥터 (그룹 또는 벡터)
      let vectorNode: VectorNode | null = null;
      let termVectorNode: VectorNode | null = null;

      if (connectorRootNode.type === 'VECTOR') {
        vectorNode = connectorRootNode as VectorNode;
      } else if (connectorRootNode.type === 'GROUP') {
        const group = connectorRootNode as GroupNode;
        const isTerm = (c: SceneNode) =>
          c.type === 'VECTOR' &&
          (safeGetPluginData(c, 'connector_role') === 'terminal' || c.name === 'ConnectorTerminals');
        vectorNode =
          (group.children.find((c) => c.type === 'VECTOR' && !isTerm(c)) as VectorNode) ||
          (group.children.find((c) => c.type === 'VECTOR') as VectorNode) || null;
        termVectorNode =
          (group.children.find(isTerm) as VectorNode) || null;
      }

      const rgb = payload.colorHex ? hexToRgbColor(payload.colorHex) : undefined;
      console.log('[FLOOOW-CONN-COLOR] custom path', {
        rootType: connectorRootNode.type,
        hasVector: Boolean(vectorNode),
        colorHex: payload.colorHex,
      });

      if (vectorNode) {
        if (rgb) {
          vectorNode.strokes = [{ type: 'SOLID', color: rgb }];
        }
        if (typeof payload.strokeWeight === 'number') {
          vectorNode.strokeWeight = payload.strokeWeight;
        }
        if (payload.strokePattern) {
          if (payload.strokePattern === 'DASHED') {
            vectorNode.dashPattern = [4, 4];
          } else if (payload.strokePattern === 'DOTTED') {
            vectorNode.dashPattern = [1.5, 3];
          } else {
            vectorNode.dashPattern = [];
          }
        }
        vectorNode.setPluginData('connector_role', 'line');
      }

      if (termVectorNode) {
        try {
          termVectorNode.remove();
        } catch (_) {}
        termVectorNode = null;
      }

      // 라벨 메타데이터 저장
      if (payload.hasLabel !== undefined) {
        connectorRootNode.setPluginData('connector_label_on', payload.hasLabel ? 'true' : 'false');
        if (vectorNode) vectorNode.setPluginData('connector_label_on', payload.hasLabel ? 'true' : 'false');
      }
      if (payload.labelBoxStyle) {
        connectorRootNode.setPluginData('connector_label_box_style', payload.labelBoxStyle);
        if (vectorNode) vectorNode.setPluginData('connector_label_box_style', payload.labelBoxStyle);
      }
      if (payload.labelAlign) {
        connectorRootNode.setPluginData('connector_label_align', payload.labelAlign);
        if (vectorNode) vectorNode.setPluginData('connector_label_align', payload.labelAlign);
      }
      if (payload.labelFillColor) {
        connectorRootNode.setPluginData('connector_label_fill_color', payload.labelFillColor);
        if (vectorNode) vectorNode.setPluginData('connector_label_fill_color', payload.labelFillColor);
      }
      if (payload.labelStrokeColor) {
        connectorRootNode.setPluginData('connector_label_stroke_color', payload.labelStrokeColor);
        if (vectorNode) vectorNode.setPluginData('connector_label_stroke_color', payload.labelStrokeColor);
      }

      // 라벨 처리
      let labelFrame: FrameNode | null = null;
      if (connectorRootNode.type === 'GROUP') {
        labelFrame = (connectorRootNode as GroupNode).findOne(
          (n) => n.name === 'ConnectorLabel' || safeGetPluginData(n, 'is_connector_label') === 'true'
        ) as FrameNode | null;
      }

      if (payload.hasLabel) {
        const labelText = typeof payload.label === 'string' ? payload.label.trim() : '';
        connectorRootNode.setPluginData('connector_label', labelText);
        if (vectorNode) vectorNode.setPluginData('connector_label', labelText);
        connectorRootNode.setPluginData('connector_label_on', 'true');
        if (vectorNode) vectorNode.setPluginData('connector_label_on', 'true');

        const boxStyle = payload.labelBoxStyle ||
          (safeGetPluginData(connectorRootNode, 'connector_label_box_style') as ConnectorLabelBoxStyle) ||
          (vectorNode ? safeGetPluginData(vectorNode, 'connector_label_box_style') as ConnectorLabelBoxStyle : 'BOX') || 'BOX';
        const align = payload.labelAlign ||
          (safeGetPluginData(connectorRootNode, 'connector_label_align') as ConnectorLabelAlign) ||
          (vectorNode ? safeGetPluginData(vectorNode, 'connector_label_align') as ConnectorLabelAlign : 'CENTER') || 'CENTER';
        const labelColorFallback = payload.colorHex
          || safeGetPluginData(connectorRootNode, 'connector_color')
          || (vectorNode ? safeGetPluginData(vectorNode, 'connector_color') : '')
          || '#000000';
        const fillCol = payload.labelFillColor ||
          safeGetPluginData(connectorRootNode, 'connector_label_fill_color') ||
          (vectorNode ? safeGetPluginData(vectorNode, 'connector_label_fill_color') : '') ||
          '#FFFFFF';
        const strokeCol = payload.labelStrokeColor ||
          safeGetPluginData(connectorRootNode, 'connector_label_stroke_color') ||
          (vectorNode ? safeGetPluginData(vectorNode, 'connector_label_stroke_color') : '') ||
          labelColorFallback;

        const isNewFrame = !labelFrame;
        // 라벨 프레임이 없는 경우 새로 생성하여 커넥터 그룹에 추가
        if (!labelFrame) {
          labelFrame = figma.createFrame();
          labelFrame.name = 'ConnectorLabel';
          labelFrame.setPluginData('is_connector_label', 'true');
          labelFrame.setPluginData('is_custom_connector', 'true');

          const textNode = figma.createText();
          textNode.name = 'LabelText';
          textNode.setPluginData('is_custom_connector', 'true');
          labelFrame.appendChild(textNode);
        }

        labelFrame.visible = true;
        const textNode = labelFrame.findOne((n) => n.type === 'TEXT') as TextNode | null;

        // 실제 Connector Label 위치 산출 (worldPoints -> getLabelPlacement)
        const srcId = safeGetPluginData(connectorRootNode, 'source_node_id') || (vectorNode ? safeGetPluginData(vectorNode, 'source_node_id') : '');
        const tgtId = safeGetPluginData(connectorRootNode, 'target_node_id') || (vectorNode ? safeGetPluginData(vectorNode, 'target_node_id') : '');
        const sourceNode = srcId ? (figma.getNodeById(srcId) as SceneNode | null) : null;
        const targetNode = tgtId ? (figma.getNodeById(tgtId) as SceneNode | null) : null;

        let isVerticalSegment = false;
        let midPoint: { x: number; y: number } | null = null;

        if (sourceNode && targetNode) {
          const srcBox: Box = sceneNodePageBox(sourceNode);
          const tgtBox: Box = sceneNodePageBox(targetNode);
          const sourceMagnet = effectiveStartMagnet || (safeGetPluginData(connectorRootNode, 'source_magnet') as MagnetPosition) || 'RIGHT';
          const targetMagnet = effectiveEndMagnet || (safeGetPluginData(connectorRootNode, 'target_magnet') as MagnetPosition) || 'LEFT';
          const routingType: ConnectorRoutingType =
            payload.routingType ||
            (safeGetPluginData(connectorRootNode, 'connector_routing') as ConnectorRoutingType) ||
            'ORTHOGONAL';
          const pStart = getMagnetPoint(srcBox, sourceMagnet);
          const pEnd = getMagnetPoint(tgtBox, targetMagnet);
          const startOffset = typeof effectiveStartOffset === 'number' ? effectiveStartOffset : (parseFloat(safeGetPluginData(connectorRootNode, 'start_offset') || '0') || 0);
          const endOffset = typeof effectiveEndOffset === 'number' ? effectiveEndOffset : (parseFloat(safeGetPluginData(connectorRootNode, 'end_offset') || '0') || 0);

          const worldPoints = calculateRoutingPoints(
            pStart,
            sourceMagnet,
            pEnd,
            targetMagnet,
            srcBox,
            tgtBox,
            routingType,
            startOffset,
            endOffset
          );
          const placement = getLabelPlacement(
            worldPoints,
            routingType,
            readPrevLabelVertical(labelFrame),
            getLabelSizeHint(labelFrame, labelText)
          );
          midPoint = placement.point;
          isVerticalSegment = placement.isVertical;
        } else if (vectorNode) {
          midPoint = {
            x: vectorNode.x + vectorNode.width / 2,
            y: vectorNode.y + vectorNode.height / 2,
          };
        }

        if (textNode) {
          await applyConnectorLabelStyle(labelFrame, textNode, {
            labelText,
            boxStyle,
            textAlign: align,
            fillColor: fillCol,
            strokeColor: strokeCol,
            isVertical: isVerticalSegment,
            // 라벨 보더 두께는 커넥터 라인 스트로크 두께와 연동 (이번 payload 값 우선, 없으면 현재 벡터 값)
            connectorStrokeWeight:
              typeof payload.strokeWeight === 'number'
                ? payload.strokeWeight
                : (vectorNode && typeof vectorNode.strokeWeight === 'number' ? vectorNode.strokeWeight : undefined),
          });
        }

        // group 생성 전에 labelFrame의 초기 위치를 실제 Connector Label 위치에 맞게 설정 (그룹 좌표계 왜곡 방지)
        if (midPoint) {
          placeNodeAtWorldCenter(labelFrame, midPoint);
        }

        // 신규 프레임일 때만 상위 컨테이너에 추가/그룹화
        if (isNewFrame) {
          if (connectorRootNode.type === 'GROUP') {
            // GroupNode는 appendChild를 정상 지원하므로 그룹에 직접 추가
            (connectorRootNode as GroupNode).appendChild(labelFrame);
          } else if (connectorRootNode.type === 'VECTOR') {
            const parentContainer = (connectorRootNode.parent as BaseNode & ChildrenMixin) || figma.currentPage;
            // figma.group에 넘기기 전에 모든 노드가 parentContainer의 직속 자식이어야 함
            parentContainer.appendChild(labelFrame);
            const group = figma.group([connectorRootNode, labelFrame], parentContainer);
            group.name = connectorRootNode.name;
            copyConnectorData(connectorRootNode, group);
            group.setPluginData('connector_label_on', 'true');
            registerConnectorInRegistry(group);
            connectorRootNode = group;
            if (figma.currentPage.selection[0]?.id !== group.id) {
              figma.currentPage.selection = [group];
            }
          }
        }
      } else if (payload.hasLabel === false) {
        connectorRootNode.setPluginData('connector_label', '');
        if (vectorNode) vectorNode.setPluginData('connector_label', '');
        connectorRootNode.setPluginData('connector_label_on', 'false');
        if (vectorNode) vectorNode.setPluginData('connector_label_on', 'false');
        if (labelFrame) {
          labelFrame.visible = false;
        }
      }

      if (payload.colorHex) {
        connectorRootNode.setPluginData('connector_color', payload.colorHex);
        if (vectorNode) vectorNode.setPluginData('connector_color', payload.colorHex);
      }
      if (payload.strokeWeight) {
        connectorRootNode.setPluginData('connector_weight', String(payload.strokeWeight));
        if (vectorNode) vectorNode.setPluginData('connector_weight', String(payload.strokeWeight));
      }
      if (payload.strokePattern) {
        connectorRootNode.setPluginData('connector_pattern', payload.strokePattern);
        if (vectorNode) vectorNode.setPluginData('connector_pattern', payload.strokePattern);
      }
      if (payload.routingType) {
        connectorRootNode.setPluginData('connector_routing', payload.routingType);
        if (vectorNode) vectorNode.setPluginData('connector_routing', payload.routingType);
      }
      if (effectiveStartTerm && effectiveStartTerm !== 'MIXED') {
        connectorRootNode.setPluginData('start_terminal', effectiveStartTerm);
        if (vectorNode) vectorNode.setPluginData('start_terminal', effectiveStartTerm);
      }
      if (effectiveEndTerm && effectiveEndTerm !== 'MIXED') {
        connectorRootNode.setPluginData('end_terminal', effectiveEndTerm);
        if (vectorNode) vectorNode.setPluginData('end_terminal', effectiveEndTerm);
      }
      if (typeof effectiveStartOffset === 'number') {
        connectorRootNode.setPluginData('start_offset', String(effectiveStartOffset));
        if (vectorNode) vectorNode.setPluginData('start_offset', String(effectiveStartOffset));
      }
      if (typeof effectiveEndOffset === 'number') {
        connectorRootNode.setPluginData('end_offset', String(effectiveEndOffset));
        if (vectorNode) vectorNode.setPluginData('end_offset', String(effectiveEndOffset));
      }
      if (effectiveStartMagnet) {
        connectorRootNode.setPluginData('source_magnet', effectiveStartMagnet);
        connectorRootNode.setPluginData('is_manual_magnet', 'true');
      }
      if (effectiveEndMagnet) {
        connectorRootNode.setPluginData('target_magnet', effectiveEndMagnet);
        connectorRootNode.setPluginData('is_manual_magnet', 'true');
      }

      // 마그넷, 라우팅, 오프셋 또는 단자 변경 시 커스텀 벡터 직각 경로 즉시 재계산 (새로운 시작/끝 단자 버텍스 적용)
      await updateOrthogonalVectorConnector(
        connectorRootNode,
        effectiveStartMagnet,
        effectiveEndMagnet,
        false,
        effectiveStartOffset,
        effectiveEndOffset
      );
    }

    // 성공 토스트는 라벨 입력 중 플러그인 포커스를 뺏으므로 생략한다.
    handleSelectionChange();
  } catch (err) {
    console.error('[FLOOOW-CONN-COLOR] core failed', err);
    notify(t('connectorUpdateFailed', { error: String(err) }), 'error');
  }
}

// 커넥터 선 형태(직각 ELBOWED / 직선 STRAIGHT) 변경 기능
async function setConnectorLineType(connectorId?: string, lineType: 'ELBOWED' | 'STRAIGHT' = 'ELBOWED') {
  try {
    await updateConnectorProperties({
      connectorId: connectorId ?? '',
      routingType: lineType === 'STRAIGHT' ? 'STRAIGHT' : 'ORTHOGONAL',
    });
    notify(
      lineType === 'ELBOWED' ? t('connectorLineElbowed') : t('connectorLineStraight'),
      'success'
    );
    handleSelectionChange();
  } catch (err) {
    notify(t('connectorLineTypeFailed', { error: String(err) }), 'error');
  }
}

// ----------------------------------------------------
// 4. 노드 테마 전환 토글 (Light <-> Dark)
// ----------------------------------------------------
async function toggleNodeTheme(nodeId: string) {
  let target = figma.getNodeById(nodeId);
  const flowParent = findFlowNode(target);
  const node = flowParent || (target as FrameNode | null);

  if (!node || node.getPluginData('is_flow_node') !== 'true') return;

  const currentTheme = node.getPluginData('node_theme') === 'dark' ? 'dark' : 'light';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

  const extracted = extractNodeText(node);
  await updateFlowNode({
    nodeId: node.id,
    title: extracted.title,
    description: extracted.description,
    tag: node.getPluginData('node_tag') || 'p1',
    theme: newTheme,
    figmaLink: node.getPluginData('figma_link'),
    figmaFrameId: node.getPluginData('figma_frame_id'),
  });
}

// ----------------------------------------------------
// 5. 상태 뱃지 및 설정 저장
// ----------------------------------------------------

// 상태 뱃지 적용 또는 제거 (노드 카드 우하단에 독립된 절대 위치로 부착)
async function applyStatusToSelected(status?: WorkflowStatus | '') {
  const selection = figma.currentPage.selection;
  if (selection.length === 0) {
    notify(t('statusNeedSelection'), 'warning');
    return;
  }

  await loadRequiredFonts();
  const isRemove = !status || !STATUS_CONFIG[status as WorkflowStatus];
  const cfg = !isRemove ? STATUS_CONFIG[status as WorkflowStatus] : null;

  for (const rawNode of selection) {
    let flowNode = findFlowNode(rawNode) || (rawNode as FrameNode | ShapeWithTextNode);

    // Status 옵션을 지원하는 노드(Screen)에만 적용, 미지원 노드(Shape, Bridge, FigmaObject)는 데이터 오염 방지
    if (!supportsOption(flowNode, 'status')) {
      continue;
    }

    // 구형 쉐이프 노드인 경우 직각 프레임 카드로 자동 마이그레이션
    if (flowNode.type === 'SHAPE_WITH_TEXT') {
      flowNode = await convertShapeToFrameNode(flowNode as ShapeWithTextNode);
    }

    if (flowNode.type === 'FRAME') {
      const card = flowNode as FrameNode;
      card.clipsContent = false;

      // 1. 기존 Header 행 안에 남아있던 구형 상태 뱃지 탐색
      const headerRow = card.children.find(isHeaderFrame) as FrameNode | undefined;

      let oldBadgeInHeader: FrameNode | undefined;
      if (headerRow) {
        oldBadgeInHeader = headerRow.children.find(
          (c) => safeGetPluginData(c, 'is_status_badge') === 'true' || c.name === 'StatusBadge'
        ) as FrameNode | undefined;
      }

      // 2. card 직속 상태 뱃지 탐색
      let statusBadge = card.children.find(
        (c) => safeGetPluginData(c, 'is_status_badge') === 'true' || c.name === 'StatusBadge'
      ) as FrameNode | undefined;

      if (isRemove) {
        // 상태 제거
        card.setPluginData('workflow_status', '');
        card.paddingBottom = 16;
        if (oldBadgeInHeader) oldBadgeInHeader.remove();
        if (statusBadge) statusBadge.remove();

        const sMode = safeGetPluginData(card, 'size_mode');
        if (sMode === 'fit') {
          const effectiveTitle = safeGetPluginData(card, 'node_title') || extractNodeText(card).title;
          const currentLink = safeGetPluginData(card, 'figma_link') || undefined;
          const newFitW = await calculateScreenFitWidth(card, effectiveTitle, undefined, currentLink);
          card.minWidth = newFitW;
          card.maxWidth = newFitW;
          card.counterAxisSizingMode = 'FIXED';
          card.resize(newFitW, Math.max(SCREEN_NODE_CONSTRAINTS.MIN_HEIGHT, Math.round(card.height)));
          card.primaryAxisSizingMode = 'AUTO';
          card.counterAxisSizingMode = 'FIXED';
        } else if (sMode === 'hug') {
          card.counterAxisSizingMode = 'FIXED';
          card.resize(card.width, Math.max(SCREEN_NODE_CONSTRAINTS.MIN_HEIGHT, Math.round(card.height)));
          card.primaryAxisSizingMode = 'AUTO';
          card.counterAxisSizingMode = 'FIXED';
        }

        const descText = card.children.find(
          (c) => c.name === 'DescText' || safeGetPluginData(c, 'node_role') === 'desc'
        ) as TextNode | undefined;
        if (descText) {
          await updateDescTextTruncation(card, descText, card.height);
        }
        continue;
      }

      card.setPluginData('workflow_status', status as string);
      card.paddingBottom = 36; // 상태 뱃지 높이 및 여백 확보

      if (!statusBadge && oldBadgeInHeader) {
        statusBadge = oldBadgeInHeader;
        card.appendChild(statusBadge);
      }

      if (!statusBadge) {
        statusBadge = figma.createFrame();
        statusBadge.name = 'StatusBadge';
        statusBadge.layoutMode = 'HORIZONTAL';
        statusBadge.primaryAxisSizingMode = 'AUTO';
        statusBadge.counterAxisSizingMode = 'AUTO';
        statusBadge.primaryAxisAlignItems = 'CENTER';
        statusBadge.counterAxisAlignItems = 'CENTER';
        statusBadge.paddingLeft = 9;
        statusBadge.paddingRight = 9;
        statusBadge.paddingTop = 3;
        statusBadge.paddingBottom = 3;
        statusBadge.cornerRadius = getStatusBadgeCornerRadius(
          typeof card.cornerRadius === 'number' ? card.cornerRadius : 0
        );
        statusBadge.setPluginData('is_status_badge', 'true');

        const badgeText = figma.createText();
        badgeText.name = 'StatusText';
        badgeText.fontName = { family: 'Inter', style: 'Bold' };
        badgeText.fontSize = 9;
        badgeText.textAutoResize = 'WIDTH_AND_HEIGHT';
        statusBadge.appendChild(badgeText);

        card.appendChild(statusBadge);
      }

      if (cfg) {
        // 노드 배경색 추출 (카드 fills 기준)
        let nodeBgColor: RGB = { r: 1, g: 1, b: 1 };
        const cardFills = card.fills;
        if (Array.isArray(cardFills) && cardFills.length > 0 && cardFills[0].type === 'SOLID') {
          nodeBgColor = cardFills[0].color;
        }
        const isDarkTheme = card.getPluginData('node_theme') === 'dark';
        const { badgeBg, badgeTextColor } = getStatusBadgeColors(status as WorkflowStatus, nodeBgColor, isDarkTheme);

        statusBadge.paddingLeft = 9;
        statusBadge.paddingRight = 9;
        statusBadge.cornerRadius = getStatusBadgeCornerRadius(
          typeof card.cornerRadius === 'number' ? card.cornerRadius : 0
        );
        statusBadge.fills = [{ type: 'SOLID', color: badgeBg }];
        const textNode = statusBadge.children.find((c) => c.type === 'TEXT') as TextNode;
        if (textNode) {
          textNode.locked = false;
          await safeSetCharacters(textNode, cfg.label.toUpperCase());
          textNode.fills = [{ type: 'SOLID', color: badgeTextColor }];
          textNode.locked = true; // 캔버스에서 텍스트 직접 수정 차단
        }

        const sMode = safeGetPluginData(card, 'size_mode');
        if (sMode === 'fit') {
          const effectiveTitle = safeGetPluginData(card, 'node_title') || extractNodeText(card).title;
          const currentLink = safeGetPluginData(card, 'figma_link') || undefined;
          const newFitW = await calculateScreenFitWidth(card, effectiveTitle, status as string, currentLink);
          card.minWidth = newFitW;
          card.maxWidth = newFitW;
          card.counterAxisSizingMode = 'FIXED';
          card.resize(newFitW, Math.max(SCREEN_NODE_CONSTRAINTS.MIN_HEIGHT, Math.round(card.height)));
          card.primaryAxisSizingMode = 'AUTO';
          card.counterAxisSizingMode = 'FIXED';
        } else if (sMode === 'hug') {
          card.counterAxisSizingMode = 'FIXED';
          card.resize(card.width, Math.max(SCREEN_NODE_CONSTRAINTS.MIN_HEIGHT, Math.round(card.height)));
          card.primaryAxisSizingMode = 'AUTO';
          card.counterAxisSizingMode = 'FIXED';
        }

        // 3. 하단 오른쪽 박스 안쪽에 절대 위치 배치
        if (card.layoutMode !== 'NONE') {
          statusBadge.layoutPositioning = 'ABSOLUTE';
        }
        statusBadge.constraints = { horizontal: 'MAX', vertical: 'MAX' };
        statusBadge.x = card.width - statusBadge.width - 10;
        statusBadge.y = card.height - statusBadge.height - 10;
        statusBadge.visible = true;
        statusBadge.locked = true; // 상태 배지 잠금

        // 설명 텍스트 줄수 동기화: Hug 모드이면 전체 표시(null), Fixed 모드일 때만 높이에 맞게 줄수 제한
        const descText = card.children.find(
          (c) => c.name === 'DescText' || safeGetPluginData(c, 'node_role') === 'desc'
        ) as TextNode | undefined;
        if (descText) {
          await updateDescTextTruncation(card, descText, card.height);
        }
      }
    }
  }

  handleSelectionChange();
  if (isRemove) {
    notify(t('statusRemoved', { count: selection.length }), 'info');
  } else if (cfg) {
    notify(t('statusAttached', { count: selection.length, label: cfg.label }), 'success');
  }
}

// 엘리베이션(그림자 효과) 적용 또는 제거
async function applyElevationToSelected(level: number | null) {
  const selection = figma.currentPage.selection;
  if (selection.length === 0) {
    notify(t('elevationNeedSelection'), 'warning');
    return;
  }

  for (const rawNode of selection) {
    let flowNode = findFlowNode(rawNode) || (rawNode as FrameNode | ShapeWithTextNode);

    // Elevation 옵션을 지원하는 노드(Screen, Shape, Bridge)에만 적용, 미지원 노드(FigmaObject)는 건너뜀
    if (!supportsOption(flowNode, 'elevation')) {
      continue;
    }

    if (flowNode.type === 'SHAPE_WITH_TEXT') {
      flowNode = await convertShapeToFrameNode(flowNode as ShapeWithTextNode);
    }
    if (flowNode.type === 'FRAME') {
      const card = flowNode as FrameNode;
      if (level === null || level === undefined) {
        card.setPluginData('node_elevation', '');
        card.effects = [];
      } else {
        const nodeTheme = card.getPluginData('node_theme');
        let isDark = nodeTheme === 'dark';
        if ('fills' in card && Array.isArray(card.fills) && card.fills.length > 0) {
          const firstFill = card.fills[0];
          if (firstFill.type === 'SOLID') {
            const lum = 0.299 * firstFill.color.r + 0.587 * firstFill.color.g + 0.114 * firstFill.color.b;
            if (lum < 0.5) isDark = true;
          }
        }
        card.setPluginData('node_elevation', `${level}`);
        card.effects = getElevationEffects(level, isDark);
        card.clipsContent = false;
      }
    }
  }

  handleSelectionChange();
  if (level === null || level === undefined) {
    notify(t('elevationRemoved', { count: selection.length }), 'info');
  } else {
    notify(t('elevationApplied', { count: selection.length, level }), 'success');
  }
}

/**
 * RGB 색상의 채도(Saturation)가 높은지 판별
 * - 흰색, 검정, 회색 계열(무채색)은 false
 * - 빨강, 주황, 노랑, 초록, 파랑, 보라 등 유채색 계열은 true
 */
function isColorHighSaturation(rgb: RGB): boolean {
  const max = Math.max(rgb.r, rgb.g, rgb.b);
  const min = Math.min(rgb.r, rgb.g, rgb.b);
  const delta = max - min;
  if (delta < 0.15) return false;
  const l = (max + min) / 2;
  const s = l > 0 && l < 1 ? delta / (1 - Math.abs(2 * l - 1)) : 0;
  return s >= 0.25;
}

/**
 * 스텝 배지 컬러 적용
 * - White: 배경은 흰색, 보더는 노드의 보더 컬러 (노드 보더가 0이고 채도가 높은 경우 노드 배경색, 그 외 흰색)
 * - Black: 지금 구성 (배경 검정, 보더 흰색, 텍스트 흰색)
 * - Style: 배경은 노드의 배경색, 보더는 노드의 보더 컬러 (노드 보더가 0인 경우 노드의 배경색)
 */
function applyStepBadgeColors(
  stepBadge: FrameNode,
  numText: TextNode,
  colorMode: 'White' | 'Black' | 'Style' = 'Style',
  card: FrameNode
) {
  // 노드 배경색 및 보더 추출 (일반 프레임 또는 ShapeVector 커스텀 도형 노드 모두 지원)
  let nodeBgColor: RGB = { r: 1, g: 1, b: 1 };
  let nodeStrokeColor: RGB | null = null;
  let hasNodeStroke = false;

  const shapeVector = card.children.find(
    (c) => (c.name === 'ShapeVector' || c.name === 'DiamondShape') && (c.type === 'VECTOR' || c.type === 'FRAME')
  ) as (VectorNode | FrameNode) | undefined;

  if (shapeVector) {
    if ('fills' in shapeVector && Array.isArray(shapeVector.fills) && shapeVector.fills.length > 0 && shapeVector.fills[0].type === 'SOLID') {
      nodeBgColor = shapeVector.fills[0].color;
    }
    if ('strokes' in shapeVector && Array.isArray(shapeVector.strokes) && shapeVector.strokes.length > 0 && shapeVector.strokes[0].type === 'SOLID') {
      nodeStrokeColor = shapeVector.strokes[0].color;
      const sw = typeof shapeVector.strokeWeight === 'number' ? shapeVector.strokeWeight : 1.5;
      hasNodeStroke = sw > 0;
    }
  } else {
    const cardFills = card.fills;
    if (Array.isArray(cardFills) && cardFills.length > 0 && cardFills[0].type === 'SOLID') {
      nodeBgColor = cardFills[0].color;
    }
    const cardStrokes = card.strokes;
    if (Array.isArray(cardStrokes) && cardStrokes.length > 0 && cardStrokes[0].type === 'SOLID') {
      nodeStrokeColor = cardStrokes[0].color;
    }
    const hasWeight = typeof card.strokeWeight === 'number' ? card.strokeWeight > 0 : true;
    hasNodeStroke = hasWeight && nodeStrokeColor !== null;
  }

  // 텍스트 대비 및 명도 판별
  const lum = 0.299 * nodeBgColor.r + 0.587 * nodeBgColor.g + 0.114 * nodeBgColor.b;
  const isDarkBg = lum < 0.6;

  if (colorMode === 'White') {
    // White: 배경은 흰색
    // 1) 노드 보더가 있는 경우: 노드의 보더 컬러
    // 2) 노드 보더가 0이고 노드 배경이 유채색(채도 높음): 노드의 배경색
    // 3) 노드 보더가 0이고 노드 배경이 검정/어두운 무채색인 경우: 검정색 보더
    // 4) 노드 보더가 0이고 노드 배경이 밝은 무채색(흰색/연회색)인 경우: 연그레이(#D1D5DB)로 분리
    stepBadge.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    let borderCol: RGB = isDarkBg ? { r: 0.1, g: 0.1, b: 0.14 } : { r: 0.82, g: 0.84, b: 0.86 };
    if (hasNodeStroke && nodeStrokeColor) {
      borderCol = nodeStrokeColor;
    } else if (isColorHighSaturation(nodeBgColor)) {
      borderCol = nodeBgColor;
    } else if (isDarkBg) {
      borderCol = nodeBgColor.r === 0 && nodeBgColor.g === 0 && nodeBgColor.b === 0 ? { r: 0, g: 0, b: 0 } : { r: 0.1, g: 0.1, b: 0.14 };
    }
    stepBadge.strokes = [{ type: 'SOLID', color: borderCol }];
    stepBadge.strokeWeight = 1.5;
    numText.fills = [{ type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.14 } }];
  } else if (colorMode === 'Style') {
    // Style: 배경은 노드의 배경색
    // 1) 노드 보더가 있는 경우: 노드의 보더 컬러 (단, 노드 배경이 검정인데 보더도 검정이면 흰색으로 분리)
    // 2) 노드 보더가 0인 경우:
    //    - 노드 배경이 검정/어두운 톤인 경우: 흰색 (#FFFFFF) 보더 정의
    //    - 노드 배경이 밝은 톤인 경우: 연그레이 (#D1D5DB) 보더 정의
    stepBadge.fills = [{ type: 'SOLID', color: nodeBgColor }];
    let borderCol: RGB = isDarkBg ? { r: 1, g: 1, b: 1 } : { r: 0.82, g: 0.84, b: 0.86 };
    if (hasNodeStroke && nodeStrokeColor) {
      const isStrokeBlack = nodeStrokeColor.r < 0.15 && nodeStrokeColor.g < 0.15 && nodeStrokeColor.b < 0.15;
      if (isDarkBg && isStrokeBlack) {
        borderCol = { r: 1, g: 1, b: 1 };
      } else {
        borderCol = nodeStrokeColor;
      }
    }
    stepBadge.strokes = [{ type: 'SOLID', color: borderCol }];
    stepBadge.strokeWeight = 1.5;
    numText.fills = [{ type: 'SOLID', color: isDarkBg ? { r: 1, g: 1, b: 1 } : { r: 0.1, g: 0.1, b: 0.14 } }];
  } else {
    // Black: 지금 구성 (배경 검정, 보더 흰색, 텍스트 흰색)
    stepBadge.fills = [{ type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.14 } }];
    stepBadge.strokes = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    stepBadge.strokeWeight = 1.5;
    numText.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  }
}

// 단일 노드 카드 코너에 스텝 뱃지 부착 헬퍼
async function applyStepBadgeToSingleCard(
  card: FrameNode,
  currentNum: number,
  corner: string = 'TOP_LEFT',
  shape: string = 'Square',
  colorMode: 'White' | 'Black' | 'Style' = 'Style'
) {
  await loadRequiredFonts();
  card.clipsContent = false;
  card.setPluginData('step_number', `${currentNum}`);
  card.setPluginData('badge_corner', corner);
  card.setPluginData('badge_shape', shape);
  card.setPluginData('badge_color_mode', colorMode);

  let stepBadge = card.children.find(
    (c) => safeGetPluginData(c, 'is_step_badge') === 'true' || c.name.startsWith('[Step]')
  ) as FrameNode | undefined;

  let numText: TextNode;
  if (!stepBadge) {
    stepBadge = figma.createFrame();
    card.appendChild(stepBadge);
    stepBadge.setPluginData('is_step_badge', 'true');

    numText = figma.createText();
    numText.name = 'NumText';
    numText.fontName = { family: 'Inter', style: 'Bold' };
    numText.fontSize = 11;
    numText.textAutoResize = 'WIDTH_AND_HEIGHT';
    stepBadge.appendChild(numText);
  } else {
    card.appendChild(stepBadge);
    let foundText = stepBadge.children.find((c) => c.type === 'TEXT') as TextNode | undefined;
    if (!foundText) {
      foundText = figma.createText();
      foundText.name = 'NumText';
      foundText.fontName = { family: 'Inter', style: 'Bold' };
      foundText.fontSize = 11;
      foundText.textAutoResize = 'WIDTH_AND_HEIGHT';
      stepBadge.appendChild(foundText);
    }
    numText = foundText;
  }

  applyStepBadgeColors(stepBadge, numText, colorMode, card);

  if (card.layoutMode !== 'NONE') {
    stepBadge.layoutPositioning = 'ABSOLUTE';
  }

  // 레이아웃 속성 설정 (가로 Auto/Hug, 최소 너비 24, 세로 24 고정)
  stepBadge.layoutMode = 'HORIZONTAL';
  stepBadge.primaryAxisAlignItems = 'CENTER';
  stepBadge.counterAxisAlignItems = 'CENTER';
  stepBadge.paddingLeft = 4;
  stepBadge.paddingRight = 4;
  stepBadge.paddingTop = 0;
  stepBadge.paddingBottom = 0;
  try {
    stepBadge.minWidth = 24;
    stepBadge.minHeight = 24;
    stepBadge.maxHeight = 24;
  } catch (e) {
    // Figma 버전 호환성 예외 처리
  }
  stepBadge.counterAxisSizingMode = 'FIXED';
  stepBadge.primaryAxisSizingMode = 'AUTO';
  stepBadge.resize(Math.max(24, stepBadge.width || 24), 24);

  // 코너 모양 적용 (Circle인 경우 가로로 늘어날 때 양 끝이 둥근 캡슐/알약 형태가 되도록 999 설정)
  if (shape === 'Circle') {
    stepBadge.cornerRadius = 999;
  } else if (shape === 'RoundBox') {
    stepBadge.cornerRadius = 5;
  } else {
    stepBadge.cornerRadius = 0; // Square
  }

  stepBadge.name = `[Step] ${currentNum}`;
  stepBadge.visible = true;

  // 텍스트 반영
  if (numText) {
    await safeSetCharacters(numText, `${currentNum}`);
  }

  // 텍스트 반영 후 실제 뱃지 너비(bw)를 기준으로 코너 위치 좌표 및 constraints 계산
  const bw = Math.max(24, Math.round(stepBadge.width));
  const bh = 24;

  // 노드 형태(Junction, Diamond, Capsule 등)에 따른 외곽선 정밀 좌표 산출
  const rawNodeType = safeGetPluginData(card, 'node_type');
  const nType = normalizeNodeType(rawNodeType);
  const badgeCoords = getStepBadgeCoordinates(
    nType,
    card.width,
    card.height,
    bw,
    bh,
    corner,
    nType === 'Branch' ? normalizeBranchVariant(safeGetPluginData(card, 'branch_variant')) : undefined
  );

  stepBadge.x = badgeCoords.x;
  stepBadge.y = badgeCoords.y;
  stepBadge.constraints = badgeCoords.constraints;
}

/**
 * 도형 형태(직사각형, 원, 마름모, 캡슐) 및 코너 위치에 따라
 * 스텝 배지가 각 도형의 외곽선(Shape Line)에 자연스럽게 겹치도록 중심 및 바운딩 좌표를 정밀 산출합니다.
 */
function getStepBadgeCoordinates(
  nodeType: DiagramNodeType,
  cardW: number,
  cardH: number,
  bw: number,
  bh: number,
  corner: string,
  branchVariant?: BranchVariant
): { x: number; y: number; constraints: Constraints } {
  const branchShape = nodeType === 'Branch' ? (branchVariant || 'CIRCLE') : undefined;
  const treatBranchAsRect = branchShape === 'SQUARE';
  const treatBranchAsDiamond = branchShape === 'DIAMOND';
  const treatBranchAsCapsule = branchShape === 'TAG';
  const treatBranchAsCircle = Boolean(branchShape) && !treatBranchAsRect && !treatBranchAsDiamond && !treatBranchAsCapsule;

  // 기본 직사각형(Screen, Process, Branch Square 등): 코너 꼭짓점 기준 중심(-11px 오프셋)
  if (
    !treatBranchAsCircle &&
    !treatBranchAsDiamond &&
    !treatBranchAsCapsule &&
    nodeType !== 'Junction' &&
    nodeType !== 'Connector' &&
    nodeType !== 'Decision' &&
    nodeType !== 'Terminator'
  ) {
    const offset = 11;
    if (corner === 'TOP_RIGHT') {
      return { x: cardW - bw + offset, y: -offset, constraints: { horizontal: 'MAX', vertical: 'MIN' } };
    } else if (corner === 'BOTTOM_LEFT') {
      return { x: -offset, y: cardH - bh + offset, constraints: { horizontal: 'MIN', vertical: 'MAX' } };
    } else if (corner === 'BOTTOM_RIGHT') {
      return { x: cardW - bw + offset, y: cardH - bh + offset, constraints: { horizontal: 'MAX', vertical: 'MAX' } };
    } else {
      return { x: -offset, y: -offset, constraints: { horizontal: 'MIN', vertical: 'MIN' } };
    }
  }

  // 1. 원 (Junction / Connector): 중심 (cardW/2, cardH/2), 반경 rx, ry
  // 각 4분면 45도(π/4) 지점의 타원/원주 상 좌표에 배지의 중심이 오도록 배치
  if (treatBranchAsCircle || nodeType === 'Junction' || nodeType === 'Connector') {
    const rx = cardW / 2;
    const ry = cardH / 2;
    const cos45 = Math.SQRT1_2; // 약 0.7071
    let cx = rx;
    let cy = ry;

    if (corner === 'TOP_RIGHT') {
      cx = rx + rx * cos45;
      cy = ry - ry * cos45;
      return { x: Math.round(cx - bw / 2), y: Math.round(cy - bh / 2), constraints: { horizontal: 'MAX', vertical: 'MIN' } };
    } else if (corner === 'BOTTOM_LEFT') {
      cx = rx - rx * cos45;
      cy = ry + ry * cos45;
      return { x: Math.round(cx - bw / 2), y: Math.round(cy - bh / 2), constraints: { horizontal: 'MIN', vertical: 'MAX' } };
    } else if (corner === 'BOTTOM_RIGHT') {
      cx = rx + rx * cos45;
      cy = ry + ry * cos45;
      return { x: Math.round(cx - bw / 2), y: Math.round(cy - bh / 2), constraints: { horizontal: 'MAX', vertical: 'MAX' } };
    } else {
      // TOP_LEFT
      cx = rx - rx * cos45;
      cy = ry - ry * cos45;
      return { x: Math.round(cx - bw / 2), y: Math.round(cy - bh / 2), constraints: { horizontal: 'MIN', vertical: 'MIN' } };
    }
  }

  // 2. 마름모 (Diamond / Decision): 4개 꼭짓점이 (cardW/2, 0), (cardW, cardH/2), (cardW/2, cardH), (0, cardH/2)
  // 각 변(사선 빗변)의 중점에 배지의 중심이 일치하도록 배치
  if (treatBranchAsDiamond || nodeType === 'Decision') {
    let cx = cardW / 2;
    let cy = cardH / 2;

    if (corner === 'TOP_RIGHT') {
      // (cardW/2, 0)과 (cardW, cardH/2)의 중점 -> (0.75 * cardW, 0.25 * cardH)
      cx = cardW * 0.75;
      cy = cardH * 0.25;
      return { x: Math.round(cx - bw / 2), y: Math.round(cy - bh / 2), constraints: { horizontal: 'MAX', vertical: 'MIN' } };
    } else if (corner === 'BOTTOM_LEFT') {
      // (0, cardH/2)와 (cardW/2, cardH)의 중점 -> (0.25 * cardW, 0.75 * cardH)
      cx = cardW * 0.25;
      cy = cardH * 0.75;
      return { x: Math.round(cx - bw / 2), y: Math.round(cy - bh / 2), constraints: { horizontal: 'MIN', vertical: 'MAX' } };
    } else if (corner === 'BOTTOM_RIGHT') {
      // (cardW, cardH/2)와 (cardW/2, cardH)의 중점 -> (0.75 * cardW, 0.75 * cardH)
      cx = cardW * 0.75;
      cy = cardH * 0.75;
      return { x: Math.round(cx - bw / 2), y: Math.round(cy - bh / 2), constraints: { horizontal: 'MAX', vertical: 'MAX' } };
    } else {
      // TOP_LEFT: (0, cardH/2)와 (cardW/2, 0)의 중점 -> (0.25 * cardW, 0.25 * cardH)
      cx = cardW * 0.25;
      cy = cardH * 0.25;
      return { x: Math.round(cx - bw / 2), y: Math.round(cy - bh / 2), constraints: { horizontal: 'MIN', vertical: 'MIN' } };
    }
  }

  // 3. 캡슐 / 알약 (Capsule / Terminator): 반경 r = cardH / 2
  // 좌측 반원 중심 (r, r), 우측 반원 중심 (cardW - r, r)
  // 좌/우 4분원 호(45도) 외곽선 상에 배지의 중심이 일치하도록 배치
  if (treatBranchAsCapsule || nodeType === 'Terminator') {
    const r = cardH / 2;
    const cos45 = Math.SQRT1_2; // 약 0.7071
    let cx = r;
    let cy = r;

    if (corner === 'TOP_RIGHT') {
      cx = (cardW - r) + r * cos45;
      cy = r - r * cos45;
      return { x: Math.round(cx - bw / 2), y: Math.round(cy - bh / 2), constraints: { horizontal: 'MAX', vertical: 'MIN' } };
    } else if (corner === 'BOTTOM_LEFT') {
      cx = r - r * cos45;
      cy = r + r * cos45;
      return { x: Math.round(cx - bw / 2), y: Math.round(cy - bh / 2), constraints: { horizontal: 'MIN', vertical: 'MAX' } };
    } else if (corner === 'BOTTOM_RIGHT') {
      cx = (cardW - r) + r * cos45;
      cy = r + r * cos45;
      return { x: Math.round(cx - bw / 2), y: Math.round(cy - bh / 2), constraints: { horizontal: 'MAX', vertical: 'MAX' } };
    } else {
      // TOP_LEFT
      cx = r - r * cos45;
      cy = r - r * cos45;
      return { x: Math.round(cx - bw / 2), y: Math.round(cy - bh / 2), constraints: { horizontal: 'MIN', vertical: 'MIN' } };
    }
  }

  return { x: -11, y: -11, constraints: { horizontal: 'MIN', vertical: 'MIN' } };
}

// 스텝 번호 부여 (노드 카드 코너에 일체형 스텝 뱃지로 부착)
async function addStepBadges(
  startNumber: number = 1,
  corner: string = 'TOP_LEFT',
  shape: string = 'Square',
  colorMode?: 'White' | 'Black' | 'Style'
) {
  const rawSelection = [...figma.currentPage.selection];
  if (rawSelection.length === 0) {
    notify(t('stepNeedSelection'), 'warning');
    return;
  }

  // 중복 제거 및 플로우 노드 매핑 (Step Badge를 지원하는 Screen, Shape 노드만 필터링, Bridge 및 FigmaObject 배제)
  const nodesMap = new Map<string, FrameNode>();
  for (const n of rawSelection) {
    let flow = findFlowNode(n) || n;
    if (!supportsOption(flow, 'stepBadge')) {
      continue;
    }
    if (flow.type === 'SHAPE_WITH_TEXT') {
      flow = await convertShapeToFrameNode(flow as ShapeWithTextNode);
    }
    if (flow.type === 'FRAME') {
      nodesMap.set(flow.id, flow as FrameNode);
    }
  }

  const selection = Array.from(nodesMap.values());
  selection.sort((a, b) => a.x - b.x);

  let currentNum = startNumber;
  for (const card of selection) {
    const cardMode = colorMode
      || (safeGetPluginData(card, 'badge_color_mode') as 'White' | 'Black' | 'Style')
      || 'Style';
    await applyStepBadgeToSingleCard(card, currentNum, corner, shape, cardMode);
    currentNum++;
  }

  handleSelectionChange();
  notify(t('stepApplied', { count: selection.length }), 'success');
}

// 스텝 번호 제거 기능
async function removeStepBadges() {
  const rawSelection = [...figma.currentPage.selection];
  if (rawSelection.length === 0) {
    notify(t('stepRemoveNeedSelection'), 'warning');
    return;
  }

  let removedCount = 0;
  for (const n of rawSelection) {
    let flow = findFlowNode(n) || n;
    if (!supportsOption(flow, 'stepBadge')) {
      continue;
    }
    if (flow.type === 'SHAPE_WITH_TEXT') {
      flow = await convertShapeToFrameNode(flow as ShapeWithTextNode);
    }
    if (flow.type === 'FRAME') {
      const card = flow as FrameNode;
      card.setPluginData('step_number', '');
      card.setPluginData('badge_corner', '');
      card.setPluginData('badge_shape', '');
      const stepBadges = card.children.filter(
        (c) => safeGetPluginData(c, 'is_step_badge') === 'true' || c.name.startsWith('[Step]')
      );
      for (const badge of stepBadges) {
        badge.remove();
        removedCount++;
      }
    }
  }

  handleSelectionChange();
  if (removedCount > 0) {
    notify(t('stepRemoved', { count: removedCount }), 'info');
  } else {
    notify(t('stepNoneExist'), 'info');
  }
}

function focusFrame(nodeId: string) {
  const node = figma.getNodeById(nodeId);
  if (!node || !('x' in node)) {
    notify(t('nodeGone'), 'warning');
    return;
  }

  const sceneNode = node as SceneNode;
  figma.currentPage.selection = [sceneNode];
  figma.viewport.scrollAndZoomIntoView([sceneNode]);
}

// 현재 캔버스(페이지)에서 일반 피그마 디자인 프레임(화면들) 목록 수집
function getDesignFrames(): DesignFrameItem[] {
  const items: DesignFrameItem[] = [];
  const seenIds = new Set<string>();

  // 1. 현재 선택된 노드들 중 디자인 프레임 우선 수집
  for (const node of figma.currentPage.selection) {
    if (
      (node.type === 'FRAME' || node.type === 'COMPONENT' || node.type === 'INSTANCE') &&
      !safeGetPluginData(node, 'is_flow_node') &&
      !safeGetPluginData(node, 'flow_node_type') &&
      !node.name.startsWith('[Flow]')
    ) {
      const cr = 'cornerRadius' in node && typeof node.cornerRadius === 'number' ? node.cornerRadius : 0;
      items.push({
        id: node.id,
        name: node.name,
        width: Math.round(node.width),
        height: Math.round(node.height),
        cornerRadius: Math.round(cr),
      });
      seenIds.add(node.id);
    }
  }

  // 2. 현재 페이지의 최상위 프레임/컴포넌트들 수집
  for (const node of figma.currentPage.children) {
    if (seenIds.has(node.id)) continue;
    if (
      (node.type === 'FRAME' || node.type === 'COMPONENT' || node.type === 'INSTANCE') &&
      !safeGetPluginData(node, 'is_flow_node') &&
      !safeGetPluginData(node, 'flow_node_type') &&
      !node.name.startsWith('[Flow]')
    ) {
      const cr = 'cornerRadius' in node && typeof node.cornerRadius === 'number' ? node.cornerRadius : 0;
      items.push({
        id: node.id,
        name: node.name,
        width: Math.round(node.width),
        height: Math.round(node.height),
        cornerRadius: Math.round(cr),
      });
      seenIds.add(node.id);
    }
  }

  return items;
}

async function saveSettings(token: string, fileUrl: string) {
  await figma.clientStorage.setAsync('figma_token', token);
  await figma.clientStorage.setAsync('figma_file_url', fileUrl);
  notify(t('settingsSaved'), 'success');
}

// ----------------------------------------------------
// 현재 피그마 파일의 모든 Variables(UI3 디자인 토큰) 자동 추출
// ----------------------------------------------------
async function extractUI3Variables() {
  try {
    if (!('variables' in figma) || !figma.variables) {
      notify(t('variablesUnsupported'), 'warning');
      return;
    }

    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    const variables = await figma.variables.getLocalVariablesAsync();

    if (variables.length === 0) {
      notify(t('variablesNoneLocal'), 'warning');
      return;
    }

    // 변수 맵 구성
    const varMap = new Map<string, Variable>();
    for (const v of variables) {
      varMap.set(v.id, v);
    }

    let cssLight = `/* ========================================================\n   Figma UI3 Variables (Total: ${variables.length})\n   Collections: ${collections.map((c) => c.name).join(', ')}\n   ======================================================== */\n:root {\n`;
    let cssDark = `\n/* Dark Mode Overrides */\n.figma-dark, [data-theme="dark"] {\n`;

    let lightCount = 0;
    let darkCount = 0;

    for (const v of variables) {
      const col = collections.find((c) => c.id === v.variableCollectionId);
      const colName = col ? col.name : 'Tokens';

      // CSS 변수명 정규화 (예: "bg/default" -> "--figma-bg-default")
      const rawName = v.name.replace(/[\/\s_]+/g, '-').toLowerCase();
      const cssVarName = rawName.startsWith('--') ? rawName : `--figma-${rawName}`;

      if (!col || col.modes.length === 0) continue;

      // 모드 찾기 (Light/Default 모드 vs Dark 모드)
      const defaultMode = col.modes[0];
      const darkModes = col.modes.filter((m) =>
        m.name.toLowerCase().includes('dark') || m.name.toLowerCase().includes('night')
      );
      const darkMode = darkModes.length > 0 ? darkModes[0] : (col.modes.length > 1 ? col.modes[1] : null);

      // 값 추출 헬퍼 (Alias 재귀 해결)
      const resolveVal = (modeId: string, depth = 0): any => {
        if (depth > 5) return null;
        const raw = v.valuesByMode[modeId];
        if (raw && typeof raw === 'object' && 'type' in raw && raw.type === 'VARIABLE_ALIAS') {
          const targetVar = varMap.get(raw.id);
          if (targetVar) {
            return resolveValFromVar(targetVar, modeId, depth + 1);
          }
        }
        return raw;
      };

      const resolveValFromVar = (targetVar: Variable, modeId: string, depth: number): any => {
        const raw = targetVar.valuesByMode[modeId] || Object.values(targetVar.valuesByMode)[0];
        if (raw && typeof raw === 'object' && 'type' in raw && raw.type === 'VARIABLE_ALIAS') {
          const next = varMap.get(raw.id);
          if (next) return resolveValFromVar(next, modeId, depth + 1);
        }
        return raw;
      };

      const formatVal = (val: any, type: VariableResolvedDataType): string | null => {
        if (type === 'COLOR') {
          if (val && typeof val === 'object' && 'r' in val) {
            const r = Math.round(val.r * 255);
            const g = Math.round(val.g * 255);
            const b = Math.round(val.b * 255);
            const a = typeof val.a === 'number' ? val.a : 1;
            return a < 1 ? `rgba(${r}, ${g}, ${b}, ${Number(a.toFixed(2))})` : `rgb(${r}, ${g}, ${b})`;
          }
        } else if (type === 'FLOAT' && typeof val === 'number') {
          return `${val}px`;
        } else if (type === 'STRING' && typeof val === 'string') {
          return `"${val}"`;
        } else if (type === 'BOOLEAN') {
          return val ? '1' : '0';
        }
        return null;
      };

      // 1. 라이트 / 기본 모드 값
      const defaultValRaw = resolveVal(defaultMode.modeId);
      const defaultFormatted = formatVal(defaultValRaw, v.resolvedType);
      if (defaultFormatted) {
        cssLight += `  ${cssVarName}: ${defaultFormatted}; /* [${colName}] */\n`;
        lightCount++;
      }

      // 2. 다크 모드 값 (다른 경우에만)
      if (darkMode) {
        const darkValRaw = resolveVal(darkMode.modeId);
        const darkFormatted = formatVal(darkValRaw, v.resolvedType);
        if (darkFormatted && darkFormatted !== defaultFormatted) {
          cssDark += `  ${cssVarName}: ${darkFormatted};\n`;
          darkCount++;
        }
      }
    }

    cssLight += `}\n`;
    cssDark += `}\n`;

    // UI 수신 제거됨(dead message 정리) — 추출 결과는 현재 UI로 전달하지 않음
    notify(t('tokensExtracted', { count: lightCount }), 'success');
  } catch (err) {
    notify(t('tokensFailed', { error: String(err) }), 'error');
  }
}

// ----------------------------------------------------
// UI 메시지 수신 라우터
// ----------------------------------------------------
figma.ui.onmessage = async (msg: PluginAction) => {
  try {
    switch (msg.type) {
      case 'CREATE_FLOW_NODE':
        await runCreateExclusive(() => createFlowNode(msg.payload));
        break;
      case 'UPDATE_FLOW_NODE':
        await updateFlowNode(msg.payload);
        break;
      case 'BATCH_UPDATE_FLOW_NODES':
        await batchUpdateFlowNodes(msg.payload.nodeIds, msg.payload.patch);
        break;
      case 'CONNECT_POINTS':
        await runCreateExclusive(() => connectPoints(msg.payload));
        break;
      case 'CONNECT_CHAIN':
        await runCreateExclusive(() => connectChain(msg.payload));
        break;
      case 'AUTO_CONNECT_SELECTED':
        await runCreateExclusive(() => autoConnectSelected(msg.label));
        break;
      case 'UPDATE_CONNECTOR_LABEL':
        await updateConnectorLabel(msg.connectorId, msg.label);
        break;
      case 'UPDATE_CONNECTOR_PROPERTIES':
        await updateConnectorProperties(msg.payload);
        break;
      case 'SET_CONNECTOR_LINE_TYPE':
        await setConnectorLineType(msg.connectorId, msg.lineType);
        break;
      case 'EXTRACT_UI3_VARIABLES':
        await extractUI3Variables();
        break;
      case 'TOGGLE_NODE_THEME':
        await toggleNodeTheme(msg.nodeId);
        break;
      case 'SET_STATUS':
        await applyStatusToSelected(msg.status);
        break;
      case 'SET_ELEVATION':
        await applyElevationToSelected(msg.level);
        break;
      case 'ADD_STEP_BADGES':
        await addStepBadges(msg.startNumber || 1, msg.corner || 'TOP_LEFT', msg.shape || 'Square', msg.colorMode);
        break;
      case 'REMOVE_STEP_BADGES':
        await removeStepBadges();
        break;
      case 'GET_STATUS_LIST':
        // 상태 목록 UI push 제거됨(dead message 정리) — 현재 UI에서 요청하지 않음
        break;
      case 'FOCUS_FRAME':
        focusFrame(msg.nodeId);
        break;
      case 'GET_DESIGN_FRAMES': {
        const frames = getDesignFrames();
        postToUI({
          type: 'DESIGN_FRAMES_LOADED',
          frames,
        });
        break;
      }
      case 'GET_FLOOOW_USAGE':
        logUsage('request', {
          file: figma.root.name,
          projectId: usageProjectId(),
          refresh: Boolean(msg.refresh),
          entitlement: getCreateEntitlement(),
        });
        try {
          if (msg.refresh) await refreshUsageFromScan();
          else postFlooowUsage(false);
        } catch (err) {
          console.error('[FLOOOW-USAGE] request:failed', err);
          postFlooowPlanIssue('retryable');
        }
        break;
      case 'RESIZE_NODE':
        await resizeNode(msg.nodeId, msg.width, msg.height);
        break;
      case 'SAVE_SETTINGS':
        await saveSettings(msg.token, msg.fileUrl);
        break;
      case 'LOAD_SETTINGS':
        // 저장 설정 UI push 제거됨(dead message 정리) — 현재 UI에서 요청하지 않음
        break;
      case 'CLOSE_PLUGIN':
        figma.closePlugin();
        break;
      case 'UNDO':
        notify(t('undoHint'), 'info');
        break;
      case 'REDO':
        notify(t('redoHint'), 'info');
        break;
      case 'NOTIFY':
        notify(msg.message, msg.level);
        break;
      case 'RESIZE_WINDOW': {
        const targetW = msg.width || 360;
        const targetH = Math.max(200, Math.min(1200, Math.round(msg.height)));
        figma.ui.resize(targetW, targetH);
        break;
      }
      case 'INIT':
        slog('50 INIT:received');
        setAppLocale(msg.locale);
        // Startup 중복 스캔 coalesce: 모듈-init 실행 직후 같은 selection에 대한
        // INIT 2회차 반복일 때만 skip한다. selection이 바뀌었거나 1회차가 아직
        // 끝나지 않았으면 정상 실행하여 최신 상태를 잃지 않는다.
        if (!shouldSkipInitSelectionSync()) {
          slog('51 INIT:handleSelectionChange:start');
          handleSelectionChange();
          slog('52 INIT:handleSelectionChange:dispatched');
        } else {
          slog('51 INIT:handleSelectionChange:skipped (startup coalesce)');
        }
        try {
          await restoreUsageSession();
          postFlooowUsage(false);
        } catch (err) {
          console.error('[FLOOOW-USAGE] restore:failed', err);
          postFlooowPlanIssue('blocked');
        }
        slog('53 INIT:handled');
        break;
      default:
        // 알 수 없는 action 무음 무시 방지 — 진단 로그를 남긴다
        console.warn('알 수 없는 PluginAction:', (msg as { type?: string }).type);
        break;
    }
  } catch (err) {
    // 라우터 경계: 개별 핸들러의 예상 못한 throw가 dispatch 전체를 중단시키지 않도록 한다
    console.error('[PluginAction 처리 실패]', (msg as { type?: string }).type, err);
  }
};


// 플러그인 내부 자동 리사이즈/레이아웃 mutation으로 크기가 변경된 노드 ID 추적
// (해당 노드의 width/height 변경으로 인한 불필요한 handleSelectionChange 재진입 방지용)
const internalLayoutNodeIds = new Set<string>();

/** 캔버스에서 Tag 타이틀을 고치면 캡슐 너비를 글자 폭에 맞춘다. */
async function fitTagCapsuleToTitle(card: FrameNode, rawTitle: string): Promise<void> {
  const title = clampTitleChars((rawTitle || '').trim() || 'Tag');
  const spec = getBranchVariantSpec('TAG');
  const nextW = await resolveTagCardWidth(title, spec.width);
  const nextH = spec.height;
  card.name = title;

  const shape = card.children.find(
    (c) => c.name === 'ShapeVector' || c.name === 'DiamondShape'
  ) as (VectorNode | FrameNode) | undefined;
  let bg: RGB = { r: 1, g: 1, b: 1 };
  let stroke: RGB = hexToRgbColor('#1E1E1E');
  let strokeW = 1.5;
  // fills가 비어 있으면 투명 상태이므로 재생성 때도 투명을 유지한다
  const tagFillNone = !(shape && 'fills' in shape && Array.isArray(shape.fills) && shape.fills.length > 0);
  if (shape && 'fills' in shape && Array.isArray(shape.fills) && shape.fills[0]?.type === 'SOLID') {
    bg = shape.fills[0].color;
  }
  if (shape && 'strokes' in shape && Array.isArray(shape.strokes) && shape.strokes[0]?.type === 'SOLID') {
    stroke = shape.strokes[0].color;
  }
  if (shape && 'strokeWeight' in shape && typeof shape.strokeWeight === 'number') {
    strokeW = shape.strokeWeight;
  }

  const widthChanged = Math.round(card.width) !== nextW || Math.round(card.height) !== nextH;
  if (widthChanged) {
    card.minWidth = null;
    card.maxWidth = null;
    card.minHeight = null;
    card.maxHeight = null;
    internalLayoutNodeIds.add(card.id);
    card.resize(nextW, nextH);
    card.primaryAxisSizingMode = 'FIXED';
    card.counterAxisSizingMode = 'FIXED';
    card.minWidth = nextW;
    card.maxWidth = nextW;
    card.minHeight = nextH;
    card.maxHeight = nextH;
    if (shape) shape.remove();
    attachShapeVectorNode(card, 'Branch', nextW, nextH, bg, stroke, strokeW, true, 'TAG', tagFillNone);
  }

  const titleText = card.findOne(
    (c) => c.type === 'TEXT' && (c.name === 'TitleText' || safeGetPluginData(c, 'node_role') === 'title')
  ) as TextNode | null;
  if (titleText) bindShapeTitle(titleText, 'tag');
}

// 캔버스 변경 감지: 신규 커넥터 직각 포맷팅, 노드 이동 시 커넥터 실시간 추적, 기즈모 조작 차단
figma.on('documentchange', async (event) => {
  const movedNodeIds = new Set<string>();
  let connectorSelectionChanged = false;
  let flowNodePropertyChanged = false;
  let shouldUpdateSelectionOnMove = false;
  const usageBefore = sessionElementCount().total;
  let usageTouched = false;

  for (const change of event.documentChanges) {
    if (change.type === 'DELETE') {
      if (forgetTracked(change.id)) usageTouched = true;
    }

    if (change.type === 'CREATE') {
      const createdNode = !isRemovedSceneNode(change.node)
        ? change.node
        : (figma.getNodeById(change.id) as SceneNode | null);
      if (createdNode && !isRemovedSceneNode(createdNode)) {
        if (trackSceneNode(createdNode)) usageTouched = true;
        if (
          createdNode.type === 'CONNECTOR' ||
          safeGetPluginData(createdNode, 'is_custom_connector') === 'true'
        ) {
          registerConnectorInRegistry(createdNode);
        }
      }
    }

    if (change.type === 'PROPERTY_CHANGE') {
      // 1. 노드 이동(x, y) 또는 크기 변경(width, height) 감지 ➔ 연결된 커넥터 실시간 자동 최적화 추적 갱신
      if (
        change.properties.includes('x') ||
        change.properties.includes('y') ||
        change.properties.includes('width') ||
        change.properties.includes('height')
      ) {
        const changedNode = figma.getNodeById(change.id);
        // 커넥터 자체의 패스/위치/크기 변경은 커넥터 자신의 렌더링이므로 노드 이동 재추적 대상에서 제외
        if (changedNode && findConnectorNode(changedNode)) {
          continue;
        }

        // 플로우 노드 내부 자식 요소(StatusBadge, 텍스트 등)의 내부 좌표/크기 변경은 노드의 캔버스 이동이 아님
        const flowNode = changedNode ? findFlowNode(changedNode) : null;
        if (flowNode && changedNode && changedNode.id !== flowNode.id) {
          continue;
        }

        movedNodeIds.add(change.id);
        if (changedNode) {
          if (flowNode) {
            movedNodeIds.add(flowNode.id);
          }
          let p: BaseNode | null = changedNode.parent;
          while (p && p.type !== 'PAGE') {
            movedNodeIds.add(p.id);
            p = p.parent;
          }
        }

        // x, y 좌표 변경(사용자의 캔버스 노드 드래그 이동)인 경우 selection 갱신 필요
        const hasPositionChange = change.properties.includes('x') || change.properties.includes('y');
        const targetId = flowNode ? flowNode.id : change.id;
        const isInternalResize = internalLayoutNodeIds.has(change.id) || internalLayoutNodeIds.has(targetId);

        if (hasPositionChange || !isInternalResize) {
          shouldUpdateSelectionOnMove = true;
        }
        if (isInternalResize) {
          internalLayoutNodeIds.delete(change.id);
          if (flowNode) internalLayoutNodeIds.delete(flowNode.id);
        }
      }

      // 2. 캔버스에서 기즈모 드래그로 사이즈 변경이 시도될 경우 고정된 규격으로 즉시 원복 (기즈모 조작 완전 차단)
      if (change.properties.includes('width') || change.properties.includes('height')) {
        const node = figma.getNodeById(change.id);
        if (!node) continue;
        const flowNode = findFlowNode(node);
        if (flowNode && flowNode.type === 'FRAME' && safeGetPluginData(flowNode, 'is_flow_node') === 'true') {
          const frame = flowNode as FrameNode;
          const currentSizeMode = safeGetPluginData(frame, 'size_mode') as 'fixed' | 'hug' | 'fit';
          // Hug 또는 Fit 모드인 경우: 높이는 컨텐츠에 따른 AUTO이므로 임의의 FIXED 높이로 강제 원복하지 않음
          if (currentSizeMode === 'hug' || currentSizeMode === 'fit') {
            continue;
          }
          const savedW = (frame.minWidth && frame.minWidth > 0) ? frame.minWidth : parseInt(safeGetPluginData(frame, 'node_width'), 10);
          const savedH = (frame.minHeight && frame.minHeight > 0) ? frame.minHeight : parseInt(safeGetPluginData(frame, 'node_height'), 10);
          if (savedW && savedH && (Math.round(frame.width) !== savedW || Math.round(frame.height) !== savedH)) {
            frame.minWidth = null;
            frame.maxWidth = null;
            frame.minHeight = null;
            frame.maxHeight = null;

            internalLayoutNodeIds.add(frame.id);
            frame.resize(savedW, savedH);
            frame.primaryAxisSizingMode = 'FIXED';
            frame.counterAxisSizingMode = 'FIXED';

            frame.minWidth = savedW;
            frame.maxWidth = savedW;
            frame.minHeight = savedH;
            frame.maxHeight = savedH;
          }
        }
      }

      // 2-9. 피그잼 텍스트 에디터에서 폰트 크기·굵기(폰트)·링크·밑줄/취소선·목록 변경 차단
      // - 타이틀(Inter Bold 13) / 설명(Inter Regular 11) / 커넥터 라벨(Inter Regular 9) 표준 규격으로 되돌림
      // - 규격과 다른 세그먼트가 있을 때만 쓰기 때문에 보정으로 인한 재진입 루프가 발생하지 않음
      if (
        change.properties.includes('characters') ||
        change.properties.includes('fontSize') ||
        change.properties.includes('fontName') ||
        change.properties.includes('hyperlink') ||
        change.properties.includes('textDecoration') ||
        change.properties.includes('textStyleId')
      ) {
        const styleLockCandidate = figma.getNodeById(change.id);
        if (styleLockCandidate && styleLockCandidate.type === 'TEXT') {
          const lockText = styleLockCandidate as TextNode;
          const lockRole = safeGetPluginData(lockText, 'node_role');
          const lockParent = lockText.parent;
          const lockIsLabel =
            !!lockParent &&
            (safeGetPluginData(lockParent, 'is_connector_label') === 'true' || lockParent.name === 'ConnectorLabel');
          const lockIsTitle =
            lockRole === 'title' || lockText.name === 'TitleText' || (!!lockParent && lockParent.name === 'Header');
          const lockIsDesc = lockRole === 'desc' || lockText.name === 'DescText';

          if (lockIsLabel) {
            await lockTextEditorStyle(lockText, { family: 'Inter', style: 'Regular', size: LABEL_FONT_SIZE });
          } else if (lockIsTitle && findFlowNode(lockText)) {
            await lockTextEditorStyle(lockText, { family: 'Inter', style: 'Bold', size: 13 });
          } else if (lockIsDesc && findFlowNode(lockText)) {
            await lockTextEditorStyle(lockText, { family: 'Inter', style: 'Regular', size: 11 });
          }
        }
      }

      // 3. 캔버스에서 텍스트 직접 편집 시 타이틀(13px Bold) 및 설명(11px Regular) 스타일 실시간 보정 및 유지
      // 실제 텍스트 내용(characters) 변경 시에만 진입하여 서식/레이아웃 변경으로 인한 무한 재진입 차단
      if (change.properties.includes('characters')) {
        const textNodeCandidate = figma.getNodeById(change.id);
        if (textNodeCandidate && textNodeCandidate.type === 'TEXT') {
          const textNode = textNodeCandidate as TextNode;
          const role = safeGetPluginData(textNode, 'node_role');
          const isHeaderChild = textNode.parent && textNode.parent.name === 'Header';
          const isTitle = role === 'title' || textNode.name === 'TitleText' || isHeaderChild;
          const isDesc = role === 'desc' || textNode.name === 'DescText';

          if (isTitle || isDesc) {
            const flowNode = findFlowNode(textNode);
            if (flowNode) {
              const isScreen =
                flowNode.type === 'FRAME' &&
                normalizeNodeType(safeGetPluginData(flowNode, 'node_type')) === 'Screen';
              const isTag =
                flowNode.type === 'FRAME' &&
                normalizeNodeType(safeGetPluginData(flowNode, 'node_type')) === 'Branch' &&
                safeGetPluginData(flowNode, 'branch_variant') === 'TAG';

              // 타이틀 32자 제한 (UI maxLength={32}와 일치). Tag도 글자가 들어가므로 같다.
              if (isTitle && (isScreen || isTag)) {
                const limited = clampTitleChars(textNode.characters);
                if (limited !== textNode.characters) {
                  await safeSetCharacters(textNode, limited);
                }
              }

              // T-1 해결: Fit 모드 Screen Title의 경우, enforceTitleStandardStyle의 layoutAlign='STRETCH'에 의해
              // 기존 카드 폭에서 일시적으로 2줄 래핑되는 현상을 방지하기 위해, 먼저 필요한 너비를 계산하여 카드 폭을 확장한 후 스타일을 적용함
              if (isTitle) {
                if (isScreen) {
                  const card = flowNode as FrameNode;
                  const sMode = (safeGetPluginData(card, 'size_mode') ||
                    safeGetPluginData(card, 'screen_size_mode') ||
                    'fixed').toLowerCase() as 'fixed' | 'hug' | 'fit';

                  if (sMode === 'fit') {
                    const fitW = await calculateScreenFitWidth(
                      card,
                      textNode.characters,
                      safeGetPluginData(card, 'workflow_status') || undefined,
                      safeGetPluginData(card, 'figma_link') || undefined
                    );
                    const targetW = clampScreenWidth(fitW);
                    const currentW = Math.round(card.width);
                    if (targetW !== currentW) {
                      internalLayoutNodeIds.add(card.id);
                      card.minWidth = targetW;
                      card.maxWidth = targetW;
                      card.resize(targetW, card.height);
                    }
                  }
                }

                // 타이틀 텍스트: 블릿, 링크, 볼드, 취소선 등 일체 반영 차단 및 Inter Bold 13px 표준 규격 강제 고정
                await enforceTitleStandardStyle(textNode, flowNode);
                if (isTag && flowNode.type === 'FRAME') {
                  await fitTagCapsuleToTitle(flowNode as FrameNode, textNode.characters);
                }
              }
              // ※ isDesc인 경우: 타이핑 중 커서 방해 및 입력 필드 깜박임을 방지하기 위해 매 글자마다 TextNode 속성을 쓰지 않음

              // Screen 카드에 대한 size_mode별 자동 크기 재계산 (Screen 노드 한정)
              if (isScreen) {
                const card = flowNode as FrameNode;
                const sMode = (safeGetPluginData(card, 'size_mode') ||
                  safeGetPluginData(card, 'screen_size_mode') ||
                  'fixed') as 'fixed' | 'hug' | 'fit';

                const descText = card.children.find(
                  (c) => c.name === 'DescText' || safeGetPluginData(c, 'node_role') === 'desc'
                ) as TextNode | undefined;

                if (sMode === 'fixed') {
                  // Fixed: 크기 자동 조절 없음 (기존 너비/높이 유지)
                  if (descText) {
                    await updateDescTextTruncation(card, descText, card.height);
                  }
                  if (isDesc) {
                    card.setPluginData('node_desc', textNode.characters);
                  }
                } else if (sMode === 'fit' || sMode === 'hug') {
                  // Description 편집인 경우: Enter(줄바꿈)뿐만 아니라 일반 타이핑에 의한 자동 wrapping도 실시간 감지하여 높이 반영
                  if (isDesc) {
                    // 디스크립션 고정 라인하이트 15px 수렴 (1회성: 이미 15px이면 쓰기 없음)
                    try {
                      const liveLh = textNode.lineHeight as { unit?: string; value?: number } | string | undefined;
                      if (
                        typeof liveLh !== 'object' ||
                        liveLh === null ||
                        (liveLh as { unit?: string }).unit !== 'PIXELS' ||
                        Math.round((liveLh as { value?: number }).value || 0) !== DESC_LINE_HEIGHT
                      ) {
                        textNode.lineHeight = { value: DESC_LINE_HEIGHT, unit: 'PIXELS' };
                      }
                    } catch (_) {}
                    const prevDesc = safeGetPluginData(card, 'node_desc') || '';
                    const currDesc = textNode.characters;
                    card.setPluginData('node_desc', currDesc);

                    const prevNewlines = (prevDesc.match(/\n/g) || []).length;
                    const currNewlines = (currDesc.match(/\n/g) || []).length;
                    const isNewlineAdded = currNewlines > prevNewlines;
                    const isNewlineRemoved = currNewlines < prevNewlines;

                    // 텍스트 내용 및 줄바꿈에 변화가 없는 경우 불필요한 레이아웃 측정 중단
                    if (currDesc === prevDesc && !isNewlineAdded && !isNewlineRemoved) {
                      continue;
                    }
                  }

                  // Figma C++ 텍스트 레이아웃 엔진이 글리프 래핑 및 height를 반영할 수 있도록 1틱(20ms) 대기
                  await new Promise((resolve) => setTimeout(resolve, 20));
                  if (card.removed || textNode.removed) continue;

                  const currentW = Math.round(card.width);
                  const currentH = Math.round(card.height);

                  let targetW = currentW;

                  if (sMode === 'fit' && isTitle) {
                    // Fit 모드 + Title 직접 수정: Width와 Height 모두 다시 계산
                    // 기존 Fit 규칙: Title 1줄 유지, Description 긴 길이는 Width 미결정, Status/Link 내부 최소 Width 보장
                    const fitW = await calculateScreenFitWidth(
                      card,
                      textNode.characters,
                      safeGetPluginData(card, 'workflow_status') || undefined,
                      safeGetPluginData(card, 'figma_link') || undefined
                    );
                    targetW = clampScreenWidth(fitW);
                  } else {
                    // Fit 모드 + Desc 직접 수정 또는 Hug 모드(Title/Desc 직접 수정):
                    // Width는 사용자가 설정한 현재 Width를 유지 (49 ~ 800px 클램프)
                    targetW = clampScreenWidth(
                      Math.max(SCREEN_NODE_CONSTRAINTS.MIN_WIDTH, currentW)
                    );
                  }

                  // Fit 모드에서 Title 변경으로 인해 너비가 바뀐 경우에만 임시 반영하여 정확한 오토레이아웃 높이 산출 준비
                  if (targetW !== currentW) {
                    internalLayoutNodeIds.add(card.id);
                    card.resize(targetW, card.height);
                  }

                  // 실제 TextNode layout 기반 Screen 콘텐츠 높이 산출 (Figma Text Engine 네이티브 height 직접 참조)
                  const headerRow = card.children.find(isHeaderFrame) as FrameNode | undefined;
                  const titleNode = isTitle
                    ? textNode
                    : (headerRow?.children.find(
                        (c) => c.type === 'TEXT' && (c.name === 'TitleText' || safeGetPluginData(c, 'node_role') === 'title')
                      ) as TextNode | undefined);
                  const titleH = isScreen && sMode === 'fit'
                    ? 18
                    : (isTitle && titleNode
                        ? Math.max(18, Math.round(titleNode.height))
                        : (headerRow ? Math.round(headerRow.height) : 18));

                  const descNode = isDesc ? textNode : descText;
                  const descChars = descNode ? descNode.characters : '';
                  const hasDesc = descChars.length > 0;
                  const descH = hasDesc && descNode ? Math.round(descNode.height) : 0;

                  const pt = typeof card.paddingTop === 'number' ? card.paddingTop : 14;
                  const hasStatus = Boolean(safeGetPluginData(card, 'workflow_status'));
                  const hasLink = Boolean(safeGetPluginData(card, 'figma_link'));
                  const hasBottomBadge = hasStatus || hasLink;
                  const pb = typeof card.paddingBottom === 'number'
                    ? card.paddingBottom
                    : (hasBottomBadge ? 36 : (hasDesc ? 16 : 14));
                  const itemSpacing = hasDesc ? (typeof card.itemSpacing === 'number' ? card.itemSpacing : 8) : 0;

                  const calculatedContentH = Math.round(pt + titleH + itemSpacing + descH + pb);
                  const targetH = Math.max(SCREEN_NODE_CONSTRAINTS.MIN_HEIGHT, calculatedContentH);

                  if (isDesc) {
                    card.setPluginData('node_desc', textNode.characters);
                  }

                  // 실제 변경이 있을 때만 resize 호출 (동일 크기 시 불필요한 resize 및 무한 루프 방지)
                  if (targetW !== currentW || targetH !== currentH) {
                    card.counterAxisSizingMode = 'FIXED';
                    card.minWidth = targetW;
                    card.maxWidth = targetW;
                    card.minHeight = SCREEN_NODE_CONSTRAINTS.MIN_HEIGHT;
                    card.maxHeight = null;

                    internalLayoutNodeIds.add(card.id);
                    card.resize(targetW, targetH);
                    card.primaryAxisSizingMode = 'AUTO';
                    card.counterAxisSizingMode = 'FIXED';

                    if (sMode === 'hug') {
                      card.setPluginData('screen_height', String(targetH));
                    }

                    // 부착된 배지들 위치 동기화
                    const statusBadge = card.children.find(
                      (c) => safeGetPluginData(c, 'is_status_badge') === 'true' || c.name === 'StatusBadge'
                    ) as FrameNode | undefined;
                    if (statusBadge) {
                      statusBadge.constraints = { horizontal: 'MAX', vertical: 'MAX' };
                      statusBadge.x = targetW - statusBadge.width - 10;
                      statusBadge.y = targetH - statusBadge.height - 10;
                    }

                    const linkBadge = card.children.find(
                      (c) => safeGetPluginData(c, 'is_figma_link_badge') === 'true' || c.name === 'FigmaLinkBadge'
                    ) as FrameNode | undefined;
                    if (linkBadge) {
                      linkBadge.constraints = { horizontal: 'MIN', vertical: 'MAX' };
                      linkBadge.x = 16;
                      linkBadge.y = targetH - linkBadge.height - 10;
                    }

                    const stepBadge = card.children.find(
                      (c) => safeGetPluginData(c, 'is_step_badge') === 'true' || c.name === 'StepBadge'
                    ) as FrameNode | undefined;
                    if (stepBadge) {
                      const stepCorner = safeGetPluginData(card, 'badge_corner') || 'TOP_LEFT';
                      const bw = Math.max(24, Math.round(stepBadge.width));
                      const bh = 24;
                      const badgeCoords = getStepBadgeCoordinates('Screen', targetW, targetH, bw, bh, stepCorner);
                      stepBadge.x = badgeCoords.x;
                      stepBadge.y = badgeCoords.y;
                      stepBadge.constraints = badgeCoords.constraints;
                    }
                  }
                }
              }
            }
          }
        }
      }

      // 4. 상태(Status) 뱃지 텍스트는 캔버스에서 수정 일체 불가 -> 원래 status 라벨로 강제 원복 및 잠금(locked=true) 유지
      const maybeStatusNode = figma.getNodeById(change.id);
      if (maybeStatusNode) {
        let statusTextNode: TextNode | null = null;
        let badgeFrame: FrameNode | null = null;

        if (maybeStatusNode.type === 'TEXT') {
          const t = maybeStatusNode as TextNode;
          if (
            t.name === 'StatusText' ||
            (t.parent && (t.parent.name === 'StatusBadge' || safeGetPluginData(t.parent, 'is_status_badge') === 'true'))
          ) {
            statusTextNode = t;
            badgeFrame = t.parent && t.parent.type === 'FRAME' ? (t.parent as FrameNode) : null;
          }
        } else if (maybeStatusNode.type === 'FRAME') {
          const f = maybeStatusNode as FrameNode;
          if (f.name === 'StatusBadge' || safeGetPluginData(f, 'is_status_badge') === 'true') {
            badgeFrame = f;
            statusTextNode = f.children.find((c) => c.type === 'TEXT') as TextNode | null;
          }
        }

        if (statusTextNode) {
          const flowNode = findFlowNode(statusTextNode);
          if (flowNode) {
            const currentStatus = safeGetPluginData(flowNode, 'workflow_status') as WorkflowStatus;
            const expectedLabel = currentStatus && STATUS_CONFIG[currentStatus]
              ? STATUS_CONFIG[currentStatus].label.toUpperCase()
              : 'DRAFT';

            if (statusTextNode.characters !== expectedLabel) {
              statusTextNode.locked = false;
              await safeSetCharacters(statusTextNode, expectedLabel);
            }
            statusTextNode.locked = true;
            if (badgeFrame) {
              badgeFrame.locked = true;
            }
          }
        }
      }

      // 4-1. 캔버스에서 커스텀 커넥터 라벨 텍스트 직접 수정 ➔ pluginData(connector_label) 동기화 및 에디터 입력필드 실시간 반영
      // - 텍스트 노드는 건드리지 않음(타이핑 중 커서 방해 방지), 플러그인이 설정한 값과 같으면 무시(무한 루프 차단)
      if (change.properties.includes('characters')) {
        const labelTextCandidate = figma.getNodeById(change.id);
        const labelFrameCandidate =
          labelTextCandidate && labelTextCandidate.type === 'TEXT' ? labelTextCandidate.parent : null;
        if (
          labelTextCandidate &&
          labelTextCandidate.type === 'TEXT' &&
          labelFrameCandidate &&
          (safeGetPluginData(labelFrameCandidate, 'is_connector_label') === 'true' ||
            labelFrameCandidate.name === 'ConnectorLabel')
        ) {
          const labelConnRoot = findConnectorNode(labelFrameCandidate);
          if (labelConnRoot && labelConnRoot.type !== 'CONNECTOR') {
            // 입력필드는 한 줄 텍스트이므로 줄바꿈은 공백으로 정규화
            const editedLabelText = (labelTextCandidate as TextNode).characters
              .replace(/\s*[\r\n\u2028\u2029]+\s*/g, ' ')
              .trim();
            const storedLabelText = safeGetPluginData(labelConnRoot, 'connector_label');
            if (editedLabelText !== storedLabelText) {
              labelConnRoot.setPluginData('connector_label', editedLabelText);
              if (labelConnRoot.type === 'GROUP') {
                for (const child of (labelConnRoot as GroupNode).children) {
                  if (child.type === 'VECTOR' && safeGetPluginData(child, 'is_flow_connector') === 'true') {
                    child.setPluginData('connector_label', editedLabelText);
                  }
                }
              }
              const labelSel = figma.currentPage.selection;
              if (labelSel.some((sel) => sel.id === labelConnRoot.id || findConnectorNode(sel)?.id === labelConnRoot.id)) {
                connectorSelectionChanged = true;
              }
            }
          }
        }
      }

      // 5. 커스텀 커넥터 설정값(컬러, 두께, 패턴 등) 변경 감지 ➔ 선택된 경우 UI 실시간 연동
      if (
        change.properties.includes('strokes') ||
        change.properties.includes('strokeWeight') ||
        change.properties.includes('dashPattern')
      ) {
        const changedNode = figma.getNodeById(change.id);
        const connNode = findConnectorNode(changedNode);
        if (connNode) {
          // 현재 선택된 노드들 중 이 커넥터가 포함되어 있다면 UI 갱신 플래그 활성화
          const currentSelection = figma.currentPage.selection;
          if (currentSelection.some((sel) => sel.id === connNode.id || findConnectorNode(sel)?.id === connNode.id)) {
            connectorSelectionChanged = true;
          }
        }
      }

      // 5-1. 선택된 플로우 노드의 외관 속성(fills, strokes, strokeWeight) 변경 감지 ➔ Undo(Cmd+Z) 및 캔버스 변경 시 UI 실시간 연동
      if (
        change.properties.includes('fills') ||
        change.properties.includes('strokes') ||
        change.properties.includes('strokeWeight')
      ) {
        const changedNode = figma.getNodeById(change.id);
        const flowNode = changedNode ? findFlowNode(changedNode) : null;
        if (flowNode) {
          const currentSelection = figma.currentPage.selection;
          if (currentSelection.some((sel) => sel.id === flowNode.id)) {
            flowNodePropertyChanged = true;
          }
        }
      }
    }
  }

  // 연결된 커넥터들 실시간 동기화 및 에디터 기즈모 갱신
  if (movedNodeIds.size > 0) {
    await syncConnectorsForMovedNodes(movedNodeIds);
    // 내부 레이아웃 mutation(card.resize 등)으로 인한 geometry 변경인 경우 불필요한 handleSelectionChange 재호출 방지
    if (shouldUpdateSelectionOnMove) {
      handleSelectionChange();
    }
  } else if (connectorSelectionChanged || flowNodePropertyChanged) {
    // 피그잼 캔버스에서 변경된 커넥터/플로우 노드 설정값(또는 Undo 실행)을 UI 창에 실시간 연동
    handleSelectionChange();
  }

  if (usageTouched) {
    const usageDelta = sessionElementCount().total - usageBefore;
    if (usageDelta !== 0) publishUsageChange(usageDelta);
    else persistTrack();
  }
});

// 최초 실행 시 현재 상태 동기화 및 커넥터 레지스트리 캐시 구축
slog('03 refreshConnectorRegistry:start');
refreshConnectorRegistry();
slog('04 refreshConnectorRegistry:done');
slog('05 moduleInit:handleSelectionChange:start');
handleSelectionChange().finally(() => {
  // Startup 1회차 완료 표시 — 이후 INIT 수신의 중복 실행 판정에 사용한다.
  // finally이므로 스캔 실패 시에도 이후 INIT가 정상 실행된다.
  slog('06 moduleInit:handleSelectionChange:settled');
  markStartupSelectionSynced();
});
