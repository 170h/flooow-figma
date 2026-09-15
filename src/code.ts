import {
  WorkflowStatus,
  STATUS_CONFIG,
  FrameStatusItem,
  PluginAction,
  CoreToUIMessage,
} from './types';

// 플러그인 UI 창 열기 (Figma 테마 색상 호환)
figma.showUI(__html__, {
  width: 360,
  height: 560,
  themeColors: true,
  title: 'UI Flow Diagram',
});

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

// 토스트 알림 전송
function notify(message: string, level: 'info' | 'success' | 'warning' | 'error' = 'info') {
  figma.notify(message, { error: level === 'error' });
  postToUI({ type: 'TOAST', message, level });
}

// 캔버스 내 상태가 지정된 모든 노드 검색
function collectStatusItems(): FrameStatusItem[] {
  const nodes = figma.currentPage.findAll((node) => {
    return Boolean(node.getPluginData('workflow_status'));
  });

  return nodes.map((node) => {
    const status = node.getPluginData('workflow_status') as WorkflowStatus;
    return {
      id: node.id,
      name: node.name,
      status: status || 'draft',
      x: Math.round(node.x),
      y: Math.round(node.y),
    };
  });
}

// 현재 상태 목록을 UI에 동기화
function syncStatusList() {
  const items = collectStatusItems();
  postToUI({ type: 'STATUS_LIST_UPDATED', items });
}

// 선택 영역 변경 감지 시 UI 갱신
function handleSelectionChange() {
  const selection = figma.currentPage.selection;
  const count = selection.length;
  const names = selection.map((n) => n.name);

  let currentStatus: WorkflowStatus | undefined;
  if (count === 1) {
    const saved = selection[0].getPluginData('workflow_status') as WorkflowStatus;
    if (saved) currentStatus = saved;
  }

  postToUI({
    type: 'SELECTION_CHANGED',
    count,
    names,
    currentStatus,
  });
}

figma.on('selectionchange', handleSelectionChange);

// 1. 상태 뱃지 생성 및 부착 로직
async function applyStatusToSelected(status: WorkflowStatus) {
  const selection = figma.currentPage.selection;
  if (selection.length === 0) {
    notify('상태를 지정할 프레임이나 요소를 1개 이상 선택해 주세요.', 'warning');
    return;
  }

  await loadRequiredFonts();
  const config = STATUS_CONFIG[status];

  for (const node of selection) {
    // 노드 메타데이터 저장
    node.setPluginData('workflow_status', status);

    // 기존 부착된 뱃지 프레임 탐색 및 제거
    const parent = node.parent || figma.currentPage;
    const badgeName = `[Status] ${node.id}`;
    const existingBadge = parent.findOne(
      (n) => n.name === badgeName || n.getPluginData('status_badge_for') === node.id
    );
    if (existingBadge) {
      existingBadge.remove();
    }

    // 신규 상태 뱃지 프레임 생성
    const badge = figma.createFrame();
    badge.name = badgeName;
    badge.setPluginData('status_badge_for', node.id);
    badge.layoutMode = 'HORIZONTAL';
    badge.primaryAxisSizingMode = 'AUTO';
    badge.counterAxisSizingMode = 'AUTO';
    badge.paddingLeft = 10;
    badge.paddingRight = 10;
    badge.paddingTop = 4;
    badge.paddingBottom = 4;
    badge.itemSpacing = 6;
    badge.cornerRadius = 6;
    badge.primaryAxisAlignItems = 'CENTER';
    badge.counterAxisAlignItems = 'CENTER';

    // 뱃지 배경색
    badge.fills = [
      {
        type: 'SOLID',
        color: config.color,
      },
    ];

    // 상태 인디케이터 점(Dot)
    const dot = figma.createEllipse();
    dot.resize(6, 6);
    dot.fills = [
      {
        type: 'SOLID',
        color: config.textColor,
      },
    ];
    badge.appendChild(dot);

    // 뱃지 텍스트
    const text = figma.createText();
    text.fontName = { family: 'Inter', style: 'Bold' };
    text.characters = config.label.toUpperCase();
    text.fontSize = 11;
    text.fills = [
      {
        type: 'SOLID',
        color: config.textColor,
      },
    ];
    badge.appendChild(text);

    // 위치 지정: 대상 노드의 바로 위
    badge.x = node.x;
    badge.y = node.y - badge.height - 8;

    // 부모 컨테이너에 배치
    parent.appendChild(badge);
  }

  syncStatusList();
  notify(`${selection.length}개 요소의 상태가 [${config.label}]로 업데이트되었습니다.`, 'success');
}

