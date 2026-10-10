// ============================================================================
// 토스트/알림/UI 메시지 카탈로그 (Core/UI 공용, Figma API 의존 없음)
// - 글로벌 8대 주요 언어 지원:
//   ko (한국어), en (영어/기본), ja (일본어), zh-CN (중국어 간체),
//   zh-TW (중국어 번체), es (스페인어), de (독일어), fr (프랑스어)
// - 새 메시지 추가 시 전 로케일에 같은 키를 반드시 등록 (test/i18n.test.mjs 검증).
// - 각 메시지별 [사용처], [조건], [비고] 주석을 JSDoc 형태로 명시하여 IDE 툴팁 및 유지보수 지원.
// ============================================================================

import type { AppLocale } from './types';

export type { AppLocale };

export const SUPPORTED_LOCALES: readonly AppLocale[] = [
  'ko',
  'en',
  'ja',
  'zh-CN',
  'zh-TW',
  'es',
  'de',
  'fr',
];

let activeLocale: AppLocale = 'en';

export function setAppLocale(locale: AppLocale | undefined | null): AppLocale {
  if (locale && SUPPORTED_LOCALES.includes(locale)) {
    activeLocale = locale;
  }
  return activeLocale;
}

export function getAppLocale(): AppLocale {
  return activeLocale;
}

export function resolveAppLocale(language: string | undefined | null): AppLocale {
  const lang = (language || '').trim().toLowerCase();

  if (!lang) return 'en';
  if (lang.startsWith('ko')) return 'ko';
  if (lang.startsWith('ja')) return 'ja';
  if (lang.startsWith('zh')) {
    const traditional = lang.includes('hant') || /-(tw|hk|mo)\b/.test(lang);
    return traditional ? 'zh-TW' : 'zh-CN';
  }
  if (lang.startsWith('es')) return 'es';
  if (lang.startsWith('de')) return 'de';
  if (lang.startsWith('fr')) return 'fr';

  return 'en';
}

export const MESSAGE_KEYS = [
  // 1. 플랜 한도 (Quota & Entitlement)
  'limitReached',

  // 2. 노드 생성 및 수정 (Node CRUD)
  'nodeCreated',
  'nodeCreateFailed',
  'nodeNotFoundSelect',
  'nodeUpdated',
  'nodeUpdateFailed',
  'nodesBatchUpdated',
  'nodesBatchUpdateFailed',
  'nodeGone',

  // 3. 커넥터 생성 및 체인 연결 (Connect & Chain)
  'connectNodesNotFound',
  'connectNeedTwoDifferent',
  'connectDone',
  'connectDoneLabel',
  'connectCreateFailed',
  'connectNeedTwoOrMore',
  'connectNeedTwoDifferentOrMore',
  'connectNeedTwo',
  'autoConnectDone',
  'autoConnectDoneLabel',
  'autoChainDone',
  'autoConnectFailed',
  'chainExistsAll',
  'chainCreatedPartial',
  'chainCreated',
  'chainFailed',

  // 4. 커넥터 라벨 및 속성 수정 (Connector Editing)
  'connectorSelectForLabel',
  'connectorLabelSet',
  'connectorLabelCleared',
  'connectorLabelFailed',
  'connectorNotFound',
  'connectorOffsetConverted',
  'connectorUpdateFailed',
  'connectorSelectForLineType',
  'connectorLineElbowed',
  'connectorLineStraight',
  'connectorLineTypeFailed',
  'connectorsNoneToConvert',
  'connectorsConvertedAll',
  'connectorsAlreadyElbowed',
  'connectorsConvertFailed',

  // 5. 어피어런스 - 상태 (Status Badge)
  'statusNeedSelection',
  'statusRemoved',
  'statusAttached',

  // 6. 어피어런스 - 엘리베이션 (Elevation)
  'elevationNeedSelection',
  'elevationRemoved',
  'elevationApplied',

  // 7. 어피어런스 - 스텝 뱃지 (Step Badges)
  'stepNeedSelection',
  'stepApplied',
  'stepRemoveNeedSelection',
  'stepRemoved',
  'stepNoneExist',

  // 8. 환경설정 및 디자인 토큰 (Settings & Tokens)
  'settingsSaved',
  'variablesUnsupported',
  'variablesNoneLocal',
  'tokensExtracted',
  'tokensFailed',

  // 9. 실행 취소 / 다시 실행 (Undo / Redo)
  'undoHint',
  'redoHint',
  'undoCancelled',
  'undone',

  // 10. 입력 유효성 검사 (Validation)
  'titleMax32',
  'max999',
  'sizeMinW',
  'sizeMaxW',
  'sizeMinH',
  'sizeMaxH',
  'sizeMaxCorner',

  // 11. 사이즈 및 스타일 프리셋 (Presets & Styles)
  'sizePresetAdded',
  'sizeUpdated',
  'sizePresetDeleted',
  'sizePresetDeleted2',
  'presetDeleteNoDefault',
  'styleAddedNew',
  'styleUpdated',
  'styleDefaultNoDelete',
  'styleDeleted',
  'styleEditNoDefault',
  'styleCustomLimitReached',
  'exportCopied',
  'exportEmpty',
  'exportFailed',

  // 12. 디스크립션 클립보드 복사 (Description)
  'descCopyEmpty',
  'descCopied',

  // 13. UI 컨트롤 및 필드 툴팁 (Control Tooltips)
  'tipWidth',
  'tipHeight',
  'tipCornerRadius',
  'tipStrokeWidth',
  'tipStartOffset',
  'tipEndOffset',
  'tipLabelText',
  'tipLabelPlaceholder',
  'tipClearLabel',
  'tipLabelFill',
  'tipLabelStroke',
  'tipAlignLeft',
  'tipAlignCenter',
  'tipAlignRight',
  'tipAddStyle',
  'tipStyleMore',
  'tipStyleMoreLocked',
  'tipFillColor',
  'tipStrokeColor',
  'tipStrokeWeight',
  'tipStepNumber',
  'tipStepStartNumber',
  'tipCornerTL',
  'tipCornerTR',
  'tipCornerBL',
  'tipCornerBR',
  'tipCopy',
  'tipCopied',
  'tipNoDesc',
  'tipDescDisabled',
  'tipLinkDisabled',
  'tipHexColor',
  'tipClose',
  'tipSettings',
  'tipRefreshFrames',
  'tipSolid',
  'tipDashed',
  'tipDotted',
  'tipStartTerminal',
  'tipEndTerminal',
  'tipTermNone',
  'tipTermArrow',
  'tipTermCircle',
  'tipTermDiamond',
  'tipTermTriangle',
  'tipRouteOrtho',
  'tipRouteSCurve',
  'tipRouteCurve',
  'tipRouteStraight',
  'tipGizmoSource',
  'tipGizmoTarget',
  'tipMixed',
  'tipActive',
  'tipAddSize',
  'tipAddSizeDisabled',
  'tipSizeMore',
  'tipSizeMoreDisabled',
  'tipDefaultPresetLocked',
  'tipSizeMode',
  'tipSizeModeDisabled',
  'sizeModeFixed',
  'sizeModeHug',
  'sizeModeFit',
  'tipPresetDims',
  'tipPresetDisabledShape',
  'tipConnectorColor',
  'tipQuotaBlocked',

  // 14. 도형 타입별 지원 여부 안내 (Shape Notices)
  'noticeSizeOnlyScreen',
  'noticeDescUnsupported',
  'noticeElevationUnsupported',
  'noticeStatusUnsupported',
  'noticeStepUnsupported',
  'noticeLinkUnsupported',
  'noticeMixed',

  // 15. 하단 액션바 연결 상태 라벨 (Connect Status Text)
  'connectStatusSelectNodes',
  'connectStatusReadyTwoNodes',
  'connectStatusReadyMultiNodes',
  'connectStatusReady',
  'connectStatusChangesReady',
  'connectStatusConnected',
  'connectStatusNoChanges',

  // 16. 주요 액션 버튼 안내 및 툴팁 (Action Buttons & Tooltips)
  'stepDescStartsFromNumber',
  'stepTipEnterStartNumber',
  'stepTipAddStepBadges',
  'connectTipNoChanges',
  'connectTipApplyChanges',
  'connectTipConnectNodes',
] as const;

export type MessageKey = (typeof MESSAGE_KEYS)[number];

type Catalog = Record<MessageKey, string>;

