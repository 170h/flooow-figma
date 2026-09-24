import {
  WorkflowStatus,
  STATUS_CONFIG,
  FrameStatusItem,
  PluginAction,
  CoreToUIMessage,
  FlowNodePayload,
  UpdateNodePayload,
  ConnectPointsPayload,
  SelectedNodeInfo,
  MagnetPosition,
  ConnectorStrokePattern,
  ConnectorRoutingType,
  ConnectorTerminalType,
  DiagramNodeType,
} from './types';
import {
  createOrthogonalVectorConnector,
  updateOrthogonalVectorConnector,
  refreshConnectorRegistry,
  syncConnectorsForMovedNodes,
} from './customConnector';

// RGB 객체를 6자리 HEX 문자열로 변환하는 헬퍼
function rgbToHexColor(rgb: RGB): string {
  const toHex = (c: number) => Math.round(Math.max(0, Math.min(1, c)) * 255).toString(16).padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase();
}

// 플러그인 UI 창 열기 (Figma 신규 디자인 규격 360px 폭 및 라이트 테마 대응)
figma.showUI(__html__, {
  width: 360,
  height: 486,
  themeColors: true,
  title: 'UI Flow Diagram',
});

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
 * 배경색 명도에 따른 타이틀 및 디스크립션 텍스트 Paint 생성 헬퍼
 * - 기본적으로 배경색의 명도에 따라 검정 혹은 화이트
 * - 타이틀: 완전한 검정({ r: 0, g: 0, b: 0 }) 또는 화이트({ r: 1, g: 1, b: 1 })
 * - 디스크립션: 동일한 검정/화이트 베이스에 알파값(opacity)으로 명도를 부드럽게 낮춤
 */
function getTextFillsByBackground(bgColor: RGB, isDarkTheme = false): {
  titleFill: SolidPaint;
  descFill: SolidPaint;
  isBgDark: boolean;
} {
  const luminance = 0.299 * bgColor.r + 0.587 * bgColor.g + 0.114 * bgColor.b;
  const isBgDark = isDarkTheme || luminance < 0.5;

  const baseColor: RGB = isBgDark ? { r: 1, g: 1, b: 1 } : { r: 0, g: 0, b: 0 };
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
    (c) => c.getPluginData('is_figma_link_badge') === 'true' || c.name === 'FigmaLinkBadge'
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
  await loadRequiredFonts();
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
  badge.layoutPositioning = 'ABSOLUTE';
  badge.constraints = { horizontal: 'MIN', vertical: 'MAX' };
  badge.x = 16;
  badge.y = card.height - badge.height - 10;
}

