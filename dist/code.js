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
      color: { r: 1, g: 0.62, b: 0.259 },
      // #FF9E42
      textColor: { r: 1, g: 1, b: 1 },
      hex: "#FF9E42"
    },
    revision: {
      label: "Revision",
      color: { r: 0.949, g: 0.282, b: 0.133 },
      // #F24822
      textColor: { r: 1, g: 1, b: 1 },
      hex: "#F24822"
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
  function terminalToStrokeCap(terminal) {
    switch (terminal) {
      case "ARROW":
      case "TRIANGLE_ARROW":
      case "REVERSED_TRIANGLE_ARROW":
        return "ARROW_LINES";
      case "CIRCLE":
        return "CIRCLE_FILLED";
      case "DIAMOND":
        return "DIAMOND_FILLED";
      case "SQUARE":
      case "BAR":
      case "NONE":
      default:
        return "NONE";
    }
  }
  function getMagnetDirectionVector(magnet) {
    switch (magnet) {
      case "TOP":
        return { x: 0, y: -1 };
      case "BOTTOM":
        return { x: 0, y: 1 };
      case "LEFT":
        return { x: -1, y: 0 };
      case "RIGHT":
        return { x: 1, y: 0 };
    }
  }
  function calculateCurvedPoints(srcPoint, srcMagnet, tgtPoint, tgtMagnet, steps = 28) {
    const dirSrc = getMagnetDirectionVector(srcMagnet);
    const dirTgt = getMagnetDirectionVector(tgtMagnet);
    const dist = Math.hypot(tgtPoint.x - srcPoint.x, tgtPoint.y - srcPoint.y);
    const handleLen = Math.max(dist * 0.45, 25);
    const cp1 = {
      x: srcPoint.x + dirSrc.x * handleLen,
      y: srcPoint.y + dirSrc.y * handleLen
    };
    const cp2 = {
      x: tgtPoint.x + dirTgt.x * handleLen,
      y: tgtPoint.y + dirTgt.y * handleLen
    };
    const points = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const invT = 1 - t;
      const x = invT * invT * invT * srcPoint.x + 3 * invT * invT * t * cp1.x + 3 * invT * t * t * cp2.x + t * t * t * tgtPoint.x;
      const y = invT * invT * invT * srcPoint.y + 3 * invT * invT * t * cp1.y + 3 * invT * t * t * cp2.y + t * t * t * tgtPoint.y;
      points.push({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
    }
    return points;
  }
  function calculateStraightPoints(srcPoint, tgtPoint) {
    return [srcPoint, tgtPoint];
  }
  function calculateRoutingPoints(srcPoint, sourceMagnet, tgtPoint, targetMagnet, srcBox, tgtBox, routingType = "ORTHOGONAL") {
    switch (routingType) {
      case "STRAIGHT":
        return calculateStraightPoints(srcPoint, tgtPoint);
      case "CURVED":
        return calculateCurvedPoints(srcPoint, sourceMagnet, tgtPoint, targetMagnet);
      case "S_CURVE":
      case "ORTHOGONAL":
      default:
        return calculateOrthogonalPoints(srcPoint, sourceMagnet, tgtPoint, targetMagnet, srcBox, tgtBox);
    }
  }
  function buildVectorNetwork(localPoints, routingType = "ORTHOGONAL", startTerminal = "NONE", endTerminal = "ARROW", strokeWeight = 1.5, strokeColor = { r: 0, g: 0, b: 0 }) {
    const len = localPoints.length;
    if (len === 0) return { vertices: [], segments: [], regions: [] };
    const startCap = terminalToStrokeCap(startTerminal);
    const endCap = terminalToStrokeCap(endTerminal);
    const vertices = localPoints.map((pt, idx) => {
      const isLast = idx === len - 1;
      const isFirst = idx === 0;
      let cornerRadius = 0;
      let strokeJoin = "MITER";
      if (routingType === "S_CURVE") {
        strokeJoin = "ROUND";
        if (!isFirst && !isLast) {
          const prev = localPoints[idx - 1];
          const next = localPoints[idx + 1];
          const d1 = Math.hypot(pt.x - prev.x, pt.y - prev.y);
          const d2 = Math.hypot(next.x - pt.x, next.y - pt.y);
          const maxR = Math.min(d1, d2) / 2;
          cornerRadius = Math.min(14, Math.max(0, maxR));
        }
      } else if (routingType === "CURVED") {
        strokeJoin = "ROUND";
        cornerRadius = 0;
      } else if (routingType === "STRAIGHT") {
        strokeJoin = "MITER";
        cornerRadius = 0;
      } else {
        strokeJoin = "MITER";
        cornerRadius = 0;
      }
      let strokeCap = "NONE";
      if (isFirst) {
        strokeCap = startCap;
      } else if (isLast) {
        strokeCap = endCap;
      }
      return {
        x: pt.x,
        y: pt.y,
        strokeCap,
        strokeJoin,
        cornerRadius
      };
    });
    const segments = [];
    for (let i = 0; i < len - 1; i++) {
      segments.push({ start: i, end: i + 1 });
    }
    const regions = [];
    const barLen = Math.max(7, Math.round(strokeWeight * 4.8));
    if (len >= 2 && startTerminal === "BAR") {
      const p0 = localPoints[0];
      const p1 = localPoints[1];
      const d0 = Math.hypot(p1.x - p0.x, p1.y - p0.y);
      if (d0 > 0.1) {
        const ux = (p1.x - p0.x) / d0;
        const uy = (p1.y - p0.y) / d0;
        const nx = -uy;
        const ny = ux;
        const vStart = vertices.length;
        vertices.push(
          { x: p0.x + barLen / 2 * nx, y: p0.y + barLen / 2 * ny, strokeCap: "NONE", strokeJoin: "MITER", cornerRadius: 0 },
          { x: p0.x - barLen / 2 * nx, y: p0.y - barLen / 2 * ny, strokeCap: "NONE", strokeJoin: "MITER", cornerRadius: 0 }
        );
        segments.push({ start: vStart, end: vStart + 1 });
      }
    }
    if (len >= 2 && endTerminal === "BAR") {
      const pn = localPoints[len - 1];
      const prev = localPoints[len - 2];
      const dn = Math.hypot(pn.x - prev.x, pn.y - prev.y);
      if (dn > 0.1) {
        const ux = (pn.x - prev.x) / dn;
        const uy = (pn.y - prev.y) / dn;
        const nx = -uy;
        const ny = ux;
        const vStart = vertices.length;
        vertices.push(
          { x: pn.x + barLen / 2 * nx, y: pn.y + barLen / 2 * ny, strokeCap: "NONE", strokeJoin: "MITER", cornerRadius: 0 },
          { x: pn.x - barLen / 2 * nx, y: pn.y - barLen / 2 * ny, strokeCap: "NONE", strokeJoin: "MITER", cornerRadius: 0 }
        );
        segments.push({ start: vStart, end: vStart + 1 });
      }
    }
    if (len >= 2 && startTerminal === "SQUARE") {
      const p0 = localPoints[0];
      const sqSize = Math.max(6, Math.round(strokeWeight * 3.5));
      const half = sqSize / 2;
      const vStart = vertices.length;
      vertices.push(
        { x: p0.x - half, y: p0.y - half, strokeCap: "NONE", strokeJoin: "MITER", cornerRadius: 0 },
        { x: p0.x + half, y: p0.y - half, strokeCap: "NONE", strokeJoin: "MITER", cornerRadius: 0 },
        { x: p0.x + half, y: p0.y + half, strokeCap: "NONE", strokeJoin: "MITER", cornerRadius: 0 },
        { x: p0.x - half, y: p0.y + half, strokeCap: "NONE", strokeJoin: "MITER", cornerRadius: 0 }
      );
      segments.push(
        { start: vStart, end: vStart + 1 },
        { start: vStart + 1, end: vStart + 2 },
        { start: vStart + 2, end: vStart + 3 },
        { start: vStart + 3, end: vStart },
        { start: vStart, end: vStart + 2 },
        { start: vStart + 1, end: vStart + 3 }
      );
    }
    if (len >= 2 && endTerminal === "SQUARE") {
      const pn = localPoints[len - 1];
      const sqSize = Math.max(6, Math.round(strokeWeight * 3.5));
      const half = sqSize / 2;
      const vStart = vertices.length;
      vertices.push(
        { x: pn.x - half, y: pn.y - half, strokeCap: "NONE", strokeJoin: "MITER", cornerRadius: 0 },
        { x: pn.x + half, y: pn.y - half, strokeCap: "NONE", strokeJoin: "MITER", cornerRadius: 0 },
        { x: pn.x + half, y: pn.y + half, strokeCap: "NONE", strokeJoin: "MITER", cornerRadius: 0 },
        { x: pn.x - half, y: pn.y + half, strokeCap: "NONE", strokeJoin: "MITER", cornerRadius: 0 }
      );
      segments.push(
        { start: vStart, end: vStart + 1 },
        { start: vStart + 1, end: vStart + 2 },
        { start: vStart + 2, end: vStart + 3 },
        { start: vStart + 3, end: vStart },
        { start: vStart, end: vStart + 2 },
        { start: vStart + 1, end: vStart + 3 }
      );
    }
    return { vertices, segments, regions };
  }
  function getLabelCenterPoint(worldPoints, routingType = "ORTHOGONAL") {
    if (worldPoints.length <= 2) {
      return {
        x: (worldPoints[0].x + worldPoints[worldPoints.length - 1].x) / 2,
        y: (worldPoints[0].y + worldPoints[worldPoints.length - 1].y) / 2
      };
    }
    if (routingType === "CURVED") {
      const midIdx = Math.floor(worldPoints.length / 2);
      return worldPoints[midIdx];
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
    return midSegmentPoint;
  }
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
        let exitX = isRightward ? srcPoint.x + margin : srcPoint.x - margin;
        const enterX = isRightward ? tgtPoint.x - margin : tgtPoint.x + margin;
        if (exitX >= tgtBox.x - margin && exitX <= tgtBox.x + tgtBox.width + margin) {
          exitX = isRightward ? Math.max(srcBox.x + srcBox.width, tgtBox.x + tgtBox.width) + margin : Math.min(srcBox.x, tgtBox.x) - margin;
        }
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
  function lineSegmentIntersectsBox(p1, p2, box, padding = 2) {
    const minX = Math.min(p1.x, p2.x);
    const maxX = Math.max(p1.x, p2.x);
    const minY = Math.min(p1.y, p2.y);
    const maxY = Math.max(p1.y, p2.y);
    const bLeft = box.x + padding;
    const bRight = box.x + box.width - padding;
    const bTop = box.y + padding;
    const bBottom = box.y + box.height - padding;
    if (bRight <= bLeft || bBottom <= bTop) return false;
    if (Math.abs(p1.y - p2.y) < 0.5) {
      const y = p1.y;
      if (y > bTop && y < bBottom) {
        if (Math.max(minX, bLeft) < Math.min(maxX, bRight)) {
          return true;
        }
      }
    } else if (Math.abs(p1.x - p2.x) < 0.5) {
      const x = p1.x;
      if (x > bLeft && x < bRight) {
        if (Math.max(minY, bTop) < Math.min(maxY, bBottom)) {
          return true;
        }
      }
    }
    return false;
  }
  function doesPathCrossBoxes(points, srcBox, tgtBox) {
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      if (lineSegmentIntersectsBox(p1, p2, srcBox)) return true;
      if (lineSegmentIntersectsBox(p1, p2, tgtBox)) return true;
    }
    return false;
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
    const routingType = options.routingType || "ORTHOGONAL";
    const worldPoints = calculateRoutingPoints(
      pStart,
      sourceMagnet,
      pEnd,
      targetMagnet,
      srcBox,
      tgtBox,
      routingType
    );
    const allX = worldPoints.map((p) => p.x);
    const allY = worldPoints.map((p) => p.y);
    const strokeColor = options.strokeColor || { r: 0.18, g: 0.18, b: 0.22 };
    const strokeWeight = options.strokeWeight || 1.5;
    const startTerminal = options.startTerminal || "NONE";
    const endTerminal = options.endTerminal || "ARROW";
    const strokePattern = options.strokePattern || "SOLID";
    const hasSquare = startTerminal === "SQUARE" || endTerminal === "SQUARE" || startTerminal === "BAR" || endTerminal === "BAR";
    const pad = hasSquare ? Math.max(5, Math.round(strokeWeight * 3)) : 0;
    const minX = Math.min(...allX) - pad;
    const minY = Math.min(...allY) - pad;
    const maxX = Math.max(...allX) + pad;
    const maxY = Math.max(...allY) + pad;
    const width = Math.max(maxX - minX, 1);
    const height = Math.max(maxY - minY, 1);
    const localPoints = worldPoints.map((p) => ({
      x: p.x - minX,
      y: p.y - minY
    }));
    const vector = figma.createVector();
    vector.x = minX;
    vector.y = minY;
    vector.resize(width, height);
    const { vertices, segments, regions } = buildVectorNetwork(
      localPoints,
      routingType,
      startTerminal,
      endTerminal,
      strokeWeight,
      strokeColor
    );
    await vector.setVectorNetworkAsync({ vertices, segments, regions });
    vector.strokes = [{ type: "SOLID", color: strokeColor }];
    vector.strokeWeight = strokeWeight;
    if (regions.length > 0) {
      vector.fills = [{ type: "SOLID", color: strokeColor }];
    } else {
      vector.fills = [];
    }
    if (strokePattern === "DASHED") {
      vector.dashPattern = [4, 4];
    } else if (strokePattern === "DOTTED") {
      vector.dashPattern = [1.5, 3];
    } else {
      vector.dashPattern = [];
    }
    vector.strokeJoin = routingType === "S_CURVE" || routingType === "CURVED" ? "ROUND" : "MITER";
    vector.strokeMiterLimit = 4;
    vector.name = `[Connector] ${sourceNode.name} \u2192 ${targetNode.name}`;
    vector.setPluginData("is_flow_connector", "true");
    vector.setPluginData("is_custom_connector", "true");
    vector.setPluginData("source_node_id", sourceNode.id);
    vector.setPluginData("target_node_id", targetNode.id);
    vector.setPluginData("source_magnet", sourceMagnet);
    vector.setPluginData("target_magnet", targetMagnet);
    vector.setPluginData("connector_routing", routingType);
    vector.setPluginData("start_terminal", startTerminal);
    vector.setPluginData("end_terminal", endTerminal);
    vector.setPluginData("connector_pattern", strokePattern);
    vector.setPluginData("connector_weight", String(strokeWeight));
    let labelFrame = null;
    const labelText = options.label ? options.label.trim() : "";
    if (labelText !== "") {
      vector.setPluginData("connector_label", labelText);
      try {
        await figma.loadFontAsync({ family: "Inter", style: "Medium" });
      } catch {
        await figma.loadFontAsync({ family: "Inter", style: "Regular" });
      }
      const midSegmentPoint = getLabelCenterPoint(worldPoints, routingType);
      labelFrame = figma.createFrame();
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
    }
    vector.name = labelText ? `[Flow] ${sourceNode.name} \u2192 ${targetNode.name} ("${labelText}")` : `[Connector] ${sourceNode.name} \u2192 ${targetNode.name}`;
    vector.setPluginData("is_flow_connector", "true");
    vector.setPluginData("is_custom_connector", "true");
    vector.setPluginData("source_node_id", sourceNode.id);
    vector.setPluginData("target_node_id", targetNode.id);
    vector.setPluginData("source_magnet", sourceMagnet);
    vector.setPluginData("target_magnet", targetMagnet);
    vector.setPluginData("connector_routing", routingType);
    if (labelText) {
      vector.setPluginData("connector_label", labelText);
    }
    vector.setPluginData("start_terminal", startTerminal);
    vector.setPluginData("end_terminal", endTerminal);
    vector.setPluginData("connector_pattern", strokePattern);
    vector.setPluginData("connector_weight", String(strokeWeight));
    if (labelFrame) {
      const group = figma.group([vector, labelFrame], figma.currentPage);
      figma.currentPage.appendChild(group);
      group.name = vector.name;
      copyConnectorData(vector, group);
      registerConnectorInRegistry(group);
      return group;
    }
    figma.currentPage.appendChild(vector);
    registerConnectorInRegistry(vector);
    return vector;
  }
  var nodeToConnectorsMap = /* @__PURE__ */ new Map();
  var isUpdatingConnectors = false;
  function registerConnectorInRegistry(connectorNode) {
    if (connectorNode.type === "CONNECTOR") {
      const conn = connectorNode;
      const start = conn.connectorStart;
      const end = conn.connectorEnd;
      if ("endpointNodeId" in start && start.endpointNodeId) {
        if (!nodeToConnectorsMap.has(start.endpointNodeId)) {
          nodeToConnectorsMap.set(start.endpointNodeId, /* @__PURE__ */ new Set());
        }
        nodeToConnectorsMap.get(start.endpointNodeId).add(connectorNode.id);
      }
      if ("endpointNodeId" in end && end.endpointNodeId) {
        if (!nodeToConnectorsMap.has(end.endpointNodeId)) {
          nodeToConnectorsMap.set(end.endpointNodeId, /* @__PURE__ */ new Set());
        }
        nodeToConnectorsMap.get(end.endpointNodeId).add(connectorNode.id);
      }
      return;
    }
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
      (n) => n.getPluginData("is_custom_connector") === "true" || n.type === "CONNECTOR"
    );
    for (const conn of connectors) {
      registerConnectorInRegistry(conn);
    }
  }
  function getOptimalMagnetPair(srcBox, tgtBox) {
    const MAGNETS = ["TOP", "BOTTOM", "LEFT", "RIGHT"];
    const centerSrcX = srcBox.x + srcBox.width / 2;
    const centerSrcY = srcBox.y + srcBox.height / 2;
    const centerTgtX = tgtBox.x + tgtBox.width / 2;
    const centerTgtY = tgtBox.y + tgtBox.height / 2;
    const dx = centerTgtX - centerSrcX;
    const dy = centerTgtY - centerSrcY;
    const candidates = [];
    for (const srcMag of MAGNETS) {
      for (const tgtMag of MAGNETS) {
        const pStart = getMagnetPoint(srcBox, srcMag);
        const pEnd = getMagnetPoint(tgtBox, tgtMag);
        const points = calculateOrthogonalPoints(pStart, srcMag, pEnd, tgtMag, srcBox, tgtBox);
        const crosses = doesPathCrossBoxes(points, srcBox, tgtBox);
        let length = 0;
        for (let i = 0; i < points.length - 1; i++) {
          length += Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
        }
        let cost = length + points.length * 15;
        if (srcMag === "RIGHT" && dx > 0) cost -= 25;
        if (srcMag === "LEFT" && dx < 0) cost -= 25;
        if (srcMag === "BOTTOM" && dy > 0) cost -= 25;
        if (srcMag === "TOP" && dy < 0) cost -= 25;
        if (tgtMag === "LEFT" && dx > 0) cost -= 25;
        if (tgtMag === "RIGHT" && dx < 0) cost -= 25;
        if (tgtMag === "TOP" && dy > 0) cost -= 25;
        if (tgtMag === "BOTTOM" && dy < 0) cost -= 25;
        candidates.push({ srcMag, tgtMag, cost, crosses });
      }
    }
    const nonCrossingCandidates = candidates.filter((c) => !c.crosses);
    if (nonCrossingCandidates.length > 0) {
      nonCrossingCandidates.sort((a, b) => a.cost - b.cost);
      return {
        sourceMagnet: nonCrossingCandidates[0].srcMag,
        targetMagnet: nonCrossingCandidates[0].tgtMag
      };
    }
    candidates.sort((a, b) => a.cost - b.cost);
    return {
      sourceMagnet: candidates[0].srcMag,
      targetMagnet: candidates[0].tgtMag
    };
  }
  function optimizeNativeConnector(conn) {
    try {
      const start = conn.connectorStart;
      const end = conn.connectorEnd;
      if (!("endpointNodeId" in start) || !("endpointNodeId" in end)) return;
      if (!start.endpointNodeId || !end.endpointNodeId) return;
      const sourceNode = figma.getNodeById(start.endpointNodeId);
      const targetNode = figma.getNodeById(end.endpointNodeId);
      if (!sourceNode || !targetNode) return;
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
      const optimal = getOptimalMagnetPair(srcBox, tgtBox);
      conn.connectorStart = {
        endpointNodeId: start.endpointNodeId,
        magnet: optimal.sourceMagnet
      };
      conn.connectorEnd = {
        endpointNodeId: end.endpointNodeId,
        magnet: optimal.targetMagnet
      };
    } catch (err) {
      console.error("\uB124\uC774\uD2F0\uBE0C \uCEE4\uB125\uD130 \uCD5C\uC801\uD654 \uC2E4\uD328:", err);
    }
  }
  async function updateOrthogonalVectorConnector(connectorNode, explicitSourceMagnet, explicitTargetMagnet, forceOptimal = false) {
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
    let sourceMagnet = explicitSourceMagnet;
    let targetMagnet = explicitTargetMagnet;
    if (!sourceMagnet || !targetMagnet || forceOptimal) {
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
    const routingType = connectorNode.getPluginData("connector_routing") || vector.getPluginData("connector_routing") || "ORTHOGONAL";
    const pStart = getMagnetPoint(srcBox, sourceMagnet);
    const pEnd = getMagnetPoint(tgtBox, targetMagnet);
    const worldPoints = calculateRoutingPoints(
      pStart,
      sourceMagnet,
      pEnd,
      targetMagnet,
      srcBox,
      tgtBox,
      routingType
    );
    const allX = worldPoints.map((p) => p.x);
    const allY = worldPoints.map((p) => p.y);
    const startTerminal = connectorNode.getPluginData("start_terminal") || vector.getPluginData("start_terminal") || "NONE";
    const endTerminal = connectorNode.getPluginData("end_terminal") || vector.getPluginData("end_terminal") || "ARROW";
    const strokeWeight = typeof vector.strokeWeight === "number" ? vector.strokeWeight : 1.5;
    let strokeColor = { r: 0.18, g: 0.18, b: 0.22 };
    if (Array.isArray(vector.strokes) && vector.strokes.length > 0 && vector.strokes[0].type === "SOLID") {
      strokeColor = vector.strokes[0].color;
    }
    const hasBarOrSquare = startTerminal === "BAR" || endTerminal === "BAR" || startTerminal === "SQUARE" || endTerminal === "SQUARE";
    const pad = hasBarOrSquare ? Math.max(5, Math.round(strokeWeight * 3.5)) : 0;
    const minX = Math.min(...allX) - pad;
    const minY = Math.min(...allY) - pad;
    const maxX = Math.max(...allX) + pad;
    const maxY = Math.max(...allY) + pad;
    const width = Math.max(maxX - minX, 1);
    const height = Math.max(maxY - minY, 1);
    const localPoints = worldPoints.map((p) => ({
      x: p.x - minX,
      y: p.y - minY
    }));
    vector.x = minX;
    vector.y = minY;
    vector.resize(width, height);
    const { vertices, segments, regions } = buildVectorNetwork(
      localPoints,
      routingType,
      startTerminal,
      endTerminal,
      strokeWeight,
      strokeColor
    );
    await vector.setVectorNetworkAsync({ vertices, segments, regions });
    vector.fills = [];
    vector.strokeJoin = routingType === "S_CURVE" || routingType === "CURVED" ? "ROUND" : "MITER";
    if (connectorNode.type === "GROUP") {
      const group = connectorNode;
      const legacyMarkers = group.findAll(
        (n) => n.name === "ConnectorStartTerminal" || n.name === "ConnectorEndTerminal" || n.getPluginData("is_terminal_marker") !== ""
      );
      for (const m of legacyMarkers) {
        m.remove();
      }
    }
    if (connectorNode.parent) {
      connectorNode.parent.appendChild(connectorNode);
    }
    if (labelFrame) {
      const midSegmentPoint = getLabelCenterPoint(worldPoints, routingType);
      labelFrame.x = Math.round(midSegmentPoint.x - labelFrame.width / 2);
      labelFrame.y = Math.round(midSegmentPoint.y - labelFrame.height / 2);
    }
  }
  function copyConnectorData(source, target) {
    const keys = [
      "is_flow_connector",
      "is_custom_connector",
      "source_node_id",
      "target_node_id",
      "source_magnet",
      "target_magnet",
      "connector_routing",
      "connector_label",
      "start_terminal",
      "end_terminal",
      "connector_pattern",
      "connector_weight",
      "connector_color"
    ];
    for (const k of keys) {
      const v = source.getPluginData(k);
      if (v) target.setPluginData(k, v);
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
        const containerNode = figma.getNodeById(nid);
        if (containerNode && "findAll" in containerNode) {
          for (const [mappedNodeId, mappedConnIds] of nodeToConnectorsMap.entries()) {
            const childNode = figma.getNodeById(mappedNodeId);
            if (childNode) {
              let cur = childNode.parent;
              while (cur && cur.type !== "PAGE") {
                if (cur.id === nid) {
                  for (const cid of mappedConnIds) {
                    connIdsToUpdate.add(cid);
                  }
                  break;
                }
                cur = cur.parent;
              }
            }
          }
        }
      }
      if (connIdsToUpdate.size === 0) {
        refreshConnectorRegistry();
        for (const nid of nodeIds) {
          const conns = nodeToConnectorsMap.get(nid);
          if (conns) {
            for (const cid of conns) {
              connIdsToUpdate.add(cid);
            }
          }
        }
      }
      for (const connId of connIdsToUpdate) {
        const connNode = figma.getNodeById(connId);
        if (!connNode) continue;
        if (connNode.type === "CONNECTOR") {
          optimizeNativeConnector(connNode);
        } else {
          await updateOrthogonalVectorConnector(connNode, void 0, void 0, true);
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
  var ELEVATION_EFFECTS_LIGHT = {
    // E100 (Shapes): 0 0 0.5px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.15)
    0: [
      {
        type: "DROP_SHADOW",
        color: { r: 0, g: 0, b: 0, a: 0.3 },
        offset: { x: 0, y: 0 },
        radius: 0.5,
        spread: 0,
        visible: true,
        blendMode: "NORMAL"
      },
      {
        type: "DROP_SHADOW",
        color: { r: 0, g: 0, b: 0, a: 0.15 },
        offset: { x: 0, y: 1 },
        radius: 3,
        spread: 0,
        visible: true,
        blendMode: "NORMAL"
      }
    ],
    // E200 (Stickies, Comments): 0 0 0.5px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.1), 0 3px 8px rgba(0,0,0,0.1)
    1: [
      {
        type: "DROP_SHADOW",
        color: { r: 0, g: 0, b: 0, a: 0.18 },
        offset: { x: 0, y: 0 },
        radius: 0.5,
        spread: 0,
        visible: true,
        blendMode: "NORMAL"
      },
      {
        type: "DROP_SHADOW",
        color: { r: 0, g: 0, b: 0, a: 0.1 },
        offset: { x: 0, y: 1 },
        radius: 3,
        spread: 0,
        visible: true,
        blendMode: "NORMAL"
      },
      {
        type: "DROP_SHADOW",
        color: { r: 0, g: 0, b: 0, a: 0.1 },
        offset: { x: 0, y: 3 },
        radius: 8,
        spread: 0,
        visible: true,
        blendMode: "NORMAL"
      }
    ],
    // E300 (Tooltips): 0 0 0.5px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.1), 0 5px 12px rgba(0,0,0,0.13)
    2: [
      {
        type: "DROP_SHADOW",
        color: { r: 0, g: 0, b: 0, a: 0.15 },
        offset: { x: 0, y: 0 },
        radius: 0.5,
        spread: 0,
        visible: true,
        blendMode: "NORMAL"
      },
      {
        type: "DROP_SHADOW",
        color: { r: 0, g: 0, b: 0, a: 0.1 },
        offset: { x: 0, y: 1 },
        radius: 3,
        spread: 0,
        visible: true,
        blendMode: "NORMAL"
      },
      {
        type: "DROP_SHADOW",
        color: { r: 0, g: 0, b: 0, a: 0.13 },
        offset: { x: 0, y: 5 },
        radius: 12,
        spread: 0,
        visible: true,
        blendMode: "NORMAL"
      }
    ],
    // E400 (Menus, Panels): 0 0 0.5px rgba(0,0,0,0.12), 0 2px 5px rgba(0,0,0,0.15), 0 10px 16px rgba(0,0,0,0.12)
    3: [
      {
        type: "DROP_SHADOW",
        color: { r: 0, g: 0, b: 0, a: 0.12 },
        offset: { x: 0, y: 0 },
        radius: 0.5,
        spread: 0,
        visible: true,
        blendMode: "NORMAL"
      },
      {
        type: "DROP_SHADOW",
        color: { r: 0, g: 0, b: 0, a: 0.15 },
        offset: { x: 0, y: 2 },
        radius: 5,
        spread: 0,
        visible: true,
        blendMode: "NORMAL"
      },
      {
        type: "DROP_SHADOW",
        color: { r: 0, g: 0, b: 0, a: 0.12 },
        offset: { x: 0, y: 10 },
        radius: 16,
        spread: 0,
        visible: true,
        blendMode: "NORMAL"
      }
    ],
    // E500 (Modals, Dialogs): 0 0 0.5px rgba(0,0,0,0.08), 0 2px 5px rgba(0,0,0,0.15), 0 10px 24px rgba(0,0,0,0.18)
    4: [
      {
        type: "DROP_SHADOW",
        color: { r: 0, g: 0, b: 0, a: 0.08 },
        offset: { x: 0, y: 0 },
        radius: 0.5,
        spread: 0,
        visible: true,
        blendMode: "NORMAL"
      },
      {
        type: "DROP_SHADOW",
        color: { r: 0, g: 0, b: 0, a: 0.15 },
        offset: { x: 0, y: 2 },
        radius: 5,
        spread: 0,
        visible: true,
        blendMode: "NORMAL"
      },
      {
        type: "DROP_SHADOW",
        color: { r: 0, g: 0, b: 0, a: 0.18 },
        offset: { x: 0, y: 10 },
        radius: 24,
        spread: 0,
        visible: true,
        blendMode: "NORMAL"
      }
    ]
  };
  var ELEVATION_EFFECTS_DARK = {
    // E100 (Shapes): inset 0 .5px 0 rgba(255,255,255,0.1), inset 0 0 0.5px rgba(255,255,255,0.35), 0 0 0.5px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.4)
    0: [
      {
        type: "INNER_SHADOW",
        color: { r: 1, g: 1, b: 1, a: 0.1 },
        offset: { x: 0, y: 0.5 },
        radius: 0,
        spread: 0,
        visible: true,
        blendMode: "NORMAL"
      },
      {
        type: "INNER_SHADOW",
        color: { r: 1, g: 1, b: 1, a: 0.35 },
        offset: { x: 0, y: 0 },
        radius: 0.5,
        spread: 0,
        visible: true,
        blendMode: "NORMAL"
      },
      {
        type: "DROP_SHADOW",
        color: { r: 0, g: 0, b: 0, a: 0.5 },
        offset: { x: 0, y: 0 },
        radius: 0.5,
        spread: 0,
        visible: true,
        blendMode: "NORMAL"
      },
      {
        type: "DROP_SHADOW",
        color: { r: 0, g: 0, b: 0, a: 0.4 },
        offset: { x: 0, y: 1 },
        radius: 3,
        spread: 0,
        visible: true,
        blendMode: "NORMAL"
      }
    ],
    // E200 (Stickies, Comments): inset 0 .5px 0 rgba(255,255,255,0.08), inset 0 0 .5px rgba(255,255,255,0.35), 0 1px 3px rgba(0,0,0,0.35), 0 3px 8px rgba(0,0,0,0.4)
    1: [
      {
        type: "INNER_SHADOW",
        color: { r: 1, g: 1, b: 1, a: 0.08 },
        offset: { x: 0, y: 0.5 },
        radius: 0,
        spread: 0,
        visible: true,
        blendMode: "NORMAL"
      },
      {
        type: "INNER_SHADOW",
        color: { r: 1, g: 1, b: 1, a: 0.35 },
        offset: { x: 0, y: 0 },
        radius: 0.5,
        spread: 0,
        visible: true,
        blendMode: "NORMAL"
      },
      {
        type: "DROP_SHADOW",
        color: { r: 0, g: 0, b: 0, a: 0.35 },
        offset: { x: 0, y: 1 },
        radius: 3,
        spread: 0,
        visible: true,
        blendMode: "NORMAL"
      },
      {
        type: "DROP_SHADOW",
        color: { r: 0, g: 0, b: 0, a: 0.4 },
        offset: { x: 0, y: 3 },
        radius: 8,
        spread: 0,
        visible: true,
        blendMode: "NORMAL"
      }
    ],
    // E300 (Tooltips): inset 0 .5px 0 rgba(255,255,255,0.08), inset 0 0 .5px rgba(255,255,255,0.35), 0 1px 3px rgba(0,0,0,0.5), 0 5px 12px rgba(0,0,0,0.35)
    2: [
      {
        type: "INNER_SHADOW",
        color: { r: 1, g: 1, b: 1, a: 0.08 },
        offset: { x: 0, y: 0.5 },
        radius: 0,
        spread: 0,
        visible: true,
        blendMode: "NORMAL"
      },
      {
        type: "INNER_SHADOW",
        color: { r: 1, g: 1, b: 1, a: 0.35 },
        offset: { x: 0, y: 0 },
        radius: 0.5,
        spread: 0,
        visible: true,
        blendMode: "NORMAL"
      },
      {
        type: "DROP_SHADOW",
        color: { r: 0, g: 0, b: 0, a: 0.5 },
        offset: { x: 0, y: 1 },
        radius: 3,
        spread: 0,
        visible: true,
        blendMode: "NORMAL"
      },
      {
        type: "DROP_SHADOW",
        color: { r: 0, g: 0, b: 0, a: 0.35 },
        offset: { x: 0, y: 5 },
        radius: 12,
        spread: 0,
        visible: true,
        blendMode: "NORMAL"
      }
    ],
    // E400 (Menus, Panels): inset 0 .5px 0 rgba(255,255,255,0.08), inset 0 0 .5px rgba(255,255,255,0.35), 0 2px 5px rgba(0,0,0,0.35), 0 10px 16px rgba(0,0,0,0.35)
    3: [
      {
        type: "INNER_SHADOW",
        color: { r: 1, g: 1, b: 1, a: 0.08 },
        offset: { x: 0, y: 0.5 },
        radius: 0,
        spread: 0,
        visible: true,
        blendMode: "NORMAL"
      },
      {
        type: "INNER_SHADOW",
        color: { r: 1, g: 1, b: 1, a: 0.35 },
        offset: { x: 0, y: 0 },
        radius: 0.5,
        spread: 0,
        visible: true,
        blendMode: "NORMAL"
      },
      {
        type: "DROP_SHADOW",
        color: { r: 0, g: 0, b: 0, a: 0.35 },
        offset: { x: 0, y: 2 },
        radius: 5,
        spread: 0,
        visible: true,
        blendMode: "NORMAL"
      },
      {
        type: "DROP_SHADOW",
        color: { r: 0, g: 0, b: 0, a: 0.35 },
        offset: { x: 0, y: 10 },
        radius: 16,
        spread: 0,
        visible: true,
        blendMode: "NORMAL"
      }
    ],
    // E500 (Modals, Dialogs): inset 0 .5px 0 rgba(255,255,255,0.08), inset 0 0 .5px rgba(255,255,255,0.35), 0 3px 5px rgba(0,0,0,0.35), 0 10px 24px rgba(0,0,0,0.45)
    4: [
      {
        type: "INNER_SHADOW",
        color: { r: 1, g: 1, b: 1, a: 0.08 },
        offset: { x: 0, y: 0.5 },
        radius: 0,
        spread: 0,
        visible: true,
        blendMode: "NORMAL"
      },
      {
        type: "INNER_SHADOW",
        color: { r: 1, g: 1, b: 1, a: 0.35 },
        offset: { x: 0, y: 0 },
        radius: 0.5,
        spread: 0,
        visible: true,
        blendMode: "NORMAL"
      },
      {
        type: "DROP_SHADOW",
        color: { r: 0, g: 0, b: 0, a: 0.35 },
        offset: { x: 0, y: 3 },
        radius: 5,
        spread: 0,
        visible: true,
        blendMode: "NORMAL"
      },
      {
        type: "DROP_SHADOW",
        color: { r: 0, g: 0, b: 0, a: 0.45 },
        offset: { x: 0, y: 10 },
        radius: 24,
        spread: 0,
        visible: true,
        blendMode: "NORMAL"
      }
    ]
  };
  function getElevationEffects(level, isDark = false) {
    return isDark ? ELEVATION_EFFECTS_DARK[level] || ELEVATION_EFFECTS_LIGHT[level] || [] : ELEVATION_EFFECTS_LIGHT[level] || [];
  }
  function getTextFillsByBackground(bgColor, isDarkTheme = false) {
    const luminance = 0.299 * bgColor.r + 0.587 * bgColor.g + 0.114 * bgColor.b;
    const isBgDark = isDarkTheme || luminance < 0.5;
    const baseColor = isBgDark ? { r: 1, g: 1, b: 1 } : { r: 0, g: 0, b: 0 };
    const descOpacity = isBgDark ? 0.7 : 0.6;
    return {
      titleFill: {
        type: "SOLID",
        color: baseColor,
        opacity: 1
      },
      descFill: {
        type: "SOLID",
        color: baseColor,
        opacity: descOpacity
      },
      isBgDark
    };
  }
  function getStatusBadgeColors(status, nodeBgColor, isDarkTheme = false) {
    const cfg = STATUS_CONFIG[status];
    const defaultBg = cfg ? cfg.color : { r: 0.5, g: 0.5, b: 0.5 };
    const defaultText = cfg ? cfg.textColor : { r: 1, g: 1, b: 1 };
    const max = Math.max(nodeBgColor.r, nodeBgColor.g, nodeBgColor.b);
    const min = Math.min(nodeBgColor.r, nodeBgColor.g, nodeBgColor.b);
    const delta = max - min;
    const saturation = max === 0 ? 0 : delta / max;
    const isChromatic = saturation >= 0.15 && delta >= 0.08;
    if (isChromatic) {
      const luminance = 0.299 * nodeBgColor.r + 0.587 * nodeBgColor.g + 0.114 * nodeBgColor.b;
      const isBgDark = isDarkTheme || luminance < 0.5;
      if (isBgDark) {
        return {
          badgeBg: { r: 1, g: 1, b: 1 },
          badgeTextColor: nodeBgColor,
          isMonochrome: true
        };
      } else {
        return {
          badgeBg: { r: 0, g: 0, b: 0 },
          badgeTextColor: nodeBgColor,
          isMonochrome: true
        };
      }
    }
    return {
      badgeBg: defaultBg,
      badgeTextColor: defaultText,
      isMonochrome: false
    };
  }
  function getStatusBadgeCornerRadius(nodeCornerRadius, offset = 10) {
    return Math.max(0, Math.round(nodeCornerRadius - offset));
  }
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
  function normalizeUrl(url) {
    if (!url) return "";
    const trimmed = url.trim();
    if (!trimmed) return "";
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)) {
      return trimmed;
    }
    return `https://${trimmed}`;
  }
  function isFigmaUrl(url) {
    if (!url) return false;
    const clean = url.trim().toLowerCase();
    return clean.includes("figma.com/") || clean.startsWith("figma://");
  }
  async function updateFigmaLinkBadge(card, figmaLink, isBgDark = false, clearCache = false) {
    const existingBadge = card.children.find(
      (c) => c.getPluginData("is_figma_link_badge") === "true" || c.name === "FigmaLinkBadge"
    );
    const rawLink = (figmaLink || "").trim();
    const trimmedLink = normalizeUrl(rawLink);
    if (!trimmedLink) {
      if (existingBadge) {
        existingBadge.remove();
      }
      card.setPluginData("figma_link", "");
      if (clearCache) {
        card.setPluginData("cached_figma_link", "");
      }
      return;
    }
    card.setPluginData("figma_link", trimmedLink);
    card.setPluginData("cached_figma_link", trimmedLink);
    const iconColor = isBgDark ? "#FFFFFF" : "#000000";
    const isFigma = isFigmaUrl(trimmedLink);
    const penSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
  <path d="M3.72849 3.02145C4.83925 3.13055 9.67484 3.67513 11 4.99997C11.8888 5.88903 12.2722 7.28337 12.1123 8.59665L13.2988 9.79294C13.6863 10.1839 13.6851 10.8148 13.2959 11.2041L11.1748 13.3252C10.7832 13.7168 10.1478 13.7154 9.75779 13.3222L8.56052 12.1162C7.25778 12.2648 5.8809 11.8808 4.99998 11C3.6753 9.67487 3.13064 4.83971 3.02146 3.72849C3.00717 3.58223 3.06014 3.43984 3.16404 3.33591L3.33591 3.16403C3.43991 3.06006 3.58214 3.00708 3.72849 3.02145ZM7.74119 7.03415C7.82376 7.01208 7.91045 6.99997 7.99998 6.99997C8.55226 6.99997 8.99998 7.44769 8.99998 7.99997C8.99997 8.55225 8.55226 8.99997 7.99998 8.99997C7.44771 8.99995 6.99998 8.55224 6.99998 7.99997C6.99998 7.91045 7.01209 7.82375 7.03416 7.74118L4.16306 4.87009C4.24914 5.50937 4.36996 6.29249 4.53416 7.08005C4.68675 7.81193 4.87047 8.52441 5.08689 9.11911C5.3135 9.74173 5.53564 10.1215 5.70701 10.2929C6.33123 10.917 7.38392 11.243 8.44627 11.122L8.92966 11.0674L9.27049 11.4121L10.4668 12.6181L12.5888 10.497L11.4023 9.30075L11.0615 8.957L11.1201 8.47556C11.2505 7.40454 10.9231 6.33743 10.2929 5.707C10.1215 5.53565 9.74187 5.31345 9.11912 5.08688C8.52433 4.87051 7.81203 4.68665 7.08006 4.53415C6.29249 4.37008 5.50946 4.24895 4.87009 4.16306L7.74119 7.03415Z" fill="${iconColor}" fill-opacity="0.9"/>
</svg>`;
    const linkedObjectSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
  <path d="M8.73242 10.7324C8.92757 10.5374 9.24419 10.5376 9.43945 10.7324C9.63415 10.9277 9.63446 11.2444 9.43945 11.4395C8.85388 12.0251 8.85413 12.9747 9.43945 13.5605C10.0253 14.1459 10.9749 14.1461 11.5605 13.5605C11.7556 13.3656 12.0723 13.3659 12.2676 13.5605C12.4624 13.7558 12.4626 14.0725 12.2676 14.2676C11.2914 15.2437 9.70875 15.2434 8.73242 14.2676C7.75658 13.2913 7.75632 11.7086 8.73242 10.7324ZM11.5 3C12.3284 3 13 3.67157 13 4.5V6.5C13 6.77614 12.7761 7 12.5 7C12.2239 7 12 6.77614 12 6.5V4.5C12 4.22386 11.7761 4 11.5 4H4.5C4.22386 4 4 4.22386 4 4.5V11.5C4 11.7761 4.22386 12 4.5 12H6.5C6.77614 12 7 12.2239 7 12.5C7 12.7761 6.77614 13 6.5 13H4.5L4.34668 12.9922C3.64069 12.9205 3.07949 12.3593 3.00781 11.6533L3 11.5V4.5C3 3.67157 3.67157 3 4.5 3H11.5ZM12.1465 10.1465C12.3416 9.95137 12.6582 9.95165 12.8535 10.1465C13.0483 10.3418 13.0486 10.6584 12.8535 10.8535L10.8535 12.8535C10.6584 13.0486 10.3418 13.0483 10.1465 12.8535C9.95165 12.6582 9.95137 12.3416 10.1465 12.1465L12.1465 10.1465ZM10.7324 8.73242C11.7086 7.75632 13.2913 7.75658 14.2676 8.73242C15.2434 9.70875 15.2437 11.2914 14.2676 12.2676C14.0725 12.4626 13.7558 12.4624 13.5605 12.2676C13.3659 12.0723 13.3656 11.7556 13.5605 11.5605C14.1461 10.9749 14.1459 10.0253 13.5605 9.43945C12.9747 8.85413 12.0251 8.85388 11.4395 9.43945C11.2444 9.63446 10.9277 9.63415 10.7324 9.43945C10.5376 9.24419 10.5374 8.92757 10.7324 8.73242Z" fill="${iconColor}" fill-opacity="0.9"/>
</svg>`;
    let badge = existingBadge;
    if (!badge) {
      badge = figma.createFrame();
      badge.name = "FigmaLinkBadge";
      badge.fills = [];
      badge.clipsContent = true;
      badge.resize(16, 16);
      badge.cornerRadius = 2;
      badge.setPluginData("is_figma_link_badge", "true");
      card.appendChild(badge);
    } else {
      badge.clipsContent = true;
      badge.cornerRadius = 2;
      while (badge.children.length > 0) {
        badge.children[0].remove();
      }
    }
    const targetSvg = isFigma ? penSvg : linkedObjectSvg;
    const svgNode = figma.createNodeFromSvg(targetSvg);
    svgNode.name = isFigma ? "icon.16.pen" : "icon.16.linkedobject";
    svgNode.resize(16, 16);
    badge.appendChild(svgNode);
    svgNode.x = 0;
    svgNode.y = 0;
    svgNode.locked = true;
    await loadRequiredFonts();
    const linkText = figma.createText();
    linkText.name = "LinkOverlay";
    linkText.characters = "\u2588";
    linkText.fontSize = 16;
    linkText.lineHeight = { value: 16, unit: "PIXELS" };
    linkText.textAlignHorizontal = "CENTER";
    linkText.textAlignVertical = "CENTER";
    linkText.textAutoResize = "NONE";
    linkText.resize(16, 16);
    linkText.x = 0;
    linkText.y = 0;
    linkText.opacity = 0;
    linkText.hyperlink = { type: "URL", value: trimmedLink };
    badge.appendChild(linkText);
    badge.layoutPositioning = "ABSOLUTE";
    badge.constraints = { horizontal: "MIN", vertical: "MAX" };
    badge.x = 16;
    badge.y = card.height - badge.height - 10;
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
  function isHeaderFrame(c) {
    if (c.type !== "FRAME") return false;
    if (c.name === "Header") return true;
    if (c.name.startsWith("[Step]") || c.getPluginData("is_step_badge") === "true") return false;
    if (c.name === "StatusBadge" || c.getPluginData("is_status_badge") === "true") return false;
    if (c.name === "FigmaLinkBadge" || c.getPluginData("is_figma_link_badge") === "true") return false;
    return c.layoutMode === "HORIZONTAL";
  }
  function calculateCardHugHeight(card, textCharacters) {
    const isAuto = card.primaryAxisSizingMode === "AUTO";
    if (isAuto && textCharacters === void 0) {
      return Math.round(card.height);
    }
    const prevSizingMode = card.primaryAxisSizingMode;
    const prevHeight = card.height;
    const prevMinHeight = card.minHeight;
    const prevMaxHeight = card.maxHeight;
    const descText = card.children.find(
      (c) => c.name === "DescText" || c.getPluginData("node_role") === "desc"
    );
    const prevMaxLines = descText ? descText.maxLines : null;
    const prevDescChars = descText ? descText.characters : "";
    try {
      card.minHeight = null;
      card.maxHeight = null;
      if (descText) {
        descText.maxLines = null;
        if (textCharacters !== void 0 && textCharacters !== prevDescChars) {
          descText.characters = textCharacters;
        }
      }
      card.primaryAxisSizingMode = "AUTO";
      const hugH = Math.round(card.height);
      card.primaryAxisSizingMode = prevSizingMode;
      card.resize(card.width, prevHeight);
      card.minHeight = prevMinHeight;
      card.maxHeight = prevMaxHeight;
      if (descText) {
        if (prevMaxLines !== null) descText.maxLines = prevMaxLines;
        if (textCharacters !== void 0 && textCharacters !== prevDescChars) {
          descText.characters = prevDescChars;
        }
      }
      return hugH;
    } catch (_) {
      return Math.round(card.height);
    }
  }
  async function ensureTextNodeFontsLoaded(textNode) {
    if (!textNode) return;
    try {
      const len = textNode.characters.length;
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
      try {
        await figma.loadFontAsync({ family: "Inter", style: "Regular" });
        await figma.loadFontAsync({ family: "Inter", style: "Bold" });
      } catch (_) {
      }
    }
  }
  async function updateDescTextTruncation(card, descText, currentHeight, textCharacters) {
    try {
      const descFont = { family: "Inter", style: "Regular" };
      await figma.loadFontAsync(descFont);
      await ensureTextNodeFontsLoaded(descText);
      const len = descText.characters.length;
      if (len > 0) {
        try {
          descText.setRangeFontName(0, len, descFont);
        } catch (_) {
          try {
            descText.fontName = descFont;
          } catch (_2) {
          }
        }
        try {
          descText.setRangeFontSize(0, len, 11);
        } catch (_) {
          try {
            descText.fontSize = 11;
          } catch (_2) {
          }
        }
      } else {
        try {
          descText.fontName = descFont;
        } catch (_) {
        }
        try {
          descText.fontSize = 11;
        } catch (_) {
        }
      }
      descText.textTruncation = "ENDING";
      descText.textAlignHorizontal = "LEFT";
      if (descText.layoutAlign !== "STRETCH") {
        descText.layoutAlign = "STRETCH";
      }
      const pl = typeof card.paddingLeft === "number" ? card.paddingLeft : 16;
      const pr = typeof card.paddingRight === "number" ? card.paddingRight : 16;
      const availW = Math.max(50, card.width - pl - pr);
      if (Math.abs(descText.width - availW) > 1) {
        descText.resize(availW, descText.height);
      }
      if (descText.textAutoResize !== "HEIGHT") {
        descText.textAutoResize = "HEIGHT";
      }
      const isHug = card.primaryAxisSizingMode === "AUTO";
      if (isHug) {
        descText.maxLines = null;
        return;
      }
      const hugH = calculateCardHugHeight(card, textCharacters);
      if (currentHeight >= hugH - 4) {
        descText.maxLines = null;
        return;
      }
      const statusBadge = card.children.find(
        (c) => c.getPluginData("is_status_badge") === "true" || c.name === "StatusBadge"
      );
      const pb = statusBadge ? 36 : 16;
      const headerRow = card.children.find(isHeaderFrame);
      const headerH = headerRow ? headerRow.height : 20;
      const availableH = Math.max(14, currentHeight - 14 - pb - 8 - Math.round(headerH));
      descText.maxLines = Math.max(1, Math.floor(availableH / 13.5));
    } catch (err) {
      console.warn("updateDescTextTruncation failed:", err);
    }
  }
  function getNodeCenter(node) {
    if ("absoluteBoundingBox" in node && node.absoluteBoundingBox) {
      return {
        x: node.absoluteBoundingBox.x + node.absoluteBoundingBox.width / 2,
        y: node.absoluteBoundingBox.y + node.absoluteBoundingBox.height / 2
      };
    }
    const x = "x" in node ? node.x : 0;
    const y = "y" in node ? node.y : 0;
    const w = "width" in node ? node.width : 0;
    const h = "height" in node ? node.height : 0;
    return { x: x + w / 2, y: y + h / 2 };
  }
  function getNodeTopLeft(node) {
    if ("absoluteBoundingBox" in node && node.absoluteBoundingBox) {
      return {
        x: node.absoluteBoundingBox.x,
        y: node.absoluteBoundingBox.y
      };
    }
    const x = "x" in node ? node.x : 0;
    const y = "y" in node ? node.y : 0;
    return { x, y };
  }
  function sortNodesBySpatialPosition(nodes) {
    if (nodes.length <= 1) return nodes;
    const centers = /* @__PURE__ */ new Map();
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
        if (Math.abs(posA.x - posB.x) > 1) {
          return posA.x - posB.x;
        }
        return posA.y - posB.y;
      } else {
        if (Math.abs(posA.y - posB.y) > 1) {
          return posA.y - posB.y;
        }
        return posA.x - posB.x;
      }
    });
  }
  async function handleSelectionChange() {
    await loadRequiredFonts();
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
    if (uniqueNodes.length > 1) {
      uniqueNodes = sortNodesBySpatialPosition(uniqueNodes);
    }
    let multiConnectorSortedNodeNames = [];
    if (connectorCount > 0 && flowNodeCount === 0) {
      const endpointNodeMap = /* @__PURE__ */ new Map();
      for (const c of connNodes) {
        if (c.type === "CONNECTOR") {
          const conn = c;
          if (conn.connectorStart && "endpointNodeId" in conn.connectorStart && conn.connectorStart.endpointNodeId) {
            const srcNode = figma.getNodeById(conn.connectorStart.endpointNodeId);
            if (srcNode) endpointNodeMap.set(srcNode.id, srcNode);
          }
          if (conn.connectorEnd && "endpointNodeId" in conn.connectorEnd && conn.connectorEnd.endpointNodeId) {
            const tgtNode = figma.getNodeById(conn.connectorEnd.endpointNodeId);
            if (tgtNode) endpointNodeMap.set(tgtNode.id, tgtNode);
          }
        } else {
          const srcId = c.getPluginData("source_node_id");
          const tgtId = c.getPluginData("target_node_id");
          if (srcId) {
            const srcNode = figma.getNodeById(srcId);
            if (srcNode) endpointNodeMap.set(srcNode.id, srcNode);
          }
          if (tgtId) {
            const tgtNode = figma.getNodeById(tgtId);
            if (tgtNode) endpointNodeMap.set(tgtNode.id, tgtNode);
          }
        }
      }
      const endpointNodes = Array.from(endpointNodeMap.values());
      if (endpointNodes.length > 0) {
        const sortedEndpoints = sortNodesBySpatialPosition(endpointNodes);
        multiConnectorSortedNodeNames = sortedEndpoints.map((n) => n.name);
      }
    }
    const nodes = await Promise.all(uniqueNodes.map(async (node) => {
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
          if (frame.paddingBottom !== 36) {
            frame.paddingBottom = 36;
          }
          statusBadge.paddingLeft = 9;
          statusBadge.paddingRight = 9;
          const nodeCornerRadius = typeof frame.cornerRadius === "number" ? frame.cornerRadius : 0;
          statusBadge.cornerRadius = getStatusBadgeCornerRadius(nodeCornerRadius);
          statusBadge.constraints = { horizontal: "MAX", vertical: "MAX" };
          statusBadge.x = frame.width - statusBadge.width - 10;
          statusBadge.y = frame.height - statusBadge.height - 10;
          statusBadge.locked = true;
          const textChild = statusBadge.children.find((c) => c.type === "TEXT");
          if (textChild) textChild.locked = true;
        }
        if (frame.layoutMode !== "VERTICAL") {
          frame.layoutMode = "VERTICAL";
        }
        if (frame.counterAxisAlignItems !== "MIN") {
          frame.counterAxisAlignItems = "MIN";
        }
        if (frame.primaryAxisAlignItems !== "MIN") {
          frame.primaryAxisAlignItems = "MIN";
        }
        const headerFrame = frame.children.find(isHeaderFrame);
        const titleText = headerFrame ? headerFrame.children.find((c) => c.type === "TEXT") : frame.children.find((c) => c.type === "TEXT" && (c.name === "TitleText" || c.getPluginData("node_role") === "title"));
        if (titleText) {
          enforceTitleStandardStyle(titleText, frame);
        }
        const descText = frame.children.find(
          (c) => c.type === "TEXT" && (c.name === "DescText" || c.getPluginData("node_role") === "desc")
        );
        if (descText) {
          await lockTextFontSizeAndAutoResize(descText, 11);
          await updateDescTextTruncation(frame, descText, frame.height);
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
      let connectorIsReversed = false;
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
            const upper = String(cap || "").toUpperCase();
            if (upper.includes("BAR") || upper.includes("EXACTLY_ONE")) return "BAR";
            if (upper.includes("SQUARE")) return "SQUARE";
            if (upper.includes("REVERSED_TRIANGLE")) return "REVERSED_TRIANGLE_ARROW";
            if (upper.includes("TRIANGLE") || upper.includes("ARROW") || upper.includes("EQUILATERAL")) return "ARROW";
            if (upper.includes("DIAMOND")) return "DIAMOND";
            if (upper.includes("CIRCLE") || upper.includes("ROUND")) return "CIRCLE";
            return "NONE";
          };
          const savedStartTerm = node.getPluginData("start_terminal");
          const savedEndTerm = node.getPluginData("end_terminal");
          connectorStartTerminal = savedStartTerm || mapCapToTerm(String(conn.connectorStartStrokeCap || "NONE"));
          connectorEndTerminal = savedEndTerm || mapCapToTerm(String(conn.connectorEndStrokeCap || "NONE"));
          let sourceEndpointNode = null;
          let targetEndpointNode = null;
          if (conn.connectorStart && "endpointNodeId" in conn.connectorStart && conn.connectorStart.endpointNodeId) {
            sourceEndpointNode = figma.getNodeById(conn.connectorStart.endpointNodeId);
            if (sourceEndpointNode) connectorSourceNodeName = sourceEndpointNode.name;
            if ("magnet" in conn.connectorStart) {
              connectorSourceMagnet = conn.connectorStart.magnet;
            }
          }
          if (conn.connectorEnd && "endpointNodeId" in conn.connectorEnd && conn.connectorEnd.endpointNodeId) {
            targetEndpointNode = figma.getNodeById(conn.connectorEnd.endpointNodeId);
            if (targetEndpointNode) connectorTargetNodeName = targetEndpointNode.name;
            if ("magnet" in conn.connectorEnd) {
              connectorTargetMagnet = conn.connectorEnd.magnet;
            }
          }
          let startPos = null;
          let endPos = null;
          if (sourceEndpointNode) {
            startPos = getNodeCenter(sourceEndpointNode);
          } else if (conn.connectorStart && "position" in conn.connectorStart && conn.connectorStart.position) {
            startPos = conn.connectorStart.position;
          }
          if (targetEndpointNode) {
            endPos = getNodeCenter(targetEndpointNode);
          } else if (conn.connectorEnd && "position" in conn.connectorEnd && conn.connectorEnd.position) {
            endPos = conn.connectorEnd.position;
          }
          let shouldReverse = false;
          if (sourceEndpointNode && targetEndpointNode) {
            const sorted = sortNodesBySpatialPosition([sourceEndpointNode, targetEndpointNode]);
            if (sorted[0].id === targetEndpointNode.id) {
              shouldReverse = true;
            }
          } else if (startPos && endPos) {
            const dx = Math.abs(startPos.x - endPos.x);
            const dy = Math.abs(startPos.y - endPos.y);
            if (dx >= dy) {
              if (endPos.x < startPos.x) shouldReverse = true;
            } else {
              if (endPos.y < startPos.y) shouldReverse = true;
            }
          }
          if (shouldReverse) {
            connectorIsReversed = true;
            if (sourceEndpointNode && targetEndpointNode) {
              connectorSourceNodeName = targetEndpointNode.name;
              connectorTargetNodeName = sourceEndpointNode.name;
            } else {
              const tempName = connectorSourceNodeName;
              connectorSourceNodeName = connectorTargetNodeName;
              connectorTargetNodeName = tempName;
            }
            const tempMagnet = connectorSourceMagnet;
            connectorSourceMagnet = connectorTargetMagnet;
            connectorTargetMagnet = tempMagnet;
            const tempTerm = connectorStartTerminal;
            connectorStartTerminal = connectorEndTerminal;
            connectorEndTerminal = tempTerm;
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
          let sourceEndpointNode = null;
          let targetEndpointNode = null;
          if (srcId) {
            sourceEndpointNode = figma.getNodeById(srcId);
            if (sourceEndpointNode) connectorSourceNodeName = sourceEndpointNode.name;
          }
          if (tgtId) {
            targetEndpointNode = figma.getNodeById(tgtId);
            if (targetEndpointNode) connectorTargetNodeName = targetEndpointNode.name;
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
          if (sourceEndpointNode && targetEndpointNode) {
            const sorted = sortNodesBySpatialPosition([sourceEndpointNode, targetEndpointNode]);
            if (sorted[0].id === targetEndpointNode.id) {
              connectorIsReversed = true;
              connectorSourceNodeName = targetEndpointNode.name;
              connectorTargetNodeName = sourceEndpointNode.name;
              const tempMagnet = connectorSourceMagnet;
              connectorSourceMagnet = connectorTargetMagnet;
              connectorTargetMagnet = tempMagnet;
              const tempTerm = connectorStartTerminal;
              connectorStartTerminal = connectorEndTerminal;
              connectorEndTerminal = tempTerm;
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
      const flowNodeType = isFlowNode ? savedType || "Screen" : void 0;
      const savedStatus = isFlowNode ? node.getPluginData("workflow_status") : void 0;
      let sizeMode = "fixed";
      let hugHeight = Math.round(node.height);
      if (isFlowNode && node.type === "FRAME") {
        const frame = node;
        const isAuto = frame.primaryAxisSizingMode === "AUTO";
        sizeMode = isAuto ? "hug" : "fixed";
        hugHeight = calculateCardHugHeight(frame);
      }
      let nodeFillColor;
      let nodeStrokeColor;
      let nodeStrokeWeight;
      if ("fills" in node && Array.isArray(node.fills) && node.fills.length > 0) {
        const firstFill = node.fills[0];
        if (firstFill.type === "SOLID") {
          nodeFillColor = rgbToHexColor(firstFill.color);
        }
      }
      if ("strokes" in node && Array.isArray(node.strokes) && node.strokes.length > 0) {
        const firstStroke = node.strokes[0];
        if (firstStroke.type === "SOLID") {
          nodeStrokeColor = rgbToHexColor(firstStroke.color);
        }
      }
      if ("strokeWeight" in node && typeof node.strokeWeight === "number") {
        nodeStrokeWeight = node.strokeWeight;
      }
      if (isConnector && typeof connectorStrokeWeight === "number") {
        nodeStrokeWeight = connectorStrokeWeight;
      }
      let cornerRadius = 0;
      if ("cornerRadius" in node && typeof node.cornerRadius === "number") {
        cornerRadius = Math.round(node.cornerRadius);
      }
      const pos = getNodeTopLeft(node);
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
        cachedFigmaLink: node.getPluginData("cached_figma_link") || node.getPluginData("figma_link") || void 0,
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
        connectorIsReversed,
        connectedNodeNames: multiConnectorSortedNodeNames.length > 0 ? multiConnectorSortedNodeNames : void 0,
        width: Math.round(node.width),
        height: Math.round(node.height),
        cornerRadius,
        hugHeight,
        sizeMode,
        stepNumber: node.getPluginData("step_number") ? parseInt(node.getPluginData("step_number"), 10) : void 0,
        badgeCorner: node.getPluginData("badge_corner") || void 0,
        badgeShape: node.getPluginData("badge_shape") || void 0,
        badgeColorMode: node.getPluginData("badge_color_mode") || void 0,
        elevationOn: node.getPluginData("node_elevation") !== "",
        elevation: node.getPluginData("node_elevation") !== "" ? parseInt(node.getPluginData("node_elevation"), 10) : void 0,
        fillColorHex: nodeFillColor,
        strokeColorHex: nodeStrokeColor,
        strokeWeight: nodeStrokeWeight,
        phaseId: node.getPluginData("phase_id") || void 0,
        phaseName: node.getPluginData("phase_name") || void 0,
        phaseColor: node.getPluginData("phase_color") || void 0,
        x: Math.round(pos.x),
        y: Math.round(pos.y)
      };
    }));
    let currentStatus;
    if (uniqueNodes.length === 1) {
      const saved = uniqueNodes[0].getPluginData("workflow_status");
      if (saved) currentStatus = saved;
    }
    let suggestedSourceMagnet;
    let suggestedTargetMagnet;
    if (connectorCount === 1 && nodes.length > 0) {
      suggestedSourceMagnet = nodes[0].connectorSourceMagnet;
      suggestedTargetMagnet = nodes[0].connectorTargetMagnet;
    } else if (uniqueNodes.length >= 2 && connectorCount === 0) {
      const box1 = {
        x: uniqueNodes[0].x,
        y: uniqueNodes[0].y,
        width: uniqueNodes[0].width,
        height: uniqueNodes[0].height
      };
      const box2 = {
        x: uniqueNodes[1].x,
        y: uniqueNodes[1].y,
        width: uniqueNodes[1].width,
        height: uniqueNodes[1].height
      };
      const optimal = getOptimalMagnetPair(box1, box2);
      suggestedSourceMagnet = optimal.sourceMagnet;
      suggestedTargetMagnet = optimal.targetMagnet;
    }
    postToUI({
      type: "SELECTION_CHANGED",
      count: flowNodeCount + otherObjectCount + connectorCount,
      nodes,
      currentStatus,
      nextSuggestedTag: getNextFlowTag(),
      flowNodeCount,
      otherObjectCount,
      connectorCount,
      suggestedSourceMagnet,
      suggestedTargetMagnet
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
  async function lockTextFontSizeAndAutoResize(textNode, targetSize) {
    try {
      const descFont = { family: "Inter", style: "Regular" };
      await figma.loadFontAsync(descFont);
      await ensureTextNodeFontsLoaded(textNode);
      const len = textNode.characters.length;
      if (len > 0) {
        try {
          textNode.setRangeFontName(0, len, descFont);
        } catch (_) {
          try {
            textNode.fontName = descFont;
          } catch (_2) {
          }
        }
        try {
          textNode.setRangeFontSize(0, len, targetSize);
        } catch (_) {
          try {
            textNode.fontSize = targetSize;
          } catch (_2) {
          }
        }
      } else {
        try {
          textNode.fontName = descFont;
        } catch (_) {
        }
        try {
          textNode.fontSize = targetSize;
        } catch (_) {
        }
      }
      if (textNode.textAlignHorizontal !== "LEFT") {
        textNode.textAlignHorizontal = "LEFT";
      }
      if (textNode.parent && "layoutMode" in textNode.parent) {
        const parentFrame = textNode.parent;
        if (parentFrame.layoutMode !== "VERTICAL") {
          parentFrame.layoutMode = "VERTICAL";
        }
        if (parentFrame.counterAxisAlignItems !== "MIN") {
          parentFrame.counterAxisAlignItems = "MIN";
        }
        if (parentFrame.primaryAxisAlignItems !== "MIN") {
          parentFrame.primaryAxisAlignItems = "MIN";
        }
        const pl = typeof parentFrame.paddingLeft === "number" ? parentFrame.paddingLeft : 16;
        const pr = typeof parentFrame.paddingRight === "number" ? parentFrame.paddingRight : 16;
        const availW = Math.max(50, parentFrame.width - pl - pr);
        if (Math.abs(textNode.width - availW) > 1) {
          textNode.resize(availW, textNode.height);
        }
      }
      if (textNode.layoutAlign !== "STRETCH") {
        textNode.layoutAlign = "STRETCH";
      }
      if (textNode.textAutoResize !== "HEIGHT") {
        textNode.textAutoResize = "HEIGHT";
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
      let bgColor = { r: 1, g: 1, b: 1 };
      if (flowNode && "getPluginData" in flowNode) {
        isDark = flowNode.getPluginData("node_theme") === "dark";
      }
      if (flowNode && "fills" in flowNode) {
        const fNode = flowNode;
        if (Array.isArray(fNode.fills) && fNode.fills.length > 0 && fNode.fills[0].type === "SOLID") {
          bgColor = fNode.fills[0].color;
        }
      }
      const { titleFill } = getTextFillsByBackground(bgColor, isDark);
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
          textNode.setRangeFills(0, len, [titleFill]);
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
          textNode.fills = [titleFill];
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
    let bgColor = isDark ? { r: 0.14, g: 0.14, b: 0.15 } : { r: 1, g: 1, b: 1 };
    if (Array.isArray(shape.fills) && shape.fills.length > 0 && shape.fills[0].type === "SOLID") {
      bgColor = shape.fills[0].color;
    }
    const { titleFill, descFill, isBgDark } = getTextFillsByBackground(bgColor, isDark);
    const borderColor = isBgDark ? { r: 0.28, g: 0.28, b: 0.3 } : { r: 0.15, g: 0.15, b: 0.18 };
    const card = figma.createFrame();
    card.name = title;
    card.x = x;
    card.y = y;
    card.resize(width, height);
    card.cornerRadius = 0;
    card.strokeWeight = 1.5;
    card.strokes = [{ type: "SOLID", color: borderColor }];
    card.fills = [{ type: "SOLID", color: bgColor }];
    card.clipsContent = false;
    card.layoutMode = "VERTICAL";
    card.primaryAxisSizingMode = "FIXED";
    card.counterAxisSizingMode = "FIXED";
    const hasShapeStatus = Boolean(status && STATUS_CONFIG[status]);
    card.paddingTop = 14;
    card.paddingBottom = hasShapeStatus ? 36 : 16;
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
    titleText.fills = [titleFill];
    titleText.layoutGrow = 1;
    titleText.textAutoResize = "HEIGHT";
    titleText.textTruncation = "ENDING";
    titleText.maxLines = 1;
    titleText.setPluginData("node_role", "title");
    headerRow.appendChild(titleText);
    card.appendChild(headerRow);
    if (status && STATUS_CONFIG[status]) {
      const cfg = STATUS_CONFIG[status];
      const { badgeBg, badgeTextColor } = getStatusBadgeColors(status, bgColor, isDark);
      const statusBadge = figma.createFrame();
      statusBadge.name = "StatusBadge";
      statusBadge.layoutMode = "HORIZONTAL";
      statusBadge.primaryAxisSizingMode = "AUTO";
      statusBadge.counterAxisSizingMode = "AUTO";
      statusBadge.primaryAxisAlignItems = "CENTER";
      statusBadge.counterAxisAlignItems = "CENTER";
      statusBadge.paddingLeft = 9;
      statusBadge.paddingRight = 9;
      statusBadge.paddingTop = 3;
      statusBadge.paddingBottom = 3;
      statusBadge.cornerRadius = getStatusBadgeCornerRadius(card.cornerRadius);
      statusBadge.fills = [{ type: "SOLID", color: badgeBg }];
      statusBadge.setPluginData("is_status_badge", "true");
      const badgeText = figma.createText();
      badgeText.name = "StatusText";
      badgeText.fontName = { family: "Inter", style: "Bold" };
      badgeText.fontSize = 9;
      badgeText.characters = cfg.label.toUpperCase();
      badgeText.textAutoResize = "WIDTH_AND_HEIGHT";
      badgeText.fills = [{ type: "SOLID", color: badgeTextColor }];
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
    descText.fills = [descFill];
    descText.textAlignHorizontal = "LEFT";
    descText.setPluginData("node_role", "desc");
    card.appendChild(descText);
    descText.layoutAlign = "STRETCH";
    const availW = Math.max(50, width - card.paddingLeft - card.paddingRight);
    descText.resize(availW, descText.height);
    descText.textAutoResize = "HEIGHT";
    await updateDescTextTruncation(card, descText, height, desc);
    if (stepNumber) {
      const stepBadge = figma.createFrame();
      stepBadge.name = `[Step] ${stepNumber}`;
      card.appendChild(stepBadge);
      stepBadge.layoutPositioning = "ABSOLUTE";
      stepBadge.layoutMode = "HORIZONTAL";
      stepBadge.primaryAxisAlignItems = "CENTER";
      stepBadge.counterAxisAlignItems = "CENTER";
      stepBadge.paddingLeft = 4;
      stepBadge.paddingRight = 4;
      stepBadge.paddingTop = 0;
      stepBadge.paddingBottom = 0;
      try {
        stepBadge.minWidth = 24;
        stepBadge.minHeight = 24;
        stepBadge.maxHeight = 24;
      } catch (e) {
      }
      stepBadge.counterAxisSizingMode = "FIXED";
      stepBadge.primaryAxisSizingMode = "AUTO";
      stepBadge.resize(24, 24);
      const bShape = card.getPluginData("badge_shape");
      if (bShape === "Circle") {
        stepBadge.cornerRadius = 999;
      } else if (bShape === "RoundBox") {
        stepBadge.cornerRadius = 5;
      } else {
        stepBadge.cornerRadius = 0;
      }
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
      const bCorner = card.getPluginData("badge_corner");
      const bw = Math.max(24, Math.round(stepBadge.width));
      const bh = 24;
      if (bCorner === "TOP_RIGHT") {
        stepBadge.x = card.width - bw + 9;
        stepBadge.y = -9;
        stepBadge.constraints = { horizontal: "MAX", vertical: "MIN" };
      } else if (bCorner === "BOTTOM_LEFT") {
        stepBadge.x = -9;
        stepBadge.y = card.height - bh + 9;
        stepBadge.constraints = { horizontal: "MIN", vertical: "MAX" };
      } else if (bCorner === "BOTTOM_RIGHT") {
        stepBadge.x = card.width - bw + 9;
        stepBadge.y = card.height - bh + 9;
        stepBadge.constraints = { horizontal: "MAX", vertical: "MAX" };
      } else {
        stepBadge.x = -9;
        stepBadge.y = -9;
        stepBadge.constraints = { horizontal: "MIN", vertical: "MIN" };
      }
    }
    const elevData = shape.getPluginData("node_elevation");
    if (elevData !== "") {
      const elev = parseInt(elevData, 10);
      card.setPluginData("node_elevation", elevData);
      card.effects = getElevationEffects(elev, isDark);
      card.clipsContent = false;
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
      const title = (payload.title || "").trim() || "Untitled";
      const description = (payload.description || "").trim();
      const theme = payload.theme || "light";
      const width = payload.width ? Math.max(120, payload.width) : 250;
      const height = payload.height ? Math.max(50, payload.height) : 90;
      const isDark = theme === "dark";
      let bgColor = isDark ? { r: 0.14, g: 0.14, b: 0.15 } : { r: 1, g: 1, b: 1 };
      if (payload.colorHex) {
        bgColor = hexToRgbColor(payload.colorHex);
      }
      const { titleFill, descFill, isBgDark } = getTextFillsByBackground(bgColor, isDark);
      const borderColor = isBgDark ? { r: 0.28, g: 0.28, b: 0.3 } : { r: 0.15, g: 0.15, b: 0.18 };
      const card = figma.createFrame();
      card.name = title;
      card.cornerRadius = typeof payload.cornerRadius === "number" ? Math.min(20, Math.max(0, payload.cornerRadius)) : 0;
      if (typeof payload.strokeWeight === "number") {
        card.strokeWeight = payload.strokeWeight;
        if (payload.strokeWeight === 0) {
          card.strokes = [];
        } else {
          const sColor = payload.strokeColor ? hexToRgbColor(payload.strokeColor) : borderColor;
          card.strokes = [{ type: "SOLID", color: sColor }];
        }
      } else {
        card.strokeWeight = 1.5;
        card.strokes = [{ type: "SOLID", color: borderColor }];
      }
      card.fills = [{ type: "SOLID", color: bgColor }];
      card.clipsContent = false;
      card.layoutMode = "VERTICAL";
      card.primaryAxisSizingMode = "FIXED";
      card.counterAxisSizingMode = "FIXED";
      const hasStatus = Boolean(payload.status && STATUS_CONFIG[payload.status]);
      const hasLink = Boolean(payload.figmaLink && payload.figmaLink.trim());
      const hasBottomBar = hasStatus || hasLink;
      if (!description && !hasBottomBar) {
        card.paddingTop = 14;
        card.paddingBottom = 14;
        card.primaryAxisAlignItems = "CENTER";
      } else {
        card.paddingTop = 14;
        card.paddingBottom = hasBottomBar ? 36 : 16;
        card.primaryAxisAlignItems = "MIN";
      }
      card.paddingLeft = 16;
      card.paddingRight = 16;
      card.itemSpacing = 8;
      card.counterAxisAlignItems = "MIN";
      const finalHeight = height;
      card.resize(width, finalHeight);
      card.minWidth = width;
      card.maxWidth = width;
      card.minHeight = finalHeight;
      card.maxHeight = finalHeight;
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
      titleText.fills = [titleFill];
      titleText.layoutGrow = 1;
      titleText.textAutoResize = "HEIGHT";
      titleText.textTruncation = "ENDING";
      titleText.maxLines = 1;
      titleText.setPluginData("node_role", "title");
      headerRow.appendChild(titleText);
      card.appendChild(headerRow);
      if (description) {
        const descText = figma.createText();
        descText.name = "DescText";
        descText.fontName = { family: "Inter", style: "Regular" };
        descText.fontSize = 11;
        descText.characters = description;
        descText.fills = [descFill];
        descText.textAlignHorizontal = "LEFT";
        descText.setPluginData("node_role", "desc");
        card.appendChild(descText);
        descText.layoutAlign = "STRETCH";
        const availW = Math.max(50, width - card.paddingLeft - card.paddingRight);
        descText.resize(availW, descText.height);
        descText.textAutoResize = "HEIGHT";
        await updateDescTextTruncation(card, descText, height, description);
      }
      card.name = title;
      card.setPluginData("is_flow_node", "true");
      card.setPluginData("schema_version", "2");
      card.setPluginData("node_theme", theme);
      card.setPluginData("node_type", payload.nodeType || "Screen");
      if (payload.status) {
        card.setPluginData("workflow_status", payload.status);
        if (STATUS_CONFIG[payload.status]) {
          const cfg = STATUS_CONFIG[payload.status];
          const { badgeBg, badgeTextColor } = getStatusBadgeColors(payload.status, bgColor, isDark);
          const statusBadge = figma.createFrame();
          statusBadge.name = "StatusBadge";
          statusBadge.layoutMode = "HORIZONTAL";
          statusBadge.primaryAxisSizingMode = "AUTO";
          statusBadge.counterAxisSizingMode = "AUTO";
          statusBadge.primaryAxisAlignItems = "CENTER";
          statusBadge.counterAxisAlignItems = "CENTER";
          statusBadge.paddingLeft = 9;
          statusBadge.paddingRight = 9;
          statusBadge.paddingTop = 3;
          statusBadge.paddingBottom = 3;
          statusBadge.cornerRadius = getStatusBadgeCornerRadius(card.cornerRadius);
          statusBadge.fills = [{ type: "SOLID", color: badgeBg }];
          statusBadge.setPluginData("is_status_badge", "true");
          const badgeText = figma.createText();
          badgeText.name = "StatusText";
          badgeText.fontName = { family: "Inter", style: "Bold" };
          badgeText.fontSize = 9;
          badgeText.characters = cfg.label.toUpperCase();
          badgeText.textAutoResize = "WIDTH_AND_HEIGHT";
          badgeText.fills = [{ type: "SOLID", color: badgeTextColor }];
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
      await updateFigmaLinkBadge(card, payload.figmaLink, isBgDark);
      if (typeof payload.elevation === "number") {
        card.setPluginData("node_elevation", `${payload.elevation}`);
        card.effects = getElevationEffects(payload.elevation, isBgDark);
        card.clipsContent = false;
      } else {
        card.setPluginData("node_elevation", "");
        card.effects = [];
      }
      if (typeof payload.badgeNumber === "number" && payload.badgeNumber > 0) {
        await applyStepBadgeToSingleCard(
          card,
          payload.badgeNumber,
          payload.badgePosition || "TOP_LEFT",
          payload.badgeShape || "Square",
          payload.badgeColorMode || "Style"
        );
      }
      if (payload.phaseId && payload.phaseId !== "none") {
        card.setPluginData("phase_id", payload.phaseId);
        card.setPluginData("phase_name", payload.phaseName || "Phase");
        card.setPluginData("phase_color", payload.phaseColor || "#EA2039");
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
      let bgColor = isDark ? { r: 0.14, g: 0.14, b: 0.15 } : { r: 1, g: 1, b: 1 };
      if (payload.colorHex) {
        bgColor = hexToRgbColor(payload.colorHex);
      } else {
        const currentFill = flowNode.fills;
        if (Array.isArray(currentFill) && currentFill.length > 0 && currentFill[0].type === "SOLID") {
          bgColor = currentFill[0].color;
        }
      }
      const { titleFill, descFill, isBgDark } = getTextFillsByBackground(bgColor, isDark);
      const borderColor = isBgDark ? { r: 0.28, g: 0.28, b: 0.3 } : { r: 0.15, g: 0.15, b: 0.18 };
      const card = flowNode;
      card.name = title;
      if (typeof payload.cornerRadius === "number") {
        card.cornerRadius = Math.min(20, Math.max(0, payload.cornerRadius));
      }
      card.clipsContent = false;
      card.fills = [{ type: "SOLID", color: bgColor }];
      if (typeof payload.strokeWeight === "number") {
        card.strokeWeight = payload.strokeWeight;
        if (payload.strokeWeight === 0) {
          card.strokes = [];
        } else {
          const sColor = payload.strokeColor ? hexToRgbColor(payload.strokeColor) : borderColor;
          card.strokes = [{ type: "SOLID", color: sColor }];
        }
      } else if (payload.strokeColor) {
        card.strokes = [{ type: "SOLID", color: hexToRgbColor(payload.strokeColor) }];
      }
      if (card.layoutMode !== "VERTICAL") {
        card.layoutMode = "VERTICAL";
      }
      if (card.counterAxisAlignItems !== "MIN") {
        card.counterAxisAlignItems = "MIN";
      }
      let headerRow = card.children.find(isHeaderFrame);
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
      titleText.textAlignHorizontal = "LEFT";
      titleText.textTruncation = "ENDING";
      titleText.maxLines = 1;
      await safeSetCharacters(titleText, title);
      titleText.fills = [titleFill];
      let descText = card.children.find(
        (c) => c.name === "DescText" || c.getPluginData("node_role") === "desc"
      );
      if (!description) {
        if (descText) {
          descText.remove();
          descText = void 0;
        }
      } else {
        if (!descText) {
          descText = figma.createText();
          descText.name = "DescText";
          descText.fontName = { family: "Inter", style: "Regular" };
          descText.fontSize = 11;
          descText.textAlignHorizontal = "LEFT";
          descText.setPluginData("node_role", "desc");
          card.appendChild(descText);
        }
        descText.textAlignHorizontal = "LEFT";
        descText.layoutAlign = "STRETCH";
        const availW = Math.max(50, card.width - card.paddingLeft - card.paddingRight);
        if (Math.abs(descText.width - availW) > 1) {
          descText.resize(availW, descText.height);
        }
        descText.textAutoResize = "HEIGHT";
        const currentH = payload.height || card.height;
        await updateDescTextTruncation(card, descText, currentH, description);
        await safeSetCharacters(descText, description);
        descText.fills = [descFill];
        try {
          const descFont = { family: "Inter", style: "Regular" };
          await figma.loadFontAsync(descFont);
          const dLen = descText.characters.length;
          if (dLen > 0) {
            descText.setRangeFontName(0, dLen, descFont);
            descText.setRangeFontSize(0, dLen, 11);
          } else {
            descText.fontName = descFont;
            descText.fontSize = 11;
          }
        } catch (_) {
        }
      }
      let statusBadge = card.children.find(
        (c) => c.getPluginData("is_status_badge") === "true" || c.name === "StatusBadge"
      );
      const hasStatus = Boolean(statusBadge || payload.status && STATUS_CONFIG[payload.status]);
      const hasLink = Boolean(payload.figmaLink && payload.figmaLink.trim());
      const hasBottomBar = hasStatus || hasLink;
      if (!description && !hasBottomBar) {
        card.paddingTop = 14;
        card.paddingBottom = 14;
        card.primaryAxisAlignItems = "CENTER";
      } else {
        card.paddingTop = 14;
        card.paddingBottom = hasBottomBar ? 36 : 16;
        card.primaryAxisAlignItems = "MIN";
      }
      if (statusBadge) {
        statusBadge.paddingLeft = 9;
        statusBadge.paddingRight = 9;
        statusBadge.cornerRadius = getStatusBadgeCornerRadius(
          typeof card.cornerRadius === "number" ? card.cornerRadius : 0
        );
        statusBadge.constraints = { horizontal: "MAX", vertical: "MAX" };
        const currentStatus = payload.status || card.getPluginData("workflow_status");
        if (currentStatus && STATUS_CONFIG[currentStatus]) {
          const { badgeBg, badgeTextColor } = getStatusBadgeColors(currentStatus, bgColor, isDark);
          statusBadge.fills = [{ type: "SOLID", color: badgeBg }];
          const bText = statusBadge.children.find((c) => c.type === "TEXT");
          if (bText) {
            bText.locked = false;
            bText.fills = [{ type: "SOLID", color: badgeTextColor }];
            bText.locked = true;
          }
        }
      }
      await updateFigmaLinkBadge(card, payload.figmaLink, isBgDark, payload.clearLinkCache);
      const existingStepBadge = card.children.find(
        (c) => c.name.startsWith("[Step]") || c.getPluginData("is_step_badge") === "true"
      );
      if (existingStepBadge) {
        const stepText = existingStepBadge.children.find((c) => c.type === "TEXT");
        if (stepText) {
          const currentMode = card.getPluginData("badge_color_mode") || "Style";
          applyStepBadgeColors(existingStepBadge, stepText, currentMode, card);
        }
      }
      if (payload.phaseId !== void 0) {
        if (!payload.phaseId || payload.phaseId === "none") {
          card.setPluginData("phase_id", "");
          card.setPluginData("phase_name", "");
          card.setPluginData("phase_color", "");
        } else {
          card.setPluginData("phase_id", payload.phaseId);
          if (payload.phaseName) card.setPluginData("phase_name", payload.phaseName);
          if (payload.phaseColor) card.setPluginData("phase_color", payload.phaseColor);
        }
      }
      if (payload.width && payload.height) {
        const w = Math.max(120, payload.width);
        const targetH = Math.max(50, payload.height);
        const isHug = payload.sizeMode === "hug";
        card.minWidth = null;
        card.maxWidth = null;
        card.minHeight = null;
        card.maxHeight = null;
        if (isHug) {
          if (descText) {
            descText.maxLines = null;
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
          card.primaryAxisSizingMode = "FIXED";
          card.counterAxisSizingMode = "FIXED";
          card.resize(w, targetH);
          card.minWidth = w;
          card.maxWidth = w;
          card.minHeight = targetH;
          card.maxHeight = targetH;
        }
        const curH = card.height;
        if (statusBadge) {
          statusBadge.constraints = { horizontal: "MAX", vertical: "MAX" };
          statusBadge.x = w - statusBadge.width - 10;
          statusBadge.y = curH - statusBadge.height - 10;
        }
        const linkBadge = card.children.find(
          (c) => c.getPluginData("is_figma_link_badge") === "true" || c.name === "FigmaLinkBadge"
        );
        if (linkBadge) {
          linkBadge.constraints = { horizontal: "MIN", vertical: "MAX" };
          linkBadge.x = 16;
          linkBadge.y = curH - linkBadge.height - 10;
        }
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
      if (typeof payload.elevation === "number") {
        card.setPluginData("node_elevation", `${payload.elevation}`);
        card.effects = getElevationEffects(payload.elevation, isBgDark);
        card.clipsContent = false;
      } else if (payload.elevation === null || payload.elevation === void 0) {
        card.setPluginData("node_elevation", "");
        card.effects = [];
      }
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
      if (frame.layoutMode !== "VERTICAL") {
        frame.layoutMode = "VERTICAL";
      }
      if (frame.counterAxisAlignItems !== "MIN") {
        frame.counterAxisAlignItems = "MIN";
      }
      if (frame.primaryAxisAlignItems !== "MIN") {
        frame.primaryAxisAlignItems = "MIN";
      }
      frame.resize(w, h);
      frame.primaryAxisSizingMode = "FIXED";
      frame.counterAxisSizingMode = "FIXED";
      frame.clipsContent = false;
      frame.minWidth = w;
      frame.maxWidth = w;
      frame.minHeight = h;
      frame.maxHeight = h;
      const headerRow = frame.children.find(isHeaderFrame);
      if (headerRow) {
        const title = headerRow.children.find(
          (c) => c.name === "TitleText" || c.getPluginData("node_role") === "title"
        );
        if (title) {
          title.textAlignHorizontal = "LEFT";
          title.textTruncation = "ENDING";
          title.maxLines = 1;
        }
      }
      const statusBadge = frame.children.find(
        (c) => c.getPluginData("is_status_badge") === "true" || c.name === "StatusBadge"
      );
      const hasStatus = Boolean(statusBadge);
      frame.paddingBottom = hasStatus ? 36 : 16;
      const desc = frame.children.find(
        (c) => c.name === "DescText" || c.getPluginData("node_role") === "desc"
      );
      if (desc) {
        desc.textAlignHorizontal = "LEFT";
        desc.layoutAlign = "STRETCH";
        const pl = typeof frame.paddingLeft === "number" ? frame.paddingLeft : 16;
        const pr = typeof frame.paddingRight === "number" ? frame.paddingRight : 16;
        const availW = Math.max(50, w - pl - pr);
        if (Math.abs(desc.width - availW) > 1) {
          desc.resize(availW, desc.height);
        }
        desc.textAutoResize = "HEIGHT";
        await updateDescTextTruncation(frame, desc, h);
      }
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
        payload.strokeWeight,
        payload.routingType,
        payload.startTerminal,
        payload.endTerminal,
        payload.strokePattern
      );
      figma.currentPage.selection = [connector];
      handleSelectionChange();
      notify(`\uC5F0\uACB0 \uC644\uB8CC${payload.label ? ` (\uB77C\uBCA8: "${payload.label}")` : ""}`, "success");
    } catch (err) {
      notify(`\uC5F0\uACB0\uC120 \uC0DD\uC131 \uC2E4\uD328: ${String(err)}`, "error");
    }
  }
  async function createSingleConnector(sourceNode, sourceMagnet, targetNode, targetMagnet, label, colorHex, strokeWeight, routingType, startTerminal, endTerminal, strokePattern) {
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
        targetNodeId: targetNode.id,
        routingType,
        startTerminal,
        endTerminal,
        strokePattern
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
      let nodes = Array.from(nodesMap.values());
      if (nodes.length < 2) {
        notify("\uC11C\uB85C \uB2E4\uB978 \uB178\uB4DC\uB97C 2\uAC1C \uC774\uC0C1 \uC120\uD0DD\uD574 \uC8FC\uC138\uC694.", "warning");
        return;
      }
      nodes = sortNodesBySpatialPosition(nodes);
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
      const effectiveStartTerm = payload.isReversed ? payload.endTerminal : payload.startTerminal;
      const effectiveEndTerm = payload.isReversed ? payload.startTerminal : payload.endTerminal;
      const effectiveStartMagnet = payload.isReversed ? payload.targetMagnet : payload.sourceMagnet;
      const effectiveEndMagnet = payload.isReversed ? payload.sourceMagnet : payload.targetMagnet;
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
            case "TRIANGLE_ARROW":
              return "ARROW_LINES";
            case "BAR":
              return "ERD_EXACTLY_ONE";
            case "DIAMOND":
              return "DIAMOND_FILLED";
            case "CIRCLE":
              return "CIRCLE_FILLED";
            case "SQUARE":
              return "TRIANGLE_FILLED";
            default:
              return "NONE";
          }
        };
        if (effectiveStartTerm && effectiveStartTerm !== "MIXED") {
          conn.connectorStartStrokeCap = mapCap(effectiveStartTerm);
          conn.setPluginData("start_terminal", effectiveStartTerm);
        }
        if (effectiveEndTerm && effectiveEndTerm !== "MIXED") {
          conn.connectorEndStrokeCap = mapCap(effectiveEndTerm);
          conn.setPluginData("end_terminal", effectiveEndTerm);
        }
        if (payload.hasLabel && payload.label !== void 0) {
          if (conn.text) {
            await safeSetCharacters(conn.text, payload.label.trim());
          }
        } else if (payload.hasLabel === false && conn.text) {
          await safeSetCharacters(conn.text, "");
        }
        const startEndpointNodeId = payload.isReversed ? conn.connectorEnd && "endpointNodeId" in conn.connectorEnd ? conn.connectorEnd.endpointNodeId : void 0 : conn.connectorStart && "endpointNodeId" in conn.connectorStart ? conn.connectorStart.endpointNodeId : void 0;
        const endEndpointNodeId = payload.isReversed ? conn.connectorStart && "endpointNodeId" in conn.connectorStart ? conn.connectorStart.endpointNodeId : void 0 : conn.connectorEnd && "endpointNodeId" in conn.connectorEnd ? conn.connectorEnd.endpointNodeId : void 0;
        if (effectiveStartMagnet && startEndpointNodeId) {
          conn.connectorStart = {
            endpointNodeId: startEndpointNodeId,
            magnet: effectiveStartMagnet
          };
        }
        if (effectiveEndMagnet && endEndpointNodeId) {
          conn.connectorEnd = {
            endpointNodeId: endEndpointNodeId,
            magnet: effectiveEndMagnet
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
          if (payload.strokePattern) {
            if (payload.strokePattern === "DASHED") {
              vectorNode.dashPattern = [4, 4];
            } else if (payload.strokePattern === "DOTTED") {
              vectorNode.dashPattern = [1.5, 3];
            } else {
              vectorNode.dashPattern = [];
            }
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
        if (payload.colorHex) {
          node.setPluginData("connector_color", payload.colorHex);
          if (vectorNode) vectorNode.setPluginData("connector_color", payload.colorHex);
        }
        if (payload.strokeWeight) {
          node.setPluginData("connector_weight", String(payload.strokeWeight));
          if (vectorNode) vectorNode.setPluginData("connector_weight", String(payload.strokeWeight));
        }
        if (payload.strokePattern) {
          node.setPluginData("connector_pattern", payload.strokePattern);
          if (vectorNode) vectorNode.setPluginData("connector_pattern", payload.strokePattern);
        }
        if (payload.routingType) {
          node.setPluginData("connector_routing", payload.routingType);
          if (vectorNode) vectorNode.setPluginData("connector_routing", payload.routingType);
        }
        if (effectiveStartTerm && effectiveStartTerm !== "MIXED") {
          node.setPluginData("start_terminal", effectiveStartTerm);
          if (vectorNode) vectorNode.setPluginData("start_terminal", effectiveStartTerm);
        }
        if (effectiveEndTerm && effectiveEndTerm !== "MIXED") {
          node.setPluginData("end_terminal", effectiveEndTerm);
          if (vectorNode) vectorNode.setPluginData("end_terminal", effectiveEndTerm);
        }
        if (effectiveStartMagnet) node.setPluginData("source_magnet", effectiveStartMagnet);
        if (effectiveEndMagnet) node.setPluginData("target_magnet", effectiveEndMagnet);
        await updateOrthogonalVectorConnector(node, effectiveStartMagnet, effectiveEndMagnet);
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
  async function applyPhaseToSelected(phaseId, phaseName, phaseColor) {
    const selection = figma.currentPage.selection;
    if (selection.length === 0) {
      return;
    }
    const isRemove = !phaseId || phaseId === "none";
    for (const rawNode of selection) {
      let flowNode = findFlowNode(rawNode) || rawNode;
      if (flowNode.type === "SHAPE_WITH_TEXT") {
        flowNode = await convertShapeToFrameNode(flowNode);
      }
      if (flowNode.type === "FRAME") {
        const card = flowNode;
        if (isRemove) {
          card.setPluginData("phase_id", "");
          card.setPluginData("phase_name", "");
          card.setPluginData("phase_color", "");
        } else {
          card.setPluginData("phase_id", phaseId);
          card.setPluginData("phase_name", phaseName || "Phase");
          card.setPluginData("phase_color", phaseColor || "#EA2039");
        }
      }
    }
    handleSelectionChange();
  }
  async function applyStatusToSelected(status) {
    const selection = figma.currentPage.selection;
    if (selection.length === 0) {
      notify("\uC0C1\uD0DC\uB97C \uC9C0\uC815\uD560 \uC694\uC18C\uB97C 1\uAC1C \uC774\uC0C1 \uC120\uD0DD\uD574 \uC8FC\uC138\uC694.", "warning");
      return;
    }
    await loadRequiredFonts();
    const isRemove = !status || !STATUS_CONFIG[status];
    const cfg = !isRemove ? STATUS_CONFIG[status] : null;
    for (const rawNode of selection) {
      let flowNode = findFlowNode(rawNode) || rawNode;
      if (flowNode.type === "SHAPE_WITH_TEXT") {
        flowNode = await convertShapeToFrameNode(flowNode);
      }
      if (flowNode.type === "FRAME") {
        const card = flowNode;
        card.clipsContent = false;
        const headerRow = card.children.find(isHeaderFrame);
        let oldBadgeInHeader;
        if (headerRow) {
          oldBadgeInHeader = headerRow.children.find(
            (c) => c.getPluginData("is_status_badge") === "true" || c.name === "StatusBadge"
          );
        }
        let statusBadge = card.children.find(
          (c) => c.getPluginData("is_status_badge") === "true" || c.name === "StatusBadge"
        );
        if (isRemove) {
          card.setPluginData("workflow_status", "");
          card.paddingBottom = 16;
          if (oldBadgeInHeader) oldBadgeInHeader.remove();
          if (statusBadge) statusBadge.remove();
          const descText = card.children.find(
            (c) => c.name === "DescText" || c.getPluginData("node_role") === "desc"
          );
          if (descText) {
            await updateDescTextTruncation(card, descText, card.height);
          }
          continue;
        }
        card.setPluginData("workflow_status", status);
        card.paddingBottom = 36;
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
          statusBadge.paddingLeft = 9;
          statusBadge.paddingRight = 9;
          statusBadge.paddingTop = 3;
          statusBadge.paddingBottom = 3;
          statusBadge.cornerRadius = getStatusBadgeCornerRadius(
            typeof card.cornerRadius === "number" ? card.cornerRadius : 0
          );
          statusBadge.setPluginData("is_status_badge", "true");
          const badgeText = figma.createText();
          badgeText.name = "StatusText";
          badgeText.fontName = { family: "Inter", style: "Bold" };
          badgeText.fontSize = 9;
          badgeText.textAutoResize = "WIDTH_AND_HEIGHT";
          statusBadge.appendChild(badgeText);
          card.appendChild(statusBadge);
        }
        if (cfg) {
          let nodeBgColor = { r: 1, g: 1, b: 1 };
          const cardFills = card.fills;
          if (Array.isArray(cardFills) && cardFills.length > 0 && cardFills[0].type === "SOLID") {
            nodeBgColor = cardFills[0].color;
          }
          const isDarkTheme = card.getPluginData("node_theme") === "dark";
          const { badgeBg, badgeTextColor } = getStatusBadgeColors(status, nodeBgColor, isDarkTheme);
          statusBadge.paddingLeft = 9;
          statusBadge.paddingRight = 9;
          statusBadge.cornerRadius = getStatusBadgeCornerRadius(
            typeof card.cornerRadius === "number" ? card.cornerRadius : 0
          );
          statusBadge.fills = [{ type: "SOLID", color: badgeBg }];
          const textNode = statusBadge.children.find((c) => c.type === "TEXT");
          if (textNode) {
            textNode.locked = false;
            await safeSetCharacters(textNode, cfg.label.toUpperCase());
            textNode.fills = [{ type: "SOLID", color: badgeTextColor }];
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
          const descText = card.children.find(
            (c) => c.name === "DescText" || c.getPluginData("node_role") === "desc"
          );
          if (descText) {
            await updateDescTextTruncation(card, descText, card.height);
          }
        }
      }
    }
    syncStatusList();
    handleSelectionChange();
    if (isRemove) {
      notify(`${selection.length}\uAC1C \uB178\uB4DC\uC758 \uC0C1\uD0DC \uBC43\uC9C0\uAC00 \uC81C\uAC70\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`, "info");
    } else if (cfg) {
      notify(`${selection.length}\uAC1C \uB178\uB4DC\uC5D0 [${cfg.label}] \uC0C1\uD0DC \uBC43\uC9C0\uAC00 \uBD80\uCC29\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`, "success");
    }
  }
  async function applyElevationToSelected(level) {
    const selection = figma.currentPage.selection;
    if (selection.length === 0) {
      notify("\uC5D8\uB9AC\uBCA0\uC774\uC158\uC744 \uC801\uC6A9\uD560 \uC694\uC18C\uB97C \uC120\uD0DD\uD574 \uC8FC\uC138\uC694.", "warning");
      return;
    }
    for (const rawNode of selection) {
      let flowNode = findFlowNode(rawNode) || rawNode;
      if (flowNode.type === "SHAPE_WITH_TEXT") {
        flowNode = await convertShapeToFrameNode(flowNode);
      }
      if (flowNode.type === "FRAME") {
        const card = flowNode;
        if (level === null || level === void 0) {
          card.setPluginData("node_elevation", "");
          card.effects = [];
        } else {
          const nodeTheme = card.getPluginData("node_theme");
          let isDark = nodeTheme === "dark";
          if ("fills" in card && Array.isArray(card.fills) && card.fills.length > 0) {
            const firstFill = card.fills[0];
            if (firstFill.type === "SOLID") {
              const lum = 0.299 * firstFill.color.r + 0.587 * firstFill.color.g + 0.114 * firstFill.color.b;
              if (lum < 0.5) isDark = true;
            }
          }
          card.setPluginData("node_elevation", `${level}`);
          card.effects = getElevationEffects(level, isDark);
          card.clipsContent = false;
        }
      }
    }
    handleSelectionChange();
    if (level === null || level === void 0) {
      notify(`${selection.length}\uAC1C \uB178\uB4DC\uC758 \uC5D8\uB9AC\uBCA0\uC774\uC158\uC774 \uC81C\uAC70\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`, "info");
    } else {
      notify(`${selection.length}\uAC1C \uB178\uB4DC\uC5D0 Level ${level} \uC5D8\uB9AC\uBCA0\uC774\uC158\uC774 \uC801\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`, "success");
    }
  }
  function isColorHighSaturation(rgb) {
    const max = Math.max(rgb.r, rgb.g, rgb.b);
    const min = Math.min(rgb.r, rgb.g, rgb.b);
    const delta = max - min;
    if (delta < 0.15) return false;
    const l = (max + min) / 2;
    const s = l > 0 && l < 1 ? delta / (1 - Math.abs(2 * l - 1)) : 0;
    return s >= 0.25;
  }
  function applyStepBadgeColors(stepBadge, numText, colorMode = "Style", card) {
    let nodeBgColor = { r: 1, g: 1, b: 1 };
    const cardFills = card.fills;
    if (Array.isArray(cardFills) && cardFills.length > 0 && cardFills[0].type === "SOLID") {
      nodeBgColor = cardFills[0].color;
    }
    let nodeStrokeColor = null;
    const cardStrokes = card.strokes;
    if (Array.isArray(cardStrokes) && cardStrokes.length > 0 && cardStrokes[0].type === "SOLID") {
      nodeStrokeColor = cardStrokes[0].color;
    }
    const hasWeight = typeof card.strokeWeight === "number" ? card.strokeWeight > 0 : true;
    const hasNodeStroke = hasWeight && nodeStrokeColor !== null;
    const lum = 0.299 * nodeBgColor.r + 0.587 * nodeBgColor.g + 0.114 * nodeBgColor.b;
    const isDarkBg = lum < 0.6;
    if (colorMode === "White") {
      stepBadge.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
      let borderCol = isDarkBg ? { r: 0.1, g: 0.1, b: 0.14 } : { r: 0.82, g: 0.84, b: 0.86 };
      if (hasNodeStroke && nodeStrokeColor) {
        borderCol = nodeStrokeColor;
      } else if (isColorHighSaturation(nodeBgColor)) {
        borderCol = nodeBgColor;
      } else if (isDarkBg) {
        borderCol = nodeBgColor.r === 0 && nodeBgColor.g === 0 && nodeBgColor.b === 0 ? { r: 0, g: 0, b: 0 } : { r: 0.1, g: 0.1, b: 0.14 };
      }
      stepBadge.strokes = [{ type: "SOLID", color: borderCol }];
      stepBadge.strokeWeight = 1.5;
      numText.fills = [{ type: "SOLID", color: { r: 0.1, g: 0.1, b: 0.14 } }];
    } else if (colorMode === "Style") {
      stepBadge.fills = [{ type: "SOLID", color: nodeBgColor }];
      let borderCol = isDarkBg ? { r: 1, g: 1, b: 1 } : { r: 0.82, g: 0.84, b: 0.86 };
      if (hasNodeStroke && nodeStrokeColor) {
        const isStrokeBlack = nodeStrokeColor.r < 0.15 && nodeStrokeColor.g < 0.15 && nodeStrokeColor.b < 0.15;
        if (isDarkBg && isStrokeBlack) {
          borderCol = { r: 1, g: 1, b: 1 };
        } else {
          borderCol = nodeStrokeColor;
        }
      }
      stepBadge.strokes = [{ type: "SOLID", color: borderCol }];
      stepBadge.strokeWeight = 1.5;
      numText.fills = [{ type: "SOLID", color: isDarkBg ? { r: 1, g: 1, b: 1 } : { r: 0.1, g: 0.1, b: 0.14 } }];
    } else {
      stepBadge.fills = [{ type: "SOLID", color: { r: 0.1, g: 0.1, b: 0.14 } }];
      stepBadge.strokes = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
      stepBadge.strokeWeight = 1.5;
      numText.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
    }
  }
  async function applyStepBadgeToSingleCard(card, currentNum, corner = "TOP_LEFT", shape = "Square", colorMode = "Style") {
    await loadRequiredFonts();
    card.clipsContent = false;
    card.setPluginData("step_number", `${currentNum}`);
    card.setPluginData("badge_corner", corner);
    card.setPluginData("badge_shape", shape);
    card.setPluginData("badge_color_mode", colorMode);
    let stepBadge = card.children.find(
      (c) => c.getPluginData("is_step_badge") === "true" || c.name.startsWith("[Step]")
    );
    let numText;
    if (!stepBadge) {
      stepBadge = figma.createFrame();
      card.appendChild(stepBadge);
      stepBadge.setPluginData("is_step_badge", "true");
      numText = figma.createText();
      numText.name = "NumText";
      numText.fontName = { family: "Inter", style: "Bold" };
      numText.fontSize = 11;
      numText.textAutoResize = "WIDTH_AND_HEIGHT";
      stepBadge.appendChild(numText);
    } else {
      card.appendChild(stepBadge);
      let foundText = stepBadge.children.find((c) => c.type === "TEXT");
      if (!foundText) {
        foundText = figma.createText();
        foundText.name = "NumText";
        foundText.fontName = { family: "Inter", style: "Bold" };
        foundText.fontSize = 11;
        foundText.textAutoResize = "WIDTH_AND_HEIGHT";
        stepBadge.appendChild(foundText);
      }
      numText = foundText;
    }
    applyStepBadgeColors(stepBadge, numText, colorMode, card);
    if (card.layoutMode !== "NONE") {
      stepBadge.layoutPositioning = "ABSOLUTE";
    }
    stepBadge.layoutMode = "HORIZONTAL";
    stepBadge.primaryAxisAlignItems = "CENTER";
    stepBadge.counterAxisAlignItems = "CENTER";
    stepBadge.paddingLeft = 4;
    stepBadge.paddingRight = 4;
    stepBadge.paddingTop = 0;
    stepBadge.paddingBottom = 0;
    try {
      stepBadge.minWidth = 24;
      stepBadge.minHeight = 24;
      stepBadge.maxHeight = 24;
    } catch (e) {
    }
    stepBadge.counterAxisSizingMode = "FIXED";
    stepBadge.primaryAxisSizingMode = "AUTO";
    stepBadge.resize(Math.max(24, stepBadge.width || 24), 24);
    if (shape === "Circle") {
      stepBadge.cornerRadius = 999;
    } else if (shape === "RoundBox") {
      stepBadge.cornerRadius = 5;
    } else {
      stepBadge.cornerRadius = 0;
    }
    stepBadge.name = `[Step] ${currentNum}`;
    stepBadge.visible = true;
    if (numText) {
      await safeSetCharacters(numText, `${currentNum}`);
    }
    const bw = Math.max(24, Math.round(stepBadge.width));
    const bh = 24;
    if (corner === "TOP_RIGHT") {
      stepBadge.x = card.width - bw + 9;
      stepBadge.y = -9;
      stepBadge.constraints = { horizontal: "MAX", vertical: "MIN" };
    } else if (corner === "BOTTOM_LEFT") {
      stepBadge.x = -9;
      stepBadge.y = card.height - bh + 9;
      stepBadge.constraints = { horizontal: "MIN", vertical: "MAX" };
    } else if (corner === "BOTTOM_RIGHT") {
      stepBadge.x = card.width - bw + 9;
      stepBadge.y = card.height - bh + 9;
      stepBadge.constraints = { horizontal: "MAX", vertical: "MAX" };
    } else {
      stepBadge.x = -9;
      stepBadge.y = -9;
      stepBadge.constraints = { horizontal: "MIN", vertical: "MIN" };
    }
  }
  async function addStepBadges(startNumber = 1, corner = "TOP_LEFT", shape = "Square", colorMode = "Style") {
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
    let currentNum = startNumber;
    for (const card of selection) {
      await applyStepBadgeToSingleCard(card, currentNum, corner, shape, colorMode);
      currentNum++;
    }
    handleSelectionChange();
    notify(`${selection.length}\uAC1C \uB178\uB4DC\uC5D0 \uC2A4\uD15D \uBC88\uD638\uAC00 \uC801\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`, "success");
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
        card.setPluginData("badge_corner", "");
        card.setPluginData("badge_shape", "");
        const stepBadges = card.children.filter(
          (c) => c.getPluginData("is_step_badge") === "true" || c.name.startsWith("[Step]")
        );
        for (const badge of stepBadges) {
          badge.remove();
          removedCount++;
        }
      }
    }
    handleSelectionChange();
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
  function getDesignFrames() {
    const items = [];
    const seenIds = /* @__PURE__ */ new Set();
    for (const node of figma.currentPage.selection) {
      if ((node.type === "FRAME" || node.type === "COMPONENT" || node.type === "INSTANCE") && !node.getPluginData("is_flow_node") && !node.getPluginData("flow_node_type") && !node.name.startsWith("[Flow]")) {
        const cr = "cornerRadius" in node && typeof node.cornerRadius === "number" ? node.cornerRadius : 0;
        items.push({
          id: node.id,
          name: node.name,
          width: Math.round(node.width),
          height: Math.round(node.height),
          cornerRadius: Math.round(cr)
        });
        seenIds.add(node.id);
      }
    }
    for (const node of figma.currentPage.children) {
      if (seenIds.has(node.id)) continue;
      if ((node.type === "FRAME" || node.type === "COMPONENT" || node.type === "INSTANCE") && !node.getPluginData("is_flow_node") && !node.getPluginData("flow_node_type") && !node.name.startsWith("[Flow]")) {
        const cr = "cornerRadius" in node && typeof node.cornerRadius === "number" ? node.cornerRadius : 0;
        items.push({
          id: node.id,
          name: node.name,
          width: Math.round(node.width),
          height: Math.round(node.height),
          cornerRadius: Math.round(cr)
        });
        seenIds.add(node.id);
      }
    }
    return items;
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
      case "SET_PHASE":
        await applyPhaseToSelected(msg.phaseId, msg.phaseName, msg.phaseColor);
        break;
      case "SET_STATUS":
        await applyStatusToSelected(msg.status);
        break;
      case "SET_ELEVATION":
        await applyElevationToSelected(msg.level);
        break;
      case "ADD_STEP_BADGES":
        await addStepBadges(msg.startNumber || 1, msg.corner || "TOP_LEFT", msg.shape || "Square", msg.colorMode || "Style");
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
      case "GET_DESIGN_FRAMES": {
        const frames = getDesignFrames();
        postToUI({
          type: "DESIGN_FRAMES_LOADED",
          frames
        });
        break;
      }
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
      if (change.type === "CREATE") {
        const createdNode = figma.getNodeById(change.id);
        if (createdNode && (createdNode.type === "CONNECTOR" || createdNode.getPluginData("is_custom_connector") === "true")) {
          registerConnectorInRegistry(createdNode);
        }
      }
      if (change.type === "PROPERTY_CHANGE") {
        if (change.properties.includes("x") || change.properties.includes("y") || change.properties.includes("width") || change.properties.includes("height")) {
          movedNodeIds.add(change.id);
          const changedNode = figma.getNodeById(change.id);
          if (changedNode) {
            const flowNode = findFlowNode(changedNode);
            if (flowNode) {
              movedNodeIds.add(flowNode.id);
            }
            let p = changedNode.parent;
            while (p && p.type !== "PAGE") {
              movedNodeIds.add(p.id);
              p = p.parent;
            }
          }
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
                await lockTextFontSizeAndAutoResize(textNode, 11);
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
      handleSelectionChange();
    } else if (connectorSelectionChanged) {
      handleSelectionChange();
    }
  });
  refreshConnectorRegistry();
  handleSelectionChange();
  syncStatusList();
  loadSavedSettings();
})();