// ============================================================================
// KO — 한국어
// ============================================================================
const KO: Catalog = {
  // 1. 플랜 한도 (Quota & Entitlement)
  /** [사용처] Core/UI 한도 도달 알림 | [조건] 무료 플랜 20개 초과 시 | [비고] {current}, {limit} 치환 */
  limitReached: 'Flooow element가 가득 찼습니다 ({current}/{limit}). 기존 element를 삭제한 뒤 다시 시도해 주세요.',

  // 2. 노드 생성 및 수정 (Node CRUD)
  /** [사용처] Core 노드 단일 생성 완료 토스트 | [조건] 노드 1개 생성 성공 시 | [비고] {title} 치환 */
nodeCreated: '노드 "{title}"을 생성했습니다.',
  /** [사용처] Core 노드 생성 실패 토스트 | [조건] 노드 생성 예외 발생 시 | [비고] {error} 치환 */
  nodeCreateFailed: '노드 생성 실패: {error}',
  /** [사용처] Core 노드 수정 실패 안내 | [조건] 수정할 노드가 캔버스에서 선택되지 않았을 때 */
  nodeNotFoundSelect: '수정할 노드를 찾을 수 없습니다. 캔버스에서 노드를 선택해 주세요.',
  /** [사용처] Core 노드 단일 수정 완료 토스트 | [조건] 노드 속성 수정 성공 시 | [비고] {title} 치환 */
nodeUpdated: '노드 "{title}"을 업데이트했습니다.',
  /** [사용처] Core 노드 수정 실패 토스트 | [조건] 노드 수정 중 예외 발생 시 | [비고] {error} 치환 */
  nodeUpdateFailed: '노드 수정 실패: {error}',
  /** [사용처] Core 노드 다중 수정 완료 토스트 | [조건] 2개 이상 노드 일괄 업데이트 성공 시 | [비고] {count} 치환 */
  nodesBatchUpdated: '{count}개 노드가 업데이트되었습니다!',
  /** [사용처] Core 노드 다중 수정 실패 토스트 | [조건] 다중 업데이트 처리 중 예외 발생 시 | [비고] {error} 치환 */
  nodesBatchUpdateFailed: '다중 노드 업데이트 실패: {error}',
  /** [사용처] Core 노드 참조 실패 알림 | [조건] 참조하던 노드가 캔버스에서 삭제되었을 때 */
  nodeGone: '해당 노드를 찾을 수 없습니다.',

  // 3. 커넥터 생성 및 체인 연결 (Connect & Chain)
  /** [사용처] Core 커넥터 생성 오류 | [조건] 연결할 대상 노드를 찾을 수 없을 때 */
  connectNodesNotFound: '연결할 노드를 찾을 수 없습니다.',
  /** [사용처] Core 커넥터 생성 검증 | [조건] 동일한 노드를 선택했거나 2개 노드가 구별되지 않을 때 */
  connectNeedTwoDifferent: '서로 다른 두 노드를 선택하여 연결해 주세요.',
  /** [사용처] Core 커넥터 생성 완료 토스트 | [조건] 라벨 없는 커넥터 생성 성공 시 */
connectDone: '연결 완료.',
  /** [사용처] Core 커넥터 생성 완료 토스트 | [조건] 라벨이 포함된 커넥터 생성 성공 시 | [비고] {label} 치환 */
connectDoneLabel: '라벨 "{label}" 연결 완료.',
  /** [사용처] Core 커넥터 생성 실패 토스트 | [조건] 커넥터 생성 중 예외 발생 시 | [비고] {error} 치환 */
  connectCreateFailed: '연결선 생성 실패: {error}',
  /** [사용처] Core 다중 노드 연결 검증 | [조건] 연결 대상 노드가 2개 미만으로 선택되었을 때 */
  connectNeedTwoOrMore: '연결할 노드를 2개 이상 선택해 주세요.',
  /** [사용처] Core 다중 노드 연결 검증 | [조건] 서로 다른 노드가 2개 미만일 때 */
  connectNeedTwoDifferentOrMore: '서로 다른 노드를 2개 이상 선택해 주세요.',
  /** [사용처] UI 연결 버튼 검증 안내 | [조건] 노드가 2개 미만으로 선택되었을 때 */
  connectNeedTwo: '연결할 노드를 2개 이상 선택해 주세요.',
  /** [사용처] Core 직각 연결 완료 토스트 | [조건] 직각 커넥터 생성 성공 시 */
autoConnectDone: '칼각 직각 연결 완료.',
  /** [사용처] Core 직각 연결 완료 토스트 | [조건] 라벨 포함 직각 커넥터 생성 성공 시 | [비고] {label} 치환 */
autoConnectDoneLabel: '라벨 "{label}" 칼각 직각 연결 완료.',
  /** [사용처] Core 순차 체인 연결 완료 토스트 | [조건] 3개 이상 노드 순차 체인 생성 성공 시 | [비고] {nodes}, {conns} 치환 */
  autoChainDone: '⚡ 총 {nodes}개 노드가 칼각 직각 순차 연결되었습니다 ({conns}개 연결선).',
  /** [사용처] Core 자동 연결 실패 토스트 | [조건] 자동 연결 실행 중 오류 발생 시 | [비고] {error} 치환 */
  autoConnectFailed: '순차 자동 연결 실패: {error}',
  /** [사용처] Core 체인 생성 안내 | [조건] 선택한 노드들 사이의 모든 연결선이 이미 존재할 때 */
  chainExistsAll: '모든 연결이 이미 존재합니다.',
  /** [사용처] Core 부분 체인 연결 토스트 | [조건] 기존 연결은 건너뛰고 일부만 신규 생성되었을 때 | [비고] {created}, {skipped} 치환 */
chainCreatedPartial: '{created}개 연결 완료 ({skipped}개는 이미 연결됨).',
  /** [사용처] Core 체인 연결 완료 토스트 | [조건] 전체 체인 연결 신규 생성 완료 시 | [비고] {created} 치환 */
chainCreated: '{created}개 연결 완료.',
  /** [사용처] Core 체인 연결 실패 토스트 | [조건] 체인 생성 중 예외 발생 시 | [비고] {error} 치환 */
  chainFailed: '체인 연결 실패: {error}',

  // 4. 커넥터 라벨 및 속성 수정 (Connector Editing)
  /** [사용처] Core 커넥터 라벨 수정 검증 | [조건] 캔버스에 선택된 커넥터가 없을 때 */
  connectorSelectForLabel: '수정할 연결선(커넥터)을 캔버스에서 선택해 주세요.',
  /** [사용처] Core 커넥터 라벨 설정 토스트 | [조건] 커넥터에 텍스트 라벨 적용 시 | [비고] {label} 치환 */
  connectorLabelSet: '선 중앙 텍스트가 "{label}"(으)로 반영되었습니다!',
  /** [사용처] Core 커넥터 라벨 제거 토스트 | [조건] 커넥터 텍스트 라벨을 삭제했을 때 */
  connectorLabelCleared: '선 중앙 텍스트가 지워졌습니다.',
  /** [사용처] Core 커넥터 라벨 수정 실패 | [조건] 라벨 변경 예외 발생 시 | [비고] {error} 치환 */
  connectorLabelFailed: '선 텍스트 수정 실패: {error}',
  /** [사용처] Core 커넥터 탐색 실패 알림 | [조건] 수정할 커넥터 노드가 없을 때 */
  connectorNotFound: '수정할 커넥터를 찾을 수 없습니다.',
  /** [사용처] Core 커넥터 자동 변환 알림 | [조건] 네이티브 커넥터에 오프셋 부여로 직각 커스텀 변환될 때 */
  connectorOffsetConverted: '오프셋 적용을 위해 직각 커스텀 커넥터로 자동 변환되었습니다.',
  /** [사용처] Core 커넥터 수정 실패 토스트 | [조건] 커넥터 속성 갱신 중 예외 발생 시 | [비고] {error} 치환 */
  connectorUpdateFailed: '커넥터 수정 실패: {error}',
  /** [사용처] Core 라인 타입 변경 검증 | [조건] 커넥터가 선택되지 않은 상태에서 라인 타입 변경 시도 시 */
  connectorSelectForLineType: '변경할 연결선(커넥터)을 캔버스에서 선택해 주세요.',
  /** [사용처] Core 직각 변환 완료 토스트 | [조건] 커넥터를 직각 형태로 변경했을 때 */
connectorLineElbowed: '📐 연결선을 직각으로 변경했습니다.',
  /** [사용처] Core 직선 변환 완료 토스트 | [조건] 커넥터를 직선 형태로 변경했을 때 */
connectorLineStraight: '📏 연결선을 직선으로 변경했습니다.',
  /** [사용처] Core 라인 형태 변경 실패 | [조건] 라인 형태 변경 중 예외 발생 시 | [비고] {error} 치환 */
  connectorLineTypeFailed: '연결선 형태 변경 실패: {error}',
  /** [사용처] Core 일괄 변환 대상 없음 알림 | [조건] 캔버스에 변환할 커넥터가 없을 때 */
  connectorsNoneToConvert: '캔버스에 변환할 연결선이 없습니다.',
  /** [사용처] Core 전체 직각 일괄 변환 토스트 | [조건] 캔버스의 모든 커넥터를 직각으로 변환 완료 시 | [비고] {count} 치환 */
connectorsConvertedAll: '⚡ 연결선 {count}개를 모두 직각으로 변환했습니다.',
  /** [사용처] Core 일괄 변환 기완료 안내 | [조건] 캔버스의 모든 커넥터가 이미 직각일 때 | [비고] {count} 치환 */
connectorsAlreadyElbowed: '연결선 {count}개가 이미 모두 직각 상태입니다.',
  /** [사용처] Core 일괄 변환 실패 토스트 | [조건] 일괄 변환 처리 중 오류 발생 시 | [비고] {error} 치환 */
  connectorsConvertFailed: '연결선 일괄 변환 실패: {error}',

  // 5. 어피어런스 - 상태 (Status Badge)
  /** [사용처] Core 상태 뱃지 선택 검증 | [조건] 선택된 노드 없이 상태 지정 시도 시 */
  statusNeedSelection: '상태를 지정할 요소를 1개 이상 선택해 주세요.',
  /** [사용처] Core 상태 뱃지 제거 토스트 | [조건] 노드에서 상태 뱃지 삭제 완료 시 | [비고] {count} 치환 */
  statusRemoved: '{count}개 노드의 상태 뱃지가 제거되었습니다.',
  /** [사용처] Core 상태 뱃지 부착 토스트 | [조건] 노드에 특정 상태 뱃지 부착 완료 시 | [비고] {count}, {label} 치환 */
statusAttached: '{count}개 노드에 상태 뱃지 "{label}"을 부착했습니다.',
  // 6. 어피어런스 - 엘리베이션 (Elevation)
  /** [사용처] Core 엘리베이션 선택 검증 | [조건] 선택된 노드 없이 엘리베이션 지정 시도 시 */
  elevationNeedSelection: '엘리베이션을 적용할 요소를 선택해 주세요.',
  /** [사용처] Core 엘리베이션 제거 토스트 | [조건] 노드에서 그림자(Elevation) 제거 완료 시 | [비고] {count} 치환 */
  elevationRemoved: '{count}개 노드의 엘리베이션이 제거되었습니다.',
  /** [사용처] Core 엘리베이션 적용 토스트 | [조건] 노드에 레벨별 그림자 적용 완료 시 | [비고] {count}, {level} 치환 */
  elevationApplied: '{count}개 노드에 Level {level} 엘리베이션이 적용되었습니다.',

  // 7. 어피어런스 - 스텝 뱃지 (Step Badges)
  /** [사용처] Core 스텝 번호 선택 검증 | [조건] 선택 노드 없이 스텝 번호 적용 시도 시 */
  stepNeedSelection: '스텝 번호를 매길 요소를 캔버스에서 선택해 주세요.',
  /** [사용처] Core 스텝 번호 적용 토스트 | [조건] 노드에 스텝 번호 부여 완료 시 | [비고] {count} 치환 */
  stepApplied: '{count}개 노드에 스텝 번호가 적용되었습니다.',
  /** [사용처] Core 스텝 번호 제거 선택 검증 | [조건] 선택 노드 없이 스텝 번호 제거 시도 시 */
  stepRemoveNeedSelection: '스텝 번호를 제거할 요소를 캔버스에서 선택해 주세요.',
  /** [사용처] Core 스텝 번호 제거 토스트 | [조건] 노드에서 스텝 번호 뱃지 삭제 완료 시 | [비고] {count} 치환 */
  stepRemoved: '{count}개 노드의 스텝 번호가 제거되었습니다.',
  /** [사용처] Core 스텝 번호 없음 알림 | [조건] 선택한 노드들에 스텝 번호가 없을 때 */
  stepNoneExist: '선택한 노드에 스텝 번호가 존재하지 않습니다.',

  // 8. 환경설정 및 디자인 토큰 (Settings & Tokens)
  /** [사용처] Core 환경설정 저장 알림 | [조건] clientStorage에 설정 저장 완료 시 */
  settingsSaved: '피그마 연동 설정이 안전하게 저장되었습니다.',
  /** [사용처] Core 변수 API 미지원 알림 | [조건] 현재 피그마 버전에서 figma.variables가 없을 때 */
  variablesUnsupported: '이 피그마 버전에서는 Variables API를 지원하지 않습니다.',
  /** [사용처] Core 로컬 변수 없음 안내 | [조건] 열려 있는 파일에 로컬 Variables가 없을 때 */
  variablesNoneLocal: '현재 열린 파일에 등록된 로컬 변수(Variables)가 없습니다. UI3 Kit 파일 탭에서 실행해 주세요.',
  /** [사용처] Core 디자인 토큰 추출 완료 알림 | [조건] UI3 토큰 추출 성공 시 | [비고] {count} 치환 */
  tokensExtracted: '🎨 총 {count}개의 UI3 디자인 토큰이 추출되었습니다!',
  /** [사용처] Core 토큰 추출 실패 알림 | [조건] UI3 토큰 추출 중 예외 발생 시 | [비고] {error} 치환 */
  tokensFailed: 'UI3 변수 추출 실패: {error}',

  // 9. 실행 취소 / 다시 실행 (Undo / Redo)
  /** [사용처] UI 실행 취소 힌트 툴팁 | [조건] 캔버스 실행 취소 힌트 노출 시 */
  undoHint: '캔버스에서 Cmd+Z (Mac) 또는 Ctrl+Z (Windows)로 작업을 되돌릴 수 있습니다.',
  /** [사용처] UI 다시 실행 힌트 툴팁 | [조건] 캔버스 다시 실행 힌트 노출 시 */
  redoHint: '캔버스에서 Cmd+Shift+Z (Mac) 또는 Ctrl+Y (Windows)로 다시 실행할 수 있습니다.',
  /** [사용처] Core 작업 취소 토스트 | [조건] 진행 중인 작업 변경사항이 취소되었을 때 */
  undoCancelled: '변경사항이 취소되었습니다.',
  /** [사용처] Core 작업 되돌림 완료 토스트 | [조건] 직전 작업이 취소/되돌려졌을 때 */
  undone: '작업이 되돌려졌습니다.',

  // 10. 입력 유효성 검사 (Validation)
  /** [사용처] UI 제목 입력 제한 안내 | [조건] 제목이 32자를 초과했을 때 */
  titleMax32: '제목은 최대 32자까지 입력할 수 있습니다.',
  /** [사용처] UI 수치 최대값 제한 안내 | [조건] 입력값이 999를 초과했을 때 */
  max999: '최대값은 999입니다.',
  /** [사용처] UI 최소 너비 제한 안내 | [조건] 입력 너비가 최소값 미만일 때 | [비고] {px} 치환 */
  sizeMinW: '최소 너비는 {px}px입니다.',
  /** [사용처] UI 최대 너비 제한 안내 | [조건] 입력 너비가 최대값 초과일 때 | [비고] {px} 치환 */
  sizeMaxW: '최대 너비는 {px}px입니다.',
  /** [사용처] UI 최소 높이 제한 안내 | [조건] 입력 높이가 최소값 미만일 때 | [비고] {px} 치환 */
  sizeMinH: '최소 높이는 {px}px입니다.',
  /** [사용처] UI 최대 높이 제한 안내 | [조건] 입력 높이가 최대값 초과일 때 | [비고] {px} 치환 */
  sizeMaxH: '최대 높이는 {px}px입니다.',
  /** [사용처] UI 모서리 곡률 최대값 제한 | [조건] 모서리 곡률이 최대 허용치를 초과했을 때 | [비고] {px} 치환 */
  sizeMaxCorner: '최대값은 {px}입니다.',

  // 11. 사이즈 및 스타일 프리셋 (Presets & Styles)
  /** [사용처] Core 사이즈 프리셋 추가 알림 | [조건] 새 커스텀 사이즈 프리셋 저장 완료 시 | [비고] {name} 치환 */
  sizePresetAdded: '"{name}" 사이즈가 추가되었습니다.',
  /** [사용처] Core 사이즈 속성 갱신 알림 | [조건] 노드 사이즈 속성 반영 완료 시 */
  sizeUpdated: '사이즈가 업데이트되었습니다.',
  /** [사용처] Core 사이즈 프리셋 삭제 알림 | [조건] 특정 사이즈 프리셋 삭제 완료 시 | [비고] {name} 치환 */
  sizePresetDeleted: '"{name}" 프리셋이 삭제되었습니다.',
  /** [사용처] Core 사이즈 프리셋 삭제 알림 | [조건] 사이즈 프리셋 삭제 완료 시 */
  sizePresetDeleted2: '사이즈 프리셋이 삭제되었습니다.',
  /** [사용처] UI 기본 프리셋 보호 알림 | [조건] 기본 빌트인 프리셋 삭제 시도 시 */
  presetDeleteNoDefault: '기본 프리셋은 삭제할 수 없습니다.',
  /** [사용처] Core 스타일 프리셋 추가 알림 | [조건] 새 커스텀 스타일 저장 완료 시 */
  styleAddedNew: '새 스타일이 추가되었습니다.',
  /** [사용처] Core 스타일 프리셋 수정 알림 | [조건] 스타일 프리셋 갱신 완료 시 */
  styleUpdated: '스타일이 업데이트되었습니다.',
  /** [사용처] UI/Core 기본 스타일 보호 알림 | [조건] 기본 White/Black 스타일 삭제 시도 시 */
  styleDefaultNoDelete: '기본 스타일은 삭제할 수 없습니다.',
  /** [사용처] Core 스타일 프리셋 삭제 알림 | [조건] 커스텀 스타일 삭제 완료 시 */
  styleDeleted: '스타일이 삭제되었습니다.',
  /** [사용처] UI 기본 스타일 보호 알림 | [조건] 기본 White/Black 스타일 수정 시도 시 */
  styleEditNoDefault: '기본 스타일은 수정할 수 없습니다.',
  /** [사용처] UI 스타일 프리셋 추가 제한 | [조건] 커스텀 스타일이 7개에 도달한 상태에서 추가 시도 시 */
  styleCustomLimitReached: '사용자 스타일은 최대 7개까지 추가할 수 있습니다.',
  exportCopied: 'AI용 플로우를 복사했습니다.',
  exportEmpty: '이 페이지에 내보낼 플로우가 없습니다.',
  exportFailed: '내보기에 실패했습니다.',

  // 12. 디스크립션 클립보드 복사 (Description)
  /** [사용처] UI 설명 복사 검증 | [조건] 설명 내용이 비어있는 상태에서 복사 클릭 시 */
  descCopyEmpty: '복사할 설명이 없습니다.',
  /** [사용처] UI 설명 복사 완료 피드백 | [조건] 클립보드 복사 성공 시 */
  descCopied: '디스크립션을 클립보드에 복사했습니다',

  // 13. UI 컨트롤 및 필드 툴팁 (Control Tooltips)
  /** [사용처] UI SizeSection | [조건] W 너비 스크러버 마우스 오버 */
  tipWidth: '너비',
  /** [사용처] UI SizeSection | [조건] H 높이 스크러버 마우스 오버 */
  tipHeight: '높이',
  /** [사용처] UI SizeSection | [조건] R 모서리 곡률 인풋 마우스 오버 */
  tipCornerRadius: '모서리 곡률',
  /** [사용처] UI ConnectorSection | [조건] 선 두께 스크러버 마우스 오버 */
  tipStrokeWidth: '선 두께',
  /** [사용처] UI ConnectorSection | [조건] 시작 간격 오프셋 인풋 마우스 오버 */
  tipStartOffset: '시작 오프셋',
  /** [사용처] UI ConnectorSection | [조건] 끝 간격 오프셋 인풋 마우스 오버 */
  tipEndOffset: '끝 오프셋',
  /** [사용처] UI ConnectorSection | [조건] 커넥터 중앙 라벨 인풋 마우스 오버 */
  tipLabelText: '라벨 텍스트',
  /** [사용처] UI ConnectorSection | [조건] 커넥터 라벨 입력 인풋 플레이스홀더 */
  tipLabelPlaceholder: '라벨 추가',
  /** [사용처] UI ConnectorSection | [조건] 커넥터 라벨 삭제(X) 버튼 접근성 라벨 */
  tipClearLabel: '라벨 지우기',
  /** [사용처] UI ConnectorSection | [조건] 라벨 배경색 컬러 피커 마우스 오버 */
  tipLabelFill: '라벨 배경 색상',
  /** [사용처] UI ConnectorSection | [조건] 라벨 보더색 컬러 피커 마우스 오버 */
  tipLabelStroke: '라벨 보더 색상',
  /** [사용처] UI TextAlignment | [조건] 텍스트 좌측 정렬 버튼 마우스 오버 */
  tipAlignLeft: '왼쪽 정렬',
  /** [사용처] UI TextAlignment | [조건] 텍스트 가운데 정렬 버튼 마우스 오버 */
  tipAlignCenter: '가운데 정렬',
  /** [사용처] UI TextAlignment | [조건] 텍스트 우측 정렬 버튼 마우스 오버 */
  tipAlignRight: '오른쪽 정렬',
  /** [사용처] UI StyleSection | [조건] 스타일 추가(+) 버튼 마우스 오버 */
  tipAddStyle: '스타일 추가',
  /** [사용처] UI StyleSection | [조건] 스타일 더보기(…) 메뉴 마우스 오버 */
  tipStyleMore: '추가 옵션',
  /** [사용처] UI StyleSection | [조건] 기본 스타일 더보기 메뉴 마우스 오버 (수정/삭제 잠금 안내) */
  tipStyleMoreLocked: '기본 스타일은 수정하거나 삭제할 수 없습니다',
  /** [사용처] UI StyleSection | [조건] 노드 배경(Fill) 색상 피커 마우스 오버 */
  tipFillColor: '배경 색상',
  /** [사용처] UI StyleSection | [조건] 노드 보더(Stroke) 색상 피커 마우스 오버 */
  tipStrokeColor: '보더 색상',
  /** [사용처] UI StyleSection | [조건] 노드 보더 두께 스크러버 마우스 오버 */
  tipStrokeWeight: '보더 두께',
  /** [사용처] UI StepBadgesSection | [조건] 개별 노드 스텝 번호 배지 마우스 오버 */
  tipStepNumber: '배지 번호',
  /** [사용처] UI StepBadgesSection | [조건] 시작 배지 번호 입력 인풋 마우스 오버 */
  tipStepStartNumber: '시작 배지 번호',
  /** [사용처] UI StepBadgesSection | [조건] 좌상단 코너 위치 라디오 버튼 마우스 오버 */
  tipCornerTL: '왼쪽 위',
  /** [사용처] UI StepBadgesSection | [조건] 우상단 코너 위치 라디오 버튼 마우스 오버 */
  tipCornerTR: '오른쪽 위',
  /** [사용처] UI StepBadgesSection | [조건] 좌하단 코너 위치 라디오 버튼 마우스 오버 */
  tipCornerBL: '왼쪽 아래',
  /** [사용처] UI StepBadgesSection | [조건] 우하단 코너 위치 라디오 버튼 마우스 오버 */
  tipCornerBR: '오른쪽 아래',
  /** [사용처] UI DescriptionSection | [조건] 설명 복사 버튼 마우스 오버 */
  tipCopy: '복사',
  /** [사용처] UI DescriptionSection | [조건] 복사 완료 직후 툴팁 */
  tipCopied: '복사 완료',
  /** [사용처] UI DescriptionSection | [조건] 설명이 비어있을 때 마우스 오버 */
  tipNoDesc: '입력된 설명이 없습니다',
  /** [사용처] UI DescriptionSection | [조건] Description 미지원 도형 선택 시 비활성 툴팁 */
  tipDescDisabled: '이 도형에서는 Description을 사용할 수 없습니다',
  /** [사용처] UI LinkSection | [조건] Reference Link 미지원 도형 선택 시 비활성 툴팁 */
  tipLinkDisabled: '이 도형에서는 Reference Link를 사용할 수 없습니다',
  /** [사용처] UI ColorPicker | [조건] Hex 색상 코드 입력 필드 마우스 오버 */
  tipHexColor: 'Hex 색상',
  /** [사용처] UI Popover / Modal | [조건] 팝오버 닫기(X) 버튼 마우스 오버 */
  tipClose: '닫기',
  tipSettings: '설정',
  /** [사용처] UI ScreenFrameSelect | [조건] 캔버스 프레임 새로고침 아이콘 마우스 오버 */
  tipRefreshFrames: '캔버스에서 프레임 새로고침',
  /** [사용처] UI ConnectorSection | [조건] 실선 스타일 세그먼트 버튼 마우스 오버 */
  tipSolid: '실선',
  /** [사용처] UI ConnectorSection | [조건] 파선(대시) 스타일 세그먼트 버튼 마우스 오버 */
  tipDashed: '파선',
  /** [사용처] UI ConnectorSection | [조건] 점선 스타일 세그먼트 버튼 마우스 오버 */
  tipDotted: '점선',
  /** [사용처] UI ConnectorSection | [조건] 시작 단자 형태 선택 드롭다운 마우스 오버 */
  tipStartTerminal: '시작 단자',
  /** [사용처] UI ConnectorSection | [조건] 끝 단자 형태 선택 드롭다운 마우스 오버 */
  tipEndTerminal: '끝 단자',
  /** [사용처] UI ConnectorSection | [조건] 단자 없음(None) 옵션 마우스 오버 */
  tipTermNone: '없음',
  /** [사용처] UI ConnectorSection | [조건] 화살표 단자 옵션 마우스 오버 */
  tipTermArrow: '화살표',
  /** [사용처] UI ConnectorSection | [조건] 원형 단자 옵션 마우스 오버 */
  tipTermCircle: '원',
  /** [사용처] UI ConnectorSection | [조건] 마름모 단자 옵션 마우스 오버 */
  tipTermDiamond: '마름모',
  tipTermTriangle: '삼각형',
  /** [사용처] UI ConnectorSection | [조건] 직각 라우팅 옵션 마우스 오버 */
  tipRouteOrtho: '직각',
  /** [사용처] UI ConnectorSection | [조건] S자 곡선 라우팅 옵션 마우스 오버 */
  tipRouteSCurve: '라운드',
  /** [사용처] UI ConnectorSection | [조건] 곡선 라우팅 옵션 마우스 오버 */
  tipRouteCurve: '곡선',
  /** [사용처] UI ConnectorSection | [조건] 직선 라우팅 옵션 마우스 오버 */
  tipRouteStraight: '직선',
  /** [사용처] UI ConnectorSection | [조건] 시작 단자 앵커(기즈모) 마우스 오버 */
  tipGizmoSource: '시작',
  /** [사용처] UI ConnectorSection | [조건] 끝 단자 앵커(기즈모) 마우스 오버 */
  tipGizmoTarget: '끝',
  /** [사용처] UI 다중 선택 | [조건] 서로 다른 속성값이 섞여있는 Mixed 필드 마우스 오버 */
  tipMixed: '혼합',
  /** [사용처] UI 토글 컨트롤 | [조건] 활성화 상태 스위치 마우스 오버 */
  tipActive: '활성',
  /** [사용처] UI SizeSection | [조건] 커스텀 사이즈 프리셋 추가 버튼 마우스 오버 */
  tipAddSize: '사이즈 추가',
  /** [사용처] UI SizeSection | [조건] Screen 외 도형 선택 시 사이즈 추가 비활성 툴팁 */
  tipAddSizeDisabled: '이 도형에서는 사이즈를 추가할 수 없습니다',
  /** [사용처] UI SizeSection | [조건] 사이즈 프리셋 더보기(…) 메뉴 마우스 오버 */
  tipSizeMore: '추가 옵션',
  /** [사용처] UI SizeSection | [조건] Screen 외 도형 선택 시 사이즈 더보기 비활성 툴팁 */
  tipSizeMoreDisabled: '이 도형에서는 Size 옵션을 사용할 수 없습니다',
  /** [사용처] UI SizeSection | [조건] 기본 사이즈 프리셋 마우스 오버 (수정/삭제 잠금 안내) */
  tipDefaultPresetLocked: '기본 프리셋은 수정하거나 삭제할 수 없습니다',
  /** [사용처] UI SizeSection | [조건] 높이 모드 선택 드롭다운 마우스 오버 */
  tipSizeMode: '높이 모드 선택',
  /** [사용처] UI SizeSection | [조건] Screen 외 도형 선택 시 높이 모드 비활성 툴팁 */
  tipSizeModeDisabled: '이 도형에서는 Size 모드를 변경할 수 없습니다',
  /** [사용처] UI SizeSection/SizeModal | [조건] 고정 높이 모드 라벨 */
  sizeModeFixed: '고정 높이',
  /** [사용처] UI SizeSection/SizeModal | [조건] 콘텐츠 맞춤 모드 라벨 */
  sizeModeHug: '콘텐츠 맞춤',
  /** [사용처] UI SizeSection/SizeModal | [조건] 콘텐츠 채우기 모드 라벨 */
  sizeModeFit: '콘텐츠 채우기',
  /** [사용처] UI SizeSection | [조건] 사이즈 프리셋 칩 마우스 오버 | [비고] {w}, {h} 치환 */
  tipPresetDims: '{w}×{h}',
  /** [사용처] UI SizeSection | [조건] Screen 외 도형 선택 시 프리셋 칩 비활성 툴팁 */
  tipPresetDisabledShape: '이 도형에서는 Size 프리셋을 사용할 수 없습니다',
  /** [사용처] UI ConnectorSection | [조건] 커넥터 선 색상 피커 마우스 오버 */
  tipConnectorColor: '커넥터 색상',
  /** [사용처] UI Footer / Action | [조건] 무료 생성 한도(20개) 도달 시 비활성 툴팁 */
  tipQuotaBlocked: '무료 한도에 도달했습니다. 업그레이드하면 더 만들 수 있습니다',

  // 14. 도형 타입별 지원 여부 안내 (Shape Notices)
  /** [사용처] UI SizeSection 패널 | [조건] Screen 타입 노드가 아닌 일반 도형 선택 시 */
noticeSizeOnlyScreen: 'Size는 Screen 노드에서만 사용할 수 있습니다.',
  /** [사용처] UI DescriptionSection 패널 | [조건] Description 미지원 도형 선택 시 */
noticeDescUnsupported: 'Description은 이 도형에서 사용할 수 없습니다.',
  /** [사용처] UI ElevationSection 패널 | [조건] Elevation 미지원 도형 선택 시 */
noticeElevationUnsupported: 'Elevation은 이 도형에서 사용할 수 없습니다.',
  /** [사용처] UI StatusSection 패널 | [조건] Status 미지원 도형 선택 시 */
noticeStatusUnsupported: 'Status는 이 도형에서 사용할 수 없습니다.',
  /** [사용처] UI StepBadgesSection 패널 | [조건] Step Badges 미지원 도형 선택 시 */
noticeStepUnsupported: 'Step Badges는 이 도형에서 사용할 수 없습니다.',
  /** [사용처] UI LinkSection 패널 | [조건] Reference Link 미지원 도형 선택 시 */
noticeLinkUnsupported: 'Reference Link는 이 도형에서 사용할 수 없습니다.',
  /** [사용처] UI 어피어런스 패널 | [조건] 서로 다른 타입 노드 혼합 선택 시 */
noticeMixed: '혼합 선택에서는 사용할 수 없습니다.',
  // 15. 하단 액션바 연결 상태 라벨 (Connect Status Text)
  /** [사용처] UI ConnectSection 상태 라벨 | [조건] 캔버스에서 선택된 노드가 0개 또는 1개일 때 */
connectStatusSelectNodes: '연결할 노드를 2개 이상 선택.',
  /** [사용처] UI ConnectSection 상태 라벨 | [조건] 2개 노드가 선택되고 명시적 단자 연결 준비 완료 시 */
connectStatusReadyTwoNodes: '2개 노드 연결 준비 완료.',
  /** [사용처] UI ConnectSection 상태 라벨 | [조건] 3개 이상 노드 선택 시 | [비고] {count} 치환 */
connectStatusReadyMultiNodes: '{count}개 노드 연결 준비 완료.',
  /** [사용처] UI ConnectSection 상태 라벨 | [조건] AUTO 단자 등 기본 연결 준비 완료 시 */
connectStatusReady: '연결 준비 완료.',
  /** [사용처] UI ConnectSection 상태 라벨 | [조건] 선택된 커넥터에 변경사항이 존재할 때 */
connectStatusChangesReady: '적용할 변경사항 준비 완료.',
  /** [사용처] UI ConnectSection 상태 라벨 | [조건] 커넥터 연결/적용 작업이 완료되었을 때 */
connectStatusConnected: '연결됨.',
  /** [사용처] UI ConnectSection 상태 라벨 | [조건] 선택된 커넥터에 변경사항이 없을 때 */
connectStatusNoChanges: '변경사항 없음.',
  // 16. 주요 액션 버튼 안내 및 툴팁 (Action Buttons & Tooltips)
  /** [사용처] UI StepBadgesSection 안내 문구 | [조건] Add Step Badges 버튼 좌측에 상시 표시 */
stepDescStartsFromNumber: '지정한 번호부터 시작.',
  /** [사용처] UI StepBadgesSection 버튼 툴팁 | [조건] 시작 번호 미입력으로 버튼 비활성화 시 */
stepTipEnterStartNumber: '시작 번호를 입력하세요.',
  /** [사용처] UI StepBadgesSection 버튼 툴팁 | [조건] 시작 번호 입력되어 버튼 활성화 시 */
stepTipAddStepBadges: '스텝 뱃지 추가.',
  /** [사용처] UI ConnectSection 버튼 툴팁 | [조건] 선택된 커넥터에 적용할 변경사항이 없을 때 */
connectTipNoChanges: '적용할 변경사항 없음.',
  /** [사용처] UI ConnectSection 버튼 툴팁 | [조건] 선택된 커넥터의 옵션 변경사항 적용 준비 시 */
connectTipApplyChanges: '커넥터 변경사항 적용.',
  /** [사용처] UI ConnectSection 버튼 툴팁 | [조건] 2개 이상 선택된 노드 신규 연결 준비 시 */
connectTipConnectNodes: '선택한 노드 연결.',
};