// 2. 화면 간 커넥터(화살표 및 라벨) 생성 로직
async function createConnectors(label?: string, lineStyle: 'solid' | 'dashed' = 'solid') {
  const selection = [...figma.currentPage.selection];
  if (selection.length < 2) {
    notify('연결할 프레임을 2개 이상 선택해 주세요.', 'warning');
    return;
  }

  // X 좌표 기준으로 정렬하여 순차적 연결
  selection.sort((a, b) => a.x - b.x);
  await loadRequiredFonts();

  const createdNodes: SceneNode[] = [];

  for (let i = 0; i < selection.length - 1; i++) {
    const fromNode = selection[i];
    const toNode = selection[i + 1];

    // 시작점 (From 노드의 우측 중앙)
    const startX = fromNode.x + fromNode.width;
    const startY = fromNode.y + fromNode.height / 2;

    // 도착점 (To 노드의 좌측 중앙)
    const endX = toNode.x;
    const endY = toNode.y + toNode.height / 2;

    // 커넥터 벡터 라인 생성
    const connector = figma.createVector();
    connector.name = `[Flow] ${fromNode.name} → ${toNode.name}`;

    // 수평 이동 후 대각선 또는 직선 경로 계산
    const deltaX = endX - startX;
    const deltaY = endY - startY;

    // 베지어 곡선 패스 생성 (부드러운 플로우 표현)
    const midX = deltaX / 2;
    const pathData = `M 0 0 C ${midX} 0, ${midX} ${deltaY}, ${deltaX} ${deltaY}`;

    connector.vectorPaths = [
      {
        windingRule: 'NONE',
        data: pathData,
      },
    ];

    connector.x = startX;
    connector.y = startY;

    connector.strokes = [
      {
        type: 'SOLID',
        color: { r: 0.38, g: 0.45, b: 0.55 }, // 모던 슬레이트 블루
      },
    ];
    connector.strokeWeight = 2;
    connector.strokeCap = 'ROUND';
    connector.strokeJoin = 'ROUND';

    if (lineStyle === 'dashed') {
      connector.dashPattern = [6, 4];
    }

    createdNodes.push(connector);

    // 도착점에 화살표 머리(Polygon) 부착
    const arrowHead = figma.createPolygon();
    arrowHead.name = 'Arrowhead';
    arrowHead.resize(10, 10);
    arrowHead.rotation = -90; // 오른쪽 방향
    arrowHead.x = endX;
    arrowHead.y = endY + 5;
    arrowHead.fills = [
      {
        type: 'SOLID',
        color: { r: 0.38, g: 0.45, b: 0.55 },
      },
    ];
    createdNodes.push(arrowHead);

    // 라벨 텍스트가 있을 경우 중앙에 뱃지 생성
    if (label && label.trim() !== '') {
      const labelBadge = figma.createFrame();
      labelBadge.name = `[Label] ${label}`;
      labelBadge.layoutMode = 'HORIZONTAL';
      labelBadge.primaryAxisSizingMode = 'AUTO';
      labelBadge.counterAxisSizingMode = 'AUTO';
      labelBadge.paddingLeft = 8;
      labelBadge.paddingRight = 8;
      labelBadge.paddingTop = 3;
      labelBadge.paddingBottom = 3;
      labelBadge.cornerRadius = 4;
      labelBadge.fills = [{ type: 'SOLID', color: { r: 0.95, g: 0.96, b: 0.98 } }];
      labelBadge.strokes = [{ type: 'SOLID', color: { r: 0.82, g: 0.85, b: 0.9 } }];
      labelBadge.strokeWeight = 1;

      const labelText = figma.createText();
      labelText.fontName = { family: 'Inter', style: 'Medium' };
      labelText.characters = label;
      labelText.fontSize = 11;
      labelText.fills = [{ type: 'SOLID', color: { r: 0.2, g: 0.25, b: 0.33 } }];
      labelBadge.appendChild(labelText);

      labelBadge.x = startX + deltaX / 2 - 20;
      labelBadge.y = startY + deltaY / 2 - 12;

      createdNodes.push(labelBadge);
    }
  }

  // 생성된 커넥터 요소들을 하나의 그룹으로 묶기
  if (createdNodes.length > 0) {
    const group = figma.group(createdNodes, figma.currentPage);
    group.name = `User Flow Connectors (${selection.length} Screens)`;
    figma.currentPage.selection = [group];
  }

  notify(`${selection.length - 1}개의 유저 플로우 연결선이 생성되었습니다.`, 'success');
}

