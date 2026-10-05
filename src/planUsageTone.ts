/**
 * Plan & Usage 모달의 남은 수량 색 (Figma UI3 시안).
 * - 6개 이상: secondary
 * - 4–5: warning
 * - 2–3: danger
 * - 1: assistive pink
 * - 0 / limit: red
 * - Pro: lavender Unlimited
 */
export type UsageRemainingTone =
  | 'calm'
  | 'warning'
  | 'danger'
  | 'critical'
  | 'reached'
  | 'unlimited';

export function usageRemainingTone(
  remaining: number,
  options: { paid: boolean; limitReached: boolean }
): UsageRemainingTone {
  if (options.paid) return 'unlimited';
  if (options.limitReached || remaining <= 0) return 'reached';
  if (remaining <= 1) return 'critical';
  if (remaining <= 3) return 'danger';
  if (remaining <= 5) return 'warning';
  return 'calm';
}