// ============================================================================
// EN — English (Default Global Source of Truth)
// ============================================================================
const EN: Catalog = {
  // 1. Quota & Entitlement
  limitReached: 'Flooow elements are full ({current}/{limit}). Delete existing elements and try again.',

  // 2. Node CRUD
nodeCreated: 'Created node "{title}".',
  nodeCreateFailed: 'Failed to create node: {error}',
  nodeNotFoundSelect: 'Node to edit not found. Select a node on the canvas.',
nodeUpdated: 'Updated node "{title}".',
  nodeUpdateFailed: 'Failed to update node: {error}',
  nodesBatchUpdated: 'Updated {count} nodes',
  nodesBatchUpdateFailed: 'Failed to update nodes: {error}',
  nodeGone: 'Node not found.',

  // 3. Connect & Chain
  connectNodesNotFound: 'Nodes to connect not found.',
  connectNeedTwoDifferent: 'Select two different nodes to connect.',
connectDone: 'Connected.',
connectDoneLabel: 'Connected with label "{label}".',
  connectCreateFailed: 'Failed to create connector: {error}',
  connectNeedTwoOrMore: 'Select 2 or more nodes to connect.',
  connectNeedTwoDifferentOrMore: 'Select 2 or more different nodes.',
  connectNeedTwo: 'Select 2 or more nodes to connect.',
autoConnectDone: 'Orthogonal connection complete.',
autoConnectDoneLabel: 'Orthogonal connection complete with label "{label}".',
  autoChainDone: '⚡ Connected {nodes} nodes in sequence ({conns} connectors).',
  autoConnectFailed: 'Auto connect failed: {error}',
  chainExistsAll: 'All connections already exist.',
chainCreatedPartial: '{created} connections created ({skipped} already connected).',
chainCreated: '{created} connections created.',
  chainFailed: 'Chain connection failed: {error}',

  // 4. Connector Editing
  connectorSelectForLabel: 'Select a connector on the canvas to edit.',
  connectorLabelSet: 'Center label set to "{label}"',
  connectorLabelCleared: 'Center label cleared.',
  connectorLabelFailed: 'Failed to update line text: {error}',
  connectorNotFound: 'Connector to edit not found.',
  connectorOffsetConverted: 'Converted to a custom orthogonal connector to apply offsets.',
  connectorUpdateFailed: 'Failed to update connector: {error}',
  connectorSelectForLineType: 'Select a connector on the canvas to change.',
connectorLineElbowed: '📐 Connector changed to orthogonal.',
connectorLineStraight: '📏 Connector changed to straight.',
  connectorLineTypeFailed: 'Failed to change connector line type: {error}',
  connectorsNoneToConvert: 'No connectors on the canvas to convert.',
connectorsConvertedAll: '⚡ Converted {count} connectors to orthogonal.',
connectorsAlreadyElbowed: '{count} connectors are already orthogonal.',
  connectorsConvertFailed: 'Failed to convert connectors: {error}',

  // 5. Status Badge
  statusNeedSelection: 'Select 1 or more elements to set a status.',
  statusRemoved: 'Removed status badges from {count} nodes.',
statusAttached: 'Attached status badge "{label}" to {count} nodes.',
  // 6. Elevation
  elevationNeedSelection: 'Select elements to apply elevation.',
  elevationRemoved: 'Removed elevation from {count} nodes.',
  elevationApplied: 'Applied Level {level} elevation to {count} nodes.',

  // 7. Step Badges
  stepNeedSelection: 'Select elements on the canvas to number.',
  stepApplied: 'Applied step numbers to {count} nodes.',
  stepRemoveNeedSelection: 'Select elements on the canvas to remove step numbers.',
  stepRemoved: 'Removed step numbers from {count} nodes.',
  stepNoneExist: 'Selected nodes have no step numbers.',

  // 8. Settings & Tokens
  settingsSaved: 'Figma integration settings saved.',
  variablesUnsupported: 'This Figma version does not support the Variables API.',
  variablesNoneLocal: 'No local Variables in the open file. Run it from the UI3 Kit file tab.',
  tokensExtracted: '🎨 Extracted {count} UI3 design tokens.',
  tokensFailed: 'Failed to extract UI3 variables: {error}',

  // 9. Undo / Redo
  undoHint: 'Undo with Cmd+Z (Mac) or Ctrl+Z (Windows) on the canvas.',
  redoHint: 'Redo with Cmd+Shift+Z (Mac) or Ctrl+Y (Windows) on the canvas.',
  undoCancelled: 'Changes discarded.',
  undone: 'Undone.',

  // 10. Validation
  titleMax32: 'Titles can be up to 32 characters.',
  max999: 'Maximum is 999.',
  sizeMinW: 'Minimum width is {px}px.',
  sizeMaxW: 'Maximum width is {px}px.',
  sizeMinH: 'Minimum height is {px}px.',
  sizeMaxH: 'Maximum height is {px}px.',
  sizeMaxCorner: 'Maximum is {px}.',

  // 11. Presets & Styles
  sizePresetAdded: 'Added size preset "{name}".',
  sizeUpdated: 'Size updated.',
  sizePresetDeleted: 'Deleted preset "{name}".',
  sizePresetDeleted2: 'Size preset deleted.',
  presetDeleteNoDefault: 'Default presets cannot be deleted.',
  styleAddedNew: 'New style added.',
  styleUpdated: 'Style updated.',
  styleDefaultNoDelete: 'Default styles cannot be deleted.',
  styleDeleted: 'Style deleted.',
  styleEditNoDefault: 'Default styles cannot be edited.',
  styleCustomLimitReached: 'You can add up to 7 custom styles.',
  exportCopied: 'Flow copied for AI.',
  exportEmpty: 'Nothing to export on this page.',
  exportFailed: 'Export failed.',

  // 12. Description
  descCopyEmpty: 'No description to copy.',
  descCopied: 'Description copied to clipboard!',

  // 13. Control Tooltips
  tipWidth: 'Width',
  tipHeight: 'Height',
  tipCornerRadius: 'Corner radius',
  tipStrokeWidth: 'Stroke width',
  tipStartOffset: 'Start offset',
  tipEndOffset: 'End offset',
  tipLabelText: 'Label text',
  tipLabelPlaceholder: 'Add a label',
  tipClearLabel: 'Clear label',
  tipLabelFill: 'Label fill color',
  tipLabelStroke: 'Label stroke color',
  tipAlignLeft: 'Align left',
  tipAlignCenter: 'Align center',
  tipAlignRight: 'Align right',
  tipAddStyle: 'Add style',
  tipStyleMore: 'More options',
  tipStyleMoreLocked: 'Default styles cannot be edited or deleted',
  tipFillColor: 'Fill color',
  tipStrokeColor: 'Stroke color',
  tipStrokeWeight: 'Stroke weight',
  tipStepNumber: 'Badge Number',
  tipStepStartNumber: 'Start Badge Number',
  tipCornerTL: 'Top-Left',
  tipCornerTR: 'Top-Right',
  tipCornerBL: 'Bottom-Left',
  tipCornerBR: 'Bottom-Right',
  tipCopy: 'Copy',
  tipCopied: 'Copied',
  tipNoDesc: 'No description entered',
  tipDescDisabled: 'Description is disabled for this shape',
  tipLinkDisabled: 'Reference Link is disabled for this shape',
  tipHexColor: 'Hex color',
  tipClose: 'Close',
  tipSettings: 'Settings',
  tipRefreshFrames: 'Refresh frames from canvas',
  tipSolid: 'Solid',
  tipDashed: 'Dashed',
  tipDotted: 'Dotted',
  tipStartTerminal: 'Start terminal',
  tipEndTerminal: 'End terminal',
  tipTermNone: 'None',
  tipTermArrow: 'Arrow',
  tipTermCircle: 'Circle',
  tipTermDiamond: 'Diamond',
  tipTermTriangle: 'Triangle',
  tipRouteOrtho: 'Orthogonal',
  tipRouteSCurve: 'Round',
  tipRouteCurve: 'Curve',
  tipRouteStraight: 'Straight',
  tipGizmoSource: 'Source',
  tipGizmoTarget: 'Target',
  tipMixed: 'Mixed',
  tipActive: 'Active',
  tipAddSize: 'Add size',
  tipAddSizeDisabled: 'Add size is disabled for this shape',
  tipSizeMore: 'More options',
  tipSizeMoreDisabled: 'Size options are disabled for this shape',
  tipDefaultPresetLocked: 'Default presets cannot be edited or deleted',
  tipSizeMode: 'Select height mode',
  tipSizeModeDisabled: 'Size mode cannot be changed for this shape',
  sizeModeFixed: 'Fixed height',
  sizeModeHug: 'Hug contents',
  sizeModeFit: 'Fit contents',
  tipPresetDims: '{w}×{h}',
  tipPresetDisabledShape: 'Size presets are disabled for this shape',
  tipConnectorColor: 'Connector color',
  tipQuotaBlocked: 'Free limit reached. Upgrade to create more.',

  // 14. Shape Notices
noticeSizeOnlyScreen: 'Size is only available for Screen nodes.',
noticeDescUnsupported: 'Description is not available for this shape.',
noticeElevationUnsupported: 'Elevation is not available for this shape.',
noticeStatusUnsupported: 'Status is not available for this shape.',
noticeStepUnsupported: 'Step Badges are not available for this shape.',
noticeLinkUnsupported: 'Reference Link is not available for this shape.',
noticeMixed: 'Not available for mixed selection.',
  // 15. Connect Status Text
connectStatusSelectNodes: 'Select 2+ nodes to connect.',
connectStatusReadyTwoNodes: '2 nodes ready to connect.',
connectStatusReadyMultiNodes: '{count} nodes ready to connect.',
connectStatusReady: 'Ready to connect.',
connectStatusChangesReady: 'Changes ready to apply.',
connectStatusConnected: 'Connected.',
connectStatusNoChanges: 'No changes.',
  // 16. Action Buttons & Tooltips
stepDescStartsFromNumber: 'Starts from the specified number.',
stepTipEnterStartNumber: 'Enter a start number.',
stepTipAddStepBadges: 'Add Step Badges.',
connectTipNoChanges: 'No changes to update.',
connectTipApplyChanges: 'Apply connector changes.',
connectTipConnectNodes: 'Connect selected nodes.',
};