// 선택된 요소 또는 조상 중 커넥터(Figma 네이티브 CONNECTOR 또는 커스텀 벡터 직각 커넥터) 탐색
function findConnectorNode(node: BaseNode | null): SceneNode | null {
  if (!node) return null;
  let curr: BaseNode | null = node;

  while (curr && curr.type !== 'PAGE' && curr.type !== 'DOCUMENT') {
    if (
      curr.type === 'CONNECTOR' ||
      curr.getPluginData('is_custom_connector') === 'true' ||
      curr.getPluginData('is_flow_connector') === 'true'
    ) {
      // 만약 부모가 커스텀 커넥터 그룹이라면 최상위 커넥터 그룹을 반환
      let topConnector: SceneNode = curr as SceneNode;
      let parentScan: BaseNode | null = curr.parent;
      while (parentScan && parentScan.type !== 'PAGE' && parentScan.type !== 'DOCUMENT') {
        if (
          parentScan.getPluginData('is_custom_connector') === 'true' ||
          parentScan.getPluginData('is_flow_connector') === 'true'
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
  let topCandidate: (FrameNode | ShapeWithTextNode) | null = null;

  while (curr && curr.type !== 'PAGE' && curr.type !== 'DOCUMENT') {
    if (curr.getPluginData('is_flow_node') === 'true') {
      return curr as FrameNode | ShapeWithTextNode;
    }
    if (curr.type === 'FRAME' || curr.type === 'SHAPE_WITH_TEXT') {
      if (curr.getPluginData('is_connector_label') !== 'true' && curr.name !== 'ConnectorLabel') {
        topCandidate = curr as FrameNode | ShapeWithTextNode;
      }
    }
    curr = curr.parent;
  }
  return topCandidate;
}

// 캔버스 내 플로우 노드 개수 확인 (태그 자동 넘버링: p1, p2, p3...)
function getNextFlowTag(): string {
  const flowNodes = figma.currentPage.findAll(
    (node) => node.getPluginData('is_flow_node') === 'true'
  );
  return `p${flowNodes.length + 1}`;
}

// FigJam Node 객체 자체를 Source of Truth로 하여 실제 Title/Description 텍스트 추출
function extractNodeText(node: SceneNode): { title: string; description: string } {
  let title = '';
  let description = '';

  if (node.type === 'FRAME' || 'findAll' in node) {
    const frame = node as FrameNode;
    // 1. node_role 플러그인 데이터 또는 이름으로 명시적 자식 검색
    const titleTextNode = frame.findOne(
      (c) => c.type === 'TEXT' && (c.name === 'TitleText' || c.getPluginData('node_role') === 'title')
    ) as TextNode | null;
    const descTextNode = frame.findOne(
      (c) => c.type === 'TEXT' && (c.name === 'DescText' || c.getPluginData('node_role') === 'desc')
    ) as TextNode | null;

    if (titleTextNode) {
      title = titleTextNode.characters;
    }
    if (descTextNode) {
      description = descTextNode.characters;
    }

    // 2. 명시적 역할이 없는 일반 텍스트 노드인 경우 순서대로 추출
    if (!title) {
      const allTexts = frame.findAll((n) => n.type === 'TEXT') as TextNode[];
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
    title = node.name || node.getPluginData('node_title') || 'Untitled';
  }
  if (!description) {
    description = node.getPluginData('node_desc') || '';
  }

  return { title, description };
}

// 카드의 전체 내용(헤더 + 패딩 + 설명 텍스트 전체 + 상태 뱃지 여백)을 모두 수용하기 위한 최소 Hug 높이 정밀 산출
// 피그마 네이티브 오토레이아웃 렌더링 엔진을 Source of Truth로 사용하여 1픽셀의 오차도 없이 일원화
function calculateCardHugHeight(card: FrameNode, textCharacters?: string): number {
  const isAuto = card.primaryAxisSizingMode === 'AUTO';
  if (isAuto && textCharacters === undefined) {
    return Math.round(card.height);
  }

  const prevSizingMode = card.primaryAxisSizingMode;
  const prevHeight = card.height;
  const prevMinHeight = card.minHeight;
  const prevMaxHeight = card.maxHeight;

  const descText = card.children.find(
    (c) => c.name === 'DescText' || c.getPluginData('node_role') === 'desc'
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

    return hugH;
  } catch (_) {
    return Math.round(card.height);
  }
}

// 설명 텍스트 말줄임(...) 처리 함수
// 디스크립션 박스는 기본적으로 auto(maxLines = null, textAutoResize = 'HEIGHT')로 동작합니다.
// 1. Hug contents 모드이거나,
// 2. Fixed height 모드이더라도 카드 높이가 텍스트 전체를 담을 수 있을 만큼 충분한 경우 (currentHeight >= hugH - 4)
//    -> maxLines = null로 유지하여 어떠한 말줄임(...)도 생기지 않습니다.
// 3. 오직 카드가 작아서 텍스트가 카드 바깥으로 실제로 넘칠 때에만 가용 높이에 맞추어 maxLines(...)를 적용합니다.
function updateDescTextTruncation(card: FrameNode, descText: TextNode, currentHeight: number, textCharacters?: string) {
  descText.textTruncation = 'ENDING';
  const isHug = card.primaryAxisSizingMode === 'AUTO';
  if (isHug) {
    descText.maxLines = null;
    return;
  }

  const hugH = calculateCardHugHeight(card, textCharacters);
  // 카드 높이가 텍스트 전체를 담을 수 있는 크기(Hug 높이) 이상이거나 여유가 있으면 말줄임 불필요 (기본 Auto 유지)
  if (currentHeight >= hugH - 4) {
    descText.maxLines = null;
    return;
  }

  // 박스 높이를 실제로 벗어나는 경우에만 가용 줄수 계산하여 말줄임
  const statusBadge = card.children.find(
    (c) => c.getPluginData('is_status_badge') === 'true' || c.name === 'StatusBadge'
  );
  const pb = statusBadge ? 36 : 16;
  const headerRow = card.children.find(
    (c) => c.name === 'Header' || (c.type === 'FRAME' && (c as FrameNode).layoutMode === 'HORIZONTAL')
  ) as FrameNode | undefined;
  const headerH = headerRow ? headerRow.height : 20;

  const availableH = Math.max(14, currentHeight - 14 - pb - 8 - Math.round(headerH));
  // Inter 11px의 1줄 실질 높이는 약 13.5px
  descText.maxLines = Math.max(1, Math.floor(availableH / 13.5));
}

// 선택 영역 변경 감지 시 UI 갱신 (바탕화면 클릭 ➔ 빈 폼 / 노드 클릭 ➔ 상세 수정 폼)
function handleSelectionChange() {
  const rawSelection = figma.currentPage.selection;

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
  const flowNodes = nonConnNodes.filter((n) => n.getPluginData('is_flow_node') === 'true');
  const otherObjects = nonConnNodes.filter((n) => n.getPluginData('is_flow_node') !== 'true');

  const flowNodeCount = flowNodes.length;
  const otherObjectCount = otherObjects.length;
  const connectorCount = connNodes.length;

  // UI 편집 대상 노드 결정:
  // - 플로우 노드가 1개 이상이면 플로우 노드만 전달하여 일반 객체의 속성 오염/훼손 방지
  // - 플로우 노드가 전혀 없고 커넥터만 있으면 커넥터 전달
  // - 플로우 노드와 커넥터가 없고 일반 객체만 있으면 일반 객체 전달
  let uniqueNodes: SceneNode[] = [];
  if (flowNodeCount > 0) {
    uniqueNodes = flowNodes;
  } else if (connectorCount > 0 && otherObjectCount === 0) {
    uniqueNodes = connNodes;
  } else {
    uniqueNodes = otherObjects;
  }

  const nodes: SelectedNodeInfo[] = uniqueNodes.map((node) => {
    const isFlowNode = node.getPluginData('is_flow_node') === 'true';

    // 캔버스 기즈모로 사이즈 조절이 되지 않도록 min/max 치수를 현재 크기로 완전 잠금
    if (isFlowNode && node.type === 'FRAME') {
      const frame = node as FrameNode;
      const w = Math.round(frame.width);
      const h = Math.round(frame.height);
      if (frame.minWidth !== w || frame.maxWidth !== w || frame.minHeight !== h || frame.maxHeight !== h) {
        frame.minWidth = w;
        frame.maxWidth = w;
        frame.minHeight = h;
        frame.maxHeight = h;
      }

      // 기존 우상단에 있던 상태 뱃지를 하단 오른쪽 박스 안쪽으로 자동 이동 및 텍스트 수정 차단(locked=true)
      const statusBadge = frame.children.find(
        (c) => c.getPluginData('is_status_badge') === 'true' || c.name === 'StatusBadge'
      ) as FrameNode | undefined;
      if (statusBadge) {
        if (frame.paddingBottom !== 36) {
          frame.paddingBottom = 36;
        }
        statusBadge.paddingLeft = 9;
        statusBadge.paddingRight = 9;
        const nodeCornerRadius = typeof frame.cornerRadius === 'number' ? frame.cornerRadius : 0;
        statusBadge.cornerRadius = getStatusBadgeCornerRadius(nodeCornerRadius);
        statusBadge.constraints = { horizontal: 'MAX', vertical: 'MAX' };
        statusBadge.x = frame.width - statusBadge.width - 10;
        statusBadge.y = frame.height - statusBadge.height - 10;
        statusBadge.locked = true;
        const textChild = statusBadge.children.find((c) => c.type === 'TEXT') as TextNode | undefined;
        if (textChild) textChild.locked = true;
      }

      // 타이틀 텍스트 서식(블릿, 링크, 볼드, 취소선 등) 차단 및 표준 규격 검사
      const headerFrame = frame.children.find((c) => c.name === 'Header') as FrameNode | undefined;
      const titleText = headerFrame
        ? (headerFrame.children.find((c) => c.type === 'TEXT') as TextNode | undefined)
        : (frame.children.find((c) => c.type === 'TEXT' && (c.name === 'TitleText' || c.getPluginData('node_role') === 'title')) as TextNode | undefined);
      if (titleText) {
        enforceTitleStandardStyle(titleText, frame);
      }
      const descText = frame.children.find(
        (c) => c.type === 'TEXT' && (c.name === 'DescText' || c.getPluginData('node_role') === 'desc')
      ) as TextNode | undefined;
      if (descText) {
        lockTextFontSizeAndAutoResize(descText, 11);
      }
    }

    let title = '';
    let description = '';
    let tag = node.getPluginData('node_tag') || '';
    let connectorLabel: string | undefined;
    let connectorLineType: 'ELBOWED' | 'STRAIGHT' | 'CURVED' | undefined;
    let connectorColorHex: string | undefined;
    let connectorStrokeWeight: number | undefined;
    let connectorStrokePattern: ConnectorStrokePattern | undefined;
    let connectorRoutingType: ConnectorRoutingType | undefined;
    let connectorStartTerminal: ConnectorTerminalType | undefined;
    let connectorEndTerminal: ConnectorTerminalType | undefined;

    let connectorSourceNodeName: string | undefined;
    let connectorTargetNodeName: string | undefined;
    let connectorSourceMagnet: MagnetPosition | undefined;
    let connectorTargetMagnet: MagnetPosition | undefined;

    const isCustomConnector =
      node.getPluginData('is_custom_connector') === 'true' ||
      node.getPluginData('is_flow_connector') === 'true';
    const isFigmaConnector = node.type === 'CONNECTOR';
    const isConnector = isFigmaConnector || isCustomConnector;

    if (isConnector) {
      if (isFigmaConnector) {
        const conn = node as ConnectorNode;
        connectorLabel = conn.text ? conn.text.characters : '';
        connectorLineType = conn.connectorLineType;
        connectorRoutingType = conn.connectorLineType === 'STRAIGHT' ? 'STRAIGHT' : 'ORTHOGONAL';
        connectorStrokeWeight = typeof conn.strokeWeight === 'number' ? conn.strokeWeight : 1.5;

        if (Array.isArray(conn.strokes) && conn.strokes.length > 0 && conn.strokes[0].type === 'SOLID') {
          connectorColorHex = rgbToHexColor(conn.strokes[0].color);
        }

        if (Array.isArray(conn.dashPattern) && conn.dashPattern.length > 0) {
          connectorStrokePattern = conn.dashPattern[0] <= 2 ? 'DOTTED' : 'DASHED';
        } else {
          connectorStrokePattern = 'SOLID';
        }

        const mapCapToTerm = (cap: string): ConnectorTerminalType => {
          if (cap.includes('BAR') || cap.includes('EXACTLY_ONE')) return 'BAR';
          if (cap.includes('SQUARE')) return 'SQUARE';
          if (cap.includes('REVERSED_TRIANGLE')) return 'REVERSED_TRIANGLE_ARROW';
          if (cap.includes('TRIANGLE_ARROW') || cap.includes('ARROW_EQUILATERAL')) return 'ARROW';
          if (cap.includes('ARROW_LINES') || cap === 'ARROW') return 'ARROW';
          if (cap.includes('DIAMOND_FILLED') || cap === 'DIAMOND') return 'DIAMOND';
          if (cap.includes('CIRCLE_FILLED') || cap === 'CIRCLE') return 'CIRCLE';
          return 'NONE';
        };
        connectorStartTerminal = mapCapToTerm(String(conn.connectorStartStrokeCap || 'NONE'));
        connectorEndTerminal = mapCapToTerm(String(conn.connectorEndStrokeCap || 'NONE'));

        // Figma 네이티브 커넥터의 연결 엔드포인트 노드 정보 확인
        if (conn.connectorStart && 'endpointNodeId' in conn.connectorStart && conn.connectorStart.endpointNodeId) {
          const sNode = figma.getNodeById(conn.connectorStart.endpointNodeId);
          if (sNode) connectorSourceNodeName = sNode.name;
          if ('magnet' in conn.connectorStart) {
            connectorSourceMagnet = conn.connectorStart.magnet as MagnetPosition;
          }
        }
        if (conn.connectorEnd && 'endpointNodeId' in conn.connectorEnd && conn.connectorEnd.endpointNodeId) {
          const tNode = figma.getNodeById(conn.connectorEnd.endpointNodeId);
          if (tNode) connectorTargetNodeName = tNode.name;
          if ('magnet' in conn.connectorEnd) {
            connectorTargetMagnet = conn.connectorEnd.magnet as MagnetPosition;
          }
        }
      } else {
        // 커스텀 벡터 직각 커넥터 (그룹 또는 벡터 노드)
        connectorLabel = node.getPluginData('connector_label') || '';
        connectorLineType = 'ELBOWED';
        connectorRoutingType = (node.getPluginData('connector_routing') as ConnectorRoutingType) || 'ORTHOGONAL';
        connectorColorHex = node.getPluginData('connector_color');
        const savedWeight = node.getPluginData('connector_weight');
        connectorStrokeWeight = savedWeight ? parseFloat(savedWeight) : undefined;
        connectorStrokePattern = (node.getPluginData('connector_pattern') as ConnectorStrokePattern) || 'SOLID';
        connectorStartTerminal = (node.getPluginData('start_terminal') as ConnectorTerminalType) || 'NONE';
        connectorEndTerminal = (node.getPluginData('end_terminal') as ConnectorTerminalType) || 'ARROW';

        // 연결된 소스 및 타깃 노드 정보 및 마그넷 위치 추출
        const srcId = node.getPluginData('source_node_id');
        const tgtId = node.getPluginData('target_node_id');
        if (srcId) {
          const sNode = figma.getNodeById(srcId);
          if (sNode) connectorSourceNodeName = sNode.name;
        }
        if (tgtId) {
          const tNode = figma.getNodeById(tgtId);
          if (tNode) connectorTargetNodeName = tNode.name;
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
    const flowNodeType: DiagramNodeType = savedType || 'Screen';
    const savedStatus = node.getPluginData('workflow_status') as WorkflowStatus;

    let sizeMode: 'fixed' | 'hug' = 'fixed';
    let hugHeight = Math.round(node.height);

    if (isFlowNode && node.type === 'FRAME') {
      const frame = node as FrameNode;
      const isAuto = frame.primaryAxisSizingMode === 'AUTO';
      sizeMode = isAuto ? 'hug' : 'fixed';

      // Hug contents 높이: status 유무(패딩 36px vs 16px)를 항상 정확하게 반영하여 실시간 산출
      hugHeight = calculateCardHugHeight(frame);
    }

    let nodeFillColor: string | undefined;
    let nodeStrokeColor: string | undefined;
    let nodeStrokeWeight: number | undefined;

    if ('fills' in node && Array.isArray(node.fills) && node.fills.length > 0) {
      const firstFill = node.fills[0];
      if (firstFill.type === 'SOLID') {
        nodeFillColor = rgbToHexColor(firstFill.color);
      }
    }
    if ('strokes' in node && Array.isArray(node.strokes) && node.strokes.length > 0) {
      const firstStroke = node.strokes[0];
      if (firstStroke.type === 'SOLID') {
        nodeStrokeColor = rgbToHexColor(firstStroke.color);
      }
    }
    if ('strokeWeight' in node && typeof (node as any).strokeWeight === 'number') {
      nodeStrokeWeight = (node as any).strokeWeight;
    }
    let cornerRadius = 0;
    if ('cornerRadius' in node && typeof (node as any).cornerRadius === 'number') {
      cornerRadius = Math.round((node as any).cornerRadius);
    }

    return {
      id: node.id,
      name: node.name,
      isFlowNode,
      isConnector,
      nodeType: node.type,
      flowNodeType,
      status: savedStatus || undefined,
      title,
      description,
      tag,
      theme: (node.getPluginData('node_theme') as 'light' | 'dark') || 'light',
      figmaLink: node.getPluginData('figma_link'),
      cachedFigmaLink: node.getPluginData('cached_figma_link') || node.getPluginData('figma_link') || undefined,
      connectorLabel,
      connectorLineType,
      connectorColorHex,
      connectorStrokeWeight,
      connectorStrokePattern,
      connectorRoutingType,
      connectorStartTerminal,
      connectorEndTerminal,
      connectorSourceNodeName,
      connectorTargetNodeName,
      connectorSourceMagnet,
      connectorTargetMagnet,
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
    };
  });

  let currentStatus: WorkflowStatus | undefined;
  if (uniqueNodes.length === 1) {
    const saved = uniqueNodes[0].getPluginData('workflow_status') as WorkflowStatus;
    if (saved) currentStatus = saved;
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
  });
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

// 설명 텍스트용: 폰트 사이즈(11px) 및 텍스트 박스 자동 리사이즈 모드만 고정하고,
// 나머지 서식(굵기, 색상, 이탤릭, 링크 등)은 모두 자유롭게 허용하는 헬퍼
function lockTextFontSizeAndAutoResize(textNode: TextNode, targetSize: number) {
  try {
    // 1. 폰트 사이즈만 고정 (볼드, 색상, 이탤릭 등 다른 서식은 100% 보존)
    if (textNode.fontSize !== targetSize) {
      textNode.fontSize = targetSize;
    }

    // 2. 텍스트 박스 크기 조절 모드 고정 (너비는 부모 프레임에 맞춤, 높이는 내용에 맞춰 자동 조절)
    if (textNode.textAutoResize !== 'HEIGHT') {
      textNode.textAutoResize = 'HEIGHT';
    }

    if (textNode.layoutAlign !== 'STRETCH') {
      textNode.layoutAlign = 'STRETCH';
    }

    // 영역 초과 시 말줄임(...) 처리
    textNode.textTruncation = 'ENDING';
  } catch (err) {
    console.warn('폰트 사이즈 및 리사이즈 모드 고정 실패:', err);
  }
}

// 타이틀 텍스트용: 피그잼 캔버스 서식(블릿, 링크, 볼드, 취소선 등) 일체 반영 차단 및 Inter Bold 13px 표준 고정, 오직 텍스트 내용만 유지
async function enforceTitleStandardStyle(textNode: TextNode, flowNode?: FrameNode | BaseNode | null) {
  try {
    const targetFont: FontName = { family: 'Inter', style: 'Bold' };
    const targetSize = 13;

    // 테마 및 배경색에 따른 타이틀 글자 색상 결정
    let isDark = false;
    let bgColor: RGB = { r: 1, g: 1, b: 1 };
    if (flowNode && 'getPluginData' in flowNode) {
      isDark = flowNode.getPluginData('node_theme') === 'dark';
    }
    if (flowNode && 'fills' in flowNode) {
      const fNode = flowNode as FrameNode;
      if (Array.isArray(fNode.fills) && fNode.fills.length > 0 && fNode.fills[0].type === 'SOLID') {
        bgColor = fNode.fills[0].color;
      }
    }
    const { titleFill } = getTextFillsByBackground(bgColor, isDark);

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
      textNode.characters = cleanedText;
      len = textNode.characters.length;
    }

    if (len > 0) {
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

      // 전체 범위 일괄 초기화 (이중 안전장치)
      try { textNode.setRangeFontName(0, len, targetFont); } catch (_) {}
      try { textNode.setRangeFontSize(0, len, targetSize); } catch (_) {}
      try { textNode.setRangeFills(0, len, [titleFill]); } catch (_) {}
      try { textNode.setRangeTextDecoration(0, len, 'NONE'); } catch (_) {}
      try { textNode.setRangeHyperlink(0, len, null); } catch (_) {}
      try { textNode.setRangeListOptions(0, len, { type: 'NONE' }); } catch (_) {}
      try { textNode.setRangeIndentation(0, len, 0); } catch (_) {}
    } else {
      try { textNode.fontName = targetFont; } catch (_) {}
      try { textNode.fontSize = targetSize; } catch (_) {}
      try { textNode.fills = [titleFill]; } catch (_) {}
      try { textNode.textDecoration = 'NONE'; } catch (_) {}
      try { textNode.hyperlink = null; } catch (_) {}
    }

    // 4. 텍스트 박스 리사이즈 모드 및 말줄임 고정
    if (textNode.textAutoResize !== 'HEIGHT') {
      textNode.textAutoResize = 'HEIGHT';
    }
    if (textNode.layoutGrow !== 1) {
      textNode.layoutGrow = 1;
    }
    textNode.textTruncation = 'ENDING';
    textNode.maxLines = 1;

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
  const width = Math.max(120, Math.round(shape.width));
  const height = Math.max(50, Math.round(shape.height));
  const x = shape.x;
  const y = shape.y;
  const parent = shape.parent || figma.currentPage;

  const isDark = theme === 'dark';
  let bgColor: RGB = isDark ? { r: 0.14, g: 0.14, b: 0.15 } : { r: 1, g: 1, b: 1 };
  if (Array.isArray(shape.fills) && shape.fills.length > 0 && shape.fills[0].type === 'SOLID') {
    bgColor = shape.fills[0].color;
  }
  const { titleFill, descFill, isBgDark } = getTextFillsByBackground(bgColor, isDark);
  const borderColor: RGB = isBgDark ? { r: 0.28, g: 0.28, b: 0.3 } : { r: 0.15, g: 0.15, b: 0.18 };

  const card = figma.createFrame();
  card.name = title;
  card.x = x;
  card.y = y;
  card.resize(width, height);
  card.cornerRadius = 0; // 완전 직각
  card.strokeWeight = 1.5;
  card.strokes = [{ type: 'SOLID', color: borderColor }];
  card.fills = [{ type: 'SOLID', color: bgColor }];
  card.clipsContent = true;

  card.layoutMode = 'VERTICAL';
  card.primaryAxisSizingMode = 'FIXED';
  card.counterAxisSizingMode = 'FIXED';
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

  // 헤더 행 (타이틀 + 상태 뱃지 수용 공간)
  const headerRow = figma.createFrame();
  headerRow.name = 'Header';
  headerRow.layoutMode = 'HORIZONTAL';
  headerRow.layoutAlign = 'STRETCH';
  headerRow.primaryAxisSizingMode = 'AUTO';
  headerRow.counterAxisSizingMode = 'AUTO';
  headerRow.primaryAxisAlignItems = 'CENTER';
  headerRow.counterAxisAlignItems = 'CENTER';
  headerRow.itemSpacing = 8;
  headerRow.fills = [];

  const titleText = figma.createText();
  titleText.name = 'TitleText';
  titleText.fontName = { family: 'Inter', style: 'Bold' };
  titleText.fontSize = 13;
  titleText.characters = title;
  titleText.fills = [titleFill];
  titleText.layoutGrow = 1;
  titleText.textAutoResize = 'HEIGHT';
  titleText.textTruncation = 'ENDING';
  titleText.maxLines = 1;
  titleText.setPluginData('node_role', 'title');
  headerRow.appendChild(titleText);

  card.appendChild(headerRow);

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
    statusBadge.layoutPositioning = 'ABSOLUTE';
    statusBadge.constraints = { horizontal: 'MAX', vertical: 'MAX' };
    statusBadge.x = card.width - statusBadge.width - 10;
    statusBadge.y = card.height - statusBadge.height - 10;
  }

  // 설명 텍스트
  const descText = figma.createText();
  descText.name = 'DescText';
  descText.fontName = { family: 'Inter', style: 'Regular' };
  descText.fontSize = 11;
  descText.characters = desc;
  descText.fills = [descFill];
  descText.layoutAlign = 'STRETCH';
  descText.textAutoResize = 'HEIGHT';
  updateDescTextTruncation(card, descText, height, desc);
  descText.setPluginData('node_role', 'desc');
  card.appendChild(descText);

  // 스텝 번호 뱃지 복원
  if (stepNumber) {
    const stepBadge = figma.createFrame();
    stepBadge.name = `[Step] ${stepNumber}`;
    card.appendChild(stepBadge);
    stepBadge.layoutPositioning = 'ABSOLUTE';
    stepBadge.layoutMode = 'HORIZONTAL';
    stepBadge.primaryAxisAlignItems = 'CENTER';
    stepBadge.counterAxisAlignItems = 'CENTER';
    stepBadge.paddingLeft = 7;
    stepBadge.paddingRight = 7;
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
    if (bCorner === 'TOP_RIGHT') {
      stepBadge.x = card.width - bw + 8;
      stepBadge.y = -8;
      stepBadge.constraints = { horizontal: 'MAX', vertical: 'MIN' };
    } else if (bCorner === 'BOTTOM_LEFT') {
      stepBadge.x = -8;
      stepBadge.y = card.height - bh + 8;
      stepBadge.constraints = { horizontal: 'MIN', vertical: 'MAX' };
    } else if (bCorner === 'BOTTOM_RIGHT') {
      stepBadge.x = card.width - bw + 8;
      stepBadge.y = card.height - bh + 8;
      stepBadge.constraints = { horizontal: 'MAX', vertical: 'MAX' };
    } else {
      stepBadge.x = -8;
      stepBadge.y = -8;
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

  // 커넥터 연결선 안전 인계
  const oldId = shape.id;
  const connectors = figma.currentPage.findAll((n) => n.type === 'CONNECTOR') as ConnectorNode[];
  for (const conn of connectors) {
    if (conn.connectorStart && 'endpointNodeId' in conn.connectorStart && conn.connectorStart.endpointNodeId === oldId) {
      const magnet = 'magnet' in conn.connectorStart ? conn.connectorStart.magnet : 'AUTO';
      conn.connectorStart = { endpointNodeId: card.id, magnet };
    }
    if (conn.connectorEnd && 'endpointNodeId' in conn.connectorEnd && conn.connectorEnd.endpointNodeId === oldId) {
      const magnet = 'magnet' in conn.connectorEnd ? conn.connectorEnd.magnet : 'AUTO';
      conn.connectorEnd = { endpointNodeId: card.id, magnet };
    }
  }

  shape.remove();
  return card;
}

// ----------------------------------------------------
// 3. UI Flow Node 카드 생성 (직각 모서리 + 고정 폰트 + 세련된 레이아웃)
// ----------------------------------------------------
async function createFlowNode(payload: FlowNodePayload) {
  try {
    await loadRequiredFonts();

    const title = (payload.title || '').trim() || 'Welcome';
    const description = (payload.description || '').trim() || 'Entry point of the flow.';
    const theme = payload.theme || 'light';
    const width = payload.width ? Math.max(120, payload.width) : 250;
    const height = payload.height ? Math.max(50, payload.height) : 90;

    const isDark = theme === 'dark';
    let bgColor: RGB = isDark ? { r: 0.14, g: 0.14, b: 0.15 } : { r: 1, g: 1, b: 1 };
    if (payload.colorHex) {
      bgColor = hexToRgbColor(payload.colorHex);
    }
    const { titleFill, descFill, isBgDark } = getTextFillsByBackground(bgColor, isDark);

    const borderColor: RGB = isBgDark ? { r: 0.28, g: 0.28, b: 0.3 } : { r: 0.15, g: 0.15, b: 0.18 };

    // 1. 메인 카드 프레임
    const card = figma.createFrame();
    card.name = title;
    card.cornerRadius = typeof payload.cornerRadius === 'number' ? Math.min(20, Math.max(0, payload.cornerRadius)) : 0;
    if (typeof payload.strokeWeight === 'number') {
      card.strokeWeight = payload.strokeWeight;
      if (payload.strokeWeight === 0) {
        card.strokes = [];
      } else {
        const sColor = payload.strokeColor ? hexToRgbColor(payload.strokeColor) : borderColor;
        card.strokes = [{ type: 'SOLID', color: sColor }];
      }
    } else {
      card.strokeWeight = 1.5;
      card.strokes = [{ type: 'SOLID', color: borderColor }];
    }
    card.fills = [{ type: 'SOLID', color: bgColor }];
    card.clipsContent = true;

    card.layoutMode = 'VERTICAL';
    card.primaryAxisSizingMode = 'FIXED';
    card.counterAxisSizingMode = 'FIXED';
    const hasStatus = Boolean(payload.status && STATUS_CONFIG[payload.status]);
    const hasLink = Boolean(payload.figmaLink && payload.figmaLink.trim());
    card.paddingTop = 14;
    card.paddingBottom = (hasStatus || hasLink) ? 36 : 16;
    card.paddingLeft = 16;
    card.paddingRight = 16;
    card.itemSpacing = 8;
    card.primaryAxisAlignItems = 'MIN';
    card.counterAxisAlignItems = 'MIN';
    card.resize(width, height);

    // 캔버스 기즈모 리사이즈 원천 차단 (현재 크기로 min/max 완전 고정)
    card.minWidth = width;
    card.maxWidth = width;
    card.minHeight = height;
    card.maxHeight = height;

    // 2. 헤더 행 (타이틀 + 상태 뱃지 배치용)
    const headerRow = figma.createFrame();
    headerRow.name = 'Header';
    headerRow.layoutMode = 'HORIZONTAL';
    headerRow.layoutAlign = 'STRETCH';
    headerRow.primaryAxisSizingMode = 'AUTO';
    headerRow.counterAxisSizingMode = 'AUTO';
    headerRow.primaryAxisAlignItems = 'CENTER';
    headerRow.counterAxisAlignItems = 'CENTER';
    headerRow.itemSpacing = 8;
    headerRow.fills = [];

    // 3. 타이틀 텍스트 (13px Bold 고정, 영역 초과 시 .. 말줄임)
    const titleText = figma.createText();
    titleText.name = 'TitleText';
    titleText.fontName = { family: 'Inter', style: 'Bold' };
    titleText.fontSize = 13;
    titleText.characters = title;
    titleText.fills = [titleFill];
    titleText.layoutGrow = 1;
    titleText.textAutoResize = 'HEIGHT';
    titleText.textTruncation = 'ENDING';
    titleText.maxLines = 1;
    titleText.setPluginData('node_role', 'title');
    headerRow.appendChild(titleText);

    card.appendChild(headerRow);

    // 4. 설명 텍스트 (11px Regular 고정, 박스 높이 초과 시 .. 말줄임)
    const descText = figma.createText();
    descText.name = 'DescText';
    descText.fontName = { family: 'Inter', style: 'Regular' };
    descText.fontSize = 11;
    descText.characters = description;
    descText.fills = [descFill];
    descText.layoutAlign = 'STRETCH';
    descText.textAutoResize = 'HEIGHT';
    updateDescTextTruncation(card, descText, height, description);
    descText.setPluginData('node_role', 'desc');
    card.appendChild(descText);

    // 메타데이터 보관 (FigJam 네이티브 객체 속성을 Source of Truth로 사용하므로 중복 데이터 제거)
    card.name = title;
    card.setPluginData('is_flow_node', 'true');
    card.setPluginData('schema_version', '2');
    card.setPluginData('node_theme', theme);
    card.setPluginData('node_type', payload.nodeType || 'Screen');
    if (payload.status) {
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
        statusBadge.layoutPositioning = 'ABSOLUTE';
        statusBadge.constraints = { horizontal: 'MAX', vertical: 'MAX' };
        statusBadge.x = card.width - statusBadge.width - 10;
        statusBadge.y = card.height - statusBadge.height - 10;
      }
    }

    // Figma Screen Link 펜 아이콘 뱃지(하단 왼쪽) 생성
    await updateFigmaLinkBadge(card, payload.figmaLink, isBgDark);

    // 엘리베이션(그림자) 효과 적용
    if (typeof payload.elevation === 'number') {
      card.setPluginData('node_elevation', `${payload.elevation}`);
      card.effects = getElevationEffects(payload.elevation, isBgDark);
      card.clipsContent = false;
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
    figma.currentPage.selection = [card];
    figma.viewport.scrollAndZoomIntoView([card]);

    handleSelectionChange();
    notify(`[${title}] 노드가 생성되었습니다!`, 'success');
  } catch (err) {
    notify(`노드 생성 실패: ${String(err)}`, 'error');
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
      notify('수정할 노드를 찾을 수 없습니다. 캔버스에서 노드를 선택해 주세요.', 'warning');
      return;
    }

    // 쉐이프 노드인 경우 프레임 노드로 마이그레이션
    if (flowNode.type === 'SHAPE_WITH_TEXT') {
      flowNode = await convertShapeToFrameNode(flowNode as ShapeWithTextNode);
    }

    await loadRequiredFonts();

    const title = payload.title.trim() || 'Untitled';
    const description = payload.description.trim() || '';
    const isDark = payload.theme === 'dark';
    let bgColor: RGB = isDark ? { r: 0.14, g: 0.14, b: 0.15 } : { r: 1, g: 1, b: 1 };
    if (payload.colorHex) {
      bgColor = hexToRgbColor(payload.colorHex);
    } else {
      const currentFill = (flowNode as FrameNode).fills;
      if (Array.isArray(currentFill) && currentFill.length > 0 && currentFill[0].type === 'SOLID') {
        bgColor = currentFill[0].color;
      }
    }
    const { titleFill, descFill, isBgDark } = getTextFillsByBackground(bgColor, isDark);

    const borderColor: RGB = isBgDark ? { r: 0.28, g: 0.28, b: 0.3 } : { r: 0.15, g: 0.15, b: 0.18 };

    const card = flowNode as FrameNode;
    card.name = title;
    if (typeof payload.cornerRadius === 'number') {
      card.cornerRadius = Math.min(20, Math.max(0, payload.cornerRadius));
    }
    card.clipsContent = true;
    card.fills = [{ type: 'SOLID', color: bgColor }];

    if (typeof payload.strokeWeight === 'number') {
      card.strokeWeight = payload.strokeWeight;
      if (payload.strokeWeight === 0) {
        card.strokes = [];
      } else {
        const sColor = payload.strokeColor ? hexToRgbColor(payload.strokeColor) : borderColor;
        card.strokes = [{ type: 'SOLID', color: sColor }];
      }
    } else if (payload.strokeColor) {
      card.strokes = [{ type: 'SOLID', color: hexToRgbColor(payload.strokeColor) }];
    }

    // 크기 조정 (min/max 일시 해제 -> resize -> min/max 재잠금)
    if (payload.width && payload.height) {
      const w = Math.max(120, payload.width);
      const h = Math.max(50, payload.height);
      const isHug = payload.sizeMode === 'hug';

      card.minWidth = null;
      card.maxWidth = null;
      card.minHeight = null;
      card.maxHeight = null;

      if (isHug) {
        // Hug contents: 높이 자동, 너비만 고정
        // 먼저 설명 텍스트의 줄수 제한(maxLines)을 풀어 전체 높이가 확장되도록 함
        const existingDesc = card.children.find(
          (c) => c.name === 'DescText' || c.getPluginData('node_role') === 'desc'
        ) as TextNode | undefined;
        if (existingDesc) {
          existingDesc.maxLines = null;
        }

        // 너비 변경 시에만 resize (height 인자는 현재값 유지 후 AUTO가 덮어씀)
        if (card.width !== w) {
          card.counterAxisSizingMode = 'FIXED';
          card.resize(w, card.height);
        }
        card.counterAxisSizingMode = 'FIXED';
        card.primaryAxisSizingMode = 'AUTO'; // 높이 자동 확장
        card.minWidth = w;
        card.maxWidth = w;
        card.minHeight = null;
        card.maxHeight = null;
      } else {
        // Fixed height: 너비·높이 모두 고정
        card.resize(w, h);
        card.primaryAxisSizingMode = 'FIXED';
        card.counterAxisSizingMode = 'FIXED';
        card.minWidth = w;
        card.maxWidth = w;
        card.minHeight = h;
        card.maxHeight = h;
      }

      // 리사이즈 시 하단 오른쪽 박스 안쪽 상태 뱃지 위치 동기화
      const statusBadge = card.children.find(
        (c) => c.getPluginData('is_status_badge') === 'true' || c.name === 'StatusBadge'
      ) as FrameNode | undefined;
      if (statusBadge) {
        statusBadge.constraints = { horizontal: 'MAX', vertical: 'MAX' };
        statusBadge.x = w - statusBadge.width - 10;
        statusBadge.y = h - statusBadge.height - 10;
      }

      // 리사이즈 시 하단 왼쪽 링크 뱃지 위치 동기화
      const linkBadge = card.children.find(
        (c) => c.getPluginData('is_figma_link_badge') === 'true' || c.name === 'FigmaLinkBadge'
      ) as FrameNode | undefined;
      if (linkBadge) {
        linkBadge.constraints = { horizontal: 'MIN', vertical: 'MAX' };
        linkBadge.x = 16;
        linkBadge.y = h - linkBadge.height - 10;
      }
    }

    // 헤더 행 및 타이틀 텍스트 갱신
    let headerRow = card.children.find(
      (c) => c.name === 'Header' || (c.type === 'FRAME' && (c as FrameNode).layoutMode === 'HORIZONTAL')
    ) as FrameNode | undefined;

    if (!headerRow) {
      headerRow = figma.createFrame();
      headerRow.name = 'Header';
      headerRow.layoutMode = 'HORIZONTAL';
      headerRow.layoutAlign = 'STRETCH';
      headerRow.primaryAxisAlignItems = 'CENTER';
      headerRow.counterAxisAlignItems = 'CENTER';
      headerRow.itemSpacing = 8;
      headerRow.fills = [];
      card.insertChild(0, headerRow);
    }

    let titleText = headerRow.children.find(
      (c) => c.name === 'TitleText' || c.getPluginData('node_role') === 'title'
    ) as TextNode | undefined;

    if (!titleText) {
      titleText = figma.createText();
      titleText.name = 'TitleText';
      titleText.fontName = { family: 'Inter', style: 'Bold' };
      titleText.fontSize = 13;
      titleText.layoutGrow = 1;
      titleText.textAutoResize = 'HEIGHT';
      titleText.setPluginData('node_role', 'title');
      headerRow.insertChild(0, titleText);
    }

    titleText.textTruncation = 'ENDING';
    titleText.maxLines = 1;
    await safeSetCharacters(titleText, title);
    titleText.fills = [titleFill];

    // 설명 텍스트 갱신
    let descText = card.children.find(
      (c) => c.name === 'DescText' || c.getPluginData('node_role') === 'desc'
    ) as TextNode | undefined;

    if (!descText) {
      descText = figma.createText();
      descText.name = 'DescText';
      descText.fontName = { family: 'Inter', style: 'Regular' };
      descText.fontSize = 11;
      descText.layoutAlign = 'STRETCH';
      descText.textAutoResize = 'HEIGHT';
      descText.setPluginData('node_role', 'desc');
      card.appendChild(descText);
    }

    // 상태 여부 및 링크 여부에 따른 하단 패딩 및 설명 텍스트 줄수 동기화
    let statusBadge = card.children.find(
      (c) => c.getPluginData('is_status_badge') === 'true' || c.name === 'StatusBadge'
    ) as FrameNode | undefined;
    const hasStatus = Boolean(statusBadge || (payload.status && STATUS_CONFIG[payload.status]));
    const hasLink = Boolean(payload.figmaLink && payload.figmaLink.trim());
    card.paddingBottom = (hasStatus || hasLink) ? 36 : 16;

    const currentH = payload.height || card.height;
    updateDescTextTruncation(card, descText, currentH, description);

    if (statusBadge) {
      statusBadge.paddingLeft = 9;
      statusBadge.paddingRight = 9;
      statusBadge.cornerRadius = getStatusBadgeCornerRadius(card.cornerRadius);
      statusBadge.constraints = { horizontal: 'MAX', vertical: 'MAX' };
      statusBadge.x = card.width - statusBadge.width - 10;
      statusBadge.y = card.height - statusBadge.height - 10;

      // 노드 배경색 변화에 따른 상태 뱃지 컬러 동기화
      const currentStatus = (payload.status || card.getPluginData('workflow_status')) as WorkflowStatus;
      if (currentStatus && STATUS_CONFIG[currentStatus]) {
        const { badgeBg, badgeTextColor } = getStatusBadgeColors(currentStatus, bgColor, isDark);
        statusBadge.fills = [{ type: 'SOLID', color: badgeBg }];
        const bText = statusBadge.children.find((c) => c.type === 'TEXT') as TextNode | undefined;
        if (bText) {
          bText.locked = false;
          bText.fills = [{ type: 'SOLID', color: badgeTextColor }];
          bText.locked = true;
        }
      }
    }

    // Figma Screen Link 펜 아이콘 뱃지(하단 왼쪽) 갱신
    await updateFigmaLinkBadge(card, payload.figmaLink, isBgDark, payload.clearLinkCache);

    // 기존 스텝 뱃지가 존재하는 경우 노드 색상/보더 변화에 맞춰 컬러 동기화
    const existingStepBadge = card.children.find(
      (c) => c.name.startsWith('[Step]') || c.getPluginData('is_step_badge') === 'true'
    ) as FrameNode | undefined;
    if (existingStepBadge) {
      const stepText = existingStepBadge.children.find((c) => c.type === 'TEXT') as TextNode | undefined;
      if (stepText) {
        const currentMode = (card.getPluginData('badge_color_mode') as 'White' | 'Black' | 'Style') || 'Style';
        applyStepBadgeColors(existingStepBadge, stepText, currentMode, card);
      }
    }

    await safeSetCharacters(descText, description);
    descText.fills = [descFill];

    // 실제 FigJam 프레임 노드 이름 동기화
    card.name = title;

    // 메타데이터 갱신 (FigJam 네이티브 객체 속성을 Source of Truth로 유지하며, 중복 데이터 제거)
    card.setPluginData('is_flow_node', 'true');
    card.setPluginData('schema_version', '2');
    card.setPluginData('node_title', '');
    card.setPluginData('node_desc', '');
    card.setPluginData('node_tag', '');
    card.setPluginData('node_width', '');
    card.setPluginData('node_height', '');
    if (payload.theme) card.setPluginData('node_theme', payload.theme);
    if (payload.nodeType) card.setPluginData('node_type', payload.nodeType);
    if (typeof payload.elevation === 'number') {
      card.setPluginData('node_elevation', `${payload.elevation}`);
      card.effects = getElevationEffects(payload.elevation, isBgDark);
      card.clipsContent = false;
    } else if (payload.elevation === null) {
      card.setPluginData('node_elevation', '');
      card.effects = [];
    }

    figma.currentPage.selection = [card];
    handleSelectionChange();
    notify(`[${title}] 노드가 업데이트되었습니다!`, 'success');
  } catch (err) {
    notify(`노드 수정 실패: ${String(err)}`, 'error');
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

    const w = Math.max(120, width);
    const h = Math.max(50, height);

    const frame = flowNode as FrameNode;
    frame.minWidth = null;
    frame.maxWidth = null;
    frame.minHeight = null;
    frame.maxHeight = null;

    frame.resize(w, h);
    frame.primaryAxisSizingMode = 'FIXED';
    frame.counterAxisSizingMode = 'FIXED';
    frame.clipsContent = true;

    frame.minWidth = w;
    frame.maxWidth = w;
    frame.minHeight = h;
    frame.maxHeight = h;

    // 헤더 타이틀 말줄임 동기화
    const headerRow = frame.children.find(
      (c) => c.name === 'Header' || (c.type === 'FRAME' && (c as FrameNode).layoutMode === 'HORIZONTAL')
    ) as FrameNode | undefined;
    if (headerRow) {
      const title = headerRow.children.find(
        (c) => c.name === 'TitleText' || c.getPluginData('node_role') === 'title'
      ) as TextNode | undefined;
      if (title) {
        title.textTruncation = 'ENDING';
        title.maxLines = 1;
      }
    }

    // 상태 뱃지 탐색 및 패딩 동기화
    const statusBadge = frame.children.find(
      (c) => c.getPluginData('is_status_badge') === 'true' || c.name === 'StatusBadge'
    ) as FrameNode | undefined;
    const hasStatus = Boolean(statusBadge);
    frame.paddingBottom = hasStatus ? 36 : 16;

    // 설명 텍스트 말줄임 및 최대 줄수 동기화
    const desc = frame.children.find(
      (c) => c.name === 'DescText' || c.getPluginData('node_role') === 'desc'
    ) as TextNode | undefined;
    if (desc) {
      updateDescTextTruncation(frame, desc, h);
    }

    // 리사이즈 시 하단 오른쪽 박스 안쪽 상태 뱃지 위치 동기화
    if (statusBadge) {
      statusBadge.constraints = { horizontal: 'MAX', vertical: 'MAX' };
      statusBadge.x = w - statusBadge.width - 10;
      statusBadge.y = h - statusBadge.height - 10;
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
      notify('연결할 노드를 찾을 수 없습니다.', 'warning');
      return;
    }

    const sourceFlow = findFlowNode(sourceNode);
    if (sourceFlow) sourceNode = sourceFlow;

    const targetFlow = findFlowNode(targetNode);
    if (targetFlow) targetNode = targetFlow;

    if (sourceNode.id === targetNode.id) {
      notify('서로 다른 두 노드를 선택하여 연결해 주세요.', 'warning');
      return;
    }

    await loadRequiredFonts();

    const connector = await createSingleConnector(
      sourceNode,
      payload.sourceMagnet,
      targetNode,
      payload.targetMagnet,
      payload.label,
      payload.colorHex,
      payload.strokeWeight
    );

    figma.currentPage.selection = [connector];
    handleSelectionChange();
    notify(`연결 완료${payload.label ? ` (라벨: "${payload.label}")` : ''}`, 'success');
  } catch (err) {
    notify(`연결선 생성 실패: ${String(err)}`, 'error');
  }
}

// 단일 커스텀 90도 칼각 직각 벡터 커넥터 생성 함수 (피그잼 기본 라운딩 제거)
async function createSingleConnector(
  sourceNode: SceneNode,
  sourceMagnet: MagnetPosition,
  targetNode: SceneNode,
  targetMagnet: MagnetPosition,
  label?: string,
  colorHex?: string,
  strokeWeight?: number
): Promise<VectorNode | GroupNode> {
  const connWeight = typeof strokeWeight === 'number' ? strokeWeight : 1.5;
  const connColor: RGB = colorHex ? hexToRgbColor(colorHex) : { r: 0, g: 0, b: 0 };

  // 커스텀 90도 직각 VectorNode 커넥터 생성 (라운딩 없는 완전한 칼각 직각)
  return await createOrthogonalVectorConnector(
    sourceNode,
    sourceMagnet,
    targetNode,
    targetMagnet,
    {
      strokeWeight: connWeight,
      strokeColor: connColor,
      label,
      sourceNodeId: sourceNode.id,
      targetNodeId: targetNode.id,
    }
  );
}

// 스마트 자동 직각 연결 (2개: 최단 방향 직각 연결 / 3개 이상: 캔버스 흐름에 따른 순차 연속 체인 연결 1->2->3...)
async function autoConnectSelected(label?: string) {
  try {
    const rawSelection = [...figma.currentPage.selection];
    if (rawSelection.length < 2) {
      notify('연결할 노드를 2개 이상 선택해 주세요.', 'warning');
      return;
    }

    // 중복 제거 및 플로우 노드 매핑
    const nodesMap = new Map<string, SceneNode>();
    for (const n of rawSelection) {
      const flow = findFlowNode(n) || n;
      nodesMap.set(flow.id, flow);
    }
    const nodes = Array.from(nodesMap.values());
    if (nodes.length < 2) {
      notify('서로 다른 노드를 2개 이상 선택해 주세요.', 'warning');
      return;
    }

    await loadRequiredFonts();

    // 1. 2개 선택인 경우: 기존과 동일하게 최단 방향으로 직각 연결
    if (nodes.length === 2) {
      const sourceNode = nodes[0];
      const targetNode = nodes[1];

      const dx = targetNode.x - sourceNode.x;
      const dy = targetNode.y - sourceNode.y;

      let sourceMagnet: MagnetPosition = 'RIGHT';
      let targetMagnet: MagnetPosition = 'LEFT';

      if (Math.abs(dx) >= Math.abs(dy)) {
        if (dx >= 0) {
          sourceMagnet = 'RIGHT';
          targetMagnet = 'LEFT';
        } else {
          sourceMagnet = 'LEFT';
          targetMagnet = 'RIGHT';
        }
      } else {
        if (dy >= 0) {
          sourceMagnet = 'BOTTOM';
          targetMagnet = 'TOP';
        } else {
          sourceMagnet = 'TOP';
          targetMagnet = 'BOTTOM';
        }
      }

      const conn = await createSingleConnector(sourceNode, sourceMagnet, targetNode, targetMagnet, label);
      figma.currentPage.selection = [conn];
      handleSelectionChange();
      notify(`칼각 직각 연결 완료${label ? ` (라벨: "${label}")` : ''}`, 'success');
      return;
    }

    // 2. 3개 이상 선택인 경우: 캔버스 배치 좌표(가로 흐름 vs 세로 흐름)에 따라 순차 정렬 후 연속 체인 연결 (1->2->3...)
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const n of nodes) {
      if (n.x < minX) minX = n.x;
      if (n.x > maxX) maxX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.y > maxY) maxY = n.y;
    }

    const spanX = maxX - minX;
    const spanY = maxY - minY;

    if (spanX >= spanY) {
      // 주로 가로 방향 배치: 좌->우 X좌표 오름차순 정렬
      nodes.sort((a, b) => a.x - b.x);
    } else {
      // 주로 세로 방향 배치: 상->하 Y좌표 오름차순 정렬
      nodes.sort((a, b) => a.y - b.y);
    }

    const createdConnectors: SceneNode[] = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      const src = nodes[i];
      const tgt = nodes[i + 1];

      const dx = tgt.x - src.x;
      const dy = tgt.y - src.y;

      let srcMagnet: MagnetPosition = 'RIGHT';
      let tgtMagnet: MagnetPosition = 'LEFT';

      if (Math.abs(dx) >= Math.abs(dy)) {
        if (dx >= 0) {
          srcMagnet = 'RIGHT';
          tgtMagnet = 'LEFT';
        } else {
          srcMagnet = 'LEFT';
          tgtMagnet = 'RIGHT';
        }
      } else {
        if (dy >= 0) {
          srcMagnet = 'BOTTOM';
          tgtMagnet = 'TOP';
        } else {
          srcMagnet = 'TOP';
          tgtMagnet = 'BOTTOM';
        }
      }

      // 라벨이 입력된 경우 첫 번째 연결선에 표시
      const lineLabel = (i === 0 && label) ? label : undefined;
      const conn = await createSingleConnector(src, srcMagnet, tgt, tgtMagnet, lineLabel);
      createdConnectors.push(conn);
    }

    figma.currentPage.selection = createdConnectors;
    handleSelectionChange();
    notify(`⚡ 총 ${nodes.length}개 노드가 칼각 직각 순차 연결되었습니다 (${createdConnectors.length}개 연결선).`, 'success');
  } catch (err) {
    notify(`순차 자동 연결 실패: ${String(err)}`, 'error');
  }
}

// 커넥터(선) 중앙 텍스트 수정 기능
async function updateConnectorLabel(connectorId: string, label: string) {
  try {
    let node = figma.getNodeById(connectorId);
    if (!node || node.type !== 'CONNECTOR') {
      const selection = figma.currentPage.selection;
      if (selection.length > 0 && selection[0].type === 'CONNECTOR') {
        node = selection[0];
      }
    }

    if (!node || node.type !== 'CONNECTOR') {
      notify('수정할 연결선(커넥터)을 캔버스에서 선택해 주세요.', 'warning');
      return;
    }

    const conn = node as ConnectorNode;
    try {
      await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
      conn.text.fontName = { family: 'Inter', style: 'Medium' };
    } catch {
      await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
      conn.text.fontName = { family: 'Inter', style: 'Regular' };
    }

    conn.text.characters = label.trim();
    conn.text.fontSize = 11;

    notify(
      label.trim() ? `선 중앙 텍스트가 "${label.trim()}"(으)로 반영되었습니다!` : '선 중앙 텍스트가 지워졌습니다.',
      'success'
    );
    handleSelectionChange();
  } catch (err) {
    notify(`선 텍스트 수정 실패: ${String(err)}`, 'error');
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
  sourceMagnet?: MagnetPosition;
  targetMagnet?: MagnetPosition;
  label?: string;
  hasLabel?: boolean;
}) {
  try {
    let node = figma.getNodeById(payload.connectorId);
    if (!node) {
      const selection = figma.currentPage.selection;
      if (selection.length > 0) node = selection[0];
    }

    if (!node) {
      notify('수정할 커넥터를 찾을 수 없습니다.', 'warning');
      return;
    }

    await loadRequiredFonts();

    if (node.type === 'CONNECTOR') {
      const conn = node as ConnectorNode;

      // 1. 색상
      if (payload.colorHex) {
        conn.strokes = [{ type: 'SOLID', color: hexToRgbColor(payload.colorHex) }];
      }

      // 2. 두께
      if (typeof payload.strokeWeight === 'number') {
        conn.strokeWeight = payload.strokeWeight;
      }

      // 3. 선 스타일
      if (payload.strokePattern === 'DASHED') {
        conn.dashPattern = [4, 4];
      } else if (payload.strokePattern === 'DOTTED') {
        conn.dashPattern = [1.5, 3];
      } else {
        conn.dashPattern = [];
      }

      // 4. 라우팅
      if (payload.routingType === 'STRAIGHT') {
        conn.connectorLineType = 'STRAIGHT';
      } else {
        conn.connectorLineType = 'ELBOWED';
      }

      // 5. 단자 Cap
      const mapCap = (term?: ConnectorTerminalType): ConnectorStrokeCap => {
        switch (term) {
          case 'ARROW':
          case 'TRIANGLE_ARROW':
            return 'ARROW_LINES';
          case 'BAR':
            return 'ERD_EXACTLY_ONE';
          case 'DIAMOND':
            return 'DIAMOND_FILLED';
          case 'CIRCLE':
            return 'CIRCLE_FILLED';
          case 'SQUARE':
            return 'TRIANGLE_FILLED';
          default:
            return 'NONE';
        }
      };
      if (payload.startTerminal && payload.startTerminal !== 'MIXED') {
        conn.connectorStartStrokeCap = mapCap(payload.startTerminal);
      }
      if (payload.endTerminal && payload.endTerminal !== 'MIXED') {
        conn.connectorEndStrokeCap = mapCap(payload.endTerminal);
      }

      // 6. 라벨
      if (payload.hasLabel && payload.label !== undefined) {
        if (conn.text) {
          await safeSetCharacters(conn.text, payload.label.trim());
        }
      } else if (payload.hasLabel === false && conn.text) {
        await safeSetCharacters(conn.text, '');
      }

      // 7. Figma 네이티브 커넥터 마그넷 위치 갱신
      if (payload.sourceMagnet && conn.connectorStart && 'endpointNodeId' in conn.connectorStart) {
        conn.connectorStart = {
          endpointNodeId: conn.connectorStart.endpointNodeId,
          magnet: payload.sourceMagnet,
        };
      }
      if (payload.targetMagnet && conn.connectorEnd && 'endpointNodeId' in conn.connectorEnd) {
        conn.connectorEnd = {
          endpointNodeId: conn.connectorEnd.endpointNodeId,
          magnet: payload.targetMagnet,
        };
      }
    } else {
      // 커스텀 직각 벡터 커넥터 (그룹 또는 벡터)
      let vectorNode: VectorNode | null = null;
      if (node.type === 'VECTOR') {
        vectorNode = node as VectorNode;
      } else if ('findOne' in node) {
        vectorNode = (node as GroupNode).findOne((n) => n.type === 'VECTOR') as VectorNode | null;
      }

      const rgb = payload.colorHex ? hexToRgbColor(payload.colorHex) : undefined;

      if (vectorNode) {
        if (rgb) {
          vectorNode.strokes = [{ type: 'SOLID', color: rgb }];
        }
        if (typeof payload.strokeWeight === 'number') {
          vectorNode.strokeWeight = payload.strokeWeight;
        }
        if (payload.strokePattern === 'DASHED') {
          vectorNode.dashPattern = [4, 4];
        } else if (payload.strokePattern === 'DOTTED') {
          vectorNode.dashPattern = [1.5, 3];
        } else {
          vectorNode.dashPattern = [];
        }
        if (payload.endTerminal === 'ARROW') {
          vectorNode.strokeCap = 'ARROW_EQUILATERAL';
        } else {
          vectorNode.strokeCap = 'NONE';
        }
      }

      // 라벨 처리
      let labelFrame: FrameNode | null = null;
      if (node.type === 'GROUP') {
        labelFrame = (node as GroupNode).findOne(
          (n) => n.name === 'ConnectorLabel' || n.getPluginData('is_connector_label') === 'true'
        ) as FrameNode | null;
      }

      if (payload.hasLabel && payload.label) {
        node.setPluginData('connector_label', payload.label.trim());
        if (labelFrame) {
          labelFrame.visible = true;
          const textNode = labelFrame.findOne((n) => n.type === 'TEXT') as TextNode | null;
          if (textNode) {
            await safeSetCharacters(textNode, payload.label.trim());
            if (rgb) textNode.fills = [{ type: 'SOLID', color: rgb }];
          }
        }
      } else if (payload.hasLabel === false) {
        node.setPluginData('connector_label', '');
        if (labelFrame) {
          labelFrame.visible = false;
        }
      }

      if (payload.colorHex) node.setPluginData('connector_color', payload.colorHex);
      if (payload.strokeWeight) node.setPluginData('connector_weight', String(payload.strokeWeight));
      if (payload.strokePattern) node.setPluginData('connector_pattern', payload.strokePattern);
      if (payload.routingType) node.setPluginData('connector_routing', payload.routingType);
      if (payload.startTerminal) node.setPluginData('start_terminal', payload.startTerminal);
      if (payload.endTerminal) node.setPluginData('end_terminal', payload.endTerminal);

      if (payload.sourceMagnet) {
        node.setPluginData('source_magnet', payload.sourceMagnet);
      }
      if (payload.targetMagnet) {
        node.setPluginData('target_magnet', payload.targetMagnet);
      }

      // 마그넷 또는 라우팅 변경 시 커스텀 벡터 직각 경로 즉시 재계산
      await updateOrthogonalVectorConnector(node, payload.sourceMagnet, payload.targetMagnet);
    }

    notify('커넥터 옵션이 성공적으로 수정되었습니다.', 'success');
    handleSelectionChange();
  } catch (err) {
    notify(`커넥터 수정 실패: ${String(err)}`, 'error');
  }
}

// 커넥터 선 형태(직각 ELBOWED / 직선 STRAIGHT) 변경 기능
async function setConnectorLineType(connectorId?: string, lineType: 'ELBOWED' | 'STRAIGHT' = 'ELBOWED') {
  try {
    let node: SceneNode | null = null;
    if (connectorId) {
      node = figma.getNodeById(connectorId) as SceneNode | null;
    }
    if (!node || node.type !== 'CONNECTOR') {
      const selection = figma.currentPage.selection;
      if (selection.length > 0 && selection[0].type === 'CONNECTOR') {
        node = selection[0];
      }
    }

    if (!node || node.type !== 'CONNECTOR') {
      notify('변경할 연결선(커넥터)을 캔버스에서 선택해 주세요.', 'warning');
      return;
    }

    const conn = node as ConnectorNode;
    conn.connectorLineType = lineType;
    notify(
      lineType === 'ELBOWED' ? '📐 연결선이 [직각(Elbowed)]으로 변경되었습니다.' : '📏 연결선이 [직선(Straight)]으로 변경되었습니다.',
      'success'
    );
    handleSelectionChange();
  } catch (err) {
    notify(`연결선 형태 변경 실패: ${String(err)}`, 'error');
  }
}

// 캔버스 내 모든 연결선을 직각(ELBOWED)으로 일괄 변환하는 기능
async function convertAllConnectorsToElbowed() {
  try {
    const connectors = figma.currentPage.findAll((n) => n.type === 'CONNECTOR') as ConnectorNode[];
    if (connectors.length === 0) {
      notify('캔버스에 변환할 연결선이 없습니다.', 'info');
      return;
    }

    let convertedCount = 0;
    for (const conn of connectors) {
      if (conn.connectorLineType !== 'ELBOWED') {
        conn.connectorLineType = 'ELBOWED';
        convertedCount++;
      }
    }

    if (convertedCount > 0) {
      notify(`⚡ 총 ${convertedCount}개의 연결선을 모두 [직각(Elbowed)]으로 일괄 변환했습니다!`, 'success');
    } else {
      notify(`이미 모든 연결선(${connectors.length}개)이 [직각(Elbowed)] 상태입니다.`, 'info');
    }
    handleSelectionChange();
  } catch (err) {
    notify(`연결선 일괄 변환 실패: ${String(err)}`, 'error');
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
function collectStatusItems(): FrameStatusItem[] {
  const nodes = figma.currentPage.findAll((node) => {
    return Boolean(node.getPluginData('workflow_status'));
  });

  return nodes.map((node) => {
    const status = node.getPluginData('workflow_status') as WorkflowStatus;
    if (node.type === 'FRAME' && node.getPluginData('is_flow_node') === 'true') {
      const frame = node as FrameNode;
      const statusBadge = frame.children.find(
        (c) => c.getPluginData('is_status_badge') === 'true' || c.name === 'StatusBadge'
      ) as FrameNode | undefined;
      if (statusBadge && statusBadge.y <= 0) {
        statusBadge.constraints = { horizontal: 'MAX', vertical: 'MAX' };
        statusBadge.x = frame.width - statusBadge.width - 10;
        statusBadge.y = frame.height - statusBadge.height - 10;
      }
    }
    const extracted = extractNodeText(node);
    return {
      id: node.id,
      name: extracted.title || node.name,
      status: status || 'draft',
      x: Math.round(node.x),
      y: Math.round(node.y),
    };
  });
}

function syncStatusList() {
  const items = collectStatusItems();
  postToUI({ type: 'STATUS_LIST_UPDATED', items });
}

// 상태 뱃지 적용 또는 제거 (노드 카드 우하단에 독립된 절대 위치로 부착)
async function applyStatusToSelected(status?: WorkflowStatus | '') {
  const selection = figma.currentPage.selection;
  if (selection.length === 0) {
    notify('상태를 지정할 요소를 1개 이상 선택해 주세요.', 'warning');
    return;
  }

  await loadRequiredFonts();
  const isRemove = !status || !STATUS_CONFIG[status as WorkflowStatus];
  const cfg = !isRemove ? STATUS_CONFIG[status as WorkflowStatus] : null;

  for (const rawNode of selection) {
    let flowNode = findFlowNode(rawNode) || (rawNode as FrameNode | ShapeWithTextNode);

    // 구형 쉐이프 노드인 경우 직각 프레임 카드로 자동 마이그레이션
    if (flowNode.type === 'SHAPE_WITH_TEXT') {
      flowNode = await convertShapeToFrameNode(flowNode as ShapeWithTextNode);
    }

    if (flowNode.type === 'FRAME') {
      const card = flowNode as FrameNode;
      card.clipsContent = false;

      // 1. 기존 Header 행 안에 남아있던 구형 상태 뱃지 탐색
      const headerRow = card.children.find(
        (c) => c.name === 'Header' || (c.type === 'FRAME' && (c as FrameNode).layoutMode === 'HORIZONTAL')
      ) as FrameNode | undefined;

      let oldBadgeInHeader: FrameNode | undefined;
      if (headerRow) {
        oldBadgeInHeader = headerRow.children.find(
          (c) => c.getPluginData('is_status_badge') === 'true' || c.name === 'StatusBadge'
        ) as FrameNode | undefined;
      }

      // 2. card 직속 상태 뱃지 탐색
      let statusBadge = card.children.find(
        (c) => c.getPluginData('is_status_badge') === 'true' || c.name === 'StatusBadge'
      ) as FrameNode | undefined;

      if (isRemove) {
        // 상태 제거
        card.setPluginData('workflow_status', '');
        card.paddingBottom = 16;
        if (oldBadgeInHeader) oldBadgeInHeader.remove();
        if (statusBadge) statusBadge.remove();

        const descText = card.children.find(
          (c) => c.name === 'DescText' || c.getPluginData('node_role') === 'desc'
        ) as TextNode | undefined;
        if (descText) {
          updateDescTextTruncation(card, descText, card.height);
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
        statusBadge.cornerRadius = getStatusBadgeCornerRadius(card.cornerRadius);
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
        statusBadge.cornerRadius = getStatusBadgeCornerRadius(card.cornerRadius);
        statusBadge.fills = [{ type: 'SOLID', color: badgeBg }];
        const textNode = statusBadge.children.find((c) => c.type === 'TEXT') as TextNode;
        if (textNode) {
          textNode.locked = false;
          await safeSetCharacters(textNode, cfg.label.toUpperCase());
          textNode.fills = [{ type: 'SOLID', color: badgeTextColor }];
          textNode.locked = true; // 캔버스에서 텍스트 직접 수정 차단
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
          (c) => c.name === 'DescText' || c.getPluginData('node_role') === 'desc'
        ) as TextNode | undefined;
        if (descText) {
          updateDescTextTruncation(card, descText, card.height);
        }
      }
    }
  }

  syncStatusList();
  handleSelectionChange();
  if (isRemove) {
    notify(`${selection.length}개 노드의 상태 뱃지가 제거되었습니다.`, 'info');
  } else if (cfg) {
    notify(`${selection.length}개 노드에 [${cfg.label}] 상태 뱃지가 부착되었습니다.`, 'success');
  }
}

// 엘리베이션(그림자 효과) 적용 또는 제거
async function applyElevationToSelected(level: number | null) {
  const selection = figma.currentPage.selection;
  if (selection.length === 0) {
    notify('엘리베이션을 적용할 요소를 선택해 주세요.', 'warning');
    return;
  }

  for (const rawNode of selection) {
    let flowNode = findFlowNode(rawNode) || (rawNode as FrameNode | ShapeWithTextNode);
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
    notify(`${selection.length}개 노드의 엘리베이션이 제거되었습니다.`, 'info');
  } else {
    notify(`${selection.length}개 노드에 Level ${level} 엘리베이션이 적용되었습니다.`, 'success');
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
  // 노드 배경색
  let nodeBgColor: RGB = { r: 1, g: 1, b: 1 };
  const cardFills = card.fills;
  if (Array.isArray(cardFills) && cardFills.length > 0 && cardFills[0].type === 'SOLID') {
    nodeBgColor = cardFills[0].color;
  }

  // 노드 보더 컬러 및 stroke 여부
  let nodeStrokeColor: RGB | null = null;
  const cardStrokes = card.strokes;
  if (Array.isArray(cardStrokes) && cardStrokes.length > 0 && cardStrokes[0].type === 'SOLID') {
    nodeStrokeColor = cardStrokes[0].color;
  }
  const hasWeight = typeof card.strokeWeight === 'number' ? card.strokeWeight > 0 : true;
  const hasNodeStroke = hasWeight && nodeStrokeColor !== null;

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

// 스텝 번호 부여 (노드 카드 코너에 일체형 스텝 뱃지로 부착)
async function addStepBadges(
  startNumber: number = 1,
  corner: string = 'TOP_LEFT',
  shape: string = 'Square',
  colorMode: 'White' | 'Black' | 'Style' = 'Style'
) {
  const rawSelection = [...figma.currentPage.selection];
  if (rawSelection.length === 0) {
    notify('스텝 번호를 매길 요소를 캔버스에서 선택해 주세요.', 'warning');
    return;
  }

  // 중복 제거 및 플로우 노드 매핑
  const nodesMap = new Map<string, FrameNode>();
  for (const n of rawSelection) {
    let flow = findFlowNode(n) || n;
    if (flow.type === 'SHAPE_WITH_TEXT') {
      flow = await convertShapeToFrameNode(flow as ShapeWithTextNode);
    }
    if (flow.type === 'FRAME') {
      nodesMap.set(flow.id, flow as FrameNode);
    }
  }

  const selection = Array.from(nodesMap.values());
  selection.sort((a, b) => a.x - b.x);
  await loadRequiredFonts();

  let currentNum = startNumber;
  for (const card of selection) {
    card.clipsContent = false;
    card.setPluginData('step_number', `${currentNum}`);
    card.setPluginData('badge_corner', corner);
    card.setPluginData('badge_shape', shape);
    card.setPluginData('badge_color_mode', colorMode);

    let stepBadge = card.children.find(
      (c) => c.getPluginData('is_step_badge') === 'true' || c.name.startsWith('[Step]')
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
    stepBadge.paddingLeft = 7;
    stepBadge.paddingRight = 7;
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
    if (corner === 'TOP_RIGHT') {
      stepBadge.x = card.width - bw + 8;
      stepBadge.y = -8;
      stepBadge.constraints = { horizontal: 'MAX', vertical: 'MIN' };
    } else if (corner === 'BOTTOM_LEFT') {
      stepBadge.x = -8;
      stepBadge.y = card.height - bh + 8;
      stepBadge.constraints = { horizontal: 'MIN', vertical: 'MAX' };
    } else if (corner === 'BOTTOM_RIGHT') {
      stepBadge.x = card.width - bw + 8;
      stepBadge.y = card.height - bh + 8;
      stepBadge.constraints = { horizontal: 'MAX', vertical: 'MAX' };
    } else {
      // TOP_LEFT 기본값
      stepBadge.x = -8;
      stepBadge.y = -8;
      stepBadge.constraints = { horizontal: 'MIN', vertical: 'MIN' };
    }

    currentNum++;
  }

  handleSelectionChange();
  notify(`${selection.length}개 노드에 스텝 번호가 적용되었습니다.`, 'success');
}

// 스텝 번호 제거 기능
async function removeStepBadges() {
  const rawSelection = [...figma.currentPage.selection];
  if (rawSelection.length === 0) {
    notify('스텝 번호를 제거할 요소를 캔버스에서 선택해 주세요.', 'warning');
    return;
  }

  let removedCount = 0;
  for (const n of rawSelection) {
    let flow = findFlowNode(n) || n;
    if (flow.type === 'SHAPE_WITH_TEXT') {
      flow = await convertShapeToFrameNode(flow as ShapeWithTextNode);
    }
    if (flow.type === 'FRAME') {
      const card = flow as FrameNode;
      card.setPluginData('step_number', '');
      card.setPluginData('badge_corner', '');
      card.setPluginData('badge_shape', '');
      const stepBadges = card.children.filter(
        (c) => c.getPluginData('is_step_badge') === 'true' || c.name.startsWith('[Step]')
      );
      for (const badge of stepBadges) {
        badge.remove();
        removedCount++;
      }
    }
  }

  handleSelectionChange();
  if (removedCount > 0) {
    notify(`${removedCount}개 노드의 스텝 번호가 제거되었습니다.`, 'info');
  } else {
    notify('선택한 노드에 스텝 번호가 존재하지 않습니다.', 'info');
  }
}

function focusFrame(nodeId: string) {
  const node = figma.getNodeById(nodeId);
  if (!node || !('x' in node)) {
    notify('해당 노드를 찾을 수 없습니다.', 'warning');
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
      !node.getPluginData('is_flow_node') &&
      !node.getPluginData('flow_node_type') &&
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
      !node.getPluginData('is_flow_node') &&
      !node.getPluginData('flow_node_type') &&
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

async function loadSavedSettings() {
  const token = (await figma.clientStorage.getAsync('figma_token')) || '';
  const fileUrl = (await figma.clientStorage.getAsync('figma_file_url')) || '';
  postToUI({
    type: 'SETTINGS_LOADED',
    token,
    fileUrl,
  });
}

async function saveSettings(token: string, fileUrl: string) {
  await figma.clientStorage.setAsync('figma_token', token);
  await figma.clientStorage.setAsync('figma_file_url', fileUrl);
  notify('피그마 연동 설정이 안전하게 저장되었습니다.', 'success');
}

// ----------------------------------------------------
// 현재 피그마 파일의 모든 Variables(UI3 디자인 토큰) 자동 추출
// ----------------------------------------------------
async function extractUI3Variables() {
  try {
    if (!('variables' in figma) || !figma.variables) {
      notify('이 피그마 버전에서는 Variables API를 지원하지 않습니다.', 'warning');
      return;
    }

    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    const variables = await figma.variables.getLocalVariablesAsync();

    if (variables.length === 0) {
      notify('현재 열린 파일에 등록된 로컬 변수(Variables)가 없습니다. UI3 Kit 파일 탭에서 실행해 주세요.', 'warning');
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

    const fullCss = `${cssLight}${darkCount > 0 ? cssDark : ''}`;

    postToUI({
      type: 'UI3_VARIABLES_EXTRACTED',
      css: fullCss,
      count: lightCount,
      collections: collections.map((c) => c.name),
    });

    notify(`🎨 총 ${lightCount}개의 UI3 디자인 토큰이 추출되었습니다!`, 'success');
  } catch (err) {
    notify(`UI3 변수 추출 실패: ${String(err)}`, 'error');
  }
}

// ----------------------------------------------------
// UI 메시지 수신 라우터
// ----------------------------------------------------
figma.ui.onmessage = async (msg: PluginAction) => {
  switch (msg.type) {
    case 'CREATE_FLOW_NODE':
      await createFlowNode(msg.payload);
      break;
    case 'UPDATE_FLOW_NODE':
      await updateFlowNode(msg.payload);
      break;
    case 'CONNECT_POINTS':
      await connectPoints(msg.payload);
      break;
    case 'AUTO_CONNECT_SELECTED':
      await autoConnectSelected(msg.label);
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
    case 'CONVERT_ALL_CONNECTORS_TO_ELBOWED':
      await convertAllConnectorsToElbowed();
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
      await addStepBadges(msg.startNumber || 1, msg.corner || 'TOP_LEFT', msg.shape || 'Square', msg.colorMode || 'Style');
      break;
    case 'REMOVE_STEP_BADGES':
      await removeStepBadges();
      break;
    case 'GET_STATUS_LIST':
      syncStatusList();
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
    case 'RESIZE_NODE':
      await resizeNode(msg.nodeId, msg.width, msg.height);
      break;
    case 'SAVE_SETTINGS':
      await saveSettings(msg.token, msg.fileUrl);
      break;
    case 'LOAD_SETTINGS':
      await loadSavedSettings();
      break;
    case 'CLOSE_PLUGIN':
      figma.closePlugin();
      break;
    case 'UNDO':
      notify('캔버스에서 Cmd+Z (Mac) 또는 Ctrl+Z (Windows)로 작업을 되돌릴 수 있습니다.', 'info');
      break;
    case 'REDO':
      notify('캔버스에서 Cmd+Shift+Z (Mac) 또는 Ctrl+Y (Windows)로 다시 실행할 수 있습니다.', 'info');
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
      handleSelectionChange();
      syncStatusList();
      await loadSavedSettings();
      break;
  }
};


// 캔버스 변경 감지: 신규 커넥터 직각 포맷팅, 노드 이동 시 커넥터 실시간 추적, 기즈모 조작 차단
figma.on('documentchange', async (event) => {
  const movedNodeIds = new Set<string>();
  let connectorSelectionChanged = false;

  for (const change of event.documentChanges) {
    if (change.type === 'PROPERTY_CHANGE') {
      // 1. 노드 이동(x, y) 또는 크기 변경(width, height) 감지 ➔ 연결된 커스텀 직각 커넥터 실시간 추적 갱신
      if (
        change.properties.includes('x') ||
        change.properties.includes('y') ||
        change.properties.includes('width') ||
        change.properties.includes('height')
      ) {
        movedNodeIds.add(change.id);
      }

      // 2. 캔버스에서 기즈모 드래그로 사이즈 변경이 시도될 경우 고정된 규격으로 즉시 원복 (기즈모 조작 완전 차단)
      if (change.properties.includes('width') || change.properties.includes('height')) {
        const node = figma.getNodeById(change.id);
        if (!node) continue;
        const flowNode = findFlowNode(node);
        if (flowNode && flowNode.type === 'FRAME' && flowNode.getPluginData('is_flow_node') === 'true') {
          const frame = flowNode as FrameNode;
          const savedW = (frame.minWidth && frame.minWidth > 0) ? frame.minWidth : parseInt(frame.getPluginData('node_width'), 10);
          const savedH = (frame.minHeight && frame.minHeight > 0) ? frame.minHeight : parseInt(frame.getPluginData('node_height'), 10);
          if (savedW && savedH && (Math.round(frame.width) !== savedW || Math.round(frame.height) !== savedH)) {
            frame.minWidth = null;
            frame.maxWidth = null;
            frame.minHeight = null;
            frame.maxHeight = null;

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

      // 3. 캔버스에서 텍스트 직접 편집 시 타이틀(13px Bold) 및 설명(11px Regular) 스타일 실시간 보정 및 유지
      const textNodeCandidate = figma.getNodeById(change.id);
      if (textNodeCandidate && textNodeCandidate.type === 'TEXT') {
        const textNode = textNodeCandidate as TextNode;
        const role = textNode.getPluginData('node_role');
        const isHeaderChild = textNode.parent && textNode.parent.name === 'Header';
        const isTitle = role === 'title' || textNode.name === 'TitleText' || isHeaderChild;
        const isDesc = role === 'desc' || textNode.name === 'DescText';

        if (isTitle || isDesc) {
          const flowNode = findFlowNode(textNode);
          if (flowNode) {
            if (isTitle) {
              // 타이틀 텍스트: 블릿, 링크, 볼드, 취소선 등 일체 반영 차단 및 Inter Bold 13px 표준 규격 강제 고정
              await enforceTitleStandardStyle(textNode, flowNode);
            } else if (isDesc) {
              // 설명 텍스트: 11px 폰트 사이즈 및 리사이즈 모드 고정, 나머지 서식(굵기, 색상, 이탤릭 등)은 모두 자유롭게 허용
              lockTextFontSizeAndAutoResize(textNode, 11);
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
            (t.parent && (t.parent.name === 'StatusBadge' || t.parent.getPluginData('is_status_badge') === 'true'))
          ) {
            statusTextNode = t;
            badgeFrame = t.parent && t.parent.type === 'FRAME' ? (t.parent as FrameNode) : null;
          }
        } else if (maybeStatusNode.type === 'FRAME') {
          const f = maybeStatusNode as FrameNode;
          if (f.name === 'StatusBadge' || f.getPluginData('is_status_badge') === 'true') {
            badgeFrame = f;
            statusTextNode = f.children.find((c) => c.type === 'TEXT') as TextNode | null;
          }
        }

        if (statusTextNode) {
          const flowNode = findFlowNode(statusTextNode);
          if (flowNode) {
            const currentStatus = flowNode.getPluginData('workflow_status') as WorkflowStatus;
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

      // 5. 커넥터의 피그잼 네이티브 설정값(컬러, 두께, 패턴 등) 변경 감지 ➔ pluginData 최신화 및 선택된 경우 UI 실시간 연동
      if (
        change.properties.includes('strokes') ||
        change.properties.includes('strokeWeight') ||
        change.properties.includes('dashPattern') ||
        change.properties.includes('connectorLineType')
      ) {
        const changedNode = figma.getNodeById(change.id);
        const connNode = findConnectorNode(changedNode);
        if (connNode) {
          if (connNode.type === 'CONNECTOR') {
            const conn = connNode as ConnectorNode;
            if (Array.isArray(conn.strokes) && conn.strokes.length > 0 && conn.strokes[0].type === 'SOLID') {
              const hex = rgbToHexColor(conn.strokes[0].color);
              conn.setPluginData('connector_color', hex);
            }
            if (typeof conn.strokeWeight === 'number') {
              conn.setPluginData('connector_weight', String(conn.strokeWeight));
            }
          }
          // 현재 선택된 노드들 중 이 커넥터가 포함되어 있다면 UI 갱신 플래그 활성화
          const currentSelection = figma.currentPage.selection;
          if (currentSelection.some((sel) => sel.id === connNode.id || findConnectorNode(sel)?.id === connNode.id)) {
            connectorSelectionChanged = true;
          }
        }
      }
    }
  }

  // 연결된 커스텀 직각 커넥터들 실시간 동기화
  if (movedNodeIds.size > 0) {
    await syncConnectorsForMovedNodes(movedNodeIds);
  }

  // 피그잼 캔버스에서 변경된 커넥터 컬러/두께 등 설정값을 UI 창에 실시간 연동
  if (connectorSelectionChanged) {
    handleSelectionChange();
  }
});

// 최초 실행 시 현재 상태 동기화, 커넥터 레지스트리 캐시 구축 및 설정 로드
refreshConnectorRegistry();
handleSelectionChange();
syncStatusList();
loadSavedSettings();
