/**
 * flowExport.ts — Flooow 플로우 Export용 순수 모듈 (Figma API·React 무의존)
 *
 * MVP 범위: Export 데이터 스키마 v1 + Copy for AI 텍스트 + Download JSON 페이로드.
 * - Download JSON: 손실 없는 구조화 스키마. schemaVersion으로 버전 관리
 *   (노드 데이터의 schema_version과는 별개).
 * - Copy for AI: 의미 중심 텍스트. 좌표·색상·내부 ID는 제외하고
 *   노드 유형·제목·순서·분기·순환·설명·상태·링크만 남긴다.
 * - AI 텍스트 문법은 동결 취급: 프롬프트 템플릿이 이 문법에 의존한다.
 *
 * AI 텍스트 문법 (v1, 변경 시 프롬프트 템플릿도 함께 갱신할 것):
 * - `# {title}` + `Flooow flow export v1 · {N} nodes, {M} connections.`
 * - `### Path {k} (starts at {Title})` — 시작점(진입 간선 없음)부터 DFS 방문 순서대로 번호
 * - 노드 행: `{n}. [{Type}] {Title} [#step] [Branch..] — {desc} (status: {s}) (link: {url})`
 *   (해당 항목이 있을 때만 표시, 없는 부분은 생략)
 * - 간선: 라벨 있음 → `— {label} → {m}. {Title}`, 단일 무라벨 → `→ {m}. {Title}`,
 *   복수 무라벨 → `→ {m}. {A}, {n}. {B} (no condition)`
 * - 재방문: `{m}. {Title} (see {m})`, DFS 스택 내 순환 간선은 `↩` 표시
 * - 고립 노드: `### Unconnected nodes`에 불릿으로 분리
 * - 중복 제목: 두 번째부터 `Title (2)` 형태로 구분
 */

export const FLOW_EXPORT_SCHEMA_VERSION = '1.0' as const;

export interface FlowInputNode {
  /** 내부 식별자 (Figma node id). 토폴로지 추적용이며 AI 텍스트에는 노출하지 않는다. */
  id: string;
  /** 정규화된 노드 타입 ('Screen' | 'Decision' | 'Branch' | …) */
  type: string;
  title: string;
  description?: string;
  status?: string;
  stepNumber?: number;
  /** Branch 노드 한정 ('CHECK' | 'CROSS' | 'TAG' | 'SQUARE' | 'DIAMOND' | 'CIRCLE') */
  branchVariant?: string;
  /** TAG 변형의 사용자 텍스트 (기본 제목이면 생략) */
  branchText?: string;
  /** 참조 링크 (figma_link 원문) */
  link?: string;
}

export interface FlowInputEdge {
  source: string;
  target: string;
  /** 커넥터 라벨 (Yes/No 등). 없으면 무라벨. */
  label?: string;
}

/** 엣지 조건 분류 (해석이 아닌 분류만 — 의미 추측 금지) */
export type EdgeConditionKind = 'labeled' | 'branch' | 'fanout' | 'link';

export interface FlowJsonNode {
  id: string;
  type: string;
  title: string;
  description?: string;
  status?: string;
  stepNumber?: number;
  branchVariant?: string;
  branchText?: string;
  /** CHECK=true / CROSS=false (확정된 관례). 그 외 변형은 없음. */
  branchMeaning?: 'true' | 'false';
  link?: string;
}

export interface FlowJsonEdge {
  source: string;
  target: string;
  label?: string;
  condition: EdgeConditionKind;
}

export interface FlowExportJson {
  schemaVersion: typeof FLOW_EXPORT_SCHEMA_VERSION;
  meta: {
    title: string;
    exportedAt: string;
    nodeCount: number;
    edgeCount: number;
    generator: string;
  };
  nodes: FlowJsonNode[];
  edges: FlowJsonEdge[];
}

export interface BuiltFlowExport {
  json: FlowExportJson;
  jsonText: string;
  aiText: string;
  nodeCount: number;
  edgeCount: number;
  empty: boolean;
}

const BRANCH_MEANING: Record<string, 'true' | 'false'> = {
  CHECK: 'true',
  CROSS: 'false',
};