// ============================================================================
// JA — 日本語 (Japanese)
// ============================================================================
const JA: Catalog = {
  limitReached: 'Flooowの要素数が上限に達しました（{current}/{limit}）。既存の要素を削除してから、もう一度お試しください。',
nodeCreated: 'ノード「{title}」を作成しました。',
  nodeCreateFailed: 'ノードの作成に失敗しました: {error}',
  nodeNotFoundSelect: '編集するノードが見つかりません。キャンバス上でノードを選択してください。',
nodeUpdated: 'ノード「{title}」を更新しました。',
  nodeUpdateFailed: 'ノードの更新に失敗しました: {error}',
  nodesBatchUpdated: '{count}個のノードを更新しました',
  nodesBatchUpdateFailed: 'ノードの一括更新に失敗しました: {error}',
  nodeGone: 'ノードが見つかりません。',
  connectNodesNotFound: '接続するノードが見つかりません。',
  connectNeedTwoDifferent: '接続する2つの異なるノードを選択してください。',
connectDone: '接続しました。',
connectDoneLabel: 'ラベル「{label}」で接続しました。',
  connectCreateFailed: 'コネクターの作成に失敗しました: {error}',
  connectNeedTwoOrMore: '接続するノードを2つ以上選択してください。',
  connectNeedTwoDifferentOrMore: '異なるノードを2つ以上選択してください。',
  connectNeedTwo: '接続するノードを2つ以上選択してください。',
autoConnectDone: '直角接続が完了しました。',
autoConnectDoneLabel: 'ラベル「{label}」付きの直角接続が完了しました。',
  autoChainDone: '⚡ {nodes}個のノードを順番に接続しました（{conns}本のコネクター）。',
  autoConnectFailed: '自動接続に失敗しました: {error}',
  chainExistsAll: 'すべての接続はすでに存在します。',
chainCreatedPartial: '{created}件の接続を作成しました（{skipped}件は接続済み）。',
chainCreated: '{created}件の接続を作成しました。',
  chainFailed: 'チェーン接続に失敗しました: {error}',
  connectorSelectForLabel: '編集するコネクターをキャンバス上で選択してください。',
  connectorLabelSet: '中央ラベルを「{label}」に設定しました',
  connectorLabelCleared: '中央ラベルを削除しました。',
  connectorLabelFailed: 'ラインテキストの更新に失敗しました: {error}',
  connectorNotFound: '編集するコネクターが見つかりません。',
  connectorOffsetConverted: 'オフセットを適用するため、カスタム直角コネクターに変換しました。',
  connectorUpdateFailed: 'コネクターの更新に失敗しました: {error}',
  connectorSelectForLineType: '変更するコネクターをキャンバス上で選択してください。',
connectorLineElbowed: '📐 コネクターを直角に変更しました。',
connectorLineStraight: '📏 コネクターを直線に変更しました。',
  connectorLineTypeFailed: 'コネクターの線種変更に失敗しました: {error}',
  connectorsNoneToConvert: '変換するコネクターがキャンバス上にありません。',
connectorsConvertedAll: '⚡ {count}個のコネクターをすべて直角に変換しました。',
connectorsAlreadyElbowed: '{count}個のコネクターはすでにすべて直角です。',
  connectorsConvertFailed: 'コネクターの一括変換に失敗しました: {error}',
  statusNeedSelection: 'ステータスを設定する要素を1つ以上選択してください。',
  statusRemoved: '{count}個のノードからステータスバッジを削除しました。',
statusAttached: '{count}個のノードにステータスバッジ「{label}」を追加しました。',
  elevationNeedSelection: 'Elevationを適用する要素を選択してください。',
  elevationRemoved: '{count}個のノードからElevationを削除しました。',
  elevationApplied: '{count}個のノードにLevel {level}のElevationを適用しました。',
  stepNeedSelection: '番号を付ける要素をキャンバス上で選択してください。',
  stepApplied: '{count}個のノードにステップ番号を適用しました。',
  stepRemoveNeedSelection: 'ステップ番号を削除する要素をキャンバス上で選択してください。',
  stepRemoved: '{count}個のノードからステップ番号を削除しました。',
  stepNoneExist: '選択したノードにはステップ番号がありません。',
  settingsSaved: 'Figma連携設定を保存しました。',
  variablesUnsupported: 'このFigmaバージョンではVariables APIをサポートしていません。',
  variablesNoneLocal: '開いているファイルにローカルVariablesがありません。UI3 Kitファイルのタブから実行してください。',
  tokensExtracted: '🎨 {count}個のUI3デザイントークンを抽出しました。',
  tokensFailed: 'UI3変数の抽出に失敗しました: {error}',
  undoHint: 'キャンバスでCmd+Z（Mac）またはCtrl+Z（Windows）を押すと元に戻せます。',
  redoHint: 'キャンバスでCmd+Shift+Z（Mac）またはCtrl+Y（Windows）を押すとやり直せます。',
  undoCancelled: '変更を破棄しました。',
  undone: '元に戻しました。',
  titleMax32: 'タイトルは最大32文字まで入力できます。',
  max999: '最大値は999です。',
  sizeMinW: '最小幅は{px}pxです。',
  sizeMaxW: '最大幅は{px}pxです。',
  sizeMinH: '最小高さは{px}pxです。',
  sizeMaxH: '最大高さは{px}pxです。',
  sizeMaxCorner: '最大値は{px}です。',
  sizePresetAdded: 'サイズプリセット「{name}」を追加しました。',
  sizeUpdated: 'サイズを更新しました。',
  sizePresetDeleted: 'プリセット「{name}」を削除しました。',
  sizePresetDeleted2: 'サイズプリセットを削除しました。',
  presetDeleteNoDefault: 'デフォルトプリセットは削除できません。',
  styleAddedNew: '新しいスタイルを追加しました。',
  styleUpdated: 'スタイルを更新しました。',
  styleDefaultNoDelete: 'デフォルトスタイルは削除できません。',
  styleDeleted: 'スタイルを削除しました。',
  styleEditNoDefault: 'デフォルトスタイルは編集できません。',
  styleCustomLimitReached: 'カスタムスタイルは最大7つまで追加できます。',
  exportCopied: 'AI用にフローをコピーしました。',
  exportEmpty: 'このページにエクスポートするフローがありません。',
  exportFailed: 'エクスポートに失敗しました。',
  descCopyEmpty: 'コピーする説明がありません。',
  descCopied: '説明をクリップボードにコピーしました！',
  tipWidth: '幅',
  tipHeight: '高さ',
  tipCornerRadius: '角丸',
  tipStrokeWidth: '線の太さ',
  tipStartOffset: '開始オフセット',
  tipEndOffset: '終了オフセット',
  tipLabelText: 'ラベルテキスト',
  tipLabelPlaceholder: 'ラベルを追加',
  tipClearLabel: 'ラベルをクリア',
  tipLabelFill: 'ラベルの塗り',
  tipLabelStroke: 'ラベルの線',
  tipAlignLeft: '左揃え',
  tipAlignCenter: '中央揃え',
  tipAlignRight: '右揃え',
  tipAddStyle: 'スタイルを追加',
  tipStyleMore: 'その他のオプション',
  tipStyleMoreLocked: 'デフォルトスタイルは編集または削除できません',
  tipFillColor: '塗りの色',
  tipStrokeColor: '線の色',
  tipStrokeWeight: '線の太さ',
  tipStepNumber: 'バッジ番号',
  tipStepStartNumber: '開始バッジ番号',
  tipCornerTL: '左上',
  tipCornerTR: '右上',
  tipCornerBL: '左下',
  tipCornerBR: '右下',
  tipCopy: 'コピー',
  tipCopied: 'コピーしました',
  tipNoDesc: '説明が入力されていません',
  tipDescDisabled: 'この図形ではDescriptionを使用できません',
  tipLinkDisabled: 'この図形ではReference Linkを使用できません',
  tipHexColor: 'Hexカラー',
  tipClose: '閉じる',
  tipSettings: '設定',
  tipRefreshFrames: 'キャンバスからフレームを更新',
  tipSolid: '実線',
  tipDashed: '破線',
  tipDotted: '点線',
  tipStartTerminal: '始点端子',
  tipEndTerminal: '終点端子',
  tipTermNone: 'なし',
  tipTermArrow: '矢印',
  tipTermCircle: '円',
  tipTermDiamond: 'ひし形',
  tipTermTriangle: '三角',
  tipRouteOrtho: '直角',
  tipRouteSCurve: 'ラウンド',
  tipRouteCurve: 'カーブ',
  tipRouteStraight: '直線',
  tipGizmoSource: '始点',
  tipGizmoTarget: '終点',
  tipMixed: '混在',
  tipActive: '有効',
  tipAddSize: 'サイズを追加',
  tipAddSizeDisabled: 'この図形ではサイズを追加できません',
  tipSizeMore: 'その他のオプション',
  tipSizeMoreDisabled: 'この図形ではSizeオプションを使用できません',
  tipDefaultPresetLocked: 'デフォルトプリセットは編集または削除できません',
  tipSizeMode: '高さモードを選択',
  tipSizeModeDisabled: 'この図形ではSizeモードを変更できません',
  sizeModeFixed: '高さ固定',
  sizeModeHug: 'コンテンツに合わせる',
  sizeModeFit: 'コンテンツにフィット',
  tipPresetDims: '{w}×{h}',
  tipPresetDisabledShape: 'この図形ではSizeプリセットを使用できません',
  tipConnectorColor: 'コネクターの色',
  tipQuotaBlocked: '無料プランの上限に達しました。アップグレードするとさらに作成できます。',
noticeSizeOnlyScreen: 'SizeはScreenノードでのみ使用できます。',
noticeDescUnsupported: 'この図形ではDescriptionを使用できません。',
noticeElevationUnsupported: 'この図形ではElevationを使用できません。',
noticeStatusUnsupported: 'この図形ではStatusを使用できません。',
noticeStepUnsupported: 'この図形ではStep Badgesを使用できません。',
noticeLinkUnsupported: 'この図形ではReference Linkを使用できません。',
noticeMixed: '混在した選択では使用できません。',
connectStatusSelectNodes: '接続するノードを2つ以上選択。',
connectStatusReadyTwoNodes: '2個のノードを接続する準備ができました。',
connectStatusReadyMultiNodes: '{count}個のノードを接続する準備ができました。',
connectStatusReady: '接続する準備ができました。',
connectStatusChangesReady: '適用する変更があります。',
connectStatusConnected: '接続済み。',
connectStatusNoChanges: '変更なし。',
stepDescStartsFromNumber: '指定した番号から開始。',
stepTipEnterStartNumber: '開始番号を入力。',
stepTipAddStepBadges: 'ステップバッジを追加。',
connectTipNoChanges: '適用する変更はありません。',
connectTipApplyChanges: 'コネクターの変更を適用。',
connectTipConnectNodes: '選択したノードを接続。',
};