// 3. 스텝 번호 뱃지 일괄 부착 로직
async function addStepBadges(startNumber: number = 1) {
  const selection = [...figma.currentPage.selection];
  if (selection.length === 0) {
    notify('스텝 번호를 매길 프레임을 선택해 주세요.', 'warning');
    return;
  }

  // X 좌표 기준 정렬
  selection.sort((a, b) => a.x - b.x);
  await loadRequiredFonts();

  let currentNum = startNumber;

  for (const node of selection) {
    // 기존 스텝 뱃지 삭제
    const parent = node.parent || figma.currentPage;
    const badgeName = `[Step Badge] ${node.id}`;
    const oldBadge = parent.findOne((n) => n.name === badgeName);
    if (oldBadge) oldBadge.remove();

    // 원형 스텝 뱃지 프레임 생성
    const stepBadge = figma.createFrame();
    stepBadge.name = badgeName;
    stepBadge.layoutMode = 'HORIZONTAL';
    stepBadge.primaryAxisSizingMode = 'FIXED';
    stepBadge.counterAxisSizingMode = 'FIXED';
    stepBadge.resize(28, 28);
    stepBadge.cornerRadius = 14;
    stepBadge.primaryAxisAlignItems = 'CENTER';
    stepBadge.counterAxisAlignItems = 'CENTER';
    stepBadge.fills = [{ type: 'SOLID', color: { r: 0.12, g: 0.14, b: 0.18 } }];

    // 스텝 번호 텍스트
    const stepText = figma.createText();
    stepText.fontName = { family: 'Inter', style: 'Bold' };
    stepText.characters = String(currentNum);
    stepText.fontSize = 12;
    stepText.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    stepBadge.appendChild(stepText);

    // 프레임 좌상단 바깥쪽에 배치
    stepBadge.x = node.x - 12;
    stepBadge.y = node.y - 12;

    parent.appendChild(stepBadge);
    currentNum++;
  }

  notify(`${selection.length}개 프레임에 스텝 번호가 부여되었습니다.`, 'success');
}

