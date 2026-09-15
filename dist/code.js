"use strict";
(() => {
  // src/types.ts
  var STATUS_CONFIG = {
    draft: {
      label: "Draft",
      color: { r: 0.55, g: 0.58, b: 0.63 },
      // #8C94A0
      textColor: { r: 1, g: 1, b: 1 },
      hex: "#8C94A0"
    },
    in_progress: {
      label: "In Progress",
      color: { r: 0.16, g: 0.5, b: 0.98 },
      // #2980FA
      textColor: { r: 1, g: 1, b: 1 },
      hex: "#2980FA"
    },
    in_review: {
      label: "In Review",
      color: { r: 0.96, g: 0.62, b: 0.05 },
      // #F59E0B
      textColor: { r: 0.1, g: 0.1, b: 0.1 },
      hex: "#F59E0B"
    },
    approved: {
      label: "Approved",
      color: { r: 0.55, g: 0.36, b: 0.96 },
      // #8C5CF6
      textColor: { r: 1, g: 1, b: 1 },
      hex: "#8C5CF6"
    },
    ready_for_dev: {
      label: "Ready for Dev",
      color: { r: 0.06, g: 0.72, b: 0.51 },
      // #10B981
      textColor: { r: 1, g: 1, b: 1 },
      hex: "#10B981"
    }
  };

  // src/code.ts
  figma.showUI(__html__, {
    width: 360,
    height: 560,
    themeColors: true,
    title: "UI Flow Diagram"
  });
  async function loadRequiredFonts() {
    await Promise.all([
      figma.loadFontAsync({ family: "Inter", style: "Regular" }),
      figma.loadFontAsync({ family: "Inter", style: "Medium" }),
      figma.loadFontAsync({ family: "Inter", style: "Bold" })
    ]);
  }
  function postToUI(msg) {
    figma.ui.postMessage(msg);
  }
  function notify(message, level = "info") {
    figma.notify(message, { error: level === "error" });
    postToUI({ type: "TOAST", message, level });
  }
  function collectStatusItems() {
    const nodes = figma.currentPage.findAll((node) => {
      return Boolean(node.getPluginData("workflow_status"));
    });
    return nodes.map((node) => {
      const status = node.getPluginData("workflow_status");
      return {
        id: node.id,
        name: node.name,
        status: status || "draft",
        x: Math.round(node.x),
        y: Math.round(node.y)
      };
    });
  }
  function syncStatusList() {
    const items = collectStatusItems();
    postToUI({ type: "STATUS_LIST_UPDATED", items });
  }
  function handleSelectionChange() {
    const selection = figma.currentPage.selection;
    const count = selection.length;
    const names = selection.map((n) => n.name);
    let currentStatus;
    if (count === 1) {
      const saved = selection[0].getPluginData("workflow_status");
      if (saved) currentStatus = saved;
    }
    postToUI({
      type: "SELECTION_CHANGED",
      count,
      names,
      currentStatus
    });
  }
  figma.on("selectionchange", handleSelectionChange);
  async function applyStatusToSelected(status) {
    const selection = figma.currentPage.selection;
    if (selection.length === 0) {
      notify("\uC0C1\uD0DC\uB97C \uC9C0\uC815\uD560 \uD504\uB808\uC784\uC774\uB098 \uC694\uC18C\uB97C 1\uAC1C \uC774\uC0C1 \uC120\uD0DD\uD574 \uC8FC\uC138\uC694.", "warning");
      return;
    }
    await loadRequiredFonts();
    const config = STATUS_CONFIG[status];
    for (const node of selection) {
      node.setPluginData("workflow_status", status);
      const parent = node.parent || figma.currentPage;
      const badgeName = `[Status] ${node.id}`;
      const existingBadge = parent.findOne(
        (n) => n.name === badgeName || n.getPluginData("status_badge_for") === node.id
      );
      if (existingBadge) {
        existingBadge.remove();
      }
      const badge = figma.createFrame();
      badge.name = badgeName;
      badge.setPluginData("status_badge_for", node.id);
      badge.layoutMode = "HORIZONTAL";
      badge.primaryAxisSizingMode = "AUTO";
      badge.counterAxisSizingMode = "AUTO";
      badge.paddingLeft = 10;
      badge.paddingRight = 10;
      badge.paddingTop = 4;
      badge.paddingBottom = 4;
      badge.itemSpacing = 6;
      badge.cornerRadius = 6;
      badge.primaryAxisAlignItems = "CENTER";
      badge.counterAxisAlignItems = "CENTER";
      badge.fills = [
        {
          type: "SOLID",
          color: config.color
        }
      ];
      const dot = figma.createEllipse();
      dot.resize(6, 6);
      dot.fills = [
        {
          type: "SOLID",
          color: config.textColor
        }
      ];
      badge.appendChild(dot);
      const text = figma.createText();
      text.fontName = { family: "Inter", style: "Bold" };
      text.characters = config.label.toUpperCase();
      text.fontSize = 11;
      text.fills = [
        {
          type: "SOLID",
          color: config.textColor
        }
      ];
      badge.appendChild(text);
      badge.x = node.x;
      badge.y = node.y - badge.height - 8;
      parent.appendChild(badge);
    }
    syncStatusList();
    notify(`${selection.length}\uAC1C \uC694\uC18C\uC758 \uC0C1\uD0DC\uAC00 [${config.label}]\uB85C \uC5C5\uB370\uC774\uD2B8\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`, "success");
  }
  async function createConnectors(label, lineStyle = "solid") {
    const selection = [...figma.currentPage.selection];
    if (selection.length < 2) {
      notify("\uC5F0\uACB0\uD560 \uD504\uB808\uC784\uC744 2\uAC1C \uC774\uC0C1 \uC120\uD0DD\uD574 \uC8FC\uC138\uC694.", "warning");
      return;
    }
    selection.sort((a, b) => a.x - b.x);
    await loadRequiredFonts();
    const createdNodes = [];
    for (let i = 0; i < selection.length - 1; i++) {
      const fromNode = selection[i];
      const toNode = selection[i + 1];
      const startX = fromNode.x + fromNode.width;
      const startY = fromNode.y + fromNode.height / 2;
      const endX = toNode.x;
      const endY = toNode.y + toNode.height / 2;
      const connector = figma.createVector();
      connector.name = `[Flow] ${fromNode.name} \u2192 ${toNode.name}`;
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const midX = deltaX / 2;
      const pathData = `M 0 0 C ${midX} 0, ${midX} ${deltaY}, ${deltaX} ${deltaY}`;
      connector.vectorPaths = [
        {
          windingRule: "NONE",
          data: pathData
        }
      ];
      connector.x = startX;
      connector.y = startY;
      connector.strokes = [
        {
          type: "SOLID",
          color: { r: 0.38, g: 0.45, b: 0.55 }
          // 모던 슬레이트 블루
        }
      ];
      connector.strokeWeight = 2;
      connector.strokeCap = "ROUND";
      connector.strokeJoin = "ROUND";
      if (lineStyle === "dashed") {
        connector.dashPattern = [6, 4];
      }
      createdNodes.push(connector);
      const arrowHead = figma.createPolygon();
      arrowHead.name = "Arrowhead";
      arrowHead.resize(10, 10);
      arrowHead.rotation = -90;
      arrowHead.x = endX;
      arrowHead.y = endY + 5;
      arrowHead.fills = [
        {
          type: "SOLID",
          color: { r: 0.38, g: 0.45, b: 0.55 }
        }
      ];
      createdNodes.push(arrowHead);
      if (label && label.trim() !== "") {
        const labelBadge = figma.createFrame();
        labelBadge.name = `[Label] ${label}`;
        labelBadge.layoutMode = "HORIZONTAL";
        labelBadge.primaryAxisSizingMode = "AUTO";
        labelBadge.counterAxisSizingMode = "AUTO";
        labelBadge.paddingLeft = 8;
        labelBadge.paddingRight = 8;
        labelBadge.paddingTop = 3;
        labelBadge.paddingBottom = 3;
        labelBadge.cornerRadius = 4;
        labelBadge.fills = [{ type: "SOLID", color: { r: 0.95, g: 0.96, b: 0.98 } }];
        labelBadge.strokes = [{ type: "SOLID", color: { r: 0.82, g: 0.85, b: 0.9 } }];
        labelBadge.strokeWeight = 1;
        const labelText = figma.createText();
        labelText.fontName = { family: "Inter", style: "Medium" };
        labelText.characters = label;
        labelText.fontSize = 11;
        labelText.fills = [{ type: "SOLID", color: { r: 0.2, g: 0.25, b: 0.33 } }];
        labelBadge.appendChild(labelText);
        labelBadge.x = startX + deltaX / 2 - 20;
        labelBadge.y = startY + deltaY / 2 - 12;
        createdNodes.push(labelBadge);
      }
    }
    if (createdNodes.length > 0) {
      const group = figma.group(createdNodes, figma.currentPage);
      group.name = `User Flow Connectors (${selection.length} Screens)`;
      figma.currentPage.selection = [group];
    }
    notify(`${selection.length - 1}\uAC1C\uC758 \uC720\uC800 \uD50C\uB85C\uC6B0 \uC5F0\uACB0\uC120\uC774 \uC0DD\uC131\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`, "success");
  }
  async function addStepBadges(startNumber = 1) {
    const selection = [...figma.currentPage.selection];
    if (selection.length === 0) {
      notify("\uC2A4\uD15D \uBC88\uD638\uB97C \uB9E4\uAE38 \uD504\uB808\uC784\uC744 \uC120\uD0DD\uD574 \uC8FC\uC138\uC694.", "warning");
      return;
    }
    selection.sort((a, b) => a.x - b.x);
    await loadRequiredFonts();
    let currentNum = startNumber;
    for (const node of selection) {
      const parent = node.parent || figma.currentPage;
      const badgeName = `[Step Badge] ${node.id}`;
      const oldBadge = parent.findOne((n) => n.name === badgeName);
      if (oldBadge) oldBadge.remove();
      const stepBadge = figma.createFrame();
      stepBadge.name = badgeName;
      stepBadge.layoutMode = "HORIZONTAL";
      stepBadge.primaryAxisSizingMode = "FIXED";
      stepBadge.counterAxisSizingMode = "FIXED";
      stepBadge.resize(28, 28);
      stepBadge.cornerRadius = 14;
      stepBadge.primaryAxisAlignItems = "CENTER";
      stepBadge.counterAxisAlignItems = "CENTER";
      stepBadge.fills = [{ type: "SOLID", color: { r: 0.12, g: 0.14, b: 0.18 } }];
      const stepText = figma.createText();
      stepText.fontName = { family: "Inter", style: "Bold" };
      stepText.characters = String(currentNum);
      stepText.fontSize = 12;
      stepText.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
      stepBadge.appendChild(stepText);
      stepBadge.x = node.x - 12;
      stepBadge.y = node.y - 12;
      parent.appendChild(stepBadge);
      currentNum++;
    }
    notify(`${selection.length}\uAC1C \uD504\uB808\uC784\uC5D0 \uC2A4\uD15D \uBC88\uD638\uAC00 \uBD80\uC5EC\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`, "success");
  }
  async function createWorkflowTemplate(type) {
    await loadRequiredFonts();
    const center = figma.viewport.center;
    const section = figma.createSection();
    section.name = `\u{1F4CB} Workflow - ${type.toUpperCase()}`;
    section.x = center.x - 600;
    section.y = center.y - 400;
    section.resizeWithoutConstraints(1280, 800);
    const header = figma.createFrame();
    header.name = "Header Info";
    header.layoutMode = "VERTICAL";
    header.primaryAxisSizingMode = "AUTO";
    header.counterAxisSizingMode = "AUTO";
    header.itemSpacing = 8;
    header.fills = [];
    header.x = section.x + 40;
    header.y = section.y + 40;
    const title = figma.createText();
    title.fontName = { family: "Inter", style: "Bold" };
    title.fontSize = 24;
    title.characters = type === "user_flow" ? "Feature User Flow & Journey" : type === "screen_spec" ? "UI Screen Specification" : "Feature Roadmap & Milestones";
    title.fills = [{ type: "SOLID", color: { r: 0.1, g: 0.12, b: 0.16 } }];
    header.appendChild(title);
    const desc = figma.createText();
    desc.fontName = { family: "Inter", style: "Regular" };
    desc.fontSize = 13;
    desc.characters = "\uC791\uC5C5 \uB2F4\uB2F9\uC790:              \uC791\uC131\uC77C\uC790: " + (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    desc.fills = [{ type: "SOLID", color: { r: 0.45, g: 0.5, b: 0.58 } }];
    header.appendChild(desc);
    const cardWidth = 360;
    const cardHeight = 520;
    const startCardX = section.x + 40;
    const startCardY = section.y + 130;
    const gap = 30;
    const cardTitles = type === "user_flow" ? ["1. Entry & Discovery", "2. Core Interaction", "3. Completion / Feedback"] : type === "screen_spec" ? ["Main View (Default)", "State Variations (Hover/Active)", "Edge Case & Errors"] : ["Phase 1: MVP Scope", "Phase 2: Enhancements", "Phase 3: Scale & Refine"];
    for (let i = 0; i < 3; i++) {
      const card = figma.createFrame();
      card.name = cardTitles[i];
      card.resize(cardWidth, cardHeight);
      card.x = startCardX + i * (cardWidth + gap);
      card.y = startCardY;
      card.cornerRadius = 12;
      card.fills = [{ type: "SOLID", color: { r: 0.98, g: 0.98, b: 0.99 } }];
      card.strokes = [{ type: "SOLID", color: { r: 0.88, g: 0.9, b: 0.93 } }];
      card.strokeWeight = 1;
      const cardHeader = figma.createText();
      cardHeader.fontName = { family: "Inter", style: "Bold" };
      cardHeader.fontSize = 14;
      cardHeader.characters = cardTitles[i];
      cardHeader.x = 20;
      cardHeader.y = 20;
      cardHeader.fills = [{ type: "SOLID", color: { r: 0.2, g: 0.25, b: 0.3 } }];
      card.appendChild(cardHeader);
      const cardGuide = figma.createText();
      cardGuide.fontName = { family: "Inter", style: "Regular" };
      cardGuide.fontSize = 12;
      cardGuide.characters = "\uC774\uACF3\uC5D0 \uD574\uB2F9 \uB2E8\uACC4\uC758 \uD654\uBA74 \uB610\uB294 \uC0C1\uC138 \uBA85\uC138\uB97C \uBC30\uCE58\uD558\uC138\uC694.";
      cardGuide.x = 20;
      cardGuide.y = 48;
      cardGuide.fills = [{ type: "SOLID", color: { r: 0.6, g: 0.65, b: 0.72 } }];
      card.appendChild(cardGuide);
      card.setPluginData("workflow_status", "draft");
    }
    figma.currentPage.selection = [section];
    figma.viewport.scrollAndZoomIntoView([section]);
    syncStatusList();
    notify("\uD45C\uC900 \uC6CC\uD06C\uD50C\uB85C\uC6B0 \uD15C\uD50C\uB9BF\uC774 \uCE94\uBC84\uC2A4\uC5D0 \uC0DD\uC131\uB418\uC5C8\uC2B5\uB2C8\uB2E4.", "success");
  }
  function focusFrame(nodeId) {
    const node = figma.getNodeById(nodeId);
    if (!node || !("x" in node)) {
      notify("\uD574\uB2F9 \uB178\uB4DC\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.", "warning");
      return;
    }
    const sceneNode = node;
    figma.currentPage.selection = [sceneNode];
    figma.viewport.scrollAndZoomIntoView([sceneNode]);
  }
  figma.ui.onmessage = async (msg) => {
    switch (msg.type) {
      case "CREATE_CONNECTORS":
        await createConnectors(msg.label, msg.lineStyle);
        break;
      case "ADD_STEP_BADGES":
        await addStepBadges(msg.startNumber || 1);
        break;
      case "SET_STATUS":
        await applyStatusToSelected(msg.status);
        break;
      case "GET_STATUS_LIST":
        syncStatusList();
        break;
      case "FOCUS_FRAME":
        focusFrame(msg.nodeId);
        break;
      case "CREATE_TEMPLATE":
        await createWorkflowTemplate(msg.templateType);
        break;
    }
  };
  handleSelectionChange();
  syncStatusList();
})();