// ============================================================================
// ZH_CN — 简体中文 (Simplified Chinese)
// ============================================================================
const ZH_CN: Catalog = {
  limitReached: 'Flooow 元素数量已达上限（{current}/{limit}）。请删除现有元素后重试。',
nodeCreated: '已创建节点“{title}”。',
  nodeCreateFailed: '创建节点失败：{error}',
  nodeNotFoundSelect: '找不到要编辑的节点。请在画布中选择一个节点。',
nodeUpdated: '已更新节点“{title}”。',
  nodeUpdateFailed: '更新节点失败：{error}',
  nodesBatchUpdated: '已更新 {count} 个节点',
  nodesBatchUpdateFailed: '批量更新节点失败：{error}',
  nodeGone: '找不到该节点。',
  connectNodesNotFound: '找不到要连接的节点。',
  connectNeedTwoDifferent: '请选择两个不同的节点进行连接。',
connectDone: '连接完成。',
connectDoneLabel: '已使用标签“{label}”完成连接。',
  connectCreateFailed: '创建连接器失败：{error}',
  connectNeedTwoOrMore: '请选择至少 2 个节点进行连接。',
  connectNeedTwoDifferentOrMore: '请选择至少 2 个不同的节点。',
  connectNeedTwo: '请选择至少 2 个节点进行连接。',
autoConnectDone: '直角连接完成。',
autoConnectDoneLabel: '已使用标签“{label}”完成直角连接。',
  autoChainDone: '⚡ 已按顺序连接 {nodes} 个节点（{conns} 个连接器）。',
  autoConnectFailed: '自动连接失败：{error}',
  chainExistsAll: '所有连接均已存在。',
chainCreatedPartial: '已创建 {created} 个连接（{skipped} 个已存在）。',
chainCreated: '已创建 {created} 个连接。',
  chainFailed: '链式连接失败：{error}',
  connectorSelectForLabel: '请在画布中选择要编辑的连接器。',
  connectorLabelSet: '中心标签已设置为“{label}”',
  connectorLabelCleared: '中心标签已清除。',
  connectorLabelFailed: '更新线条文本失败：{error}',
  connectorNotFound: '找不到要编辑的连接器。',
  connectorOffsetConverted: '已转换为自定义直角连接器，以应用偏移。',
  connectorUpdateFailed: '更新连接器失败：{error}',
  connectorSelectForLineType: '请在画布中选择要修改的连接器。',
connectorLineElbowed: '📐 连接器已改为直角。',
connectorLineStraight: '📏 连接器已改为直线。',
  connectorLineTypeFailed: '更改连接器线型失败：{error}',
  connectorsNoneToConvert: '画布中没有可转换的连接器。',
connectorsConvertedAll: '⚡ 已将 {count} 个连接器全部转换为直角。',
connectorsAlreadyElbowed: '{count} 个连接器已全部为直角。',
  connectorsConvertFailed: '批量转换连接器失败：{error}',
  statusNeedSelection: '请选择至少 1 个元素以设置状态。',
  statusRemoved: '已从 {count} 个节点中移除状态徽章。',
statusAttached: '已为 {count} 个节点添加状态徽章“{label}”。',
  elevationNeedSelection: '请选择要应用 Elevation 的元素。',
  elevationRemoved: '已从 {count} 个节点中移除 Elevation。',
  elevationApplied: '已为 {count} 个节点应用 Level {level} Elevation。',
  stepNeedSelection: '请在画布中选择要编号的元素。',
  stepApplied: '已为 {count} 个节点添加步骤编号。',
  stepRemoveNeedSelection: '请在画布中选择要移除步骤编号的元素。',
  stepRemoved: '已从 {count} 个节点中移除步骤编号。',
  stepNoneExist: '所选节点没有步骤编号。',
  settingsSaved: 'Figma 集成设置已保存。',
  variablesUnsupported: '当前 Figma 版本不支持 Variables API。',
  variablesNoneLocal: '当前文件中没有本地 Variables。请从 UI3 Kit 文件标签页运行。',
  tokensExtracted: '🎨 已提取 {count} 个 UI3 设计令牌。',
  tokensFailed: '提取 UI3 变量失败：{error}',
  undoHint: '在画布中使用 Cmd+Z（Mac）或 Ctrl+Z（Windows）撤销操作。',
  redoHint: '在画布中使用 Cmd+Shift+Z（Mac）或 Ctrl+Y（Windows）重做操作。',
  undoCancelled: '已放弃更改。',
  undone: '已撤销。',
  titleMax32: '标题最多可输入 32 个字符。',
  max999: '最大值为 999。',
  sizeMinW: '最小宽度为 {px}px。',
  sizeMaxW: '最大宽度为 {px}px。',
  sizeMinH: '最小高度为 {px}px。',
  sizeMaxH: '最大高度为 {px}px。',
  sizeMaxCorner: '最大值为 {px}。',
  sizePresetAdded: '已添加尺寸预设“{name}”。',
  sizeUpdated: '尺寸已更新。',
  sizePresetDeleted: '已删除预设“{name}”。',
  sizePresetDeleted2: '尺寸预设已删除。',
  presetDeleteNoDefault: '默认预设无法删除。',
  styleAddedNew: '已添加新样式。',
  styleUpdated: '样式已更新。',
  styleDefaultNoDelete: '默认样式无法删除。',
  styleDeleted: '样式已删除。',
  styleEditNoDefault: '默认样式无法编辑。',
  styleCustomLimitReached: '最多可添加 7 个自定义样式。',
  exportCopied: '已复制 AI 用流程。',
  exportEmpty: '此页面没有可导出的流程。',
  exportFailed: '导出失败。',
  descCopyEmpty: '没有可复制的描述。',
  descCopied: '描述已复制到剪贴板！',
  tipWidth: '宽度',
  tipHeight: '高度',
  tipCornerRadius: '圆角',
  tipStrokeWidth: '描边宽度',
  tipStartOffset: '起点偏移',
  tipEndOffset: '终点偏移',
  tipLabelText: '标签文本',
  tipLabelPlaceholder: '添加标签',
  tipClearLabel: '清除标签',
  tipLabelFill: '标签填充颜色',
  tipLabelStroke: '标签描边颜色',
  tipAlignLeft: '左对齐',
  tipAlignCenter: '居中对齐',
  tipAlignRight: '右对齐',
  tipAddStyle: '添加样式',
  tipStyleMore: '更多选项',
  tipStyleMoreLocked: '默认样式无法编辑或删除',
  tipFillColor: '填充颜色',
  tipStrokeColor: '描边颜色',
  tipStrokeWeight: '描边粗细',
  tipStepNumber: '徽章编号',
  tipStepStartNumber: '起始徽章编号',
  tipCornerTL: '左上',
  tipCornerTR: '右上',
  tipCornerBL: '左下',
  tipCornerBR: '右下',
  tipCopy: '复制',
  tipCopied: '已复制',
  tipNoDesc: '未输入描述',
  tipDescDisabled: '此图形不支持 Description',
  tipLinkDisabled: '此图形不支持 Reference Link',
  tipHexColor: 'Hex 颜色',
  tipClose: '关闭',
  tipSettings: '设置',
  tipRefreshFrames: '从画布刷新画框',
  tipSolid: '实线',
  tipDashed: '虚线',
  tipDotted: '点线',
  tipStartTerminal: '起点端点',
  tipEndTerminal: '终点端点',
  tipTermNone: '无',
  tipTermArrow: '箭头',
  tipTermCircle: '圆形',
  tipTermDiamond: '菱形',
  tipTermTriangle: '三角形',
  tipRouteOrtho: '直角',
  tipRouteSCurve: '圆角',
  tipRouteCurve: '曲线',
  tipRouteStraight: '直线',
  tipGizmoSource: '起点',
  tipGizmoTarget: '终点',
  tipMixed: '混合',
  tipActive: '启用',
  tipAddSize: '添加尺寸',
  tipAddSizeDisabled: '此图形无法添加尺寸',
  tipSizeMore: '更多选项',
  tipSizeMoreDisabled: '此图形不支持 Size 选项',
  tipDefaultPresetLocked: '默认预设无法编辑或删除',
  tipSizeMode: '选择高度模式',
  tipSizeModeDisabled: '此图形无法更改 Size 模式',
  sizeModeFixed: '固定高度',
  sizeModeHug: '适应内容',
  sizeModeFit: '填充内容',
  tipPresetDims: '{w}×{h}',
  tipPresetDisabledShape: '此图形不支持 Size 预设',
  tipConnectorColor: '连接器颜色',
  tipQuotaBlocked: '已达到免费版上限。升级后可创建更多元素。',
noticeSizeOnlyScreen: 'Size 仅适用于 Screen 节点。',
noticeDescUnsupported: '此图形不支持 Description。',
noticeElevationUnsupported: '此图形不支持 Elevation。',
noticeStatusUnsupported: '此图形不支持 Status。',
noticeStepUnsupported: '此图形不支持 Step Badges。',
noticeLinkUnsupported: '此图形不支持 Reference Link。',
noticeMixed: '混合选择不可用。',
connectStatusSelectNodes: '选择至少 2 个节点以进行连接。',
connectStatusReadyTwoNodes: '2 个节点已准备连接。',
connectStatusReadyMultiNodes: '{count} 个节点已准备连接。',
connectStatusReady: '准备连接。',
connectStatusChangesReady: '更改已准备应用。',
connectStatusConnected: '已连接。',
connectStatusNoChanges: '无更改。',
stepDescStartsFromNumber: '从指定编号开始。',
stepTipEnterStartNumber: '输入起始编号。',
stepTipAddStepBadges: '添加步骤徽章。',
connectTipNoChanges: '没有可应用的更改。',
connectTipApplyChanges: '应用连接器更改。',
connectTipConnectNodes: '连接所选节点。',
};

