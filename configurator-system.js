/**
 * BANDIT GARAGE — MOTORCYCLE CONFIGURATOR (ESTÚDIO FOTORREALISTA 8K INTERATIVO & 360°)
 *
 * Passo 1: O cliente escolhe um dos 9 modelos oficiais da Bandit Garage.
 * Passo 2: O cliente escolhe os acessórios na lista de cada um dos 12 tópicos de produto
 *          e clica em "Confirmar Escolhas & Gerar Imagem Interativa da Moto".
 * Passo 3: A imagem fotorrealista de estúdio 8K da moto aparece após o cliente confirmar as escolhas,
 *          aplicando alterações fotográficas reais por camadas (máscaras precisas com preservação de
 *          reflexos, sombras e texturas reais de pintura, pele, costuras, suspensão, travões e farol).
 *          - Na imagem criada, o cliente clica em qualquer um dos 12 pontos interativos (ou diretamente
 *            na peça da fotografia) para abrir o Menu de Alternativas e alterar automaticamente a moto.
 *          - No final, a imagem pode ser rodada 360 graus através da plataforma fotorrealista multi-ângulo.
 */

(function () {
  const configState = {
    step: 1, // 1: Escolher Modelo Bandit, 2: Escolher Acessórios nos 12 Tópicos, 3: Estúdio Fotorrealista 8K Interativo 360°
    modelCategoryFilter: "ALL",
    targetModelId: "TFM_CAFE_RACER",
    inputBike: {
      hasDonorBike: "BANDIT_SOURCE",
      make: "BMW",
      model: "BMW R100",
      year: 1982,
      vin: ""
    },
    components: {},
    notes: "",
    referencePhotos: [],
    customer: {
      name: "",
      email: "",
      phone: "",
      location: ""
    },
    projectCode: `MOTO-${new Date().getFullYear()}-${String(Math.floor(100 + Math.random() * 900))}`,
    lastRenderDataUrl: null,
    // Estado do Estúdio Interativo 360° & Prancha Formal (Passo 3)
    viewMode: "STUDIO_360", // "STUDIO_360" | "FORMAL_BOARD"
    rotationAngle: 0, // 0° a 360°
    isAutoSpinning: false,
    autoSpinRafId: null,
    activePopoverCompKey: null,
    showHotspots: true,
    screenHotspots: {}
  };

  const imageCache = new Map();
  const gradedStudioCache = new Map();

  function loadImageSafe(url) {
    if (!url) return Promise.resolve(null);
    if (imageCache.has(url)) return Promise.resolve(imageCache.get(url));
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        imageCache.set(url, img);
        resolve(img);
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }

  function getLang() {
    return (document.documentElement.lang || "pt").slice(0, 2);
  }

  function getLocalizedText(obj) {
    if (!obj) return "";
    if (typeof obj === "string") return obj;
    const lang = getLang();
    return obj[lang] || obj.pt || obj.en || Object.values(obj)[0] || "";
  }

  function initDefaultComponents() {
    if (!window.CONFIGURATOR_COMPONENTS) return;
    window.CONFIGURATOR_COMPONENTS.forEach((comp) => {
      configState.components[comp.key] = {
        selectedOption: comp.options?.[0]?.key || "",
        selectedColor: comp.colors ? comp.colors[0]?.key : null,
        selectedMaterial: comp.materials ? comp.materials[0]?.key : null,
        selectedStitch: comp.stitches ? comp.stitches[0]?.key : null,
        selectedSpec1: comp.spec1Options ? comp.spec1Options[0]?.key : null,
        selectedSpec2: comp.spec2Options ? comp.spec2Options[0]?.key : null
      };
    });
  }

  function applyModelDefaults(modelId) {
    const model = (window.CONFIGURATOR_MODELS || []).find((m) => m.id === modelId);
    if (!model) return;
    if (model.defaultColors) {
      if (model.defaultColors.tank && configState.components.tank) {
        configState.components.tank.selectedColor = model.defaultColors.tank;
      }
      if (model.defaultColors.seat && configState.components.seat) {
        configState.components.seat.selectedMaterial = model.defaultColors.seat;
      }
    }
    const id = model.id;
    if (id === "TFM_SCRAMBLER" || id === "TFM_RALLY_RAID") {
      if (configState.components.seat) configState.components.seat.selectedOption = "scrambler_bench";
      if (configState.components.tires) configState.components.tires.selectedOption = "continental_tkc80";
      if (configState.components.handlebar) configState.components.handlebar.selectedOption = "renthal_fatbar_scrambler";
      if (configState.components.frontSuspension) {
        configState.components.frontSuspension.selectedOption =
          id === "TFM_SCRAMBLER" ? "bmw_oem_gaiters" : "wp_rally_long";
      }
    } else if (id === "TFM_BOBBER") {
      if (configState.components.seat) configState.components.seat.selectedOption = "spirit_bobber_solo";
      if (configState.components.tires) configState.components.tires.selectedOption = "firestone_deluxe";
      if (configState.components.rearSuspension) {
        configState.components.rearSuspension.selectedOption = "hagon_cantilever";
        configState.components.rearSuspension.selectedSpec1 = "monoshock_cantilever";
      }
    } else if (id === "TFM_BRAT_STYLE" || id === "TFM_STREET_TRACKER") {
      if (configState.components.seat) {
        configState.components.seat.selectedOption =
          id === "TFM_BRAT_STYLE" ? "motone_brat_flat" : "wilder_tracker_slim";
      }
      if (configState.components.handlebar) configState.components.handlebar.selectedOption = "biltwell_tracker_mid";
    } else if (id === "TFM_VINTAGE_RACER") {
      if (configState.components.headlight) configState.components.headlight.selectedOption = "highsider_reno_bikini";
      if (configState.components.seat) configState.components.seat.selectedOption = "cafe_solo_cowl";
      if (configState.components.handlebar) configState.components.handlebar.selectedOption = "lsl_clipons_cnc";
    } else {
      if (configState.components.seat) configState.components.seat.selectedOption = "cafe_solo_cowl";
      if (configState.components.handlebar) configState.components.handlebar.selectedOption = "lsl_clipons_cnc";
      if (configState.components.frontSuspension) configState.components.frontSuspension.selectedOption = "ohlins_usd_fg";
    }
  }

  function getTopicSummaryText(compKey) {
    const comp = (window.CONFIGURATOR_COMPONENTS || []).find((c) => c.key === compKey);
    const cfg = configState.components[compKey];
    if (!comp || !cfg) return { accessory: "Padrão Bandit", brand: "Bandit Garage", specs: "" };

    const opt = comp.options?.find((o) => o.key === cfg.selectedOption);
    const optLabel = opt ? getLocalizedText(opt.label) : "";

    const parts = [];
    if (cfg.selectedColor && comp.colors) {
      const col = comp.colors.find((c) => c.key === cfg.selectedColor);
      if (col) parts.push(getLocalizedText(col.name));
    }
    if (cfg.selectedMaterial && comp.materials) {
      const mat = comp.materials.find((m) => m.key === cfg.selectedMaterial);
      if (mat) parts.push(getLocalizedText(mat.name));
    }
    if (cfg.selectedStitch && comp.stitches) {
      const st = comp.stitches.find((s) => s.key === cfg.selectedStitch);
      if (st) parts.push(getLocalizedText(st.name));
    }
    if (cfg.selectedSpec1 && comp.spec1Options) {
      const s1 = comp.spec1Options.find((s) => s.key === cfg.selectedSpec1);
      if (s1) parts.push(getLocalizedText(s1.name));
    }
    if (cfg.selectedSpec2 && comp.spec2Options) {
      const s2 = comp.spec2Options.find((s) => s.key === cfg.selectedSpec2);
      if (s2) parts.push(getLocalizedText(s2.name));
    }

    return {
      accessory: optLabel,
      brand: opt?.brand || "Bandit Garage",
      specs: parts.join(" • ")
    };
  }

  // ============================================================================
  // HELPERS DE COR, TEXTO AJUSTADO E COMPOSIÇÃO FOTOGRÁFICA 8K
  // ============================================================================
  function hexToRgb(hex) {
    let c = (hex || "#111111").replace("#", "");
    if (c.length === 3) {
      c = c
        .split("")
        .map((x) => x + x)
        .join("");
    }
    const num = parseInt(c, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  }

  function hexToRgba(hex, alpha) {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function shadeHex(hex, percent) {
    const { r, g, b } = hexToRgb(hex);
    const amt = Math.round(2.55 * percent);
    const nr = Math.max(0, Math.min(255, r + amt));
    const ng = Math.max(0, Math.min(255, g + amt));
    const nb = Math.max(0, Math.min(255, b + amt));
    return `rgb(${nr}, ${ng}, ${nb})`;
  }

  function drawRoundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function drawCoverImage(ctx, img, x, y, w, h) {
    const imgRatio = img.width / img.height;
    const targetRatio = w / h;
    let sx = 0,
      sy = 0,
      sw = img.width,
      sh = img.height;
    if (imgRatio > targetRatio) {
      sw = img.height * targetRatio;
      sx = (img.width - sw) / 2;
    } else {
      sh = img.width / targetRatio;
      sy = (img.height - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }

  // Garante que um título nunca sai fora da largura máxima do canvas
  function fillFittedText(ctx, text, x, y, maxWidth, initialSize, minSize, fontFamily, weight) {
    let size = initialSize;
    while (size > minSize) {
      ctx.font = `${weight || "900"} ${size}px ${fontFamily || "sans-serif"}`;
      if (ctx.measureText(text).width <= maxWidth) break;
      size -= 1;
    }
    ctx.fillText(text, x, y);
  }

  function getVisualConfigParams() {
    const c = configState.components;
    const tankComp = (window.CONFIGURATOR_COMPONENTS || []).find((x) => x.key === "tank");
    const tankColObj = tankComp?.colors?.find((col) => col.key === c.tank?.selectedColor);
    const tankColorKey = c.tank?.selectedColor || "bandit_black";
    const tankHex = tankColObj?.hex || "#141619";
    const tankOption = c.tank?.selectedOption || "bmw_monolever_custom";
    const tankFinish = c.tank?.selectedSpec1 || "matte_satin";
    const tankStripe = c.tank?.selectedSpec2 || "double_pinstripe";

    const seatOption = c.seat?.selectedOption || "cafe_solo_cowl";
    const seatMat = c.seat?.selectedMaterial || "cognac_leather";
    const seatStitch = c.seat?.selectedStitch || "diamond";
    const seatColorMap = {
      cognac_leather: "#a45526",
      chocolate_leather: "#48281a",
      black_nautical: "#17191e",
      alcantara_suede: "#2c313a",
      crimson_red: "#8b1d1d"
    };
    const seatHex = seatColorMap[seatMat] || "#a45526";

    const frontSuspOpt = c.frontSuspension?.selectedOption || "ohlins_usd_fg";
    const frontColorKey = c.frontSuspension?.selectedSpec2 || "gold_racing";
    const forkColorMap = {
      gold_racing: "#d99b38",
      matte_black: "#181b22",
      polished_alloy: "#d1d5db"
    };
    const forkHex = forkColorMap[frontColorKey] || "#d99b38";
    const hasGaiters = frontSuspOpt === "bmw_oem_gaiters" || frontSuspOpt === "wp_rally_long";

    const rearSuspOpt = c.rearSuspension?.selectedOption || "ohlins_stx36_blackline";
    const rearType = c.rearSuspension?.selectedSpec1 || "twin_shock";
    const rearSpringKey = c.rearSuspension?.selectedSpec2 || "black_alu";

    const wheelRimFinish = c.wheels?.selectedSpec2 || "black_stainless";
    const tireOpt = c.tires?.selectedOption || "continental_tkc80";

    const handlebarOpt = c.handlebar?.selectedOption || "lsl_clipons_cnc";
    const turnOpt = c.turnSignals?.selectedOption || "motogadget_moblaze_disc";

    const brakeOpt = c.brakes?.selectedOption || "brembo_m4_radial";
    const caliperSpec = c.brakes?.selectedSpec1 || "black_red_logo";

    const headlightOpt = c.headlight?.selectedOption || "koso_thunderbolt_led";
    const headlightSpec = c.headlight?.selectedSpec1 || "matte_black_alu";
    const isYellowLens = headlightOpt === "bates_vintage_yellow";
    const hasHeadlightGrill =
      headlightSpec === "total_black_gloss" ||
      headlightOpt === "bates_vintage_yellow" ||
      headlightOpt === "denali_rally_twin";
    const hasBikiniFairing = headlightOpt === "highsider_reno_bikini";

    const gripsSpec = c.grips?.selectedSpec1 || "cognac_brown";
    const gripHex =
      gripsSpec === "cognac_brown"
        ? "#a45526"
        : gripsSpec === "chocolate_vintage"
        ? "#48281a"
        : "#16181d";

    return {
      tankColorKey,
      tankHex,
      tankOption,
      tankFinish,
      tankStripe,
      seatOption,
      seatMat,
      seatHex,
      seatStitch,
      frontSuspOpt,
      frontColorKey,
      forkHex,
      hasGaiters,
      rearSuspOpt,
      rearType,
      rearSpringKey,
      wheelRimFinish,
      tireOpt,
      handlebarOpt,
      turnOpt,
      brakeOpt,
      caliperSpec,
      headlightOpt,
      headlightSpec,
      isYellowLens,
      hasHeadlightGrill,
      hasBikiniFairing,
      gripHex
    };
  }

  // ============================================================================
  // CONVERSÃO RGB <-> HSL E TRATAMENTO FOTOGRÁFICO AO NÍVEL DO PÍXEL (ZERO TRAÇOS 2D!)
  // ============================================================================
  function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h *= 60;
    }
    return [h, s, l];
  }

  function hslToRgb(h, s, l) {
    h = ((h % 360) + 360) % 360;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0,
      g = 0,
      b = 0;
    if (h < 60) {
      r = c;
      g = x;
    } else if (h < 120) {
      r = x;
      g = c;
    } else if (h < 180) {
      g = c;
      b = x;
    } else if (h < 240) {
      g = x;
      b = c;
    } else if (h < 300) {
      r = x;
      b = c;
    } else {
      r = c;
      b = x;
    }
    return [
      Math.max(0, Math.min(255, Math.round((r + m) * 255))),
      Math.max(0, Math.min(255, Math.round((g + m) * 255))),
      Math.max(0, Math.min(255, Math.round((b + m) * 255)))
    ];
  }

  // Geometria precisa das máscaras fotográficas e pontos 3D em cada câmara de estúdio 8K
  const STUDIO_VIEWS_META = {
    SIDE: {
      url: "renders/bespoke-scrambler-render-v2.jpg",
      emblemHealRect: { sx: 825, sy: 312, dx: 825, dy: 348, w: 122, h: 42 },
      tankPolygon: [
        [784, 388],
        [792, 310],
        [828, 240],
        [925, 212],
        [1055, 204],
        [1178, 214],
        [1228, 255],
        [1238, 325],
        [1204, 402],
        [1110, 418],
        [960, 414],
        [835, 405]
      ],
      capBox: { x1: 1025, y1: 165, x2: 1140, y2: 215 },
      seatBox: { x1: 495, y1: 262, x2: 775, y2: 362 },
      forkBox: { x1: 1225, y1: 185, x2: 1472, y2: 565 },
      gripBox: { x1: 1205, y1: 170, x2: 1285, y2: 242 },
      shockBox: { x1: 485, y1: 410, x2: 675, y2: 595 },
      headlightCircle: { cx: 1400, cy: 245, rx: 32, ry: 68 },
      anchors: {
        tank: { x: 1015, y: 312 },
        seat: { x: 635, y: 305 },
        frontSuspension: { x: 1348, y: 405 },
        rearSuspension: { x: 575, y: 485 },
        wheels: { x: 382, y: 655 },
        tires: { x: 1685, y: 555 },
        handlebar: { x: 1185, y: 145 },
        turnSignals: { x: 1125, y: 248 },
        brakes: { x: 1408, y: 638 },
        headlight: { x: 1405, y: 245 },
        speedometer: { x: 1315, y: 155 },
        grips: { x: 1245, y: 205 }
      }
    },
    FRONT_34: {
      url: "renders/turntable-front-34.jpg",
      emblemHealRect: { sx: 762, sy: 252, dx: 762, dy: 292, w: 96, h: 52 },
      tankPolygon: [
        [746, 336],
        [765, 232],
        [835, 166],
        [955, 144],
        [1085, 158],
        [1146, 224],
        [1142, 326],
        [1058, 392],
        [915, 378],
        [795, 355]
      ],
      capBox: { x1: 985, y1: 102, x2: 1085, y2: 158 },
      seatBox: { x1: 545, y1: 158, x2: 778, y2: 286 },
      forkBox: { x1: 1125, y1: 185, x2: 1435, y2: 585 },
      gripBox: { x1: 915, y1: 145, x2: 1095, y2: 225 },
      shockBox: { x1: 475, y1: 315, x2: 695, y2: 515 },
      headlightCircle: { cx: 1322, cy: 222, rx: 68, ry: 82 },
      anchors: {
        tank: { x: 945, y: 265 },
        seat: { x: 655, y: 218 },
        frontSuspension: { x: 1235, y: 395 },
        rearSuspension: { x: 565, y: 405 },
        wheels: { x: 425, y: 545 },
        tires: { x: 1585, y: 615 },
        handlebar: { x: 1135, y: 108 },
        turnSignals: { x: 912, y: 205 },
        brakes: { x: 1295, y: 665 },
        headlight: { x: 1322, y: 222 },
        speedometer: { x: 1255, y: 112 },
        grips: { x: 1015, y: 182 }
      }
    },
    REAR_34: {
      url: "renders/turntable-rear-34.jpg",
      emblemHealRect: { sx: 1010, sy: 265, dx: 1010, dy: 308, w: 122, h: 48 },
      tankPolygon: [
        [875, 255],
        [935, 172],
        [1055, 146],
        [1205, 156],
        [1288, 205],
        [1308, 322],
        [1255, 382],
        [1115, 386],
        [955, 372]
      ],
      capBox: { x1: 1095, y1: 105, x2: 1195, y2: 152 },
      seatBox: { x1: 585, y1: 195, x2: 912, y2: 322 },
      forkBox: { x1: 1285, y1: 155, x2: 1515, y2: 535 },
      gripBox: { x1: 1385, y1: 118, x2: 1515, y2: 185 },
      shockBox: { x1: 635, y1: 345, x2: 875, y2: 615 },
      headlightCircle: { cx: 1412, cy: 198, rx: 32, ry: 55 },
      anchors: {
        tank: { x: 1125, y: 265 },
        seat: { x: 755, y: 248 },
        frontSuspension: { x: 1415, y: 355 },
        rearSuspension: { x: 765, y: 465 },
        wheels: { x: 465, y: 625 },
        tires: { x: 1585, y: 585 },
        handlebar: { x: 1225, y: 112 },
        turnSignals: { x: 1485, y: 165 },
        brakes: { x: 1445, y: 615 },
        headlight: { x: 1412, y: 198 },
        speedometer: { x: 1325, y: 115 },
        grips: { x: 1455, y: 148 }
      }
    }
  };

  function getVisualSignature(v) {
    return [
      v.tankColorKey,
      v.tankHex,
      v.tankFinish,
      v.seatMat,
      v.seatHex,
      v.frontColorKey,
      v.forkHex,
      v.rearSpringKey,
      v.rearSuspOpt,
      v.isYellowLens,
      v.gripHex
    ].join("|");
  }

  /**
   * Processa uma vista fotográfica 8K de estúdio ao nível do píxel (HSL & Luminância Real),
   * preservando 100% dos reflexos, sombras e texturas reais de estúdio sem qualquer traço 2D amador.
   */
  async function getGradedStudioViewCanvas(viewKey, isMirrored, v) {
    const meta = STUDIO_VIEWS_META[viewKey] || STUDIO_VIEWS_META.SIDE;
    const cacheKey = `${viewKey}_${isMirrored ? "L" : "R"}_${getVisualSignature(v)}`;
    if (gradedStudioCache.has(cacheKey)) {
      return gradedStudioCache.get(cacheKey);
    }

    const img =
      (await loadImageSafe(meta.url)) ||
      (await loadImageSafe("renders/bespoke-scrambler-render-v2.jpg"));
    const off = document.createElement("canvas");
    off.width = 1920;
    off.height = 1080;
    const ctx = off.getContext("2d", { willReadFrequently: true });
    if (!ctx || !img) return off;

    // 1. Desenhar a fotografia 8K original em 1920x1080
    drawCoverImage(ctx, img, 0, 0, 1920, 1080);

    // Se for vista do lado esquerdo (espelhada), retocar suavemente as letras do depósito antes de inverter
    if (isMirrored && meta.emblemHealRect) {
      const hr = meta.emblemHealRect;
      ctx.save();
      ctx.filter = "blur(2px)";
      ctx.drawImage(off, hr.sx, hr.sy, hr.w, hr.h, hr.dx, hr.dy, hr.w, hr.h);
      ctx.restore();
    }

    // 2. Criar máscara suave (feathered) do depósito para transição fotográfica invisível
    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = 1920;
    maskCanvas.height = 1080;
    const mCtx = maskCanvas.getContext("2d", { willReadFrequently: true });
    if (mCtx) {
      mCtx.filter = "blur(9px)";
      mCtx.fillStyle = "#ffffff";
      mCtx.beginPath();
      meta.tankPolygon.forEach((pt, idx) => {
        if (idx === 0) mCtx.moveTo(pt[0], pt[1]);
        else mCtx.lineTo(pt[0], pt[1]);
      });
      mCtx.closePath();
      mCtx.fill();
    }

    // 3. Color Grading Fotográfico ao Nível do Píxel (Pintura do Depósito, Pele do Assento, Bainhas USD, Punhos, Mola e Ótica)
    const needTankGrade = v.tankColorKey !== "bandit_black" || v.tankFinish !== "matte_satin";
    const needSeatGrade = v.seatMat !== "cognac_leather";
    const needForkGrade = v.frontColorKey !== "gold_racing";
    const needShockGrade =
      v.rearSpringKey === "ohlins_yellow" || v.rearSuspOpt === "ohlins_piggyback_gold";
    const needLensGrade = Boolean(v.isYellowLens);

    if (needTankGrade || needSeatGrade || needForkGrade || needShockGrade || needLensGrade) {
      try {
        const imgData = ctx.getImageData(0, 0, 1920, 1080);
        const data = imgData.data;
        const maskData = mCtx ? mCtx.getImageData(0, 0, 1920, 1080).data : null;

        const tankRgb = hexToRgb(v.tankHex);
        const [tankH, tankS, tankTargetL] = rgbToHsl(tankRgb.r, tankRgb.g, tankRgb.b);

        const seatRgb = hexToRgb(v.seatHex);
        const [seatH, seatS, seatTargetL] = rgbToHsl(seatRgb.r, seatRgb.g, seatRgb.b);

        // Processar Depósito (01) com preservação integral da iluminação de estúdio
        if (needTankGrade && maskData) {
          const minX = 720,
            maxX = 1330,
            minY = 130,
            maxY = 435;
          const cap = meta.capBox;
          for (let y = minY; y <= maxY; y++) {
            const rowOffset = y * 1920;
            for (let x = minX; x <= maxX; x++) {
              const pIdx = (rowOffset + x) * 4;
              const mAlpha = maskData[pIdx + 3];
              if (mAlpha < 8) continue;

              // Preservar o tampão Monza em bronze/cobre no topo do depósito
              if (x >= cap.x1 && x <= cap.x2 && y >= cap.y1 && y <= cap.y2) {
                if (data[pIdx] > data[pIdx + 2] + 28) continue;
              }

              const r = data[pIdx];
              const g = data[pIdx + 1];
              const b = data[pIdx + 2];
              const [h, s, l] = rgbToHsl(r, g, b);

              // A superfície do depósito original tem baixa saturação e luminância entre 0.05 e 0.68
              if (l < 0.04 || l > 0.72 || s > 0.38) continue;

              const blend = Math.min(1, mAlpha / 235) * (s > 0.24 ? (0.38 - s) / 0.14 : 1);
              let outH = tankH;
              let outS = tankS;
              let outL = l;

              if (v.tankFinish === "raw_brushed") {
                // Alumínio Escovado Motorsport: reflexo metálico acetinado de alta luminância
                outS = Math.min(0.08, tankS * 0.25);
                outL = Math.min(0.88, 0.12 + Math.pow(l, 0.88) * 1.18);
              } else if (v.tankColorKey === "classic_silver" || v.tankColorKey === "desert_sand" || v.tankColorKey === "nardo_grey") {
                outS = tankS * 0.85;
                outL = Math.min(0.86, 0.09 + Math.pow(l, 0.9) * (0.75 + tankTargetL * 0.55));
              } else if (v.tankColorKey === "bandit_black") {
                outS = 0.05;
                outL = l;
              } else {
                // Cores ricas (Verde Inglesa, Azul Oceano, Vermelho Corsa, etc.)
                outS = Math.min(0.88, tankS * (0.65 + (1 - Math.abs(2 * l - 1)) * 0.45));
                outL = Math.max(0.04, Math.min(0.82, l * (0.72 + tankTargetL * 0.65)));
              }

              if (v.tankFinish === "gloss_ceramic") {
                // Curva S de Verniz Cerâmico Brilhante Espelhado (aprofunda sombras e realça altas-luzes reais)
                const specBoost = l > 0.32 ? Math.pow((l - 0.32) / 0.4, 1.35) * 0.22 : -0.02 * (0.32 - l);
                outL = Math.max(0.03, Math.min(0.92, outL + specBoost));
              }

              const [nr, ng, nb] = hslToRgb(outH, outS, outL);
              data[pIdx] = Math.round(r + (nr - r) * blend);
              data[pIdx + 1] = Math.round(g + (ng - g) * blend);
              data[pIdx + 2] = Math.round(b + (nb - b) * blend);
            }
          }
        }

        // Processar Assento em Pele (02) isolando exatamente os píxeis da pele Cognac real
        if (needSeatGrade) {
          const sb = meta.seatBox;
          for (let y = sb.y1; y <= sb.y2; y++) {
            const rowOffset = y * 1920;
            for (let x = sb.x1; x <= sb.x2; x++) {
              const pIdx = (rowOffset + x) * 4;
              const r = data[pIdx];
              const g = data[pIdx + 1];
              const b = data[pIdx + 2];
              if (r > b + 18 && g > b + 3 && r > 42) {
                const [h, s, l] = rgbToHsl(r, g, b);
                if (h >= 10 && h <= 44 && s >= 0.22) {
                  const strength = Math.min(1, (s - 0.2) * 3.2);
                  let newS = seatS * (s / 0.58);
                  let newL = l;
                  if (v.seatMat === "black_nautical") {
                    newS = Math.min(0.1, s * 0.15);
                    newL = Math.max(0.04, l * 0.44);
                  } else if (v.seatMat === "alcantara_suede") {
                    newS = Math.min(0.14, s * 0.22);
                    newL = Math.max(0.06, l * 0.62);
                  } else if (v.seatMat === "chocolate_leather") {
                    newS = Math.min(0.65, s * 0.78);
                    newL = Math.max(0.05, l * 0.58);
                  } else if (v.seatMat === "crimson_red") {
                    newS = Math.min(0.82, s * 1.05);
                    newL = Math.max(0.06, l * 0.72);
                  }
                  const [nr, ng, nb] = hslToRgb(seatH, Math.max(0, Math.min(1, newS)), newL);
                  data[pIdx] = Math.round(r + (nr - r) * strength);
                  data[pIdx + 1] = Math.round(g + (ng - g) * strength);
                  data[pIdx + 2] = Math.round(b + (nb - b) * strength);
                }
              }
            }
          }
        }

        // Processar Bainhas Dianteiras USD (03) isolando os tubos anodizados
        if (needForkGrade) {
          const fb = meta.forkBox;
          for (let y = fb.y1; y <= fb.y2; y++) {
            const rowOffset = y * 1920;
            for (let x = fb.x1; x <= fb.x2; x++) {
              const pIdx = (rowOffset + x) * 4;
              const r = data[pIdx];
              const g = data[pIdx + 1];
              const b = data[pIdx + 2];
              if (r > b + 16 && g > b + 3 && r > 38) {
                const [h, s, l] = rgbToHsl(r, g, b);
                if (h >= 12 && h <= 45 && s >= 0.2) {
                  const strength = Math.min(1, (s - 0.18) * 3.0);
                  let newH = 215;
                  let newS = 0.06;
                  let newL = l;
                  if (v.frontColorKey === "matte_black") {
                    newS = 0.05;
                    newL = Math.max(0.04, l * 0.42);
                  } else if (v.frontColorKey === "polished_alloy") {
                    newS = 0.05;
                    newL = Math.min(0.92, 0.12 + l * 1.25);
                  }
                  const [nr, ng, nb] = hslToRgb(newH, newS, newL);
                  data[pIdx] = Math.round(r + (nr - r) * strength);
                  data[pIdx + 1] = Math.round(g + (ng - g) * strength);
                  data[pIdx + 2] = Math.round(b + (nb - b) * strength);
                }
              }
            }
          }
        }

        // Processar Mola da Suspensão Traseira (04) apenas nos reflexos metálicos reais da mola
        if (needShockGrade) {
          const sh = meta.shockBox;
          const cxMid = (sh.x1 + sh.x2) / 2;
          const cyMid = (sh.y1 + sh.y2) / 2;
          const maxR = Math.hypot(sh.x2 - cxMid, sh.y2 - cyMid);
          for (let y = sh.y1; y <= sh.y2; y++) {
            const rowOffset = y * 1920;
            for (let x = sh.x1; x <= sh.x2; x++) {
              // Isolar o cilindro diagonal do amortecedor
              const normX = (x - sh.x1) / (sh.x2 - sh.x1);
              const normY = (y - sh.y1) / (sh.y2 - sh.y1);
              const diagDist = Math.abs(normX + normY - 1);
              if (diagDist > 0.24) continue;

              const pIdx = (rowOffset + x) * 4;
              const r = data[pIdx];
              const g = data[pIdx + 1];
              const b = data[pIdx + 2];
              const [, s, l] = rgbToHsl(r, g, b);
              if (l >= 0.11 && l <= 0.62 && s <= 0.25) {
                const coilWeight = (1 - diagDist / 0.24) * 0.78;
                const [nr, ng, nb] = hslToRgb(45, 0.88, Math.min(0.76, l * 1.48));
                data[pIdx] = Math.round(r + (nr - r) * coilWeight);
                data[pIdx + 1] = Math.round(g + (ng - g) * coilWeight);
                data[pIdx + 2] = Math.round(b + (nb - b) * coilWeight);
              }
            }
          }
        }

        // Processar Lente do Farol Dianteiro (10) seletivamente no vidro da ótica
        if (needLensGrade && meta.headlightCircle) {
          const hc = meta.headlightCircle;
          const xStart = Math.max(0, Math.floor(hc.cx - hc.rx));
          const xEnd = Math.min(1919, Math.ceil(hc.cx + hc.rx));
          const yStart = Math.max(0, Math.floor(hc.cy - hc.ry));
          const yEnd = Math.min(1079, Math.ceil(hc.cy + hc.ry));
          for (let y = yStart; y <= yEnd; y++) {
            const rowOffset = y * 1920;
            for (let x = xStart; x <= xEnd; x++) {
              const ellDist = Math.hypot((x - hc.cx) / hc.rx, (y - hc.cy) / hc.ry);
              if (ellDist > 1) continue;
              const pIdx = (rowOffset + x) * 4;
              const r = data[pIdx];
              const g = data[pIdx + 1];
              const b = data[pIdx + 2];
              const [, , l] = rgbToHsl(r, g, b);
              if (l > 0.18) {
                const lensWeight = (1 - ellDist) * 0.85;
                const [nr, ng, nb] = hslToRgb(48, 0.9, Math.min(0.88, l * 1.08));
                data[pIdx] = Math.round(r + (nr - r) * lensWeight);
                data[pIdx + 1] = Math.round(g + (ng - g) * lensWeight);
                data[pIdx + 2] = Math.round(b + (nb - b) * lensWeight);
              }
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);
      } catch (_err) {
        // Fallback silencioso
      }
    }

    // 4. Se a vista for do lado esquerdo (isMirrored), espelhar o canvas completo já processado
    if (isMirrored) {
      const mirrored = document.createElement("canvas");
      mirrored.width = 1920;
      mirrored.height = 1080;
      const m2 = mirrored.getContext("2d");
      if (m2) {
        m2.translate(1920, 0);
        m2.scale(-1, 1);
        m2.drawImage(off, 0, 0);
      }
      if (gradedStudioCache.size > 16) {
        const firstKey = gradedStudioCache.keys().next().value;
        gradedStudioCache.delete(firstKey);
      }
      gradedStudioCache.set(cacheKey, mirrored);
      return mirrored;
    }

    if (gradedStudioCache.size > 16) {
      const firstKey = gradedStudioCache.keys().next().value;
      gradedStudioCache.delete(firstKey);
    }
    gradedStudioCache.set(cacheKey, off);
    return off;
  }

  // ============================================================================
  // TURNTABLE 360° REAL DE 8 SETORES DE CÂMARA (0° -> 45° -> 90° -> 135° -> 180° -> 225° -> 270° -> 315°)
  // ============================================================================
  const TURNTABLE_SECTORS = [
    {
      angle: 0,
      viewKey: "SIDE",
      isMirrored: false,
      zoom: 1.0,
      panX: 0,
      panY: 0,
      label: "0° — PERFIL DIREITO DE ESTÚDIO 8K"
    },
    {
      angle: 45,
      viewKey: "FRONT_34",
      isMirrored: false,
      zoom: 1.0,
      panX: 0,
      panY: 0,
      label: "45° — PERSPETIVA 3/4 DIANTEIRA DIREITA"
    },
    {
      angle: 90,
      viewKey: "FRONT_34",
      isMirrored: false,
      zoom: 1.22,
      panX: -195,
      panY: 22,
      label: "90° — VISTA FRONTAL • ÓTICA LED, FORQUETA USD & BOXER"
    },
    {
      angle: 135,
      viewKey: "FRONT_34",
      isMirrored: true,
      zoom: 1.0,
      panX: 0,
      panY: 0,
      label: "135° — PERSPETIVA 3/4 DIANTEIRA ESQUERDA"
    },
    {
      angle: 180,
      viewKey: "SIDE",
      isMirrored: true,
      zoom: 1.0,
      panX: 0,
      panY: 0,
      label: "180° — PERFIL ESQUERDO DE ESTÚDIO 8K"
    },
    {
      angle: 225,
      viewKey: "REAR_34",
      isMirrored: true,
      zoom: 1.0,
      panX: 0,
      panY: 0,
      label: "225° — PERSPETIVA 3/4 TRASEIRA ESQUERDA"
    },
    {
      angle: 270,
      viewKey: "REAR_34",
      isMirrored: false,
      zoom: 1.2,
      panX: 185,
      panY: -16,
      label: "270° — VISTA TRASEIRA • RODA, DUPLO AMORTECEDOR & ESCAPE"
    },
    {
      angle: 315,
      viewKey: "REAR_34",
      isMirrored: false,
      zoom: 1.0,
      panX: 0,
      panY: 0,
      label: "315° — PERSPETIVA 3/4 TRASEIRA DIREITA"
    }
  ];

  function drawCameraSectorToStage(ctx, gradedCanvas, sector, subProgressOffset) {
    ctx.save();
    const parallaxPanX = sector.panX + subProgressOffset * -28;
    const parallaxZoom = sector.zoom;
    ctx.translate(960 + parallaxPanX, 510 + sector.panY);
    ctx.scale(parallaxZoom, parallaxZoom);
    ctx.translate(-960, -510);
    ctx.drawImage(gradedCanvas, 0, 0, 1920, 1080);
    ctx.restore();
  }

  function computeSectorHotspots(sector, subProgressOffset) {
    const meta = STUDIO_VIEWS_META[sector.viewKey] || STUDIO_VIEWS_META.SIDE;
    const baseAnchors = meta.anchors;
    const parallaxPanX = sector.panX + subProgressOffset * -28;
    const zoom = sector.zoom;
    const out = {};

    Object.keys(baseAnchors).forEach((compKey) => {
      const pt = baseAnchors[compKey];
      const rawX = sector.isMirrored ? 1920 - pt.x : pt.x;
      const rawY = pt.y;

      const stageX = 960 + parallaxPanX + (rawX - 960) * zoom;
      const stageY = 510 + sector.panY + (rawY - 510) * zoom;

      const clampedX = Math.max(85, Math.min(1835, stageX));
      const clampedY = Math.max(85, Math.min(835, stageY));
      out[compKey] = {
        cx: clampedX,
        cy: clampedY,
        xPct: (clampedX / 1920) * 100,
        yPct: (clampedY / 1080) * 100
      };
    });
    return out;
  }

  // ============================================================================
  // PRANCHA FORMAL DE APRESENTAÇÃO DO PROJETO (ESTILO BANDIT CLASSICS / BANDIT GARAGE)
  // Layout Formal: Coluna de Especificações à Esquerda + Hero Central + 3 Vistas Direita
  // (Cockpit, Assento Artesanal, Motor Instalado no Quadro) + 6 Detalhes no Rodapé
  // ============================================================================
  function drawMinimalSpecIcon(ctx, iconType, cx, cy) {
    ctx.save();
    ctx.strokeStyle = "#d4af37";
    ctx.fillStyle = "#d4af37";
    ctx.lineWidth = 1.8;
    if (iconType === "engine") {
      drawRoundedRect(ctx, cx - 12, cy - 8, 24, 16, 3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 16, cy - 4);
      ctx.lineTo(cx - 12, cy - 4);
      ctx.moveTo(cx + 12, cy - 4);
      ctx.lineTo(cx + 16, cy - 4);
      ctx.stroke();
    } else if (iconType === "paint") {
      ctx.beginPath();
      ctx.moveTo(cx, cy - 11);
      ctx.bezierCurveTo(cx + 10, cy - 1, cx + 9, cy + 11, cx, cy + 11);
      ctx.bezierCurveTo(cx - 9, cy + 11, cx - 10, cy - 1, cx, cy - 11);
      ctx.stroke();
    } else if (iconType === "seat") {
      ctx.beginPath();
      ctx.moveTo(cx - 12, cy + 2);
      ctx.quadraticCurveTo(cx - 4, cy + 8, cx + 12, cy + 4);
      ctx.quadraticCurveTo(cx + 10, cy - 6, cx - 8, cy - 4);
      ctx.closePath();
      ctx.stroke();
    } else if (iconType === "suspension") {
      ctx.beginPath();
      ctx.moveTo(cx - 6, cy - 11);
      ctx.lineTo(cx + 6, cy - 7);
      ctx.lineTo(cx - 6, cy - 3);
      ctx.lineTo(cx + 6, cy + 1);
      ctx.lineTo(cx - 6, cy + 5);
      ctx.lineTo(cx + 6, cy + 9);
      ctx.stroke();
    } else if (iconType === "brakes" || iconType === "wheels") {
      ctx.beginPath();
      ctx.arc(cx, cy, 11, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  async function generateFormalPresentationBoardCanvas(canvas, targetModel, v) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    const sideGraded = await getGradedStudioViewCanvas("SIDE", false, v);
    const front34Graded = await getGradedStudioViewCanvas("FRONT_34", false, v);
    const rear34Graded = await getGradedStudioViewCanvas("REAR_34", false, v);

    ctx.fillStyle = "#080a0f";
    ctx.fillRect(0, 0, 1920, 1080);

    // 1. PAINEL PRINCIPAL HERO (Esquerda + Centro: x=0..1246, y=0..806)
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, 1246, 806);
    ctx.clip();
    // Desenhar a moto Hero ligeiramente deslocada para a direita para dar espaço limpo à coluna de especificações à esquerda
    ctx.drawImage(front34Graded, 190, 10, 1160, 796);
    const leftOverlay = ctx.createLinearGradient(0, 0, 560, 0);
    leftOverlay.addColorStop(0, "rgba(7, 9, 14, 0.96)");
    leftOverlay.addColorStop(0.68, "rgba(7, 9, 14, 0.84)");
    leftOverlay.addColorStop(1, "rgba(7, 9, 14, 0)");
    ctx.fillStyle = leftOverlay;
    ctx.fillRect(0, 0, 560, 806);
    ctx.restore();

    // Cabeçalho Institucional Bandit Garage (Canto Superior Esquerdo, idêntico à Prancha Bandit Classics)
    ctx.fillStyle = "#f8fafc";
    ctx.font = "900 32px sans-serif";
    ctx.fillText("B A N D I T   G A R A G E", 34, 48);

    ctx.strokeStyle = "rgba(212, 175, 55, 0.55)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(34, 62);
    ctx.lineTo(84, 62);
    ctx.moveTo(382, 62);
    ctx.lineTo(432, 62);
    ctx.stroke();

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "600 12px monospace";
    ctx.fillText("BESPOKE CUSTOM & RESTOMOD", 94, 66);

    const modelNameUpper = targetModel
      ? getLocalizedText(targetModel.name).toUpperCase()
      : "BANDIT CAFÉ RACER";
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "500 22px sans-serif";
    ctx.fillText("BMW R100 BOXER", 34, 112);

    ctx.fillStyle = "#ffffff";
    fillFittedText(ctx, modelNameUpper, 34, 152, 460, 40, 24, "sans-serif", "900");

    ctx.fillStyle = "#d4af37";
    ctx.font = "600 18px sans-serif";
    ctx.fillText(`BESPOKE EDITION • ${configState.projectCode}`, 34, 180);

    // Coluna de 9 Especificações Técnicas à Esquerda com Ícones
    const tankSum = getTopicSummaryText("tank");
    const seatSum = getTopicSummaryText("seat");
    const frontSuspSum = getTopicSummaryText("frontSuspension");
    const rearSuspSum = getTopicSummaryText("rearSuspension");
    const wheelsSum = getTopicSummaryText("wheels");
    const tiresSum = getTopicSummaryText("tires");
    const brakesSum = getTopicSummaryText("brakes");
    const headlightSum = getTopicSummaryText("headlight");
    const handleSum = getTopicSummaryText("handlebar");

    const specItems = [
      {
        icon: "engine",
        line1: "Motor BMW Boxer 980cc Twin",
        line2: "Instalado no Quadro • Carburadores & Escape Megafone"
      },
      {
        icon: "paint",
        line1: `Depósito: ${tankSum.brand}`,
        line2: (tankSum.specs || tankSum.accessory).slice(0, 48)
      },
      {
        icon: "seat",
        line1: `Assento: ${seatSum.brand}`,
        line2: (seatSum.specs || seatSum.accessory).slice(0, 48)
      },
      {
        icon: "suspension",
        line1: `Suspensão Diant.: ${frontSuspSum.brand}`,
        line2: (frontSuspSum.specs || frontSuspSum.accessory).slice(0, 48)
      },
      {
        icon: "suspension",
        line1: `Suspensão Tras.: ${rearSuspSum.brand}`,
        line2: (rearSuspSum.specs || rearSuspSum.accessory).slice(0, 48)
      },
      {
        icon: "brakes",
        line1: `Travões: ${brakesSum.brand}`,
        line2: (brakesSum.specs || brakesSum.accessory).slice(0, 48)
      },
      {
        icon: "wheels",
        line1: `Jantes & Pneus: ${wheelsSum.brand}`,
        line2: `${tiresSum.brand} • ${(wheelsSum.specs || "").slice(0, 34)}`
      },
      {
        icon: "light",
        line1: `Ótica LED: ${headlightSum.brand}`,
        line2: (headlightSum.specs || headlightSum.accessory).slice(0, 48)
      },
      {
        icon: "cockpit",
        line1: `Cockpit: ${handleSum.brand}`,
        line2: (handleSum.specs || handleSum.accessory).slice(0, 48)
      }
    ];

    specItems.forEach((sp, idx) => {
      const rowY = 225 + idx * 62;
      drawMinimalSpecIcon(ctx, sp.icon, 50, rowY + 4);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 14px sans-serif";
      ctx.fillText(sp.line1, 78, rowY);
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "12px sans-serif";
      ctx.fillText(sp.line2, 78, rowY + 18);
    });

    // 2. COLUNA DIREITA — 3 PAINÉIS FOTORREALISTAS EMPILHADOS (x=1252..1920)
    // Painel 1 (Topo Direita): Posto de Condução, Guiador, Punhos & Conta-Quilómetros
    ctx.drawImage(front34Graded, 880, 55, 580, 326, 1252, 0, 668, 264);
    // Painel 2 (Meio Direita): Assento Artesanal em Pele & Subquadro
    ctx.drawImage(rear34Graded, 510, 120, 780, 438, 1252, 270, 668, 264);
    // Painel 3 (Base Direita): MOTOR BMW BOXER INSTALADO NA VIATURA COM A COR PRETENDIDA
    ctx.drawImage(sideGraded, 690, 250, 580, 326, 1252, 540, 668, 266);

    // Legendas discretas nos 3 painéis da direita
    const rightLabels = [
      { y: 232, text: "COCKPIT, GUIADOR CNC & INSTRUMENTAÇÃO MOTOGADGET" },
      { y: 502, text: `ASSENTO ARTESANAL EM PELE • ${(seatSum.specs || "").toUpperCase().slice(0, 38)}` },
      { y: 774, text: `MOTOR BOXER INSTALADO NA VIATURA • DEPÓSITO ${(tankSum.specs || "").toUpperCase().slice(0, 26)}` }
    ];
    rightLabels.forEach((rl) => {
      ctx.fillStyle = "rgba(6, 9, 15, 0.78)";
      ctx.fillRect(1252, rl.y, 668, 32);
      ctx.fillStyle = "#f8fafc";
      ctx.font = "bold 11px monospace";
      ctx.fillText(rl.text, 1266, rl.y + 20);
    });

    // 3. FILA INFERIOR — 6 PAINÉIS QUADRANGULARES DE DETALHE DOS ACESSÓRIOS (y=812..1080)
    const bottomPanels = [
      {
        src: front34Graded,
        sx: 1120,
        sy: 500,
        sw: 360,
        sh: 360,
        label: `09. TRAVÕES ${brakesSum.brand.toUpperCase()}`
      },
      {
        src: rear34Graded,
        sx: 610,
        sy: 330,
        sw: 320,
        sh: 320,
        label: `04. SUSPENSÃO ${rearSuspSum.brand.toUpperCase()}`
      },
      {
        src: front34Graded,
        sx: 1090,
        sy: 230,
        sw: 330,
        sh: 330,
        label: `03. FORQUETA ${frontSuspSum.brand.toUpperCase()}`
      },
      {
        src: front34Graded,
        sx: 1185,
        sy: 105,
        sw: 270,
        sh: 270,
        label: `10. FAROL LED ${headlightSum.brand.toUpperCase()}`
      },
      {
        src: sideGraded,
        sx: 820,
        sy: 170,
        sw: 380,
        sh: 380,
        label: "01. PINTURA & TAMPÃO MONZA"
      },
      {
        src: rear34Graded,
        sx: 235,
        sy: 360,
        sw: 460,
        sh: 460,
        label: `05/06. JANTES & PNEUS ${tiresSum.brand.toUpperCase()}`
      }
    ];

    const slotW = 203;
    const slotGap = 6;
    bottomPanels.forEach((bp, idx) => {
      const dx = idx * (slotW + slotGap);
      const dy = 812;
      const dh = 268;
      ctx.drawImage(bp.src, bp.sx, bp.sy, bp.sw, bp.sh, dx, dy, slotW, dh);
      ctx.fillStyle = "rgba(6, 9, 15, 0.82)";
      ctx.fillRect(dx, dy + dh - 28, slotW, 28);
      ctx.fillStyle = "#d4af37";
      ctx.font = "bold 10px monospace";
      fillFittedText(ctx, bp.label, dx + 8, dy + dh - 10, slotW - 16, 10, 8, "monospace", "bold");
    });

    // Linhas divisórias brancas/douradas de apresentação formal (idênticas à prancha de referência)
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    // Linha vertical a separar Hero (x=1249) dos 3 painéis da direita
    ctx.moveTo(1249, 0);
    ctx.lineTo(1249, 1080);
    // Linhas horizontais entre os 3 painéis da direita
    ctx.moveTo(1249, 267);
    ctx.lineTo(1920, 267);
    ctx.moveTo(1249, 537);
    ctx.lineTo(1920, 537);
    // Linha horizontal superior da fila de 6 detalhes
    ctx.moveTo(0, 809);
    ctx.lineTo(1249, 809);
    ctx.stroke();

    // Divisórias verticais entre os 6 quadrados inferiores
    for (let i = 1; i < 6; i++) {
      const vx = i * (slotW + slotGap) - slotGap / 2;
      ctx.beginPath();
      ctx.moveTo(vx, 809);
      ctx.lineTo(vx, 1080);
      ctx.stroke();
    }

    // Atualizar também os 12 pontos interativos sobre a Prancha Formal para que o cliente possa clicar em qualquer detalhe!
    const boardAnchors = {
      tank: { x: 945, y: 265 },
      seat: { x: 1580, y: 390 },
      frontSuspension: { x: 515, y: 920 },
      rearSuspension: { x: 308, y: 920 },
      wheels: { x: 1135, y: 920 },
      tires: { x: 1020, y: 585 },
      handlebar: { x: 1560, y: 125 },
      turnSignals: { x: 1410, y: 165 },
      brakes: { x: 102, y: 920 },
      headlight: { x: 725, y: 920 },
      speedometer: { x: 1680, y: 105 },
      grips: { x: 1480, y: 145 }
    };
    const nextHotspots = {};
    Object.keys(boardAnchors).forEach((k) => {
      const pt = boardAnchors[k];
      nextHotspots[k] = {
        cx: pt.x,
        cy: pt.y,
        xPct: (pt.x / 1920) * 100,
        yPct: (pt.y / 1080) * 100
      };
    });
    configState.screenHotspots = nextHotspots;

    const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
    configState.lastRenderDataUrl = dataUrl;
    return dataUrl;
  }

  // ============================================================================
  // MOTOR DE COMPOSIÇÃO FOTOGRÁFICA 8K + ROTAÇÃO 360° REAL MULTI-ÂNGULO (1920x1080)
  // ============================================================================
  async function generateStudioRenderCanvas(canvas, customAngleDeg) {
    if (!canvas) {
      canvas = document.createElement("canvas");
    }
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    const targetModel =
      (window.CONFIGURATOR_MODELS || []).find((m) => m.id === configState.targetModelId) ||
      (window.CONFIGURATOR_MODELS || [])[0];
    const v = getVisualConfigParams();

    // Se o utilizador selecionou o modo "Prancha Formal do Projeto", renderizar o quadro completo de apresentação
    if (configState.viewMode === "FORMAL_BOARD") {
      return generateFormalPresentationBoardCanvas(canvas, targetModel, v);
    }

    const angleDeg =
      typeof customAngleDeg === "number" ? customAngleDeg : configState.rotationAngle || 0;
    const normAngle = (((angleDeg % 360) + 360) % 360);

    // Encontrar o setor de câmara 360° atual (0°..315°) e o setor seguinte para interpolação contínua
    const sectorSpan = 45;
    const rawSectorIdx = Math.floor(((normAngle + 22.5) % 360) / sectorSpan);
    const activeSector = TURNTABLE_SECTORS[rawSectorIdx];
    const sectorCenterAngle = activeSector.angle;
    let deltaFromCenter = normAngle - sectorCenterAngle;
    if (deltaFromCenter > 180) deltaFromCenter -= 360;
    if (deltaFromCenter < -180) deltaFromCenter += 360;
    const subProgressOffset = deltaFromCenter / 22.5; // -1.0 a +1.0 dentro do setor de 45°

    const primaryGraded = await getGradedStudioViewCanvas(
      activeSector.viewKey,
      activeSector.isMirrored,
      v
    );
    const modelImg = await loadImageSafe(targetModel?.image);

    // 1. FUNDO DE ESTÚDIO ESCURO DE ALTA COSTURA
    ctx.fillStyle = "#06080c";
    ctx.fillRect(0, 0, 1920, 1080);

    // 2. DESENHAR A VISTA DE ESTÚDIO 8K DO SETOR ATUAL COM TRANSIÇÃO ÓPTICA SUAVE ENTRE ÂNGULOS
    drawCameraSectorToStage(ctx, primaryGraded, activeSector, subProgressOffset);

    // Cross-dissolve suave quando o utilizador roda na fronteira entre dois ângulos de câmara
    if (Math.abs(subProgressOffset) > 0.68) {
      const neighborIdx =
        subProgressOffset > 0
          ? (rawSectorIdx + 1) % TURNTABLE_SECTORS.length
          : (rawSectorIdx - 1 + TURNTABLE_SECTORS.length) % TURNTABLE_SECTORS.length;
      const neighborSector = TURNTABLE_SECTORS[neighborIdx];
      const neighborGraded = await getGradedStudioViewCanvas(
        neighborSector.viewKey,
        neighborSector.isMirrored,
        v
      );
      const blendAlpha = ((Math.abs(subProgressOffset) - 0.68) / 0.32) * 0.48;
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(0.48, blendAlpha));
      drawCameraSectorToStage(
        ctx,
        neighborGraded,
        neighborSector,
        subProgressOffset > 0 ? subProgressOffset - 2 : subProgressOffset + 2
      );
      ctx.restore();
    }

    // 3. ANEL DE PLATAFORMA GIRATÓRIA 360° DISCRETO NO CHÃO DO ESTÚDIO
    ctx.save();
    const groundY = 892;
    ctx.strokeStyle = "rgba(197, 160, 89, 0.28)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(960, groundY, 690, 42, 0, 0, Math.PI * 2);
    ctx.stroke();

    for (let a = 0; a < 360; a += 15) {
      const mRad = ((a + normAngle) * Math.PI) / 180;
      const rIn = a % 45 === 0 ? 668 : 678;
      const rOut = 696;
      const x1 = 960 + Math.cos(mRad) * rIn;
      const y1 = groundY + Math.sin(mRad) * (rIn * 0.061);
      const x2 = 960 + Math.cos(mRad) * rOut;
      const y2 = groundY + Math.sin(mRad) * (rOut * 0.061);
      ctx.strokeStyle = a % 45 === 0 ? "rgba(197, 160, 89, 0.72)" : "rgba(255, 255, 255, 0.14)";
      ctx.lineWidth = a % 45 === 0 ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.restore();

    // 4. MINIATURA DO MODELO BASE ESCOLHIDO NO CANTO SUPERIOR DIREITO (PIP DE REFERÊNCIA)
    if (modelImg) {
      ctx.save();
      const pipX = 1656;
      const pipY = 26;
      const pipW = 216;
      const pipH = 128;
      drawRoundedRect(ctx, pipX, pipY, pipW, pipH, 10);
      ctx.clip();
      drawCoverImage(ctx, modelImg, pipX, pipY, pipW, pipH);
      ctx.fillStyle = "rgba(4, 7, 12, 0.68)";
      ctx.fillRect(pipX, pipY + pipH - 28, pipW, 28);
      ctx.fillStyle = "#f8fafc";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText(`Base: ${getLocalizedText(targetModel?.name)}`, pipX + 10, pipY + pipH - 10);
      ctx.restore();

      ctx.strokeStyle = "rgba(197, 160, 89, 0.55)";
      ctx.lineWidth = 1.5;
      drawRoundedRect(ctx, 1656, 26, 216, 128, 10);
      ctx.stroke();
    }

    // 5. CALCULAR AS COORDENADAS 3D REAIS DOS 12 PONTOS INTERATIVOS PARA O ÂNGULO ATUAL
    configState.screenHotspots = computeSectorHotspots(activeSector, subProgressOffset);

    // 6. BARRA SUPERIOR E RODAPÉ TÉCNICO DE ESTÚDIO 8K (COM AUTO-FIT PARA NUNCA CORTAR TEXTO)
    const topGrad = ctx.createLinearGradient(0, 0, 0, 90);
    topGrad.addColorStop(0, "rgba(4, 7, 12, 0.88)");
    topGrad.addColorStop(1, "rgba(4, 7, 12, 0)");
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, 1920, 90);

    ctx.fillStyle = "#c5a059";
    ctx.font = "bold 13px monospace";
    ctx.fillText(
      `BANDIT GARAGE ATELIER • ${activeSector.label} • ${configState.projectCode} • ROTAÇÃO: ${Math.round(normAngle)}°`,
      48,
      40
    );

    const footerGrad = ctx.createLinearGradient(0, 865, 0, 1080);
    footerGrad.addColorStop(0, "rgba(0, 0, 0, 0)");
    footerGrad.addColorStop(0.35, "rgba(4, 7, 12, 0.92)");
    footerGrad.addColorStop(1, "rgba(4, 7, 12, 0.98)");
    ctx.fillStyle = footerGrad;
    ctx.fillRect(0, 865, 1920, 215);

    // Selo B Dourado
    ctx.fillStyle = "#c5a059";
    drawRoundedRect(ctx, 48, 962, 56, 56, 12);
    ctx.fill();
    ctx.fillStyle = "#06080d";
    ctx.font = "900 30px sans-serif";
    ctx.fillText("B", 65, 1001);

    const targetName = targetModel ? getLocalizedText(targetModel.name).toUpperCase() : "BANDIT CUSTOM";
    const tankSum = getTopicSummaryText("tank");
    const seatSum = getTopicSummaryText("seat");
    const frontSuspSum = getTopicSummaryText("frontSuspension");
    const wheelsSum = getTopicSummaryText("wheels");
    const brakesSum = getTopicSummaryText("brakes");

    ctx.fillStyle = "#c5a059";
    ctx.font = "bold 12px monospace";
    ctx.fillText(
      `ESTÚDIO FOTORREALISTA 8K MULTI-ÂNGULO • CLIQUE NOS PONTOS (01–12) PARA ALTERAR • ROTAÇÃO 360° REAL`,
      122,
      974
    );

    ctx.fillStyle = "#ffffff";
    const headlineText = `${targetName} — DEPÓSITO: ${(tankSum.specs || tankSum.accessory).toUpperCase()}`;
    fillFittedText(ctx, headlineText, 122, 1005, 1740, 23, 14, "sans-serif", "900");

    ctx.fillStyle = "#cbd5e1";
    const specLine = `ASSENTO: ${seatSum.brand} (${seatSum.specs})  •  SUSPENSÃO: ${frontSuspSum.brand}  •  JANTES: ${wheelsSum.brand}  •  TRAVÕES: ${brakesSum.brand}`;
    fillFittedText(ctx, specLine, 122, 1034, 1740, 13, 10, "monospace", "bold");

    const dataUrl = canvas.toDataURL("image/jpeg", 0.94);
    configState.lastRenderDataUrl = dataUrl;
    return dataUrl;
  }

  function openRenderLightbox(dataUrl, title) {
    if (!dataUrl) return;
    const existing = document.getElementById("cfgRenderLightboxModal");
    if (existing) existing.remove();

    const modal = document.createElement("div");
    modal.id = "cfgRenderLightboxModal";
    modal.className = "cfg-render-lightbox";
    modal.innerHTML = `
      <div class="cfg-lightbox-content">
        <button type="button" class="cfg-lightbox-close" id="cfgCloseLightboxBtn" aria-label="Fechar">×</button>
        <img src="${dataUrl}" alt="${title || "Render Bandit Garage"}" />
        <div class="cfg-lightbox-bar">
          <span><strong>${title || "Render de Estúdio 8K Bandit Garage"}</strong> • ${configState.projectCode}</span>
          <a href="${dataUrl}" download="${configState.projectCode}-Bandit-Render-8K.jpg" class="cfg-btn-studio">
            ⬇ Guardar Imagem 8K
          </a>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener("click", (e) => {
      if (e.target === modal || e.target.id === "cfgCloseLightboxBtn") {
        modal.remove();
      }
    });
  }

  function stopAutoSpin() {
    configState.isAutoSpinning = false;
    if (configState.autoSpinRafId) {
      cancelAnimationFrame(configState.autoSpinRafId);
      configState.autoSpinRafId = null;
    }
    const autoBtn = document.getElementById("cfgAutoSpin360Btn");
    if (autoBtn) {
      autoBtn.classList.remove("is-active");
      autoBtn.textContent = "↻ Rodar 360° Automático";
    }
  }

  // ============================================================================
  // RENDERIZAÇÃO DO WIZARD (3 PASSOS)
  // ============================================================================
  function renderConfigurator() {
    stopAutoSpin();
    const container = document.getElementById("configuratorWizardContainer");
    if (!container) return;

    const currentStep = configState.step;

    document.querySelectorAll(".cfg-step-indicator").forEach((stepEl) => {
      const stepNum = parseInt(stepEl.dataset.step, 10);
      stepEl.classList.toggle("is-active", stepNum === currentStep);
      stepEl.classList.toggle("is-completed", stepNum < currentStep);
    });

    if (currentStep === 1) {
      renderStep1Models(container);
    } else if (currentStep === 2) {
      renderStep2Accessories(container);
    } else if (currentStep === 3) {
      renderStep3Review(container);
    }
  }

  // ============================================================================
  // PASSO 1: ESCOLHA DE UM DOS MODELOS DA BANDIT GARAGE
  // ============================================================================
  function renderStep1Models(container) {
    const allModels = window.CONFIGURATOR_MODELS || [];
    const activeCat = configState.modelCategoryFilter || "ALL";
    const filteredModels =
      activeCat === "ALL" ? allModels : allModels.filter((m) => m.category === activeCat);

    const categories = [
      { id: "ALL", label: `Todos os Modelos Bandit (${allModels.length})` },
      { id: "BANDIT_CAFE", label: "Bandit Café" },
      { id: "BANDIT_SCRAMBLER", label: "Bandit Scrambler" },
      { id: "BANDIT_URBAN", label: "Bandit Urban (Brat / Bobber / Tracker)" },
      { id: "BANDIT_CLASSIC", label: "Bandit Classic & Roadster" }
    ];

    container.innerHTML = `
      <div class="cfg-step-box">
        <div class="cfg-step-header">
          <span class="cfg-step-badge">Passo 1 de 3 — Escolha do Modelo Bandit</span>
          <h2>Escolha o seu Modelo Bandit</h2>
          <p class="cfg-step-lead">
            Selecione um dos modelos oficiais da Bandit Garage como base do seu projeto. No passo seguinte poderá escolher os acessórios na lista de cada um dos 12 tópicos de produto e, ao confirmar as escolhas, visualizar e editar a sua moto em Estúdio 8K 360°.
          </p>
        </div>

        <div class="cfg-pills-row" style="margin-bottom: 24px;">
          ${categories
            .map(
              (cat) => `
            <button type="button" class="cfg-pill ${activeCat === cat.id ? "is-active" : ""}" data-cat-filter="${cat.id}">
              ${cat.label}
            </button>
          `
            )
            .join("")}
        </div>

        <div class="cfg-models-grid">
          ${filteredModels
            .map((m) => {
              const name = getLocalizedText(m.name);
              const tagline = getLocalizedText(m.tagline);
              const desc = getLocalizedText(m.description);
              const isSelected = configState.targetModelId === m.id;

              return `
              <div class="cfg-model-card ${isSelected ? "is-selected" : ""}" data-model-id="${m.id}">
                <div class="cfg-model-media">
                  <img src="${m.image}" alt="${name}" />
                  <span class="cfg-selected-check" style="${
                    isSelected
                      ? ""
                      : "background: rgba(8,12,20,0.85); color: #e2e8f0; border: 1px solid rgba(255,255,255,0.2);"
                  }">
                    ${isSelected ? "✓ Modelo Selecionado" : m.categoryLabel || "Bandit Garage"}
                  </span>
                </div>
                <div class="cfg-model-body">
                  <h3>${name}</h3>
                  <p class="cfg-model-tagline">${tagline}</p>
                  <p class="cfg-model-desc">${desc}</p>
                  <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 0.78rem; color: var(--sand); font-weight: 700;">
                      ${isSelected ? "● Selecionado" : "Clique para selecionar"}
                    </span>
                    <button type="button" class="cfg-btn-studio cfg-choose-and-next" data-model-id="${m.id}">
                      Escolher Acessórios →
                    </button>
                  </div>
                </div>
              </div>
            `;
            })
            .join("")}
        </div>

        <div class="cfg-step-nav">
          <div></div>
          <button type="button" class="btn btn-primary" id="cfgNextToStep2">
            Escolher Acessórios nos 12 Tópicos de Produto →
          </button>
        </div>
      </div>
    `;

    container.querySelectorAll("[data-cat-filter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        configState.modelCategoryFilter = btn.dataset.catFilter;
        renderConfigurator();
      });
    });

    container.querySelectorAll(".cfg-model-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        const modelId = card.dataset.modelId;
        configState.targetModelId = modelId;
        applyModelDefaults(modelId);

        if (e.target.closest(".cfg-choose-and-next")) {
          configState.step = 2;
          renderConfigurator();
          window.scrollTo({
            top: document.getElementById("configurator").offsetTop - 80,
            behavior: "smooth"
          });
        } else {
          renderConfigurator();
        }
      });
    });

    const nextBtn = document.getElementById("cfgNextToStep2");
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        configState.step = 2;
        renderConfigurator();
        window.scrollTo({
          top: document.getElementById("configurator").offsetTop - 80,
          behavior: "smooth"
        });
      });
    }
  }

  // ============================================================================
  // PASSO 2: ESCOLHA DOS ACESSÓRIOS NOS 12 TÓPICOS + CONFIRMAÇÃO PARA GERAR IMAGEM
  // ============================================================================
  function renderStep2Accessories(container) {
    const components = window.CONFIGURATOR_COMPONENTS || [];
    const targetModel =
      (window.CONFIGURATOR_MODELS || []).find((m) => m.id === configState.targetModelId) ||
      (window.CONFIGURATOR_MODELS || [])[0];

    const quickNavHtml = components
      .map(
        (comp) => `
        <a href="#cfg-topic-${comp.key}" class="cfg-pill" style="text-decoration: none; font-size: 0.78rem;">
          <strong>${String(comp.order).padStart(2, "0")}.</strong> ${getLocalizedText(comp.title)}
        </a>
      `
      )
      .join("");

    container.innerHTML = `
      <div class="cfg-step-box">
        <div class="cfg-step-header">
          <span class="cfg-step-badge">Passo 2 de 3 — 12 Tópicos de Produto & Lista de Acessórios</span>
          <h2>Escolher Acessórios — ${getLocalizedText(targetModel?.name)}</h2>
          <p class="cfg-step-lead">
            Selecione os acessórios na lista de cada um dos 12 tópicos de produto (<strong>01. Depósito e Cor</strong>, <strong>02. Assento</strong>, <strong>03. Suspensão Dianteira</strong>, <strong>04. Suspensão Traseira</strong>, <strong>05. Jantes</strong>, <strong>06. Pneus</strong>, <strong>07. Guiador</strong>, <strong>08. Piscas</strong>, <strong>09. Travões</strong>, <strong>10. Farol</strong>, <strong>11. Conta-Quilómetros</strong> e <strong>12. Punhos</strong>). Ao confirmar, será gerada a fotografia de estúdio 8K interativa da sua moto.
          </p>
        </div>

        <div class="cfg-stage-instruction-banner" style="margin-bottom: 20px;">
          <div>
            <strong>Modelo Base Escolhido:</strong> ${getLocalizedText(targetModel?.name)}
            <span style="opacity: 0.85; margin-left: 8px;">• Confirme as suas escolhas para gerar a imagem fotorrealista 8K interativa 360°.</span>
          </div>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button type="button" class="cfg-btn-studio" id="cfgChangeModelQuickBtn">
              ⇄ Mudar Modelo Bandit
            </button>
            <button type="button" class="btn btn-primary" id="cfgConfirmTopBtn" style="padding: 8px 16px; font-size: 0.82rem;">
              ✓ Confirmar Escolhas & Gerar Imagem 8K →
            </button>
          </div>
        </div>

        <div class="cfg-sub-section" style="margin-bottom: 24px;">
          <span class="cfg-sub-label">Ir diretamente para o tópico de produto:</span>
          <div class="cfg-pills-row">
            ${quickNavHtml}
          </div>
        </div>

        <div class="cfg-components-accordion">
          ${components
            .map((comp) => {
              const compTitle = getLocalizedText(comp.title);
              const compDesc = getLocalizedText(comp.description);
              const accLabel = getLocalizedText(comp.accessoryLabel) || "Lista de Acessórios Disponíveis:";
              const currentCfg = configState.components[comp.key] || {};

              const optionsHtml = (comp.options || [])
                .map((opt) => {
                  const isChecked = currentCfg.selectedOption === opt.key;
                  return `
                  <label class="cfg-comp-option ${isChecked ? "is-active" : ""}">
                    <input type="radio" name="comp_${comp.key}" value="${opt.key}" ${
                    isChecked ? "checked" : ""
                  } class="cfg-radio-opt" data-comp-key="${comp.key}" />
                    <div style="display: flex; flex-direction: column; gap: 2px;">
                      ${
                        opt.brand
                          ? `<small style="color: var(--sand); font-weight: 700; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em;">${opt.brand}</small>`
                          : ""
                      }
                      <span>${getLocalizedText(opt.label)}</span>
                    </div>
                  </label>
                `;
                })
                .join("");

              let colorsHtml = "";
              if (comp.colors) {
                const selectedColorObj = comp.colors.find((c) => c.key === currentCfg.selectedColor);
                const selectedColorName = selectedColorObj ? getLocalizedText(selectedColorObj.name) : "";
                colorsHtml = `
                  <div class="cfg-sub-section">
                    <span class="cfg-sub-label">Cor do ${compTitle}: <strong id="cfgColorLabel_${comp.key}" style="color: var(--sand);">${selectedColorName}</strong></span>
                    <div class="cfg-color-swatches">
                      ${comp.colors
                        .map((c) => {
                          const isSel = currentCfg.selectedColor === c.key;
                          return `
                          <button type="button" class="cfg-swatch ${
                            isSel ? "is-selected" : ""
                          }" style="background-color: ${c.hex};" title="${getLocalizedText(
                            c.name
                          )}" data-comp-key="${comp.key}" data-color-key="${
                            c.key
                          }" data-color-name="${getLocalizedText(c.name)}">
                            ${isSel ? "✓" : ""}
                          </button>
                        `;
                        })
                        .join("")}
                    </div>
                  </div>
                `;
              }

              let materialsHtml = "";
              if (comp.materials) {
                materialsHtml = `
                  <div class="cfg-sub-section">
                    <span class="cfg-sub-label">Material / Cor da Pele:</span>
                    <div class="cfg-pills-row">
                      ${comp.materials
                        .map((mat) => {
                          const isSel = currentCfg.selectedMaterial === mat.key;
                          return `
                          <button type="button" class="cfg-pill ${
                            isSel ? "is-active" : ""
                          }" data-comp-key="${comp.key}" data-mat-key="${mat.key}">
                            ${getLocalizedText(mat.name)}
                          </button>
                        `;
                        })
                        .join("")}
                    </div>
                  </div>
                `;
              }

              let stitchesHtml = "";
              if (comp.stitches) {
                stitchesHtml = `
                  <div class="cfg-sub-section">
                    <span class="cfg-sub-label">Padrão de Costura:</span>
                    <div class="cfg-pills-row">
                      ${comp.stitches
                        .map((st) => {
                          const isSel = currentCfg.selectedStitch === st.key;
                          return `
                          <button type="button" class="cfg-pill ${
                            isSel ? "is-active" : ""
                          }" data-comp-key="${comp.key}" data-stitch-key="${st.key}">
                            ${getLocalizedText(st.name)}
                          </button>
                        `;
                        })
                        .join("")}
                    </div>
                  </div>
                `;
              }

              let spec1Html = "";
              if (comp.spec1Options) {
                spec1Html = `
                  <div class="cfg-sub-section">
                    <span class="cfg-sub-label">${getLocalizedText(comp.spec1Label)}</span>
                    <div class="cfg-pills-row">
                      ${comp.spec1Options
                        .map((s1) => {
                          const isSel = currentCfg.selectedSpec1 === s1.key;
                          return `
                          <button type="button" class="cfg-pill ${
                            isSel ? "is-active" : ""
                          }" data-comp-key="${comp.key}" data-spec1-key="${s1.key}">
                            ${getLocalizedText(s1.name)}
                          </button>
                        `;
                        })
                        .join("")}
                    </div>
                  </div>
                `;
              }

              let spec2Html = "";
              if (comp.spec2Options) {
                spec2Html = `
                  <div class="cfg-sub-section">
                    <span class="cfg-sub-label">${getLocalizedText(comp.spec2Label)}</span>
                    <div class="cfg-pills-row">
                      ${comp.spec2Options
                        .map((s2) => {
                          const isSel = currentCfg.selectedSpec2 === s2.key;
                          return `
                          <button type="button" class="cfg-pill ${
                            isSel ? "is-active" : ""
                          }" data-comp-key="${comp.key}" data-spec2-key="${s2.key}">
                            ${getLocalizedText(s2.name)}
                          </button>
                        `;
                        })
                        .join("")}
                    </div>
                  </div>
                `;
              }

              return `
              <div class="cfg-component-panel" id="cfg-topic-${comp.key}" data-comp-key="${comp.key}">
                <div class="cfg-panel-header">
                  <span class="cfg-panel-num">${String(comp.order).padStart(2, "0")}</span>
                  <div class="cfg-panel-titles">
                    <h3>${compTitle}</h3>
                    <p>${compDesc}</p>
                  </div>
                </div>
                <div class="cfg-panel-body">
                  <span class="cfg-sub-label" style="display: block; margin-bottom: 10px;">${accLabel}</span>
                  <div class="cfg-options-list">
                    ${optionsHtml}
                  </div>
                  ${colorsHtml}
                  ${materialsHtml}
                  ${stitchesHtml}
                  ${spec1Html}
                  ${spec2Html}
                </div>
              </div>
            `;
            })
            .join("")}
        </div>

        <div class="cfg-step-nav">
          <button type="button" class="btn btn-outline" id="cfgBackToStep1">
            ← Voltar à Escolha do Modelo Bandit
          </button>
          <button type="button" class="btn btn-primary" id="cfgNextToStep3">
            ✓ Confirmar Escolhas & Gerar Imagem Interativa 8K da Moto →
          </button>
        </div>
      </div>
    `;

    container.querySelectorAll(".cfg-radio-opt").forEach((radio) => {
      radio.addEventListener("change", () => {
        const compKey = radio.dataset.compKey;
        if (configState.components[compKey]) {
          configState.components[compKey].selectedOption = radio.value;
        }
        const panel = radio.closest(".cfg-component-panel");
        if (panel) {
          panel.querySelectorAll(".cfg-comp-option").forEach((lbl) => lbl.classList.remove("is-active"));
          radio.closest(".cfg-comp-option")?.classList.add("is-active");
        }
      });
    });

    container.querySelectorAll(".cfg-swatch").forEach((sw) => {
      sw.addEventListener("click", () => {
        const compKey = sw.dataset.compKey;
        const colorKey = sw.dataset.colorKey;
        if (configState.components[compKey]) {
          configState.components[compKey].selectedColor = colorKey;
        }
        const parent = sw.closest(".cfg-color-swatches");
        if (parent) {
          parent.querySelectorAll(".cfg-swatch").forEach((b) => {
            b.classList.remove("is-selected");
            b.textContent = "";
          });
          sw.classList.add("is-selected");
          sw.textContent = "✓";
        }
        const lbl = document.getElementById(`cfgColorLabel_${compKey}`);
        if (lbl) lbl.textContent = sw.dataset.colorName || "";
      });
    });

    container.querySelectorAll("[data-mat-key]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const compKey = btn.dataset.compKey;
        if (configState.components[compKey]) {
          configState.components[compKey].selectedMaterial = btn.dataset.matKey;
        }
        btn
          .closest(".cfg-pills-row")
          ?.querySelectorAll("[data-mat-key]")
          .forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
      });
    });

    container.querySelectorAll("[data-stitch-key]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const compKey = btn.dataset.compKey;
        if (configState.components[compKey]) {
          configState.components[compKey].selectedStitch = btn.dataset.stitchKey;
        }
        btn
          .closest(".cfg-pills-row")
          ?.querySelectorAll("[data-stitch-key]")
          .forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
      });
    });

    container.querySelectorAll("[data-spec1-key]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const compKey = btn.dataset.compKey;
        if (configState.components[compKey]) {
          configState.components[compKey].selectedSpec1 = btn.dataset.spec1Key;
        }
        btn
          .closest(".cfg-pills-row")
          ?.querySelectorAll("[data-spec1-key]")
          .forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
      });
    });

    container.querySelectorAll("[data-spec2-key]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const compKey = btn.dataset.compKey;
        if (configState.components[compKey]) {
          configState.components[compKey].selectedSpec2 = btn.dataset.spec2Key;
        }
        btn
          .closest(".cfg-pills-row")
          ?.querySelectorAll("[data-spec2-key]")
          .forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
      });
    });

    document.getElementById("cfgChangeModelQuickBtn")?.addEventListener("click", () => {
      configState.step = 1;
      renderConfigurator();
    });

    document.getElementById("cfgBackToStep1")?.addEventListener("click", () => {
      configState.step = 1;
      renderConfigurator();
      window.scrollTo({
        top: document.getElementById("configurator").offsetTop - 80,
        behavior: "smooth"
      });
    });

    const goToInteractiveStage = () => {
      configState.step = 3;
      configState.activePopoverCompKey = null;
      renderConfigurator();
      window.scrollTo({
        top: document.getElementById("configurator").offsetTop - 80,
        behavior: "smooth"
      });
    };

    document.getElementById("cfgNextToStep3")?.addEventListener("click", goToInteractiveStage);
    document.getElementById("cfgConfirmTopBtn")?.addEventListener("click", goToInteractiveStage);
  }

  // ============================================================================
  // PASSO 3: ESTÚDIO FOTORREALISTA 8K INTERATIVO (CLIQUE NA PEÇA + ROTAÇÃO 360°)
  // ============================================================================
  function buildPopoverInnerHtml(compKey) {
    const comp = (window.CONFIGURATOR_COMPONENTS || []).find((c) => c.key === compKey);
    const currentCfg = configState.components[compKey] || {};
    if (!comp) return "";

    const compTitle = getLocalizedText(comp.title);

    const optionsHtml = (comp.options || [])
      .map((opt) => {
        const isSel = currentCfg.selectedOption === opt.key;
        return `
          <button type="button" class="cfg-popover-option-btn ${
            isSel ? "is-selected" : ""
          }" data-pop-opt="${opt.key}">
            ${opt.brand ? `<small>${opt.brand}</small>` : ""}
            <span>${isSel ? "✓ " : ""}${getLocalizedText(opt.label)}</span>
          </button>
        `;
      })
      .join("");

    let colorsHtml = "";
    if (comp.colors) {
      colorsHtml = `
        <div class="cfg-popover-section">
          <span class="cfg-popover-label">Escolher outra Cor do ${compTitle}:</span>
          <div class="cfg-color-swatches">
            ${comp.colors
              .map((col) => {
                const isSel = currentCfg.selectedColor === col.key;
                return `
                  <button type="button" class="cfg-swatch ${
                    isSel ? "is-selected" : ""
                  }" style="background-color: ${col.hex};" title="${getLocalizedText(
                  col.name
                )}" data-pop-color="${col.key}">
                    ${isSel ? "✓" : ""}
                  </button>
                `;
              })
              .join("")}
          </div>
        </div>
      `;
    }

    let materialsHtml = "";
    if (comp.materials) {
      materialsHtml = `
        <div class="cfg-popover-section">
          <span class="cfg-popover-label">Material / Cor da Pele:</span>
          <div class="cfg-pills-row">
            ${comp.materials
              .map((mat) => {
                const isSel = currentCfg.selectedMaterial === mat.key;
                return `
                  <button type="button" class="cfg-pill ${
                    isSel ? "is-active" : ""
                  }" data-pop-mat="${mat.key}">
                    ${getLocalizedText(mat.name)}
                  </button>
                `;
              })
              .join("")}
          </div>
        </div>
      `;
    }

    let stitchesHtml = "";
    if (comp.stitches) {
      stitchesHtml = `
        <div class="cfg-popover-section">
          <span class="cfg-popover-label">Padrão de Costura:</span>
          <div class="cfg-pills-row">
            ${comp.stitches
              .map((st) => {
                const isSel = currentCfg.selectedStitch === st.key;
                return `
                  <button type="button" class="cfg-pill ${
                    isSel ? "is-active" : ""
                  }" data-pop-stitch="${st.key}">
                    ${getLocalizedText(st.name)}
                  </button>
                `;
              })
              .join("")}
          </div>
        </div>
      `;
    }

    let spec1Html = "";
    if (comp.spec1Options) {
      spec1Html = `
        <div class="cfg-popover-section">
          <span class="cfg-popover-label">${getLocalizedText(comp.spec1Label)}</span>
          <div class="cfg-pills-row">
            ${comp.spec1Options
              .map((s1) => {
                const isSel = currentCfg.selectedSpec1 === s1.key;
                return `
                  <button type="button" class="cfg-pill ${
                    isSel ? "is-active" : ""
                  }" data-pop-spec1="${s1.key}">
                    ${getLocalizedText(s1.name)}
                  </button>
                `;
              })
              .join("")}
          </div>
        </div>
      `;
    }

    let spec2Html = "";
    if (comp.spec2Options) {
      spec2Html = `
        <div class="cfg-popover-section">
          <span class="cfg-popover-label">${getLocalizedText(comp.spec2Label)}</span>
          <div class="cfg-pills-row">
            ${comp.spec2Options
              .map((s2) => {
                const isSel = currentCfg.selectedSpec2 === s2.key;
                return `
                  <button type="button" class="cfg-pill ${
                    isSel ? "is-active" : ""
                  }" data-pop-spec2="${s2.key}">
                    ${getLocalizedText(s2.name)}
                  </button>
                `;
              })
              .join("")}
          </div>
        </div>
      `;
    }

    return `
      <div class="cfg-popover-header">
        <div>
          <span class="cfg-popover-kicker">Tópico ${String(comp.order).padStart(2, "0")} de 12 • Alteração Direta na Imagem</span>
          <h4 class="cfg-popover-title">${compTitle}</h4>
        </div>
        <button type="button" class="cfg-popover-close" id="cfgClosePopoverBtn" title="Fechar">×</button>
      </div>
      <div class="cfg-popover-section">
        <span class="cfg-popover-label">Alternativas de Escolha (Altera automaticamente na imagem):</span>
        ${optionsHtml}
      </div>
      ${colorsHtml}
      ${materialsHtml}
      ${stitchesHtml}
      ${spec1Html}
      ${spec2Html}
    `;
  }

  function buildSummaryGridHtml() {
    const components = window.CONFIGURATOR_COMPONENTS || [];
    return components
      .map((c) => {
        const cTitle = getLocalizedText(c.title);
        const sum = getTopicSummaryText(c.key);
        return `
        <div class="cfg-summary-row" data-summary-comp="${c.key}" style="cursor: pointer;" title="Clique para alterar este componente na imagem">
          <strong>${String(c.order).padStart(2, "0")}. ${cTitle}:</strong>
          <div>
            <span>${sum.accessory}</span>
            ${sum.specs ? `<small class="cfg-summary-extra">${sum.specs}</small>` : ""}
          </div>
        </div>
      `;
      })
      .join("");
  }

  async function renderStep3Review(container) {
    const targetModel =
      (window.CONFIGURATOR_MODELS || []).find((m) => m.id === configState.targetModelId) ||
      (window.CONFIGURATOR_MODELS || [])[0];
    const components = window.CONFIGURATOR_COMPONENTS || [];
    const anglePresets = [
      { deg: 0, label: "0° Perfil Dir." },
      { deg: 45, label: "45° 3/4 Frente Dir." },
      { deg: 90, label: "90° Frente" },
      { deg: 135, label: "135° 3/4 Frente Esq." },
      { deg: 180, label: "180° Perfil Esq." },
      { deg: 225, label: "225° 3/4 Trás Esq." },
      { deg: 270, label: "270° Traseira" },
      { deg: 315, label: "315° 3/4 Trás Dir." }
    ];

    container.innerHTML = `
      <div class="cfg-step-box">
        <div class="cfg-step-header">
          <span class="cfg-step-badge">Passo 3 de 3 — Estúdio 8K Multi-Ângulo 360° & Prancha Formal do Projeto</span>
          <h2>A sua ${getLocalizedText(targetModel?.name)} Personalizada</h2>
          <p class="cfg-step-lead">
            Fotografia de estúdio 8K gerada com as suas escolhas nos 12 tópicos. <strong>Clique em qualquer um dos números (01 a 12) ou diretamente na peça da moto</strong> para abrir as alternativas e atualizar a imagem em tempo real. Arraste a imagem ou use a barra abaixo para <strong>rodar 360 graus pelos vários ângulos reais da moto</strong>, ou alterne para a <strong>Prancha Formal de Apresentação do Projeto</strong>.
          </p>
        </div>

        <div class="cfg-stage-instruction-banner">
          <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
            <button type="button" class="cfg-btn-studio ${
              configState.viewMode !== "FORMAL_BOARD" ? "is-active" : ""
            }" id="cfgModeStudio360Btn">
              ↻ Vista Estúdio 360° Interativa
            </button>
            <button type="button" class="cfg-btn-studio ${
              configState.viewMode === "FORMAL_BOARD" ? "is-active" : ""
            }" id="cfgModeFormalBoardBtn">
              ✦ Prancha Formal do Projeto
            </button>
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button type="button" class="cfg-btn-studio" id="cfgToggleHotspotsBtn">
              ${configState.showHotspots ? "👁 Ocultar Pontos (12)" : "👁 Mostrar Pontos (12)"}
            </button>
            <button type="button" class="cfg-btn-studio" id="cfgReviewZoomBtn">
              🔍 Ecrã Inteiro
            </button>
            <button type="button" class="cfg-btn-studio" id="cfgDownload360RenderBtn">
              ⬇ Descarregar Imagem 8K
            </button>
          </div>
        </div>

        <!-- PALCO INTERATIVO DA MOTO CRIADA COM HOTSPOTS COMPACTOS E POPOVER DE ALTERNATIVAS -->
        <div class="cfg-interactive-stage-container is-draggable" id="cfgInteractiveStage">
          <canvas id="cfgInteractiveCanvas360" width="1920" height="1080"></canvas>
          <div class="cfg-hotspots-layer" id="cfgHotspotsLayer"></div>
          <div class="cfg-part-popover" id="cfgPartPopover" style="display: none;"></div>
        </div>

        <!-- BARRA DE CONTROLO DE ROTAÇÃO 360 GRAUS REAL (8 CÂMARAS DE ESTÚDIO) -->
        <div class="cfg-360-toolbar">
          <div class="cfg-360-top-row">
            <div class="cfg-360-slider-wrap">
              <strong style="font-size: 0.8rem; color: #f8fafc; white-space: nowrap;">↻ Rotação 360° Multi-Ângulo:</strong>
              <input type="range" min="0" max="360" step="1" value="${Math.round(
                configState.rotationAngle
              )}" class="cfg-360-slider" id="cfgRotationSlider" />
              <span class="cfg-360-deg-readout" id="cfgRotationReadout">${Math.round(
                configState.rotationAngle
              )}°</span>
            </div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <button type="button" class="cfg-btn-studio" id="cfgAutoSpin360Btn">
                ↻ Rodar 360° Automático
              </button>
            </div>
          </div>
          <div class="cfg-360-angles-row">
            ${anglePresets
              .map(
                (ang) => `
              <button type="button" class="cfg-angle-btn ${
                configState.viewMode !== "FORMAL_BOARD" &&
                Math.abs(((Math.round(configState.rotationAngle) - ang.deg + 540) % 360) - 180) <= 22
                  ? "is-active"
                  : ""
              }" data-angle-preset="${ang.deg}">
                ${ang.label}
              </button>
            `
              )
              .join("")}
          </div>
        </div>

        <!-- FICHA RESUMO DOS 12 TÓPICOS (ATUALIZA EM TEMPO REAL) -->
        <div class="cfg-summary-dossier" style="margin-top: 26px;">
          <div class="cfg-summary-details">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 12px;">
              <h4 style="margin: 0;">Especificação Atual dos 12 Tópicos de Produto</h4>
              <small style="color: var(--sand);">Clique também em qualquer linha abaixo ou nos pontos 01–12 na imagem acima para alterar instantaneamente</small>
            </div>
            <div class="cfg-summary-grid" id="cfgSummaryGridDynamic">
              ${buildSummaryGridHtml()}
            </div>
          </div>
        </div>

        <form id="cfgSubmissionForm" class="cfg-customer-form">
          <h3>Dados de Contacto & Pedido de Cotação</h3>
          <div class="cfg-form-grid">
            <div class="cfg-field-group">
              <label>Nome Completo:</label>
              <input type="text" name="customer_name" class="cfg-input" placeholder="O seu nome" required />
            </div>

            <div class="cfg-field-group">
              <label>Endereço de E-mail:</label>
              <input type="email" name="customer_email" class="cfg-input" placeholder="nome@exemplo.pt" required />
            </div>

            <div class="cfg-field-group">
              <label>Telefone / WhatsApp:</label>
              <input type="tel" name="customer_phone" class="cfg-input" placeholder="+351 9XX XXX XXX" required />
            </div>

            <div class="cfg-field-group">
              <label>País / Cidade:</label>
              <input type="text" name="customer_location" class="cfg-input" placeholder="Ex.: Lisboa, Portugal" required />
            </div>

            <div class="cfg-field-group">
              <label>Moto Base para o Projeto:</label>
              <select name="donor_option" class="cfg-select">
                <option value="BANDIT_SOURCE">Pretendo que a Bandit Garage forneça a moto base</option>
                <option value="CLIENT_HAS">Já possuo a moto base para transformar</option>
              </select>
            </div>

            <div class="cfg-field-group">
              <label>Observações Adicionais (Opcional):</label>
              <input type="text" name="customer_notes" class="cfg-input" placeholder="Algum detalhe específico ou preferência adicional..." />
            </div>
          </div>

          <div class="cfg-step-nav" style="margin-top: 24px;">
            <button type="button" class="btn btn-outline" id="cfgBackToStep2">
              ← Voltar à Lista Completa dos 12 Tópicos
            </button>
            <button type="submit" class="btn btn-primary" id="cfgSubmitBtn">
              Enviar Configuração à Bandit Garage →
            </button>
          </div>
        </form>
      </div>
    `;

    const canvas360 = document.getElementById("cfgInteractiveCanvas360");
    const hotspotsLayer = document.getElementById("cfgHotspotsLayer");
    const popoverEl = document.getElementById("cfgPartPopover");
    const sliderEl = document.getElementById("cfgRotationSlider");
    const readoutEl = document.getElementById("cfgRotationReadout");
    const summaryGridEl = document.getElementById("cfgSummaryGridDynamic");

    function renderHotspotPins() {
      if (!hotspotsLayer) return;
      if (!configState.showHotspots) {
        hotspotsLayer.innerHTML = "";
        return;
      }
      hotspotsLayer.innerHTML = components
        .map((comp) => {
          const pos = configState.screenHotspots[comp.key] || { xPct: 50, yPct: 50 };
          const isActive = configState.activePopoverCompKey === comp.key;
          return `
            <button type="button" class="cfg-hotspot-pin ${
              isActive ? "is-active" : ""
            }" style="left: ${pos.xPct.toFixed(2)}%; top: ${pos.yPct.toFixed(
            2
          )}%;" data-hotspot-comp="${comp.key}" title="Clique para alterar ${getLocalizedText(
            comp.title
          )}">
              <span class="cfg-hotspot-num">${String(comp.order).padStart(2, "0")}</span>
              <span class="cfg-hotspot-label-text">${getLocalizedText(comp.title)}</span>
            </button>
          `;
        })
        .join("");

      hotspotsLayer.querySelectorAll("[data-hotspot-comp]").forEach((pinBtn) => {
        pinBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          openPartPopover(pinBtn.dataset.hotspotComp);
        });
      });
    }

    async function refreshInteractiveScene() {
      const normAngle = ((Math.round(configState.rotationAngle) % 360) + 360) % 360;
      if (sliderEl) sliderEl.value = String(normAngle);
      if (readoutEl) readoutEl.textContent = `${normAngle}°`;

      const mode360Btn = document.getElementById("cfgModeStudio360Btn");
      const modeBoardBtn = document.getElementById("cfgModeFormalBoardBtn");
      if (mode360Btn) {
        mode360Btn.classList.toggle("is-active", configState.viewMode !== "FORMAL_BOARD");
      }
      if (modeBoardBtn) {
        modeBoardBtn.classList.toggle("is-active", configState.viewMode === "FORMAL_BOARD");
      }

      container.querySelectorAll("[data-angle-preset]").forEach((b) => {
        const presetDeg = parseInt(b.dataset.anglePreset, 10);
        const diff = Math.abs(((normAngle - presetDeg + 540) % 360) - 180);
        b.classList.toggle(
          "is-active",
          configState.viewMode !== "FORMAL_BOARD" && diff <= 22
        );
      });

      await generateStudioRenderCanvas(canvas360, normAngle);
      renderHotspotPins();

      if (summaryGridEl) {
        summaryGridEl.innerHTML = buildSummaryGridHtml();
        bindSummaryRowClicks();
      }
    }

    document.getElementById("cfgModeStudio360Btn")?.addEventListener("click", () => {
      configState.viewMode = "STUDIO_360";
      refreshInteractiveScene();
    });

    document.getElementById("cfgModeFormalBoardBtn")?.addEventListener("click", () => {
      stopAutoSpin();
      configState.viewMode = "FORMAL_BOARD";
      refreshInteractiveScene();
    });

    function openPartPopover(compKey) {
      stopAutoSpin();
      configState.activePopoverCompKey = compKey;
      if (!popoverEl) return;
      popoverEl.style.display = "block";
      popoverEl.innerHTML = buildPopoverInnerHtml(compKey);
      renderHotspotPins();

      document.getElementById("cfgClosePopoverBtn")?.addEventListener("click", (e) => {
        e.stopPropagation();
        configState.activePopoverCompKey = null;
        popoverEl.style.display = "none";
        renderHotspotPins();
      });

      popoverEl.querySelectorAll("[data-pop-opt]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          configState.components[compKey].selectedOption = btn.dataset.popOpt;
          openPartPopover(compKey);
          refreshInteractiveScene();
        });
      });

      popoverEl.querySelectorAll("[data-pop-color]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          configState.components[compKey].selectedColor = btn.dataset.popColor;
          openPartPopover(compKey);
          refreshInteractiveScene();
        });
      });

      popoverEl.querySelectorAll("[data-pop-mat]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          configState.components[compKey].selectedMaterial = btn.dataset.popMat;
          openPartPopover(compKey);
          refreshInteractiveScene();
        });
      });

      popoverEl.querySelectorAll("[data-pop-stitch]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          configState.components[compKey].selectedStitch = btn.dataset.popStitch;
          openPartPopover(compKey);
          refreshInteractiveScene();
        });
      });

      popoverEl.querySelectorAll("[data-pop-spec1]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          configState.components[compKey].selectedSpec1 = btn.dataset.popSpec1;
          openPartPopover(compKey);
          refreshInteractiveScene();
        });
      });

      popoverEl.querySelectorAll("[data-pop-spec2]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          configState.components[compKey].selectedSpec2 = btn.dataset.popSpec2;
          openPartPopover(compKey);
          refreshInteractiveScene();
        });
      });
    }

    function bindSummaryRowClicks() {
      summaryGridEl?.querySelectorAll("[data-summary-comp]").forEach((row) => {
        row.addEventListener("click", () => {
          openPartPopover(row.dataset.summaryComp);
          document.getElementById("cfgInteractiveStage")?.scrollIntoView({
            behavior: "smooth",
            block: "center"
          });
        });
      });
    }

    const stageEl = document.getElementById("cfgInteractiveStage");
    let isPointerDown = false;
    let pointerStartX = 0;
    let pointerStartY = 0;
    let startRotation = 0;
    let hasDragged = false;

    if (stageEl && canvas360) {
      stageEl.addEventListener("pointerdown", (e) => {
        if (e.target.closest(".cfg-part-popover") || e.target.closest(".cfg-hotspot-pin")) {
          return;
        }
        stopAutoSpin();
        isPointerDown = true;
        hasDragged = false;
        pointerStartX = e.clientX;
        pointerStartY = e.clientY;
        startRotation = configState.rotationAngle;
        stageEl.classList.add("is-dragging");
      });

      window.addEventListener("pointermove", (e) => {
        if (!isPointerDown) return;
        const dx = e.clientX - pointerStartX;
        const dy = e.clientY - pointerStartY;
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
          hasDragged = true;
        }
        if (hasDragged) {
          configState.viewMode = "STUDIO_360";
          configState.rotationAngle = (((startRotation + dx * 0.45) % 360) + 360) % 360;
          refreshInteractiveScene();
        }
      });

      window.addEventListener("pointerup", (e) => {
        if (!isPointerDown) return;
        isPointerDown = false;
        stageEl.classList.remove("is-dragging");

        if (!hasDragged && e.target === canvas360) {
          const rect = canvas360.getBoundingClientRect();
          const clickX = ((e.clientX - rect.left) / rect.width) * 1920;
          const clickY = ((e.clientY - rect.top) / rect.height) * 1080;

          let closestKey = null;
          let minDist = Infinity;
          Object.entries(configState.screenHotspots).forEach(([key, pt]) => {
            const d = Math.hypot(clickX - pt.cx, clickY - pt.cy);
            if (d < minDist) {
              minDist = d;
              closestKey = key;
            }
          });

          if (closestKey && minDist < 240) {
            openPartPopover(closestKey);
          } else if (popoverEl) {
            configState.activePopoverCompKey = null;
            popoverEl.style.display = "none";
            renderHotspotPins();
          }
        }
      });
    }

    sliderEl?.addEventListener("input", () => {
      stopAutoSpin();
      configState.viewMode = "STUDIO_360";
      configState.rotationAngle = parseFloat(sliderEl.value) || 0;
      refreshInteractiveScene();
    });

    container.querySelectorAll("[data-angle-preset]").forEach((btn) => {
      btn.addEventListener("click", () => {
        stopAutoSpin();
        configState.viewMode = "STUDIO_360";
        configState.rotationAngle = parseFloat(btn.dataset.anglePreset) || 0;
        refreshInteractiveScene();
      });
    });

    const autoSpinBtn = document.getElementById("cfgAutoSpin360Btn");
    autoSpinBtn?.addEventListener("click", () => {
      if (configState.isAutoSpinning) {
        stopAutoSpin();
      } else {
        configState.viewMode = "STUDIO_360";
        configState.isAutoSpinning = true;
        autoSpinBtn.classList.add("is-active");
        autoSpinBtn.textContent = "⏸ Parar Rotação 360°";
        const spinStep = () => {
          if (!configState.isAutoSpinning) return;
          configState.rotationAngle = (configState.rotationAngle + 0.85) % 360;
          refreshInteractiveScene();
          configState.autoSpinRafId = requestAnimationFrame(spinStep);
        };
        configState.autoSpinRafId = requestAnimationFrame(spinStep);
      }
    });

    const toggleHotspotsBtn = document.getElementById("cfgToggleHotspotsBtn");
    toggleHotspotsBtn?.addEventListener("click", () => {
      configState.showHotspots = !configState.showHotspots;
      toggleHotspotsBtn.textContent = configState.showHotspots
        ? "👁 Ocultar Pontos (12)"
        : "👁 Mostrar Pontos (12)";
      renderHotspotPins();
    });

    document.getElementById("cfgReviewZoomBtn")?.addEventListener("click", () => {
      openRenderLightbox(configState.lastRenderDataUrl, getLocalizedText(targetModel?.name));
    });

    document.getElementById("cfgDownload360RenderBtn")?.addEventListener("click", () => {
      if (configState.lastRenderDataUrl) {
        const a = document.createElement("a");
        a.href = configState.lastRenderDataUrl;
        a.download = `${configState.projectCode}-Bandit-Render-8K.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    });

    document.getElementById("cfgBackToStep2")?.addEventListener("click", () => {
      stopAutoSpin();
      configState.step = 2;
      renderConfigurator();
      window.scrollTo({
        top: document.getElementById("configurator").offsetTop - 80,
        behavior: "smooth"
      });
    });

    document.getElementById("cfgSubmissionForm")?.addEventListener("submit", handleConfigSubmit);

    await refreshInteractiveScene();
  }

  // SUBMISSÃO PARA O BACKOFFICE BANDIT APP
  function handleConfigSubmit(e) {
    e.preventDefault();
    stopAutoSpin();
    const form = e.target;
    const submitBtn = document.getElementById("cfgSubmitBtn");

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "A registar configuração...";
    }

    const formData = new FormData(form);
    const targetModel = (window.CONFIGURATOR_MODELS || []).find(
      (m) => m.id === configState.targetModelId
    );
    const projectCode = configState.projectCode;

    const quotePayload = {
      projectCode: projectCode,
      requestType: "MOTORCYCLE_CONFIGURATOR_QUOTE_REQUEST",
      status: "1_NOVO_PEDIDO_COTACAO",
      boWorkflowStatus: "NEW_QUOTE_REQUEST",
      submissionDate: new Date().toISOString(),
      customer: {
        name: formData.get("customer_name"),
        email: formData.get("customer_email"),
        phone: formData.get("customer_phone"),
        location: formData.get("customer_location")
      },
      donorOption: formData.get("donor_option"),
      targetModel: {
        id: targetModel?.id,
        category: targetModel?.category,
        name: getLocalizedText(targetModel?.name)
      },
      componentsConfig: configState.components,
      notes: formData.get("customer_notes") || configState.notes,
      generatedImageUrl: configState.lastRenderDataUrl
    };

    try {
      const existingQuotes = JSON.parse(localStorage.getItem("bandit_bo_moto_projects") || "[]");
      existingQuotes.unshift(quotePayload);
      localStorage.setItem("bandit_bo_moto_projects", JSON.stringify(existingQuotes));
    } catch (_err) {}

    const container = document.getElementById("configuratorWizardContainer");
    if (container) {
      container.innerHTML = `
        <div class="cfg-success-box">
          <div class="cfg-success-badge">✓ Configuração Registada</div>
          <h2>Pedido de Cotação Submetido com Sucesso</h2>
          <p class="cfg-code-display">Código do Projeto: <strong>${projectCode}</strong></p>

          <div class="cfg-success-render-box">
            <img src="${configState.lastRenderDataUrl || targetModel?.image}" alt="Render Oficial Bandit" />
            <div class="cfg-success-render-footer">
              <span><strong>Modelo:</strong> ${getLocalizedText(targetModel?.name)} • 12 Tópicos Configurados</span>
              <a href="${configState.lastRenderDataUrl || targetModel?.image}" download="${projectCode}-Bandit-Render-8K.jpg" class="cfg-btn-studio">
                ⬇ Descarregar Render 8K
              </a>
            </div>
          </div>

          <div class="cfg-success-card">
            <h4>Próximos Passos</h4>
            <ol class="cfg-steps-list">
              <li><strong>1. Análise Técnica:</strong> A equipa Bandit Garage vai rever o modelo <em>${getLocalizedText(targetModel?.name)}</em> e os 12 tópicos de acessórios que selecionou.</li>
              <li><strong>2. Proposta Orçamentada:</strong> Prepararemos a cotação detalhada e o prazo estimado de produção.</li>
              <li><strong>3. Contacto Direto:</strong> Entraremos em contacto através de <strong>${quotePayload.customer.email}</strong> ou telefone.</li>
            </ol>
          </div>

          <div class="cfg-success-actions">
            <button type="button" class="btn btn-outline" id="cfgRestartBtn">
              Nova Configuração
            </button>
            <a href="#store" class="btn btn-primary">
              Explorar Bandit Store
            </a>
          </div>
        </div>
      `;

      const restartBtn = document.getElementById("cfgRestartBtn");
      if (restartBtn) {
        restartBtn.addEventListener("click", () => {
          configState.projectCode = `MOTO-${new Date().getFullYear()}-${String(
            Math.floor(100 + Math.random() * 900)
          )}`;
          configState.step = 1;
          renderConfigurator();
        });
      }
    }
  }

  function bindStepperClicks() {
    document.querySelectorAll(".cfg-step-indicator").forEach((stepEl) => {
      stepEl.addEventListener("click", () => {
        const targetStep = parseInt(stepEl.dataset.step, 10);
        if (targetStep >= 1 && targetStep <= 3) {
          configState.step = targetStep;
          renderConfigurator();
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initDefaultComponents();
    bindStepperClicks();
    renderConfigurator();
  });

  window.MotorcycleConfigurator = {
    render: renderConfigurator,
    getState: () => configState
  };
})();
