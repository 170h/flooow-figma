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
  function normalizeNodeType(type) {
    if (!type) return "Screen";
    const clean = String(type).trim().toLowerCase();
    switch (clean) {
      case "screen":
        return "Screen";
      case "process":
      case "square":
      case "rectangle":
      case "action":
      case "error":
      case "true":
      case "false":
        return "Process";
      case "junction":
      case "connector":
      case "system":
      case "database":
        return "Junction";
      case "decision":
      case "diamond":
        return "Decision";
      case "terminator":
      case "pill":
      case "capsule":
        return "Terminator";
      case "branch":
      case "subflow":
        return "Branch";
      case "bridge":
        return "Branch";
      default:
        return type || "Screen";
    }
  }
  var NODE_TYPE_SHAPE_SPECS = {
    Screen: { width: 250, height: 90, cornerRadius: 0, allowDescription: true, allowFigmaLink: true },
    Process: { width: 120, height: 120, cornerRadius: 0, allowDescription: false, allowFigmaLink: false },
    Junction: { width: 120, height: 120, cornerRadius: 60, allowDescription: false, allowFigmaLink: false },
    Decision: { width: 140, height: 140, cornerRadius: 0, allowDescription: false, allowFigmaLink: false },
    Terminator: { width: 180, height: 90, cornerRadius: 45, allowDescription: false, allowFigmaLink: false },
    Branch: { width: 180, height: 90, cornerRadius: 0, allowDescription: false, allowFigmaLink: false },
    // 레거시 별칭 호환
    Connector: { width: 120, height: 120, cornerRadius: 60, allowDescription: false, allowFigmaLink: false },
    Square: { width: 120, height: 120, cornerRadius: 0, allowDescription: false, allowFigmaLink: false },
    Rectangle: { width: 120, height: 120, cornerRadius: 0, allowDescription: false, allowFigmaLink: false },
    Diamond: { width: 140, height: 140, cornerRadius: 0, allowDescription: false, allowFigmaLink: false },
    Pill: { width: 180, height: 90, cornerRadius: 45, allowDescription: false, allowFigmaLink: false },
    Action: { width: 120, height: 120, cornerRadius: 0, allowDescription: false, allowFigmaLink: false },
    System: { width: 120, height: 120, cornerRadius: 60, allowDescription: false, allowFigmaLink: false },
    Database: { width: 120, height: 120, cornerRadius: 60, allowDescription: false, allowFigmaLink: false },
    Capsule: { width: 180, height: 90, cornerRadius: 45, allowDescription: false, allowFigmaLink: false },
    Bridge: { width: 120, height: 120, cornerRadius: 60, allowDescription: false, allowFigmaLink: false }
  };
  var BRANCH_VARIANT_LABELS = {
    CHECK: "Check",
    CROSS: "Cross",
    YES: "Yes",
    NO: "No",
    TRUE: "True",
    FALSE: "False",
    SQUARE: "Square",
    DIAMOND: "Diamond",
    CIRCLE: "Circle"
  };
  function normalizeBranchVariant(value) {
    const key = String(value || "").trim().toUpperCase();
    if (key === "CHECK" || key === "CROSS" || key === "YES" || key === "NO" || key === "TRUE" || key === "FALSE" || key === "SQUARE" || key === "DIAMOND" || key === "CIRCLE") {
      return key;
    }
    const byLabel = String(value || "").trim();
    const found = Object.keys(BRANCH_VARIANT_LABELS).find(
      (k) => BRANCH_VARIANT_LABELS[k] === byLabel
    );
    return found || "CIRCLE";
  }
  function getBranchVariantSpec(variant) {
    switch (variant) {
      case "DIAMOND":
        return { width: 40, height: 40, cornerRadius: 0, allowDescription: false, allowFigmaLink: false };
      case "YES":
        return { width: 58, height: 32, cornerRadius: 16, allowDescription: false, allowFigmaLink: false };
      case "NO":
        return { width: 53, height: 32, cornerRadius: 16, allowDescription: false, allowFigmaLink: false };
      case "TRUE":
        return { width: 64, height: 32, cornerRadius: 16, allowDescription: false, allowFigmaLink: false };
      case "FALSE":
        return { width: 68, height: 32, cornerRadius: 16, allowDescription: false, allowFigmaLink: false };
      case "CHECK":
      case "CROSS":
      case "SQUARE":
      case "CIRCLE":
      default:
        return { width: 32, height: 32, cornerRadius: 16, allowDescription: false, allowFigmaLink: false };
    }
  }
  function branchVariantHasTitle(variant) {
    return variant === "YES" || variant === "NO" || variant === "TRUE" || variant === "FALSE";
  }
  function getBranchVariantDefaultFill(variant) {
    if (variant === "CHECK") return "#14AE5C";
    if (variant === "CROSS") return "#F24822";
    return "#FFFFFF";
  }
  function branchVariantUsesStroke(variant) {
    return variant !== "CHECK" && variant !== "CROSS";
  }
  var OPTION_CAPABILITY_MATRIX = {
    Screen: {
      title: true,
      description: true,
      status: true,
      stepBadge: true,
      elevation: true,
      size: true,
      figmaLink: true,
      style: true
    },
    Shape: {
      title: true,
      description: false,
      status: false,
      stepBadge: true,
      elevation: true,
      size: false,
      figmaLink: false,
      style: true
    },
    Bridge: {
      title: true,
      description: false,
      status: false,
      stepBadge: false,
      elevation: false,
      size: false,
      figmaLink: false,
      style: true
    },
    FigmaObject: {
      title: false,
      description: false,
      status: false,
      stepBadge: false,
      elevation: false,
      size: false,
      figmaLink: false,
      style: false
    }
  };
  function getNodeCategory(node) {
    if (!node) return "FigmaObject";
    if (node.isConnector || node.type === "CONNECTOR") {
      return "FigmaObject";
    }
    const hasPluginDataFn = typeof node.getPluginData === "function";
    const isFlowNode = Boolean(
      node.isFlowNode || hasPluginDataFn && node.getPluginData("is_flow_node") === "true" || node.type === "FRAME" && hasPluginDataFn && Boolean(
        node.getPluginData("node_type") || node.children?.some?.((c) => c.name === "Header" || c.name === "TitleText" || typeof c.getPluginData === "function" && c.getPluginData("node_role") === "title")
      )
    );
    if (!isFlowNode && node.type !== "SHAPE_WITH_TEXT") {
      if (!node.flowNodeType) {
        return "FigmaObject";
      }
    }
    let rawType = node.flowNodeType;
    if (!rawType && hasPluginDataFn) {
      rawType = node.getPluginData("node_type");
    }
    if (!rawType && node.nodeType && node.nodeType !== "FRAME") {
      rawType = node.nodeType;
    }
    const normType = normalizeNodeType(rawType);
    switch (normType) {
      case "Screen":
        return "Screen";
      case "Process":
      case "Junction":
      case "Connector":
      case "Decision":
      case "Terminator":
        return "Shape";
      case "Branch":
      case "Bridge":
        return "Bridge";
      default:
        return "Shape";
    }
  }
  function supportsOption(node, option) {
    const category = getNodeCategory(node);
    return OPTION_CAPABILITY_MATRIX[category]?.[option] ?? false;
  }
  var SCREEN_NODE_CONSTRAINTS = {
    MIN_WIDTH: 49,
    MAX_WIDTH: 800,
    MIN_HEIGHT: 49,
    MAX_HEIGHT: 600,
    MIN_CORNER_RADIUS: 0,
    MAX_CORNER_RADIUS: 20,
    MIN_STROKE_WEIGHT: 0,
    MAX_STROKE_WEIGHT: 10
  };
  var {
    MIN_WIDTH: SCREEN_MIN_WIDTH,
    MAX_WIDTH: SCREEN_MAX_WIDTH,
    MIN_HEIGHT: SCREEN_MIN_HEIGHT,
    MAX_HEIGHT: SCREEN_MAX_HEIGHT,
    MIN_CORNER_RADIUS: SCREEN_MIN_CORNER_RADIUS,
    MAX_CORNER_RADIUS: SCREEN_MAX_CORNER_RADIUS,
    MIN_STROKE_WEIGHT: SCREEN_MIN_STROKE_WEIGHT,
    MAX_STROKE_WEIGHT: SCREEN_MAX_STROKE_WEIGHT
  } = SCREEN_NODE_CONSTRAINTS;
  function clampScreenWidth(w) {
    return Math.min(SCREEN_NODE_CONSTRAINTS.MAX_WIDTH, Math.max(SCREEN_NODE_CONSTRAINTS.MIN_WIDTH, w));
  }
  function clampScreenHeight(h) {
    return Math.min(SCREEN_NODE_CONSTRAINTS.MAX_HEIGHT, Math.max(SCREEN_NODE_CONSTRAINTS.MIN_HEIGHT, h));
  }
  function clampScreenCornerRadius(r) {
    return Math.min(SCREEN_NODE_CONSTRAINTS.MAX_CORNER_RADIUS, Math.max(SCREEN_NODE_CONSTRAINTS.MIN_CORNER_RADIUS, r));
  }
  function clampStrokeWeight(sw) {
    return Math.min(SCREEN_NODE_CONSTRAINTS.MAX_STROKE_WEIGHT, Math.max(SCREEN_NODE_CONSTRAINTS.MIN_STROKE_WEIGHT, sw));
  }

  // src/customConnector.ts
  function parseHexColor(hex) {
    if (!hex) return { r: 0.9, g: 0.1, b: 0.2 };
    const clean = hex.replace("#", "").trim();
    if (clean.length < 6) return { r: 0.9, g: 0.1, b: 0.2 };
    const r = parseInt(clean.substring(0, 2), 16) / 255;
    const g = parseInt(clean.substring(2, 4), 16) / 255;
    const b = parseInt(clean.substring(4, 6), 16) / 255;
    return {
      r: isNaN(r) ? 0 : r,
      g: isNaN(g) ? 0 : g,
      b: isNaN(b) ? 0 : b
    };
  }
  function getContrastTextColor(hex) {
    const rgb = parseHexColor(hex);
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1e3;
    return brightness > 0.55 ? { r: 0.1, g: 0.1, b: 0.1 } : { r: 1, g: 1, b: 1 };
  }
  var LABEL_FONT_SIZE = 9;
  var LABEL_LINE_HEIGHT_PERCENT = 140;
  var LABEL_LINE_HEIGHT = LABEL_FONT_SIZE * LABEL_LINE_HEIGHT_PERCENT / 100;
  var LABEL_STROKE_WEIGHT = 1.5;
  var LABEL_PADDING_X = 12;
  var LABEL_PADDING_Y = 7.5;
  var LABEL_RADIUS_ROUNDED = 8;
  var LABEL_RADIUS_CAPSULE = 999;
  var LABEL_MULTILINE_TEXT_WIDTH = 82;
  var LABEL_IS_VERTICAL_KEY = "connector_label_is_vertical";
  function readPrevLabelVertical(labelFrame) {
    const v = safeGetPluginData(labelFrame, LABEL_IS_VERTICAL_KEY);
    return v === "1" ? true : v === "0" ? false : void 0;
  }
  function getLabelSizeHint(labelFrame, labelText) {
    if (labelFrame && readPrevLabelVertical(labelFrame) !== void 0 && labelFrame.width > 0 && labelFrame.height > 0) {
      return { width: labelFrame.width, height: labelFrame.height };
    }
    const charCount = (labelText || "").length;
    const textWidth = Math.min(LABEL_MULTILINE_TEXT_WIDTH, Math.max(1, charCount) * LABEL_FONT_SIZE * 0.6);
    return {
      // 실측: 상하 패딩 8 → 높이 32px (라인하이트 12.6 + 패딩 16 + 보더 1.5×2 ≈ 31.6) 이므로 보더 두께도 크기에 포함
      width: textWidth + LABEL_PADDING_X * 2 + LABEL_STROKE_WEIGHT * 2,
      height: LABEL_LINE_HEIGHT + LABEL_PADDING_Y * 2 + LABEL_STROKE_WEIGHT * 2
    };
  }
  function isNoneColorValue(color) {
    const c = (color || "").trim().toLowerCase();
    return c === "none" || c === "transparent";
  }
  function rgbToHex(rgb) {
    const toHex = (c) => Math.round(Math.max(0, Math.min(1, c)) * 255).toString(16).padStart(2, "0");
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase();
  }
  async function applyConnectorLabelStyle(labelFrame, textNode, options) {
    const {
      labelText,
      boxStyle = "BOX",
      textAlign = "CENTER",
      fillColor = "#FFFFFF",
      strokeColor = "#000000",
      isVertical = false,
      connectorStrokeWeight
    } = options;
    const labelStrokeWeight = typeof connectorStrokeWeight === "number" && connectorStrokeWeight > 0 ? connectorStrokeWeight : LABEL_STROKE_WEIGHT;
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    textNode.fontName = { family: "Inter", style: "Regular" };
    textNode.characters = labelText;
    textNode.fontSize = LABEL_FONT_SIZE;
    textNode.lineHeight = { value: LABEL_LINE_HEIGHT_PERCENT, unit: "PERCENT" };
    textNode.textAlignHorizontal = textAlign;
    textNode.textAutoResize = "WIDTH_AND_HEIGHT";
    if (textNode.width > LABEL_MULTILINE_TEXT_WIDTH) {
      textNode.textAutoResize = "HEIGHT";
      textNode.resize(LABEL_MULTILINE_TEXT_WIDTH, textNode.height);
    }
    const isFillNone = isNoneColorValue(fillColor);
    const isStrokeNone = isNoneColorValue(strokeColor);
    const textFill = isFillNone ? { r: 0.1, g: 0.1, b: 0.1 } : getContrastTextColor(fillColor);
    textNode.fills = [{ type: "SOLID", color: textFill }];
    labelFrame.layoutMode = "HORIZONTAL";
    labelFrame.primaryAxisSizingMode = "AUTO";
    labelFrame.counterAxisSizingMode = "AUTO";
    labelFrame.counterAxisAlignItems = "CENTER";
    labelFrame.primaryAxisAlignItems = textAlign === "LEFT" ? "MIN" : textAlign === "RIGHT" ? "MAX" : "CENTER";
    labelFrame.paddingTop = LABEL_PADDING_Y;
    labelFrame.paddingBottom = LABEL_PADDING_Y;
    labelFrame.paddingLeft = LABEL_PADDING_X;
    labelFrame.paddingRight = LABEL_PADDING_X;
    labelFrame.fills = isFillNone ? [] : [{ type: "SOLID", color: parseHexColor(fillColor) }];
    labelFrame.setPluginData(LABEL_IS_VERTICAL_KEY, isVertical ? "1" : "0");
    labelFrame.strokes = isStrokeNone ? [] : [{ type: "SOLID", color: parseHexColor(strokeColor) }];
    switch (boxStyle) {
      case "BOX":
        labelFrame.cornerRadius = 0;
        labelFrame.strokeWeight = labelStrokeWeight;
        break;
      case "CAPSULE":
        labelFrame.cornerRadius = LABEL_RADIUS_CAPSULE;
        labelFrame.strokeWeight = labelStrokeWeight;
        break;
      case "ROUNDED_BOX":
        labelFrame.cornerRadius = LABEL_RADIUS_ROUNDED;
        labelFrame.strokeWeight = labelStrokeWeight;
        break;
      case "LINE":
        labelFrame.cornerRadius = 0;
        if (isVertical) {
          if ("strokeTopWeight" in labelFrame) {
            labelFrame.strokeTopWeight = labelStrokeWeight;
            labelFrame.strokeBottomWeight = labelStrokeWeight;
            labelFrame.strokeLeftWeight = 0;
            labelFrame.strokeRightWeight = 0;
          } else {
            labelFrame.strokeWeight = labelStrokeWeight;
          }
        } else {
          if ("strokeLeftWeight" in labelFrame) {
            labelFrame.strokeLeftWeight = labelStrokeWeight;
            labelFrame.strokeRightWeight = labelStrokeWeight;
            labelFrame.strokeTopWeight = 0;
            labelFrame.strokeBottomWeight = 0;
          } else {
            labelFrame.strokeWeight = labelStrokeWeight;
          }
        }
        break;
    }
  }
  function safeGetPluginData(node, key) {
    if (node && typeof node.getPluginData === "function") {
      try {
        return node.getPluginData(key) || "";
      } catch (_) {
        return "";
      }
    }
    return "";
  }
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
  function calculateRoutingPoints(srcPoint, sourceMagnet, tgtPoint, targetMagnet, srcBox, tgtBox, routingType = "ORTHOGONAL", startOffset = 0, endOffset = 0) {
    const dirSrc = getMagnetDirectionVector(sourceMagnet);
    const dirTgt = getMagnetDirectionVector(targetMagnet);
    const adjustedSrcPoint = {
      x: srcPoint.x + dirSrc.x * (startOffset || 0),
      y: srcPoint.y + dirSrc.y * (startOffset || 0)
    };
    const adjustedTgtPoint = {
      x: tgtPoint.x + dirTgt.x * (endOffset || 0),
      y: tgtPoint.y + dirTgt.y * (endOffset || 0)
    };
    switch (routingType) {
      case "STRAIGHT":
        return calculateStraightPoints(adjustedSrcPoint, adjustedTgtPoint);
      case "CURVED":
        return calculateCurvedPoints(adjustedSrcPoint, sourceMagnet, adjustedTgtPoint, targetMagnet);
      case "S_CURVE":
      case "ORTHOGONAL":
      default:
        return calculateOrthogonalPoints(adjustedSrcPoint, sourceMagnet, adjustedTgtPoint, targetMagnet, srcBox, tgtBox);
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
    return { vertices, segments, regions };
  }
  var LABEL_DIRECTION_HYSTERESIS = 1.2;
  function classifySegmentVertical(dx, dy, prevIsVertical) {
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);
    if (ay >= ax * LABEL_DIRECTION_HYSTERESIS && ay > 0) return true;
    if (ax >= ay * LABEL_DIRECTION_HYSTERESIS) return false;
    return prevIsVertical !== void 0 ? prevIsVertical : ay > ax;
  }
  function getLabelPlacement(worldPoints, routingType = "ORTHOGONAL", prevIsVertical, labelSize) {
    if (worldPoints.length <= 2) {
      const p1 = worldPoints[0] || { x: 0, y: 0 };
      const p2 = worldPoints[worldPoints.length - 1] || p1;
      const isVertical = classifySegmentVertical(p2.x - p1.x, p2.y - p1.y, prevIsVertical);
      return {
        point: {
          x: (p1.x + p2.x) / 2,
          y: (p1.y + p2.y) / 2
        },
        isVertical
      };
    }
    if (routingType === "CURVED") {
      const midIdx = Math.floor(worldPoints.length / 2);
      const pPrev = worldPoints[Math.max(0, midIdx - 1)];
      const pNext = worldPoints[Math.min(worldPoints.length - 1, midIdx + 1)];
      const isVertical = classifySegmentVertical(pNext.x - pPrev.x, pNext.y - pPrev.y, prevIsVertical);
      return {
        point: worldPoints[midIdx],
        isVertical
      };
    }
    let totalLen = 0;
    for (let i = 0; i < worldPoints.length - 1; i++) {
      totalLen += Math.hypot(
        worldPoints[i + 1].x - worldPoints[i].x,
        worldPoints[i + 1].y - worldPoints[i].y
      );
    }
    const half = totalLen / 2;
    let walked = 0;
    for (let i = 0; i < worldPoints.length - 1; i++) {
      const p1 = worldPoints[i];
      const p2 = worldPoints[i + 1];
      const segLen = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      if (segLen > 0 && walked + segLen >= half) {
        if (labelSize && i > 0 && i < worldPoints.length - 2) {
          const pBefore = worldPoints[i - 1];
          const pAfter = worldPoints[i + 2];
          const segIsVertical = Math.abs(p2.x - p1.x) < 0.5 && Math.abs(p2.y - p1.y) > 0.5;
          const segIsHorizontal = Math.abs(p2.y - p1.y) < 0.5 && Math.abs(p2.x - p1.x) > 0.5;
          const beforeIsHorizontal = Math.abs(p1.x - pBefore.x) > 0.5 && Math.abs(p1.y - pBefore.y) < 0.5;
          const afterIsHorizontal = Math.abs(pAfter.x - p2.x) > 0.5 && Math.abs(pAfter.y - p2.y) < 0.5;
          const beforeIsVertical = Math.abs(p1.y - pBefore.y) > 0.5 && Math.abs(p1.x - pBefore.x) < 0.5;
          const afterIsVertical = Math.abs(pAfter.y - p2.y) > 0.5 && Math.abs(pAfter.x - p2.x) < 0.5;
          const isShortVerticalJog = segIsVertical && beforeIsHorizontal && afterIsHorizontal && segLen <= labelSize.height;
          const isShortHorizontalJog = segIsHorizontal && beforeIsVertical && afterIsVertical && segLen <= labelSize.width;
          if (isShortVerticalJog || isShortHorizontalJog) {
            return {
              point: { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 },
              isVertical: isShortHorizontalJog
            };
          }
        }
        const t = (half - walked) / segLen;
        return {
          point: {
            x: p1.x + (p2.x - p1.x) * t,
            y: p1.y + (p2.y - p1.y) * t
          },
          isVertical: classifySegmentVertical(p2.x - p1.x, p2.y - p1.y, prevIsVertical)
        };
      }
      walked += segLen;
    }
    const last = worldPoints[worldPoints.length - 1];
    return { point: { x: last.x, y: last.y }, isVertical: false };
  }
  function setNodeAbsoluteXY(node, absX, absY) {
    const currentAbsX = node.absoluteTransform[0][2];
    const currentAbsY = node.absoluteTransform[1][2];
    node.x = node.x + (absX - currentAbsX);
    node.y = node.y + (absY - currentAbsY);
  }
  function placeNodeAtWorldCenter(node, world) {
    setNodeAbsoluteXY(
      node,
      Math.round(world.x - node.width / 2),
      Math.round(world.y - node.height / 2)
    );
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
    } else if (srcMagnet === tgtMagnet) {
      if (srcMagnet === "TOP") {
        const topDetourY = Math.min(srcBox.y, tgtBox.y) - margin;
        points.push({ x: srcPoint.x, y: topDetourY });
        points.push({ x: tgtPoint.x, y: topDetourY });
        points.push(tgtPoint);
      } else if (srcMagnet === "BOTTOM") {
        const bottomDetourY = Math.max(srcBox.y + srcBox.height, tgtBox.y + tgtBox.height) + margin;
        points.push({ x: srcPoint.x, y: bottomDetourY });
        points.push({ x: tgtPoint.x, y: bottomDetourY });
        points.push(tgtPoint);
      } else if (srcMagnet === "LEFT") {
        const leftDetourX = Math.min(srcBox.x, tgtBox.x) - margin;
        points.push({ x: leftDetourX, y: srcPoint.y });
        points.push({ x: leftDetourX, y: tgtPoint.y });
        points.push(tgtPoint);
      } else if (srcMagnet === "RIGHT") {
        const rightDetourX = Math.max(srcBox.x + srcBox.width, tgtBox.x + tgtBox.width) + margin;
        points.push({ x: rightDetourX, y: srcPoint.y });
        points.push({ x: rightDetourX, y: tgtPoint.y });
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
      routingType,
      options.startOffset || 0,
      options.endOffset || 0
    );
    const allX = worldPoints.map((p) => p.x);
    const allY = worldPoints.map((p) => p.y);
    const strokeColor = options.strokeColor || { r: 0.18, g: 0.18, b: 0.22 };
    const strokeWeight = options.strokeWeight || 1.5;
    const startTerminal = options.startTerminal || "NONE";
    const endTerminal = options.endTerminal || "ARROW";
    const strokePattern = options.strokePattern || "SOLID";
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
    const vector = figma.createVector();
    vector.x = minX;
    vector.y = minY;
    vector.resize(width, height);
    const net = buildVectorNetwork(
      localPoints,
      routingType,
      startTerminal,
      endTerminal,
      strokeWeight,
      strokeColor
    );
    await vector.setVectorNetworkAsync(net);
    vector.strokes = [{ type: "SOLID", color: strokeColor }];
    vector.strokeWeight = strokeWeight;
    vector.fills = [];
    if (strokePattern === "DASHED") {
      vector.dashPattern = [4, 4];
    } else if (strokePattern === "DOTTED") {
      vector.dashPattern = [1.5, 3];
    } else {
      vector.dashPattern = [];
    }
    vector.strokeJoin = routingType === "S_CURVE" || routingType === "CURVED" ? "ROUND" : "MITER";
    if (routingType === "STRAIGHT") {
      vector.strokeCap = "ROUND";
    }
    vector.strokeMiterLimit = 4;
    vector.name = `[Connector] ${sourceNode.name} \u2192 ${targetNode.name}`;
    vector.setPluginData("is_flow_connector", "true");
    vector.setPluginData("is_custom_connector", "true");
    vector.setPluginData("connector_role", "line");
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
    const shouldBuildLabel = options.labelOn === true || labelText !== "";
    if (shouldBuildLabel) {
      const boxStyle = options.labelBoxStyle || "BOX";
      const align = options.labelAlign || "CENTER";
      const lineHex = rgbToHex(strokeColor);
      const fillCol = options.labelFillColor || "#FFFFFF";
      const strokeCol = options.labelStrokeColor || lineHex;
      vector.setPluginData("connector_label_on", "true");
      vector.setPluginData("connector_label", labelText);
      vector.setPluginData("connector_label_box_style", boxStyle);
      vector.setPluginData("connector_label_align", align);
      vector.setPluginData("connector_label_fill_color", fillCol);
      vector.setPluginData("connector_label_stroke_color", strokeCol);
      const { point: midSegmentPoint, isVertical } = getLabelPlacement(
        worldPoints,
        routingType,
        void 0,
        getLabelSizeHint(null, labelText)
      );
      labelFrame = figma.createFrame();
      labelFrame.name = "ConnectorLabel";
      const textNode = figma.createText();
      textNode.name = "LabelText";
      textNode.setPluginData("is_custom_connector", "true");
      labelFrame.appendChild(textNode);
      await applyConnectorLabelStyle(labelFrame, textNode, {
        labelText,
        boxStyle,
        textAlign: align,
        fillColor: fillCol,
        strokeColor: strokeCol,
        isVertical,
        connectorStrokeWeight: strokeWeight
      });
      placeNodeAtWorldCenter(labelFrame, midSegmentPoint);
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
    vector.setPluginData("start_offset", String(options.startOffset || 0));
    vector.setPluginData("end_offset", String(options.endOffset || 0));
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
    const srcId = safeGetPluginData(connectorNode, "source_node_id");
    const tgtId = safeGetPluginData(connectorNode, "target_node_id");
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
    try {
      const connectors = figma.currentPage.findAll((n) => {
        try {
          if (!n) return false;
          if (n.type === "CONNECTOR") return true;
          if (n.type === "VECTOR" || n.type === "GROUP") {
            return safeGetPluginData(n, "is_custom_connector") === "true";
          }
          return false;
        } catch (_) {
          return false;
        }
      });
      for (const conn of connectors) {
        registerConnectorInRegistry(conn);
      }
    } catch (err) {
      console.error("refreshConnectorRegistry \uC5D0\uB7EC:", err);
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
  async function updateOrthogonalVectorConnector(connectorNode, explicitSourceMagnet, explicitTargetMagnet, forceOptimal = false, explicitStartOffset, explicitEndOffset) {
    let rootNode = connectorNode;
    if (connectorNode.parent && connectorNode.parent.type === "GROUP" && safeGetPluginData(connectorNode.parent, "is_custom_connector") === "true") {
      rootNode = connectorNode.parent;
    }
    const srcId = safeGetPluginData(rootNode, "source_node_id") || safeGetPluginData(connectorNode, "source_node_id");
    const tgtId = safeGetPluginData(rootNode, "target_node_id") || safeGetPluginData(connectorNode, "target_node_id");
    if (!srcId || !tgtId) return;
    const sourceNode = figma.getNodeById(srcId);
    const targetNode = figma.getNodeById(tgtId);
    if (!sourceNode || !targetNode) return;
    let vector = null;
    let termVector = null;
    let labelFrame = null;
    if (rootNode.type === "GROUP") {
      const group = rootNode;
      const isTerm = (c) => c.type === "VECTOR" && (safeGetPluginData(c, "connector_role") === "terminal" || c.name === "ConnectorTerminals");
      vector = group.children.find((c) => c.type === "VECTOR" && !isTerm(c)) || group.children.find((c) => c.type === "VECTOR") || null;
      termVector = group.children.find(isTerm) || null;
      labelFrame = group.children.find(
        (c) => safeGetPluginData(c, "is_connector_label") === "true" || c.name === "ConnectorLabel"
      ) || null;
    } else if (rootNode.type === "VECTOR") {
      vector = rootNode;
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
    let sourceMagnet = explicitSourceMagnet || safeGetPluginData(rootNode, "source_magnet") || void 0;
    let targetMagnet = explicitTargetMagnet || safeGetPluginData(rootNode, "target_magnet") || void 0;
    if (!sourceMagnet || !targetMagnet || forceOptimal) {
      const optimal = getOptimalMagnetPair(srcBox, tgtBox);
      if (!sourceMagnet || forceOptimal) sourceMagnet = optimal.sourceMagnet;
      if (!targetMagnet || forceOptimal) targetMagnet = optimal.targetMagnet;
    }
    rootNode.setPluginData("source_magnet", sourceMagnet);
    rootNode.setPluginData("target_magnet", targetMagnet);
    if (vector !== rootNode) {
      vector.setPluginData("source_magnet", sourceMagnet);
      vector.setPluginData("target_magnet", targetMagnet);
    }
    const routingType = safeGetPluginData(rootNode, "connector_routing") || safeGetPluginData(vector, "connector_routing") || "ORTHOGONAL";
    const pStart = getMagnetPoint(srcBox, sourceMagnet);
    const pEnd = getMagnetPoint(tgtBox, targetMagnet);
    const startOffset = typeof explicitStartOffset === "number" ? explicitStartOffset : parseFloat(
      safeGetPluginData(rootNode, "start_offset") || safeGetPluginData(vector, "start_offset") || "0"
    ) || 0;
    const endOffset = typeof explicitEndOffset === "number" ? explicitEndOffset : parseFloat(
      safeGetPluginData(rootNode, "end_offset") || safeGetPluginData(vector, "end_offset") || "0"
    ) || 0;
    rootNode.setPluginData("start_offset", String(startOffset));
    rootNode.setPluginData("end_offset", String(endOffset));
    if (vector !== rootNode) {
      vector.setPluginData("start_offset", String(startOffset));
      vector.setPluginData("end_offset", String(endOffset));
    }
    const worldPoints = calculateRoutingPoints(
      pStart,
      sourceMagnet,
      pEnd,
      targetMagnet,
      srcBox,
      tgtBox,
      routingType,
      startOffset,
      endOffset
    );
    const allX = worldPoints.map((p) => p.x);
    const allY = worldPoints.map((p) => p.y);
    const startTerminal = safeGetPluginData(rootNode, "start_terminal") || safeGetPluginData(vector, "start_terminal") || "NONE";
    const endTerminal = safeGetPluginData(rootNode, "end_terminal") || safeGetPluginData(vector, "end_terminal") || "ARROW";
    const strokeWeight = typeof vector.strokeWeight === "number" ? vector.strokeWeight : 1.5;
    let strokeColor = { r: 0.18, g: 0.18, b: 0.22 };
    if (Array.isArray(vector.strokes) && vector.strokes.length > 0 && vector.strokes[0].type === "SOLID") {
      strokeColor = vector.strokes[0].color;
    }
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
    vector.resize(width, height);
    setNodeAbsoluteXY(vector, minX, minY);
    vector.setPluginData("connector_role", "line");
    if (termVector) {
      try {
        termVector.remove();
      } catch (_) {
      }
      termVector = null;
    }
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
    if (routingType === "STRAIGHT") {
      vector.strokeCap = "ROUND";
    }
    if (rootNode.type === "GROUP") {
      const group = rootNode;
      try {
        const legacyMarkers = group.findAll((n) => {
          try {
            if (!n) return false;
            return n.name === "ConnectorStartTerminal" || n.name === "ConnectorEndTerminal" || safeGetPluginData(n, "is_terminal_marker") !== "";
          } catch (_) {
            return false;
          }
        });
        for (const m of legacyMarkers) {
          m.remove();
        }
      } catch (_) {
      }
    }
    if (rootNode.parent) {
      rootNode.parent.appendChild(rootNode);
    }
    if (labelFrame) {
      const textNode = labelFrame.findOne((n) => n.type === "TEXT");
      const labelText = safeGetPluginData(rootNode, "connector_label") || safeGetPluginData(vector, "connector_label") || "";
      const { point: midSegmentPoint, isVertical } = getLabelPlacement(
        worldPoints,
        routingType,
        readPrevLabelVertical(labelFrame),
        getLabelSizeHint(labelFrame, labelText)
      );
      const labelOn = safeGetPluginData(rootNode, "connector_label_on") === "true" || safeGetPluginData(vector, "connector_label_on") === "true" || Boolean(labelText);
      if (labelOn && textNode) {
        const boxStyle = safeGetPluginData(rootNode, "connector_label_box_style") || safeGetPluginData(vector, "connector_label_box_style") || "BOX";
        const align = safeGetPluginData(rootNode, "connector_label_align") || safeGetPluginData(vector, "connector_label_align") || "CENTER";
        const lineHex = rgbToHex(strokeColor);
        const fillCol = safeGetPluginData(rootNode, "connector_label_fill_color") || safeGetPluginData(vector, "connector_label_fill_color") || "#FFFFFF";
        const strokeCol = safeGetPluginData(rootNode, "connector_label_stroke_color") || safeGetPluginData(vector, "connector_label_stroke_color") || lineHex;
        await applyConnectorLabelStyle(labelFrame, textNode, {
          labelText,
          boxStyle,
          textAlign: align,
          fillColor: fillCol,
          strokeColor: strokeCol,
          isVertical,
          connectorStrokeWeight: strokeWeight
        });
      }
      placeNodeAtWorldCenter(labelFrame, midSegmentPoint);
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
      "connector_label_on",
      "connector_label_box_style",
      "connector_label_align",
      "connector_label_fill_color",
      "connector_label_stroke_color",
      "start_terminal",
      "end_terminal",
      "connector_pattern",
      "connector_weight",
      "connector_color",
      "start_offset",
      "end_offset"
    ];
    for (const k of keys) {
      const v = safeGetPluginData(source, k);
      if (v && typeof target.setPluginData === "function") {
        try {
          target.setPluginData(k, v);
        } catch (_) {
        }
      }
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

  // src/chainOrder.ts
  var ROW_OVERLAP_THRESHOLD = 0.5;
  function orderNodesForChain(nodes) {
    if (nodes.length <= 1) return nodes;
    const sorted = [...nodes].sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y;
      if (a.x !== b.x) return a.x - b.x;
      return a.id.localeCompare(b.id);
    });
    const rows = [];
    for (const node of sorted) {
      if (rows.length === 0) {
        rows.push({
          anchor: node,
          nodes: [node]
        });
        continue;
      }
      const lastRow = rows[rows.length - 1];
      const anchor = lastRow.anchor;
      const topA = anchor.y;
      const bottomA = anchor.y + anchor.height;
      const topB = node.y;
      const bottomB = node.y + node.height;
      const overlap = Math.max(0, Math.min(bottomA, bottomB) - Math.max(topA, topB));
      const referenceHeight = Math.min(anchor.height, node.height);
      if (overlap >= referenceHeight * ROW_OVERLAP_THRESHOLD) {
        lastRow.nodes.push(node);
      } else {
        rows.push({
          anchor: node,
          nodes: [node]
        });
      }
    }
    const result = [];
    for (const row of rows) {
      row.nodes.sort((a, b) => {
        if (a.x !== b.x) return a.x - b.x;
        if (a.y !== b.y) return a.y - b.y;
        return a.id.localeCompare(b.id);
      });
      result.push(...row.nodes);
    }
    return result;
  }
  function makePairKey(idA, idB) {
    return idA < idB ? `${idA}|${idB}` : `${idB}|${idA}`;
  }

  // src/code.ts
  function rgbToHexColor(rgb) {
    const toHex = (c) => Math.round(Math.max(0, Math.min(1, c)) * 255).toString(16).padStart(2, "0");
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase();
  }
  function normalizeConnectorTerminal(term, defaultTerm = "NONE") {
    if (!term || term === "BAR" || term === "SQUARE") return defaultTerm;
    if (term === "ARROW" || term === "CIRCLE" || term === "DIAMOND" || term === "NONE" || term === "MIXED" || term === "TRIANGLE_ARROW" || term === "REVERSED_TRIANGLE_ARROW") {
      return term;
    }
    return defaultTerm;
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
      (c) => safeGetPluginData2(c, "is_figma_link_badge") === "true" || c.name === "FigmaLinkBadge"
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
    if (card.layoutMode !== "NONE") {
      badge.layoutPositioning = "ABSOLUTE";
    }
    badge.constraints = { horizontal: "MIN", vertical: "MAX" };
    badge.x = 16;
    badge.y = card.height - badge.height - 10;
  }
  function safeGetPluginData2(node, key) {
    if (node && typeof node.getPluginData === "function") {
      try {
        return node.getPluginData(key) || "";
      } catch (_) {
        return "";
      }
    }
    return "";
  }
  function findConnectorNode(node) {
    if (!node) return null;
    let curr = node;
    while (curr && curr.type !== "PAGE" && curr.type !== "DOCUMENT") {
      if (curr.type === "CONNECTOR" || safeGetPluginData2(curr, "is_custom_connector") === "true" || safeGetPluginData2(curr, "is_flow_connector") === "true") {
        let topConnector = curr;
        let parentScan = curr.parent;
        while (parentScan && parentScan.type !== "PAGE" && parentScan.type !== "DOCUMENT") {
          if (safeGetPluginData2(parentScan, "is_custom_connector") === "true" || safeGetPluginData2(parentScan, "is_flow_connector") === "true") {
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
      if (safeGetPluginData2(curr, "is_flow_node") === "true") {
        return curr;
      }
      if (curr.type === "FRAME" || curr.type === "SHAPE_WITH_TEXT") {
        if (safeGetPluginData2(curr, "is_connector_label") !== "true" && curr.name !== "ConnectorLabel") {
          topCandidate = curr;
        }
      }
      curr = curr.parent;
    }
    return topCandidate;
  }
  function getNextFlowTag() {
    try {
      const flowNodes = figma.currentPage.findAll((node) => {
        try {
          if (!node) return false;
          if (node.type !== "FRAME" && node.type !== "SHAPE_WITH_TEXT") return false;
          return safeGetPluginData2(node, "is_flow_node") === "true";
        } catch (_) {
          return false;
        }
      });
      return `p${flowNodes.length + 1}`;
    } catch (_) {
      return "p1";
    }
  }
  function extractNodeText(node) {
    let title = "";
    let description = "";
    if (node.type === "FRAME" || "findAll" in node) {
      const frame = node;
      const titleTextNode = frame.findOne(
        (c) => Boolean(c && c.type === "TEXT" && (c.name === "TitleText" || safeGetPluginData2(c, "node_role") === "title"))
      );
      const descTextNode = frame.findOne(
        (c) => Boolean(c && c.type === "TEXT" && (c.name === "DescText" || safeGetPluginData2(c, "node_role") === "desc"))
      );
      if (titleTextNode) {
        title = titleTextNode.characters || node.name || "";
      }
      if (descTextNode) {
        description = descTextNode.characters;
      }
      if (!title) {
        const allTexts = frame.findAll((n) => {
          try {
            return Boolean(n && n.type === "TEXT");
          } catch (_) {
            return false;
          }
        });
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
      title = node.name || safeGetPluginData2(node, "node_title") || "Untitled";
    }
    if (!description) {
      description = safeGetPluginData2(node, "node_desc") || "";
    }
    return { title, description };
  }
  function isHeaderFrame(c) {
    if (c.type !== "FRAME") return false;
    if (c.name === "Header") return true;
    if (c.name.startsWith("[Step]") || safeGetPluginData2(c, "is_step_badge") === "true") return false;
    if (c.name === "StatusBadge" || safeGetPluginData2(c, "is_status_badge") === "true") return false;
    if (c.name === "FigmaLinkBadge" || safeGetPluginData2(c, "is_figma_link_badge") === "true") return false;
    const lm = c.layoutMode;
    return lm === "HORIZONTAL" || lm === "VERTICAL";
  }
  function syncTitleWidthToCard(card, cardWidth, nodeType) {
    const titleText = card.findOne(
      (c) => c.type === "TEXT" && (c.name === "TitleText" || safeGetPluginData2(c, "node_role") === "title")
    );
    if (!titleText) return;
    const header = card.children.find(isHeaderFrame);
    if (header) {
      if (header.layoutMode !== "VERTICAL") {
        try {
          header.layoutMode = "VERTICAL";
        } catch (_) {
        }
      }
      try {
        header.primaryAxisSizingMode = "AUTO";
      } catch (_) {
      }
      try {
        header.layoutSizingVertical = "HUG";
      } catch (_) {
      }
      try {
        header.layoutSizingHorizontal = "FILL";
      } catch (_) {
        try {
          header.layoutAlign = "STRETCH";
        } catch (_2) {
        }
      }
    }
    const pl = typeof card.paddingLeft === "number" ? card.paddingLeft : 0;
    const pr = typeof card.paddingRight === "number" ? card.paddingRight : 0;
    const strokeExtra = typeof card.strokeWeight === "number" && Array.isArray(card.strokes) && card.strokes.length > 0 ? card.strokeWeight * 2 : 0;
    const availW = Math.max(10, Math.round(cardWidth - pl - pr - strokeExtra));
    const truncate = nodeType === "Decision";
    try {
      titleText.maxWidth = null;
    } catch (_) {
    }
    if (!truncate) {
      try {
        titleText.maxHeight = null;
      } catch (_) {
      }
    }
    try {
      if (titleText.textAutoResize !== "NONE") titleText.textAutoResize = "NONE";
    } catch (_) {
    }
    try {
      titleText.resize(availW, truncate ? 54 : Math.max(18, Math.round(titleText.height) || 18));
    } catch (_) {
    }
    try {
      titleText.textAutoResize = truncate ? "TRUNCATE" : "HEIGHT";
    } catch (_) {
    }
    try {
      titleText.layoutSizingHorizontal = "FILL";
    } catch (_) {
      try {
        titleText.layoutAlign = "STRETCH";
      } catch (_2) {
      }
    }
  }
  function calculateCardHugHeight(card, textCharacters) {
    const isAuto = card.primaryAxisSizingMode === "AUTO";
    if (isAuto && textCharacters === void 0) {
      return Math.max(SCREEN_NODE_CONSTRAINTS.MIN_HEIGHT, Math.round(card.height));
    }
    if (card.layoutMode === "VERTICAL") {
      try {
        const headerRow = card.children.find(isHeaderFrame);
        const titleText = headerRow ? headerRow.children.find((c) => c.type === "TEXT" && (c.name === "TitleText" || safeGetPluginData2(c, "node_role") === "title")) : card.children.find((c) => c.type === "TEXT" && (c.name === "TitleText" || safeGetPluginData2(c, "node_role") === "title"));
        const titleH = headerRow ? Math.round(headerRow.height) : titleText ? Math.max(18, Math.round(titleText.height)) : 18;
        const descText2 = card.children.find(
          (c) => c.name === "DescText" || safeGetPluginData2(c, "node_role") === "desc"
        );
        let descH = 0;
        if (descText2) {
          const prevChars = descText2.characters;
          const targetChars = textCharacters !== void 0 ? textCharacters : prevChars;
          if (targetChars.length > 0) {
            const prevMaxLines2 = descText2.maxLines;
            const needRestoreMaxLines = prevMaxLines2 !== null;
            const needRestoreChars = textCharacters !== void 0 && textCharacters !== prevChars;
            if (needRestoreMaxLines) {
              descText2.maxLines = null;
            }
            if (needRestoreChars) {
              descText2.characters = textCharacters;
            }
            descH = Math.round(descText2.height);
            if (needRestoreMaxLines) {
              descText2.maxLines = prevMaxLines2;
            }
            if (needRestoreChars) {
              descText2.characters = prevChars;
            }
          }
        }
        const pt = typeof card.paddingTop === "number" ? card.paddingTop : 14;
        const hasStatus = Boolean(safeGetPluginData2(card, "workflow_status"));
        const hasLink = Boolean(safeGetPluginData2(card, "figma_link"));
        const hasBottomBadge = hasStatus || hasLink;
        const hasDesc = descH > 0;
        const pb = typeof card.paddingBottom === "number" ? card.paddingBottom : hasBottomBadge ? 36 : hasDesc ? 16 : 14;
        const itemSpacing = hasDesc ? typeof card.itemSpacing === "number" ? card.itemSpacing : 8 : 0;
        const calculatedH = Math.round(pt + titleH + itemSpacing + descH + pb);
        return Math.max(SCREEN_NODE_CONSTRAINTS.MIN_HEIGHT, calculatedH);
      } catch (_) {
      }
    }
    const prevSizingMode = card.primaryAxisSizingMode;
    const prevHeight = card.height;
    const prevMinHeight = card.minHeight;
    const prevMaxHeight = card.maxHeight;
    const descText = card.children.find(
      (c) => c.name === "DescText" || safeGetPluginData2(c, "node_role") === "desc"
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
      return Math.max(SCREEN_NODE_CONSTRAINTS.MIN_HEIGHT, hugH);
    } catch (_) {
      return Math.max(SCREEN_NODE_CONSTRAINTS.MIN_HEIGHT, Math.round(card.height));
    }
  }
  async function measureSingleLineTextWidth(text, fontName, fontSize) {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    await figma.loadFontAsync(fontName);
    const measureNode = figma.createText();
    measureNode.x = -99999;
    measureNode.y = -99999;
    figma.currentPage.appendChild(measureNode);
    try {
      measureNode.fontName = fontName;
      measureNode.fontSize = fontSize;
      measureNode.lineHeight = { value: 18, unit: "PIXELS" };
      measureNode.textAutoResize = "WIDTH_AND_HEIGHT";
      let maxLineW = 0;
      const lines = trimmed.split("\n");
      for (const line of lines) {
        const l = line.trim();
        if (l) {
          measureNode.characters = l;
          const w = Math.ceil(measureNode.width) + 2;
          if (w > maxLineW) {
            maxLineW = w;
          }
        }
      }
      return maxLineW;
    } finally {
      measureNode.remove();
    }
  }
  async function calculateMinimumInternalContentWidth(status, figmaLink) {
    const hasStatus = Boolean(status && STATUS_CONFIG[status]);
    const hasLink = Boolean(figmaLink && figmaLink.trim());
    if (!hasStatus && !hasLink) {
      return SCREEN_NODE_CONSTRAINTS.MIN_WIDTH;
    }
    let statusBadgeW = 0;
    if (hasStatus) {
      const cfg = STATUS_CONFIG[status];
      const label = (cfg.label || status || "").toUpperCase();
      const statusFont = { family: "Inter", style: "Bold" };
      const labelW = await measureSingleLineTextWidth(label, statusFont, 9);
      statusBadgeW = labelW + 18;
    }
    if (hasStatus && hasLink) {
      return 16 + 16 + 8 + statusBadgeW + 10;
    }
    if (hasStatus) {
      return 16 + statusBadgeW + 10;
    }
    return 16 + 16 + 16;
  }
  async function calculateScreenFitWidth(card, title, status, figmaLink) {
    const pl = typeof card.paddingLeft === "number" ? card.paddingLeft : 16;
    const pr = typeof card.paddingRight === "number" ? card.paddingRight : 16;
    const strokeOffset = (typeof card.strokeWeight === "number" ? card.strokeWeight : 1.5) * 2;
    const trimmedTitle = (title || "").trim();
    let measuredTitleW = 0;
    if (trimmedTitle) {
      const titleFont = { family: "Inter", style: "Bold" };
      measuredTitleW = await measureSingleLineTextWidth(trimmedTitle, titleFont, 13);
    }
    const titleRequiredW = measuredTitleW > 0 ? measuredTitleW + pl + pr + Math.ceil(strokeOffset) + 4 : SCREEN_NODE_CONSTRAINTS.MIN_WIDTH;
    const internalRequiredW = await calculateMinimumInternalContentWidth(status, figmaLink);
    const fitW = Math.max(SCREEN_NODE_CONSTRAINTS.MIN_WIDTH, titleRequiredW, internalRequiredW);
    return clampScreenWidth(fitW);
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
  async function updateDescTextTruncation(card, descText, currentHeight, textCharacters, targetWidth) {
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
      descText.textAlignHorizontal = "LEFT";
      if (descText.layoutAlign !== "STRETCH") {
        descText.layoutAlign = "STRETCH";
      }
      if (descText.textAutoResize !== "HEIGHT") {
        descText.textAutoResize = "HEIGHT";
      }
      const pl = typeof card.paddingLeft === "number" ? card.paddingLeft : 16;
      const pr = typeof card.paddingRight === "number" ? card.paddingRight : 16;
      const strokeOffset = (typeof card.strokeWeight === "number" ? card.strokeWeight : 0) * 2;
      const effectiveCardW = typeof targetWidth === "number" && targetWidth > 0 ? targetWidth : card.width;
      const availW = Math.max(10, effectiveCardW - pl - pr - strokeOffset);
      if (Math.abs(descText.width - availW) > 1) {
        try {
          descText.resize(availW, descText.height);
        } catch (_) {
        }
      }
      const sMode = (safeGetPluginData2(card, "size_mode") || safeGetPluginData2(card, "screen_size_mode") || "").toLowerCase();
      const isFitOrHug = sMode === "fit" || sMode === "hug" || card.primaryAxisSizingMode === "AUTO";
      if (isFitOrHug) {
        if (descText.textTruncation !== "DISABLED") {
          descText.textTruncation = "DISABLED";
        }
        if (descText.maxLines !== null) {
          descText.maxLines = null;
        }
        return;
      }
      if (descText.textTruncation !== "ENDING") {
        descText.textTruncation = "ENDING";
      }
      const hugH = calculateCardHugHeight(card, textCharacters);
      if (currentHeight >= hugH - 4) {
        descText.maxLines = null;
        return;
      }
      const statusBadge = card.children.find(
        (c) => safeGetPluginData2(c, "is_status_badge") === "true" || c.name === "StatusBadge"
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
  function buildPairKeySet(nodeIds) {
    const nodeIdSet = new Set(nodeIds);
    const pairKeys = /* @__PURE__ */ new Set();
    if (nodeIdSet.size < 2) return pairKeys;
    const connectors = figma.currentPage.findAll((n) => {
      try {
        if (!n) return false;
        if (n.type === "CONNECTOR") {
          const conn = n;
          const sId = conn.connectorStart && "endpointNodeId" in conn.connectorStart ? conn.connectorStart.endpointNodeId : void 0;
          const tId = conn.connectorEnd && "endpointNodeId" in conn.connectorEnd ? conn.connectorEnd.endpointNodeId : void 0;
          return Boolean(sId && tId && nodeIdSet.has(sId) && nodeIdSet.has(tId) && sId !== tId);
        }
        if (n.type === "GROUP" || n.type === "VECTOR") {
          const isCustom = safeGetPluginData2(n, "is_custom_connector") === "true" || safeGetPluginData2(n, "is_flow_connector") === "true";
          if (!isCustom) return false;
          if (safeGetPluginData2(n, "is_connector_label") === "true" || n.name === "ConnectorLabel") return false;
          let sId = safeGetPluginData2(n, "source_node_id");
          let tId = safeGetPluginData2(n, "target_node_id");
          if ((!sId || !tId) && n.type === "GROUP") {
            const vChild = n.findOne((child) => child.type === "VECTOR");
            if (vChild) {
              sId = sId || safeGetPluginData2(vChild, "source_node_id");
              tId = tId || safeGetPluginData2(vChild, "target_node_id");
            }
          }
          return Boolean(sId && tId && nodeIdSet.has(sId) && nodeIdSet.has(tId) && sId !== tId);
        }
        return false;
      } catch (_) {
        return false;
      }
    });
    for (const rawConn of connectors) {
      let sId;
      let tId;
      if (rawConn.type === "CONNECTOR") {
        const conn = rawConn;
        sId = conn.connectorStart && "endpointNodeId" in conn.connectorStart ? conn.connectorStart.endpointNodeId : void 0;
        tId = conn.connectorEnd && "endpointNodeId" in conn.connectorEnd ? conn.connectorEnd.endpointNodeId : void 0;
      } else {
        sId = safeGetPluginData2(rawConn, "source_node_id");
        tId = safeGetPluginData2(rawConn, "target_node_id");
        if ((!sId || !tId) && rawConn.type === "GROUP") {
          const vChild = rawConn.findOne((child) => child.type === "VECTOR");
          if (vChild) {
            sId = sId || safeGetPluginData2(vChild, "source_node_id");
            tId = tId || safeGetPluginData2(vChild, "target_node_id");
          }
        }
      }
      if (sId && tId && nodeIdSet.has(sId) && nodeIdSet.has(tId) && sId !== tId) {
        pairKeys.add(makePairKey(sId, tId));
      }
    }
    return pairKeys;
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
    const flowNodes = nonConnNodes.filter((n) => {
      if (safeGetPluginData2(n, "is_flow_node") === "true") return true;
      if (n.type === "FRAME") {
        const frame = n;
        if (safeGetPluginData2(frame, "node_type")) return true;
        if (frame.children && frame.children.some((c) => c.name === "Header" || c.name === "TitleText" || safeGetPluginData2(c, "node_role") === "title")) return true;
      }
      return false;
    });
    const otherObjects = nonConnNodes.filter((n) => !flowNodes.includes(n));
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
    if (uniqueNodes.length === 2) {
      uniqueNodes = sortNodesBySpatialPosition(uniqueNodes);
    } else if (uniqueNodes.length >= 3) {
      uniqueNodes = orderNodesForChain(uniqueNodes);
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
          const srcId = safeGetPluginData2(c, "source_node_id");
          const tgtId = safeGetPluginData2(c, "target_node_id");
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
      const isFlowNode = safeGetPluginData2(node, "is_flow_node") === "true" || node.type === "FRAME" && Boolean(
        safeGetPluginData2(node, "node_type") || node.children?.some((c) => c.name === "Header" || c.name === "TitleText" || safeGetPluginData2(c, "node_role") === "title")
      );
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
          (c) => safeGetPluginData2(c, "is_status_badge") === "true" || c.name === "StatusBadge"
        );
        if (statusBadge) {
          if (frame.paddingBottom !== 36) {
            frame.paddingBottom = 36;
          }
          if (statusBadge.paddingLeft !== 9) statusBadge.paddingLeft = 9;
          if (statusBadge.paddingRight !== 9) statusBadge.paddingRight = 9;
          const nodeCornerRadius = typeof frame.cornerRadius === "number" ? frame.cornerRadius : 0;
          const targetRadius = getStatusBadgeCornerRadius(nodeCornerRadius);
          if (statusBadge.cornerRadius !== targetRadius) statusBadge.cornerRadius = targetRadius;
          if (statusBadge.constraints?.horizontal !== "MAX" || statusBadge.constraints?.vertical !== "MAX") {
            statusBadge.constraints = { horizontal: "MAX", vertical: "MAX" };
          }
          const targetX = frame.width - statusBadge.width - 10;
          const targetY = frame.height - statusBadge.height - 10;
          if (statusBadge.x !== targetX) statusBadge.x = targetX;
          if (statusBadge.y !== targetY) statusBadge.y = targetY;
          if (!statusBadge.locked) statusBadge.locked = true;
          const textChild = statusBadge.children.find((c) => c.type === "TEXT");
          if (textChild && !textChild.locked) textChild.locked = true;
        }
        if (frame.layoutMode !== "VERTICAL") {
          frame.layoutMode = "VERTICAL";
        }
        const rawNodeType = safeGetPluginData2(frame, "node_type");
        const nType = normalizeNodeType(rawNodeType);
        const nSpec = NODE_TYPE_SHAPE_SPECS[nType] || NODE_TYPE_SHAPE_SPECS.Screen;
        const isShape = !nSpec.allowDescription;
        const targetAlign = isShape ? "CENTER" : "MIN";
        if (frame.counterAxisAlignItems !== targetAlign) {
          frame.counterAxisAlignItems = targetAlign;
        }
        if (frame.primaryAxisAlignItems !== targetAlign) {
          frame.primaryAxisAlignItems = targetAlign;
        }
        const headerFrame = frame.children.find(isHeaderFrame);
        const titleText = headerFrame ? headerFrame.children.find((c) => c.type === "TEXT") : frame.children.find((c) => c.type === "TEXT" && (c.name === "TitleText" || safeGetPluginData2(c, "node_role") === "title"));
        if (titleText) {
          enforceTitleStandardStyle(titleText, frame);
        }
        const descText = frame.children.find(
          (c) => c.type === "TEXT" && (c.name === "DescText" || safeGetPluginData2(c, "node_role") === "desc")
        );
        if (descText) {
          await lockTextFontSizeAndAutoResize(descText, 11);
          await updateDescTextTruncation(frame, descText, frame.height);
        }
      }
      let title = "";
      let description = "";
      let tag = safeGetPluginData2(node, "node_tag") || "";
      let connectorLabel;
      let connectorLabelOn;
      let connectorLabelBoxStyle;
      let connectorLabelAlign;
      let connectorLabelFillColor;
      let connectorLabelStrokeColor;
      let connectorLineType;
      let connectorColorHex;
      let connectorStrokeWeight;
      let connectorStrokePattern;
      let connectorRoutingType;
      let connectorStartTerminal;
      let connectorEndTerminal;
      let connectorStartOffset = 0;
      let connectorEndOffset = 0;
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
          const rawNativeLabelOn = node.getPluginData("connector_label_on");
          connectorLabelOn = rawNativeLabelOn !== "" ? rawNativeLabelOn === "true" : Boolean(conn.text && conn.text.characters);
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
            if (upper.includes("REVERSED_TRIANGLE")) return "REVERSED_TRIANGLE_ARROW";
            if (upper.includes("TRIANGLE") || upper.includes("ARROW") || upper.includes("EQUILATERAL")) return "ARROW";
            if (upper.includes("DIAMOND")) return "DIAMOND";
            if (upper.includes("CIRCLE") || upper.includes("ROUND")) return "CIRCLE";
            return "NONE";
          };
          const savedStartTerm = node.getPluginData("start_terminal");
          const savedEndTerm = node.getPluginData("end_terminal");
          connectorStartTerminal = normalizeConnectorTerminal(savedStartTerm, mapCapToTerm(String(conn.connectorStartStrokeCap || "NONE")));
          connectorEndTerminal = normalizeConnectorTerminal(savedEndTerm, mapCapToTerm(String(conn.connectorEndStrokeCap || "ARROW")));
          const rawStartOff = node.getPluginData("start_offset");
          const rawEndOff = node.getPluginData("end_offset");
          connectorStartOffset = rawStartOff ? parseFloat(rawStartOff) : 0;
          connectorEndOffset = rawEndOff ? parseFloat(rawEndOff) : 0;
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
            const tempOffset = connectorStartOffset;
            connectorStartOffset = connectorEndOffset;
            connectorEndOffset = tempOffset;
          }
        } else {
          connectorLabel = node.getPluginData("connector_label") || "";
          const rawCustomLabelOn = node.getPluginData("connector_label_on");
          connectorLabelOn = rawCustomLabelOn !== "" ? rawCustomLabelOn === "true" : Boolean(connectorLabel);
          connectorLabelBoxStyle = node.getPluginData("connector_label_box_style") || "BOX";
          connectorLabelAlign = node.getPluginData("connector_label_align") || "CENTER";
          connectorLineType = "ELBOWED";
          connectorRoutingType = node.getPluginData("connector_routing") || "ORTHOGONAL";
          connectorColorHex = node.getPluginData("connector_color");
          const labelColorFallback = connectorColorHex || "#000000";
          connectorLabelFillColor = node.getPluginData("connector_label_fill_color") || "#FFFFFF";
          connectorLabelStrokeColor = node.getPluginData("connector_label_stroke_color") || labelColorFallback;
          const savedWeight = node.getPluginData("connector_weight");
          connectorStrokeWeight = savedWeight ? parseFloat(savedWeight) : void 0;
          connectorStrokePattern = node.getPluginData("connector_pattern") || "SOLID";
          connectorStartTerminal = normalizeConnectorTerminal(node.getPluginData("start_terminal"), "NONE");
          connectorEndTerminal = normalizeConnectorTerminal(node.getPluginData("end_terminal"), "ARROW");
          const rawStartOff = node.getPluginData("start_offset");
          const rawEndOff = node.getPluginData("end_offset");
          connectorStartOffset = rawStartOff ? parseFloat(rawStartOff) : 0;
          connectorEndOffset = rawEndOff ? parseFloat(rawEndOff) : 0;
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
            if (connectorStartOffset === 0 && vectorChild.getPluginData("start_offset")) {
              connectorStartOffset = parseFloat(vectorChild.getPluginData("start_offset")) || 0;
            }
            if (connectorEndOffset === 0 && vectorChild.getPluginData("end_offset")) {
              connectorEndOffset = parseFloat(vectorChild.getPluginData("end_offset")) || 0;
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
              const tempOffset = connectorStartOffset;
              connectorStartOffset = connectorEndOffset;
              connectorEndOffset = tempOffset;
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
      const flowNodeType = isFlowNode ? savedType || "Screen" : node.type === "FRAME" ? "Screen" : void 0;
      const savedStatus = isFlowNode ? node.getPluginData("workflow_status") : void 0;
      let sizeMode = "fixed";
      let hugHeight = Math.round(node.height);
      if (isFlowNode && node.type === "FRAME") {
        const frame = node;
        const isAutoPrimary = frame.primaryAxisSizingMode === "AUTO";
        const isAutoCounter = frame.counterAxisSizingMode === "AUTO";
        const savedSizeMode = frame.getPluginData("size_mode");
        if (savedSizeMode === "fit" || isAutoPrimary && isAutoCounter) {
          sizeMode = "fit";
        } else if (savedSizeMode === "hug" || isAutoPrimary) {
          sizeMode = "hug";
        } else {
          sizeMode = "fixed";
        }
        hugHeight = calculateCardHugHeight(frame);
      }
      let nodeFillColor;
      let nodeStrokeColor;
      let nodeStrokeWeight;
      if (isFlowNode && node.type === "FRAME") {
        const frame = node;
        const shapeVector = frame.children.find(
          (c) => (c.name === "ShapeVector" || c.name === "DiamondShape") && c.type === "VECTOR"
        );
        if (shapeVector) {
          if (Array.isArray(shapeVector.fills) && shapeVector.fills.length > 0 && shapeVector.fills[0].type === "SOLID") {
            nodeFillColor = rgbToHexColor(shapeVector.fills[0].color);
          }
          if (Array.isArray(shapeVector.strokes) && shapeVector.strokes.length > 0 && shapeVector.strokes[0].type === "SOLID") {
            nodeStrokeColor = rgbToHexColor(shapeVector.strokes[0].color);
          }
          if (typeof shapeVector.strokeWeight === "number") {
            nodeStrokeWeight = shapeVector.strokeWeight;
          }
        }
      }
      if (!nodeFillColor && "fills" in node && Array.isArray(node.fills)) {
        if (node.fills.length === 0) {
          nodeFillColor = "None";
        } else {
          const firstFill = node.fills[0];
          if (firstFill.type === "SOLID") {
            nodeFillColor = rgbToHexColor(firstFill.color);
          }
        }
      }
      if (!nodeStrokeColor && "strokes" in node && Array.isArray(node.strokes) && node.strokes.length > 0) {
        const firstStroke = node.strokes[0];
        if (firstStroke.type === "SOLID") {
          nodeStrokeColor = rgbToHexColor(firstStroke.color);
        }
      }
      if (nodeStrokeWeight === void 0 && "strokeWeight" in node && typeof node.strokeWeight === "number") {
        nodeStrokeWeight = node.strokeWeight;
      }
      if (isConnector && typeof connectorStrokeWeight === "number") {
        nodeStrokeWeight = connectorStrokeWeight;
      }
      let cornerRadius = 0;
      if ("cornerRadius" in node && typeof node.cornerRadius === "number") {
        cornerRadius = Math.round(node.cornerRadius);
      }
      if (isFlowNode && flowNodeType) {
        const nSpec = NODE_TYPE_SHAPE_SPECS[flowNodeType];
        if (nSpec && typeof nSpec.cornerRadius === "number" && nSpec.cornerRadius > 0 && cornerRadius === 0) {
          cornerRadius = nSpec.cornerRadius;
        }
      }
      if (isFlowNode && flowNodeType === "Screen" && node.type === "FRAME") {
        const frameNode = node;
        if (frameNode.strokeAlign !== "INSIDE") {
          try {
            frameNode.strokeAlign = "INSIDE";
          } catch (_) {
          }
        }
        if ("strokesIncludedInLayout" in frameNode && frameNode.layoutMode !== "NONE" && !frameNode.strokesIncludedInLayout) {
          try {
            frameNode.strokesIncludedInLayout = true;
          } catch (_) {
          }
        }
        const header = frameNode.children.find(isHeaderFrame);
        if (header) {
          if (header.layoutMode !== "VERTICAL") {
            try {
              header.layoutMode = "VERTICAL";
            } catch (_) {
            }
          }
          if (header.layoutAlign !== "STRETCH") {
            try {
              header.layoutAlign = "STRETCH";
            } catch (_) {
            }
          }
          if (header.primaryAxisSizingMode !== "AUTO") {
            try {
              header.primaryAxisSizingMode = "AUTO";
            } catch (_) {
            }
          }
          try {
            header.layoutSizingHorizontal = "FILL";
          } catch (_) {
          }
          try {
            header.layoutSizingVertical = "HUG";
          } catch (_) {
          }
          const tText = header.children.find((c) => c.type === "TEXT");
          if (tText) {
            if (tText.layoutAlign !== "STRETCH") {
              try {
                tText.layoutAlign = "STRETCH";
              } catch (_) {
              }
            }
            if (tText.textAutoResize !== "HEIGHT") {
              try {
                tText.textAutoResize = "HEIGHT";
              } catch (_) {
              }
            }
          }
        }
      }
      const pos = getNodeTopLeft(node);
      let isDescriptionOn = false;
      if (isFlowNode && flowNodeType === "Screen" && node.type === "FRAME") {
        const frameNode = node;
        const descChild = frameNode.children.find(
          (c) => c.type === "TEXT" && (c.name === "DescText" || safeGetPluginData2(c, "node_role") === "desc")
        );
        isDescriptionOn = Boolean(descChild) || safeGetPluginData2(node, "description_on") === "true";
      }
      return {
        id: node.id,
        name: node.name,
        isFlowNode,
        isConnector,
        nodeType: node.type,
        flowNodeType,
        branchVariant: flowNodeType === "Branch" ? normalizeBranchVariant(node.getPluginData("branch_variant")) : void 0,
        status: savedStatus || void 0,
        title,
        description,
        descriptionOn: isDescriptionOn,
        tag,
        theme: node.getPluginData("node_theme") || "light",
        figmaLink: node.getPluginData("figma_link"),
        cachedFigmaLink: node.getPluginData("cached_figma_link") || node.getPluginData("figma_link") || void 0,
        connectorLabel,
        connectorLabelOn,
        connectorLabelBoxStyle,
        connectorLabelAlign,
        connectorLabelFillColor,
        connectorLabelStrokeColor,
        connectorLineType,
        connectorColorHex,
        connectorStrokeWeight,
        connectorStrokePattern,
        connectorRoutingType,
        connectorStartTerminal,
        connectorEndTerminal,
        connectorStartOffset,
        connectorEndOffset,
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
    let existingSourceMagnets = [];
    let existingTargetMagnets = [];
    let connectedConnectorCount = 0;
    if (connectorCount === 1 && nodes.length > 0) {
      suggestedSourceMagnet = nodes[0].connectorSourceMagnet;
      suggestedTargetMagnet = nodes[0].connectorTargetMagnet;
    } else if (uniqueNodes.length === 2 && connectorCount === 0) {
      const sourceId = uniqueNodes[0].id;
      const targetIds = uniqueNodes.slice(1).map((n) => n.id);
      const foundConnectors = figma.currentPage.findAll((n) => {
        try {
          if (!n) return false;
          if (n.type === "CONNECTOR") {
            const conn = n;
            const sId = conn.connectorStart && "endpointNodeId" in conn.connectorStart ? conn.connectorStart.endpointNodeId : void 0;
            const tId = conn.connectorEnd && "endpointNodeId" in conn.connectorEnd ? conn.connectorEnd.endpointNodeId : void 0;
            return sId === sourceId && targetIds.includes(tId || "") || tId === sourceId && targetIds.includes(sId || "");
          }
          if (n.type === "GROUP" || n.type === "VECTOR") {
            const isCustom = safeGetPluginData2(n, "is_custom_connector") === "true" || safeGetPluginData2(n, "is_flow_connector") === "true";
            if (!isCustom) return false;
            let sId = safeGetPluginData2(n, "source_node_id");
            let tId = safeGetPluginData2(n, "target_node_id");
            if ((!sId || !tId) && n.type === "GROUP") {
              const vChild = n.findOne((child) => child.type === "VECTOR");
              if (vChild) {
                sId = sId || safeGetPluginData2(vChild, "source_node_id");
                tId = tId || safeGetPluginData2(vChild, "target_node_id");
              }
            }
            return sId === sourceId && targetIds.includes(tId || "") || tId === sourceId && targetIds.includes(sId || "");
          }
          return false;
        } catch (_) {
          return false;
        }
      });
      const uniqueConnectorsMap = /* @__PURE__ */ new Map();
      for (const rawConn of foundConnectors) {
        const topConn = findConnectorNode(rawConn) || rawConn;
        if (topConn) {
          uniqueConnectorsMap.set(topConn.id, topConn);
        }
      }
      connectedConnectorCount = uniqueConnectorsMap.size;
      const connectedConnectorIds = Array.from(uniqueConnectorsMap.keys());
      const connectedConnectors = [];
      if (connectedConnectorCount > 0) {
        const srcMags = [];
        const tgtMags = [];
        for (const c of Array.from(uniqueConnectorsMap.values())) {
          let isForward = true;
          let sMag;
          let tMag;
          if (c.type === "CONNECTOR") {
            const conn = c;
            const sId = conn.connectorStart && "endpointNodeId" in conn.connectorStart ? conn.connectorStart.endpointNodeId : void 0;
            isForward = sId === sourceId;
            sMag = conn.connectorStart && "magnet" in conn.connectorStart ? conn.connectorStart.magnet : void 0;
            tMag = conn.connectorEnd && "magnet" in conn.connectorEnd ? conn.connectorEnd.magnet : void 0;
            if (isForward) {
              if (sMag) srcMags.push(sMag);
              if (tMag) tgtMags.push(tMag);
            } else {
              if (tMag) srcMags.push(tMag);
              if (sMag) tgtMags.push(sMag);
            }
          } else {
            let sId = safeGetPluginData2(c, "source_node_id");
            sMag = safeGetPluginData2(c, "source_magnet") || void 0;
            tMag = safeGetPluginData2(c, "target_magnet") || void 0;
            if ((!sMag || !tMag) && c.type === "GROUP") {
              const vChild = c.findOne((child) => child.type === "VECTOR");
              if (vChild) {
                sId = sId || safeGetPluginData2(vChild, "source_node_id");
                sMag = sMag || safeGetPluginData2(vChild, "source_magnet") || void 0;
                tMag = tMag || safeGetPluginData2(vChild, "target_magnet") || void 0;
              }
            }
            isForward = sId === sourceId;
            if (isForward) {
              if (sMag) srcMags.push(sMag);
              if (tMag) tgtMags.push(tMag);
            } else {
              if (tMag) srcMags.push(tMag);
              if (sMag) tgtMags.push(sMag);
            }
          }
          connectedConnectors.push({
            id: c.id,
            isReversed: !isForward,
            sourceMagnet: sMag,
            targetMagnet: tMag
          });
        }
        existingSourceMagnets = Array.from(new Set(srcMags));
        existingTargetMagnets = Array.from(new Set(tgtMags));
        if (existingSourceMagnets.length === 1) {
          suggestedSourceMagnet = existingSourceMagnets[0];
        }
        if (existingTargetMagnets.length === 1) {
          suggestedTargetMagnet = existingTargetMagnets[0];
        }
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
        suggestedTargetMagnet,
        existingSourceMagnets,
        existingTargetMagnets,
        connectedConnectorCount,
        hasExistingConnection: connectedConnectorCount > 0,
        connectedConnectorIds,
        connectedConnectors
      });
      return;
    } else if (uniqueNodes.length >= 3) {
      const orderedNodeIds = uniqueNodes.map((n) => n.id);
      const existingPairKeys = buildPairKeySet(orderedNodeIds);
      let chainTotalPairs = 0;
      let chainConnectedPairs = 0;
      for (let i = 0; i < orderedNodeIds.length - 1; i++) {
        chainTotalPairs++;
        const pKey = makePairKey(orderedNodeIds[i], orderedNodeIds[i + 1]);
        if (existingPairKeys.has(pKey)) {
          chainConnectedPairs++;
        }
      }
      const chainMissingPairs = chainTotalPairs - chainConnectedPairs;
      const hasExistingConnection = chainMissingPairs === 0;
      const selectedNodeIdSet = new Set(uniqueNodes.map((n) => n.id));
      const foundConnectors = figma.currentPage.findAll((n) => {
        try {
          if (!n) return false;
          if (n.type === "CONNECTOR") {
            const conn = n;
            const sId = conn.connectorStart && "endpointNodeId" in conn.connectorStart ? conn.connectorStart.endpointNodeId : void 0;
            const tId = conn.connectorEnd && "endpointNodeId" in conn.connectorEnd ? conn.connectorEnd.endpointNodeId : void 0;
            return Boolean(sId && tId && selectedNodeIdSet.has(sId) && selectedNodeIdSet.has(tId));
          }
          if (n.type === "GROUP" || n.type === "VECTOR") {
            const isCustom = safeGetPluginData2(n, "is_custom_connector") === "true" || safeGetPluginData2(n, "is_flow_connector") === "true";
            if (!isCustom) return false;
            let sId = safeGetPluginData2(n, "source_node_id");
            let tId = safeGetPluginData2(n, "target_node_id");
            if ((!sId || !tId) && n.type === "GROUP") {
              const vChild = n.findOne((child) => child.type === "VECTOR");
              if (vChild) {
                sId = sId || safeGetPluginData2(vChild, "source_node_id");
                tId = tId || safeGetPluginData2(vChild, "target_node_id");
              }
            }
            return Boolean(sId && tId && selectedNodeIdSet.has(sId) && selectedNodeIdSet.has(tId));
          }
          return false;
        } catch (_) {
          return false;
        }
      });
      const uniqueConnectorsMap = /* @__PURE__ */ new Map();
      for (const rawConn of foundConnectors) {
        const topConn = findConnectorNode(rawConn) || rawConn;
        if (topConn) {
          uniqueConnectorsMap.set(topConn.id, topConn);
        }
      }
      const multiNodeConnectors = [];
      for (const c of Array.from(uniqueConnectorsMap.values())) {
        let sId;
        let tId;
        let sMag;
        let tMag;
        if (c.type === "CONNECTOR") {
          const conn = c;
          sId = conn.connectorStart && "endpointNodeId" in conn.connectorStart ? conn.connectorStart.endpointNodeId : void 0;
          tId = conn.connectorEnd && "endpointNodeId" in conn.connectorEnd ? conn.connectorEnd.endpointNodeId : void 0;
          sMag = conn.connectorStart && "magnet" in conn.connectorStart ? conn.connectorStart.magnet : void 0;
          tMag = conn.connectorEnd && "magnet" in conn.connectorEnd ? conn.connectorEnd.magnet : void 0;
        } else {
          sId = safeGetPluginData2(c, "source_node_id") || void 0;
          tId = safeGetPluginData2(c, "target_node_id") || void 0;
          sMag = safeGetPluginData2(c, "source_magnet") || void 0;
          tMag = safeGetPluginData2(c, "target_magnet") || void 0;
          if ((!sMag || !tMag || !sId || !tId) && c.type === "GROUP") {
            const vChild = c.findOne((child) => child.type === "VECTOR");
            if (vChild) {
              sId = sId || safeGetPluginData2(vChild, "source_node_id") || void 0;
              tId = tId || safeGetPluginData2(vChild, "target_node_id") || void 0;
              sMag = sMag || safeGetPluginData2(vChild, "source_magnet") || void 0;
              tMag = tMag || safeGetPluginData2(vChild, "target_magnet") || void 0;
            }
          }
        }
        if (sId && tId) {
          multiNodeConnectors.push({
            id: c.id,
            sourceId: sId,
            targetId: tId,
            sourceMagnet: sMag,
            targetMagnet: tMag
          });
        }
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
        suggestedSourceMagnet: void 0,
        suggestedTargetMagnet: void 0,
        existingSourceMagnets: [],
        existingTargetMagnets: [],
        connectedConnectorCount: chainConnectedPairs,
        hasExistingConnection,
        connectedConnectorIds: [],
        connectedConnectors: [],
        orderedNodeIds,
        chainTotalPairs,
        chainConnectedPairs,
        chainMissingPairs,
        multiNodeConnectors
      });
      return;
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
      suggestedTargetMagnet,
      existingSourceMagnets,
      existingTargetMagnets,
      connectedConnectorCount,
      hasExistingConnection: false,
      connectedConnectorIds: [],
      connectedConnectors: []
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
        let needsFont = true;
        let needsSize = true;
        try {
          const fn = textNode.getRangeFontName(0, 1);
          if (fn !== figma.mixed && fn.family === descFont.family && fn.style === descFont.style) {
            needsFont = false;
          }
        } catch (_) {
        }
        try {
          const fs = textNode.getRangeFontSize(0, 1);
          if (fs !== figma.mixed && fs === targetSize) {
            needsSize = false;
          }
        } catch (_) {
        }
        if (needsFont) {
          try {
            textNode.setRangeFontName(0, len, descFont);
          } catch (_) {
            try {
              textNode.fontName = descFont;
            } catch (_2) {
            }
          }
        }
        if (needsSize) {
          try {
            textNode.setRangeFontSize(0, len, targetSize);
          } catch (_) {
            try {
              textNode.fontSize = targetSize;
            } catch (_2) {
            }
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
        if (parentFrame.layoutMode === "NONE") {
          const card = parentFrame.parent && "layoutMode" in parentFrame.parent ? parentFrame.parent : parentFrame;
          const pl = typeof card.paddingLeft === "number" ? card.paddingLeft : 16;
          const pr = typeof card.paddingRight === "number" ? card.paddingRight : 16;
          const strokeOffset = (typeof card.strokeWeight === "number" ? card.strokeWeight : 0) * 2;
          const availW = Math.max(10, card.width - pl - pr - strokeOffset);
          if (Math.abs(textNode.width - availW) > 1) {
            try {
              textNode.resize(availW, textNode.height);
            } catch (_) {
            }
          }
        }
      }
      if (textNode.layoutAlign !== "STRETCH") {
        textNode.layoutAlign = "STRETCH";
      }
      if (textNode.textAutoResize !== "HEIGHT") {
        textNode.textAutoResize = "HEIGHT";
      }
      const flowNodeCandidate = findFlowNode(textNode);
      const isScreenCard = flowNodeCandidate && flowNodeCandidate.type === "FRAME" && normalizeNodeType(safeGetPluginData2(flowNodeCandidate, "node_type")) === "Screen";
      const sMode = isScreenCard ? safeGetPluginData2(flowNodeCandidate, "size_mode") || safeGetPluginData2(flowNodeCandidate, "screen_size_mode") || "fixed" : null;
      if (sMode === "fit" || sMode === "hug") {
        if (textNode.textTruncation !== "DISABLED") {
          textNode.textTruncation = "DISABLED";
        }
      } else {
        if (textNode.textTruncation !== "ENDING") {
          textNode.textTruncation = "ENDING";
        }
      }
    } catch (err) {
      console.warn("\uD3F0\uD2B8 \uC0AC\uC774\uC988 \uBC0F \uB9AC\uC0AC\uC774\uC988 \uBAA8\uB4DC \uACE0\uC815 \uC2E4\uD328:", err);
    }
  }
  async function lockTextEditorStyle(textNode, target) {
    try {
      if (!textNode || textNode.removed || textNode.characters.length === 0) return false;
      const isDeviating = (seg) => seg.fontName.family !== target.family || seg.fontName.style !== target.style || seg.fontSize !== target.size || seg.hyperlink !== null || seg.textDecoration !== "NONE" || seg.listOptions && seg.listOptions.type !== "NONE";
      const fields = ["fontName", "fontSize", "hyperlink", "textDecoration", "listOptions"];
      if (!textNode.getStyledTextSegments([...fields]).some(isDeviating)) return false;
      await figma.loadFontAsync({ family: target.family, style: target.style });
      await ensureTextNodeFontsLoaded(textNode);
      if (textNode.removed) return false;
      const segments = textNode.getStyledTextSegments([...fields]);
      for (const seg of segments) {
        if (!isDeviating(seg)) continue;
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
        if (seg.fontName.family !== target.family || seg.fontName.style !== target.style) {
          try {
            textNode.setRangeFontName(seg.start, seg.end, { family: target.family, style: target.style });
          } catch (_) {
          }
        }
        if (seg.fontSize !== target.size) {
          try {
            textNode.setRangeFontSize(seg.start, seg.end, target.size);
          } catch (_) {
          }
        }
      }
      return true;
    } catch (err) {
      console.warn("\uD14D\uC2A4\uD2B8 \uC5D0\uB514\uD130 \uC11C\uC2DD \uC7A0\uAE08 \uC2E4\uD328:", err);
      return false;
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
        if (Array.isArray(textNode.fills) && textNode.fills.length === 0) {
          try {
            textNode.setRangeFills(0, len, [titleFill]);
          } catch (_) {
          }
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
        if (Array.isArray(textNode.fills) && textNode.fills.length === 0) {
          try {
            textNode.fills = [titleFill];
          } catch (_) {
          }
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
      const rawNodeType = flowNode ? safeGetPluginData2(flowNode, "node_type") : "";
      const nType = normalizeNodeType(rawNodeType);
      const nSpec = NODE_TYPE_SHAPE_SPECS[nType] || NODE_TYPE_SHAPE_SPECS.Screen;
      const isShape = !nSpec.allowDescription;
      if (isShape) {
        textNode.textAlignHorizontal = "CENTER";
        textNode.textAlignVertical = "CENTER";
        textNode.layoutAlign = "STRETCH";
        try {
          textNode.lineHeight = { value: 18, unit: "PIXELS" };
        } catch (_) {
        }
        if (nType === "Decision") {
          const pCard = flowNode;
          const pl = pCard && typeof pCard.paddingLeft === "number" ? pCard.paddingLeft : 24;
          const pr = pCard && typeof pCard.paddingRight === "number" ? pCard.paddingRight : 24;
          const curW = pCard ? Math.max(50, pCard.width - pl - pr) : Math.max(50, textNode.width);
          try {
            textNode.resize(curW, 54);
          } catch (_) {
          }
          try {
            textNode.maxHeight = 54;
          } catch (_) {
          }
          try {
            textNode.textAutoResize = "TRUNCATE";
          } catch (_) {
          }
          try {
            textNode.textTruncation = "ENDING";
          } catch (_) {
          }
          try {
            textNode.maxLines = 3;
          } catch (_) {
          }
        } else {
          try {
            textNode.maxHeight = null;
          } catch (_) {
          }
          if (textNode.textAutoResize !== "HEIGHT") {
            textNode.textAutoResize = "HEIGHT";
          }
          textNode.textTruncation = "ENDING";
          textNode.maxLines = 3;
        }
      } else {
        if (textNode.parent && textNode.parent.type === "FRAME" && textNode.parent.name === "Header") {
          const headerFrame = textNode.parent;
          if (headerFrame.layoutMode !== "VERTICAL") {
            try {
              headerFrame.layoutMode = "VERTICAL";
            } catch (_) {
            }
          }
          headerFrame.primaryAxisSizingMode = "AUTO";
          headerFrame.primaryAxisAlignItems = "MIN";
          headerFrame.counterAxisAlignItems = "MIN";
          try {
            headerFrame.layoutSizingVertical = "HUG";
          } catch (_) {
          }
          try {
            headerFrame.layoutSizingHorizontal = "FILL";
          } catch (_) {
            try {
              headerFrame.layoutAlign = "STRETCH";
            } catch (_2) {
            }
          }
        }
        if (textNode.textAutoResize !== "HEIGHT") {
          textNode.textAutoResize = "HEIGHT";
        }
        textNode.textAlignHorizontal = "LEFT";
        textNode.textAlignVertical = "TOP";
        try {
          textNode.lineHeight = { value: 18, unit: "PIXELS" };
        } catch (_) {
        }
        textNode.layoutAlign = "STRETCH";
        try {
          textNode.layoutSizingHorizontal = "FILL";
        } catch (_) {
        }
        textNode.textTruncation = "DISABLED";
        textNode.maxLines = null;
      }
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
    const width = Math.max(SCREEN_NODE_CONSTRAINTS.MIN_WIDTH, Math.round(shape.width));
    const height = Math.max(SCREEN_NODE_CONSTRAINTS.MIN_HEIGHT, Math.round(shape.height));
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
    card.layoutMode = "VERTICAL";
    card.primaryAxisSizingMode = "FIXED";
    card.counterAxisSizingMode = "FIXED";
    card.resize(width, height);
    card.cornerRadius = 0;
    card.strokeWeight = 1.5;
    card.strokes = [{ type: "SOLID", color: borderColor }];
    card.fills = [{ type: "SOLID", color: bgColor }];
    card.strokeAlign = "INSIDE";
    if ("strokesIncludedInLayout" in card) {
      card.strokesIncludedInLayout = true;
    }
    card.clipsContent = false;
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
    headerRow.layoutMode = "VERTICAL";
    headerRow.layoutAlign = "STRETCH";
    headerRow.primaryAxisSizingMode = "AUTO";
    headerRow.counterAxisSizingMode = "AUTO";
    headerRow.primaryAxisAlignItems = "MIN";
    headerRow.counterAxisAlignItems = "MIN";
    headerRow.itemSpacing = 0;
    headerRow.fills = [];
    const titleText = figma.createText();
    titleText.name = "TitleText";
    titleText.fontName = { family: "Inter", style: "Bold" };
    titleText.fontSize = 13;
    titleText.lineHeight = { value: 18, unit: "PIXELS" };
    titleText.characters = title;
    titleText.fills = [titleFill];
    titleText.textAlignHorizontal = "LEFT";
    titleText.textAlignVertical = "TOP";
    titleText.textAutoResize = "HEIGHT";
    titleText.textTruncation = "DISABLED";
    titleText.maxLines = null;
    titleText.setPluginData("node_role", "title");
    headerRow.appendChild(titleText);
    titleText.layoutAlign = "STRETCH";
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
      if (card.layoutMode !== "NONE") {
        statusBadge.layoutPositioning = "ABSOLUTE";
      }
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
    descText.textAutoResize = "HEIGHT";
    await updateDescTextTruncation(card, descText, height, desc);
    if (stepNumber) {
      const stepBadge = figma.createFrame();
      stepBadge.name = `[Step] ${stepNumber}`;
      card.appendChild(stepBadge);
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
      const offset = 11;
      if (bCorner === "TOP_RIGHT") {
        stepBadge.x = card.width - bw + offset;
        stepBadge.y = -offset;
        stepBadge.constraints = { horizontal: "MAX", vertical: "MIN" };
      } else if (bCorner === "BOTTOM_LEFT") {
        stepBadge.x = -offset;
        stepBadge.y = card.height - bh + offset;
        stepBadge.constraints = { horizontal: "MIN", vertical: "MAX" };
      } else if (bCorner === "BOTTOM_RIGHT") {
        stepBadge.x = card.width - bw + offset;
        stepBadge.y = card.height - bh + offset;
        stepBadge.constraints = { horizontal: "MAX", vertical: "MAX" };
      } else {
        stepBadge.x = -offset;
        stepBadge.y = -offset;
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
    const connectors = figma.currentPage.findAll((n) => {
      try {
        return Boolean(n && n.type === "CONNECTOR");
      } catch (_) {
        return false;
      }
    });
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
  function getJunctionCapsulePath(w, h) {
    const r = h / 2;
    const k = r * 0.55228475;
    const straightEnd = Math.max(r, w - r);
    return `M ${r} 0 L ${straightEnd} 0 C ${straightEnd + k} 0 ${w} ${r - k} ${w} ${r} C ${w} ${r + k} ${straightEnd + k} ${h} ${straightEnd} ${h} L ${r} ${h} C ${r - k} ${h} 0 ${r + k} 0 ${r} C 0 ${r - k} ${r - k} 0 ${r} 0 Z`;
  }
  function getJunctionEllipsePath(w, h) {
    const rx = w / 2;
    const ry = h / 2;
    const kx = rx * 0.55228475;
    const ky = ry * 0.55228475;
    return `M ${rx} 0 C ${rx + kx} 0 ${w} ${ry - ky} ${w} ${ry} C ${w} ${ry + ky} ${rx + kx} ${h} ${rx} ${h} C ${rx - kx} ${h} 0 ${ry + ky} 0 ${ry} C 0 ${ry - ky} ${rx - kx} 0 ${rx} 0 Z`;
  }
  function getShapeVectorData(nodeType, w, h, branchVariant) {
    if (nodeType === "Branch") {
      const variant = branchVariant || "CIRCLE";
      if (variant === "SQUARE") {
        return `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z`;
      }
      if (variant === "DIAMOND") {
        return `M ${w / 2} 0 L ${w} ${h / 2} L ${w / 2} ${h} L 0 ${h / 2} Z`;
      }
      if (variant === "YES" || variant === "NO" || variant === "TRUE" || variant === "FALSE") {
        return getJunctionCapsulePath(w, h);
      }
      return getJunctionEllipsePath(w, h);
    }
    if (nodeType === "Connector" || nodeType === "Junction") {
      return getJunctionEllipsePath(w, h);
    }
    if (nodeType === "Decision" || nodeType === "Diamond") {
      return `M ${w / 2} 0 L ${w} ${h / 2} L ${w / 2} ${h} L 0 ${h / 2} Z`;
    }
    if (nodeType === "Terminator" || nodeType === "Pill" || nodeType === "Capsule") {
      const r = h / 2;
      const k = r * 0.55228475;
      const straightEnd = Math.max(r, w - r);
      return `M ${r} 0 L ${straightEnd} 0 C ${straightEnd + k} 0 ${w} ${r - k} ${w} ${r} C ${w} ${r + k} ${straightEnd + k} ${h} ${straightEnd} ${h} L ${r} ${h} C ${r - k} ${h} 0 ${r + k} 0 ${r} C 0 ${r - k} ${r - k} 0 ${r} 0 Z`;
    }
    return null;
  }
  var BRANCH_CHECK_MARK = "M21.2016 9.4138C21.4835 8.9309 22.1031 8.76812 22.5861 9.04987C23.069 9.33174 23.2318 9.95136 22.95 10.4344L15.8614 22.5863C15.6952 22.8711 15.4009 23.057 15.0723 23.0847C14.7435 23.1121 14.4213 22.978 14.2099 22.7247L9.14664 16.6488C8.78876 16.2193 8.84608 15.5809 9.2752 15.2227C9.70465 14.8649 10.3431 14.9222 10.7012 15.3513L14.8389 20.3177L21.2016 9.4138Z";
  var BRANCH_CROSS_MARK = "M20.347 10.2205C20.7425 9.82499 21.3835 9.82499 21.779 10.2205C22.1745 10.6159 22.1745 11.2569 21.779 11.6524L17.4317 15.9997L21.779 20.347C22.1745 20.7425 22.1745 21.3835 21.779 21.779C21.3835 22.1745 20.7425 22.1745 20.347 21.779L15.9997 17.4317L11.6524 21.779C11.2569 22.1745 10.6159 22.1745 10.2205 21.779C9.82499 21.3835 9.82499 20.7425 10.2205 20.347L14.5678 15.9997L10.2205 11.6524C9.82504 11.2569 9.82501 10.6159 10.2205 10.2205C10.6159 9.82506 11.257 9.82506 11.6524 10.2205L15.9997 14.5678L20.347 10.2205Z";
  function removeBranchMark(card) {
    for (const child of [...card.children]) {
      if (child.name === "BranchMark" || child.name === "JunctionMark") {
        child.remove();
      }
    }
  }
  function attachBranchMark(card, variant, w, h, bgColor) {
    removeBranchMark(card);
    if (variant !== "CHECK" && variant !== "CROSS") return;
    const markD = variant === "CHECK" ? BRANCH_CHECK_MARK : BRANCH_CROSS_MARK;
    const markColor = getTextFillsByBackground(bgColor).titleFill.color;
    const markHex = rgbToHexColor(markColor);
    const svgStr = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="${markD}" fill="${markHex}"/></svg>`;
    try {
      const imported = figma.createNodeFromSvg(svgStr);
      imported.name = "BranchMark";
      imported.fills = [];
      imported.strokes = [];
      imported.clipsContent = false;
      const vectors = imported.findAll((n) => n.type === "VECTOR");
      for (const vector of vectors) {
        vector.fills = [{ type: "SOLID", color: markColor }];
        vector.strokes = [];
        try {
          vector.strokeWeight = 0;
        } catch (_) {
        }
      }
      const originalParent = imported.parent;
      card.appendChild(imported);
      if (originalParent && originalParent !== card) {
        originalParent.remove();
      }
      if (card.layoutMode !== "NONE") {
        imported.layoutPositioning = "ABSOLUTE";
      }
      const scale = Math.min(w, h) / 32;
      if (Math.abs(scale - 1) > 1e-3) {
        try {
          imported.rescale(scale);
        } catch (_) {
        }
      }
      imported.x = (w - imported.width) / 2;
      imported.y = (h - imported.height) / 2;
      imported.locked = true;
    } catch (err) {
      console.error("attachBranchMark error:", err);
    }
  }
  function createShapeVectorNode(nodeType, w, h, bgColor, strokeColor, strokeWeight, branchVariant) {
    const pathD = getShapeVectorData(nodeType, w, h, branchVariant);
    if (!pathD) return null;
    const bgHex = rgbToHexColor(bgColor);
    const strokeHex = rgbToHexColor(strokeColor);
    const sw = typeof strokeWeight === "number" && strokeWeight >= 0 ? strokeWeight : 1.5;
    const strokeAttr = sw > 0 ? `stroke="${strokeHex}" stroke-width="${sw}"` : "";
    const svgStr = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="${pathD}" fill="${bgHex}" ${strokeAttr}/></svg>`;
    try {
      const imported = figma.createNodeFromSvg(svgStr);
      const vector = imported.children.find((c) => c.type === "VECTOR");
      let targetNode = imported;
      if (vector) {
        targetNode = vector;
      }
      targetNode.name = "ShapeVector";
      return targetNode;
    } catch (err) {
      console.error("createShapeVectorNode error:", err);
      return null;
    }
  }
  function attachShapeVectorNode(card, nodeType, w, h, bgColor, strokeColor, strokeWeight, insertAtBottom = false, branchVariant) {
    const shape = createShapeVectorNode(nodeType, w, h, bgColor, strokeColor, strokeWeight, branchVariant);
    if (!shape) return null;
    const originalParent = shape.parent;
    if (insertAtBottom) {
      card.insertChild(0, shape);
    } else {
      card.appendChild(shape);
    }
    if (originalParent && originalParent !== card) {
      originalParent.remove();
    }
    if (card.layoutMode !== "NONE") {
      shape.layoutPositioning = "ABSOLUTE";
    }
    shape.x = 0;
    shape.y = 0;
    shape.locked = true;
    if (branchVariant) {
      attachBranchMark(card, branchVariant, w, h, bgColor);
    } else {
      removeBranchMark(card);
    }
    return shape;
  }
  async function createFlowNode(payload) {
    try {
      await loadRequiredFonts();
      const nodeType = normalizeNodeType(payload.nodeType || "Screen");
      const branchVariant = nodeType === "Branch" ? normalizeBranchVariant(payload.branchVariant) : void 0;
      const spec = (branchVariant ? getBranchVariantSpec(branchVariant) : NODE_TYPE_SHAPE_SPECS[nodeType]) || NODE_TYPE_SHAPE_SPECS.Screen;
      const isShapeNode = !spec.allowDescription;
      const rawTitle = payload.title !== void 0 ? payload.title.trim() : branchVariant ? BRANCH_VARIANT_LABELS[branchVariant] : nodeType === "Screen" ? "Screen" : nodeType;
      const title = rawTitle;
      const width = isShapeNode ? spec.width : payload.width ? clampScreenWidth(payload.width) : spec.width;
      const height = isShapeNode ? spec.height : payload.height ? clampScreenHeight(payload.height) : spec.height;
      const defaultRadius = spec.cornerRadius !== void 0 ? spec.cornerRadius : 0;
      const cornerRadius = isShapeNode ? defaultRadius : typeof payload.cornerRadius === "number" ? clampScreenCornerRadius(payload.cornerRadius) : defaultRadius;
      const description = isShapeNode ? "" : (payload.description || "").trim();
      const theme = payload.theme || "light";
      const isDark = theme === "dark";
      const isFillNone = payload.colorHex?.toLowerCase() === "none" || payload.colorHex?.toLowerCase() === "transparent";
      let bgColor = isDark ? { r: 0.14, g: 0.14, b: 0.15 } : { r: 1, g: 1, b: 1 };
      if (!isFillNone && payload.colorHex) {
        bgColor = hexToRgbColor(payload.colorHex);
      } else if (!isFillNone && branchVariant) {
        bgColor = hexToRgbColor(getBranchVariantDefaultFill(branchVariant));
      }
      const { titleFill, descFill, isBgDark } = isFillNone ? {
        titleFill: { type: "SOLID", color: isDark ? { r: 1, g: 1, b: 1 } : { r: 0.1, g: 0.1, b: 0.1 } },
        descFill: { type: "SOLID", color: isDark ? { r: 1, g: 1, b: 1 } : { r: 0.1, g: 0.1, b: 0.1 }, opacity: 0.6 },
        isBgDark: isDark
      } : getTextFillsByBackground(bgColor, isDark);
      const borderColor = isBgDark ? { r: 0.28, g: 0.28, b: 0.3 } : { r: 0.15, g: 0.15, b: 0.18 };
      const card = figma.createFrame();
      card.name = title;
      card.layoutMode = "VERTICAL";
      card.primaryAxisSizingMode = "FIXED";
      card.counterAxisSizingMode = "FIXED";
      card.resize(width, height);
      card.cornerRadius = cornerRadius;
      const cardStrokes = typeof payload.strokeWeight === "number" && payload.strokeWeight === 0 ? [] : [{ type: "SOLID", color: payload.strokeColor ? hexToRgbColor(payload.strokeColor) : borderColor }];
      const cardStrokeWeight = branchVariant && !branchVariantUsesStroke(branchVariant) ? 0 : typeof payload.strokeWeight === "number" ? clampStrokeWeight(payload.strokeWeight) : 1.5;
      const vectorPathData = getShapeVectorData(nodeType, width, height, branchVariant);
      if (vectorPathData) {
        card.fills = [];
        card.strokes = [];
        card.strokeWeight = 0;
        card.cornerRadius = 0;
      } else {
        card.fills = isFillNone ? [] : [{ type: "SOLID", color: bgColor }];
        card.strokes = cardStrokes;
        card.strokeWeight = cardStrokeWeight;
        card.strokeAlign = "INSIDE";
        if ("strokesIncludedInLayout" in card) {
          card.strokesIncludedInLayout = true;
        }
      }
      card.clipsContent = false;
      let effectiveCreateW = width;
      const isCreateFit = !isShapeNode && payload.sizeMode === "fit";
      const isCreateHug = !isShapeNode && (payload.sizeMode === "hug" || !payload.sizeMode && nodeType === "Screen");
      card.minWidth = width;
      card.maxWidth = width;
      card.minHeight = height;
      card.maxHeight = height;
      if (isShapeNode) {
        const showBranchTitle = Boolean(branchVariant && branchVariantHasTitle(branchVariant));
        const hPad = branchVariant ? showBranchTitle ? 16 : 0 : nodeType === "Decision" ? 24 : nodeType === "Junction" || nodeType === "Connector" ? 18 : 12;
        card.paddingLeft = hPad;
        card.paddingRight = hPad;
        card.paddingTop = branchVariant ? showBranchTitle ? 5 : 0 : 12;
        card.paddingBottom = branchVariant ? showBranchTitle ? 5 : 0 : 12;
        card.primaryAxisAlignItems = "CENTER";
        card.counterAxisAlignItems = "CENTER";
        card.itemSpacing = 0;
        if (vectorPathData) {
          const strokeCol = payload.strokeColor ? hexToRgbColor(payload.strokeColor) : branchVariant ? hexToRgbColor("#1E1E1E") : borderColor;
          attachShapeVectorNode(card, nodeType, width, height, bgColor, strokeCol, cardStrokeWeight, false, branchVariant);
        }
        const titleText = figma.createText();
        titleText.name = "TitleText";
        titleText.fontName = { family: "Inter", style: "Bold" };
        titleText.fontSize = 13;
        titleText.lineHeight = { value: showBranchTitle ? 22 : 18, unit: "PIXELS" };
        titleText.characters = showBranchTitle || !branchVariant ? title : "";
        titleText.fills = [titleFill];
        titleText.textAlignHorizontal = "CENTER";
        titleText.textAlignVertical = "CENTER";
        titleText.layoutAlign = "STRETCH";
        titleText.visible = !branchVariant || showBranchTitle;
        if (nodeType === "Decision") {
          const availW = Math.max(10, width - (card.paddingLeft || 24) - (card.paddingRight || 24));
          titleText.resize(availW, 54);
          titleText.maxHeight = 54;
          titleText.textAutoResize = "TRUNCATE";
          titleText.textTruncation = "ENDING";
          titleText.maxLines = 3;
        } else {
          titleText.textAutoResize = "HEIGHT";
          titleText.textTruncation = "ENDING";
          titleText.maxLines = 3;
        }
        titleText.setPluginData("node_role", "title");
        card.appendChild(titleText);
      } else {
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
        const headerRow = figma.createFrame();
        headerRow.name = "Header";
        headerRow.layoutMode = "VERTICAL";
        headerRow.layoutAlign = "STRETCH";
        headerRow.primaryAxisSizingMode = "AUTO";
        headerRow.counterAxisSizingMode = "AUTO";
        headerRow.primaryAxisAlignItems = "MIN";
        headerRow.counterAxisAlignItems = "MIN";
        headerRow.itemSpacing = 0;
        headerRow.paddingLeft = 0;
        headerRow.paddingRight = 0;
        headerRow.paddingTop = 0;
        headerRow.paddingBottom = 0;
        headerRow.fills = [];
        const titleText = figma.createText();
        titleText.name = "TitleText";
        titleText.fontName = { family: "Inter", style: "Bold" };
        titleText.fontSize = 13;
        titleText.lineHeight = { value: 18, unit: "PIXELS" };
        titleText.characters = title;
        titleText.fills = [titleFill];
        titleText.textAutoResize = "HEIGHT";
        if (isCreateFit) {
          effectiveCreateW = await calculateScreenFitWidth(
            card,
            title,
            payload.status,
            payload.figmaLink
          );
        } else if (isCreateHug) {
          effectiveCreateW = clampScreenWidth(width);
        }
        if (isCreateFit || isCreateHug) {
          card.counterAxisSizingMode = "FIXED";
          card.minHeight = SCREEN_NODE_CONSTRAINTS.MIN_HEIGHT;
          card.maxHeight = null;
          card.minWidth = effectiveCreateW;
          card.maxWidth = effectiveCreateW;
          card.resize(effectiveCreateW, Math.max(SCREEN_NODE_CONSTRAINTS.MIN_HEIGHT, card.height));
          card.primaryAxisSizingMode = "AUTO";
          card.counterAxisSizingMode = "FIXED";
          card.setPluginData("size_mode", isCreateFit ? "fit" : "hug");
        }
        titleText.textTruncation = "DISABLED";
        titleText.maxLines = null;
        titleText.textAlignHorizontal = "LEFT";
        titleText.textAlignVertical = "TOP";
        titleText.setPluginData("node_role", "title");
        headerRow.appendChild(titleText);
        titleText.layoutAlign = "STRETCH";
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
          const descStrokeOffset = (typeof card.strokeWeight === "number" ? card.strokeWeight : 0) * 2;
          const descAvailW = Math.max(10, effectiveCreateW - card.paddingLeft - card.paddingRight - descStrokeOffset);
          descText.resize(descAvailW, descText.height);
          descText.textAutoResize = "HEIGHT";
          if (!isShapeNode && (payload.sizeMode === "fit" || payload.sizeMode === "hug")) {
            descText.maxLines = null;
            descText.textTruncation = "DISABLED";
          } else {
            await updateDescTextTruncation(card, descText, height, description, effectiveCreateW);
          }
        }
      }
      card.name = title;
      card.setPluginData("is_flow_node", "true");
      card.setPluginData("schema_version", "2");
      card.setPluginData("node_theme", theme);
      card.setPluginData("node_type", nodeType);
      if (branchVariant) {
        card.setPluginData("branch_variant", branchVariant);
      } else {
        card.setPluginData("branch_variant", "");
      }
      if (!isShapeNode) {
        if (description) card.setPluginData("node_desc", description);
        card.setPluginData("description_on", description || payload.descriptionOn ? "true" : "");
        card.setPluginData("screen_width", String(width));
        card.setPluginData("screen_height", String(height));
        card.setPluginData("screen_corner_radius", String(cornerRadius));
        card.setPluginData("screen_size_mode", payload.sizeMode || (nodeType === "Screen" ? "hug" : "fixed"));
      } else if (payload.description) {
        card.setPluginData("node_desc", payload.description);
      }
      if (!isShapeNode && payload.status) {
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
          if (card.layoutMode !== "NONE") {
            statusBadge.layoutPositioning = "ABSOLUTE";
          }
          statusBadge.constraints = { horizontal: "MAX", vertical: "MAX" };
          statusBadge.x = card.width - statusBadge.width - 10;
          statusBadge.y = card.height - statusBadge.height - 10;
        }
      }
      if (!isShapeNode) {
        await updateFigmaLinkBadge(card, payload.figmaLink, isBgDark);
        if (isCreateFit || isCreateHug) {
          const finalCreateH = Math.max(SCREEN_NODE_CONSTRAINTS.MIN_HEIGHT, Math.round(card.height));
          card.resize(effectiveCreateW, finalCreateH);
          card.primaryAxisSizingMode = "AUTO";
          card.counterAxisSizingMode = "FIXED";
          const statusBadge = card.children.find(
            (c) => safeGetPluginData2(c, "is_status_badge") === "true" || c.name === "StatusBadge"
          );
          if (statusBadge) {
            statusBadge.x = effectiveCreateW - statusBadge.width - 10;
            statusBadge.y = card.height - statusBadge.height - 10;
          }
          const linkBadge = card.children.find(
            (c) => safeGetPluginData2(c, "is_figma_link_badge") === "true" || c.name === "FigmaLinkBadge"
          );
          if (linkBadge) {
            linkBadge.x = 16;
            linkBadge.y = card.height - linkBadge.height - 10;
          }
        }
      }
      if (supportsOption(card, "elevation") && typeof payload.elevation === "number") {
        card.setPluginData("node_elevation", `${payload.elevation}`);
        card.effects = getElevationEffects(payload.elevation, isBgDark);
        card.clipsContent = false;
      } else {
        card.setPluginData("node_elevation", "");
        card.effects = [];
      }
      if (supportsOption(card, "stepBadge") && typeof payload.badgeNumber === "number" && payload.badgeNumber > 0) {
        await applyStepBadgeToSingleCard(
          card,
          payload.badgeNumber,
          payload.badgePosition || "TOP_LEFT",
          payload.badgeShape || "Square",
          payload.badgeColorMode || "Style"
        );
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
      const rawTitle = payload.title !== void 0 ? payload.title.trim() : safeGetPluginData2(flowNode, "node_title") || "";
      const title = rawTitle;
      const description = payload.description !== void 0 ? payload.description.trim() : "";
      const isDark = payload.theme === "dark";
      const isFillNone = payload.colorHex?.toLowerCase() === "none" || payload.colorHex?.toLowerCase() === "transparent";
      let bgColor = isDark ? { r: 0.14, g: 0.14, b: 0.15 } : { r: 1, g: 1, b: 1 };
      if (!isFillNone) {
        if (payload.colorHex) {
          bgColor = hexToRgbColor(payload.colorHex);
        } else {
          const currentFill = flowNode.fills;
          if (Array.isArray(currentFill) && currentFill.length > 0 && currentFill[0].type === "SOLID") {
            bgColor = currentFill[0].color;
          }
        }
      }
      const { titleFill, descFill, isBgDark } = isFillNone ? {
        titleFill: { type: "SOLID", color: isDark ? { r: 1, g: 1, b: 1 } : { r: 0.1, g: 0.1, b: 0.1 } },
        descFill: { type: "SOLID", color: isDark ? { r: 1, g: 1, b: 1 } : { r: 0.1, g: 0.1, b: 0.1 }, opacity: 0.6 },
        isBgDark: isDark
      } : getTextFillsByBackground(bgColor, isDark);
      const borderColor = isBgDark ? { r: 0.28, g: 0.28, b: 0.3 } : { r: 0.15, g: 0.15, b: 0.18 };
      const card = flowNode;
      card.minWidth = null;
      card.maxWidth = null;
      card.minHeight = null;
      card.maxHeight = null;
      const prevRawType = safeGetPluginData2(card, "node_type") || "Screen";
      const prevNodeType = normalizeNodeType(prevRawType);
      const rawType = payload.nodeType || prevRawType;
      const nodeType = normalizeNodeType(rawType);
      const branchVariant = nodeType === "Branch" ? normalizeBranchVariant(payload.branchVariant || safeGetPluginData2(card, "branch_variant")) : void 0;
      const spec = (branchVariant ? getBranchVariantSpec(branchVariant) : NODE_TYPE_SHAPE_SPECS[nodeType]) || NODE_TYPE_SHAPE_SPECS.Screen;
      const isShapeNode = !spec.allowDescription;
      const isChangingToScreen = prevNodeType !== "Screen" && nodeType === "Screen";
      const prevBranchVariant = prevNodeType === "Branch" ? normalizeBranchVariant(safeGetPluginData2(card, "branch_variant")) : void 0;
      const DEFAULT_SHAPE_NAMES = /* @__PURE__ */ new Set([
        "Decision",
        "Process",
        "Connector",
        "Terminator",
        "Branch",
        "Action",
        "System",
        "Database",
        "Square",
        "Junction",
        "Diamond",
        "Pill",
        "Capsule",
        "Check",
        "Cross",
        "Yes",
        "No",
        "True",
        "False",
        "Circle"
      ]);
      const incomingIsPlaceholder = !rawTitle || DEFAULT_SHAPE_NAMES.has(rawTitle) || (prevBranchVariant ? rawTitle === BRANCH_VARIANT_LABELS[prevBranchVariant] : false);
      const leavingUntitledBranch = prevNodeType === "Branch" && nodeType !== "Branch" && Boolean(prevBranchVariant && !branchVariantHasTitle(prevBranchVariant));
      const effectiveTitle = leavingUntitledBranch && incomingIsPlaceholder ? nodeType === "Screen" ? "Screen" : nodeType : isChangingToScreen && incomingIsPlaceholder ? "Screen" : title;
      card.name = effectiveTitle;
      card.clipsContent = false;
      const cardStrokes = typeof payload.strokeWeight === "number" && payload.strokeWeight === 0 ? [] : [{ type: "SOLID", color: payload.strokeColor ? hexToRgbColor(payload.strokeColor) : borderColor }];
      const cardStrokeWeight = branchVariant && !branchVariantUsesStroke(branchVariant) ? 0 : typeof payload.strokeWeight === "number" ? clampStrokeWeight(payload.strokeWeight) : 1.5;
      if (card.layoutMode !== "VERTICAL") {
        card.layoutMode = "VERTICAL";
      }
      const existingShapeVector = card.children.find(
        (c) => (c.name === "ShapeVector" || c.name === "DiamondShape") && c.type === "VECTOR"
      );
      const savedScreenW = safeGetPluginData2(card, "screen_width");
      const savedScreenH = safeGetPluginData2(card, "screen_height");
      const savedScreenR = safeGetPluginData2(card, "screen_corner_radius");
      const restoredScreenW = savedScreenW ? parseInt(savedScreenW, 10) : spec.width;
      const restoredScreenH = savedScreenH ? parseInt(savedScreenH, 10) : spec.height;
      const restoredScreenR = savedScreenR !== "" && savedScreenR !== void 0 ? parseInt(savedScreenR, 10) : spec.cornerRadius ?? 0;
      const prevSizeMode = safeGetPluginData2(card, "size_mode") || "fixed";
      const effectiveSizeMode = !isShapeNode && payload.sizeMode !== void 0 ? payload.sizeMode : prevSizeMode;
      const isChangingFromFitToFixed = prevSizeMode === "fit" && effectiveSizeMode === "fixed";
      const targetW = isShapeNode ? spec.width : isChangingToScreen ? payload.width ? clampScreenWidth(payload.width) : restoredScreenW ? clampScreenWidth(restoredScreenW) : spec.width : isChangingFromFitToFixed ? payload.width ? clampScreenWidth(payload.width) : restoredScreenW ? clampScreenWidth(restoredScreenW) : clampScreenWidth(card.width) : payload.width ? clampScreenWidth(payload.width) : clampScreenWidth(card.width);
      const targetH = isShapeNode ? spec.height : isChangingToScreen ? payload.height ? clampScreenHeight(payload.height) : restoredScreenH ? clampScreenHeight(restoredScreenH) : spec.height : payload.height ? clampScreenHeight(payload.height) : clampScreenHeight(card.height);
      const prevDescription = safeGetPluginData2(card, "node_desc") || "";
      const prevStatus = safeGetPluginData2(card, "workflow_status") || "";
      const prevFigmaLink = safeGetPluginData2(card, "figma_link") || safeGetPluginData2(card, "cached_figma_link") || "";
      const existingDescNode = card.children.find(
        (c) => c.name === "DescText" || safeGetPluginData2(c, "node_role") === "desc"
      );
      const isDescOn = !isShapeNode && (payload.descriptionOn !== void 0 ? payload.descriptionOn : Boolean(existingDescNode || payload.description && payload.description.trim()));
      let effectiveDesc = "";
      if (!isShapeNode) {
        if (payload.description !== void 0 && payload.description.trim() !== "") {
          effectiveDesc = payload.description.trim();
        } else if (isChangingToScreen || isDescOn) {
          effectiveDesc = prevDescription.trim();
        } else {
          effectiveDesc = (payload.description !== void 0 ? payload.description : prevDescription).trim();
        }
      }
      const effectiveStatus = !isShapeNode ? payload.status ? payload.status : isChangingToScreen ? prevStatus : payload.status ?? prevStatus : "";
      const effectiveLink = !isShapeNode ? payload.figmaLink !== void 0 && payload.figmaLink !== "" ? payload.figmaLink : (isChangingToScreen ? prevFigmaLink : payload.figmaLink ?? prevFigmaLink) || "" : "";
      const existingStatusBadgeOnCard = !isShapeNode ? card.children.find(
        (c) => safeGetPluginData2(c, "is_status_badge") === "true" || c.name === "StatusBadge"
      ) : void 0;
      const hasStatus = Boolean(existingStatusBadgeOnCard || !isShapeNode && effectiveStatus && STATUS_CONFIG[effectiveStatus]);
      const hasLink = !isShapeNode && Boolean(effectiveLink && effectiveLink.trim());
      const hasBottomBar = hasStatus || hasLink;
      let fitW;
      if (!isShapeNode && effectiveSizeMode === "fit") {
        fitW = await calculateScreenFitWidth(
          card,
          effectiveTitle,
          effectiveStatus,
          effectiveLink
        );
      }
      if (card.layoutMode !== "VERTICAL") {
        card.layoutMode = "VERTICAL";
      }
      card.counterAxisAlignItems = isShapeNode ? "CENTER" : "MIN";
      card.primaryAxisAlignItems = isShapeNode ? "CENTER" : "MIN";
      const vectorPathData = getShapeVectorData(nodeType, targetW, targetH, branchVariant);
      if (vectorPathData) {
        card.fills = [];
        card.strokes = [];
        card.strokeWeight = 0;
        card.cornerRadius = 0;
        if (existingShapeVector) {
          existingShapeVector.remove();
        }
        const strokeCol = payload.strokeColor ? hexToRgbColor(payload.strokeColor) : branchVariant ? hexToRgbColor("#1E1E1E") : borderColor;
        attachShapeVectorNode(card, nodeType, targetW, targetH, bgColor, strokeCol, cardStrokeWeight, true, branchVariant);
      } else {
        if (existingShapeVector) {
          existingShapeVector.remove();
        }
        removeBranchMark(card);
        const defaultRadius = spec.cornerRadius !== void 0 ? spec.cornerRadius : 0;
        const targetRadius = typeof payload.cornerRadius === "number" ? nodeType === "Screen" ? clampScreenCornerRadius(payload.cornerRadius) : Math.max(0, payload.cornerRadius) : isChangingToScreen && savedScreenR !== "" && savedScreenR !== void 0 ? clampScreenCornerRadius(restoredScreenR) : defaultRadius;
        card.cornerRadius = targetRadius;
        card.fills = isFillNone ? [] : [{ type: "SOLID", color: bgColor }];
        card.strokes = cardStrokes;
        card.strokeWeight = cardStrokeWeight;
        card.strokeAlign = "INSIDE";
        if ("strokesIncludedInLayout" in card) {
          card.strokesIncludedInLayout = true;
        }
      }
      if (!isShapeNode) {
        const initialW = effectiveSizeMode === "fit" && fitW !== void 0 ? fitW : targetW;
        card.primaryAxisSizingMode = "FIXED";
        card.counterAxisSizingMode = "FIXED";
        card.resize(initialW, targetH);
        card.itemSpacing = 8;
        card.paddingLeft = 16;
        card.paddingRight = 16;
        card.paddingTop = 14;
        card.paddingBottom = hasBottomBar ? 36 : isDescOn ? 16 : 14;
        card.primaryAxisAlignItems = !isDescOn && !hasBottomBar ? "CENTER" : "MIN";
        card.counterAxisAlignItems = "MIN";
      }
      if (isShapeNode) {
        const existingStatusBadge = card.children.find(
          (c) => safeGetPluginData2(c, "is_status_badge") === "true" || c.name === "StatusBadge"
        );
        if (existingStatusBadge) existingStatusBadge.remove();
        const existingLinkBadge = card.children.find(
          (c) => safeGetPluginData2(c, "is_figma_link_badge") === "true" || c.name === "FigmaLinkBadge"
        );
        if (existingLinkBadge) existingLinkBadge.remove();
      }
      let titleText = card.findOne(
        (c) => c.type === "TEXT" && (c.name === "TitleText" || safeGetPluginData2(c, "node_role") === "title")
      );
      if (isShapeNode) {
        const existingHeader = card.children.find(isHeaderFrame);
        if (existingHeader) {
          if (!titleText) {
            titleText = existingHeader.children.find((c) => c.type === "TEXT");
          }
          if (titleText && titleText.parent === existingHeader) {
            card.appendChild(titleText);
          }
          existingHeader.remove();
        }
        if (!titleText) {
          titleText = figma.createText();
          titleText.name = "TitleText";
          titleText.fontName = { family: "Inter", style: "Bold" };
          titleText.fontSize = 13;
          titleText.setPluginData("node_role", "title");
          card.appendChild(titleText);
        }
        const showBranchTitle = Boolean(branchVariant && branchVariantHasTitle(branchVariant));
        titleText.layoutAlign = "STRETCH";
        titleText.textAlignHorizontal = "CENTER";
        titleText.textAlignVertical = "CENTER";
        titleText.lineHeight = { value: showBranchTitle ? 22 : 18, unit: "PIXELS" };
        titleText.visible = !branchVariant || showBranchTitle;
        if (nodeType === "Decision") {
          const availW = Math.max(10, card.width - (card.paddingLeft || 24) - (card.paddingRight || 24));
          try {
            titleText.resize(availW, 54);
          } catch (_) {
          }
          try {
            titleText.maxHeight = 54;
          } catch (_) {
          }
          try {
            titleText.textAutoResize = "TRUNCATE";
          } catch (_) {
          }
          try {
            titleText.textTruncation = "ENDING";
          } catch (_) {
          }
          try {
            titleText.maxLines = 3;
          } catch (_) {
          }
        } else {
          try {
            titleText.maxHeight = null;
          } catch (_) {
          }
          try {
            titleText.textAutoResize = "HEIGHT";
          } catch (_) {
          }
          try {
            titleText.textTruncation = "ENDING";
          } catch (_) {
          }
          try {
            titleText.maxLines = 3;
          } catch (_) {
          }
        }
        await safeSetCharacters(titleText, branchVariant && !showBranchTitle ? "" : effectiveTitle);
        const hasExistingTitleFill = titleText.fills === figma.mixed || Array.isArray(titleText.fills) && titleText.fills.length > 0;
        if (!hasExistingTitleFill || payload.colorHex) {
          titleText.fills = [titleFill];
        }
      } else {
        const pl = typeof card.paddingLeft === "number" ? card.paddingLeft : 16;
        const pr = typeof card.paddingRight === "number" ? card.paddingRight : 16;
        let headerRow = card.children.find(isHeaderFrame);
        if (!headerRow) {
          headerRow = figma.createFrame();
          headerRow.name = "Header";
          headerRow.fills = [];
          card.insertChild(0, headerRow);
        }
        headerRow.layoutMode = "VERTICAL";
        headerRow.layoutAlign = "STRETCH";
        headerRow.primaryAxisSizingMode = "AUTO";
        headerRow.counterAxisSizingMode = "AUTO";
        headerRow.primaryAxisAlignItems = "MIN";
        headerRow.counterAxisAlignItems = "MIN";
        headerRow.itemSpacing = 0;
        headerRow.paddingLeft = 0;
        headerRow.paddingRight = 0;
        headerRow.paddingTop = 0;
        headerRow.paddingBottom = 0;
        if (!titleText) {
          titleText = figma.createText();
          titleText.name = "TitleText";
          titleText.fontName = { family: "Inter", style: "Bold" };
          titleText.fontSize = 13;
          titleText.setPluginData("node_role", "title");
          headerRow.appendChild(titleText);
        } else if (titleText.parent !== headerRow) {
          headerRow.appendChild(titleText);
        }
        titleText.visible = true;
        titleText.lineHeight = { value: 18, unit: "PIXELS" };
        titleText.textAlignHorizontal = "LEFT";
        titleText.textAlignVertical = "TOP";
        titleText.layoutAlign = "STRETCH";
        if (fitW === void 0 && !isShapeNode && effectiveSizeMode === "fit") {
          fitW = await calculateScreenFitWidth(
            card,
            effectiveTitle,
            effectiveStatus,
            effectiveLink
          );
        }
        titleText.textAutoResize = "HEIGHT";
        titleText.fontName = { family: "Inter", style: "Bold" };
        await safeSetCharacters(titleText, effectiveTitle);
        titleText.textTruncation = "DISABLED";
        titleText.maxLines = null;
        try {
          titleText.maxHeight = null;
        } catch (_) {
        }
        const hasExistingTitleFill = titleText.fills === figma.mixed || Array.isArray(titleText.fills) && titleText.fills.length > 0;
        if (!hasExistingTitleFill || payload.colorHex) {
          titleText.fills = [titleFill];
        }
      }
      let descText = card.children.find(
        (c) => c.name === "DescText" || safeGetPluginData2(c, "node_role") === "desc"
      );
      if (isShapeNode || !isDescOn || !effectiveDesc) {
        if (descText) {
          descText.remove();
          descText = void 0;
        }
      } else {
        const isNewDesc = !descText;
        if (!descText) {
          descText = figma.createText();
          descText.name = "DescText";
          descText.setPluginData("node_role", "desc");
        }
        descText.textAlignHorizontal = "LEFT";
        descText.layoutAlign = "STRETCH";
        const descStrokeOffset = (typeof card.strokeWeight === "number" ? card.strokeWeight : 0) * 2;
        const descAvailW = Math.max(10, (fitW !== void 0 ? fitW : targetW) - card.paddingLeft - card.paddingRight - descStrokeOffset);
        descText.fontName = { family: "Inter", style: "Regular" };
        descText.fontSize = 11;
        descText.characters = effectiveDesc;
        descText.textAutoResize = "HEIGHT";
        descText.resize(descAvailW, descText.height || 16);
        if (!isShapeNode && (effectiveSizeMode === "fit" || effectiveSizeMode === "hug")) {
          descText.maxLines = null;
          try {
            descText.maxHeight = null;
          } catch (_) {
          }
          descText.textTruncation = "DISABLED";
        } else if (isChangingToScreen || effectiveSizeMode === "fixed") {
          descText.textTruncation = "ENDING";
          const pb = hasBottomBar ? 36 : 16;
          const headerRow = card.children.find(isHeaderFrame);
          const headerH = headerRow ? headerRow.height : 18;
          const availableH = Math.max(14, targetH - 14 - pb - 8 - Math.round(headerH));
          descText.maxLines = Math.max(1, Math.floor(availableH / 13.5));
        } else {
          const currentH = payload.height || card.height;
          await updateDescTextTruncation(card, descText, currentH, effectiveDesc, targetW);
        }
        const hasExistingDescFill = descText.fills === figma.mixed || Array.isArray(descText.fills) && descText.fills.length > 0;
        if (!hasExistingDescFill || payload.colorHex) {
          descText.fills = [descFill];
        }
        if (isNewDesc || descText.parent !== card) {
          card.appendChild(descText);
        }
      }
      let statusBadge = !isShapeNode ? card.children.find(
        (c) => safeGetPluginData2(c, "is_status_badge") === "true" || c.name === "StatusBadge"
      ) : void 0;
      if (isShapeNode) {
        const showBranchTitle = Boolean(branchVariant && branchVariantHasTitle(branchVariant));
        const hPad = branchVariant ? showBranchTitle ? 16 : 0 : nodeType === "Decision" ? 24 : 12;
        card.paddingLeft = hPad;
        card.paddingRight = hPad;
        card.paddingTop = branchVariant ? showBranchTitle ? 5 : 0 : 12;
        card.paddingBottom = branchVariant ? showBranchTitle ? 5 : 0 : 12;
        card.primaryAxisAlignItems = "CENTER";
        card.counterAxisAlignItems = "CENTER";
        card.itemSpacing = 0;
      } else {
        card.itemSpacing = 8;
        if (!isDescOn && !hasBottomBar) {
          card.paddingLeft = 16;
          card.paddingRight = 16;
          card.paddingTop = 14;
          card.paddingBottom = 14;
          card.primaryAxisAlignItems = "CENTER";
          card.counterAxisAlignItems = "MIN";
        } else {
          card.paddingLeft = 16;
          card.paddingRight = 16;
          card.paddingTop = 14;
          card.paddingBottom = hasBottomBar ? 36 : 16;
          card.primaryAxisAlignItems = "MIN";
          card.counterAxisAlignItems = "MIN";
        }
      }
      if (!isShapeNode && effectiveStatus && STATUS_CONFIG[effectiveStatus]) {
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
          const cfg = STATUS_CONFIG[effectiveStatus];
          if (cfg) {
            badgeText.characters = cfg.label.toUpperCase();
          }
          badgeText.textAutoResize = "WIDTH_AND_HEIGHT";
          badgeText.locked = true;
          statusBadge.appendChild(badgeText);
          const badgeW = Math.round(badgeText.width + 18);
          const badgeH = Math.round(badgeText.height + 6);
          statusBadge.resize(badgeW, badgeH);
          card.appendChild(statusBadge);
          if (card.layoutMode !== "NONE") {
            statusBadge.layoutPositioning = "ABSOLUTE";
          }
          statusBadge.constraints = { horizontal: "MAX", vertical: "MAX" };
          statusBadge.locked = true;
          statusBadge.x = targetW - badgeW - 10;
          statusBadge.y = targetH - badgeH - 10;
        }
        statusBadge.paddingLeft = 9;
        statusBadge.paddingRight = 9;
        statusBadge.cornerRadius = getStatusBadgeCornerRadius(
          typeof card.cornerRadius === "number" ? card.cornerRadius : 0
        );
        statusBadge.constraints = { horizontal: "MAX", vertical: "MAX" };
        const currentStatus = effectiveStatus;
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
      if (!isShapeNode) {
        await updateFigmaLinkBadge(card, effectiveLink, isBgDark, payload.clearLinkCache);
      }
      const existingStepBadge = card.children.find(
        (c) => c.name.startsWith("[Step]") || safeGetPluginData2(c, "is_step_badge") === "true"
      );
      if (existingStepBadge) {
        const stepText = existingStepBadge.children.find((c) => c.type === "TEXT");
        if (stepText) {
          const currentMode = safeGetPluginData2(card, "badge_color_mode") || "Style";
          applyStepBadgeColors(existingStepBadge, stepText, currentMode, card);
        }
      }
      const isHug = !isShapeNode && effectiveSizeMode === "hug";
      const isFit = !isShapeNode && effectiveSizeMode === "fit";
      const finalW = isFit && fitW !== void 0 ? fitW : nodeType === "Screen" ? clampScreenWidth(targetW) : branchVariant ? targetW : Math.max(50, targetW);
      const finalH = nodeType === "Screen" ? clampScreenHeight(targetH) : branchVariant ? targetH : Math.max(40, targetH);
      card.minWidth = null;
      card.maxWidth = null;
      card.minHeight = null;
      card.maxHeight = null;
      if (isHug || isFit) {
        if (descText) {
          descText.maxLines = null;
          try {
            descText.maxHeight = null;
          } catch (_) {
          }
          descText.textTruncation = "DISABLED";
          const descStrokeOffset = (typeof card.strokeWeight === "number" ? card.strokeWeight : 0) * 2;
          const descAvailW = Math.max(10, finalW - card.paddingLeft - card.paddingRight - descStrokeOffset);
          try {
            descText.resize(descAvailW, descText.height);
          } catch (_) {
          }
        }
        const minH = nodeType === "Screen" ? SCREEN_NODE_CONSTRAINTS.MIN_HEIGHT : 49;
        card.counterAxisSizingMode = "FIXED";
        card.minWidth = finalW;
        card.maxWidth = finalW;
        card.minHeight = minH;
        card.maxHeight = null;
        card.primaryAxisSizingMode = "AUTO";
        card.resize(finalW, Math.max(minH, card.height));
        syncTitleWidthToCard(card, finalW, nodeType);
        const autoH = Math.max(minH, Math.round(card.height));
        card.resize(finalW, autoH);
        card.primaryAxisSizingMode = "AUTO";
        card.counterAxisSizingMode = "FIXED";
        card.setPluginData("size_mode", isFit ? "fit" : "hug");
      } else {
        card.primaryAxisSizingMode = "FIXED";
        card.counterAxisSizingMode = "FIXED";
        card.resize(finalW, finalH);
        card.minWidth = finalW;
        card.maxWidth = finalW;
        card.minHeight = finalH;
        card.maxHeight = finalH;
        card.setPluginData("size_mode", "fixed");
        syncTitleWidthToCard(card, finalW, nodeType);
      }
      const curH = card.height;
      if (statusBadge) {
        statusBadge.constraints = { horizontal: "MAX", vertical: "MAX" };
        statusBadge.x = finalW - statusBadge.width - 10;
        statusBadge.y = curH - statusBadge.height - 10;
      }
      const linkBadge = card.children.find(
        (c) => safeGetPluginData2(c, "is_figma_link_badge") === "true" || c.name === "FigmaLinkBadge"
      );
      if (linkBadge) {
        linkBadge.constraints = { horizontal: "MIN", vertical: "MAX" };
        linkBadge.x = 16;
        linkBadge.y = curH - linkBadge.height - 10;
      }
      const shapeVec = card.children.find(
        (c) => c.name === "ShapeVector" || c.name === "DiamondShape"
      );
      if (shapeVec) {
        shapeVec.remove();
        if (isShapeNode) {
          const strokeCol = payload.strokeColor ? hexToRgbColor(payload.strokeColor) : borderColor;
          attachShapeVectorNode(card, nodeType, finalW, finalH, bgColor, strokeCol, cardStrokeWeight, true, branchVariant);
        }
      }
      if (!supportsOption(card, "stepBadge")) {
        if (existingStepBadge) existingStepBadge.remove();
        card.setPluginData("step_number", "");
        card.setPluginData("badge_corner", "");
        card.setPluginData("badge_shape", "");
        card.setPluginData("badge_color_mode", "");
      } else if (existingStepBadge) {
        const stepCorner = safeGetPluginData2(card, "badge_corner") || "TOP_LEFT";
        const bw = Math.max(24, Math.round(existingStepBadge.width));
        const bh = 24;
        const badgeCoords = getStepBadgeCoordinates(nodeType, finalW, curH, bw, bh, stepCorner, branchVariant);
        existingStepBadge.x = badgeCoords.x;
        existingStepBadge.y = badgeCoords.y;
        existingStepBadge.constraints = badgeCoords.constraints;
      }
      card.name = effectiveTitle;
      card.setPluginData("is_flow_node", "true");
      card.setPluginData("schema_version", "2");
      card.setPluginData("node_title", "");
      card.setPluginData("node_tag", "");
      card.setPluginData("node_width", "");
      card.setPluginData("node_height", "");
      if (supportsOption(card, "description")) {
        const descToSave = effectiveDesc || prevDescription;
        card.setPluginData("node_desc", descToSave);
        card.setPluginData("description_on", isDescOn ? "true" : "");
      } else {
        card.setPluginData("node_desc", "");
      }
      if (supportsOption(card, "status")) {
        if (effectiveStatus) card.setPluginData("workflow_status", effectiveStatus);
        else card.setPluginData("workflow_status", "");
      } else {
        card.setPluginData("workflow_status", "");
      }
      if (supportsOption(card, "figmaLink")) {
        if (effectiveLink) card.setPluginData("figma_link", effectiveLink);
        else if (payload.clearLinkCache) card.setPluginData("figma_link", "");
      } else {
        card.setPluginData("figma_link", "");
      }
      if (!isShapeNode) {
        if (!isFit) {
          card.setPluginData("screen_width", String(finalW));
          card.setPluginData("screen_height", String(isHug ? Math.round(card.height) : finalH));
        }
        card.setPluginData("screen_corner_radius", String(card.cornerRadius || 0));
        card.setPluginData("screen_size_mode", payload.sizeMode || card.getPluginData("size_mode") || "fixed");
      }
      if (payload.theme) card.setPluginData("node_theme", payload.theme);
      card.setPluginData("node_type", nodeType);
      if (branchVariant) {
        card.setPluginData("branch_variant", branchVariant);
      } else if (nodeType !== "Branch") {
        card.setPluginData("branch_variant", "");
      }
      if (!supportsOption(card, "elevation")) {
        card.setPluginData("node_elevation", "");
        card.effects = [];
      } else if (typeof payload.elevation === "number") {
        card.setPluginData("node_elevation", `${payload.elevation}`);
        card.effects = getElevationEffects(payload.elevation, isBgDark);
        card.clipsContent = false;
      } else if (payload.elevation === null || payload.elevation === void 0) {
        card.setPluginData("node_elevation", "");
        card.effects = [];
      }
      const currentSel = figma.currentPage.selection;
      const isAlreadyOnlySelected = currentSel.length === 1 && currentSel[0].id === card.id;
      if (!isAlreadyOnlySelected) {
        figma.currentPage.selection = [card];
      }
      handleSelectionChange();
      notify(`[${title}] \uB178\uB4DC\uAC00 \uC5C5\uB370\uC774\uD2B8\uB418\uC5C8\uC2B5\uB2C8\uB2E4!`, "success");
    } catch (err) {
      notify(`\uB178\uB4DC \uC218\uC815 \uC2E4\uD328: ${String(err)}`, "error");
    }
  }
  async function batchUpdateFlowNodes(nodeIds, patch) {
    if (!nodeIds || nodeIds.length === 0 || !patch) return;
    try {
      await loadRequiredFonts();
      let updatedCount = 0;
      const targetCards = [];
      for (const id of nodeIds) {
        const rawNode = figma.getNodeById(id);
        if (!rawNode) continue;
        let flowNode = findFlowNode(rawNode) || rawNode;
        if (!flowNode) continue;
        if (flowNode.type === "SHAPE_WITH_TEXT") {
          flowNode = await convertShapeToFrameNode(flowNode);
        }
        if (flowNode.type === "FRAME") {
          targetCards.push(flowNode);
        }
      }
      targetCards.sort((a, b) => a.x - b.x);
      let currentBadgeNum = patch.badgeNumber !== void 0 ? patch.badgeNumber : void 0;
      for (const card of targetCards) {
        card.minWidth = null;
        card.maxWidth = null;
        card.minHeight = null;
        card.maxHeight = null;
        const prevRawType = safeGetPluginData2(card, "node_type") || "Screen";
        const prevNodeType = normalizeNodeType(prevRawType);
        const rawType = patch.nodeType || prevRawType;
        const nodeType = normalizeNodeType(rawType);
        const batchBranchVariant = nodeType === "Branch" ? normalizeBranchVariant(patch.branchVariant || safeGetPluginData2(card, "branch_variant")) : void 0;
        const spec = (batchBranchVariant ? getBranchVariantSpec(batchBranchVariant) : NODE_TYPE_SHAPE_SPECS[nodeType]) || NODE_TYPE_SHAPE_SPECS.Screen;
        const isShapeNode = !spec.allowDescription;
        const isChangingToScreen = prevNodeType !== "Screen" && nodeType === "Screen";
        const existingShapeVector = card.children.find(
          (c) => (c.name === "ShapeVector" || c.name === "DiamondShape") && (c.type === "VECTOR" || c.type === "FRAME")
        );
        const prevTheme = safeGetPluginData2(card, "node_theme") || "light";
        const isDark = prevTheme === "dark";
        let isFillNone = false;
        let bgColor = isDark ? { r: 0.14, g: 0.14, b: 0.15 } : { r: 1, g: 1, b: 1 };
        if (patch.colorHex !== void 0) {
          isFillNone = patch.colorHex.toLowerCase() === "none" || patch.colorHex.toLowerCase() === "transparent";
          if (!isFillNone) {
            bgColor = hexToRgbColor(patch.colorHex);
          }
        } else {
          if (isShapeNode && existingShapeVector && "fills" in existingShapeVector && Array.isArray(existingShapeVector.fills) && existingShapeVector.fills.length > 0 && existingShapeVector.fills[0].type === "SOLID") {
            bgColor = existingShapeVector.fills[0].color;
            isFillNone = false;
          } else {
            const currentFill = card.fills;
            if (Array.isArray(currentFill) && currentFill.length > 0 && currentFill[0].type === "SOLID") {
              bgColor = currentFill[0].color;
            } else if (!Array.isArray(currentFill) || currentFill.length === 0) {
              isFillNone = true;
            }
          }
        }
        const { titleFill, descFill, isBgDark } = isFillNone ? {
          titleFill: { type: "SOLID", color: isDark ? { r: 1, g: 1, b: 1 } : { r: 0.1, g: 0.1, b: 0.1 } },
          descFill: { type: "SOLID", color: isDark ? { r: 1, g: 1, b: 1 } : { r: 0.1, g: 0.1, b: 0.1 }, opacity: 0.6 },
          isBgDark: isDark
        } : getTextFillsByBackground(bgColor, isDark);
        const borderColor = isBgDark ? { r: 0.28, g: 0.28, b: 0.3 } : { r: 0.15, g: 0.15, b: 0.18 };
        const vectorPathData = getShapeVectorData(nodeType, card.width, card.height, batchBranchVariant);
        if (patch.colorHex !== void 0) {
          if (vectorPathData) {
            card.fills = [];
          } else if (isFillNone) {
            card.fills = [];
          } else {
            card.fills = [{ type: "SOLID", color: bgColor }];
          }
        }
        if (card.layoutMode !== "VERTICAL") {
          card.layoutMode = "VERTICAL";
        }
        card.counterAxisAlignItems = isShapeNode ? "CENTER" : "MIN";
        card.primaryAxisAlignItems = isShapeNode ? "CENTER" : "MIN";
        if (isShapeNode) {
          card.itemSpacing = 0;
        }
        let existingStrokeWeight = 1.5;
        let existingStrokeColor = null;
        if (isShapeNode && existingShapeVector) {
          if ("strokeWeight" in existingShapeVector && typeof existingShapeVector.strokeWeight === "number") {
            existingStrokeWeight = existingShapeVector.strokeWeight;
          }
          if ("strokes" in existingShapeVector && Array.isArray(existingShapeVector.strokes) && existingShapeVector.strokes.length > 0 && existingShapeVector.strokes[0]?.type === "SOLID") {
            existingStrokeColor = existingShapeVector.strokes[0].color;
          }
        } else {
          if (typeof card.strokeWeight === "number") {
            existingStrokeWeight = card.strokeWeight;
          }
          if (Array.isArray(card.strokes) && card.strokes.length > 0 && card.strokes[0]?.type === "SOLID") {
            existingStrokeColor = card.strokes[0].color;
          }
        }
        let cardStrokeWeight = existingStrokeWeight;
        if (patch.strokeWeight !== void 0 || patch.strokeColor !== void 0) {
          cardStrokeWeight = patch.strokeWeight !== void 0 ? clampStrokeWeight(patch.strokeWeight) : cardStrokeWeight;
          if (!vectorPathData) {
            if (cardStrokeWeight === 0) {
              card.strokes = [];
            } else {
              const strokeCol = patch.strokeColor ? hexToRgbColor(patch.strokeColor) : existingStrokeColor || borderColor;
              card.strokes = [{ type: "SOLID", color: strokeCol }];
              card.strokeWeight = cardStrokeWeight;
              card.strokeAlign = "INSIDE";
              if ("strokesIncludedInLayout" in card) {
                card.strokesIncludedInLayout = true;
              }
            }
          }
        }
        const prevBranchVariant = prevNodeType === "Branch" ? normalizeBranchVariant(safeGetPluginData2(card, "branch_variant")) : void 0;
        const DEFAULT_SHAPE_NAMES = /* @__PURE__ */ new Set([
          "Decision",
          "Process",
          "Connector",
          "Terminator",
          "Branch",
          "Action",
          "System",
          "Database",
          "Square",
          "Junction",
          "Diamond",
          "Pill",
          "Capsule",
          "Check",
          "Cross",
          "Yes",
          "No",
          "True",
          "False",
          "Circle"
        ]);
        const currentTitle = card.name || "Untitled";
        const incomingIsPlaceholder = !currentTitle || currentTitle === "Untitled" || DEFAULT_SHAPE_NAMES.has(currentTitle) || (prevBranchVariant ? currentTitle === BRANCH_VARIANT_LABELS[prevBranchVariant] : false);
        const leavingUntitledBranch = prevNodeType === "Branch" && nodeType !== "Branch" && Boolean(prevBranchVariant && !branchVariantHasTitle(prevBranchVariant));
        let effectiveTitle = currentTitle;
        if (leavingUntitledBranch && incomingIsPlaceholder || isChangingToScreen && incomingIsPlaceholder) {
          effectiveTitle = nodeType === "Screen" ? "Screen" : nodeType;
          card.name = effectiveTitle;
        } else if (patch.nodeType !== void 0 && !isChangingToScreen && DEFAULT_SHAPE_NAMES.has(currentTitle)) {
          effectiveTitle = nodeType;
          card.name = effectiveTitle;
        }
        card.clipsContent = false;
        const savedScreenW = safeGetPluginData2(card, "screen_width");
        const savedScreenH = safeGetPluginData2(card, "screen_height");
        const savedScreenR = safeGetPluginData2(card, "screen_corner_radius");
        const restoredScreenW = savedScreenW ? parseInt(savedScreenW, 10) : spec.width;
        const restoredScreenH = savedScreenH ? parseInt(savedScreenH, 10) : spec.height;
        const restoredScreenR = savedScreenR !== "" && savedScreenR !== void 0 ? parseInt(savedScreenR, 10) : spec.cornerRadius ?? 0;
        const prevSizeMode = safeGetPluginData2(card, "size_mode") || "fixed";
        const effectiveSizeMode = patch.sizeMode !== void 0 ? patch.sizeMode : prevSizeMode;
        let targetW;
        let targetH;
        let targetR;
        if (isShapeNode) {
          targetW = spec.width;
          targetH = spec.height;
          targetR = spec.cornerRadius ?? 0;
        } else if (isChangingToScreen) {
          targetW = patch.width !== void 0 ? clampScreenWidth(patch.width) : clampScreenWidth(restoredScreenW);
          targetH = patch.height !== void 0 ? clampScreenHeight(patch.height) : clampScreenHeight(restoredScreenH);
          targetR = patch.cornerRadius !== void 0 ? clampScreenCornerRadius(patch.cornerRadius) : clampScreenCornerRadius(restoredScreenR);
        } else {
          targetW = patch.width !== void 0 ? clampScreenWidth(patch.width) : card.width;
          targetH = patch.height !== void 0 ? clampScreenHeight(patch.height) : card.height;
          targetR = patch.cornerRadius !== void 0 ? clampScreenCornerRadius(patch.cornerRadius) : typeof card.cornerRadius === "number" ? card.cornerRadius : 0;
        }
        if (nodeType === "Screen" || nodeType === "Process" || nodeType === "Branch") {
          card.cornerRadius = targetR;
        } else {
          card.cornerRadius = spec.cornerRadius ?? 0;
        }
        const pl = isShapeNode ? 12 : 16;
        const pr = isShapeNode ? 12 : 16;
        const pt = isShapeNode ? 12 : 14;
        card.paddingLeft = pl;
        card.paddingRight = pr;
        card.paddingTop = pt;
        const hasBottomBar = Boolean(safeGetPluginData2(card, "workflow_status") || patch.status || safeGetPluginData2(card, "figma_link") || patch.figmaLink);
        card.paddingBottom = hasBottomBar ? 36 : isShapeNode ? 12 : 16;
        let titleText = card.findOne(
          (c) => c.type === "TEXT" && (c.name === "TitleText" || safeGetPluginData2(c, "node_role") === "title")
        );
        if (isShapeNode) {
          const existingHeader = card.children.find(isHeaderFrame);
          if (existingHeader) {
            if (!titleText) {
              titleText = existingHeader.children.find((c) => c.type === "TEXT");
            }
            if (titleText && titleText.parent === existingHeader) {
              card.appendChild(titleText);
            }
            existingHeader.remove();
          }
          if (!titleText) {
            titleText = figma.createText();
            titleText.name = "TitleText";
            titleText.fontName = { family: "Inter", style: "Bold" };
            titleText.fontSize = 13;
            titleText.setPluginData("node_role", "title");
            card.appendChild(titleText);
          }
          titleText.layoutAlign = "STRETCH";
          titleText.textAlignHorizontal = "CENTER";
          titleText.textAlignVertical = "CENTER";
          titleText.lineHeight = { value: 18, unit: "PIXELS" };
          titleText.textAutoResize = "HEIGHT";
          const showBatchBranchTitle = Boolean(batchBranchVariant && branchVariantHasTitle(batchBranchVariant));
          titleText.visible = !batchBranchVariant || showBatchBranchTitle;
        } else {
          let headerRow = card.children.find(isHeaderFrame);
          if (!headerRow) {
            headerRow = figma.createFrame();
            headerRow.name = "Header";
            headerRow.fills = [];
            headerRow.layoutMode = "VERTICAL";
            headerRow.layoutAlign = "STRETCH";
            headerRow.primaryAxisSizingMode = "AUTO";
            headerRow.counterAxisSizingMode = "AUTO";
            headerRow.primaryAxisAlignItems = "MIN";
            headerRow.counterAxisAlignItems = "MIN";
            headerRow.itemSpacing = 0;
            headerRow.paddingLeft = 0;
            headerRow.paddingRight = 0;
            headerRow.paddingTop = 0;
            headerRow.paddingBottom = 0;
            card.appendChild(headerRow);
          } else {
            headerRow.layoutMode = "VERTICAL";
            headerRow.layoutAlign = "STRETCH";
            headerRow.primaryAxisSizingMode = "AUTO";
            headerRow.counterAxisSizingMode = "AUTO";
            headerRow.paddingLeft = 0;
            headerRow.paddingRight = 0;
            headerRow.paddingTop = 0;
            headerRow.paddingBottom = 0;
          }
          if (!titleText) {
            titleText = figma.createText();
            titleText.name = "TitleText";
            titleText.fontName = { family: "Inter", style: "Bold" };
            titleText.fontSize = 13;
            titleText.setPluginData("node_role", "title");
            headerRow.appendChild(titleText);
          } else if (titleText.parent !== headerRow) {
            headerRow.appendChild(titleText);
          }
          titleText.lineHeight = { value: 18, unit: "PIXELS" };
          titleText.textAlignHorizontal = "LEFT";
          titleText.textAlignVertical = "TOP";
          titleText.layoutAlign = "STRETCH";
          titleText.textAutoResize = "HEIGHT";
          titleText.visible = true;
        }
        const prevDesc = safeGetPluginData2(card, "node_desc") || "";
        const existingDescChild = card.children.find(
          (c) => c.name === "DescText" || safeGetPluginData2(c, "node_role") === "desc"
        );
        const isDescOn = !isShapeNode && (patch.descriptionOn !== void 0 ? patch.descriptionOn : patch.description !== void 0 ? Boolean(patch.description.trim()) : Boolean(existingDescChild || prevDesc.trim()));
        let effectiveDesc = "";
        if (!isShapeNode) {
          if (patch.description !== void 0 && patch.description.trim() !== "") {
            effectiveDesc = patch.description.trim();
          } else if (isChangingToScreen || isDescOn) {
            effectiveDesc = prevDesc.trim();
          } else {
            effectiveDesc = (patch.description !== void 0 ? patch.description : prevDesc).trim();
          }
        }
        let fitW;
        if (!isShapeNode && effectiveSizeMode === "fit") {
          const effectiveStatus = patch.status !== void 0 ? patch.status : safeGetPluginData2(card, "workflow_status") || void 0;
          const effectiveLink = patch.figmaLink !== void 0 ? patch.figmaLink : safeGetPluginData2(card, "figma_link") || void 0;
          fitW = await calculateScreenFitWidth(
            card,
            effectiveTitle,
            effectiveStatus,
            effectiveLink
          );
          titleText.textAutoResize = "HEIGHT";
          await safeSetCharacters(titleText, effectiveTitle);
        } else {
          await safeSetCharacters(titleText, effectiveTitle);
        }
        if (patch.colorHex !== void 0) {
          titleText.fills = [titleFill];
        }
        let descText = card.children.find(
          (c) => c.name === "DescText" || safeGetPluginData2(c, "node_role") === "desc"
        );
        if (!supportsOption(card, "description") || !isDescOn || !effectiveDesc) {
          if (descText) {
            descText.remove();
            descText = void 0;
          }
        } else {
          if (!descText) {
            descText = figma.createText();
            descText.name = "DescText";
            descText.setPluginData("node_role", "desc");
            card.appendChild(descText);
          }
          descText.textAlignHorizontal = "LEFT";
          descText.layoutAlign = "STRETCH";
          descText.fontName = { family: "Inter", style: "Regular" };
          descText.fontSize = 11;
          descText.characters = effectiveDesc;
          descText.textAutoResize = "HEIGHT";
          if (patch.colorHex !== void 0) {
            descText.fills = [descFill];
          }
          if (!isShapeNode && (effectiveSizeMode === "fit" || effectiveSizeMode === "hug")) {
            descText.maxLines = null;
            try {
              descText.maxHeight = null;
            } catch (_) {
            }
            descText.textTruncation = "DISABLED";
          } else {
            await updateDescTextTruncation(card, descText, targetH, effectiveDesc, targetW);
          }
        }
        let statusBadge = card.children.find(
          (c) => safeGetPluginData2(c, "is_status_badge") === "true" || c.name === "StatusBadge"
        );
        if (!supportsOption(card, "status")) {
          if (statusBadge) {
            statusBadge.remove();
            statusBadge = void 0;
          }
        } else if (patch.status !== void 0) {
          if (!patch.status) {
            card.setPluginData("workflow_status", "");
            card.paddingBottom = 16;
            if (statusBadge) {
              statusBadge.remove();
              statusBadge = void 0;
            }
          } else {
            card.setPluginData("workflow_status", patch.status);
            card.paddingBottom = 36;
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
              card.appendChild(statusBadge);
              const bText2 = figma.createText();
              bText2.name = "StatusText";
              bText2.fontName = { family: "Inter", style: "Bold" };
              bText2.fontSize = 9;
              bText2.textAutoResize = "WIDTH_AND_HEIGHT";
              statusBadge.appendChild(bText2);
            }
            if (statusBadge.layoutPositioning !== "ABSOLUTE") {
              statusBadge.layoutPositioning = "ABSOLUTE";
            }
            const { badgeBg, badgeTextColor } = getStatusBadgeColors(patch.status, bgColor, isDark);
            statusBadge.fills = [{ type: "SOLID", color: badgeBg }];
            statusBadge.cornerRadius = getStatusBadgeCornerRadius(
              typeof card.cornerRadius === "number" ? card.cornerRadius : 0
            );
            statusBadge.locked = true;
            const bText = statusBadge.children.find((c) => c.type === "TEXT");
            if (bText) {
              bText.locked = false;
              const statusLabel = STATUS_CONFIG[patch.status]?.label || patch.status;
              await safeSetCharacters(bText, statusLabel.toUpperCase());
              bText.fills = [{ type: "SOLID", color: badgeTextColor }];
              bText.locked = true;
            }
          }
        } else if (statusBadge && patch.colorHex !== void 0) {
          const curStatus = safeGetPluginData2(card, "workflow_status");
          if (curStatus && STATUS_CONFIG[curStatus]) {
            const { badgeBg, badgeTextColor } = getStatusBadgeColors(curStatus, bgColor, isDark);
            statusBadge.fills = [{ type: "SOLID", color: badgeBg }];
            const bText = statusBadge.children.find((c) => c.type === "TEXT");
            if (bText) bText.fills = [{ type: "SOLID", color: badgeTextColor }];
          }
        }
        if (supportsOption(card, "figmaLink")) {
          const effectiveLink = patch.figmaLink !== void 0 ? patch.figmaLink : safeGetPluginData2(card, "figma_link") || "";
          if (patch.figmaLink !== void 0 || patch.clearLinkCache || patch.colorHex !== void 0) {
            await updateFigmaLinkBadge(card, effectiveLink, isBgDark, patch.clearLinkCache);
          }
        }
        if (supportsOption(card, "elevation")) {
          if (patch.elevation !== void 0) {
            if (patch.elevation === null) {
              card.setPluginData("node_elevation", "");
              card.effects = [];
            } else {
              card.setPluginData("node_elevation", `${patch.elevation}`);
              card.effects = getElevationEffects(patch.elevation, isBgDark);
              card.clipsContent = false;
            }
          } else if (patch.colorHex !== void 0) {
            const curElev = safeGetPluginData2(card, "node_elevation");
            if (curElev) {
              const lvl = parseInt(curElev, 10);
              if (!isNaN(lvl)) card.effects = getElevationEffects(lvl, isBgDark);
            }
          }
        }
        const existingStepBadge = card.children.find(
          (c) => c.name.startsWith("[Step]") || safeGetPluginData2(c, "is_step_badge") === "true"
        );
        if (!supportsOption(card, "stepBadge")) {
          if (existingStepBadge) existingStepBadge.remove();
          card.setPluginData("step_number", "");
          card.setPluginData("badge_corner", "");
          card.setPluginData("badge_shape", "");
          card.setPluginData("badge_color_mode", "");
        } else if (patch.badgeOn === false) {
          card.setPluginData("step_number", "");
          card.setPluginData("badge_corner", "");
          card.setPluginData("badge_shape", "");
          card.setPluginData("badge_color_mode", "");
          if (existingStepBadge) existingStepBadge.remove();
        } else if (patch.badgeOn === true || patch.badgeNumber !== void 0 || patch.badgeCorner !== void 0 || patch.badgeShape !== void 0 || patch.badgeColorMode !== void 0) {
          const curNum = safeGetPluginData2(card, "step_number") ? parseInt(safeGetPluginData2(card, "step_number"), 10) : 1;
          const curCorner = safeGetPluginData2(card, "badge_corner") || "TOP_LEFT";
          const curShape = safeGetPluginData2(card, "badge_shape") || "Square";
          const curMode = safeGetPluginData2(card, "badge_color_mode") || "Style";
          const finalNum = currentBadgeNum !== void 0 ? currentBadgeNum++ : curNum;
          const finalCorner = patch.badgeCorner !== void 0 ? patch.badgeCorner : curCorner;
          const finalShape = patch.badgeShape !== void 0 ? patch.badgeShape : curShape;
          const finalMode = patch.badgeColorMode !== void 0 ? patch.badgeColorMode : curMode;
          await applyStepBadgeToSingleCard(card, finalNum, finalCorner, finalShape, finalMode);
        } else if (existingStepBadge && patch.colorHex !== void 0) {
          const stepText = existingStepBadge.children.find((c) => c.type === "TEXT");
          if (stepText) {
            const currentMode = safeGetPluginData2(card, "badge_color_mode") || "Style";
            applyStepBadgeColors(existingStepBadge, stepText, currentMode, card);
          }
        }
        const isHug = nodeType === "Screen" && effectiveSizeMode === "hug";
        const isFit = nodeType === "Screen" && effectiveSizeMode === "fit";
        const finalW = isFit && fitW !== void 0 ? fitW : nodeType === "Screen" ? clampScreenWidth(targetW) : batchBranchVariant ? targetW : Math.max(50, targetW);
        const finalH = nodeType === "Screen" ? clampScreenHeight(targetH) : batchBranchVariant ? targetH : Math.max(40, targetH);
        card.minWidth = null;
        card.maxWidth = null;
        card.minHeight = null;
        card.maxHeight = null;
        if (isHug || isFit) {
          if (descText) {
            descText.maxLines = null;
            try {
              descText.maxHeight = null;
            } catch (_) {
            }
            descText.textTruncation = "DISABLED";
            const descStrokeOffset = (typeof card.strokeWeight === "number" ? card.strokeWeight : 0) * 2;
            const descAvailW = Math.max(10, finalW - card.paddingLeft - card.paddingRight - descStrokeOffset);
            try {
              descText.resize(descAvailW, descText.height);
            } catch (_) {
            }
          }
          const minH = nodeType === "Screen" ? SCREEN_NODE_CONSTRAINTS.MIN_HEIGHT : 49;
          card.counterAxisSizingMode = "FIXED";
          card.minWidth = finalW;
          card.maxWidth = finalW;
          card.minHeight = minH;
          card.maxHeight = null;
          card.primaryAxisSizingMode = "AUTO";
          card.resize(finalW, Math.max(minH, card.height));
          syncTitleWidthToCard(card, finalW, nodeType);
          const autoH = Math.max(minH, Math.round(card.height));
          card.resize(finalW, autoH);
          card.primaryAxisSizingMode = "AUTO";
          card.counterAxisSizingMode = "FIXED";
          card.setPluginData("size_mode", isFit ? "fit" : "hug");
        } else {
          card.primaryAxisSizingMode = "FIXED";
          card.counterAxisSizingMode = "FIXED";
          card.resize(finalW, finalH);
          card.minWidth = finalW;
          card.maxWidth = finalW;
          card.minHeight = finalH;
          card.maxHeight = finalH;
          card.setPluginData("size_mode", effectiveSizeMode);
          syncTitleWidthToCard(card, finalW, nodeType);
        }
        if (statusBadge) {
          statusBadge.constraints = { horizontal: "MAX", vertical: "MAX" };
          statusBadge.x = finalW - statusBadge.width - 10;
          statusBadge.y = card.height - statusBadge.height - 10;
        }
        const linkBadge = card.children.find(
          (c) => safeGetPluginData2(c, "is_figma_link_badge") === "true" || c.name === "FigmaLinkBadge"
        );
        if (linkBadge) {
          linkBadge.constraints = { horizontal: "MIN", vertical: "MAX" };
          linkBadge.x = 16;
          linkBadge.y = card.height - linkBadge.height - 10;
        }
        const shapeVec = card.children.find(
          (c) => (c.name === "ShapeVector" || c.name === "DiamondShape") && (c.type === "VECTOR" || c.type === "FRAME")
        );
        if (!isShapeNode) {
          if (shapeVec) {
            shapeVec.remove();
          }
        } else {
          const shouldRecreateShapeVector = !shapeVec || patch.nodeType !== void 0 || patch.width !== void 0 || patch.height !== void 0 || patch.colorHex !== void 0 || patch.strokeWeight !== void 0 || patch.strokeColor !== void 0;
          if (shouldRecreateShapeVector) {
            if (shapeVec) {
              shapeVec.remove();
            }
            const defaultStrokeCol = existingStrokeColor || borderColor;
            const strokeCol = patch.strokeColor ? hexToRgbColor(patch.strokeColor) : defaultStrokeCol;
            attachShapeVectorNode(card, nodeType, finalW, finalH, bgColor, strokeCol, cardStrokeWeight, true, batchBranchVariant);
          }
        }
        const curStepBadge = card.children.find(
          (c) => c.name.startsWith("[Step]") || safeGetPluginData2(c, "is_step_badge") === "true"
        );
        if (curStepBadge) {
          const stepCorner = safeGetPluginData2(card, "badge_corner") || "TOP_LEFT";
          const bw = Math.max(24, Math.round(curStepBadge.width));
          const bh = 24;
          const badgeCoords = getStepBadgeCoordinates(nodeType, finalW, card.height, bw, bh, stepCorner, batchBranchVariant);
          curStepBadge.x = badgeCoords.x;
          curStepBadge.y = badgeCoords.y;
          curStepBadge.constraints = badgeCoords.constraints;
        }
        card.setPluginData("is_flow_node", "true");
        card.setPluginData("schema_version", "2");
        if (nodeType === "Screen") {
          if (!isFit) {
            card.setPluginData("screen_width", String(finalW));
            card.setPluginData("screen_height", String(isHug ? Math.round(card.height) : finalH));
          }
          card.setPluginData("screen_corner_radius", String(targetR));
          card.setPluginData("screen_size_mode", effectiveSizeMode);
          if (supportsOption(card, "description")) {
            const descToSave = effectiveDesc || prevDesc;
            card.setPluginData("node_desc", descToSave);
          } else {
            card.setPluginData("node_desc", "");
          }
          if (patch.figmaLink !== void 0) card.setPluginData("figma_link", patch.figmaLink);
        } else {
          if (supportsOption(card, "description")) {
            const descToSave = effectiveDesc || prevDesc;
            card.setPluginData("node_desc", descToSave);
          } else {
            card.setPluginData("node_desc", "");
          }
          if (patch.figmaLink !== void 0) card.setPluginData("figma_link", patch.figmaLink);
        }
        if (patch.nodeType !== void 0) {
          card.setPluginData("node_type", nodeType);
        }
        if (batchBranchVariant) {
          card.setPluginData("branch_variant", batchBranchVariant);
        } else if (nodeType !== "Branch") {
          card.setPluginData("branch_variant", "");
        }
        updatedCount++;
      }
      handleSelectionChange();
      if (updatedCount > 0) {
        notify(`${updatedCount}\uAC1C \uB178\uB4DC\uAC00 \uC5C5\uB370\uC774\uD2B8\uB418\uC5C8\uC2B5\uB2C8\uB2E4!`, "success");
      }
    } catch (err) {
      notify(`\uB2E4\uC911 \uB178\uB4DC \uC5C5\uB370\uC774\uD2B8 \uC2E4\uD328: ${String(err)}`, "error");
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
      const frame = flowNode;
      frame.minWidth = null;
      frame.maxWidth = null;
      frame.minHeight = null;
      frame.maxHeight = null;
      const rawNodeType = safeGetPluginData2(frame, "node_type");
      const nType = normalizeNodeType(rawNodeType);
      const nSpec = NODE_TYPE_SHAPE_SPECS[nType] || NODE_TYPE_SHAPE_SPECS.Screen;
      const isShape = !nSpec.allowDescription;
      const w = nType === "Screen" ? clampScreenWidth(width) : Math.max(120, width);
      const h = nType === "Screen" ? clampScreenHeight(height) : Math.max(50, height);
      if (frame.layoutMode !== "VERTICAL") {
        frame.layoutMode = "VERTICAL";
      }
      const targetAlign = isShape ? "CENTER" : "MIN";
      if (frame.counterAxisAlignItems !== targetAlign) {
        frame.counterAxisAlignItems = targetAlign;
      }
      if (frame.primaryAxisAlignItems !== targetAlign) {
        frame.primaryAxisAlignItems = targetAlign;
      }
      frame.resize(w, h);
      frame.primaryAxisSizingMode = "FIXED";
      frame.counterAxisSizingMode = "FIXED";
      frame.clipsContent = false;
      frame.minWidth = w;
      frame.maxWidth = w;
      frame.minHeight = h;
      frame.maxHeight = h;
      const title = frame.findOne(
        (c) => c.type === "TEXT" && (c.name === "TitleText" || safeGetPluginData2(c, "node_role") === "title")
      );
      if (title) {
        title.textAlignHorizontal = isShape ? "CENTER" : "LEFT";
        title.textAlignVertical = "CENTER";
        try {
          title.lineHeight = { value: 18, unit: "PIXELS" };
        } catch (_) {
        }
        if (nType === "Decision") {
          const pl = typeof frame.paddingLeft === "number" ? frame.paddingLeft : 24;
          const pr = typeof frame.paddingRight === "number" ? frame.paddingRight : 24;
          const curW = Math.max(50, w - pl - pr);
          try {
            title.resize(curW, 54);
          } catch (_) {
          }
          try {
            title.maxHeight = 54;
          } catch (_) {
          }
          try {
            title.textAutoResize = "TRUNCATE";
          } catch (_) {
          }
          try {
            title.textTruncation = "ENDING";
          } catch (_) {
          }
          try {
            title.maxLines = 3;
          } catch (_) {
          }
        } else {
          try {
            title.maxHeight = null;
          } catch (_) {
          }
          if (isShape) {
            if (title.textAutoResize !== "HEIGHT") {
              title.textAutoResize = "HEIGHT";
            }
            title.textTruncation = "ENDING";
            title.maxLines = 3;
          } else {
            const headerRow = frame.children.find(isHeaderFrame);
            if (headerRow) {
              headerRow.layoutMode = "VERTICAL";
              headerRow.primaryAxisSizingMode = "AUTO";
              headerRow.primaryAxisAlignItems = "MIN";
              headerRow.counterAxisAlignItems = "MIN";
              try {
                headerRow.layoutSizingVertical = "HUG";
              } catch (_) {
              }
              try {
                headerRow.layoutSizingHorizontal = "FILL";
              } catch (_) {
                try {
                  headerRow.layoutAlign = "STRETCH";
                } catch (_2) {
                }
              }
            }
            if (title.layoutGrow !== 0) {
              try {
                title.layoutGrow = 0;
              } catch (_) {
              }
            }
            if (title.layoutAlign !== "STRETCH") {
              try {
                title.layoutAlign = "STRETCH";
              } catch (_) {
              }
            }
            title.textAutoResize = "HEIGHT";
            title.textTruncation = "DISABLED";
            title.maxLines = null;
            title.textAlignVertical = "TOP";
          }
        }
      }
      const shapeVec = frame.children.find(
        (c) => c.name === "ShapeVector" || c.name === "DiamondShape"
      );
      if (shapeVec) {
        let curBgColor = { r: 1, g: 1, b: 1 };
        let curStrokeColor = { r: 0.15, g: 0.15, b: 0.18 };
        let curStrokeWeight = 1.5;
        if ("fills" in shapeVec && Array.isArray(shapeVec.fills) && shapeVec.fills.length > 0 && shapeVec.fills[0].type === "SOLID") {
          curBgColor = shapeVec.fills[0].color;
        }
        if ("strokes" in shapeVec && Array.isArray(shapeVec.strokes) && shapeVec.strokes.length > 0 && shapeVec.strokes[0].type === "SOLID") {
          curStrokeColor = shapeVec.strokes[0].color;
        }
        if ("strokeWeight" in shapeVec && typeof shapeVec.strokeWeight === "number") {
          curStrokeWeight = shapeVec.strokeWeight;
        }
        shapeVec.remove();
        const frameBranchVariant = nType === "Branch" ? normalizeBranchVariant(safeGetPluginData2(frame, "branch_variant")) : void 0;
        attachShapeVectorNode(frame, nType, w, h, curBgColor, curStrokeColor, curStrokeWeight, true, frameBranchVariant);
      }
      if (nType === "Screen") {
        frame.strokeAlign = "INSIDE";
        if ("strokesIncludedInLayout" in frame) {
          frame.strokesIncludedInLayout = true;
        }
      }
      const statusBadge = frame.children.find(
        (c) => safeGetPluginData2(c, "is_status_badge") === "true" || c.name === "StatusBadge"
      );
      const hasStatus = Boolean(statusBadge);
      frame.paddingBottom = hasStatus ? 36 : 16;
      const desc = frame.children.find(
        (c) => c.name === "DescText" || safeGetPluginData2(c, "node_role") === "desc"
      );
      if (desc) {
        desc.textAlignHorizontal = "LEFT";
        desc.layoutAlign = "STRETCH";
        const pl = typeof frame.paddingLeft === "number" ? frame.paddingLeft : 16;
        const pr = typeof frame.paddingRight === "number" ? frame.paddingRight : 16;
        const strokeOffset = (typeof frame.strokeWeight === "number" ? frame.strokeWeight : 0) * 2;
        const availW = Math.max(10, w - pl - pr - strokeOffset);
        if (Math.abs(desc.width - availW) > 1) {
          try {
            desc.resize(availW, desc.height);
          } catch (_) {
          }
        }
        desc.textAutoResize = "HEIGHT";
        await updateDescTextTruncation(frame, desc, h, void 0, w);
      }
      if (statusBadge) {
        statusBadge.constraints = { horizontal: "MAX", vertical: "MAX" };
        statusBadge.x = w - statusBadge.width - 10;
        statusBadge.y = h - statusBadge.height - 10;
      }
      const stepBadge = frame.children.find(
        (c) => c.name.startsWith("[Step]") || safeGetPluginData2(c, "is_step_badge") === "true"
      );
      if (stepBadge) {
        const stepCorner = safeGetPluginData2(frame, "badge_corner") || "TOP_LEFT";
        const bw = Math.max(24, Math.round(stepBadge.width));
        const bh = 24;
        const badgeCoords = getStepBadgeCoordinates(
          nType,
          w,
          h,
          bw,
          bh,
          stepCorner,
          nType === "Branch" ? normalizeBranchVariant(safeGetPluginData2(frame, "branch_variant")) : void 0
        );
        stepBadge.x = badgeCoords.x;
        stepBadge.y = badgeCoords.y;
        stepBadge.constraints = badgeCoords.constraints;
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
      const targetSourceId = sourceNode.id;
      const targetDestId = targetNode.id;
      let existingConnector = null;
      try {
        const matchNode = figma.currentPage.findOne((n) => {
          try {
            if (!n) return false;
            if (n.type === "CONNECTOR") {
              const conn = n;
              const cSrc = conn.connectorStart && "endpointNodeId" in conn.connectorStart ? conn.connectorStart.endpointNodeId : void 0;
              const cTgt = conn.connectorEnd && "endpointNodeId" in conn.connectorEnd ? conn.connectorEnd.endpointNodeId : void 0;
              return (cSrc === targetSourceId || cSrc === payload.sourceNodeId) && (cTgt === targetDestId || cTgt === payload.targetNodeId);
            }
            if (n.type === "GROUP" || n.type === "VECTOR") {
              const isCustom = safeGetPluginData2(n, "is_custom_connector") === "true" || safeGetPluginData2(n, "is_flow_connector") === "true";
              if (!isCustom) return false;
              if (safeGetPluginData2(n, "is_connector_label") === "true" || n.name === "ConnectorLabel") return false;
              let cSrc = safeGetPluginData2(n, "source_node_id");
              let cTgt = safeGetPluginData2(n, "target_node_id");
              if ((!cSrc || !cTgt) && n.type === "GROUP") {
                const vChild = n.findOne((child) => child.type === "VECTOR");
                if (vChild) {
                  cSrc = cSrc || safeGetPluginData2(vChild, "source_node_id");
                  cTgt = cTgt || safeGetPluginData2(vChild, "target_node_id");
                }
              }
              return (cSrc === targetSourceId || cSrc === payload.sourceNodeId) && (cTgt === targetDestId || cTgt === payload.targetNodeId);
            }
            return false;
          } catch (_) {
            return false;
          }
        });
        if (matchNode) {
          existingConnector = findConnectorNode(matchNode) || matchNode;
        }
      } catch (err) {
        console.warn("\uAE30\uC874 \uCEE4\uB125\uD130 \uD0D0\uC0C9 \uC911 \uC624\uB958 (\uC0DD\uC131 \uACC4\uC18D \uC9C4\uD589):", err);
      }
      if (existingConnector && existingConnector.id !== sourceNode.id && existingConnector.id !== targetNode.id) {
        try {
          existingConnector.remove();
        } catch (err) {
          console.warn("\uAE30\uC874 \uCEE4\uB125\uD130 \uC81C\uAC70 \uC2E4\uD328:", err);
        }
      }
      let sourceMagnet = payload.sourceMagnet;
      let targetMagnet = payload.targetMagnet;
      if (!sourceMagnet || !targetMagnet) {
        const optimal = getOptimalMagnetPair(
          {
            x: sourceNode.x,
            y: sourceNode.y,
            width: sourceNode.width,
            height: sourceNode.height
          },
          {
            x: targetNode.x,
            y: targetNode.y,
            width: targetNode.width,
            height: targetNode.height
          }
        );
        sourceMagnet = optimal.sourceMagnet;
        targetMagnet = optimal.targetMagnet;
      }
      const connector = await createSingleConnector(
        sourceNode,
        sourceMagnet,
        targetNode,
        targetMagnet,
        payload.label,
        payload.colorHex,
        payload.strokeWeight,
        payload.routingType,
        payload.startTerminal,
        payload.endTerminal,
        payload.strokePattern,
        payload.startOffset,
        payload.endOffset,
        payload.labelBoxStyle,
        payload.labelAlign,
        payload.labelFillColor,
        payload.labelStrokeColor
      );
      figma.currentPage.selection = [connector];
      handleSelectionChange();
      notify(`\uC5F0\uACB0 \uC644\uB8CC${payload.label ? ` (\uB77C\uBCA8: "${payload.label}")` : ""}`, "success");
    } catch (err) {
      notify(`\uC5F0\uACB0\uC120 \uC0DD\uC131 \uC2E4\uD328: ${String(err)}`, "error");
    }
  }
  async function createSingleConnector(sourceNode, sourceMagnet, targetNode, targetMagnet, label, colorHex, strokeWeight, routingType, startTerminal, endTerminal, strokePattern, startOffset, endOffset, labelBoxStyle, labelAlign, labelFillColor, labelStrokeColor) {
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
        labelBoxStyle,
        labelAlign,
        labelFillColor,
        labelStrokeColor,
        sourceNodeId: sourceNode.id,
        targetNodeId: targetNode.id,
        routingType,
        startTerminal,
        endTerminal,
        startOffset,
        endOffset,
        strokePattern,
        labelOn: Boolean(label && label.trim())
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
  async function connectChain(payload) {
    try {
      const rawIds = payload.orderedNodeIds || [];
      const uniqueIds = [];
      const seen = /* @__PURE__ */ new Set();
      for (const id of rawIds) {
        if (!seen.has(id)) {
          seen.add(id);
          uniqueIds.push(id);
        }
      }
      const validNodes = [];
      for (const id of uniqueIds) {
        const node = figma.getNodeById(id);
        if (node) {
          const flowNode = findFlowNode(node) || node;
          validNodes.push(flowNode);
        }
      }
      if (validNodes.length < 2) {
        notify("\uC5F0\uACB0\uD560 \uB178\uB4DC\uB97C 2\uAC1C \uC774\uC0C1 \uC120\uD0DD\uD574 \uC8FC\uC138\uC694.", "warning");
        return;
      }
      await loadRequiredFonts();
      const validNodeIds = validNodes.map((n) => n.id);
      const existingPairKeys = buildPairKeySet(validNodeIds);
      let createdCount = 0;
      let skippedCount = 0;
      for (let i = 0; i < validNodes.length - 1; i++) {
        const srcNode = validNodes[i];
        const tgtNode = validNodes[i + 1];
        if (srcNode.id === tgtNode.id) {
          continue;
        }
        const pKey = makePairKey(srcNode.id, tgtNode.id);
        if (existingPairKeys.has(pKey)) {
          skippedCount++;
          continue;
        }
        const srcBox = {
          x: srcNode.x,
          y: srcNode.y,
          width: srcNode.width,
          height: srcNode.height
        };
        const tgtBox = {
          x: tgtNode.x,
          y: tgtNode.y,
          width: tgtNode.width,
          height: tgtNode.height
        };
        const optimal = getOptimalMagnetPair(srcBox, tgtBox);
        const isFirstPair = i === 0;
        const startTerminal = isFirstPair ? payload.startTerminal || "NONE" : "NONE";
        const endTerminal = payload.endTerminal || "ARROW";
        const label = isFirstPair ? payload.label : void 0;
        await createSingleConnector(
          srcNode,
          optimal.sourceMagnet,
          tgtNode,
          optimal.targetMagnet,
          label,
          payload.colorHex,
          payload.strokeWeight,
          payload.routingType,
          startTerminal,
          endTerminal,
          payload.strokePattern,
          payload.startOffset,
          payload.endOffset,
          isFirstPair ? payload.labelBoxStyle : void 0,
          isFirstPair ? payload.labelAlign : void 0,
          isFirstPair ? payload.labelFillColor : void 0,
          isFirstPair ? payload.labelStrokeColor : void 0
        );
        existingPairKeys.add(pKey);
        createdCount++;
      }
      if (createdCount === 0 && skippedCount > 0) {
        notify("\uBAA8\uB4E0 \uC5F0\uACB0\uC774 \uC774\uBBF8 \uC874\uC7AC\uD569\uB2C8\uB2E4.", "info");
      } else if (createdCount > 0 && skippedCount > 0) {
        notify(`${createdCount}\uAC1C \uC5F0\uACB0 \uC644\uB8CC (${skippedCount}\uAC1C\uB294 \uC774\uBBF8 \uC5F0\uACB0\uB428)`, "success");
      } else if (createdCount > 0) {
        notify(`${createdCount}\uAC1C \uC5F0\uACB0 \uC644\uB8CC`, "success");
      }
      await handleSelectionChange();
    } catch (err) {
      notify(`\uCCB4\uC778 \uC5F0\uACB0 \uC2E4\uD328: ${String(err)}`, "error");
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
      let connectorRootNode = node;
      if (node.parent && node.parent.type === "GROUP" && safeGetPluginData2(node.parent, "is_custom_connector") === "true") {
        connectorRootNode = node.parent;
      }
      const currentStartOff = parseFloat(
        safeGetPluginData2(connectorRootNode, "start_offset") || safeGetPluginData2(node, "start_offset") || "0"
      ) || 0;
      const currentEndOff = parseFloat(
        safeGetPluginData2(connectorRootNode, "end_offset") || safeGetPluginData2(node, "end_offset") || "0"
      ) || 0;
      const rawStartOffset = typeof payload.startOffset === "number" ? payload.startOffset : payload.isReversed ? currentEndOff : currentStartOff;
      const rawEndOffset = typeof payload.endOffset === "number" ? payload.endOffset : payload.isReversed ? currentStartOff : currentEndOff;
      const effectiveStartTerm = payload.isReversed ? payload.endTerminal : payload.startTerminal;
      const effectiveEndTerm = payload.isReversed ? payload.startTerminal : payload.endTerminal;
      const effectiveStartMagnet = payload.isReversed ? payload.targetMagnet : payload.sourceMagnet;
      const effectiveEndMagnet = payload.isReversed ? payload.sourceMagnet : payload.targetMagnet;
      const effectiveStartOffset = payload.isReversed ? rawEndOffset : rawStartOffset;
      const effectiveEndOffset = payload.isReversed ? rawStartOffset : rawEndOffset;
      if (connectorRootNode.type === "CONNECTOR") {
        const conn = connectorRootNode;
        const nativeSourceId = conn.connectorStart && "endpointNodeId" in conn.connectorStart ? conn.connectorStart.endpointNodeId : void 0;
        const nativeTargetId = conn.connectorEnd && "endpointNodeId" in conn.connectorEnd ? conn.connectorEnd.endpointNodeId : void 0;
        const hasOffset = typeof effectiveStartOffset === "number" && effectiveStartOffset > 0 || typeof effectiveEndOffset === "number" && effectiveEndOffset > 0;
        if (hasOffset && nativeSourceId && nativeTargetId) {
          const sourceNode = figma.getNodeById(nativeSourceId);
          const targetNode = figma.getNodeById(nativeTargetId);
          if (sourceNode && targetNode) {
            const colorHex = payload.colorHex || (Array.isArray(conn.strokes) && conn.strokes.length > 0 && conn.strokes[0].type === "SOLID" ? rgbToHexColor(conn.strokes[0].color) : "#000000");
            const strokeWeight = typeof payload.strokeWeight === "number" ? payload.strokeWeight : typeof conn.strokeWeight === "number" ? conn.strokeWeight : 1.5;
            const strokePattern = payload.strokePattern || (Array.isArray(conn.dashPattern) && conn.dashPattern.length > 0 ? conn.dashPattern[0] <= 2 ? "DOTTED" : "DASHED" : "SOLID");
            const routingType = payload.routingType || (conn.connectorLineType === "STRAIGHT" ? "STRAIGHT" : "ORTHOGONAL");
            const startTerm = effectiveStartTerm && effectiveStartTerm !== "MIXED" ? effectiveStartTerm : normalizeConnectorTerminal(conn.getPluginData("start_terminal"), "NONE");
            const endTerm = effectiveEndTerm && effectiveEndTerm !== "MIXED" ? effectiveEndTerm : normalizeConnectorTerminal(conn.getPluginData("end_terminal"), "ARROW");
            const label = payload.hasLabel && payload.label !== void 0 ? payload.label.trim() : conn.text ? conn.text.characters : "";
            const sourceMag = effectiveStartMagnet || (conn.connectorStart && "magnet" in conn.connectorStart ? conn.connectorStart.magnet : "RIGHT");
            const targetMag = effectiveEndMagnet || (conn.connectorEnd && "magnet" in conn.connectorEnd ? conn.connectorEnd.magnet : "LEFT");
            const customConn = await createSingleConnector(
              sourceNode,
              sourceMag,
              targetNode,
              targetMag,
              label,
              colorHex,
              strokeWeight,
              routingType,
              startTerm,
              endTerm,
              strokePattern,
              effectiveStartOffset,
              effectiveEndOffset
            );
            conn.remove();
            figma.currentPage.selection = [customConn];
            notify("\uC624\uD504\uC14B \uC801\uC6A9\uC744 \uC704\uD574 \uC9C1\uAC01 \uCEE4\uC2A4\uD140 \uCEE4\uB125\uD130\uB85C \uC790\uB3D9 \uBCC0\uD658\uB418\uC5C8\uC2B5\uB2C8\uB2E4.", "success");
            handleSelectionChange();
            return;
          }
        }
        if (typeof effectiveStartOffset === "number") {
          conn.setPluginData("start_offset", String(effectiveStartOffset));
        }
        if (typeof effectiveEndOffset === "number") {
          conn.setPluginData("end_offset", String(effectiveEndOffset));
        }
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
            case "REVERSED_TRIANGLE_ARROW":
              return "ARROW_LINES";
            case "DIAMOND":
              return "DIAMOND_FILLED";
            case "CIRCLE":
              return "CIRCLE_FILLED";
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
        if (payload.hasLabel !== void 0) {
          conn.setPluginData("connector_label_on", payload.hasLabel ? "true" : "false");
        }
        if (payload.hasLabel && payload.label !== void 0) {
          if (conn.text) {
            await safeSetCharacters(conn.text, payload.label.trim());
          }
        } else if (payload.hasLabel === false && conn.text) {
          await safeSetCharacters(conn.text, "");
        }
        if (effectiveStartMagnet && nativeSourceId) {
          conn.connectorStart = {
            endpointNodeId: nativeSourceId,
            magnet: effectiveStartMagnet
          };
          conn.setPluginData("source_magnet", effectiveStartMagnet);
          conn.setPluginData("is_manual_magnet", "true");
        }
        if (effectiveEndMagnet && nativeTargetId) {
          conn.connectorEnd = {
            endpointNodeId: nativeTargetId,
            magnet: effectiveEndMagnet
          };
          conn.setPluginData("target_magnet", effectiveEndMagnet);
          conn.setPluginData("is_manual_magnet", "true");
        }
      } else {
        let vectorNode = null;
        let termVectorNode = null;
        if (connectorRootNode.type === "VECTOR") {
          vectorNode = connectorRootNode;
        } else if (connectorRootNode.type === "GROUP") {
          const group = connectorRootNode;
          const isTerm = (c) => c.type === "VECTOR" && (safeGetPluginData2(c, "connector_role") === "terminal" || c.name === "ConnectorTerminals");
          vectorNode = group.children.find((c) => c.type === "VECTOR" && !isTerm(c)) || group.children.find((c) => c.type === "VECTOR") || null;
          termVectorNode = group.children.find(isTerm) || null;
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
          vectorNode.setPluginData("connector_role", "line");
        }
        if (termVectorNode) {
          try {
            termVectorNode.remove();
          } catch (_) {
          }
          termVectorNode = null;
        }
        if (payload.hasLabel !== void 0) {
          connectorRootNode.setPluginData("connector_label_on", payload.hasLabel ? "true" : "false");
          if (vectorNode) vectorNode.setPluginData("connector_label_on", payload.hasLabel ? "true" : "false");
        }
        if (payload.labelBoxStyle) {
          connectorRootNode.setPluginData("connector_label_box_style", payload.labelBoxStyle);
          if (vectorNode) vectorNode.setPluginData("connector_label_box_style", payload.labelBoxStyle);
        }
        if (payload.labelAlign) {
          connectorRootNode.setPluginData("connector_label_align", payload.labelAlign);
          if (vectorNode) vectorNode.setPluginData("connector_label_align", payload.labelAlign);
        }
        if (payload.labelFillColor) {
          connectorRootNode.setPluginData("connector_label_fill_color", payload.labelFillColor);
          if (vectorNode) vectorNode.setPluginData("connector_label_fill_color", payload.labelFillColor);
        }
        if (payload.labelStrokeColor) {
          connectorRootNode.setPluginData("connector_label_stroke_color", payload.labelStrokeColor);
          if (vectorNode) vectorNode.setPluginData("connector_label_stroke_color", payload.labelStrokeColor);
        }
        let labelFrame = null;
        if (connectorRootNode.type === "GROUP") {
          labelFrame = connectorRootNode.findOne(
            (n) => n.name === "ConnectorLabel" || safeGetPluginData2(n, "is_connector_label") === "true"
          );
        }
        if (payload.hasLabel) {
          const labelText = typeof payload.label === "string" ? payload.label.trim() : "";
          connectorRootNode.setPluginData("connector_label", labelText);
          if (vectorNode) vectorNode.setPluginData("connector_label", labelText);
          connectorRootNode.setPluginData("connector_label_on", "true");
          if (vectorNode) vectorNode.setPluginData("connector_label_on", "true");
          const boxStyle = payload.labelBoxStyle || safeGetPluginData2(connectorRootNode, "connector_label_box_style") || (vectorNode ? safeGetPluginData2(vectorNode, "connector_label_box_style") : "BOX") || "BOX";
          const align = payload.labelAlign || safeGetPluginData2(connectorRootNode, "connector_label_align") || (vectorNode ? safeGetPluginData2(vectorNode, "connector_label_align") : "CENTER") || "CENTER";
          const labelColorFallback = payload.colorHex || safeGetPluginData2(connectorRootNode, "connector_color") || (vectorNode ? safeGetPluginData2(vectorNode, "connector_color") : "") || "#000000";
          const fillCol = payload.labelFillColor || safeGetPluginData2(connectorRootNode, "connector_label_fill_color") || (vectorNode ? safeGetPluginData2(vectorNode, "connector_label_fill_color") : "") || "#FFFFFF";
          const strokeCol = payload.labelStrokeColor || safeGetPluginData2(connectorRootNode, "connector_label_stroke_color") || (vectorNode ? safeGetPluginData2(vectorNode, "connector_label_stroke_color") : "") || labelColorFallback;
          const isNewFrame = !labelFrame;
          if (!labelFrame) {
            labelFrame = figma.createFrame();
            labelFrame.name = "ConnectorLabel";
            labelFrame.setPluginData("is_connector_label", "true");
            labelFrame.setPluginData("is_custom_connector", "true");
            const textNode2 = figma.createText();
            textNode2.name = "LabelText";
            textNode2.setPluginData("is_custom_connector", "true");
            labelFrame.appendChild(textNode2);
          }
          labelFrame.visible = true;
          const textNode = labelFrame.findOne((n) => n.type === "TEXT");
          const srcId = safeGetPluginData2(connectorRootNode, "source_node_id") || (vectorNode ? safeGetPluginData2(vectorNode, "source_node_id") : "");
          const tgtId = safeGetPluginData2(connectorRootNode, "target_node_id") || (vectorNode ? safeGetPluginData2(vectorNode, "target_node_id") : "");
          const sourceNode = srcId ? figma.getNodeById(srcId) : null;
          const targetNode = tgtId ? figma.getNodeById(tgtId) : null;
          let isVerticalSegment = false;
          let midPoint = null;
          if (sourceNode && targetNode) {
            const srcBox = { x: sourceNode.x, y: sourceNode.y, width: sourceNode.width, height: sourceNode.height };
            const tgtBox = { x: targetNode.x, y: targetNode.y, width: targetNode.width, height: targetNode.height };
            const sourceMagnet = effectiveStartMagnet || safeGetPluginData2(connectorRootNode, "source_magnet") || "RIGHT";
            const targetMagnet = effectiveEndMagnet || safeGetPluginData2(connectorRootNode, "target_magnet") || "LEFT";
            const routingType = payload.routingType || safeGetPluginData2(connectorRootNode, "connector_routing") || "ORTHOGONAL";
            const pStart = getMagnetPoint(srcBox, sourceMagnet);
            const pEnd = getMagnetPoint(tgtBox, targetMagnet);
            const startOffset = typeof effectiveStartOffset === "number" ? effectiveStartOffset : parseFloat(safeGetPluginData2(connectorRootNode, "start_offset") || "0") || 0;
            const endOffset = typeof effectiveEndOffset === "number" ? effectiveEndOffset : parseFloat(safeGetPluginData2(connectorRootNode, "end_offset") || "0") || 0;
            const worldPoints = calculateRoutingPoints(
              pStart,
              sourceMagnet,
              pEnd,
              targetMagnet,
              srcBox,
              tgtBox,
              routingType,
              startOffset,
              endOffset
            );
            const placement = getLabelPlacement(
              worldPoints,
              routingType,
              readPrevLabelVertical(labelFrame),
              getLabelSizeHint(labelFrame, labelText)
            );
            midPoint = placement.point;
            isVerticalSegment = placement.isVertical;
          } else if (vectorNode) {
            midPoint = {
              x: vectorNode.x + vectorNode.width / 2,
              y: vectorNode.y + vectorNode.height / 2
            };
          }
          if (textNode) {
            await applyConnectorLabelStyle(labelFrame, textNode, {
              labelText,
              boxStyle,
              textAlign: align,
              fillColor: fillCol,
              strokeColor: strokeCol,
              isVertical: isVerticalSegment,
              // 라벨 보더 두께는 커넥터 라인 스트로크 두께와 연동 (이번 payload 값 우선, 없으면 현재 벡터 값)
              connectorStrokeWeight: typeof payload.strokeWeight === "number" ? payload.strokeWeight : vectorNode && typeof vectorNode.strokeWeight === "number" ? vectorNode.strokeWeight : void 0
            });
          }
          if (midPoint) {
            placeNodeAtWorldCenter(labelFrame, midPoint);
          }
          if (isNewFrame) {
            if (connectorRootNode.type === "GROUP") {
              connectorRootNode.appendChild(labelFrame);
            } else if (connectorRootNode.type === "VECTOR") {
              const parentContainer = connectorRootNode.parent || figma.currentPage;
              parentContainer.appendChild(labelFrame);
              const group = figma.group([connectorRootNode, labelFrame], parentContainer);
              group.name = connectorRootNode.name;
              copyConnectorData(connectorRootNode, group);
              group.setPluginData("connector_label_on", "true");
              registerConnectorInRegistry(group);
              connectorRootNode = group;
              if (figma.currentPage.selection[0]?.id !== group.id) {
                figma.currentPage.selection = [group];
              }
            }
          }
        } else if (payload.hasLabel === false) {
          connectorRootNode.setPluginData("connector_label", "");
          if (vectorNode) vectorNode.setPluginData("connector_label", "");
          connectorRootNode.setPluginData("connector_label_on", "false");
          if (vectorNode) vectorNode.setPluginData("connector_label_on", "false");
          if (labelFrame) {
            labelFrame.visible = false;
          }
        }
        if (payload.colorHex) {
          connectorRootNode.setPluginData("connector_color", payload.colorHex);
          if (vectorNode) vectorNode.setPluginData("connector_color", payload.colorHex);
        }
        if (payload.strokeWeight) {
          connectorRootNode.setPluginData("connector_weight", String(payload.strokeWeight));
          if (vectorNode) vectorNode.setPluginData("connector_weight", String(payload.strokeWeight));
        }
        if (payload.strokePattern) {
          connectorRootNode.setPluginData("connector_pattern", payload.strokePattern);
          if (vectorNode) vectorNode.setPluginData("connector_pattern", payload.strokePattern);
        }
        if (payload.routingType) {
          connectorRootNode.setPluginData("connector_routing", payload.routingType);
          if (vectorNode) vectorNode.setPluginData("connector_routing", payload.routingType);
        }
        if (effectiveStartTerm && effectiveStartTerm !== "MIXED") {
          connectorRootNode.setPluginData("start_terminal", effectiveStartTerm);
          if (vectorNode) vectorNode.setPluginData("start_terminal", effectiveStartTerm);
        }
        if (effectiveEndTerm && effectiveEndTerm !== "MIXED") {
          connectorRootNode.setPluginData("end_terminal", effectiveEndTerm);
          if (vectorNode) vectorNode.setPluginData("end_terminal", effectiveEndTerm);
        }
        if (typeof effectiveStartOffset === "number") {
          connectorRootNode.setPluginData("start_offset", String(effectiveStartOffset));
          if (vectorNode) vectorNode.setPluginData("start_offset", String(effectiveStartOffset));
        }
        if (typeof effectiveEndOffset === "number") {
          connectorRootNode.setPluginData("end_offset", String(effectiveEndOffset));
          if (vectorNode) vectorNode.setPluginData("end_offset", String(effectiveEndOffset));
        }
        if (effectiveStartMagnet) {
          connectorRootNode.setPluginData("source_magnet", effectiveStartMagnet);
          connectorRootNode.setPluginData("is_manual_magnet", "true");
        }
        if (effectiveEndMagnet) {
          connectorRootNode.setPluginData("target_magnet", effectiveEndMagnet);
          connectorRootNode.setPluginData("is_manual_magnet", "true");
        }
        await updateOrthogonalVectorConnector(
          connectorRootNode,
          effectiveStartMagnet,
          effectiveEndMagnet,
          false,
          effectiveStartOffset,
          effectiveEndOffset
        );
      }
      handleSelectionChange();
    } catch (err) {
      console.error("[UPDATE_CONNECTOR_PROPERTIES failed]", err);
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
      const connectors = figma.currentPage.findAll((n) => {
        try {
          return Boolean(n && n.type === "CONNECTOR");
        } catch (_) {
          return false;
        }
      });
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
    try {
      const nodes = figma.currentPage.findAll((node) => {
        try {
          if (!node) return false;
          return Boolean(safeGetPluginData2(node, "workflow_status"));
        } catch (_) {
          return false;
        }
      });
      return nodes.map((node) => {
        const status = safeGetPluginData2(node, "workflow_status");
        if (node.type === "FRAME" && safeGetPluginData2(node, "is_flow_node") === "true") {
          const frame = node;
          const statusBadge = frame.children.find(
            (c) => safeGetPluginData2(c, "is_status_badge") === "true" || c.name === "StatusBadge"
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
    } catch (_) {
      return [];
    }
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
    const isRemove = !status || !STATUS_CONFIG[status];
    const cfg = !isRemove ? STATUS_CONFIG[status] : null;
    for (const rawNode of selection) {
      let flowNode = findFlowNode(rawNode) || rawNode;
      if (!supportsOption(flowNode, "status")) {
        continue;
      }
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
            (c) => safeGetPluginData2(c, "is_status_badge") === "true" || c.name === "StatusBadge"
          );
        }
        let statusBadge = card.children.find(
          (c) => safeGetPluginData2(c, "is_status_badge") === "true" || c.name === "StatusBadge"
        );
        if (isRemove) {
          card.setPluginData("workflow_status", "");
          card.paddingBottom = 16;
          if (oldBadgeInHeader) oldBadgeInHeader.remove();
          if (statusBadge) statusBadge.remove();
          const sMode = safeGetPluginData2(card, "size_mode");
          if (sMode === "fit") {
            const effectiveTitle = safeGetPluginData2(card, "node_title") || extractNodeText(card).title;
            const currentLink = safeGetPluginData2(card, "figma_link") || void 0;
            const newFitW = await calculateScreenFitWidth(card, effectiveTitle, void 0, currentLink);
            card.minWidth = newFitW;
            card.maxWidth = newFitW;
            card.counterAxisSizingMode = "FIXED";
            card.resize(newFitW, Math.max(SCREEN_NODE_CONSTRAINTS.MIN_HEIGHT, Math.round(card.height)));
            card.primaryAxisSizingMode = "AUTO";
            card.counterAxisSizingMode = "FIXED";
          } else if (sMode === "hug") {
            card.counterAxisSizingMode = "FIXED";
            card.resize(card.width, Math.max(SCREEN_NODE_CONSTRAINTS.MIN_HEIGHT, Math.round(card.height)));
            card.primaryAxisSizingMode = "AUTO";
            card.counterAxisSizingMode = "FIXED";
          }
          const descText = card.children.find(
            (c) => c.name === "DescText" || safeGetPluginData2(c, "node_role") === "desc"
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
          const sMode = safeGetPluginData2(card, "size_mode");
          if (sMode === "fit") {
            const effectiveTitle = safeGetPluginData2(card, "node_title") || extractNodeText(card).title;
            const currentLink = safeGetPluginData2(card, "figma_link") || void 0;
            const newFitW = await calculateScreenFitWidth(card, effectiveTitle, status, currentLink);
            card.minWidth = newFitW;
            card.maxWidth = newFitW;
            card.counterAxisSizingMode = "FIXED";
            card.resize(newFitW, Math.max(SCREEN_NODE_CONSTRAINTS.MIN_HEIGHT, Math.round(card.height)));
            card.primaryAxisSizingMode = "AUTO";
            card.counterAxisSizingMode = "FIXED";
          } else if (sMode === "hug") {
            card.counterAxisSizingMode = "FIXED";
            card.resize(card.width, Math.max(SCREEN_NODE_CONSTRAINTS.MIN_HEIGHT, Math.round(card.height)));
            card.primaryAxisSizingMode = "AUTO";
            card.counterAxisSizingMode = "FIXED";
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
            (c) => c.name === "DescText" || safeGetPluginData2(c, "node_role") === "desc"
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
      if (!supportsOption(flowNode, "elevation")) {
        continue;
      }
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
    let nodeStrokeColor = null;
    let hasNodeStroke = false;
    const shapeVector = card.children.find(
      (c) => (c.name === "ShapeVector" || c.name === "DiamondShape") && (c.type === "VECTOR" || c.type === "FRAME")
    );
    if (shapeVector) {
      if ("fills" in shapeVector && Array.isArray(shapeVector.fills) && shapeVector.fills.length > 0 && shapeVector.fills[0].type === "SOLID") {
        nodeBgColor = shapeVector.fills[0].color;
      }
      if ("strokes" in shapeVector && Array.isArray(shapeVector.strokes) && shapeVector.strokes.length > 0 && shapeVector.strokes[0].type === "SOLID") {
        nodeStrokeColor = shapeVector.strokes[0].color;
        const sw = typeof shapeVector.strokeWeight === "number" ? shapeVector.strokeWeight : 1.5;
        hasNodeStroke = sw > 0;
      }
    } else {
      const cardFills = card.fills;
      if (Array.isArray(cardFills) && cardFills.length > 0 && cardFills[0].type === "SOLID") {
        nodeBgColor = cardFills[0].color;
      }
      const cardStrokes = card.strokes;
      if (Array.isArray(cardStrokes) && cardStrokes.length > 0 && cardStrokes[0].type === "SOLID") {
        nodeStrokeColor = cardStrokes[0].color;
      }
      const hasWeight = typeof card.strokeWeight === "number" ? card.strokeWeight > 0 : true;
      hasNodeStroke = hasWeight && nodeStrokeColor !== null;
    }
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
      (c) => safeGetPluginData2(c, "is_step_badge") === "true" || c.name.startsWith("[Step]")
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
    const rawNodeType = safeGetPluginData2(card, "node_type");
    const nType = normalizeNodeType(rawNodeType);
    const badgeCoords = getStepBadgeCoordinates(
      nType,
      card.width,
      card.height,
      bw,
      bh,
      corner,
      nType === "Branch" ? normalizeBranchVariant(safeGetPluginData2(card, "branch_variant")) : void 0
    );
    stepBadge.x = badgeCoords.x;
    stepBadge.y = badgeCoords.y;
    stepBadge.constraints = badgeCoords.constraints;
  }
  function getStepBadgeCoordinates(nodeType, cardW, cardH, bw, bh, corner, branchVariant) {
    const branchShape = nodeType === "Branch" ? branchVariant || "CIRCLE" : void 0;
    const treatBranchAsRect = branchShape === "SQUARE";
    const treatBranchAsDiamond = branchShape === "DIAMOND";
    const treatBranchAsCapsule = branchShape === "YES" || branchShape === "NO" || branchShape === "TRUE" || branchShape === "FALSE";
    const treatBranchAsCircle = Boolean(branchShape) && !treatBranchAsRect && !treatBranchAsDiamond && !treatBranchAsCapsule;
    if (!treatBranchAsCircle && !treatBranchAsDiamond && !treatBranchAsCapsule && nodeType !== "Junction" && nodeType !== "Connector" && nodeType !== "Decision" && nodeType !== "Terminator") {
      const offset = 11;
      if (corner === "TOP_RIGHT") {
        return { x: cardW - bw + offset, y: -offset, constraints: { horizontal: "MAX", vertical: "MIN" } };
      } else if (corner === "BOTTOM_LEFT") {
        return { x: -offset, y: cardH - bh + offset, constraints: { horizontal: "MIN", vertical: "MAX" } };
      } else if (corner === "BOTTOM_RIGHT") {
        return { x: cardW - bw + offset, y: cardH - bh + offset, constraints: { horizontal: "MAX", vertical: "MAX" } };
      } else {
        return { x: -offset, y: -offset, constraints: { horizontal: "MIN", vertical: "MIN" } };
      }
    }
    if (treatBranchAsCircle || nodeType === "Junction" || nodeType === "Connector") {
      const rx = cardW / 2;
      const ry = cardH / 2;
      const cos45 = Math.SQRT1_2;
      let cx = rx;
      let cy = ry;
      if (corner === "TOP_RIGHT") {
        cx = rx + rx * cos45;
        cy = ry - ry * cos45;
        return { x: Math.round(cx - bw / 2), y: Math.round(cy - bh / 2), constraints: { horizontal: "MAX", vertical: "MIN" } };
      } else if (corner === "BOTTOM_LEFT") {
        cx = rx - rx * cos45;
        cy = ry + ry * cos45;
        return { x: Math.round(cx - bw / 2), y: Math.round(cy - bh / 2), constraints: { horizontal: "MIN", vertical: "MAX" } };
      } else if (corner === "BOTTOM_RIGHT") {
        cx = rx + rx * cos45;
        cy = ry + ry * cos45;
        return { x: Math.round(cx - bw / 2), y: Math.round(cy - bh / 2), constraints: { horizontal: "MAX", vertical: "MAX" } };
      } else {
        cx = rx - rx * cos45;
        cy = ry - ry * cos45;
        return { x: Math.round(cx - bw / 2), y: Math.round(cy - bh / 2), constraints: { horizontal: "MIN", vertical: "MIN" } };
      }
    }
    if (treatBranchAsDiamond || nodeType === "Decision") {
      let cx = cardW / 2;
      let cy = cardH / 2;
      if (corner === "TOP_RIGHT") {
        cx = cardW * 0.75;
        cy = cardH * 0.25;
        return { x: Math.round(cx - bw / 2), y: Math.round(cy - bh / 2), constraints: { horizontal: "MAX", vertical: "MIN" } };
      } else if (corner === "BOTTOM_LEFT") {
        cx = cardW * 0.25;
        cy = cardH * 0.75;
        return { x: Math.round(cx - bw / 2), y: Math.round(cy - bh / 2), constraints: { horizontal: "MIN", vertical: "MAX" } };
      } else if (corner === "BOTTOM_RIGHT") {
        cx = cardW * 0.75;
        cy = cardH * 0.75;
        return { x: Math.round(cx - bw / 2), y: Math.round(cy - bh / 2), constraints: { horizontal: "MAX", vertical: "MAX" } };
      } else {
        cx = cardW * 0.25;
        cy = cardH * 0.25;
        return { x: Math.round(cx - bw / 2), y: Math.round(cy - bh / 2), constraints: { horizontal: "MIN", vertical: "MIN" } };
      }
    }
    if (treatBranchAsCapsule || nodeType === "Terminator") {
      const r = cardH / 2;
      const cos45 = Math.SQRT1_2;
      let cx = r;
      let cy = r;
      if (corner === "TOP_RIGHT") {
        cx = cardW - r + r * cos45;
        cy = r - r * cos45;
        return { x: Math.round(cx - bw / 2), y: Math.round(cy - bh / 2), constraints: { horizontal: "MAX", vertical: "MIN" } };
      } else if (corner === "BOTTOM_LEFT") {
        cx = r - r * cos45;
        cy = r + r * cos45;
        return { x: Math.round(cx - bw / 2), y: Math.round(cy - bh / 2), constraints: { horizontal: "MIN", vertical: "MAX" } };
      } else if (corner === "BOTTOM_RIGHT") {
        cx = cardW - r + r * cos45;
        cy = r + r * cos45;
        return { x: Math.round(cx - bw / 2), y: Math.round(cy - bh / 2), constraints: { horizontal: "MAX", vertical: "MAX" } };
      } else {
        cx = r - r * cos45;
        cy = r - r * cos45;
        return { x: Math.round(cx - bw / 2), y: Math.round(cy - bh / 2), constraints: { horizontal: "MIN", vertical: "MIN" } };
      }
    }
    return { x: -11, y: -11, constraints: { horizontal: "MIN", vertical: "MIN" } };
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
      if (!supportsOption(flow, "stepBadge")) {
        continue;
      }
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
      if (!supportsOption(flow, "stepBadge")) {
        continue;
      }
      if (flow.type === "SHAPE_WITH_TEXT") {
        flow = await convertShapeToFrameNode(flow);
      }
      if (flow.type === "FRAME") {
        const card = flow;
        card.setPluginData("step_number", "");
        card.setPluginData("badge_corner", "");
        card.setPluginData("badge_shape", "");
        const stepBadges = card.children.filter(
          (c) => safeGetPluginData2(c, "is_step_badge") === "true" || c.name.startsWith("[Step]")
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
      if ((node.type === "FRAME" || node.type === "COMPONENT" || node.type === "INSTANCE") && !safeGetPluginData2(node, "is_flow_node") && !safeGetPluginData2(node, "flow_node_type") && !node.name.startsWith("[Flow]")) {
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
      if ((node.type === "FRAME" || node.type === "COMPONENT" || node.type === "INSTANCE") && !safeGetPluginData2(node, "is_flow_node") && !safeGetPluginData2(node, "flow_node_type") && !node.name.startsWith("[Flow]")) {
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
      case "BATCH_UPDATE_FLOW_NODES":
        await batchUpdateFlowNodes(msg.payload.nodeIds, msg.payload.patch);
        break;
      case "CONNECT_POINTS":
        await connectPoints(msg.payload);
        break;
      case "CONNECT_CHAIN":
        await connectChain(msg.payload);
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
  var internalLayoutNodeIds = /* @__PURE__ */ new Set();
  figma.on("documentchange", async (event) => {
    const movedNodeIds = /* @__PURE__ */ new Set();
    let connectorSelectionChanged = false;
    let flowNodePropertyChanged = false;
    let shouldUpdateSelectionOnMove = false;
    for (const change of event.documentChanges) {
      if (change.type === "CREATE") {
        const createdNode = figma.getNodeById(change.id);
        if (createdNode && (createdNode.type === "CONNECTOR" || safeGetPluginData2(createdNode, "is_custom_connector") === "true")) {
          registerConnectorInRegistry(createdNode);
        }
      }
      if (change.type === "PROPERTY_CHANGE") {
        if (change.properties.includes("x") || change.properties.includes("y") || change.properties.includes("width") || change.properties.includes("height")) {
          const changedNode = figma.getNodeById(change.id);
          if (changedNode && findConnectorNode(changedNode)) {
            continue;
          }
          const flowNode = changedNode ? findFlowNode(changedNode) : null;
          if (flowNode && changedNode && changedNode.id !== flowNode.id) {
            continue;
          }
          movedNodeIds.add(change.id);
          if (changedNode) {
            if (flowNode) {
              movedNodeIds.add(flowNode.id);
            }
            let p = changedNode.parent;
            while (p && p.type !== "PAGE") {
              movedNodeIds.add(p.id);
              p = p.parent;
            }
          }
          const hasPositionChange = change.properties.includes("x") || change.properties.includes("y");
          const targetId = flowNode ? flowNode.id : change.id;
          const isInternalResize = internalLayoutNodeIds.has(change.id) || internalLayoutNodeIds.has(targetId);
          if (hasPositionChange || !isInternalResize) {
            shouldUpdateSelectionOnMove = true;
          }
          if (isInternalResize) {
            internalLayoutNodeIds.delete(change.id);
            if (flowNode) internalLayoutNodeIds.delete(flowNode.id);
          }
        }
        if (change.properties.includes("width") || change.properties.includes("height")) {
          const node = figma.getNodeById(change.id);
          if (!node) continue;
          const flowNode = findFlowNode(node);
          if (flowNode && flowNode.type === "FRAME" && safeGetPluginData2(flowNode, "is_flow_node") === "true") {
            const frame = flowNode;
            const currentSizeMode = safeGetPluginData2(frame, "size_mode");
            if (currentSizeMode === "hug" || currentSizeMode === "fit") {
              continue;
            }
            const savedW = frame.minWidth && frame.minWidth > 0 ? frame.minWidth : parseInt(safeGetPluginData2(frame, "node_width"), 10);
            const savedH = frame.minHeight && frame.minHeight > 0 ? frame.minHeight : parseInt(safeGetPluginData2(frame, "node_height"), 10);
            if (savedW && savedH && (Math.round(frame.width) !== savedW || Math.round(frame.height) !== savedH)) {
              frame.minWidth = null;
              frame.maxWidth = null;
              frame.minHeight = null;
              frame.maxHeight = null;
              internalLayoutNodeIds.add(frame.id);
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
        if (change.properties.includes("characters") || change.properties.includes("fontSize") || change.properties.includes("fontName") || change.properties.includes("hyperlink") || change.properties.includes("textDecoration") || change.properties.includes("textStyleId")) {
          const styleLockCandidate = figma.getNodeById(change.id);
          if (styleLockCandidate && styleLockCandidate.type === "TEXT") {
            const lockText = styleLockCandidate;
            const lockRole = safeGetPluginData2(lockText, "node_role");
            const lockParent = lockText.parent;
            const lockIsLabel = !!lockParent && (safeGetPluginData2(lockParent, "is_connector_label") === "true" || lockParent.name === "ConnectorLabel");
            const lockIsTitle = lockRole === "title" || lockText.name === "TitleText" || !!lockParent && lockParent.name === "Header";
            const lockIsDesc = lockRole === "desc" || lockText.name === "DescText";
            if (lockIsLabel) {
              await lockTextEditorStyle(lockText, { family: "Inter", style: "Regular", size: LABEL_FONT_SIZE });
            } else if (lockIsTitle && findFlowNode(lockText)) {
              await lockTextEditorStyle(lockText, { family: "Inter", style: "Bold", size: 13 });
            } else if (lockIsDesc && findFlowNode(lockText)) {
              await lockTextEditorStyle(lockText, { family: "Inter", style: "Regular", size: 11 });
            }
          }
        }
        if (change.properties.includes("characters")) {
          const textNodeCandidate = figma.getNodeById(change.id);
          if (textNodeCandidate && textNodeCandidate.type === "TEXT") {
            const textNode = textNodeCandidate;
            const role = safeGetPluginData2(textNode, "node_role");
            const isHeaderChild = textNode.parent && textNode.parent.name === "Header";
            const isTitle = role === "title" || textNode.name === "TitleText" || isHeaderChild;
            const isDesc = role === "desc" || textNode.name === "DescText";
            if (isTitle || isDesc) {
              const flowNode = findFlowNode(textNode);
              if (flowNode) {
                const isScreen = flowNode.type === "FRAME" && normalizeNodeType(safeGetPluginData2(flowNode, "node_type")) === "Screen";
                if (isTitle && isScreen) {
                  const charArray = Array.from(textNode.characters);
                  if (charArray.length > 32) {
                    const truncatedTitle = charArray.slice(0, 32).join("");
                    await safeSetCharacters(textNode, truncatedTitle);
                  }
                }
                if (isTitle) {
                  if (isScreen) {
                    const card = flowNode;
                    const sMode = (safeGetPluginData2(card, "size_mode") || safeGetPluginData2(card, "screen_size_mode") || "fixed").toLowerCase();
                    if (sMode === "fit") {
                      const fitW = await calculateScreenFitWidth(
                        card,
                        textNode.characters,
                        safeGetPluginData2(card, "workflow_status") || void 0,
                        safeGetPluginData2(card, "figma_link") || void 0
                      );
                      const targetW = clampScreenWidth(fitW);
                      const currentW = Math.round(card.width);
                      if (targetW !== currentW) {
                        internalLayoutNodeIds.add(card.id);
                        card.minWidth = targetW;
                        card.maxWidth = targetW;
                        card.resize(targetW, card.height);
                      }
                    }
                  }
                  await enforceTitleStandardStyle(textNode, flowNode);
                }
                if (isScreen) {
                  const card = flowNode;
                  const sMode = safeGetPluginData2(card, "size_mode") || safeGetPluginData2(card, "screen_size_mode") || "fixed";
                  const descText = card.children.find(
                    (c) => c.name === "DescText" || safeGetPluginData2(c, "node_role") === "desc"
                  );
                  if (sMode === "fixed") {
                    if (descText) {
                      await updateDescTextTruncation(card, descText, card.height);
                    }
                    if (isDesc) {
                      card.setPluginData("node_desc", textNode.characters);
                    }
                  } else if (sMode === "fit" || sMode === "hug") {
                    if (isDesc) {
                      const prevDesc = safeGetPluginData2(card, "node_desc") || "";
                      const currDesc = textNode.characters;
                      card.setPluginData("node_desc", currDesc);
                      const prevNewlines = (prevDesc.match(/\n/g) || []).length;
                      const currNewlines = (currDesc.match(/\n/g) || []).length;
                      const isNewlineAdded = currNewlines > prevNewlines;
                      const isNewlineRemoved = currNewlines < prevNewlines;
                      if (currDesc === prevDesc && !isNewlineAdded && !isNewlineRemoved) {
                        continue;
                      }
                    }
                    await new Promise((resolve) => setTimeout(resolve, 20));
                    if (card.removed || textNode.removed) continue;
                    const currentW = Math.round(card.width);
                    const currentH = Math.round(card.height);
                    let targetW = currentW;
                    if (sMode === "fit" && isTitle) {
                      const fitW = await calculateScreenFitWidth(
                        card,
                        textNode.characters,
                        safeGetPluginData2(card, "workflow_status") || void 0,
                        safeGetPluginData2(card, "figma_link") || void 0
                      );
                      targetW = clampScreenWidth(fitW);
                    } else {
                      targetW = clampScreenWidth(
                        Math.max(SCREEN_NODE_CONSTRAINTS.MIN_WIDTH, currentW)
                      );
                    }
                    if (targetW !== currentW) {
                      internalLayoutNodeIds.add(card.id);
                      card.resize(targetW, card.height);
                    }
                    const headerRow = card.children.find(isHeaderFrame);
                    const titleNode = isTitle ? textNode : headerRow?.children.find(
                      (c) => c.type === "TEXT" && (c.name === "TitleText" || safeGetPluginData2(c, "node_role") === "title")
                    );
                    const titleH = isScreen && sMode === "fit" ? 18 : isTitle && titleNode ? Math.max(18, Math.round(titleNode.height)) : headerRow ? Math.round(headerRow.height) : 18;
                    const descNode = isDesc ? textNode : descText;
                    const descChars = descNode ? descNode.characters : "";
                    const hasDesc = descChars.length > 0;
                    const descH = hasDesc && descNode ? Math.round(descNode.height) : 0;
                    const pt = typeof card.paddingTop === "number" ? card.paddingTop : 14;
                    const hasStatus = Boolean(safeGetPluginData2(card, "workflow_status"));
                    const hasLink = Boolean(safeGetPluginData2(card, "figma_link"));
                    const hasBottomBadge = hasStatus || hasLink;
                    const pb = typeof card.paddingBottom === "number" ? card.paddingBottom : hasBottomBadge ? 36 : hasDesc ? 16 : 14;
                    const itemSpacing = hasDesc ? typeof card.itemSpacing === "number" ? card.itemSpacing : 8 : 0;
                    const calculatedContentH = Math.round(pt + titleH + itemSpacing + descH + pb);
                    const targetH = Math.max(SCREEN_NODE_CONSTRAINTS.MIN_HEIGHT, calculatedContentH);
                    if (isDesc) {
                      card.setPluginData("node_desc", textNode.characters);
                    }
                    if (targetW !== currentW || targetH !== currentH) {
                      card.counterAxisSizingMode = "FIXED";
                      card.minWidth = targetW;
                      card.maxWidth = targetW;
                      card.minHeight = SCREEN_NODE_CONSTRAINTS.MIN_HEIGHT;
                      card.maxHeight = null;
                      internalLayoutNodeIds.add(card.id);
                      card.resize(targetW, targetH);
                      card.primaryAxisSizingMode = "AUTO";
                      card.counterAxisSizingMode = "FIXED";
                      if (sMode === "hug") {
                        card.setPluginData("screen_height", String(targetH));
                      }
                      const statusBadge = card.children.find(
                        (c) => safeGetPluginData2(c, "is_status_badge") === "true" || c.name === "StatusBadge"
                      );
                      if (statusBadge) {
                        statusBadge.constraints = { horizontal: "MAX", vertical: "MAX" };
                        statusBadge.x = targetW - statusBadge.width - 10;
                        statusBadge.y = targetH - statusBadge.height - 10;
                      }
                      const linkBadge = card.children.find(
                        (c) => safeGetPluginData2(c, "is_figma_link_badge") === "true" || c.name === "FigmaLinkBadge"
                      );
                      if (linkBadge) {
                        linkBadge.constraints = { horizontal: "MIN", vertical: "MAX" };
                        linkBadge.x = 16;
                        linkBadge.y = targetH - linkBadge.height - 10;
                      }
                      const stepBadge = card.children.find(
                        (c) => safeGetPluginData2(c, "is_step_badge") === "true" || c.name === "StepBadge"
                      );
                      if (stepBadge) {
                        const stepCorner = safeGetPluginData2(card, "badge_corner") || "TOP_LEFT";
                        const bw = Math.max(24, Math.round(stepBadge.width));
                        const bh = 24;
                        const badgeCoords = getStepBadgeCoordinates("Screen", targetW, targetH, bw, bh, stepCorner);
                        stepBadge.x = badgeCoords.x;
                        stepBadge.y = badgeCoords.y;
                        stepBadge.constraints = badgeCoords.constraints;
                      }
                    }
                  }
                }
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
            if (t.name === "StatusText" || t.parent && (t.parent.name === "StatusBadge" || safeGetPluginData2(t.parent, "is_status_badge") === "true")) {
              statusTextNode = t;
              badgeFrame = t.parent && t.parent.type === "FRAME" ? t.parent : null;
            }
          } else if (maybeStatusNode.type === "FRAME") {
            const f = maybeStatusNode;
            if (f.name === "StatusBadge" || safeGetPluginData2(f, "is_status_badge") === "true") {
              badgeFrame = f;
              statusTextNode = f.children.find((c) => c.type === "TEXT");
            }
          }
          if (statusTextNode) {
            const flowNode = findFlowNode(statusTextNode);
            if (flowNode) {
              const currentStatus = safeGetPluginData2(flowNode, "workflow_status");
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
        if (change.properties.includes("characters")) {
          const labelTextCandidate = figma.getNodeById(change.id);
          const labelFrameCandidate = labelTextCandidate && labelTextCandidate.type === "TEXT" ? labelTextCandidate.parent : null;
          if (labelTextCandidate && labelTextCandidate.type === "TEXT" && labelFrameCandidate && (safeGetPluginData2(labelFrameCandidate, "is_connector_label") === "true" || labelFrameCandidate.name === "ConnectorLabel")) {
            const labelConnRoot = findConnectorNode(labelFrameCandidate);
            if (labelConnRoot && labelConnRoot.type !== "CONNECTOR") {
              const editedLabelText = labelTextCandidate.characters.replace(/\s*[\r\n\u2028\u2029]+\s*/g, " ").trim();
              const storedLabelText = safeGetPluginData2(labelConnRoot, "connector_label");
              if (editedLabelText !== storedLabelText) {
                labelConnRoot.setPluginData("connector_label", editedLabelText);
                if (labelConnRoot.type === "GROUP") {
                  for (const child of labelConnRoot.children) {
                    if (child.type === "VECTOR" && safeGetPluginData2(child, "is_flow_connector") === "true") {
                      child.setPluginData("connector_label", editedLabelText);
                    }
                  }
                }
                const labelSel = figma.currentPage.selection;
                if (labelSel.some((sel) => sel.id === labelConnRoot.id || findConnectorNode(sel)?.id === labelConnRoot.id)) {
                  connectorSelectionChanged = true;
                }
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
        if (change.properties.includes("fills") || change.properties.includes("strokes") || change.properties.includes("strokeWeight")) {
          const changedNode = figma.getNodeById(change.id);
          const flowNode = changedNode ? findFlowNode(changedNode) : null;
          if (flowNode) {
            const currentSelection = figma.currentPage.selection;
            if (currentSelection.some((sel) => sel.id === flowNode.id)) {
              flowNodePropertyChanged = true;
            }
          }
        }
      }
    }
    if (movedNodeIds.size > 0) {
      await syncConnectorsForMovedNodes(movedNodeIds);
      if (shouldUpdateSelectionOnMove) {
        handleSelectionChange();
      }
    } else if (connectorSelectionChanged || flowNodePropertyChanged) {
      handleSelectionChange();
    }
  });
  refreshConnectorRegistry();
  handleSelectionChange();
  syncStatusList();
  loadSavedSettings();
})();