// ============================================================================
// ZH_TW — 繁體中文 (Traditional Chinese)
// ============================================================================
const ZH_TW: Catalog = {
  limitReached: 'Flooow 元素數量已達上限（{current}/{limit}）。請刪除現有元素後再試一次。',
nodeCreated: '已建立節點「{title}」。',
  nodeCreateFailed: '建立節點失敗：{error}',
  nodeNotFoundSelect: '找不到要編輯的節點。請在畫布上選取節點。',
nodeUpdated: '已更新節點「{title}」。',
  nodeUpdateFailed: '更新節點失敗：{error}',
  nodesBatchUpdated: '已更新 {count} 個節點',
  nodesBatchUpdateFailed: '批次更新節點失敗：{error}',
  nodeGone: '找不到該節點。',
  connectNodesNotFound: '找不到要連接的節點。',
  connectNeedTwoDifferent: '請選取兩個不同的節點進行連接。',
connectDone: '連接完成。',
connectDoneLabel: '已使用標籤「{label}」完成連接。',
  connectCreateFailed: '建立連接器失敗：{error}',
  connectNeedTwoOrMore: '請選取至少 2 個節點進行連接。',
  connectNeedTwoDifferentOrMore: '請選取至少 2 個不同的節點。',
  connectNeedTwo: '請選取至少 2 個節點進行連接。',
autoConnectDone: '直角連接完成。',
autoConnectDoneLabel: '已使用標籤「{label}」完成直角連接。',
  autoChainDone: '⚡ 已依序連接 {nodes} 個節點（{conns} 個連接器）。',
  autoConnectFailed: '自動連接失敗：{error}',
  chainExistsAll: '所有連接皆已存在。',
chainCreatedPartial: '已建立 {created} 個連接（{skipped} 個已連接）。',
chainCreated: '已建立 {created} 個連接。',
  chainFailed: '鏈式連接失敗：{error}',
  connectorSelectForLabel: '請在畫布上選取要編輯的連接器。',
  connectorLabelSet: '中央標籤已設為「{label}」',
  connectorLabelCleared: '中央標籤已清除。',
  connectorLabelFailed: '更新線條文字失敗：{error}',
  connectorNotFound: '找不到要編輯的連接器。',
  connectorOffsetConverted: '已轉換為自訂直角連接器，以套用偏移。',
  connectorUpdateFailed: '更新連接器失敗：{error}',
  connectorSelectForLineType: '請在畫布上選取要變更的連接器。',
connectorLineElbowed: '📐 連接器已變更為直角。',
connectorLineStraight: '📏 連接器已變更為直線。',
  connectorLineTypeFailed: '變更連接器線條類型失敗：{error}',
  connectorsNoneToConvert: '畫布上沒有可轉換的連接器。',
connectorsConvertedAll: '⚡ 已將 {count} 個連接器全部轉換為直角。',
connectorsAlreadyElbowed: '{count} 個連接器已全部為直角。',
  connectorsConvertFailed: '批次轉換連接器失敗：{error}',
  statusNeedSelection: '請選取至少 1 個元素以設定狀態。',
  statusRemoved: '已從 {count} 個節點移除狀態徽章。',
statusAttached: '已為 {count} 個節點新增狀態徽章「{label}」。',
  elevationNeedSelection: '請選取要套用 Elevation 的元素。',
  elevationRemoved: '已從 {count} 個節點移除 Elevation。',
  elevationApplied: '已為 {count} 個節點套用 Level {level} Elevation。',
  stepNeedSelection: '請在畫布上選取要編號的元素。',
  stepApplied: '已為 {count} 個節點套用步驟編號。',
  stepRemoveNeedSelection: '請在畫布上選取要移除步驟編號的元素。',
  stepRemoved: '已從 {count} 個節點移除步驟編號。',
  stepNoneExist: '選取的節點沒有步驟編號。',
  settingsSaved: 'Figma 整合設定已儲存。',
  variablesUnsupported: '目前的 Figma 版本不支援 Variables API。',
  variablesNoneLocal: '目前檔案沒有本機 Variables。請從 UI3 Kit 檔案分頁執行。',
  tokensExtracted: '🎨 已擷取 {count} 個 UI3 設計 Token。',
  tokensFailed: '擷取 UI3 變數失敗：{error}',
  undoHint: '在畫布上使用 Cmd+Z（Mac）或 Ctrl+Z（Windows）復原操作。',
  redoHint: '在畫布上使用 Cmd+Shift+Z（Mac）或 Ctrl+Y（Windows）重做操作。',
  undoCancelled: '已捨棄變更。',
  undone: '已復原。',
  titleMax32: '標題最多可輸入 32 個字元。',
  max999: '最大值為 999。',
  sizeMinW: '最小寬度為 {px}px。',
  sizeMaxW: '最大寬度為 {px}px。',
  sizeMinH: '最小高度為 {px}px。',
  sizeMaxH: '最大高度為 {px}px。',
  sizeMaxCorner: '最大值為 {px}。',
  sizePresetAdded: '已新增尺寸預設「{name}」。',
  sizeUpdated: '尺寸已更新。',
  sizePresetDeleted: '已刪除預設「{name}」。',
  sizePresetDeleted2: '尺寸預設已刪除。',
  presetDeleteNoDefault: '預設項目無法刪除。',
  styleAddedNew: '已新增樣式。',
  styleUpdated: '樣式已更新。',
  styleDefaultNoDelete: '預設樣式無法刪除。',
  styleDeleted: '樣式已刪除。',
  styleEditNoDefault: '預設樣式無法編輯。',
  styleCustomLimitReached: '最多可新增 7 個自訂樣式。',
  exportCopied: '已複製 AI 用流程。',
  exportEmpty: '此頁面沒有可匯出的流程。',
  exportFailed: '匯出失敗。',
  descCopyEmpty: '沒有可複製的說明。',
  descCopied: '說明已複製到剪貼簿！',
  tipWidth: '寬度',
  tipHeight: '高度',
  tipCornerRadius: '圓角',
  tipStrokeWidth: '筆畫寬度',
  tipStartOffset: '起點偏移',
  tipEndOffset: '終點偏移',
  tipLabelText: '標籤文字',
  tipLabelPlaceholder: '新增標籤',
  tipClearLabel: '清除標籤',
  tipLabelFill: '標籤填色',
  tipLabelStroke: '標籤筆畫顏色',
  tipAlignLeft: '靠左對齊',
  tipAlignCenter: '置中對齊',
  tipAlignRight: '靠右對齊',
  tipAddStyle: '新增樣式',
  tipStyleMore: '更多選項',
  tipStyleMoreLocked: '預設樣式無法編輯或刪除',
  tipFillColor: '填色',
  tipStrokeColor: '筆畫顏色',
  tipStrokeWeight: '筆畫粗細',
  tipStepNumber: '徽章編號',
  tipStepStartNumber: '起始徽章編號',
  tipCornerTL: '左上',
  tipCornerTR: '右上',
  tipCornerBL: '左下',
  tipCornerBR: '右下',
  tipCopy: '複製',
  tipCopied: '已複製',
  tipNoDesc: '尚未輸入說明',
  tipDescDisabled: '此圖形不支援 Description',
  tipLinkDisabled: '此圖形不支援 Reference Link',
  tipHexColor: 'Hex 顏色',
  tipClose: '關閉',
  tipSettings: '設定',
  tipRefreshFrames: '從畫布重新整理框架',
  tipSolid: '實線',
  tipDashed: '虛線',
  tipDotted: '點線',
  tipStartTerminal: '起點端點',
  tipEndTerminal: '終點端點',
  tipTermNone: '無',
  tipTermArrow: '箭頭',
  tipTermCircle: '圓形',
  tipTermDiamond: '菱形',
  tipTermTriangle: '三角形',
  tipRouteOrtho: '直角',
  tipRouteSCurve: '圓角',
  tipRouteCurve: '曲線',
  tipRouteStraight: '直線',
  tipGizmoSource: '起點',
  tipGizmoTarget: '終點',
  tipMixed: '混合',
  tipActive: '啟用',
  tipAddSize: '新增尺寸',
  tipAddSizeDisabled: '此圖形無法新增尺寸',
  tipSizeMore: '更多選項',
  tipSizeMoreDisabled: '此圖形不支援 Size 選項',
  tipDefaultPresetLocked: '預設項目無法編輯或刪除',
  tipSizeMode: '選擇高度模式',
  tipSizeModeDisabled: '此圖形無法變更 Size 模式',
  sizeModeFixed: '固定高度',
  sizeModeHug: '符合內容',
  sizeModeFit: '填滿內容',
  tipPresetDims: '{w}×{h}',
  tipPresetDisabledShape: '此圖形不支援 Size 預設',
  tipConnectorColor: '連接器顏色',
  tipQuotaBlocked: '已達免費版上限。升級後可建立更多元素。',
noticeSizeOnlyScreen: 'Size 僅適用於 Screen 節點。',
noticeDescUnsupported: '此圖形不支援 Description。',
noticeElevationUnsupported: '此圖形不支援 Elevation。',
noticeStatusUnsupported: '此圖形不支援 Status。',
noticeStepUnsupported: '此圖形不支援 Step Badges。',
noticeLinkUnsupported: '此圖形不支援 Reference Link。',
noticeMixed: '混合選取不可用。',
connectStatusSelectNodes: '選取至少 2 個節點以進行連接。',
connectStatusReadyTwoNodes: '2 個節點已準備連接。',
connectStatusReadyMultiNodes: '{count} 個節點已準備連接。',
connectStatusReady: '準備連接。',
connectStatusChangesReady: '變更已準備套用。',
connectStatusConnected: '已連接。',
connectStatusNoChanges: '無變更。',
stepDescStartsFromNumber: '從指定編號開始。',
stepTipEnterStartNumber: '輸入起始編號。',
stepTipAddStepBadges: '新增步驟徽章。',
connectTipNoChanges: '沒有可套用的變更。',
connectTipApplyChanges: '套用連接器變更。',
connectTipConnectNodes: '連接所選節點。',
};

// ============================================================================
// ES — Español
// ============================================================================
const ES: Catalog = {
  // 1. Quota & Entitlement
  limitReached: 'Se ha alcanzado el límite de elementos de Flooow ({current}/{limit}). Elimina elementos existentes y vuelve a intentarlo.',

  // 2. Node CRUD
nodeCreated: 'Nodo "{title}" creado.',
  nodeCreateFailed: 'No se pudo crear el nodo: {error}',
  nodeNotFoundSelect: 'No se encontró el nodo que quieres editar. Selecciona un nodo en el lienzo.',
nodeUpdated: 'Nodo "{title}" actualizado.',
  nodeUpdateFailed: 'No se pudo actualizar el nodo: {error}',
  nodesBatchUpdated: '{count} nodos actualizados',
  nodesBatchUpdateFailed: 'No se pudieron actualizar los nodos: {error}',
  nodeGone: 'No se encontró el nodo.',

  // 3. Connect & Chain
  connectNodesNotFound: 'No se encontraron los nodos que quieres conectar.',
  connectNeedTwoDifferent: 'Selecciona dos nodos diferentes para conectarlos.',
connectDone: 'Conectado.',
connectDoneLabel: 'Conectado con la etiqueta "{label}".',
  connectCreateFailed: 'No se pudo crear la conexión: {error}',
  connectNeedTwoOrMore: 'Selecciona al menos 2 nodos para conectarlos.',
  connectNeedTwoDifferentOrMore: 'Selecciona al menos 2 nodos diferentes.',
  connectNeedTwo: 'Selecciona al menos 2 nodos para conectarlos.',
autoConnectDone: 'Conexión ortogonal completada.',
autoConnectDoneLabel: 'Conexión ortogonal completada con la etiqueta "{label}".',
  autoChainDone: '⚡ {nodes} nodos conectados en secuencia ({conns} conexiones).',
  autoConnectFailed: 'No se pudo realizar la conexión automática: {error}',
  chainExistsAll: 'Todas las conexiones ya existen.',
chainCreatedPartial: '{created} conexiones creadas ({skipped} ya existían).',
chainCreated: '{created} conexiones creadas.',
  chainFailed: 'No se pudo crear la cadena: {error}',

  // 4. Connector Editing
  connectorSelectForLabel: 'Selecciona una conexión en el lienzo para editarla.',
  connectorLabelSet: 'Etiqueta central establecida como "{label}"',
  connectorLabelCleared: 'Etiqueta central eliminada.',
  connectorLabelFailed: 'No se pudo actualizar el texto de la conexión: {error}',
  connectorNotFound: 'No se encontró la conexión que quieres editar.',
  connectorOffsetConverted: 'Convertida automáticamente en una conexión ortogonal personalizada para aplicar los desplazamientos.',
  connectorUpdateFailed: 'No se pudo actualizar la conexión: {error}',
  connectorSelectForLineType: 'Selecciona una conexión en el lienzo para cambiarla.',
connectorLineElbowed: '📐 Conexión cambiada a ortogonal.',
connectorLineStraight: '📏 Conexión cambiada a recta.',
  connectorLineTypeFailed: 'No se pudo cambiar el tipo de línea: {error}',
  connectorsNoneToConvert: 'No hay conexiones en el lienzo para convertir.',
connectorsConvertedAll: '⚡ {count} conexiones convertidas a ortogonales.',
connectorsAlreadyElbowed: '{count} conexiones ya son ortogonales.',
  connectorsConvertFailed: 'No se pudieron convertir las conexiones: {error}',

  // 5. Status Badge
  statusNeedSelection: 'Selecciona al menos 1 elemento para establecer el estado.',
  statusRemoved: 'Insignias de estado eliminadas de {count} nodos.',
statusAttached: 'Insignia de estado "{label}" añadida a {count} nodos.',
  // 6. Elevation
  elevationNeedSelection: 'Selecciona elementos para aplicar Elevation.',
  elevationRemoved: 'Elevation eliminada de {count} nodos.',
  elevationApplied: 'Elevation de nivel {level} aplicada a {count} nodos.',

  // 7. Step Badges
  stepNeedSelection: 'Selecciona elementos en el lienzo para numerarlos.',
  stepApplied: 'Números de paso aplicados a {count} nodos.',
  stepRemoveNeedSelection: 'Selecciona elementos en el lienzo para eliminar los números de paso.',
  stepRemoved: 'Números de paso eliminados de {count} nodos.',
  stepNoneExist: 'Los nodos seleccionados no tienen números de paso.',

  // 8. Settings & Tokens
  settingsSaved: 'Configuración de integración con Figma guardada.',
  variablesUnsupported: 'Esta versión de Figma no admite la API de Variables.',
  variablesNoneLocal: 'No hay Variables locales en el archivo abierto. Ejecútalo desde la pestaña del archivo UI3 Kit.',
  tokensExtracted: '🎨 Se han extraído {count} tokens de diseño de UI3.',
  tokensFailed: 'No se pudieron extraer las Variables de UI3: {error}',

  // 9. Undo / Redo
  undoHint: 'Deshaz los cambios con Cmd+Z (Mac) o Ctrl+Z (Windows) en el lienzo.',
  redoHint: 'Rehaz los cambios con Cmd+Shift+Z (Mac) o Ctrl+Y (Windows) en el lienzo.',
  undoCancelled: 'Cambios descartados.',
  undone: 'Deshecho.',

  // 10. Validation
  titleMax32: 'Los títulos pueden tener hasta 32 caracteres.',
  max999: 'El valor máximo es 999.',
  sizeMinW: 'El ancho mínimo es {px}px.',
  sizeMaxW: 'El ancho máximo es {px}px.',
  sizeMinH: 'La altura mínima es {px}px.',
  sizeMaxH: 'La altura máxima es {px}px.',
  sizeMaxCorner: 'El valor máximo es {px}.',

  // 11. Presets & Styles
  sizePresetAdded: 'Preajuste de tamaño "{name}" añadido.',
  sizeUpdated: 'Tamaño actualizado.',
  sizePresetDeleted: 'Preajuste "{name}" eliminado.',
  sizePresetDeleted2: 'Preajuste de tamaño eliminado.',
  presetDeleteNoDefault: 'Los preajustes predeterminados no se pueden eliminar.',
  styleAddedNew: 'Nuevo estilo añadido.',
  styleUpdated: 'Estilo actualizado.',
  styleDefaultNoDelete: 'Los estilos predeterminados no se pueden eliminar.',
  styleDeleted: 'Estilo eliminado.',
  styleEditNoDefault: 'Los estilos predeterminados no se pueden editar.',
  styleCustomLimitReached: 'Puedes añadir hasta 7 estilos personalizados.',
  exportCopied: 'Flujo copiado para la IA.',
  exportEmpty: 'Nada que exportar en esta página.',
  exportFailed: 'Error al exportar.',

  // 12. Description
  descCopyEmpty: 'No hay ninguna descripción para copiar.',
  descCopied: 'Descripción copiada al portapapeles.',

  // 13. Control Tooltips
  tipWidth: 'Ancho',
  tipHeight: 'Altura',
  tipCornerRadius: 'Radio de esquina',
  tipStrokeWidth: 'Grosor del trazo',
  tipStartOffset: 'Desplazamiento inicial',
  tipEndOffset: 'Desplazamiento final',
  tipLabelText: 'Texto de etiqueta',
  tipLabelPlaceholder: 'Añadir etiqueta',
  tipClearLabel: 'Borrar etiqueta',
  tipLabelFill: 'Color de relleno de etiqueta',
  tipLabelStroke: 'Color de trazo de etiqueta',
  tipAlignLeft: 'Alinear a la izquierda',
  tipAlignCenter: 'Alinear al centro',
  tipAlignRight: 'Alinear a la derecha',
  tipAddStyle: 'Añadir estilo',
  tipStyleMore: 'Más opciones',
  tipStyleMoreLocked: 'Los estilos predeterminados no se pueden editar ni eliminar',
  tipFillColor: 'Color de relleno',
  tipStrokeColor: 'Color de trazo',
  tipStrokeWeight: 'Grosor del trazo',
  tipStepNumber: 'Número de insignia',
  tipStepStartNumber: 'Número inicial de insignia',
  tipCornerTL: 'Superior izquierda',
  tipCornerTR: 'Superior derecha',
  tipCornerBL: 'Inferior izquierda',
  tipCornerBR: 'Inferior derecha',
  tipCopy: 'Copiar',
  tipCopied: 'Copiado',
  tipNoDesc: 'No se ha introducido ninguna descripción',
  tipDescDisabled: 'Description no está disponible para esta forma',
  tipLinkDisabled: 'Reference Link no está disponible para esta forma',
  tipHexColor: 'Color hexadecimal',
  tipClose: 'Cerrar',
  tipSettings: 'Ajustes',
  tipRefreshFrames: 'Actualizar frames desde el lienzo',
  tipSolid: 'Sólida',
  tipDashed: 'Discontinua',
  tipDotted: 'Punteada',
  tipStartTerminal: 'Forma inicial',
  tipEndTerminal: 'Forma final',
  tipTermNone: 'Ninguna',
  tipTermArrow: 'Flecha',
  tipTermCircle: 'Círculo',
  tipTermDiamond: 'Rombo',
  tipTermTriangle: 'Triángulo',
  tipRouteOrtho: 'Ortogonal',
  tipRouteSCurve: 'Redondeado',
  tipRouteCurve: 'Curva',
  tipRouteStraight: 'Recta',
  tipGizmoSource: 'Origen',
  tipGizmoTarget: 'Destino',
  tipMixed: 'Mixto',
  tipActive: 'Activo',
  tipAddSize: 'Añadir tamaño',
  tipAddSizeDisabled: 'No se puede añadir tamaño a esta forma',
  tipSizeMore: 'Más opciones',
  tipSizeMoreDisabled: 'Las opciones de Size no están disponibles para esta forma',
  tipDefaultPresetLocked: 'Los preajustes predeterminados no se pueden editar ni eliminar',
  tipSizeMode: 'Seleccionar modo de altura',
  tipSizeModeDisabled: 'El modo de Size no se puede cambiar para esta forma',
  sizeModeFixed: 'Altura fija',
  sizeModeHug: 'Ajustar al contenido',
  sizeModeFit: 'Rellenar contenido',
  tipPresetDims: '{w}×{h}',
  tipPresetDisabledShape: 'Los preajustes de Size no están disponibles para esta forma',
  tipConnectorColor: 'Color de conexión',
  tipQuotaBlocked: 'Límite gratuito alcanzado. Actualiza para crear más.',

  // 14. Shape Notices
noticeSizeOnlyScreen: 'Size solo está disponible para nodos Screen.',
noticeDescUnsupported: 'Description no está disponible para esta forma.',
noticeElevationUnsupported: 'Elevation no está disponible para esta forma.',
noticeStatusUnsupported: 'Status no está disponible para esta forma.',
noticeStepUnsupported: 'Step Badges no está disponible para esta forma.',
noticeLinkUnsupported: 'Reference Link no está disponible para esta forma.',
noticeMixed: 'No disponible para una selección mixta.',
  // 15. Connect Status Text
connectStatusSelectNodes: 'Selecciona 2 o más nodos para conectar.',
connectStatusReadyTwoNodes: '2 nodos listos para conectar.',
connectStatusReadyMultiNodes: '{count} nodos listos para conectar.',
connectStatusReady: 'Listo para conectar.',
connectStatusChangesReady: 'Cambios listos para aplicar.',
connectStatusConnected: 'Conectado.',
connectStatusNoChanges: 'Sin cambios.',
  // 16. Action Buttons & Tooltips
stepDescStartsFromNumber: 'Comienza desde el número especificado.',
stepTipEnterStartNumber: 'Introduce un número inicial.',
stepTipAddStepBadges: 'Añadir Step Badges.',
connectTipNoChanges: 'No hay cambios para aplicar.',
connectTipApplyChanges: 'Aplicar cambios de conexión.',
connectTipConnectNodes: 'Conectar nodos seleccionados.',
};

