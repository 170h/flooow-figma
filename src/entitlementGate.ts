/**
 * entitlementGate.ts — Flooow element 생성 Gate 정책 (순수 함수)
 *
 * Figma Plugin API, SceneNode, UI 및 전역 상태에 일체 의존하지 않는 순수 TypeScript 로직.
 * 생성 로직이 limit 숫자나 결제 상태를 직접 판단하지 않도록 정책을 한곳에 모은다.
 *
 * Step 2 범위: FREE 20개 제한 Gate 구조만. 결제 연동 없음.
 * - CreateEntitlement는 임시 2값 ('FREE' | 'PAID_ACTIVE').
 *   결제 상태는 clientStorage/pluginData에 저장하지 않는다 (Core stub에서 'FREE' 고정).
 * - 실제 usage count는 Step 1 getFlooowElementCount() live recount로 공급한다.
 */

export const FREE_ELEMENT_LIMIT = 20;

export type CreateEntitlement = 'FREE' | 'PAID_ACTIVE';

export type CreateGateReason = 'PAID_ACTIVE' | 'WITHIN_LIMIT' | 'LIMIT_EXCEEDED';

/**
 * Figma Plugin Payments 상태 → Gate entitlement 정규화 (순수).
 * - 'PAID' → 'PAID_ACTIVE'. 그 외(UNPAID/NOT_SUPPORTED/미선언/unknown) → 'FREE'.
 * - NOT_SUPPORTED는 공식 문서상 오류 취급 (유료 기능 부여 금지) → FREE.
 * - 만료 시각 등 상세 정보는 Payments API가 제공하지 않으므로 다루지 않음 (Step 4 범위 외).
 */
export function normalizePaymentStatus(
  statusType: string | null | undefined
): CreateEntitlement {
  return statusType === 'PAID' ? 'PAID_ACTIVE' : 'FREE';
}

export interface CreateGateRequest {
  currentCount: number;
  requestedCount: number;
  entitlement: CreateEntitlement;
  limit?: number;
}

export interface CreateGateResult {
  allowed: boolean;
  currentCount: number;
  requestedCount: number;
  limit: number;
  entitlement: CreateEntitlement;
  reason: CreateGateReason;
}

/**
 * 생성 승인 판정 (순수).
 * - PAID_ACTIVE → 항상 허용 (count 무관).
 * - FREE → currentCount + requestedCount <= limit 일 때만 허용.
 * - batch/chain은 호출자가 실제 신규 수량을 먼저 확정 후 1회 호출 (원자 승인).
 */
export function canCreateFlooowElements(request: CreateGateRequest): CreateGateResult {  const limit = request.limit ?? FREE_ELEMENT_LIMIT;
  const currentCount = Math.max(0, Math.floor(request.currentCount));
  const requestedCount = Math.max(0, Math.floor(request.requestedCount));
  const entitlement = request.entitlement;

  if (entitlement === 'PAID_ACTIVE') {
    return {
      allowed: true,
      currentCount,
      requestedCount,
      limit,
      entitlement,
      reason: 'PAID_ACTIVE',
    };
  }

  const allowed = currentCount + requestedCount <= limit;
  return {
    allowed,
    currentCount,
    requestedCount,
    limit,
    entitlement,
    reason: allowed ? 'WITHIN_LIMIT' : 'LIMIT_EXCEEDED',
  };
}

/**
 * Core Usage 상태 (Step 3).
 * - count는 항상 live recount 값으로 공급한다 (저장값 사용 금지).
 * - canCreate는 "1개를 더 만들 수 있는지" 표시용 판정 (gate의 requestedCount와 별개).
 */
export interface FlooowUsageState {
  nodes: number;
  connectors: number;
  total: number;
  limit: number;
  entitlement: CreateEntitlement;
  canCreate: boolean;
}

export function assembleFlooowUsage(
  count: { nodes: number; connectors: number; total: number },
  entitlement: CreateEntitlement
): FlooowUsageState {
  const gate = canCreateFlooowElements({
    currentCount: count.total,
    requestedCount: 1,
    entitlement,
  });
  return {
    nodes: count.nodes,
    connectors: count.connectors,
    total: count.total,
    limit: gate.limit,
    entitlement,
    canCreate: gate.allowed,
  };
}