// 4. 워크플로우 템플릿 생성 로직
async function createWorkflowTemplate(type: 'user_flow' | 'screen_spec' | 'feature_roadmap') {
  await loadRequiredFonts();

  // 중앙 뷰포트 위치 계산
  const center = figma.viewport.center;

  // 마스터 워크플로우 섹션 컨테이너 생성
  const section = figma.createSection();
  section.name = `📋 Workflow - ${type.toUpperCase()}`;
  section.x = center.x - 600;
  section.y = center.y - 400;
  section.resizeWithoutConstraints(1280, 800);

  // 헤더 타이틀 프레임
  const header = figma.createFrame();
  header.name = 'Header Info';
  header.layoutMode = 'VERTICAL';
  header.primaryAxisSizingMode = 'AUTO';
  header.counterAxisSizingMode = 'AUTO';
  header.itemSpacing = 8;
  header.fills = [];
  header.x = section.x + 40;
  header.y = section.y + 40;

  const title = figma.createText();
  title.fontName = { family: 'Inter', style: 'Bold' };
  title.fontSize = 24;
  title.characters =
    type === 'user_flow'
      ? 'Feature User Flow & Journey'
      : type === 'screen_spec'
      ? 'UI Screen Specification'
      : 'Feature Roadmap & Milestones';
  title.fills = [{ type: 'SOLID', color: { r: 0.1, g: 0.12, b: 0.16 } }];
  header.appendChild(title);

  const desc = figma.createText();
  desc.fontName = { family: 'Inter', style: 'Regular' };
  desc.fontSize = 13;
  desc.characters = '작업 담당자:              작성일자: ' + new Date().toISOString().slice(0, 10);
  desc.fills = [{ type: 'SOLID', color: { r: 0.45, g: 0.5, b: 0.58 } }];
  header.appendChild(desc);

  // 표준 워크플로우 카드 3개 나란히 생성
  const cardWidth = 360;
  const cardHeight = 520;
  const startCardX = section.x + 40;
  const startCardY = section.y + 130;
  const gap = 30;

  const cardTitles =
    type === 'user_flow'
      ? ['1. Entry & Discovery', '2. Core Interaction', '3. Completion / Feedback']
      : type === 'screen_spec'
      ? ['Main View (Default)', 'State Variations (Hover/Active)', 'Edge Case & Errors']
      : ['Phase 1: MVP Scope', 'Phase 2: Enhancements', 'Phase 3: Scale & Refine'];

  for (let i = 0; i < 3; i++) {
    const card = figma.createFrame();
    card.name = cardTitles[i];
    card.resize(cardWidth, cardHeight);
    card.x = startCardX + i * (cardWidth + gap);
    card.y = startCardY;
    card.cornerRadius = 12;
    card.fills = [{ type: 'SOLID', color: { r: 0.98, g: 0.98, b: 0.99 } }];
    card.strokes = [{ type: 'SOLID', color: { r: 0.88, g: 0.9, b: 0.93 } }];
    card.strokeWeight = 1;

    // 카드 헤더
    const cardHeader = figma.createText();
    cardHeader.fontName = { family: 'Inter', style: 'Bold' };
    cardHeader.fontSize = 14;
    cardHeader.characters = cardTitles[i];
    cardHeader.x = 20;
    cardHeader.y = 20;
    cardHeader.fills = [{ type: 'SOLID', color: { r: 0.2, g: 0.25, b: 0.3 } }];
    card.appendChild(cardHeader);

    // 카드 설명 가이드
    const cardGuide = figma.createText();
    cardGuide.fontName = { family: 'Inter', style: 'Regular' };
    cardGuide.fontSize = 12;
    cardGuide.characters = '이곳에 해당 단계의 화면 또는 상세 명세를 배치하세요.';
    cardGuide.x = 20;
    cardGuide.y = 48;
    cardGuide.fills = [{ type: 'SOLID', color: { r: 0.6, g: 0.65, b: 0.72 } }];
    card.appendChild(cardGuide);

    // 초기 상태 뱃지 부여
    card.setPluginData('workflow_status', 'draft');
  }

  figma.currentPage.selection = [section];
  figma.viewport.scrollAndZoomIntoView([section]);
  syncStatusList();
  notify('표준 워크플로우 템플릿이 캔버스에 생성되었습니다.', 'success');
}

// 5. 프레임 포커스 이동 핸들러
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

// UI로부터의 메시지 수신 처리
figma.ui.onmessage = async (msg: PluginAction) => {
  switch (msg.type) {
    case 'CREATE_CONNECTORS':
      await createConnectors(msg.label, msg.lineStyle);
      break;
    case 'ADD_STEP_BADGES':
      await addStepBadges(msg.startNumber || 1);
      break;
    case 'SET_STATUS':
      await applyStatusToSelected(msg.status);
      break;
    case 'GET_STATUS_LIST':
      syncStatusList();
      break;
    case 'FOCUS_FRAME':
      focusFrame(msg.nodeId);
      break;
    case 'CREATE_TEMPLATE':
      await createWorkflowTemplate(msg.templateType);
      break;
  }
};

// 최초 실행 시 현재 선택 상태 및 상태 목록 동기화
handleSelectionChange();
syncStatusList();