// ============================================================================
// DE — Deutsch
// ============================================================================
const DE: Catalog = {
  // 1. Quota & Entitlement
  limitReached: 'Das Limit für Flooow-Elemente ist erreicht ({current}/{limit}). Lösche vorhandene Elemente und versuche es erneut.',

  // 2. Node CRUD
nodeCreated: 'Knoten "{title}" erstellt.',
  nodeCreateFailed: 'Knoten konnte nicht erstellt werden: {error}',
  nodeNotFoundSelect: 'Der zu bearbeitende Knoten wurde nicht gefunden. Wähle einen Knoten auf der Arbeitsfläche aus.',
nodeUpdated: 'Knoten "{title}" aktualisiert.',
  nodeUpdateFailed: 'Knoten konnte nicht aktualisiert werden: {error}',
  nodesBatchUpdated: '{count} Knoten aktualisiert',
  nodesBatchUpdateFailed: 'Knoten konnten nicht aktualisiert werden: {error}',
  nodeGone: 'Knoten nicht gefunden.',

  // 3. Connect & Chain
  connectNodesNotFound: 'Zu verbindende Knoten wurden nicht gefunden.',
  connectNeedTwoDifferent: 'Wähle zwei verschiedene Knoten zum Verbinden aus.',
connectDone: 'Verbunden.',
connectDoneLabel: 'Mit der Beschriftung "{label}" verbunden.',
  connectCreateFailed: 'Verbindung konnte nicht erstellt werden: {error}',
  connectNeedTwoOrMore: 'Wähle mindestens 2 Knoten zum Verbinden aus.',
  connectNeedTwoDifferentOrMore: 'Wähle mindestens 2 verschiedene Knoten aus.',
  connectNeedTwo: 'Wähle mindestens 2 Knoten zum Verbinden aus.',
autoConnectDone: 'Orthogonale Verbindung erstellt.',
autoConnectDoneLabel: 'Orthogonale Verbindung mit der Beschriftung "{label}" erstellt.',
  autoChainDone: '⚡ {nodes} Knoten nacheinander verbunden ({conns} Verbindungen).',
  autoConnectFailed: 'Automatische Verbindung fehlgeschlagen: {error}',
  chainExistsAll: 'Alle Verbindungen sind bereits vorhanden.',
chainCreatedPartial: '{created} Verbindungen erstellt ({skipped} bereits vorhanden).',
chainCreated: '{created} Verbindungen erstellt.',
  chainFailed: 'Kettenverbindung fehlgeschlagen: {error}',

  // 4. Connector Editing
  connectorSelectForLabel: 'Wähle eine Verbindung auf der Arbeitsfläche aus, um sie zu bearbeiten.',
  connectorLabelSet: 'Mittlere Beschriftung auf "{label}" gesetzt',
  connectorLabelCleared: 'Mittlere Beschriftung entfernt.',
  connectorLabelFailed: 'Text der Verbindung konnte nicht aktualisiert werden: {error}',
  connectorNotFound: 'Die zu bearbeitende Verbindung wurde nicht gefunden.',
  connectorOffsetConverted: 'Zur Anwendung von Versätzen automatisch in eine benutzerdefinierte orthogonale Verbindung umgewandelt.',
  connectorUpdateFailed: 'Verbindung konnte nicht aktualisiert werden: {error}',
  connectorSelectForLineType: 'Wähle eine Verbindung auf der Arbeitsfläche aus, um sie zu ändern.',
connectorLineElbowed: '📐 Verbindung auf orthogonal geändert.',
connectorLineStraight: '📏 Verbindung auf gerade geändert.',
  connectorLineTypeFailed: 'Linientyp konnte nicht geändert werden: {error}',
  connectorsNoneToConvert: 'Keine Verbindungen auf der Arbeitsfläche zum Umwandeln vorhanden.',
connectorsConvertedAll: '⚡ {count} Verbindungen in orthogonale Verbindungen umgewandelt.',
connectorsAlreadyElbowed: '{count} Verbindungen sind bereits orthogonal.',
  connectorsConvertFailed: 'Verbindungen konnten nicht umgewandelt werden: {error}',

  // 5. Status Badge
  statusNeedSelection: 'Wähle mindestens 1 Element aus, um einen Status festzulegen.',
  statusRemoved: 'Status-Badges von {count} Knoten entfernt.',
statusAttached: 'Status-Badge "{label}" an {count} Knoten angebracht.',
  // 6. Elevation
  elevationNeedSelection: 'Wähle Elemente aus, um Elevation anzuwenden.',
  elevationRemoved: 'Elevation von {count} Knoten entfernt.',
  elevationApplied: 'Elevation der Stufe {level} auf {count} Knoten angewendet.',

  // 7. Step Badges
  stepNeedSelection: 'Wähle Elemente auf der Arbeitsfläche aus, um sie zu nummerieren.',
  stepApplied: 'Schrittnummern auf {count} Knoten angewendet.',
  stepRemoveNeedSelection: 'Wähle Elemente auf der Arbeitsfläche aus, um Schrittnummern zu entfernen.',
  stepRemoved: 'Schrittnummern von {count} Knoten entfernt.',
  stepNoneExist: 'Die ausgewählten Knoten haben keine Schrittnummern.',

  // 8. Settings & Tokens
  settingsSaved: 'Figma-Integrationseinstellungen gespeichert.',
  variablesUnsupported: 'Diese Figma-Version unterstützt die Variables-API nicht.',
  variablesNoneLocal: 'Keine lokalen Variablen in der geöffneten Datei. Führe den Vorgang über den UI3-Kit-Dateireiter aus.',
  tokensExtracted: '🎨 {count} UI3-Designtokens extrahiert.',
  tokensFailed: 'UI3-Variablen konnten nicht extrahiert werden: {error}',

  // 9. Undo / Redo
  undoHint: 'Auf der Arbeitsfläche mit Cmd+Z (Mac) oder Strg+Z (Windows) rückgängig machen.',
  redoHint: 'Auf der Arbeitsfläche mit Cmd+Umschalt+Z (Mac) oder Strg+Y (Windows) wiederholen.',
  undoCancelled: 'Änderungen verworfen.',
  undone: 'Rückgängig gemacht.',

  // 10. Validation
  titleMax32: 'Titel dürfen maximal 32 Zeichen lang sein.',
  max999: 'Der Höchstwert ist 999.',
  sizeMinW: 'Die Mindestbreite beträgt {px}px.',
  sizeMaxW: 'Die maximale Breite beträgt {px}px.',
  sizeMinH: 'Die Mindesthöhe beträgt {px}px.',
  sizeMaxH: 'Die maximale Höhe beträgt {px}px.',
  sizeMaxCorner: 'Der Höchstwert ist {px}.',

  // 11. Presets & Styles
  sizePresetAdded: 'Größen-Preset "{name}" hinzugefügt.',
  sizeUpdated: 'Größe aktualisiert.',
  sizePresetDeleted: 'Preset "{name}" gelöscht.',
  sizePresetDeleted2: 'Größen-Preset gelöscht.',
  presetDeleteNoDefault: 'Standard-Presets können nicht gelöscht werden.',
  styleAddedNew: 'Neuer Stil hinzugefügt.',
  styleUpdated: 'Stil aktualisiert.',
  styleDefaultNoDelete: 'Standardstile können nicht gelöscht werden.',
  styleDeleted: 'Stil gelöscht.',
  styleEditNoDefault: 'Standardstile können nicht bearbeitet werden.',
  styleCustomLimitReached: 'Du kannst bis zu 7 benutzerdefinierte Stile hinzufügen.',
  exportCopied: 'Flow für KI kopiert.',
  exportEmpty: 'Nichts auf dieser Seite zu exportieren.',
  exportFailed: 'Export fehlgeschlagen.',

  // 12. Description
  descCopyEmpty: 'Keine Beschreibung zum Kopieren vorhanden.',
  descCopied: 'Beschreibung in die Zwischenablage kopiert.',

  // 13. Control Tooltips
  tipWidth: 'Breite',
  tipHeight: 'Höhe',
  tipCornerRadius: 'Eckenradius',
  tipStrokeWidth: 'Konturstärke',
  tipStartOffset: 'Startversatz',
  tipEndOffset: 'Endversatz',
  tipLabelText: 'Beschriftungstext',
  tipLabelPlaceholder: 'Label hinzufügen',
  tipClearLabel: 'Label löschen',
  tipLabelFill: 'Füllfarbe der Beschriftung',
  tipLabelStroke: 'Konturfarbe der Beschriftung',
  tipAlignLeft: 'Linksbündig',
  tipAlignCenter: 'Zentriert',
  tipAlignRight: 'Rechtsbündig',
  tipAddStyle: 'Stil hinzufügen',
  tipStyleMore: 'Weitere Optionen',
  tipStyleMoreLocked: 'Standardstile können nicht bearbeitet oder gelöscht werden',
  tipFillColor: 'Füllfarbe',
  tipStrokeColor: 'Konturfarbe',
  tipStrokeWeight: 'Konturstärke',
  tipStepNumber: 'Badge-Nummer',
  tipStepStartNumber: 'Startnummer des Badges',
  tipCornerTL: 'Oben links',
  tipCornerTR: 'Oben rechts',
  tipCornerBL: 'Unten links',
  tipCornerBR: 'Unten rechts',
  tipCopy: 'Kopieren',
  tipCopied: 'Kopiert',
  tipNoDesc: 'Keine Beschreibung eingegeben',
  tipDescDisabled: 'Description ist für diese Form nicht verfügbar',
  tipLinkDisabled: 'Reference Link ist für diese Form nicht verfügbar',
  tipHexColor: 'Hex-Farbe',
  tipClose: 'Schließen',
  tipSettings: 'Einstellungen',
  tipRefreshFrames: 'Frames von der Arbeitsfläche aktualisieren',
  tipSolid: 'Durchgezogen',
  tipDashed: 'Gestrichelt',
  tipDotted: 'Gepunktet',
  tipStartTerminal: 'Anfangsform',
  tipEndTerminal: 'Endform',
  tipTermNone: 'Keine',
  tipTermArrow: 'Pfeil',
  tipTermCircle: 'Kreis',
  tipTermDiamond: 'Raute',
  tipTermTriangle: 'Dreieck',
  tipRouteOrtho: 'Orthogonal',
  tipRouteSCurve: 'Rund',
  tipRouteCurve: 'Kurve',
  tipRouteStraight: 'Gerade',
  tipGizmoSource: 'Quelle',
  tipGizmoTarget: 'Ziel',
  tipMixed: 'Gemischt',
  tipActive: 'Aktiv',
  tipAddSize: 'Größe hinzufügen',
  tipAddSizeDisabled: 'Für diese Form kann keine Größe hinzugefügt werden',
  tipSizeMore: 'Weitere Optionen',
  tipSizeMoreDisabled: 'Size-Optionen sind für diese Form nicht verfügbar',
  tipDefaultPresetLocked: 'Standard-Presets können nicht bearbeitet oder gelöscht werden',
  tipSizeMode: 'Höhenmodus auswählen',
  tipSizeModeDisabled: 'Der Size-Modus kann für diese Form nicht geändert werden',
  sizeModeFixed: 'Feste Höhe',
  sizeModeHug: 'An Inhalt anpassen',
  sizeModeFit: 'Inhalt ausfüllen',
  tipPresetDims: '{w}×{h}',
  tipPresetDisabledShape: 'Size-Presets sind für diese Form nicht verfügbar',
  tipConnectorColor: 'Verbindungsfarbe',
  tipQuotaBlocked: 'Kostenloses Limit erreicht. Upgrade für weitere Elemente.',

  // 14. Shape Notices
noticeSizeOnlyScreen: 'Size ist nur für Screen-Knoten verfügbar.',
noticeDescUnsupported: 'Description ist für diese Form nicht verfügbar.',
noticeElevationUnsupported: 'Elevation ist für diese Form nicht verfügbar.',
noticeStatusUnsupported: 'Status ist für diese Form nicht verfügbar.',
noticeStepUnsupported: 'Step Badges sind für diese Form nicht verfügbar.',
noticeLinkUnsupported: 'Reference Link ist für diese Form nicht verfügbar.',
noticeMixed: 'Bei gemischter Auswahl nicht verfügbar.',
  // 15. Connect Status Text
connectStatusSelectNodes: 'Mindestens 2 Knoten zum Verbinden auswählen.',
connectStatusReadyTwoNodes: '2 Knoten zum Verbinden bereit.',
connectStatusReadyMultiNodes: '{count} Knoten zum Verbinden bereit.',
connectStatusReady: 'Bereit zum Verbinden.',
connectStatusChangesReady: 'Änderungen zum Anwenden bereit.',
connectStatusConnected: 'Verbunden.',
connectStatusNoChanges: 'Keine Änderungen.',
  // 16. Action Buttons & Tooltips
stepDescStartsFromNumber: 'Beginnt mit der angegebenen Nummer.',
stepTipEnterStartNumber: 'Startnummer eingeben.',
stepTipAddStepBadges: 'Step Badges hinzufügen.',
connectTipNoChanges: 'Keine Änderungen zum Anwenden.',
connectTipApplyChanges: 'Verbindungsänderungen anwenden.',
connectTipConnectNodes: 'Ausgewählte Knoten verbinden.',
};

