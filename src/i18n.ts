// ============================================================================
// 토스트/알림/UI 메시지 카탈로그 (Core/UI 공용, Figma API 의존 없음)
// - 한국어(ko)/영어(en) 2개 로케일. UI는 navigator.language로 판정해 INIT에 전달하고,
//   Core는 수신 전까지 한국어 기본.
// - 새 메시지 추가 시 양쪽 로케일에 같은 키를 반드시 등록 (test/i18n.test.mjs 검증).
// - 각 메시지별 [사용처], [조건], [비고] 주석을 JSDoc 형태로 명시하여 IDE 툴팁 및 유지보수 지원.
// ============================================================================

import type { AppLocale } from './types';

export type { AppLocale };

let activeLocale: AppLocale = 'ko';

export function setAppLocale(locale: AppLocale | undefined | null): AppLocale {
  if (locale === 'ko' || locale === 'en') activeLocale = locale;
  return activeLocale;
}

export function getAppLocale(): AppLocale {
  return activeLocale;
}

/** navigator.language → 'ko' | 'en'. 알 수 없으면 한국어 기본(기존 동작 유지). */
export function resolveAppLocale(language: string | undefined | null): AppLocale {
  const lang = (language || '').trim().toLowerCase();
  if (!lang) return 'ko';
  if (lang.startsWith('ko')) return 'ko';
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

const KO: Catalog = {
  // ==========================================================================
  // 1. 플랜 한도 (Quota & Entitlement)
  // ==========================================================================
  /** [사용처] Core/UI 한도 도달 알림 | [조건] 무료 플랜 20개 초과 시 | [비고] {current}, {limit} 치환 */
  limitReached: 'Flooow element가 가득 찼습니다 ({current}/{limit}). 기존 element를 삭제한 뒤 다시 시도해 주세요.',

  // ==========================================================================
  // 2. 노드 생성 및 수정 (Node CRUD)
  // ==========================================================================
  /** [사용처] Core 노드 단일 생성 완료 토스트 | [조건] 노드 1개 생성 성공 시 | [비고] {title} 치환 */
  nodeCreated: '노드 "{title}"을 생성했습니다',
  /** [사용처] Core 노드 생성 실패 토스트 | [조건] 노드 생성 예외 발생 시 | [비고] {error} 치환 */
  nodeCreateFailed: '노드 생성 실패: {error}',
  /** [사용처] Core 노드 수정 실패 안내 | [조건] 수정할 노드가 캔버스에서 선택되지 않았을 때 */
  nodeNotFoundSelect: '수정할 노드를 찾을 수 없습니다. 캔버스에서 노드를 선택해 주세요.',
  /** [사용처] Core 노드 단일 수정 완료 토스트 | [조건] 노드 속성 수정 성공 시 | [비고] {title} 치환 */
  nodeUpdated: '노드 "{title}"을 업데이트했습니다',
  /** [사용처] Core 노드 수정 실패 토스트 | [조건] 노드 수정 중 예외 발생 시 | [비고] {error} 치환 */
  nodeUpdateFailed: '노드 수정 실패: {error}',
  /** [사용처] Core 노드 다중 수정 완료 토스트 | [조건] 2개 이상 노드 일괄 업데이트 성공 시 | [비고] {count} 치환 */
  nodesBatchUpdated: '{count}개 노드가 업데이트되었습니다!',
  /** [사용처] Core 노드 다중 수정 실패 토스트 | [조건] 다중 업데이트 처리 중 예외 발생 시 | [비고] {error} 치환 */
  nodesBatchUpdateFailed: '다중 노드 업데이트 실패: {error}',
  /** [사용처] Core 노드 참조 실패 알림 | [조건] 참조하던 노드가 캔버스에서 삭제되었을 때 */
  nodeGone: '해당 노드를 찾을 수 없습니다.',

  // ==========================================================================
  // 3. 커넥터 생성 및 체인 연결 (Connect & Chain)
  // ==========================================================================
  /** [사용처] Core 커넥터 생성 오류 | [조건] 연결할 대상 노드를 찾을 수 없을 때 */
  connectNodesNotFound: '연결할 노드를 찾을 수 없습니다.',
  /** [사용처] Core 커넥터 생성 검증 | [조건] 동일한 노드를 선택했거나 2개 노드가 구별되지 않을 때 */
  connectNeedTwoDifferent: '서로 다른 두 노드를 선택하여 연결해 주세요.',
  /** [사용처] Core 커넥터 생성 완료 토스트 | [조건] 라벨 없는 커넥터 생성 성공 시 */
  connectDone: '연결 완료',
  /** [사용처] Core 커넥터 생성 완료 토스트 | [조건] 라벨이 포함된 커넥터 생성 성공 시 | [비고] {label} 치환 */
  connectDoneLabel: '라벨 "{label}" 연결 완료',
  /** [사용처] Core 커넥터 생성 실패 토스트 | [조건] 커넥터 생성 중 예외 발생 시 | [비고] {error} 치환 */
  connectCreateFailed: '연결선 생성 실패: {error}',
  /** [사용처] Core 다중 노드 연결 검증 | [조건] 연결 대상 노드가 2개 미만으로 선택되었을 때 */
  connectNeedTwoOrMore: '연결할 노드를 2개 이상 선택해 주세요.',
  /** [사용처] Core 다중 노드 연결 검증 | [조건] 서로 다른 노드가 2개 미만일 때 */
  connectNeedTwoDifferentOrMore: '서로 다른 노드를 2개 이상 선택해 주세요.',
  /** [사용처] UI 연결 버튼 검증 안내 | [조건] 노드가 2개 미만으로 선택되었을 때 */
  connectNeedTwo: '연결할 노드를 2개 이상 선택해 주세요.',
  /** [사용처] Core 직각 연결 완료 토스트 | [조건] 직각 커넥터 생성 성공 시 */
  autoConnectDone: '칼각 직각 연결 완료',
  /** [사용처] Core 직각 연결 완료 토스트 | [조건] 라벨 포함 직각 커넥터 생성 성공 시 | [비고] {label} 치환 */
  autoConnectDoneLabel: '라벨 "{label}" 칼각 직각 연결 완료',
  /** [사용처] Core 순차 체인 연결 완료 토스트 | [조건] 3개 이상 노드 순차 체인 생성 성공 시 | [비고] {nodes}, {conns} 치환 */
  autoChainDone: '⚡ 총 {nodes}개 노드가 칼각 직각 순차 연결되었습니다 ({conns}개 연결선).',
  /** [사용처] Core 자동 연결 실패 토스트 | [조건] 자동 연결 실행 중 오류 발생 시 | [비고] {error} 치환 */
  autoConnectFailed: '순차 자동 연결 실패: {error}',
  /** [사용처] Core 체인 생성 안내 | [조건] 선택한 노드들 사이의 모든 연결선이 이미 존재할 때 */
  chainExistsAll: '모든 연결이 이미 존재합니다.',
  /** [사용처] Core 부분 체인 연결 토스트 | [조건] 기존 연결은 건너뛰고 일부만 신규 생성되었을 때 | [비고] {created}, {skipped} 치환 */
  chainCreatedPartial: '{created}개 연결 완료 ({skipped}개는 이미 연결됨)',
  /** [사용처] Core 체인 연결 완료 토스트 | [조건] 전체 체인 연결 신규 생성 완료 시 | [비고] {created} 치환 */
  chainCreated: '{created}개 연결 완료',
  /** [사용처] Core 체인 연결 실패 토스트 | [조건] 체인 생성 중 예외 발생 시 | [비고] {error} 치환 */
  chainFailed: '체인 연결 실패: {error}',

  // ==========================================================================
  // 4. 커넥터 라벨 및 속성 수정 (Connector Editing)
  // ==========================================================================
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
  connectorLineElbowed: '📐 연결선을 직각으로 변경했습니다',
  /** [사용처] Core 직선 변환 완료 토스트 | [조건] 커넥터를 직선 형태로 변경했을 때 */
  connectorLineStraight: '📏 연결선을 직선으로 변경했습니다',
  /** [사용처] Core 라인 형태 변경 실패 | [조건] 라인 형태 변경 중 예외 발생 시 | [비고] {error} 치환 */
  connectorLineTypeFailed: '연결선 형태 변경 실패: {error}',
  /** [사용처] Core 일괄 변환 대상 없음 알림 | [조건] 캔버스에 변환할 커넥터가 없을 때 */
  connectorsNoneToConvert: '캔버스에 변환할 연결선이 없습니다.',
  /** [사용처] Core 전체 직각 일괄 변환 토스트 | [조건] 캔버스의 모든 커넥터를 직각으로 변환 완료 시 | [비고] {count} 치환 */
  connectorsConvertedAll: '⚡ 연결선 {count}개를 모두 직각으로 변환했습니다',
  /** [사용처] Core 일괄 변환 기완료 안내 | [조건] 캔버스의 모든 커넥터가 이미 직각일 때 | [비고] {count} 치환 */
  connectorsAlreadyElbowed: '연결선 {count}개가 이미 모두 직각 상태입니다',
  /** [사용처] Core 일괄 변환 실패 토스트 | [조건] 일괄 변환 처리 중 오류 발생 시 | [비고] {error} 치환 */
  connectorsConvertFailed: '연결선 일괄 변환 실패: {error}',

  // ==========================================================================
  // 5. 어피어런스 - 상태 (Status Badge)
  // ==========================================================================
  /** [사용처] Core 상태 뱃지 선택 검증 | [조건] 선택된 노드 없이 상태 지정 시도 시 */
  statusNeedSelection: '상태를 지정할 요소를 1개 이상 선택해 주세요.',
  /** [사용처] Core 상태 뱃지 제거 토스트 | [조건] 노드에서 상태 뱃지 삭제 완료 시 | [비고] {count} 치환 */
  statusRemoved: '{count}개 노드의 상태 뱃지가 제거되었습니다.',
  /** [사용처] Core 상태 뱃지 부착 토스트 | [조건] 노드에 특정 상태 뱃지 부착 완료 시 | [비고] {count}, {label} 치환 */
  statusAttached: '{count}개 노드에 상태 뱃지 "{label}"을 부착했습니다',

  // ==========================================================================
  // 6. 어피어런스 - 엘리베이션 (Elevation)
  // ==========================================================================
  /** [사용처] Core 엘리베이션 선택 검증 | [조건] 선택된 노드 없이 엘리베이션 지정 시도 시 */
  elevationNeedSelection: '엘리베이션을 적용할 요소를 선택해 주세요.',
  /** [사용처] Core 엘리베이션 제거 토스트 | [조건] 노드에서 그림자(Elevation) 제거 완료 시 | [비고] {count} 치환 */
  elevationRemoved: '{count}개 노드의 엘리베이션이 제거되었습니다.',
  /** [사용처] Core 엘리베이션 적용 토스트 | [조건] 노드에 레벨별 그림자 적용 완료 시 | [비고] {count}, {level} 치환 */
  elevationApplied: '{count}개 노드에 Level {level} 엘리베이션이 적용되었습니다.',

  // ==========================================================================
  // 7. 어피어런스 - 스텝 뱃지 (Step Badges)
  // ==========================================================================
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

  // ==========================================================================
  // 8. 환경설정 및 디자인 토큰 (Settings & Tokens)
  // ==========================================================================
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

  // ==========================================================================
  // 9. 실행 취소 / 다시 실행 (Undo / Redo)
  // ==========================================================================
  /** [사용처] UI 실행 취소 힌트 툴팁 | [조건] 캔버스 실행 취소 힌트 노출 시 */
  undoHint: '캔버스에서 Cmd+Z (Mac) 또는 Ctrl+Z (Windows)로 작업을 되돌릴 수 있습니다.',
  /** [사용처] UI 다시 실행 힌트 툴팁 | [조건] 캔버스 다시 실행 힌트 노출 시 */
  redoHint: '캔버스에서 Cmd+Shift+Z (Mac) 또는 Ctrl+Y (Windows)로 다시 실행할 수 있습니다.',
  /** [사용처] Core 작업 취소 토스트 | [조건] 진행 중인 작업 변경사항이 취소되었을 때 */
  undoCancelled: '변경사항이 취소되었습니다.',
  /** [사용처] Core 작업 되돌림 완료 토스트 | [조건] 직전 작업이 취소/되돌려졌을 때 */
  undone: '작업이 되돌려졌습니다.',

  // ==========================================================================
  // 10. 입력 유효성 검사 (Validation)
  // ==========================================================================
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

  // ==========================================================================
  // 11. 사이즈 및 스타일 프리셋 (Presets & Styles)
  // ==========================================================================
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

  // ==========================================================================
  // 12. 디스크립션 클립보드 복사 (Description)
  // ==========================================================================
  /** [사용처] UI 설명 복사 검증 | [조건] 설명 내용이 비어있는 상태에서 복사 클릭 시 */
  descCopyEmpty: '복사할 설명이 없습니다.',
  /** [사용처] UI 설명 복사 완료 피드백 | [조건] 클립보드 복사 성공 시 */
  descCopied: '디스크립션을 클립보드에 복사했습니다',

  // ==========================================================================
  // 13. UI 컨트롤 및 필드 툴팁 (Control Tooltips)
  // ==========================================================================
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
  /** [사용처] UI ConnectorSection | [조건] 직각 라우팅 옵션 마우스 오버 */
  tipRouteOrtho: '직각',
  /** [사용처] UI ConnectorSection | [조건] S자 곡선 라우팅 옵션 마우스 오버 */
  tipRouteSCurve: 'S자 곡선',
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
  /** [사용처] UI SizeSection | [조건] 사이즈 프리셋 칩 마우스 오버 | [비고] {name}, {w}, {h} 치환 */
  tipPresetDims: '{name} {w}×{h}',
  /** [사용처] UI SizeSection | [조건] Screen 외 도형 선택 시 프리셋 칩 비활성 툴팁 */
  tipPresetDisabledShape: '이 도형에서는 Size 프리셋을 사용할 수 없습니다',
  /** [사용처] UI ConnectorSection | [조건] 커넥터 선 색상 피커 마우스 오버 */
  tipConnectorColor: '커넥터 색상',
  /** [사용처] UI Footer / Action | [조건] 무료 생성 한도(20개) 도달 시 비활성 툴팁 */
  tipQuotaBlocked: '무료 한도에 도달했습니다. 업그레이드하면 더 만들 수 있습니다',

  // ==========================================================================
  // 14. 도형 타입별 지원 여부 안내 (Shape Notices)
  // ==========================================================================
  /** [사용처] UI SizeSection 패널 | [조건] Screen 타입 노드가 아닌 일반 도형 선택 시 */
  noticeSizeOnlyScreen: 'Size는 Screen 노드에서만 사용할 수 있습니다',
  /** [사용처] UI DescriptionSection 패널 | [조건] Description 미지원 도형 선택 시 */
  noticeDescUnsupported: 'Description은 이 도형에서 사용할 수 없습니다',
  /** [사용처] UI ElevationSection 패널 | [조건] Elevation 미지원 도형 선택 시 */
  noticeElevationUnsupported: 'Elevation은 이 도형에서 사용할 수 없습니다',
  /** [사용처] UI StatusSection 패널 | [조건] Status 미지원 도형 선택 시 */
  noticeStatusUnsupported: 'Status는 이 도형에서 사용할 수 없습니다',
  /** [사용처] UI StepBadgesSection 패널 | [조건] Step Badges 미지원 도형 선택 시 */
  noticeStepUnsupported: 'Step Badges는 이 도형에서 사용할 수 없습니다',
  /** [사용처] UI LinkSection 패널 | [조건] Reference Link 미지원 도형 선택 시 */
  noticeLinkUnsupported: 'Reference Link는 이 도형에서 사용할 수 없습니다',
  /** [사용처] UI 어피어런스 패널 | [조건] 서로 다른 타입 노드 혼합 선택 시 */
  noticeMixed: '혼합 선택에서는 사용할 수 없습니다',

  // ==========================================================================
  // 15. 하단 액션바 연결 상태 라벨 (Connect Status Text)
  // ==========================================================================
  /** [사용처] UI ConnectSection 상태 라벨 | [조건] 캔버스에서 선택된 노드가 0개 또는 1개일 때 */
  connectStatusSelectNodes: '연결할 노드를 2개 이상 선택',
  /** [사용처] UI ConnectSection 상태 라벨 | [조건] 2개 노드가 선택되고 명시적 단자 연결 준비 완료 시 */
  connectStatusReadyTwoNodes: '2개 노드 연결 준비 완료',
  /** [사용처] UI ConnectSection 상태 라벨 | [조건] 3개 이상 노드 선택 시 | [비고] {count} 치환 */
  connectStatusReadyMultiNodes: '{count}개 노드 연결 준비 완료',
  /** [사용처] UI ConnectSection 상태 라벨 | [조건] AUTO 단자 등 기본 연결 준비 완료 시 */
  connectStatusReady: '연결 준비 완료',
  /** [사용처] UI ConnectSection 상태 라벨 | [조건] 선택된 커넥터에 변경사항이 존재할 때 */
  connectStatusChangesReady: '적용할 변경사항 준비 완료',
  /** [사용처] UI ConnectSection 상태 라벨 | [조건] 커넥터 연결/적용 작업이 완료되었을 때 */
  connectStatusConnected: '연결됨',
  /** [사용처] UI ConnectSection 상태 라벨 | [조건] 선택된 커넥터에 변경사항이 없을 때 */
  connectStatusNoChanges: '변경사항 없음',

  // ==========================================================================
  // 16. 주요 액션 버튼 안내 및 툴팁 (Action Buttons & Tooltips)
  // ==========================================================================
  /** [사용처] UI StepBadgesSection 안내 문구 | [조건] Add Step Badges 버튼 좌측에 상시 표시 */
  stepDescStartsFromNumber: '지정한 번호부터 시작',
  /** [사용처] UI StepBadgesSection 버튼 툴팁 | [조건] 시작 번호 미입력으로 버튼 비활성화 시 */
  stepTipEnterStartNumber: '시작 번호를 입력하세요',
  /** [사용처] UI StepBadgesSection 버튼 툴팁 | [조건] 시작 번호 입력되어 버튼 활성화 시 */
  stepTipAddStepBadges: '스텝 뱃지 추가',
  /** [사용처] UI ConnectSection 버튼 툴팁 | [조건] 선택된 커넥터에 적용할 변경사항이 없을 때 */
  connectTipNoChanges: '적용할 변경사항 없음',
  /** [사용처] UI ConnectSection 버튼 툴팁 | [조건] 선택된 커넥터의 옵션 변경사항 적용 준비 시 */
  connectTipApplyChanges: '커넥터 변경사항 적용',
  /** [사용처] UI ConnectSection 버튼 툴팁 | [조건] 2개 이상 선택된 노드 신규 연결 준비 시 */
  connectTipConnectNodes: '선택한 노드 연결',
};

const EN: Catalog = {
  // 1. Quota & Entitlement
  limitReached: 'Flooow elements are full ({current}/{limit}). Delete existing elements and try again.',

  // 2. Node CRUD
  nodeCreated: 'Created node "{title}"',
  nodeCreateFailed: 'Failed to create node: {error}',
  nodeNotFoundSelect: 'Node to edit not found. Select a node on the canvas.',
  nodeUpdated: 'Updated node "{title}"',
  nodeUpdateFailed: 'Failed to update node: {error}',
  nodesBatchUpdated: 'Updated {count} nodes',
  nodesBatchUpdateFailed: 'Failed to update nodes: {error}',
  nodeGone: 'Node not found.',

  // 3. Connect & Chain
  connectNodesNotFound: 'Nodes to connect not found.',
  connectNeedTwoDifferent: 'Select two different nodes to connect.',
  connectDone: 'Connected',
  connectDoneLabel: 'Connected with label "{label}"',
  connectCreateFailed: 'Failed to create connector: {error}',
  connectNeedTwoOrMore: 'Select 2 or more nodes to connect.',
  connectNeedTwoDifferentOrMore: 'Select 2 or more different nodes.',
  connectNeedTwo: 'Select 2 or more nodes to connect.',
  autoConnectDone: 'Orthogonal connection complete',
  autoConnectDoneLabel: 'Orthogonal connection complete with label "{label}"',
  autoChainDone: '⚡ Connected {nodes} nodes in sequence ({conns} connectors).',
  autoConnectFailed: 'Auto connect failed: {error}',
  chainExistsAll: 'All connections already exist.',
  chainCreatedPartial: '{created} connections created ({skipped} already connected)',
  chainCreated: '{created} connections created',
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
  connectorLineElbowed: '📐 Connector changed to orthogonal',
  connectorLineStraight: '📏 Connector changed to straight',
  connectorLineTypeFailed: 'Failed to change connector line type: {error}',
  connectorsNoneToConvert: 'No connectors on the canvas to convert.',
  connectorsConvertedAll: '⚡ Converted {count} connectors to orthogonal',
  connectorsAlreadyElbowed: '{count} connectors are already orthogonal',
  connectorsConvertFailed: 'Failed to convert connectors: {error}',

  // 5. Status Badge
  statusNeedSelection: 'Select 1 or more elements to set a status.',
  statusRemoved: 'Removed status badges from {count} nodes.',
  statusAttached: 'Attached status badge "{label}" to {count} nodes',

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
  tipRouteOrtho: 'Orthogonal',
  tipRouteSCurve: 'S-curve',
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
  tipPresetDims: '{name} {w}×{h}',
  tipPresetDisabledShape: 'Size presets are disabled for this shape',
  tipConnectorColor: 'Connector color',
  tipQuotaBlocked: 'Free limit reached. Upgrade to create more.',

  // 14. Shape Notices
  noticeSizeOnlyScreen: 'Size is only available for Screen nodes',
  noticeDescUnsupported: 'Description is not available for this shape',
  noticeElevationUnsupported: 'Elevation is not available for this shape',
  noticeStatusUnsupported: 'Status is not available for this shape',
  noticeStepUnsupported: 'Step Badges are not available for this shape',
  noticeLinkUnsupported: 'Reference Link is not available for this shape',
  noticeMixed: 'Not available for mixed selection',

  // 15. Connect Status Text
  connectStatusSelectNodes: 'Select 2+ nodes to connect',
  connectStatusReadyTwoNodes: '2 nodes ready to connect',
  connectStatusReadyMultiNodes: '{count} nodes ready to connect',
  connectStatusReady: 'Ready to connect',
  connectStatusChangesReady: 'Changes ready to apply',
  connectStatusConnected: 'Connected',
  connectStatusNoChanges: 'No changes',

  // 16. Action Buttons & Tooltips
  stepDescStartsFromNumber: 'Starts from the specified number',
  stepTipEnterStartNumber: 'Enter a start number',
  stepTipAddStepBadges: 'Add Step Badges',
  connectTipNoChanges: 'No changes to update',
  connectTipApplyChanges: 'Apply connector changes',
  connectTipConnectNodes: 'Connect selected nodes',
};

export function t(
  key: MessageKey,
  params?: Record<string, string | number>,
  locale?: AppLocale
): string {
  const catalog = (locale || activeLocale) === 'en' ? EN : KO;
  let text = catalog[key];
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.split(`{${name}}`).join(String(value));
    }
  }
  return text;
}
