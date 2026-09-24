"use strict";
(() => {
  // src/types.ts
  var STATUS_CONFIG = {
    draft: {
      label: "Draft",
      color: { r: 0.612, g: 0.639, b: 0.686 },
      // #9CA3AF
      textColor: { r: 1, g: 1, b: 1 },
      hex: "#9CA3AF"
    },
    wireframe: {
      label: "Wireframe",
      color: { r: 0.42, g: 0.447, b: 0.502 },
      // #6B7280
      textColor: { r: 1, g: 1, b: 1 },
      hex: "#6B7280"
    },
    in_progress: {
      label: "In Progress",
      color: { r: 0.231, g: 0.51, b: 0.965 },
      // #3B82F6
      textColor: { r: 1, g: 1, b: 1 },
      hex: "#3B82F6"
    },
    in_review: {
      label: "In Review",
      color: { r: 0.792, g: 0.541, b: 0.016 },
      // #CA8A04
      textColor: { r: 1, g: 1, b: 1 },
      hex: "#CA8A04"
    },
    revision: {
      label: "Revision",
      color: { r: 0.918, g: 0.345, b: 0.047 },
      // #EA580C
      textColor: { r: 1, g: 1, b: 1 },
      hex: "#EA580C"
    },
    approved: {
      label: "Approved",
      color: { r: 0.545, g: 0.361, b: 0.965 },
      // #8B5CF6
      textColor: { r: 1, g: 1, b: 1 },
      hex: "#8B5CF6"
    },
    ready_for_dev: {
      label: "Ready for Dev",
      color: { r: 0.086, g: 0.639, b: 0.29 },
      // #16A34A
      textColor: { r: 1, g: 1, b: 1 },
      hex: "#16A34A"
    },
    done: {
      label: "Done",
      color: { r: 0.216, g: 0.255, b: 0.318 },
      // #374151
      textColor: { r: 1, g: 1, b: 1 },
      hex: "#374151"
    }
  };

  // src/customConnector.ts
  function getMagnetPoint(box, magnet) {
    switch (magnet) {
      case "TOP":
        return { x: box.x + box.width / 2, y: box.y };
      case "BOTTOM":
        return { x: box.x + box.width / 2, y: box.y + box.height };
      case "LEFT":
        return { x: box.x, y: box.y + box.height / 2 };
      case "RIGHT":
        return { x: box.x + box.width, y: box.y + box.height / 2 };
    }
  }
  function simplifyOrthogonalPoints(points) {
    if (points.length <= 2) return points;
    const result = [points[0]];
    for (let i = 1; i < points.length - 1; i++) {
      const prev = result[result.length - 1];
      const curr = points[i];
      const next = points[i + 1];
      const isHorizontalCollinear = Math.abs(prev.y - curr.y) < 0.5 && Math.abs(curr.y - next.y) < 0.5;
      const isVerticalCollinear = Math.abs(prev.x - curr.x) < 0.5 && Math.abs(curr.x - next.x) < 0.5;
      if (!isHorizontalCollinear && !isVerticalCollinear) {
        if (Math.abs(prev.x - curr.x) > 0.5 || Math.abs(prev.y - curr.y) > 0.5) {
          result.push(curr);
        }
      }
    }
    result.push(points[points.length - 1]);
    return result;
  }
  function calculateOrthogonalPoints(srcPoint, srcMagnet, tgtPoint, tgtMagnet, srcBox, tgtBox) {
    const points = [srcPoint];
    const margin = 28;
    if (srcMagnet === "BOTTOM" && tgtMagnet === "TOP" || srcMagnet === "TOP" && tgtMagnet === "BOTTOM") {
      const isDownward = srcMagnet === "BOTTOM" && tgtMagnet === "TOP";
      const isNormal = isDownward ? srcPoint.y + 10 < tgtPoint.y : srcPoint.y > tgtPoint.y + 10;
      if (isNormal) {
        if (Math.abs(srcPoint.x - tgtPoint.x) < 1) {
          points.push(tgtPoint);
        } else {
          const midY = Math.round((srcPoint.y + tgtPoint.y) / 2);
          points.push({ x: srcPoint.x, y: midY });
          points.push({ x: tgtPoint.x, y: midY });
          points.push(tgtPoint);
        }
      } else {
        const detourX = tgtPoint.x >= srcPoint.x ? Math.max(srcBox.x + srcBox.width, tgtBox.x + tgtBox.width) + margin : Math.min(srcBox.x, tgtBox.x) - margin;
        const exitY = isDownward ? srcPoint.y + margin : srcPoint.y - margin;
        const enterY = isDownward ? tgtPoint.y - margin : tgtPoint.y + margin;
        points.push({ x: srcPoint.x, y: exitY });
        points.push({ x: detourX, y: exitY });
        points.push({ x: detourX, y: enterY });
        points.push({ x: tgtPoint.x, y: enterY });
        points.push(tgtPoint);
      }
    } else if (srcMagnet === "RIGHT" && tgtMagnet === "LEFT" || srcMagnet === "LEFT" && tgtMagnet === "RIGHT") {
      const isRightward = srcMagnet === "RIGHT" && tgtMagnet === "LEFT";
      const isNormal = isRightward ? srcPoint.x + 10 < tgtPoint.x : srcPoint.x > tgtPoint.x + 10;
      if (isNormal) {
        if (Math.abs(srcPoint.y - tgtPoint.y) < 1) {
          points.push(tgtPoint);
        } else {
          const midX = Math.round((srcPoint.x + tgtPoint.x) / 2);
          points.push({ x: midX, y: srcPoint.y });
          points.push({ x: midX, y: tgtPoint.y });
          points.push(tgtPoint);
        }
      } else {
        const detourY = tgtPoint.y >= srcPoint.y ? Math.max(srcBox.y + srcBox.height, tgtBox.y + tgtBox.height) + margin : Math.min(srcBox.y, tgtBox.y) - margin;
        const exitX = isRightward ? srcPoint.x + margin : srcPoint.x - margin;
        const enterX = isRightward ? tgtPoint.x - margin : tgtPoint.x + margin;
        points.push({ x: exitX, y: srcPoint.y });
        points.push({ x: exitX, y: detourY });
        points.push({ x: enterX, y: detourY });
        points.push({ x: enterX, y: tgtPoint.y });
        points.push(tgtPoint);
      }
    } else if ((srcMagnet === "RIGHT" || srcMagnet === "LEFT") && (tgtMagnet === "TOP" || tgtMagnet === "BOTTOM")) {
      const exitDir = srcMagnet === "RIGHT" ? 1 : -1;
      const isMovingForward = (tgtPoint.x - srcPoint.x) * exitDir > 0;
      if (isMovingForward) {
        points.push({ x: tgtPoint.x, y: srcPoint.y });
        points.push(tgtPoint);
      } else {
        const exitX = srcPoint.x + exitDir * margin;
        const enterY = tgtMagnet === "TOP" ? tgtPoint.y - margin : tgtPoint.y + margin;
        points.push({ x: exitX, y: srcPoint.y });
        points.push({ x: exitX, y: enterY });
        points.push({ x: tgtPoint.x, y: enterY });
        points.push(tgtPoint);
      }
    } else if ((srcMagnet === "TOP" || srcMagnet === "BOTTOM") && (tgtMagnet === "LEFT" || tgtMagnet === "RIGHT")) {
      const exitDir = srcMagnet === "BOTTOM" ? 1 : -1;
      const isMovingForward = (tgtPoint.y - srcPoint.y) * exitDir > 0;
      if (isMovingForward) {
        points.push({ x: srcPoint.x, y: tgtPoint.y });
        points.push(tgtPoint);
      } else {
        const exitY = srcPoint.y + exitDir * margin;
        const enterX = tgtMagnet === "LEFT" ? tgtPoint.x - margin : tgtPoint.x + margin;
        points.push({ x: srcPoint.x, y: exitY });
        points.push({ x: enterX, y: exitY });
        points.push({ x: enterX, y: tgtPoint.y });
        points.push(tgtPoint);
      }
    } else {
      if (tgtMagnet === "TOP" || tgtMagnet === "BOTTOM") {
        const enterY = tgtMagnet === "TOP" ? tgtPoint.y - margin : tgtPoint.y + margin;
        points.push({ x: srcPoint.x, y: enterY });
        points.push({ x: tgtPoint.x, y: enterY });
        points.push(tgtPoint);
      } else {
        const enterX = tgtMagnet === "LEFT" ? tgtPoint.x - margin : tgtPoint.x + margin;
        points.push({ x: enterX, y: srcPoint.y });
        points.push({ x: enterX, y: tgtPoint.y });
        points.push(tgtPoint);
      }
    }
    return simplifyOrthogonalPoints(points);
  }
  async function createOrthogonalVectorConnector(sourceNode, sourceMagnet, targetNode, targetMagnet, options = {}) {
    const srcBox = {
      x: sourceNode.x,
      y: sourceNode.y,
      width: sourceNode.width,
      height: sourceNode.height
    };
    const tgtBox = {
      x: targetNode.x,
      y: targetNode.y,
      width: targetNode.width,
      height: targetNode.height
    };
    const pStart = getMagnetPoint(srcBox, sourceMagnet);
    const pEnd = getMagnetPoint(tgtBox, targetMagnet);
    const worldPoints = calculateOrthogonalPoints(
      pStart,
      sourceMagnet,
      pEnd,
      targetMagnet,
      srcBox,
      tgtBox
    );
    const allX = worldPoints.map((p) => p.x);
    const allY = worldPoints.map((p) => p.y);
    const minX = Math.min(...allX);
    const minY = Math.min(...allY);
    const maxX = Math.max(...allX);
    const maxY = Math.max(...allY);
    const width = Math.max(maxX - minX, 1);
    const height = Math.max(maxY - minY, 1);
    const localPoints = worldPoints.map((p) => ({
      x: p.x - minX,
      y: p.y - minY
    }));
    const strokeColor = options.strokeColor || { r: 0.18, g: 0.18, b: 0.22 };
    const strokeWeight = options.strokeWeight || 1.5;
    const vector = figma.createVector();
    vector.x = minX;
    vector.y = minY;
    vector.resize(width, height);
    const vertices = localPoints.map((pt, idx) => ({
      x: pt.x,
      y: pt.y,
      strokeCap: idx === localPoints.length - 1 ? "ARROW_EQUILATERAL" : "NONE",
      strokeJoin: "MITER",
      cornerRadius: 0
      // 완전한 90도 직각 보장 (라운딩 0)
    }));
    const segments = [];
    for (let i = 0; i < localPoints.length - 1; i++) {
      segments.push({
        start: i,
        end: i + 1
      });
    }
    await vector.setVectorNetworkAsync({ vertices, segments });
    vector.strokes = [{ type: "SOLID", color: strokeColor }];
    vector.strokeWeight = strokeWeight;
    vector.strokeJoin = "MITER";
    vector.strokeMiterLimit = 4;
    vector.name = `[Connector] ${sourceNode.name} \u2192 ${targetNode.name}`;
    vector.setPluginData("is_flow_connector", "true");
    vector.setPluginData("is_custom_connector", "true");
    vector.setPluginData("source_node_id", sourceNode.id);
    vector.setPluginData("target_node_id", targetNode.id);
    vector.setPluginData("source_magnet", sourceMagnet);
    vector.setPluginData("target_magnet", targetMagnet);
    if (options.label && options.label.trim() !== "") {
      const labelText = options.label.trim();
      vector.setPluginData("connector_label", labelText);
      try {
        await figma.loadFontAsync({ family: "Inter", style: "Medium" });
      } catch {
        await figma.loadFontAsync({ family: "Inter", style: "Regular" });
      }
      let longestDist = -1;
      let midSegmentPoint = {
        x: (worldPoints[0].x + worldPoints[1].x) / 2,
        y: (worldPoints[0].y + worldPoints[1].y) / 2
      };
      for (let i = 0; i < worldPoints.length - 1; i++) {
        const p1 = worldPoints[i];
        const p2 = worldPoints[i + 1];
        const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        if (dist > longestDist) {
          longestDist = dist;
          midSegmentPoint = {
            x: (p1.x + p2.x) / 2,
            y: (p1.y + p2.y) / 2
          };
        }
      }
      const labelFrame = figma.createFrame();
      labelFrame.name = "ConnectorLabel";
      labelFrame.layoutMode = "HORIZONTAL";
      labelFrame.primaryAxisSizingMode = "AUTO";
      labelFrame.counterAxisSizingMode = "AUTO";
      labelFrame.paddingLeft = 6;
      labelFrame.paddingRight = 6;
      labelFrame.paddingTop = 2;
      labelFrame.paddingBottom = 2;
      labelFrame.cornerRadius = 3;
      labelFrame.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
      labelFrame.strokes = [{ type: "SOLID", color: { r: 0.85, g: 0.85, b: 0.88 } }];
      labelFrame.strokeWeight = 1;
      const textNode = figma.createText();
      textNode.characters = labelText;
      textNode.fontSize = 10;
      textNode.fontName = { family: "Inter", style: "Medium" };
      textNode.fills = [{ type: "SOLID", color: strokeColor }];
      textNode.setPluginData("is_custom_connector", "true");
      labelFrame.appendChild(textNode);
      labelFrame.x = Math.round(midSegmentPoint.x - labelFrame.width / 2);
      labelFrame.y = Math.round(midSegmentPoint.y - labelFrame.height / 2);
      labelFrame.setPluginData("is_connector_label", "true");
      labelFrame.setPluginData("is_custom_connector", "true");
      const group = figma.group([vector, labelFrame], figma.currentPage);
      group.name = `[Flow] ${sourceNode.name} \u2192 ${targetNode.name} ("${labelText}")`;
      group.setPluginData("is_flow_connector", "true");
      group.setPluginData("is_custom_connector", "true");
      group.setPluginData("source_node_id", sourceNode.id);
      group.setPluginData("target_node_id", targetNode.id);
      group.setPluginData("source_magnet", sourceMagnet);
      group.setPluginData("target_magnet", targetMagnet);
      group.setPluginData("connector_label", labelText);
      registerConnectorInRegistry(group);
      return group;
    }
    registerConnectorInRegistry(vector);
    return vector;
  }
  var nodeToConnectorsMap = /* @__PURE__ */ new Map();
  var isUpdatingConnectors = false;
  function registerConnectorInRegistry(connectorNode) {
    const srcId = connectorNode.getPluginData("source_node_id");
    const tgtId = connectorNode.getPluginData("target_node_id");
    if (srcId) {
      if (!nodeToConnectorsMap.has(srcId)) nodeToConnectorsMap.set(srcId, /* @__PURE__ */ new Set());
      nodeToConnectorsMap.get(srcId).add(connectorNode.id);
    }
    if (tgtId) {
      if (!nodeToConnectorsMap.has(tgtId)) nodeToConnectorsMap.set(tgtId, /* @__PURE__ */ new Set());
      nodeToConnectorsMap.get(tgtId).add(connectorNode.id);
    }
  }
  function refreshConnectorRegistry() {
    nodeToConnectorsMap.clear();
    const connectors = figma.currentPage.findAll(
      (n) => n.getPluginData("is_custom_connector") === "true"
    );
    for (const conn of connectors) {
      registerConnectorInRegistry(conn);
    }
  }
  function getOptimalMagnetPair(srcBox, tgtBox) {
    const isRight = tgtBox.x >= srcBox.x + srcBox.width;
    const isLeft = tgtBox.x + tgtBox.width <= srcBox.x;
    const isBelow = tgtBox.y >= srcBox.y + srcBox.height;
    const isAbove = tgtBox.y + tgtBox.height <= srcBox.y;
    if (isRight && !isBelow && !isAbove) return { sourceMagnet: "RIGHT", targetMagnet: "LEFT" };
    if (isLeft && !isBelow && !isAbove) return { sourceMagnet: "LEFT", targetMagnet: "RIGHT" };
    if (isBelow && !isRight && !isLeft) return { sourceMagnet: "BOTTOM", targetMagnet: "TOP" };
    if (isAbove && !isRight && !isLeft) return { sourceMagnet: "TOP", targetMagnet: "BOTTOM" };
    const centerSrcX = srcBox.x + srcBox.width / 2;
    const centerSrcY = srcBox.y + srcBox.height / 2;
    const centerTgtX = tgtBox.x + tgtBox.width / 2;
    const centerTgtY = tgtBox.y + tgtBox.height / 2;
    const dx = centerTgtX - centerSrcX;
    const dy = centerTgtY - centerSrcY;
    if (Math.abs(dx) >= Math.abs(dy)) {
      return dx >= 0 ? { sourceMagnet: "RIGHT", targetMagnet: "LEFT" } : { sourceMagnet: "LEFT", targetMagnet: "RIGHT" };
    } else {
      return dy >= 0 ? { sourceMagnet: "BOTTOM", targetMagnet: "TOP" } : { sourceMagnet: "TOP", targetMagnet: "BOTTOM" };
    }
  }
  async function updateOrthogonalVectorConnector(connectorNode, explicitSourceMagnet, explicitTargetMagnet) {
    const srcId = connectorNode.getPluginData("source_node_id");
    const tgtId = connectorNode.getPluginData("target_node_id");
    if (!srcId || !tgtId) return;
    const sourceNode = figma.getNodeById(srcId);
    const targetNode = figma.getNodeById(tgtId);
    if (!sourceNode || !targetNode) return;
    let vector = null;
    let labelFrame = null;
    if (connectorNode.type === "GROUP") {
      const group = connectorNode;
      vector = group.children.find((c) => c.type === "VECTOR") || null;
      labelFrame = group.children.find(
        (c) => c.getPluginData("is_connector_label") === "true" || c.name === "ConnectorLabel"
      ) || null;
    } else if (connectorNode.type === "VECTOR") {
      vector = connectorNode;
    }
    if (!vector) return;
    const srcBox = {
      x: sourceNode.x,
      y: sourceNode.y,
      width: sourceNode.width,
      height: sourceNode.height
    };
    const tgtBox = {
      x: targetNode.x,
      y: targetNode.y,
      width: targetNode.width,
      height: targetNode.height
    };
    let sourceMagnet = explicitSourceMagnet || connectorNode.getPluginData("source_magnet");
    let targetMagnet = explicitTargetMagnet || connectorNode.getPluginData("target_magnet");
    if (!sourceMagnet || !targetMagnet) {
      const optimal = getOptimalMagnetPair(srcBox, tgtBox);
      if (!sourceMagnet) sourceMagnet = optimal.sourceMagnet;
      if (!targetMagnet) targetMagnet = optimal.targetMagnet;
    }
    connectorNode.setPluginData("source_magnet", sourceMagnet);
    connectorNode.setPluginData("target_magnet", targetMagnet);
    if (vector !== connectorNode) {
      vector.setPluginData("source_magnet", sourceMagnet);
      vector.setPluginData("target_magnet", targetMagnet);
    }
    const pStart = getMagnetPoint(srcBox, sourceMagnet);
    const pEnd = getMagnetPoint(tgtBox, targetMagnet);
    const worldPoints = calculateOrthogonalPoints(
      pStart,
      sourceMagnet,
      pEnd,
      targetMagnet,
      srcBox,
      tgtBox
    );
    const allX = worldPoints.map((p) => p.x);
    const allY = worldPoints.map((p) => p.y);
    const minX = Math.min(...allX);
    const minY = Math.min(...allY);
    const maxX = Math.max(...allX);
    const maxY = Math.max(...allY);
    const width = Math.max(maxX - minX, 1);
    const height = Math.max(maxY - minY, 1);
    const localPoints = worldPoints.map((p) => ({
      x: p.x - minX,
      y: p.y - minY
    }));
    vector.x = minX;
    vector.y = minY;
    vector.resize(width, height);
    const vertices = localPoints.map((pt, idx) => ({
      x: pt.x,
      y: pt.y,
      strokeCap: idx === localPoints.length - 1 ? "ARROW_EQUILATERAL" : "NONE",
      strokeJoin: "MITER",
      cornerRadius: 0
    }));
    const segments = [];
    for (let i = 0; i < localPoints.length - 1; i++) {
      segments.push({
        start: i,
        end: i + 1
      });
    }
    await vector.setVectorNetworkAsync({ vertices, segments });
    if (labelFrame) {
      let longestDist = -1;
      let midSegmentPoint = {
        x: (worldPoints[0].x + worldPoints[1].x) / 2,
        y: (worldPoints[0].y + worldPoints[1].y) / 2
      };
      for (let i = 0; i < worldPoints.length - 1; i++) {
        const p1 = worldPoints[i];
        const p2 = worldPoints[i + 1];
        const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        if (dist > longestDist) {
          longestDist = dist;
          midSegmentPoint = {
            x: (p1.x + p2.x) / 2,
            y: (p1.y + p2.y) / 2
          };
        }
      }
      labelFrame.x = Math.round(midSegmentPoint.x - labelFrame.width / 2);
      labelFrame.y = Math.round(midSegmentPoint.y - labelFrame.height / 2);
    }
  }
  async function syncConnectorsForMovedNodes(nodeIds) {
    if (isUpdatingConnectors || nodeIds.size === 0) return;
    isUpdatingConnectors = true;
    try {
      const connIdsToUpdate = /* @__PURE__ */ new Set();
      for (const nid of nodeIds) {
        const conns = nodeToConnectorsMap.get(nid);
        if (conns) {
          for (const cid of conns) {
            connIdsToUpdate.add(cid);
          }
        }
      }
      for (const connId of connIdsToUpdate) {
        const connNode = figma.getNodeById(connId);
        if (connNode) {
          await updateOrthogonalVectorConnector(connNode);
        }
      }
    } catch (err) {
      console.error("\uCEE4\uB125\uD130 \uC704\uCE58 \uB3D9\uAE30\uD654 \uC2E4\uD328:", err);
    } finally {
      isUpdatingConnectors = false;
    }
  }

  // src/code.ts
  function rgbToHexColor(rgb) {
    const toHex = (c) => Math.round(Math.max(0, Math.min(1, c)) * 255).toString(16).padStart(2, "0");
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase();
  }
  figma.showUI(__html__, {
    width: 360,
    height: 486,
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
  }
  function findConnectorNode(node) {
    if (!node) return null;
    let curr = node;
    while (curr && curr.type !== "PAGE" && curr.type !== "DOCUMENT") {
      if (curr.type === "CONNECTOR" || curr.getPluginData("is_custom_connector") === "true" || curr.getPluginData("is_flow_connector") === "true") {
        let topConnector = curr;
        let parentScan = curr.parent;
        while (parentScan && parentScan.type !== "PAGE" && parentScan.type !== "DOCUMENT") {
          if (parentScan.getPluginData("is_custom_connector") === "true" || parentScan.getPluginData("is_flow_connector") === "true") {
            topConnector = parentScan;
          }
          parentScan = parentScan.parent;
        }
        return topConnector;
      }
      curr = curr.parent;
    }
    return null;
  }
  function findFlowNode(node) {
    if (!node) return null;
    if (findConnectorNode(node)) return null;
    let curr = node;
    let topCandidate = null;
    while (curr && curr.type !== "PAGE" && curr.type !== "DOCUMENT") {
      if (curr.getPluginData("is_flow_node") === "true") {
        return curr;
      }
      if (curr.type === "FRAME" || curr.type === "SHAPE_WITH_TEXT") {
        if (curr.getPluginData("is_connector_label") !== "true" && curr.name !== "ConnectorLabel") {
          topCandidate = curr;
        }
      }
      curr = curr.parent;
    }
    return topCandidate;
  }
  function getNextFlowTag() {
    const flowNodes = figma.currentPage.findAll(
      (node) => node.getPluginData("is_flow_node") === "true"
    );
    return `p${flowNodes.length + 1}`;
  }
  function extractNodeText(node) {
    let title = "";
    let description = "";
    if (node.type === "FRAME" || "findAll" in node) {
      const frame = node;
      const titleTextNode = frame.findOne(
        (c) => c.type === "TEXT" && (c.name === "TitleText" || c.getPluginData("node_role") === "title")
      );
      const descTextNode = frame.findOne(
        (c) => c.type === "TEXT" && (c.name === "DescText" || c.getPluginData("node_role") === "desc")
      );
      if (titleTextNode) {
        title = titleTextNode.characters;
      }
      if (descTextNode) {
        description = descTextNode.characters;
      }
      if (!title) {
        const allTexts = frame.findAll((n) => n.type === "TEXT");
        if (allTexts.length > 0) title = allTexts[0].characters;
        if (allTexts.length > 1 && !description) {
          description = allTexts[1].characters;
        }
      }
    } else if (node.type === "SHAPE_WITH_TEXT") {
      const shape = node;
      const lines = shape.text.characters.split("\n");
      if (lines.length > 0) title = lines[0];
      if (lines.length > 1) description = lines.slice(1).join("\n");
    } else if (node.type === "STICKY") {
      const sticky = node;
      const lines = sticky.text.characters.split("\n");
      if (lines.length > 0) title = lines[0];
      if (lines.length > 1) description = lines.slice(1).join("\n");
    }
    if (!title) {
      title = node.name || node.getPluginData("node_title") || "Untitled";
    }
    if (!description) {
      description = node.getPluginData("node_desc") || "";
    }
    return { title, description };
  }
  function handleSelectionChange() {
    const rawSelection = figma.currentPage.selection;
    const resolvedNodesMap = /* @__PURE__ */ new Map();
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
    const connNodes = allResolvedNodes.filter((n) => Boolean(findConnectorNode(n)));
    const nonConnNodes = allResolvedNodes.filter((n) => !findConnectorNode(n));
    const flowNodes = nonConnNodes.filter((n) => n.getPluginData("is_flow_node") === "true");
    const otherObjects = nonConnNodes.filter((n) => n.getPluginData("is_flow_node") !== "true");
    const flowNodeCount = flowNodes.length;
    const otherObjectCount = otherObjects.length;
    const connectorCount = connNodes.length;
    let uniqueNodes = [];
    if (flowNodeCount > 0) {
      uniqueNodes = flowNodes;
    } else if (connectorCount > 0 && otherObjectCount === 0) {
      uniqueNodes = connNodes;
    } else {
      uniqueNodes = otherObjects;
    }
    const nodes = uniqueNodes.map((node) => {
      const isFlowNode = node.getPluginData("is_flow_node") === "true";
      if (isFlowNode && node.type === "FRAME") {
        const frame = node;
        const w = Math.round(frame.width);
        const h = Math.round(frame.height);
        if (frame.minWidth !== w || frame.maxWidth !== w || frame.minHeight !== h || frame.maxHeight !== h) {
          frame.minWidth = w;
          frame.maxWidth = w;
          frame.minHeight = h;
          frame.maxHeight = h;
        }
        const statusBadge = frame.children.find(
          (c) => c.getPluginData("is_status_badge") === "true" || c.name === "StatusBadge"
        );
        if (statusBadge) {
          if (statusBadge.y <= 0) {
            statusBadge.constraints = { horizontal: "MAX", vertical: "MAX" };
            statusBadge.x = w - statusBadge.width - 10;
            statusBadge.y = h - statusBadge.height - 10;
          }
          statusBadge.locked = true;
          const textChild = statusBadge.children.find((c) => c.type === "TEXT");
          if (textChild) textChild.locked = true;
        }
        const headerFrame = frame.children.find((c) => c.name === "Header");
        const titleText = headerFrame ? headerFrame.children.find((c) => c.type === "TEXT") : frame.children.find((c) => c.type === "TEXT" && (c.name === "TitleText" || c.getPluginData("node_role") === "title"));
        if (titleText) {
          enforceTitleStandardStyle(titleText, frame);
        }
        const descText = frame.children.find(
          (c) => c.type === "TEXT" && (c.name === "DescText" || c.getPluginData("node_role") === "desc")
        );
        if (descText) {
          lockTextFontSizeAndAutoResize(descText, 11);
        }
      }
      let title = "";
      let description = "";
      let tag = node.getPluginData("node_tag") || "";
      let connectorLabel;
      let connectorLineType;
      let connectorColorHex;
      let connectorStrokeWeight;
      let connectorStrokePattern;
      let connectorRoutingType;
      let connectorStartTerminal;
      let connectorEndTerminal;
      let connectorSourceNodeName;
      let connectorTargetNodeName;
      let connectorSourceMagnet;
      let connectorTargetMagnet;
      const isCustomConnector = node.getPluginData("is_custom_connector") === "true" || node.getPluginData("is_flow_connector") === "true";
      const isFigmaConnector = node.type === "CONNECTOR";
      const isConnector = isFigmaConnector || isCustomConnector;
      if (isConnector) {
        if (isFigmaConnector) {
          const conn = node;
          connectorLabel = conn.text ? conn.text.characters : "";
          connectorLineType = conn.connectorLineType;
          connectorRoutingType = conn.connectorLineType === "STRAIGHT" ? "STRAIGHT" : "ORTHOGONAL";
          connectorStrokeWeight = typeof conn.strokeWeight === "number" ? conn.strokeWeight : 1.5;
          if (Array.isArray(conn.strokes) && conn.strokes.length > 0 && conn.strokes[0].type === "SOLID") {
            connectorColorHex = rgbToHexColor(conn.strokes[0].color);
          }
          if (Array.isArray(conn.dashPattern) && conn.dashPattern.length > 0) {
            connectorStrokePattern = conn.dashPattern[0] <= 2 ? "DOTTED" : "DASHED";
          } else {
            connectorStrokePattern = "SOLID";
          }
          const mapCapToTerm = (cap) => {
            if (cap.includes("REVERSED_TRIANGLE")) return "REVERSED_TRIANGLE_ARROW";
            if (cap.includes("TRIANGLE_ARROW") || cap.includes("ARROW_EQUILATERAL")) return "TRIANGLE_ARROW";
            if (cap.includes("ARROW_LINES") || cap === "ARROW") return "ARROW";
            if (cap.includes("DIAMOND_FILLED") || cap === "DIAMOND") return "DIAMOND";
            if (cap.includes("CIRCLE_FILLED") || cap === "CIRCLE") return "CIRCLE";
            return "NONE";
          };
          connectorStartTerminal = mapCapToTerm(String(conn.connectorStartStrokeCap || "NONE"));
          connectorEndTerminal = mapCapToTerm(String(conn.connectorEndStrokeCap || "NONE"));
          if (conn.connectorStart && "endpointNodeId" in conn.connectorStart && conn.connectorStart.endpointNodeId) {
            const sNode = figma.getNodeById(conn.connectorStart.endpointNodeId);
            if (sNode) connectorSourceNodeName = sNode.name;
            if ("magnet" in conn.connectorStart) {
              connectorSourceMagnet = conn.connectorStart.magnet;
            }
          }
          if (conn.connectorEnd && "endpointNodeId" in conn.connectorEnd && conn.connectorEnd.endpointNodeId) {
            const tNode = figma.getNodeById(conn.connectorEnd.endpointNodeId);
            if (tNode) connectorTargetNodeName = tNode.name;
            if ("magnet" in conn.connectorEnd) {
              connectorTargetMagnet = conn.connectorEnd.magnet;
            }
          }
        } else {
          connectorLabel = node.getPluginData("connector_label") || "";
          connectorLineType = "ELBOWED";
          connectorRoutingType = node.getPluginData("connector_routing") || "ORTHOGONAL";
          connectorColorHex = node.getPluginData("connector_color");
          const savedWeight = node.getPluginData("connector_weight");
          connectorStrokeWeight = savedWeight ? parseFloat(savedWeight) : void 0;
          connectorStrokePattern = node.getPluginData("connector_pattern") || "SOLID";
          connectorStartTerminal = node.getPluginData("start_terminal") || "NONE";
          connectorEndTerminal = node.getPluginData("end_terminal") || "ARROW";
          const srcId = node.getPluginData("source_node_id");
          const tgtId = node.getPluginData("target_node_id");
          if (srcId) {
            const sNode = figma.getNodeById(srcId);
            if (sNode) connectorSourceNodeName = sNode.name;
          }
          if (tgtId) {
            const tNode = figma.getNodeById(tgtId);
            if (tNode) connectorTargetNodeName = tNode.name;
          }
          connectorSourceMagnet = node.getPluginData("source_magnet") || "RIGHT";
          connectorTargetMagnet = node.getPluginData("target_magnet") || "LEFT";
          let vectorChild = null;
          if (node.type === "VECTOR") {
            vectorChild = node;
          } else if ("findOne" in node) {
            vectorChild = node.findOne((n) => n.type === "VECTOR");
          }
          if (vectorChild) {
            if (!connectorColorHex && Array.isArray(vectorChild.strokes) && vectorChild.strokes.length > 0) {
              const first = vectorChild.strokes[0];
              if (first.type === "SOLID") connectorColorHex = rgbToHexColor(first.color);
            }
            if (connectorStrokeWeight === void 0 && typeof vectorChild.strokeWeight === "number") {
              connectorStrokeWeight = vectorChild.strokeWeight;
            }
            if (!connectorSourceMagnet) {
              connectorSourceMagnet = vectorChild.getPluginData("source_magnet") || "RIGHT";
            }
            if (!connectorTargetMagnet) {
              connectorTargetMagnet = vectorChild.getPluginData("target_magnet") || "LEFT";
            }
          }
        }
        title = "Connector";
      } else {
        const extracted = extractNodeText(node);
        title = extracted.title;
        description = extracted.description;
      }
      const savedType = node.getPluginData("node_type");
      const flowNodeType = savedType || "Screen";
      const savedStatus = node.getPluginData("workflow_status");
      let sizeMode = "fixed";
      let hugHeight = Math.round(node.height);
      if (isFlowNode && node.type === "FRAME") {
        const frame = node;
        const isAuto = frame.primaryAxisSizingMode === "AUTO";
        sizeMode = isAuto ? "hug" : "fixed";
        if (isAuto) {
          hugHeight = Math.round(frame.height);
        } else {
          const headerRow = frame.children.find(
            (c) => c.name === "Header" || c.type === "FRAME" && c.layoutMode === "HORIZONTAL"
          );
          const headerH = headerRow ? headerRow.height : 20;
          const descText = frame.children.find(
            (c) => c.name === "DescText" || c.getPluginData("node_role") === "desc"
          );
          if (descText && descText.characters.trim()) {
            try {
              const temp = figma.createText();
              temp.fontName = { family: "Inter", style: "Regular" };
              temp.fontSize = 11;
              temp.resize(Math.max(50, frame.width - 32), 10);
              temp.textAutoResize = "HEIGHT";
              temp.characters = descText.characters;
              const fullDescH = Math.round(temp.height);
              temp.remove();
              hugHeight = Math.max(50, 14 + 16 + Math.round(headerH) + 8 + fullDescH);
            } catch (_) {
              hugHeight = Math.round(frame.height);
            }
          } else {
            hugHeight = Math.max(50, 14 + 16 + Math.round(headerH) + 8);
          }
        }
      }
      return {
        id: node.id,
        name: node.name,
        isFlowNode,
        isConnector,
        nodeType: node.type,
        flowNodeType,
        status: savedStatus || void 0,
        title,
        description,
        tag,
        theme: node.getPluginData("node_theme") || "light",
        figmaLink: node.getPluginData("figma_link"),
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
        hugHeight,
        sizeMode
      };
    });
    let currentStatus;
    if (uniqueNodes.length === 1) {
      const saved = uniqueNodes[0].getPluginData("workflow_status");
      if (saved) currentStatus = saved;
    }
    postToUI({
      type: "SELECTION_CHANGED",
      count: flowNodeCount + otherObjectCount + connectorCount,
      nodes,
      currentStatus,
      nextSuggestedTag: getNextFlowTag(),
      flowNodeCount,
      otherObjectCount,
      connectorCount
    });
  }
  figma.on("selectionchange", handleSelectionChange);
  async function safeSetCharacters(textNode, newText) {
    if (!textNode) return;
    const len = textNode.characters.length;
    try {
      if (len > 0) {
        const fontNames = textNode.getRangeAllFontNames(0, len);
        for (const fn of fontNames) {
          await figma.loadFontAsync(fn);
        }
      } else {
        if ("fontName" in textNode && textNode.fontName !== figma.mixed) {
          await figma.loadFontAsync(textNode.fontName);
        } else {
          await figma.loadFontAsync({ family: "Inter", style: "Regular" });
        }
      }
    } catch (e) {
      await figma.loadFontAsync({ family: "Inter", style: "Regular" });
      await figma.loadFontAsync({ family: "Inter", style: "Bold" });
    }
    textNode.characters = newText;
  }
  function lockTextFontSizeAndAutoResize(textNode, targetSize) {
    try {
      if (textNode.fontSize !== targetSize) {
        textNode.fontSize = targetSize;
      }
      if (textNode.textAutoResize !== "HEIGHT") {
        textNode.textAutoResize = "HEIGHT";
      }
      if (textNode.layoutAlign !== "STRETCH") {
        textNode.layoutAlign = "STRETCH";
      }
      textNode.textTruncation = "ENDING";
    } catch (err) {
      console.warn("\uD3F0\uD2B8 \uC0AC\uC774\uC988 \uBC0F \uB9AC\uC0AC\uC774\uC988 \uBAA8\uB4DC \uACE0\uC815 \uC2E4\uD328:", err);
    }
  }
  async function enforceTitleStandardStyle(textNode, flowNode) {
    try {
      const targetFont = { family: "Inter", style: "Bold" };
      const targetSize = 13;
      let isDark = false;
      if (flowNode && "getPluginData" in flowNode) {
        isDark = flowNode.getPluginData("node_theme") === "dark";
      }
      const expectedColor = isDark ? { r: 1, g: 1, b: 1 } : { r: 0.118, g: 0.118, b: 0.118 };
      try {
        await Promise.all([
          figma.loadFontAsync(targetFont),
          figma.loadFontAsync({ family: "Inter", style: "Regular" }),
          figma.loadFontAsync({ family: "Inter", style: "Medium" })
        ]);
      } catch (_) {
      }
      let len = textNode.characters.length;
      if (len > 0) {
        try {
          const currentFonts = textNode.getRangeAllFontNames(0, len);
          for (const fn of currentFonts) {
            try {
              await figma.loadFontAsync(fn);
            } catch (_) {
            }
          }
        } catch (_) {
        }
      }
      const originalText = textNode.characters;
      const cleanedText = originalText.split("\n").map((line) => line.replace(/^[\s\u2022\u25E6\u2023\u2043\u2219\u25AA\u25AB\-\*]+(?:\s+|$)/, "").trim()).filter((line) => line.length > 0).join(" ");
      if (cleanedText !== originalText && cleanedText.length > 0) {
        textNode.characters = cleanedText;
        len = textNode.characters.length;
      }
      if (len > 0) {
        try {
          const segments = textNode.getStyledTextSegments([
            "hyperlink",
            "textDecoration",
            "listOptions",
            "fontName",
            "fontSize"
          ]);
          for (const seg of segments) {
            if (seg.hyperlink !== null) {
              try {
                textNode.setRangeHyperlink(seg.start, seg.end, null);
              } catch (_) {
              }
            }
            if (seg.textDecoration !== "NONE") {
              try {
                textNode.setRangeTextDecoration(seg.start, seg.end, "NONE");
              } catch (_) {
              }
            }
            if (seg.listOptions && seg.listOptions.type !== "NONE") {
              try {
                textNode.setRangeListOptions(seg.start, seg.end, { type: "NONE" });
              } catch (_) {
              }
            }
            if (seg.fontName.family !== targetFont.family || seg.fontName.style !== targetFont.style) {
              try {
                textNode.setRangeFontName(seg.start, seg.end, targetFont);
              } catch (_) {
              }
            }
            if (seg.fontSize !== targetSize) {
              try {
                textNode.setRangeFontSize(seg.start, seg.end, targetSize);
              } catch (_) {
              }
            }
          }
        } catch (_) {
        }
        try {
          textNode.setRangeFontName(0, len, targetFont);
        } catch (_) {
        }
        try {
          textNode.setRangeFontSize(0, len, targetSize);
        } catch (_) {
        }
        try {
          textNode.setRangeFills(0, len, [{ type: "SOLID", color: expectedColor }]);
        } catch (_) {
        }
        try {
          textNode.setRangeTextDecoration(0, len, "NONE");
        } catch (_) {
        }
        try {
          textNode.setRangeHyperlink(0, len, null);
        } catch (_) {
        }
        try {
          textNode.setRangeListOptions(0, len, { type: "NONE" });
        } catch (_) {
        }
        try {
          textNode.setRangeIndentation(0, len, 0);
        } catch (_) {
        }
      } else {
        try {
          textNode.fontName = targetFont;
        } catch (_) {
        }
        try {
          textNode.fontSize = targetSize;
        } catch (_) {
        }
        try {
          textNode.fills = [{ type: "SOLID", color: expectedColor }];
        } catch (_) {
        }
        try {
          textNode.textDecoration = "NONE";
        } catch (_) {
        }
        try {
          textNode.hyperlink = null;
        } catch (_) {
        }
      }
      if (textNode.textAutoResize !== "HEIGHT") {
        textNode.textAutoResize = "HEIGHT";
      }
      if (textNode.layoutGrow !== 1) {
        textNode.layoutGrow = 1;
      }
      textNode.textTruncation = "ENDING";
      textNode.maxLines = 1;
      if (flowNode && "name" in flowNode && textNode.characters.trim()) {
        if (flowNode.name !== textNode.characters.trim()) {
          flowNode.name = textNode.characters.trim();
        }
      }
    } catch (err) {
      console.warn("\uD0C0\uC774\uD2C0 \uD45C\uC900 \uC2A4\uD0C0\uC77C \uACE0\uC815 \uC2E4\uD328:", err);
    }
  }
  async function convertShapeToFrameNode(shape) {
    await loadRequiredFonts();
    const extracted = extractNodeText(shape);
    const title = extracted.title;
    const desc = extracted.description;
    const theme = shape.getPluginData("node_theme") || "light";
    const status = shape.getPluginData("workflow_status") || void 0;
    const stepStr = shape.getPluginData("step_number");
    const stepNumber = stepStr ? parseInt(stepStr, 10) : void 0;
    const width = Math.max(120, Math.round(shape.width));
    const height = Math.max(50, Math.round(shape.height));
    const x = shape.x;
    const y = shape.y;
    const parent = shape.parent || figma.currentPage;
    const isDark = theme === "dark";
    const bgColor = isDark ? { r: 0.14, g: 0.14, b: 0.15 } : { r: 1, g: 1, b: 1 };
    const borderColor = isDark ? { r: 0.28, g: 0.28, b: 0.3 } : { r: 0.15, g: 0.15, b: 0.18 };
    const titleColor = isDark ? { r: 0.98, g: 0.98, b: 1 } : { r: 0.1, g: 0.1, b: 0.12 };
    const descColor = isDark ? { r: 0.65, g: 0.68, b: 0.72 } : { r: 0.42, g: 0.45, b: 0.5 };
    const card = figma.createFrame();
    card.name = title;
    card.x = x;
    card.y = y;
    card.resize(width, height);
    card.cornerRadius = 0;
    card.strokeWeight = 1.5;
    card.strokes = [{ type: "SOLID", color: borderColor }];
    card.fills = [{ type: "SOLID", color: bgColor }];
    card.clipsContent = true;
    card.layoutMode = "VERTICAL";
    card.primaryAxisSizingMode = "FIXED";
    card.counterAxisSizingMode = "FIXED";
    card.paddingTop = 14;
    card.paddingBottom = 16;
    card.paddingLeft = 16;
    card.paddingRight = 16;
    card.itemSpacing = 8;
    card.primaryAxisAlignItems = "MIN";
    card.counterAxisAlignItems = "MIN";
    card.minWidth = width;
    card.maxWidth = width;
    card.minHeight = height;
    card.maxHeight = height;
    const headerRow = figma.createFrame();
    headerRow.name = "Header";
    headerRow.layoutMode = "HORIZONTAL";
    headerRow.layoutAlign = "STRETCH";
    headerRow.primaryAxisSizingMode = "AUTO";
    headerRow.counterAxisSizingMode = "AUTO";
    headerRow.primaryAxisAlignItems = "CENTER";
    headerRow.counterAxisAlignItems = "CENTER";
    headerRow.itemSpacing = 8;
    headerRow.fills = [];
    const titleText = figma.createText();
    titleText.name = "TitleText";
    titleText.fontName = { family: "Inter", style: "Bold" };
    titleText.fontSize = 13;
    titleText.characters = title;
    titleText.fills = [{ type: "SOLID", color: titleColor }];
    titleText.layoutGrow = 1;
    titleText.textAutoResize = "HEIGHT";
    titleText.textTruncation = "ENDING";
    titleText.maxLines = 1;
    titleText.setPluginData("node_role", "title");
    headerRow.appendChild(titleText);
    card.appendChild(headerRow);
    if (status && STATUS_CONFIG[status]) {
      const cfg = STATUS_CONFIG[status];
      const statusBadge = figma.createFrame();
      statusBadge.name = "StatusBadge";
      statusBadge.layoutMode = "HORIZONTAL";
      statusBadge.primaryAxisSizingMode = "AUTO";
      statusBadge.counterAxisSizingMode = "AUTO";
      statusBadge.primaryAxisAlignItems = "CENTER";
      statusBadge.counterAxisAlignItems = "CENTER";
      statusBadge.paddingLeft = 7;
      statusBadge.paddingRight = 7;
      statusBadge.paddingTop = 3;
      statusBadge.paddingBottom = 3;
      statusBadge.cornerRadius = 0;
      statusBadge.fills = [{ type: "SOLID", color: cfg.color }];
      statusBadge.setPluginData("is_status_badge", "true");
      const badgeText = figma.createText();
      badgeText.name = "StatusText";
      badgeText.fontName = { family: "Inter", style: "Bold" };
      badgeText.fontSize = 9;
      badgeText.characters = cfg.label.toUpperCase();
      badgeText.textAutoResize = "WIDTH_AND_HEIGHT";
      badgeText.fills = [{ type: "SOLID", color: cfg.textColor }];
      badgeText.locked = true;
      statusBadge.appendChild(badgeText);
      statusBadge.locked = true;
      card.appendChild(statusBadge);
      statusBadge.layoutPositioning = "ABSOLUTE";
      statusBadge.constraints = { horizontal: "MAX", vertical: "MAX" };
      statusBadge.x = card.width - statusBadge.width - 10;
      statusBadge.y = card.height - statusBadge.height - 10;
    }
    const descText = figma.createText();
    descText.name = "DescText";
    descText.fontName = { family: "Inter", style: "Regular" };
    descText.fontSize = 11;
    descText.characters = desc;
    descText.fills = [{ type: "SOLID", color: descColor }];
    descText.layoutAlign = "STRETCH";
    descText.textAutoResize = "HEIGHT";
    descText.textTruncation = "ENDING";
    const shapeAvailableH = Math.max(16, height - 14 - 16 - 8 - 20);
    descText.maxLines = Math.max(1, Math.floor(shapeAvailableH / 15));
    descText.setPluginData("node_role", "desc");
    card.appendChild(descText);
    if (stepNumber) {
      const stepBadge = figma.createFrame();
      stepBadge.name = `[Step] ${stepNumber}`;
      card.appendChild(stepBadge);
      stepBadge.layoutPositioning = "ABSOLUTE";
      stepBadge.x = -8;
      stepBadge.y = -8;
      stepBadge.resize(24, 24);
      stepBadge.primaryAxisSizingMode = "FIXED";
      stepBadge.counterAxisSizingMode = "FIXED";
      stepBadge.cornerRadius = 0;
      stepBadge.layoutMode = "HORIZONTAL";
      stepBadge.primaryAxisAlignItems = "CENTER";
      stepBadge.counterAxisAlignItems = "CENTER";
      stepBadge.fills = [{ type: "SOLID", color: { r: 0.1, g: 0.1, b: 0.14 } }];
      stepBadge.strokes = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
      stepBadge.strokeWeight = 1.5;
      stepBadge.setPluginData("is_step_badge", "true");
      const numText = figma.createText();
      numText.name = "NumText";
      numText.fontName = { family: "Inter", style: "Bold" };
      numText.fontSize = 11;
      numText.characters = `${stepNumber}`;
      numText.textAutoResize = "WIDTH_AND_HEIGHT";
      numText.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
      stepBadge.appendChild(numText);
    }
    card.setPluginData("is_flow_node", "true");
    card.setPluginData("schema_version", "2");
    card.setPluginData("node_theme", theme);
    if (status) card.setPluginData("workflow_status", status);
    if (stepNumber) card.setPluginData("step_number", `${stepNumber}`);
    parent.appendChild(card);
    const oldId = shape.id;
    const connectors = figma.currentPage.findAll((n) => n.type === "CONNECTOR");
    for (const conn of connectors) {
      if (conn.connectorStart && "endpointNodeId" in conn.connectorStart && conn.connectorStart.endpointNodeId === oldId) {
        const magnet = "magnet" in conn.connectorStart ? conn.connectorStart.magnet : "AUTO";
        conn.connectorStart = { endpointNodeId: card.id, magnet };
      }
      if (conn.connectorEnd && "endpointNodeId" in conn.connectorEnd && conn.connectorEnd.endpointNodeId === oldId) {
        const magnet = "magnet" in conn.connectorEnd ? conn.connectorEnd.magnet : "AUTO";
        conn.connectorEnd = { endpointNodeId: card.id, magnet };
      }
    }
    shape.remove();
    return card;
  }
  async function createFlowNode(payload) {
    try {
      await loadRequiredFonts();
      const title = (payload.title || "").trim() || "Welcome";
      const description = (payload.description || "").trim() || "Entry point of the flow.";
      const theme = payload.theme || "light";
      const width = payload.width ? Math.max(120, payload.width) : 250;
      const height = payload.height ? Math.max(50, payload.height) : 90;
      const isDark = theme === "dark";
      const bgColor = isDark ? { r: 0.14, g: 0.14, b: 0.15 } : { r: 1, g: 1, b: 1 };
      const borderColor = isDark ? { r: 0.28, g: 0.28, b: 0.3 } : { r: 0.15, g: 0.15, b: 0.18 };
      const titleColor = isDark ? { r: 0.98, g: 0.98, b: 1 } : { r: 0.1, g: 0.1, b: 0.12 };
      const descColor = isDark ? { r: 0.65, g: 0.68, b: 0.72 } : { r: 0.42, g: 0.45, b: 0.5 };
      const card = figma.createFrame();
      card.name = title;
      card.cornerRadius = 0;
      card.strokeWeight = 1.5;
      card.strokes = [{ type: "SOLID", color: borderColor }];
      card.fills = [{ type: "SOLID", color: bgColor }];
      card.clipsContent = true;
      card.layoutMode = "VERTICAL";
      card.primaryAxisSizingMode = "FIXED";
      card.counterAxisSizingMode = "FIXED";
      card.paddingTop = 14;
      card.paddingBottom = 16;
      card.paddingLeft = 16;
      card.paddingRight = 16;
      card.itemSpacing = 8;
      card.primaryAxisAlignItems = "MIN";
      card.counterAxisAlignItems = "MIN";
      card.resize(width, height);
      card.minWidth = width;
      card.maxWidth = width;
      card.minHeight = height;
      card.maxHeight = height;
      const headerRow = figma.createFrame();
      headerRow.name = "Header";
      headerRow.layoutMode = "HORIZONTAL";
      headerRow.layoutAlign = "STRETCH";
      headerRow.primaryAxisSizingMode = "AUTO";
      headerRow.counterAxisSizingMode = "AUTO";
      headerRow.primaryAxisAlignItems = "CENTER";
      headerRow.counterAxisAlignItems = "CENTER";
      headerRow.itemSpacing = 8;
      headerRow.fills = [];
      const titleText = figma.createText();
      titleText.name = "TitleText";
      titleText.fontName = { family: "Inter", style: "Bold" };
      titleText.fontSize = 13;
      titleText.characters = title;
      titleText.fills = [{ type: "SOLID", color: titleColor }];
      titleText.layoutGrow = 1;
      titleText.textAutoResize = "HEIGHT";
      titleText.textTruncation = "ENDING";
      titleText.maxLines = 1;
      titleText.setPluginData("node_role", "title");
      headerRow.appendChild(titleText);
      card.appendChild(headerRow);
      const descText = figma.createText();
      descText.name = "DescText";
      descText.fontName = { family: "Inter", style: "Regular" };
      descText.fontSize = 11;
      descText.characters = description;
      descText.fills = [{ type: "SOLID", color: descColor }];
      descText.layoutAlign = "STRETCH";
      descText.textAutoResize = "HEIGHT";
      descText.textTruncation = "ENDING";
      const initialAvailableH = Math.max(16, height - 14 - 16 - 8 - 20);
      descText.maxLines = Math.max(1, Math.floor(initialAvailableH / 15));
      descText.setPluginData("node_role", "desc");
      card.appendChild(descText);
      card.name = title;
      card.setPluginData("is_flow_node", "true");
      card.setPluginData("schema_version", "2");
      card.setPluginData("node_theme", theme);
      card.setPluginData("node_type", payload.nodeType || "Screen");
      if (payload.status) {
        card.setPluginData("workflow_status", payload.status);
        if (STATUS_CONFIG[payload.status]) {
          const cfg = STATUS_CONFIG[payload.status];
          const statusBadge = figma.createFrame();
          statusBadge.name = "StatusBadge";
          statusBadge.layoutMode = "HORIZONTAL";
          statusBadge.primaryAxisSizingMode = "AUTO";
          statusBadge.counterAxisSizingMode = "AUTO";
          statusBadge.primaryAxisAlignItems = "CENTER";
          statusBadge.counterAxisAlignItems = "CENTER";
          statusBadge.paddingLeft = 7;
          statusBadge.paddingRight = 7;
          statusBadge.paddingTop = 3;
          statusBadge.paddingBottom = 3;
          statusBadge.cornerRadius = 0;
          statusBadge.fills = [{ type: "SOLID", color: cfg.color }];
          statusBadge.setPluginData("is_status_badge", "true");
          const badgeText = figma.createText();
          badgeText.name = "StatusText";
          badgeText.fontName = { family: "Inter", style: "Bold" };
          badgeText.fontSize = 9;
          badgeText.characters = cfg.label.toUpperCase();
          badgeText.textAutoResize = "WIDTH_AND_HEIGHT";
          badgeText.fills = [{ type: "SOLID", color: cfg.textColor }];
          badgeText.locked = true;
          statusBadge.appendChild(badgeText);
          statusBadge.locked = true;
          card.appendChild(statusBadge);
          statusBadge.layoutPositioning = "ABSOLUTE";
          statusBadge.constraints = { horizontal: "MAX", vertical: "MAX" };
          statusBadge.x = card.width - statusBadge.width - 10;
          statusBadge.y = card.height - statusBadge.height - 10;
        }
      }
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
      notify(`[${title}] \uB178\uB4DC\uAC00 \uC0DD\uC131\uB418\uC5C8\uC2B5\uB2C8\uB2E4!`, "success");
    } catch (err) {
      notify(`\uB178\uB4DC \uC0DD\uC131 \uC2E4\uD328: ${String(err)}`, "error");
    }
  }
  async function updateFlowNode(payload) {
    try {
      let rawNode = figma.getNodeById(payload.nodeId);
      if (!rawNode) {
        const selection = figma.currentPage.selection;
        if (selection.length > 0) rawNode = selection[0];
      }
      let flowNode = findFlowNode(rawNode) || rawNode;
      if (!flowNode) {
        notify("\uC218\uC815\uD560 \uB178\uB4DC\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uCE94\uBC84\uC2A4\uC5D0\uC11C \uB178\uB4DC\uB97C \uC120\uD0DD\uD574 \uC8FC\uC138\uC694.", "warning");
        return;
      }
      if (flowNode.type === "SHAPE_WITH_TEXT") {
        flowNode = await convertShapeToFrameNode(flowNode);
      }
      await loadRequiredFonts();
      const title = payload.title.trim() || "Untitled";
      const description = payload.description.trim() || "";
      const isDark = payload.theme === "dark";
      const bgColor = isDark ? { r: 0.14, g: 0.14, b: 0.15 } : { r: 1, g: 1, b: 1 };
      const borderColor = isDark ? { r: 0.28, g: 0.28, b: 0.3 } : { r: 0.15, g: 0.15, b: 0.18 };
      const titleColor = isDark ? { r: 0.98, g: 0.98, b: 1 } : { r: 0.1, g: 0.1, b: 0.12 };
      const descColor = isDark ? { r: 0.65, g: 0.68, b: 0.72 } : { r: 0.42, g: 0.45, b: 0.5 };
      const card = flowNode;
      card.name = title;
      card.cornerRadius = 0;
      card.clipsContent = true;
      card.fills = [{ type: "SOLID", color: bgColor }];
      card.strokes = [{ type: "SOLID", color: borderColor }];
      if (payload.width && payload.height) {
        const w = Math.max(120, payload.width);
        const h = Math.max(50, payload.height);
        const isHug = payload.sizeMode === "hug";
        card.minWidth = null;
        card.maxWidth = null;
        card.minHeight = null;
        card.maxHeight = null;
        if (isHug) {
          const existingDesc = card.children.find(
            (c) => c.name === "DescText" || c.getPluginData("node_role") === "desc"
          );
          if (existingDesc) {
            existingDesc.maxLines = null;
          }
          if (card.width !== w) {
            card.counterAxisSizingMode = "FIXED";
            card.resize(w, card.height);
          }
          card.counterAxisSizingMode = "FIXED";
          card.primaryAxisSizingMode = "AUTO";
          card.minWidth = w;
          card.maxWidth = w;
          card.minHeight = null;
          card.maxHeight = null;
        } else {
          card.resize(w, h);
          card.primaryAxisSizingMode = "FIXED";
          card.counterAxisSizingMode = "FIXED";
          card.minWidth = w;
          card.maxWidth = w;
          card.minHeight = h;
          card.maxHeight = h;
        }
        const statusBadge = card.children.find(
          (c) => c.getPluginData("is_status_badge") === "true" || c.name === "StatusBadge"
        );
        if (statusBadge) {
          statusBadge.constraints = { horizontal: "MAX", vertical: "MAX" };
          statusBadge.x = w - statusBadge.width - 10;
          statusBadge.y = h - statusBadge.height - 10;
        }
      }
      let headerRow = card.children.find(
        (c) => c.name === "Header" || c.type === "FRAME" && c.layoutMode === "HORIZONTAL"
      );
      if (!headerRow) {
        headerRow = figma.createFrame();
        headerRow.name = "Header";
        headerRow.layoutMode = "HORIZONTAL";
        headerRow.layoutAlign = "STRETCH";
        headerRow.primaryAxisAlignItems = "CENTER";
        headerRow.counterAxisAlignItems = "CENTER";
        headerRow.itemSpacing = 8;
        headerRow.fills = [];
        card.insertChild(0, headerRow);
      }
      let titleText = headerRow.children.find(
        (c) => c.name === "TitleText" || c.getPluginData("node_role") === "title"
      );
      if (!titleText) {
        titleText = figma.createText();
        titleText.name = "TitleText";
        titleText.fontName = { family: "Inter", style: "Bold" };
        titleText.fontSize = 13;
        titleText.layoutGrow = 1;
        titleText.textAutoResize = "HEIGHT";
        titleText.setPluginData("node_role", "title");
        headerRow.insertChild(0, titleText);
      }
      titleText.textTruncation = "ENDING";
      titleText.maxLines = 1;
      await safeSetCharacters(titleText, title);
      if (!Array.isArray(titleText.fills) || titleText.fills.length === 0) {
        titleText.fills = [{ type: "SOLID", color: titleColor }];
      }
      let descText = card.children.find(
        (c) => c.name === "DescText" || c.getPluginData("node_role") === "desc"
      );
      if (!descText) {
        descText = figma.createText();
        descText.name = "DescText";
        descText.fontName = { family: "Inter", style: "Regular" };
        descText.fontSize = 11;
        descText.layoutAlign = "STRETCH";
        descText.textAutoResize = "HEIGHT";
        descText.setPluginData("node_role", "desc");
        card.appendChild(descText);
      }
      descText.textTruncation = "ENDING";
      const isHugMode = payload.sizeMode === "hug" || card.primaryAxisSizingMode === "AUTO";
      if (isHugMode) {
        descText.maxLines = null;
      } else {
        const currentH = payload.height || card.height;
        const availableH = Math.max(16, currentH - 14 - 16 - 8 - 20);
        descText.maxLines = Math.max(1, Math.floor(availableH / 15));
      }
      await safeSetCharacters(descText, description);
      if (!Array.isArray(descText.fills) || descText.fills.length === 0) {
        descText.fills = [{ type: "SOLID", color: descColor }];
      }
      card.name = title;
      card.setPluginData("is_flow_node", "true");
      card.setPluginData("schema_version", "2");
      card.setPluginData("node_title", "");
      card.setPluginData("node_desc", "");
      card.setPluginData("node_tag", "");
      card.setPluginData("node_width", "");
      card.setPluginData("node_height", "");
      if (payload.theme) card.setPluginData("node_theme", payload.theme);
      if (payload.nodeType) card.setPluginData("node_type", payload.nodeType);
      figma.currentPage.selection = [card];
      handleSelectionChange();
      notify(`[${title}] \uB178\uB4DC\uAC00 \uC5C5\uB370\uC774\uD2B8\uB418\uC5C8\uC2B5\uB2C8\uB2E4!`, "success");
    } catch (err) {
      notify(`\uB178\uB4DC \uC218\uC815 \uC2E4\uD328: ${String(err)}`, "error");
    }
  }
  async function resizeNode(nodeId, width, height) {
    try {
      let rawNode = figma.getNodeById(nodeId);
      if (!rawNode) {
        const selection = figma.currentPage.selection;
        if (selection.length > 0) rawNode = selection[0];
      }
      let flowNode = findFlowNode(rawNode) || rawNode;
      if (!flowNode || !("resize" in flowNode)) return;
      if (flowNode.type === "SHAPE_WITH_TEXT") {
        flowNode = await convertShapeToFrameNode(flowNode);
      }
      const w = Math.max(120, width);
      const h = Math.max(50, height);
      const frame = flowNode;
      frame.minWidth = null;
      frame.maxWidth = null;
      frame.minHeight = null;
      frame.maxHeight = null;
      frame.resize(w, h);
      frame.primaryAxisSizingMode = "FIXED";
      frame.counterAxisSizingMode = "FIXED";
      frame.clipsContent = true;
      frame.minWidth = w;
      frame.maxWidth = w;
      frame.minHeight = h;
      frame.maxHeight = h;
      const headerRow = frame.children.find(
        (c) => c.name === "Header" || c.type === "FRAME" && c.layoutMode === "HORIZONTAL"
      );
      if (headerRow) {
        const title = headerRow.children.find(
          (c) => c.name === "TitleText" || c.getPluginData("node_role") === "title"
        );
        if (title) {
          title.textTruncation = "ENDING";
          title.maxLines = 1;
        }
      }
      const desc = frame.children.find(
        (c) => c.name === "DescText" || c.getPluginData("node_role") === "desc"
      );
      if (desc) {
        desc.textTruncation = "ENDING";
        const availableH = Math.max(16, h - 14 - 16 - 8 - 20);
        desc.maxLines = Math.max(1, Math.floor(availableH / 15));
      }
      const statusBadge = frame.children.find(
        (c) => c.getPluginData("is_status_badge") === "true" || c.name === "StatusBadge"
      );
      if (statusBadge) {
        statusBadge.constraints = { horizontal: "MAX", vertical: "MAX" };
        statusBadge.x = w - statusBadge.width - 10;
        statusBadge.y = h - statusBadge.height - 10;
      }
      handleSelectionChange();
    } catch (err) {
      console.error("Resize failed", err);
    }
  }
  function hexToRgbColor(hex) {
    const clean = hex.replace("#", "");
    const r = parseInt(clean.substring(0, 2), 16) / 255;
    const g = parseInt(clean.substring(2, 4), 16) / 255;
    const b = parseInt(clean.substring(4, 6), 16) / 255;
    return {
      r: isNaN(r) ? 0.18 : r,
      g: isNaN(g) ? 0.18 : g,
      b: isNaN(b) ? 0.22 : b
    };
  }
  async function connectPoints(payload) {
    try {
      let sourceNode = figma.getNodeById(payload.sourceNodeId);
      let targetNode = figma.getNodeById(payload.targetNodeId);
      if (!sourceNode || !targetNode) {
        notify("\uC5F0\uACB0\uD560 \uB178\uB4DC\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.", "warning");
        return;
      }
      const sourceFlow = findFlowNode(sourceNode);
      if (sourceFlow) sourceNode = sourceFlow;
      const targetFlow = findFlowNode(targetNode);
      if (targetFlow) targetNode = targetFlow;
      if (sourceNode.id === targetNode.id) {
        notify("\uC11C\uB85C \uB2E4\uB978 \uB450 \uB178\uB4DC\uB97C \uC120\uD0DD\uD558\uC5EC \uC5F0\uACB0\uD574 \uC8FC\uC138\uC694.", "warning");
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
      notify(`\uC5F0\uACB0 \uC644\uB8CC${payload.label ? ` (\uB77C\uBCA8: "${payload.label}")` : ""}`, "success");
    } catch (err) {
      notify(`\uC5F0\uACB0\uC120 \uC0DD\uC131 \uC2E4\uD328: ${String(err)}`, "error");
    }
  }
  async function createSingleConnector(sourceNode, sourceMagnet, targetNode, targetMagnet, label, colorHex, strokeWeight) {
    const connWeight = typeof strokeWeight === "number" ? strokeWeight : 1.5;
    const connColor = colorHex ? hexToRgbColor(colorHex) : { r: 0, g: 0, b: 0 };
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
        targetNodeId: targetNode.id
      }
    );
  }
  async function autoConnectSelected(label) {
    try {
      const rawSelection = [...figma.currentPage.selection];
      if (rawSelection.length < 2) {
        notify("\uC5F0\uACB0\uD560 \uB178\uB4DC\uB97C 2\uAC1C \uC774\uC0C1 \uC120\uD0DD\uD574 \uC8FC\uC138\uC694.", "warning");
        return;
      }
      const nodesMap = /* @__PURE__ */ new Map();
      for (const n of rawSelection) {
        const flow = findFlowNode(n) || n;
        nodesMap.set(flow.id, flow);
      }
      const nodes = Array.from(nodesMap.values());
      if (nodes.length < 2) {
        notify("\uC11C\uB85C \uB2E4\uB978 \uB178\uB4DC\uB97C 2\uAC1C \uC774\uC0C1 \uC120\uD0DD\uD574 \uC8FC\uC138\uC694.", "warning");
        return;
      }
      await loadRequiredFonts();
      if (nodes.length === 2) {
        const sourceNode = nodes[0];
        const targetNode = nodes[1];
        const dx = targetNode.x - sourceNode.x;
        const dy = targetNode.y - sourceNode.y;
        let sourceMagnet = "RIGHT";
        let targetMagnet = "LEFT";
        if (Math.abs(dx) >= Math.abs(dy)) {
          if (dx >= 0) {
            sourceMagnet = "RIGHT";
            targetMagnet = "LEFT";
          } else {
            sourceMagnet = "LEFT";
            targetMagnet = "RIGHT";
          }
        } else {
          if (dy >= 0) {
            sourceMagnet = "BOTTOM";
            targetMagnet = "TOP";
          } else {
            sourceMagnet = "TOP";
            targetMagnet = "BOTTOM";
          }
        }
        const conn = await createSingleConnector(sourceNode, sourceMagnet, targetNode, targetMagnet, label);
        figma.currentPage.selection = [conn];
        handleSelectionChange();
        notify(`\uCE7C\uAC01 \uC9C1\uAC01 \uC5F0\uACB0 \uC644\uB8CC${label ? ` (\uB77C\uBCA8: "${label}")` : ""}`, "success");
        return;
      }
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
        nodes.sort((a, b) => a.x - b.x);
      } else {
        nodes.sort((a, b) => a.y - b.y);
      }
      const createdConnectors = [];
      for (let i = 0; i < nodes.length - 1; i++) {
        const src = nodes[i];
        const tgt = nodes[i + 1];
        const dx = tgt.x - src.x;
        const dy = tgt.y - src.y;
        let srcMagnet = "RIGHT";
        let tgtMagnet = "LEFT";
        if (Math.abs(dx) >= Math.abs(dy)) {
          if (dx >= 0) {
            srcMagnet = "RIGHT";
            tgtMagnet = "LEFT";
          } else {
            srcMagnet = "LEFT";
            tgtMagnet = "RIGHT";
          }
        } else {
          if (dy >= 0) {
            srcMagnet = "BOTTOM";
            tgtMagnet = "TOP";
          } else {
            srcMagnet = "TOP";
            tgtMagnet = "BOTTOM";
          }
        }
        const lineLabel = i === 0 && label ? label : void 0;
        const conn = await createSingleConnector(src, srcMagnet, tgt, tgtMagnet, lineLabel);
        createdConnectors.push(conn);
      }
      figma.currentPage.selection = createdConnectors;
      handleSelectionChange();
      notify(`\u26A1 \uCD1D ${nodes.length}\uAC1C \uB178\uB4DC\uAC00 \uCE7C\uAC01 \uC9C1\uAC01 \uC21C\uCC28 \uC5F0\uACB0\uB418\uC5C8\uC2B5\uB2C8\uB2E4 (${createdConnectors.length}\uAC1C \uC5F0\uACB0\uC120).`, "success");
    } catch (err) {
      notify(`\uC21C\uCC28 \uC790\uB3D9 \uC5F0\uACB0 \uC2E4\uD328: ${String(err)}`, "error");
    }
  }
  async function updateConnectorLabel(connectorId, label) {
    try {
      let node = figma.getNodeById(connectorId);
      if (!node || node.type !== "CONNECTOR") {
        const selection = figma.currentPage.selection;
        if (selection.length > 0 && selection[0].type === "CONNECTOR") {
          node = selection[0];
        }
      }
      if (!node || node.type !== "CONNECTOR") {
        notify("\uC218\uC815\uD560 \uC5F0\uACB0\uC120(\uCEE4\uB125\uD130)\uC744 \uCE94\uBC84\uC2A4\uC5D0\uC11C \uC120\uD0DD\uD574 \uC8FC\uC138\uC694.", "warning");
        return;
      }
      const conn = node;
      try {
        await figma.loadFontAsync({ family: "Inter", style: "Medium" });
        conn.text.fontName = { family: "Inter", style: "Medium" };
      } catch {
        await figma.loadFontAsync({ family: "Inter", style: "Regular" });
        conn.text.fontName = { family: "Inter", style: "Regular" };
      }
      conn.text.characters = label.trim();
      conn.text.fontSize = 11;
      notify(
        label.trim() ? `\uC120 \uC911\uC559 \uD14D\uC2A4\uD2B8\uAC00 "${label.trim()}"(\uC73C)\uB85C \uBC18\uC601\uB418\uC5C8\uC2B5\uB2C8\uB2E4!` : "\uC120 \uC911\uC559 \uD14D\uC2A4\uD2B8\uAC00 \uC9C0\uC6CC\uC84C\uC2B5\uB2C8\uB2E4.",
        "success"
      );
      handleSelectionChange();
    } catch (err) {
      notify(`\uC120 \uD14D\uC2A4\uD2B8 \uC218\uC815 \uC2E4\uD328: ${String(err)}`, "error");
    }
  }
  async function updateConnectorProperties(payload) {
    try {
      let node = figma.getNodeById(payload.connectorId);
      if (!node) {
        const selection = figma.currentPage.selection;
        if (selection.length > 0) node = selection[0];
      }
      if (!node) {
        notify("\uC218\uC815\uD560 \uCEE4\uB125\uD130\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.", "warning");
        return;
      }
      await loadRequiredFonts();
      if (node.type === "CONNECTOR") {
        const conn = node;
        if (payload.colorHex) {
          conn.strokes = [{ type: "SOLID", color: hexToRgbColor(payload.colorHex) }];
        }
        if (typeof payload.strokeWeight === "number") {
          conn.strokeWeight = payload.strokeWeight;
        }
        if (payload.strokePattern === "DASHED") {
          conn.dashPattern = [4, 4];
        } else if (payload.strokePattern === "DOTTED") {
          conn.dashPattern = [1.5, 3];
        } else {
          conn.dashPattern = [];
        }
        if (payload.routingType === "STRAIGHT") {
          conn.connectorLineType = "STRAIGHT";
        } else {
          conn.connectorLineType = "ELBOWED";
        }
        const mapCap = (term) => {
          switch (term) {
            case "ARROW":
              return "ARROW_LINES";
            case "TRIANGLE_ARROW":
              return "ARROW_EQUILATERAL";
            case "REVERSED_TRIANGLE_ARROW":
              return "ARROW_EQUILATERAL";
            case "DIAMOND":
              return "DIAMOND_FILLED";
            case "CIRCLE":
              return "CIRCLE_FILLED";
            default:
              return "NONE";
          }
        };
        if (payload.startTerminal && payload.startTerminal !== "MIXED") {
          conn.connectorStartStrokeCap = mapCap(payload.startTerminal);
        }
        if (payload.endTerminal && payload.endTerminal !== "MIXED") {
          conn.connectorEndStrokeCap = mapCap(payload.endTerminal);
        }
        if (payload.hasLabel && payload.label !== void 0) {
          if (conn.text) {
            await safeSetCharacters(conn.text, payload.label.trim());
          }
        } else if (payload.hasLabel === false && conn.text) {
          await safeSetCharacters(conn.text, "");
        }
        if (payload.sourceMagnet && conn.connectorStart && "endpointNodeId" in conn.connectorStart) {
          conn.connectorStart = {
            endpointNodeId: conn.connectorStart.endpointNodeId,
            magnet: payload.sourceMagnet
          };
        }
        if (payload.targetMagnet && conn.connectorEnd && "endpointNodeId" in conn.connectorEnd) {
          conn.connectorEnd = {
            endpointNodeId: conn.connectorEnd.endpointNodeId,
            magnet: payload.targetMagnet
          };
        }
      } else {
        let vectorNode = null;
        if (node.type === "VECTOR") {
          vectorNode = node;
        } else if ("findOne" in node) {
          vectorNode = node.findOne((n) => n.type === "VECTOR");
        }
        const rgb = payload.colorHex ? hexToRgbColor(payload.colorHex) : void 0;
        if (vectorNode) {
          if (rgb) {
            vectorNode.strokes = [{ type: "SOLID", color: rgb }];
          }
          if (typeof payload.strokeWeight === "number") {
            vectorNode.strokeWeight = payload.strokeWeight;
          }
          if (payload.strokePattern === "DASHED") {
            vectorNode.dashPattern = [4, 4];
          } else if (payload.strokePattern === "DOTTED") {
            vectorNode.dashPattern = [1.5, 3];
          } else {
            vectorNode.dashPattern = [];
          }
          if (payload.endTerminal === "ARROW") {
            vectorNode.strokeCap = "ARROW_EQUILATERAL";
          } else {
            vectorNode.strokeCap = "NONE";
          }
        }
        let labelFrame = null;
        if (node.type === "GROUP") {
          labelFrame = node.findOne(
            (n) => n.name === "ConnectorLabel" || n.getPluginData("is_connector_label") === "true"
          );
        }
        if (payload.hasLabel && payload.label) {
          node.setPluginData("connector_label", payload.label.trim());
          if (labelFrame) {
            labelFrame.visible = true;
            const textNode = labelFrame.findOne((n) => n.type === "TEXT");
            if (textNode) {
              await safeSetCharacters(textNode, payload.label.trim());
              if (rgb) textNode.fills = [{ type: "SOLID", color: rgb }];
            }
          }
        } else if (payload.hasLabel === false) {
          node.setPluginData("connector_label", "");
          if (labelFrame) {
            labelFrame.visible = false;
          }
        }
        if (payload.colorHex) node.setPluginData("connector_color", payload.colorHex);
        if (payload.strokeWeight) node.setPluginData("connector_weight", String(payload.strokeWeight));
        if (payload.strokePattern) node.setPluginData("connector_pattern", payload.strokePattern);
        if (payload.routingType) node.setPluginData("connector_routing", payload.routingType);
        if (payload.startTerminal) node.setPluginData("start_terminal", payload.startTerminal);
        if (payload.endTerminal) node.setPluginData("end_terminal", payload.endTerminal);
        if (payload.sourceMagnet) {
          node.setPluginData("source_magnet", payload.sourceMagnet);
        }
        if (payload.targetMagnet) {
          node.setPluginData("target_magnet", payload.targetMagnet);
        }
        await updateOrthogonalVectorConnector(node, payload.sourceMagnet, payload.targetMagnet);
      }
      notify("\uCEE4\uB125\uD130 \uC635\uC158\uC774 \uC131\uACF5\uC801\uC73C\uB85C \uC218\uC815\uB418\uC5C8\uC2B5\uB2C8\uB2E4.", "success");
      handleSelectionChange();
    } catch (err) {
      notify(`\uCEE4\uB125\uD130 \uC218\uC815 \uC2E4\uD328: ${String(err)}`, "error");
    }
  }
  async function setConnectorLineType(connectorId, lineType = "ELBOWED") {
    try {
      let node = null;
      if (connectorId) {
        node = figma.getNodeById(connectorId);
      }
      if (!node || node.type !== "CONNECTOR") {
        const selection = figma.currentPage.selection;
        if (selection.length > 0 && selection[0].type === "CONNECTOR") {
          node = selection[0];
        }
      }
      if (!node || node.type !== "CONNECTOR") {
        notify("\uBCC0\uACBD\uD560 \uC5F0\uACB0\uC120(\uCEE4\uB125\uD130)\uC744 \uCE94\uBC84\uC2A4\uC5D0\uC11C \uC120\uD0DD\uD574 \uC8FC\uC138\uC694.", "warning");
        return;
      }
      const conn = node;
      conn.connectorLineType = lineType;
      notify(
        lineType === "ELBOWED" ? "\u{1F4D0} \uC5F0\uACB0\uC120\uC774 [\uC9C1\uAC01(Elbowed)]\uC73C\uB85C \uBCC0\uACBD\uB418\uC5C8\uC2B5\uB2C8\uB2E4." : "\u{1F4CF} \uC5F0\uACB0\uC120\uC774 [\uC9C1\uC120(Straight)]\uC73C\uB85C \uBCC0\uACBD\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
        "success"
      );
      handleSelectionChange();
    } catch (err) {
      notify(`\uC5F0\uACB0\uC120 \uD615\uD0DC \uBCC0\uACBD \uC2E4\uD328: ${String(err)}`, "error");
    }
  }
  async function convertAllConnectorsToElbowed() {
    try {
      const connectors = figma.currentPage.findAll((n) => n.type === "CONNECTOR");
      if (connectors.length === 0) {
        notify("\uCE94\uBC84\uC2A4\uC5D0 \uBCC0\uD658\uD560 \uC5F0\uACB0\uC120\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.", "info");
        return;
      }
      let convertedCount = 0;
      for (const conn of connectors) {
        if (conn.connectorLineType !== "ELBOWED") {
          conn.connectorLineType = "ELBOWED";
          convertedCount++;
        }
      }
      if (convertedCount > 0) {
        notify(`\u26A1 \uCD1D ${convertedCount}\uAC1C\uC758 \uC5F0\uACB0\uC120\uC744 \uBAA8\uB450 [\uC9C1\uAC01(Elbowed)]\uC73C\uB85C \uC77C\uAD04 \uBCC0\uD658\uD588\uC2B5\uB2C8\uB2E4!`, "success");
      } else {
        notify(`\uC774\uBBF8 \uBAA8\uB4E0 \uC5F0\uACB0\uC120(${connectors.length}\uAC1C)\uC774 [\uC9C1\uAC01(Elbowed)] \uC0C1\uD0DC\uC785\uB2C8\uB2E4.`, "info");
      }
      handleSelectionChange();
    } catch (err) {
      notify(`\uC5F0\uACB0\uC120 \uC77C\uAD04 \uBCC0\uD658 \uC2E4\uD328: ${String(err)}`, "error");
    }
  }
  async function toggleNodeTheme(nodeId) {
    let target = figma.getNodeById(nodeId);
    const flowParent = findFlowNode(target);
    const node = flowParent || target;
    if (!node || node.getPluginData("is_flow_node") !== "true") return;
    const currentTheme = node.getPluginData("node_theme") === "dark" ? "dark" : "light";
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    const extracted = extractNodeText(node);
    await updateFlowNode({
      nodeId: node.id,
      title: extracted.title,
      description: extracted.description,
      tag: node.getPluginData("node_tag") || "p1",
      theme: newTheme,
      figmaLink: node.getPluginData("figma_link"),
      figmaFrameId: node.getPluginData("figma_frame_id")
    });
  }
  function collectStatusItems() {
    const nodes = figma.currentPage.findAll((node) => {
      return Boolean(node.getPluginData("workflow_status"));
    });
    return nodes.map((node) => {
      const status = node.getPluginData("workflow_status");
      if (node.type === "FRAME" && node.getPluginData("is_flow_node") === "true") {
        const frame = node;
        const statusBadge = frame.children.find(
          (c) => c.getPluginData("is_status_badge") === "true" || c.name === "StatusBadge"
        );
        if (statusBadge && statusBadge.y <= 0) {
          statusBadge.constraints = { horizontal: "MAX", vertical: "MAX" };
          statusBadge.x = frame.width - statusBadge.width - 10;
          statusBadge.y = frame.height - statusBadge.height - 10;
        }
      }
      const extracted = extractNodeText(node);
      return {
        id: node.id,
        name: extracted.title || node.name,
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
  async function applyStatusToSelected(status) {
    const selection = figma.currentPage.selection;
    if (selection.length === 0) {
      notify("\uC0C1\uD0DC\uB97C \uC9C0\uC815\uD560 \uC694\uC18C\uB97C 1\uAC1C \uC774\uC0C1 \uC120\uD0DD\uD574 \uC8FC\uC138\uC694.", "warning");
      return;
    }
    await loadRequiredFonts();
    const cfg = STATUS_CONFIG[status];
    for (const rawNode of selection) {
      let flowNode = findFlowNode(rawNode) || rawNode;
      if (flowNode.type === "SHAPE_WITH_TEXT") {
        flowNode = await convertShapeToFrameNode(flowNode);
      }
      if (flowNode.type === "FRAME") {
        const card = flowNode;
        card.clipsContent = false;
        card.setPluginData("workflow_status", status);
        const headerRow = card.children.find(
          (c) => c.name === "Header" || c.type === "FRAME" && c.layoutMode === "HORIZONTAL"
        );
        let oldBadgeInHeader;
        if (headerRow) {
          oldBadgeInHeader = headerRow.children.find(
            (c) => c.getPluginData("is_status_badge") === "true" || c.name === "StatusBadge"
          );
        }
        let statusBadge = card.children.find(
          (c) => c.getPluginData("is_status_badge") === "true" || c.name === "StatusBadge"
        );
        if (!statusBadge && oldBadgeInHeader) {
          statusBadge = oldBadgeInHeader;
          card.appendChild(statusBadge);
        }
        if (!statusBadge) {
          statusBadge = figma.createFrame();
          statusBadge.name = "StatusBadge";
          statusBadge.layoutMode = "HORIZONTAL";
          statusBadge.primaryAxisSizingMode = "AUTO";
          statusBadge.counterAxisSizingMode = "AUTO";
          statusBadge.primaryAxisAlignItems = "CENTER";
          statusBadge.counterAxisAlignItems = "CENTER";
          statusBadge.paddingLeft = 7;
          statusBadge.paddingRight = 7;
          statusBadge.paddingTop = 3;
          statusBadge.paddingBottom = 3;
          statusBadge.cornerRadius = 0;
          statusBadge.setPluginData("is_status_badge", "true");
          const badgeText = figma.createText();
          badgeText.name = "StatusText";
          badgeText.fontName = { family: "Inter", style: "Bold" };
          badgeText.fontSize = 9;
          badgeText.textAutoResize = "WIDTH_AND_HEIGHT";
          statusBadge.appendChild(badgeText);
          card.appendChild(statusBadge);
        }
        statusBadge.fills = [{ type: "SOLID", color: cfg.color }];
        const textNode = statusBadge.children.find((c) => c.type === "TEXT");
        if (textNode) {
          textNode.locked = false;
          await safeSetCharacters(textNode, cfg.label.toUpperCase());
          textNode.fills = [{ type: "SOLID", color: cfg.textColor }];
          textNode.locked = true;
        }
        if (card.layoutMode !== "NONE") {
          statusBadge.layoutPositioning = "ABSOLUTE";
        }
        statusBadge.constraints = { horizontal: "MAX", vertical: "MAX" };
        statusBadge.x = card.width - statusBadge.width - 10;
        statusBadge.y = card.height - statusBadge.height - 10;
        statusBadge.visible = true;
        statusBadge.locked = true;
      }
    }
    syncStatusList();
    handleSelectionChange();
    notify(`${selection.length}\uAC1C \uB178\uB4DC\uC5D0 [${cfg.label}] \uC0C1\uD0DC \uBC43\uC9C0\uAC00 \uBD80\uCC29\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`, "success");
  }
  async function addStepBadges(startNumber = 1) {
    const rawSelection = [...figma.currentPage.selection];
    if (rawSelection.length === 0) {
      notify("\uC2A4\uD15D \uBC88\uD638\uB97C \uB9E4\uAE38 \uC694\uC18C\uB97C \uCE94\uBC84\uC2A4\uC5D0\uC11C \uC120\uD0DD\uD574 \uC8FC\uC138\uC694.", "warning");
      return;
    }
    const nodesMap = /* @__PURE__ */ new Map();
    for (const n of rawSelection) {
      let flow = findFlowNode(n) || n;
      if (flow.type === "SHAPE_WITH_TEXT") {
        flow = await convertShapeToFrameNode(flow);
      }
      if (flow.type === "FRAME") {
        nodesMap.set(flow.id, flow);
      }
    }
    const selection = Array.from(nodesMap.values());
    selection.sort((a, b) => a.x - b.x);
    await loadRequiredFonts();
    let currentNum = startNumber;
    for (const card of selection) {
      card.clipsContent = false;
      card.setPluginData("step_number", `${currentNum}`);
      let stepBadge = card.children.find(
        (c) => c.getPluginData("is_step_badge") === "true" || c.name.startsWith("[Step]")
      );
      if (!stepBadge) {
        stepBadge = figma.createFrame();
        stepBadge.name = `[Step] ${currentNum}`;
        card.appendChild(stepBadge);
        if (card.layoutMode !== "NONE") {
          stepBadge.layoutPositioning = "ABSOLUTE";
        }
        stepBadge.x = -8;
        stepBadge.y = -8;
        stepBadge.resize(24, 24);
        stepBadge.primaryAxisSizingMode = "FIXED";
        stepBadge.counterAxisSizingMode = "FIXED";
        stepBadge.cornerRadius = 0;
        stepBadge.layoutMode = "HORIZONTAL";
        stepBadge.primaryAxisAlignItems = "CENTER";
        stepBadge.counterAxisAlignItems = "CENTER";
        stepBadge.fills = [{ type: "SOLID", color: { r: 0.1, g: 0.1, b: 0.14 } }];
        stepBadge.strokes = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
        stepBadge.strokeWeight = 1.5;
        stepBadge.setPluginData("is_step_badge", "true");
        stepBadge.visible = true;
        const numText2 = figma.createText();
        numText2.name = "NumText";
        numText2.fontName = { family: "Inter", style: "Bold" };
        numText2.fontSize = 11;
        numText2.textAutoResize = "WIDTH_AND_HEIGHT";
        numText2.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
        stepBadge.appendChild(numText2);
      } else {
        card.appendChild(stepBadge);
        if (card.layoutMode !== "NONE") {
          stepBadge.layoutPositioning = "ABSOLUTE";
        }
        stepBadge.x = -8;
        stepBadge.y = -8;
        stepBadge.visible = true;
      }
      stepBadge.name = `[Step] ${currentNum}`;
      const numText = stepBadge.children.find((c) => c.type === "TEXT");
      if (numText) {
        await safeSetCharacters(numText, `${currentNum}`);
      }
      currentNum++;
    }
    notify(`${selection.length}\uAC1C \uB178\uB4DC\uC5D0 \uC77C\uCCB4\uD615 \uC2A4\uD15D \uBC88\uD638\uAC00 \uBD80\uC5EC\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`, "success");
  }
  async function removeStepBadges() {
    const rawSelection = [...figma.currentPage.selection];
    if (rawSelection.length === 0) {
      notify("\uC2A4\uD15D \uBC88\uD638\uB97C \uC81C\uAC70\uD560 \uC694\uC18C\uB97C \uCE94\uBC84\uC2A4\uC5D0\uC11C \uC120\uD0DD\uD574 \uC8FC\uC138\uC694.", "warning");
      return;
    }
    let removedCount = 0;
    for (const n of rawSelection) {
      let flow = findFlowNode(n) || n;
      if (flow.type === "SHAPE_WITH_TEXT") {
        flow = await convertShapeToFrameNode(flow);
      }
      if (flow.type === "FRAME") {
        const card = flow;
        card.setPluginData("step_number", "");
        const stepBadges = card.children.filter((c) => c.getPluginData("is_step_badge") === "true");
        for (const badge of stepBadges) {
          badge.remove();
          removedCount++;
        }
      }
    }
    if (removedCount > 0) {
      notify(`${removedCount}\uAC1C \uB178\uB4DC\uC758 \uC2A4\uD15D \uBC88\uD638\uAC00 \uC81C\uAC70\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`, "info");
    } else {
      notify("\uC120\uD0DD\uD55C \uB178\uB4DC\uC5D0 \uC2A4\uD15D \uBC88\uD638\uAC00 \uC874\uC7AC\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.", "info");
    }
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
  async function loadSavedSettings() {
    const token = await figma.clientStorage.getAsync("figma_token") || "";
    const fileUrl = await figma.clientStorage.getAsync("figma_file_url") || "";
    postToUI({
      type: "SETTINGS_LOADED",
      token,
      fileUrl
    });
  }
  async function saveSettings(token, fileUrl) {
    await figma.clientStorage.setAsync("figma_token", token);
    await figma.clientStorage.setAsync("figma_file_url", fileUrl);
    notify("\uD53C\uADF8\uB9C8 \uC5F0\uB3D9 \uC124\uC815\uC774 \uC548\uC804\uD558\uAC8C \uC800\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4.", "success");
  }
  async function extractUI3Variables() {
    try {
      if (!("variables" in figma) || !figma.variables) {
        notify("\uC774 \uD53C\uADF8\uB9C8 \uBC84\uC804\uC5D0\uC11C\uB294 Variables API\uB97C \uC9C0\uC6D0\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.", "warning");
        return;
      }
      const collections = await figma.variables.getLocalVariableCollectionsAsync();
      const variables = await figma.variables.getLocalVariablesAsync();
      if (variables.length === 0) {
        notify("\uD604\uC7AC \uC5F4\uB9B0 \uD30C\uC77C\uC5D0 \uB4F1\uB85D\uB41C \uB85C\uCEEC \uBCC0\uC218(Variables)\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4. UI3 Kit \uD30C\uC77C \uD0ED\uC5D0\uC11C \uC2E4\uD589\uD574 \uC8FC\uC138\uC694.", "warning");
        return;
      }
      const varMap = /* @__PURE__ */ new Map();
      for (const v of variables) {
        varMap.set(v.id, v);
      }
      let cssLight = `/* ========================================================
   Figma UI3 Variables (Total: ${variables.length})
   Collections: ${collections.map((c) => c.name).join(", ")}
   ======================================================== */
:root {
`;
      let cssDark = `
/* Dark Mode Overrides */
.figma-dark, [data-theme="dark"] {
`;
      let lightCount = 0;
      let darkCount = 0;
      for (const v of variables) {
        const col = collections.find((c) => c.id === v.variableCollectionId);
        const colName = col ? col.name : "Tokens";
        const rawName = v.name.replace(/[\/\s_]+/g, "-").toLowerCase();
        const cssVarName = rawName.startsWith("--") ? rawName : `--figma-${rawName}`;
        if (!col || col.modes.length === 0) continue;
        const defaultMode = col.modes[0];
        const darkModes = col.modes.filter(
          (m) => m.name.toLowerCase().includes("dark") || m.name.toLowerCase().includes("night")
        );
        const darkMode = darkModes.length > 0 ? darkModes[0] : col.modes.length > 1 ? col.modes[1] : null;
        const resolveVal = (modeId, depth = 0) => {
          if (depth > 5) return null;
          const raw = v.valuesByMode[modeId];
          if (raw && typeof raw === "object" && "type" in raw && raw.type === "VARIABLE_ALIAS") {
            const targetVar = varMap.get(raw.id);
            if (targetVar) {
              return resolveValFromVar(targetVar, modeId, depth + 1);
            }
          }
          return raw;
        };
        const resolveValFromVar = (targetVar, modeId, depth) => {
          const raw = targetVar.valuesByMode[modeId] || Object.values(targetVar.valuesByMode)[0];
          if (raw && typeof raw === "object" && "type" in raw && raw.type === "VARIABLE_ALIAS") {
            const next = varMap.get(raw.id);
            if (next) return resolveValFromVar(next, modeId, depth + 1);
          }
          return raw;
        };
        const formatVal = (val, type) => {
          if (type === "COLOR") {
            if (val && typeof val === "object" && "r" in val) {
              const r = Math.round(val.r * 255);
              const g = Math.round(val.g * 255);
              const b = Math.round(val.b * 255);
              const a = typeof val.a === "number" ? val.a : 1;
              return a < 1 ? `rgba(${r}, ${g}, ${b}, ${Number(a.toFixed(2))})` : `rgb(${r}, ${g}, ${b})`;
            }
          } else if (type === "FLOAT" && typeof val === "number") {
            return `${val}px`;
          } else if (type === "STRING" && typeof val === "string") {
            return `"${val}"`;
          } else if (type === "BOOLEAN") {
            return val ? "1" : "0";
          }
          return null;
        };
        const defaultValRaw = resolveVal(defaultMode.modeId);
        const defaultFormatted = formatVal(defaultValRaw, v.resolvedType);
        if (defaultFormatted) {
          cssLight += `  ${cssVarName}: ${defaultFormatted}; /* [${colName}] */
`;
          lightCount++;
        }
        if (darkMode) {
          const darkValRaw = resolveVal(darkMode.modeId);
          const darkFormatted = formatVal(darkValRaw, v.resolvedType);
          if (darkFormatted && darkFormatted !== defaultFormatted) {
            cssDark += `  ${cssVarName}: ${darkFormatted};
`;
            darkCount++;
          }
        }
      }
      cssLight += `}
`;
      cssDark += `}
`;
      const fullCss = `${cssLight}${darkCount > 0 ? cssDark : ""}`;
      postToUI({
        type: "UI3_VARIABLES_EXTRACTED",
        css: fullCss,
        count: lightCount,
        collections: collections.map((c) => c.name)
      });
      notify(`\u{1F3A8} \uCD1D ${lightCount}\uAC1C\uC758 UI3 \uB514\uC790\uC778 \uD1A0\uD070\uC774 \uCD94\uCD9C\uB418\uC5C8\uC2B5\uB2C8\uB2E4!`, "success");
    } catch (err) {
      notify(`UI3 \uBCC0\uC218 \uCD94\uCD9C \uC2E4\uD328: ${String(err)}`, "error");
    }
  }
  figma.ui.onmessage = async (msg) => {
    switch (msg.type) {
      case "CREATE_FLOW_NODE":
        await createFlowNode(msg.payload);
        break;
      case "UPDATE_FLOW_NODE":
        await updateFlowNode(msg.payload);
        break;
      case "CONNECT_POINTS":
        await connectPoints(msg.payload);
        break;
      case "AUTO_CONNECT_SELECTED":
        await autoConnectSelected(msg.label);
        break;
      case "UPDATE_CONNECTOR_LABEL":
        await updateConnectorLabel(msg.connectorId, msg.label);
        break;
      case "UPDATE_CONNECTOR_PROPERTIES":
        await updateConnectorProperties(msg.payload);
        break;
      case "SET_CONNECTOR_LINE_TYPE":
        await setConnectorLineType(msg.connectorId, msg.lineType);
        break;
      case "CONVERT_ALL_CONNECTORS_TO_ELBOWED":
        await convertAllConnectorsToElbowed();
        break;
      case "EXTRACT_UI3_VARIABLES":
        await extractUI3Variables();
        break;
      case "TOGGLE_NODE_THEME":
        await toggleNodeTheme(msg.nodeId);
        break;
      case "SET_STATUS":
        await applyStatusToSelected(msg.status);
        break;
      case "ADD_STEP_BADGES":
        await addStepBadges(msg.startNumber || 1);
        break;
      case "REMOVE_STEP_BADGES":
        await removeStepBadges();
        break;
      case "GET_STATUS_LIST":
        syncStatusList();
        break;
      case "FOCUS_FRAME":
        focusFrame(msg.nodeId);
        break;
      case "RESIZE_NODE":
        await resizeNode(msg.nodeId, msg.width, msg.height);
        break;
      case "SAVE_SETTINGS":
        await saveSettings(msg.token, msg.fileUrl);
        break;
      case "LOAD_SETTINGS":
        await loadSavedSettings();
        break;
      case "CLOSE_PLUGIN":
        figma.closePlugin();
        break;
      case "UNDO":
        notify("\uCE94\uBC84\uC2A4\uC5D0\uC11C Cmd+Z (Mac) \uB610\uB294 Ctrl+Z (Windows)\uB85C \uC791\uC5C5\uC744 \uB418\uB3CC\uB9B4 \uC218 \uC788\uC2B5\uB2C8\uB2E4.", "info");
        break;
      case "REDO":
        notify("\uCE94\uBC84\uC2A4\uC5D0\uC11C Cmd+Shift+Z (Mac) \uB610\uB294 Ctrl+Y (Windows)\uB85C \uB2E4\uC2DC \uC2E4\uD589\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.", "info");
        break;
      case "NOTIFY":
        notify(msg.message, msg.level);
        break;
      case "RESIZE_WINDOW": {
        const targetW = msg.width || 360;
        const targetH = Math.max(200, Math.min(1200, Math.round(msg.height)));
        figma.ui.resize(targetW, targetH);
        break;
      }
      case "INIT":
        handleSelectionChange();
        syncStatusList();
        await loadSavedSettings();
        break;
    }
  };
  figma.on("documentchange", async (event) => {
    const movedNodeIds = /* @__PURE__ */ new Set();
    let connectorSelectionChanged = false;
    for (const change of event.documentChanges) {
      if (change.type === "PROPERTY_CHANGE") {
        if (change.properties.includes("x") || change.properties.includes("y") || change.properties.includes("width") || change.properties.includes("height")) {
          movedNodeIds.add(change.id);
        }
        if (change.properties.includes("width") || change.properties.includes("height")) {
          const node = figma.getNodeById(change.id);
          if (!node) continue;
          const flowNode = findFlowNode(node);
          if (flowNode && flowNode.type === "FRAME" && flowNode.getPluginData("is_flow_node") === "true") {
            const frame = flowNode;
            const savedW = frame.minWidth && frame.minWidth > 0 ? frame.minWidth : parseInt(frame.getPluginData("node_width"), 10);
            const savedH = frame.minHeight && frame.minHeight > 0 ? frame.minHeight : parseInt(frame.getPluginData("node_height"), 10);
            if (savedW && savedH && (Math.round(frame.width) !== savedW || Math.round(frame.height) !== savedH)) {
              frame.minWidth = null;
              frame.maxWidth = null;
              frame.minHeight = null;
              frame.maxHeight = null;
              frame.resize(savedW, savedH);
              frame.primaryAxisSizingMode = "FIXED";
              frame.counterAxisSizingMode = "FIXED";
              frame.minWidth = savedW;
              frame.maxWidth = savedW;
              frame.minHeight = savedH;
              frame.maxHeight = savedH;
            }
          }
        }
        const textNodeCandidate = figma.getNodeById(change.id);
        if (textNodeCandidate && textNodeCandidate.type === "TEXT") {
          const textNode = textNodeCandidate;
          const role = textNode.getPluginData("node_role");
          const isHeaderChild = textNode.parent && textNode.parent.name === "Header";
          const isTitle = role === "title" || textNode.name === "TitleText" || isHeaderChild;
          const isDesc = role === "desc" || textNode.name === "DescText";
          if (isTitle || isDesc) {
            const flowNode = findFlowNode(textNode);
            if (flowNode) {
              if (isTitle) {
                await enforceTitleStandardStyle(textNode, flowNode);
              } else if (isDesc) {
                lockTextFontSizeAndAutoResize(textNode, 11);
              }
            }
          }
        }
        const maybeStatusNode = figma.getNodeById(change.id);
        if (maybeStatusNode) {
          let statusTextNode = null;
          let badgeFrame = null;
          if (maybeStatusNode.type === "TEXT") {
            const t = maybeStatusNode;
            if (t.name === "StatusText" || t.parent && (t.parent.name === "StatusBadge" || t.parent.getPluginData("is_status_badge") === "true")) {
              statusTextNode = t;
              badgeFrame = t.parent && t.parent.type === "FRAME" ? t.parent : null;
            }
          } else if (maybeStatusNode.type === "FRAME") {
            const f = maybeStatusNode;
            if (f.name === "StatusBadge" || f.getPluginData("is_status_badge") === "true") {
              badgeFrame = f;
              statusTextNode = f.children.find((c) => c.type === "TEXT");
            }
          }
          if (statusTextNode) {
            const flowNode = findFlowNode(statusTextNode);
            if (flowNode) {
              const currentStatus = flowNode.getPluginData("workflow_status");
              const expectedLabel = currentStatus && STATUS_CONFIG[currentStatus] ? STATUS_CONFIG[currentStatus].label.toUpperCase() : "DRAFT";
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
        if (change.properties.includes("strokes") || change.properties.includes("strokeWeight") || change.properties.includes("dashPattern") || change.properties.includes("connectorLineType")) {
          const changedNode = figma.getNodeById(change.id);
          const connNode = findConnectorNode(changedNode);
          if (connNode) {
            if (connNode.type === "CONNECTOR") {
              const conn = connNode;
              if (Array.isArray(conn.strokes) && conn.strokes.length > 0 && conn.strokes[0].type === "SOLID") {
                const hex = rgbToHexColor(conn.strokes[0].color);
                conn.setPluginData("connector_color", hex);
              }
              if (typeof conn.strokeWeight === "number") {
                conn.setPluginData("connector_weight", String(conn.strokeWeight));
              }
            }
            const currentSelection = figma.currentPage.selection;
            if (currentSelection.some((sel) => sel.id === connNode.id || findConnectorNode(sel)?.id === connNode.id)) {
              connectorSelectionChanged = true;
            }
          }
        }
      }
    }
    if (movedNodeIds.size > 0) {
      await syncConnectorsForMovedNodes(movedNodeIds);
    }
    if (connectorSelectionChanged) {
      handleSelectionChange();
    }
  });
  refreshConnectorRegistry();
  handleSelectionChange();
  syncStatusList();
  loadSavedSettings();
})();