// ============================================================================
// FR — Français
// ============================================================================
const FR: Catalog = {
  // 1. Quota & Entitlement
  limitReached: 'La limite d’éléments Flooow est atteinte ({current}/{limit}). Supprimez des éléments existants, puis réessayez.',

  // 2. Node CRUD
nodeCreated: 'Nœud "{title}" créé.',
  nodeCreateFailed: 'Échec de la création du nœud : {error}',
  nodeNotFoundSelect: 'Nœud à modifier introuvable. Sélectionnez un nœud sur le canevas.',
nodeUpdated: 'Nœud "{title}" mis à jour.',
  nodeUpdateFailed: 'Échec de la mise à jour du nœud : {error}',
  nodesBatchUpdated: '{count} nœuds mis à jour',
  nodesBatchUpdateFailed: 'Échec de la mise à jour des nœuds : {error}',
  nodeGone: 'Nœud introuvable.',

  // 3. Connect & Chain
  connectNodesNotFound: 'Nœuds à connecter introuvables.',
  connectNeedTwoDifferent: 'Sélectionnez deux nœuds différents à connecter.',
connectDone: 'Connecté.',
connectDoneLabel: 'Connecté avec le libellé "{label}".',
  connectCreateFailed: 'Échec de la création de la connexion : {error}',
  connectNeedTwoOrMore: 'Sélectionnez au moins 2 nœuds à connecter.',
  connectNeedTwoDifferentOrMore: 'Sélectionnez au moins 2 nœuds différents.',
  connectNeedTwo: 'Sélectionnez au moins 2 nœuds à connecter.',
autoConnectDone: 'Connexion orthogonale terminée.',
autoConnectDoneLabel: 'Connexion orthogonale terminée avec le libellé "{label}".',
  autoChainDone: '⚡ {nodes} nœuds connectés en séquence ({conns} connexions).',
  autoConnectFailed: 'Échec de la connexion automatique : {error}',
  chainExistsAll: 'Toutes les connexions existent déjà.',
chainCreatedPartial: '{created} connexions créées ({skipped} existent déjà).',
chainCreated: '{created} connexions créées.',
  chainFailed: 'Échec de la création de la chaîne : {error}',

  // 4. Connector Editing
  connectorSelectForLabel: 'Sélectionnez une connexion sur le canevas pour la modifier.',
  connectorLabelSet: 'Libellé central défini sur "{label}"',
  connectorLabelCleared: 'Libellé central supprimé.',
  connectorLabelFailed: 'Échec de la mise à jour du texte de la connexion : {error}',
  connectorNotFound: 'Connexion à modifier introuvable.',
  connectorOffsetConverted: 'Convertie automatiquement en connexion orthogonale personnalisée pour appliquer les décalages.',
  connectorUpdateFailed: 'Échec de la mise à jour de la connexion : {error}',
  connectorSelectForLineType: 'Sélectionnez une connexion sur le canevas pour la modifier.',
connectorLineElbowed: '📐 Connexion passée en mode orthogonal.',
connectorLineStraight: '📏 Connexion passée en ligne droite.',
  connectorLineTypeFailed: 'Échec de la modification du type de ligne : {error}',
  connectorsNoneToConvert: 'Aucune connexion à convertir sur le canevas.',
connectorsConvertedAll: '⚡ {count} connexions converties en mode orthogonal.',
connectorsAlreadyElbowed: '{count} connexions sont déjà orthogonales.',
  connectorsConvertFailed: 'Échec de la conversion des connexions : {error}',

  // 5. Status Badge
  statusNeedSelection: 'Sélectionnez au moins 1 élément pour définir un statut.',
  statusRemoved: 'Badges de statut supprimés de {count} nœuds.',
statusAttached: 'Badge de statut "{label}" ajouté à {count} nœuds.',
  // 6. Elevation
  elevationNeedSelection: 'Sélectionnez des éléments pour appliquer Elevation.',
  elevationRemoved: 'Elevation supprimée de {count} nœuds.',
  elevationApplied: 'Elevation de niveau {level} appliquée à {count} nœuds.',

  // 7. Step Badges
  stepNeedSelection: 'Sélectionnez des éléments sur le canevas pour les numéroter.',
  stepApplied: 'Numéros d’étape appliqués à {count} nœuds.',
  stepRemoveNeedSelection: 'Sélectionnez des éléments sur le canevas pour supprimer les numéros d’étape.',
  stepRemoved: 'Numéros d’étape supprimés de {count} nœuds.',
  stepNoneExist: 'Les nœuds sélectionnés n’ont aucun numéro d’étape.',

  // 8. Settings & Tokens
  settingsSaved: 'Paramètres d’intégration Figma enregistrés.',
  variablesUnsupported: 'Cette version de Figma ne prend pas en charge l’API Variables.',
  variablesNoneLocal: 'Aucune Variable locale dans le fichier ouvert. Exécutez depuis l’onglet du fichier UI3 Kit.',
  tokensExtracted: '🎨 {count} jetons de design UI3 extraits.',
  tokensFailed: 'Échec de l’extraction des Variables UI3 : {error}',

  // 9. Undo / Redo
  undoHint: 'Annulez avec Cmd+Z (Mac) ou Ctrl+Z (Windows) sur le canevas.',
  redoHint: 'Rétablissez avec Cmd+Maj+Z (Mac) ou Ctrl+Y (Windows) sur le canevas.',
  undoCancelled: 'Modifications annulées.',
  undone: 'Annulé.',

  // 10. Validation
  titleMax32: 'Les titres peuvent contenir jusqu’à 32 caractères.',
  max999: 'La valeur maximale est 999.',
  sizeMinW: 'La largeur minimale est de {px}px.',
  sizeMaxW: 'La largeur maximale est de {px}px.',
  sizeMinH: 'La hauteur minimale est de {px}px.',
  sizeMaxH: 'La hauteur maximale est de {px}px.',
  sizeMaxCorner: 'La valeur maximale est de {px}.',

  // 11. Presets & Styles
  sizePresetAdded: 'Préréglage de taille "{name}" ajouté.',
  sizeUpdated: 'Taille mise à jour.',
  sizePresetDeleted: 'Préréglage "{name}" supprimé.',
  sizePresetDeleted2: 'Préréglage de taille supprimé.',
  presetDeleteNoDefault: 'Les préréglages par défaut ne peuvent pas être supprimés.',
  styleAddedNew: 'Nouveau style ajouté.',
  styleUpdated: 'Style mis à jour.',
  styleDefaultNoDelete: 'Les styles par défaut ne peuvent pas être supprimés.',
  styleDeleted: 'Style supprimé.',
  styleEditNoDefault: 'Les styles par défaut ne peuvent pas être modifiés.',
  styleCustomLimitReached: 'Vous pouvez ajouter jusqu’à 7 styles personnalisés.',
  exportCopied: 'Flow copié pour l’IA.',
  exportEmpty: 'Rien à exporter sur cette page.',
  exportFailed: 'Échec de l’exportation.',

  // 12. Description
  descCopyEmpty: 'Aucune description à copier.',
  descCopied: 'Description copiée dans le presse-papiers.',

  // 13. Control Tooltips
  tipWidth: 'Largeur',
  tipHeight: 'Hauteur',
  tipCornerRadius: 'Rayon des angles',
  tipStrokeWidth: 'Épaisseur du contour',
  tipStartOffset: 'Décalage de début',
  tipEndOffset: 'Décalage de fin',
  tipLabelText: 'Texte du libellé',
  tipLabelPlaceholder: 'Ajouter un libellé',
  tipClearLabel: 'Effacer le libellé',
  tipLabelFill: 'Couleur de remplissage du libellé',
  tipLabelStroke: 'Couleur du contour du libellé',
  tipAlignLeft: 'Aligner à gauche',
  tipAlignCenter: 'Centrer',
  tipAlignRight: 'Aligner à droite',
  tipAddStyle: 'Ajouter un style',
  tipStyleMore: 'Plus d’options',
  tipStyleMoreLocked: 'Les styles par défaut ne peuvent être ni modifiés ni supprimés',
  tipFillColor: 'Couleur de remplissage',
  tipStrokeColor: 'Couleur du contour',
  tipStrokeWeight: 'Épaisseur du contour',
  tipStepNumber: 'Numéro du badge',
  tipStepStartNumber: 'Numéro de départ du badge',
  tipCornerTL: 'En haut à gauche',
  tipCornerTR: 'En haut à droite',
  tipCornerBL: 'En bas à gauche',
  tipCornerBR: 'En bas à droite',
  tipCopy: 'Copier',
  tipCopied: 'Copié',
  tipNoDesc: 'Aucune description saisie',
  tipDescDisabled: 'Description n’est pas disponible pour cette forme',
  tipLinkDisabled: 'Reference Link n’est pas disponible pour cette forme',
  tipHexColor: 'Couleur hexadécimale',
  tipClose: 'Fermer',
  tipSettings: 'Paramètres',
  tipRefreshFrames: 'Actualiser les frames depuis le canevas',
  tipSolid: 'Plein',
  tipDashed: 'Tirets',
  tipDotted: 'Pointillés',
  tipStartTerminal: 'Forme de début',
  tipEndTerminal: 'Forme de fin',
  tipTermNone: 'Aucune',
  tipTermArrow: 'Flèche',
  tipTermCircle: 'Cercle',
  tipTermDiamond: 'Losange',
  tipTermTriangle: 'Triangle',
  tipRouteOrtho: 'Orthogonal',
  tipRouteSCurve: 'Arrondi',
  tipRouteCurve: 'Courbe',
  tipRouteStraight: 'Ligne droite',
  tipGizmoSource: 'Source',
  tipGizmoTarget: 'Cible',
  tipMixed: 'Mixte',
  tipActive: 'Actif',
  tipAddSize: 'Ajouter une taille',
  tipAddSizeDisabled: 'Impossible d’ajouter une taille pour cette forme',
  tipSizeMore: 'Plus d’options',
  tipSizeMoreDisabled: 'Les options de Size ne sont pas disponibles pour cette forme',
  tipDefaultPresetLocked: 'Les préréglages par défaut ne peuvent être ni modifiés ni supprimés',
  tipSizeMode: 'Sélectionner le mode de hauteur',
  tipSizeModeDisabled: 'Le mode de Size ne peut pas être modifié pour cette forme',
  sizeModeFixed: 'Hauteur fixe',
  sizeModeHug: 'Ajuster au contenu',
  sizeModeFit: 'Remplir le contenu',
  tipPresetDims: '{w}×{h}',
  tipPresetDisabledShape: 'Les préréglages de Size ne sont pas disponibles pour cette forme',
  tipConnectorColor: 'Couleur de la connexion',
  tipQuotaBlocked: 'Limite gratuite atteinte. Passez à Pro pour en créer davantage.',

  // 14. Shape Notices
noticeSizeOnlyScreen: 'Size est disponible uniquement pour les nœuds Screen.',
noticeDescUnsupported: 'Description n’est pas disponible pour cette forme.',
noticeElevationUnsupported: 'Elevation n’est pas disponible pour cette forme.',
noticeStatusUnsupported: 'Status n’est pas disponible pour cette forme.',
noticeStepUnsupported: 'Step Badges ne sont pas disponibles pour cette forme.',
noticeLinkUnsupported: 'Reference Link n’est pas disponible pour cette forme.',
noticeMixed: 'Indisponible pour une sélection mixte.',
  // 15. Connect Status Text
connectStatusSelectNodes: 'Sélectionnez 2 nœuds ou plus pour connecter.',
connectStatusReadyTwoNodes: '2 nœuds prêts à être connectés.',
connectStatusReadyMultiNodes: '{count} nœuds prêts à être connectés.',
connectStatusReady: 'Prêt à connecter.',
connectStatusChangesReady: 'Modifications prêtes à être appliquées.',
connectStatusConnected: 'Connecté.',
connectStatusNoChanges: 'Aucune modification.',
  // 16. Action Buttons & Tooltips
stepDescStartsFromNumber: 'Commence à partir du numéro spécifié.',
stepTipEnterStartNumber: 'Saisissez un numéro de départ.',
stepTipAddStepBadges: 'Ajouter des Step Badges.',
connectTipNoChanges: 'Aucune modification à appliquer.',
connectTipApplyChanges: 'Appliquer les modifications de connexion.',
connectTipConnectNodes: 'Connecter les nœuds sélectionnés.',
};

const CATALOGS: Record<AppLocale, Catalog> = {
  ko: KO,
  en: EN,
  ja: JA,
  'zh-CN': ZH_CN,
  'zh-TW': ZH_TW,
  es: ES,
  de: DE,
  fr: FR,
};

export function t(
  key: MessageKey,
  params?: Record<string, string | number>,
  locale?: AppLocale
): string {
  const targetLocale = locale || activeLocale;
  const catalog = CATALOGS[targetLocale] || EN;
  let text = catalog[key] || EN[key] || KO[key] || '';
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.split(`{${name}}`).join(String(value));
    }
  }
  return text;
}