function cleanText(value: string | undefined): string | undefined {
  if (value == null) return undefined;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function typeTag(node: FlowJsonNode): string {
  if (node.type === 'Branch' && node.branchVariant) {
    const variant = node.branchVariant;
    if (variant === 'TAG') {
      return node.branchText ? `[Branch:Tag "${node.branchText}"]` : '[Branch:Tag]';
    }
    if (variant === 'CHECK') return '[Branch:Check=true]';
    if (variant === 'CROSS') return '[Branch:Cross=false]';
    return `[Branch:${variant}]`;
  }
  return `[${node.type}]`;
}

export function buildFlowExport(input: {
  title: string;
  exportedAt: string;
  nodes: FlowInputNode[];
  edges: FlowInputEdge[];
}): BuiltFlowExport {
  const title = input.title && input.title.trim() ? input.title.trim() : 'Untitled flow';

  // 1. 노드 정규화 (중복 제목 구분 번호는 방문 순서대로 부여하므로 2패스에서 처리)
  const jsonNodes: FlowJsonNode[] = input.nodes.map((n) => {
    const branchVariant =
      n.type === 'Branch' && n.branchVariant ? n.branchVariant : undefined;
    const node: FlowJsonNode = {
      id: n.id,
      type: n.type,
      title: n.title,
    };
    const desc = cleanText(n.description);
    if (desc !== undefined) node.description = desc;
    const status = cleanText(n.status);
    if (status !== undefined) node.status = status;
    if (typeof n.stepNumber === 'number' && Number.isFinite(n.stepNumber)) {
      node.stepNumber = n.stepNumber;
    }
    if (branchVariant !== undefined) {
      node.branchVariant = branchVariant;
      const meaning = BRANCH_MEANING[branchVariant];
      if (meaning !== undefined) node.branchMeaning = meaning;
      const text = cleanText(n.branchText);
      if (branchVariant === 'TAG' && text !== undefined) node.branchText = text;
    }
    const link = cleanText(n.link);
    if (link !== undefined) node.link = link;
    return node;
  });
  const byId = new Map<string, FlowJsonNode>();
  for (const n of jsonNodes) {
    if (!byId.has(n.id)) byId.set(n.id, n);
  }

  // 2. 엣지 정규화 (양끝이 모두 노드 집합에 있을 때만 유지, 완전 중복 제거)
  const outDegree = new Map<string, number>();
  const inDegree = new Map<string, number>();
  const seenEdges = new Set<string>();
  const jsonEdges: FlowJsonEdge[] = [];
  for (const e of input.edges) {
    if (!e || !byId.has(e.source) || !byId.has(e.target)) continue;
    const label = cleanText(e.label);
    const dedupeKey = `${e.source}\u0000${e.target}\u0000${label ?? ''}`;
    if (seenEdges.has(dedupeKey)) continue;
    seenEdges.add(dedupeKey);
    const sourceNode = byId.get(e.source) as FlowJsonNode;
    let condition: EdgeConditionKind;
    if (label !== undefined) {
      condition = 'labeled';
    } else if (sourceNode.type === 'Branch') {
      condition = 'branch';
    } else {
      condition = 'link';
    }
    const edge: FlowJsonEdge = { source: e.source, target: e.target, condition };
    if (label !== undefined) edge.label = label;
    jsonEdges.push(edge);
    outDegree.set(e.source, (outDegree.get(e.source) ?? 0) + 1);
    inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1);
  }
  // 무라벨 fan-out 확정 (out-degree > 1인 출처의 무라벨 엣지)
  for (const edge of jsonEdges) {
    if (
      edge.condition === 'link' &&
      (outDegree.get(edge.source) ?? 0) > 1
    ) {
      edge.condition = 'fanout';
    }
  }

  const adjacency = new Map<string, FlowJsonEdge[]>();
  for (const edge of jsonEdges) {
    const list = adjacency.get(edge.source);
    if (list) list.push(edge);
    else adjacency.set(edge.source, [edge]);
  }

  // 3. AI 텍스트 (DFS 방문 순서 번호, 순환 가드)
  const displayName = new Map<string, string>();
  const titleCount = new Map<string, number>();
  const order: string[] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const cycleEdges = new Set<FlowJsonEdge>();
  function visit(id: string): void {
    if (visited.has(id)) return;
    visited.add(id);
    visiting.add(id);
    order.push(id);
    const node = byId.get(id) as FlowJsonNode;
    const base = node.title && node.title.trim() ? node.title.trim() : node.type;
    const occurrence = (titleCount.get(base) ?? 0) + 1;
    titleCount.set(base, occurrence);
    displayName.set(id, occurrence > 1 ? `${base} (${occurrence})` : base);
    for (const edge of adjacency.get(id) ?? []) {
      if (visiting.has(edge.target)) cycleEdges.add(edge);
      visit(edge.target);
    }
    visiting.delete(id);
  }

  const starts: string[] = [];
  const isolated: string[] = [];
  for (const n of jsonNodes) {
    const hasIn = (inDegree.get(n.id) ?? 0) > 0;
    const hasOut = (adjacency.get(n.id) ?? []).length > 0;
    if (!hasIn && !hasOut) {
      isolated.push(n.id);
    } else if (!hasIn) {
      starts.push(n.id);
    }
  }
  // 진입 간선이 없는 시작점부터, 남은 미방문(순환 컴포넌트)은 입력 순서대로
  const pathRoots: string[][] = [];
  for (const id of starts) {
    if (visited.has(id)) continue;
    const before = order.length;
    visit(id);
    pathRoots.push(order.slice(before));
  }
  for (const n of jsonNodes) {
    if (!visited.has(n.id) && !isolated.includes(n.id)) {
      const before = order.length;
      visit(n.id);
      pathRoots.push(order.slice(before));
    }
  }
  for (const id of isolated) {
    if (!visited.has(id)) visit(id);
  }

  const numberOf = new Map<string, number>();
  order.forEach((id, index) => numberOf.set(id, index + 1));

  function detailSuffix(node: FlowJsonNode): string {
    const parts: string[] = [];
    if (typeof node.stepNumber === 'number') parts.push(`#${node.stepNumber}`);
    const desc = node.description;
    if (desc !== undefined) parts.push(`— ${desc}`);
    if (node.status !== undefined) parts.push(`(status: ${node.status})`);
    if (node.link !== undefined) parts.push(`(link: ${node.link})`);
    return parts.length > 0 ? ` ${parts.join(' ')}` : '';
  }

  function edgeRef(edge: FlowJsonEdge): string {
    const num = numberOf.get(edge.target) as number;
    const name = `${num}. ${displayName.get(edge.target) as string}`;
    const cycleMark = cycleEdges.has(edge) ? ' ↩' : '';
    if (edge.label !== undefined) return `— ${edge.label} → ${name}${cycleMark}`;
    return `→ ${name}${cycleMark}`;
  }

  const lines: string[] = [];
  lines.push(`# ${title}`);
  lines.push(`Flooow flow export v1 · ${jsonNodes.length} nodes, ${jsonEdges.length} connections.`);
  lines.push('');
  if (jsonNodes.length === 0) {
    lines.push('No flow nodes on this page.');
  } else {
    lines.push('## Flows');
    lines.push('');
    let pathIndex = 0;
    for (const path of pathRoots) {
      pathIndex += 1;
      lines.push(`### Path ${pathIndex} (starts at ${displayName.get(path[0]) as string})`);
      for (const id of path) {
        const node = byId.get(id) as FlowJsonNode;
        const num = numberOf.get(id) as number;
        lines.push(`${num}. ${typeTag(node)} ${displayName.get(id) as string}${detailSuffix(node)}`);
        const out = adjacency.get(id) ?? [];
        const unlabeled = out.filter((e) => e.label === undefined);
        const labeled = out.filter((e) => e.label !== undefined);
        for (const edge of labeled) {
          lines.push(`   ${edgeRef(edge)}`);
        }
        if (unlabeled.length === 1) {
          lines.push(`   ${edgeRef(unlabeled[0])}`);
        } else if (unlabeled.length > 1) {
          lines.push(`   ${unlabeled.map((e) => edgeRef(e)).join(', ')} (no condition)`);
        }
      }
      lines.push('');
    }
    if (isolated.length > 0) {
      lines.push('### Unconnected nodes');
      for (const id of isolated) {
        const node = byId.get(id) as FlowJsonNode;
        const num = numberOf.get(id) as number;
        lines.push(`- ${num}. ${typeTag(node)} ${displayName.get(id) as string}${detailSuffix(node)}`);
      }
      lines.push('');
    }
  }

  const json: FlowExportJson = {
    schemaVersion: FLOW_EXPORT_SCHEMA_VERSION,
    meta: {
      title,
      exportedAt: input.exportedAt,
      nodeCount: jsonNodes.length,
      edgeCount: jsonEdges.length,
      generator: 'flooow-export/1.0',
    },
    nodes: jsonNodes,
    edges: jsonEdges,
  };

  return {
    json,
    jsonText: JSON.stringify(json, null, 2),
    aiText: lines.join('\n'),
    nodeCount: jsonNodes.length,
    edgeCount: jsonEdges.length,
    empty: jsonNodes.length === 0 && jsonEdges.length === 0,
  };
}
