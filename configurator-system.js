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
    showHotspots: false,
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

  // ============================================================================
  // GEOMETRIA CIRÚRGICA DAS MÁSCARAS POLIGONAIS (ZERO SANGRAMENTO FORA DA PEÇA!)
  // ============================================================================
  const STUDIO_VIEWS_META = {
    SIDE: {
      url: "renders/bespoke-scrambler-render-v2.jpg",
      emblemHealBox: { x1: 834, x2: 940, yTop: 382, yBot: 414 },
      tankPolys: [
        [
          [784, 412],
          [782, 365],
          [790, 320],
          [808, 280],
          [838, 250],
          [885, 232],
          [950, 220],
          [1032, 215],
          [1038, 224],
          [1132, 224],
          [1168, 226],
          [1198, 238],
          [1204, 252],
          [1182, 272],
          [1166, 302],
          [1164, 326],
          [1182, 328],
          [1208, 302],
          [1224, 282],
          [1236, 305],
          [1238, 345],
          [1225, 388],
          [1202, 422],
          [1155, 434],
          [1050, 436],
          [935, 432],
          [835, 425]
        ]
      ],
      tankExcludePolys: [
        // Tampão Monza em bronze
        [
          [1030, 175],
          [1138, 175],
          [1138, 225],
          [1030, 225]
        ],
        // Espelho bar-end preto/bronze sobreposto na direita do depósito
        [
          [1160, 250],
          [1224, 250],
          [1224, 332],
          [1160, 332]
        ]
      ],
      seatBox: { x1: 490, y1: 285, x2: 772, y2: 386 },
      forkBox: { x1: 1255, y1: 195, x2: 1465, y2: 565 },
      shockPolys: [
        [
          [604, 488],
          [636, 514],
          [532, 622],
          [500, 596]
        ]
      ],
      gripBox: { x1: 1195, y1: 175, x2: 1280, y2: 248 },
      caliperPolys: [
        [
          [1318, 594],
          [1362, 590],
          [1368, 668],
          [1324, 672]
        ]
      ],
      frontWheel: { cx: 1529, cy: 684, rx: 245, ry: 245 },
      rearWheel: { cx: 395, cy: 662, rx: 245, ry: 245 },
      stripeCurves: [
        [812, 326],
        [882, 268],
        [980, 244],
        [1095, 248],
        [1188, 280]
      ],
      centerStripePoly: [
        [802, 286],
        [890, 234],
        [1020, 218],
        [1162, 226],
        [1196, 240],
        [1175, 260],
        [1025, 246],
        [895, 258],
        [806, 308]
      ],
      headlightCircle: { cx: 1408, cy: 252, rx: 16, ry: 56 },
      anchors: {
        tank: { x: 1015, y: 325 },
        seat: { x: 635, y: 332 },
        frontSuspension: { x: 1368, y: 425 },
        rearSuspension: { x: 565, y: 552 },
        wheels: { x: 382, y: 655 },
        tires: { x: 1685, y: 555 },
        handlebar: { x: 1185, y: 155 },
        turnSignals: { x: 1125, y: 258 },
        brakes: { x: 1342, y: 632 },
        headlight: { x: 1405, y: 252 },
        speedometer: { x: 1315, y: 155 },
        grips: { x: 1235, y: 212 }
      }
    },
    FRONT_34: {
      url: "renders/turntable-front-34.jpg",
      emblemHealBox: { x1: 758, x2: 848, yTop: 318, yBot: 368 },
      tankPolys: [
        [
          [746, 368],
          [746, 310],
          [758, 255],
          [782, 205],
          [822, 168],
          [878, 148],
          [945, 138],
          [990, 138],
          [995, 152],
          [1068, 154],
          [1112, 185],
          [1135, 235],
          [1136, 305],
          [1118, 362],
          [1075, 405],
          [1010, 415],
          [905, 402],
          [805, 385]
        ]
      ],
      tankExcludePolys: [
        // Tampão Monza
        [
          [988, 100],
          [1076, 100],
          [1076, 156],
          [988, 156]
        ],
        // Punho esquerdo + guiador + manete sobrepostos ao depósito
        [
          [870, 182],
          [1062, 142],
          [1105, 155],
          [1105, 208],
          [948, 236],
          [872, 228]
        ],
        // Espelho bar-end redondo preto + haste sobrepostos ao depósito
        [
          [855, 238],
          [892, 210],
          [935, 215],
          [950, 252],
          [938, 294],
          [902, 310],
          [862, 302],
          [848, 275]
        ]
      ],
      seatBox: { x1: 545, y1: 162, x2: 768, y2: 302 },
      forkBox: { x1: 1125, y1: 185, x2: 1425, y2: 585 },
      shockPolys: [
        [
          [596, 400],
          [626, 424],
          [522, 540],
          [492, 516]
        ]
      ],
      gripBox: { x1: 870, y1: 138, x2: 1060, y2: 232 },
      caliperPolys: [
        [
          [1248, 636],
          [1288, 632],
          [1296, 696],
          [1254, 700]
        ]
      ],
      frontWheel: { cx: 1381, cy: 682, rx: 225, ry: 255 },
      rearWheel: { cx: 452, cy: 535, rx: 205, ry: 235 },
      stripeCurves: [
        [776, 265],
        [845, 192],
        [935, 165],
        [1045, 178],
        [1112, 238]
      ],
      centerStripePoly: [
        [775, 218],
        [865, 155],
        [982, 140],
        [1088, 168],
        [1072, 192],
        [975, 166],
        [868, 180],
        [782, 240]
      ],
      headlightCircle: { cx: 1326, cy: 222, rx: 52, ry: 76 },
      anchors: {
        tank: { x: 985, y: 295 },
        seat: { x: 645, y: 232 },
        frontSuspension: { x: 1225, y: 445 },
        rearSuspension: { x: 532, y: 432 },
        wheels: { x: 425, y: 545 },
        tires: { x: 1585, y: 615 },
        handlebar: { x: 1135, y: 118 },
        turnSignals: { x: 902, y: 258 },
        brakes: { x: 1275, y: 662 },
        headlight: { x: 1326, y: 222 },
        speedometer: { x: 1255, y: 118 },
        grips: { x: 962, y: 185 }
      }
    },
    REAR_34: {
      url: "renders/turntable-rear-34.jpg",
      emblemHealBox: { x1: 1002, x2: 1132, yTop: 325, yBot: 372 },
      tankPolys: [
        [
          [878, 275],
          [902, 222],
          [945, 185],
          [1015, 162],
          [1095, 156],
          [1102, 165],
          [1182, 166],
          [1235, 180],
          [1282, 218],
          [1306, 272],
          [1306, 338],
          [1282, 386],
          [1235, 408],
          [1135, 410],
          [965, 398],
          [946, 382],
          [942, 305],
          [918, 285]
        ]
      ],
      tankExcludePolys: [
        [
          [1092, 108],
          [1192, 108],
          [1192, 166],
          [1092, 166]
        ]
      ],
      seatBox: { x1: 582, y1: 205, x2: 912, y2: 348 },
      forkBox: { x1: 1295, y1: 145, x2: 1495, y2: 565 },
      shockPolys: [
        [
          [755, 455],
          [796, 478],
          [695, 635],
          [654, 612]
        ]
      ],
      gripBox: { x1: 1372, y1: 72, x2: 1485, y2: 158 },
      caliperPolys: [
        [
          [1416, 568],
          [1448, 565],
          [1454, 622],
          [1422, 625]
        ]
      ],
      frontWheel: { cx: 1514, cy: 586, rx: 185, ry: 215 },
      rearWheel: { cx: 455, cy: 652, rx: 245, ry: 265 },
      stripeCurves: [
        [942, 248],
        [1025, 194],
        [1135, 184],
        [1238, 206],
        [1288, 255]
      ],
      centerStripePoly: [
        [915, 224],
        [1018, 165],
        [1145, 162],
        [1255, 192],
        [1240, 214],
        [1140, 186],
        [1022, 190],
        [928, 244]
      ],
      headlightCircle: { cx: 1412, cy: 212, rx: 28, ry: 52 },
      anchors: {
        tank: { x: 1125, y: 285 },
        seat: { x: 755, y: 272 },
        frontSuspension: { x: 1415, y: 425 },
        rearSuspension: { x: 725, y: 535 },
        wheels: { x: 465, y: 625 },
        tires: { x: 1585, y: 585 },
        handlebar: { x: 1225, y: 122 },
        turnSignals: { x: 1485, y: 175 },
        brakes: { x: 1432, y: 605 },
        headlight: { x: 1412, y: 212 },
        speedometer: { x: 1325, y: 125 },
        grips: { x: 1425, y: 115 }
      }
    }
  };

  function getVisualSignature(v) {
    return [
      v.tankColorKey,
      v.tankHex,
      v.tankFinish,
      v.tankStripe,
      v.seatMat,
      v.seatHex,
      v.frontColorKey,
      v.forkHex,
      v.rearSpringKey,
      v.rearSuspOpt,
      v.wheelRimFinish,
      v.tireOpt,
      v.brakeOpt,
      v.caliperSpec,
      v.isYellowLens,
      v.gripHex
    ].join("|");
  }

  /**
   * Desenha uma máscara poligonal cirúrgica com recorte rígido (ctx.clip()) no contorno exato
   * para garantir matematicamente ZERO sangramento/espelhamento fora da peça.
   */
  function buildSurgicalPolygonMaskData(mCtx, includePolys, excludePolys, featherPx) {
    if (!mCtx || !includePolys || !includePolys.length) return null;
    let minX = 1920,
      minY = 1080,
      maxX = 0,
      maxY = 0;
    includePolys.forEach((poly) => {
      poly.forEach((pt) => {
        if (pt[0] < minX) minX = pt[0];
        if (pt[0] > maxX) maxX = pt[0];
        if (pt[1] < minY) minY = pt[1];
        if (pt[1] > maxY) maxY = pt[1];
      });
    });
    minX = Math.max(0, Math.floor(minX - 2));
    minY = Math.max(0, Math.floor(minY - 2));
    maxX = Math.min(1919, Math.ceil(maxX + 2));
    maxY = Math.min(1079, Math.ceil(maxY + 2));
    const bw = maxX - minX + 1;
    const bh = maxY - minY + 1;
    if (bw <= 0 || bh <= 0) return null;

    mCtx.clearRect(minX, minY, bw, bh);
    mCtx.save();
    // 1. CLIP RÍGIDO ao contorno exato da peça: nenhum píxel fora do polígono pode jamais ser alterado!
    mCtx.beginPath();
    includePolys.forEach((poly) => {
      poly.forEach((pt, idx) => {
        if (idx === 0) mCtx.moveTo(pt[0], pt[1]);
        else mCtx.lineTo(pt[0], pt[1]);
      });
      mCtx.closePath();
    });
    mCtx.clip();

    // 2. Preenchimento interno com anti-aliasing suave restrito ao interior do clip
    mCtx.filter = featherPx > 0 ? `blur(${featherPx}px)` : "none";
    mCtx.fillStyle = "#ffffff";
    mCtx.beginPath();
    includePolys.forEach((poly) => {
      poly.forEach((pt, idx) => {
        if (idx === 0) mCtx.moveTo(pt[0], pt[1]);
        else mCtx.lineTo(pt[0], pt[1]);
      });
      mCtx.closePath();
    });
    mCtx.fill();

    // 3. Subtrair zonas excluídas (tampão Monza, espelho bar-end, punho/manete)
    if (excludePolys && excludePolys.length > 0) {
      mCtx.globalCompositeOperation = "destination-out";
      mCtx.filter = "blur(1.2px)";
      mCtx.beginPath();
      excludePolys.forEach((poly) => {
        poly.forEach((pt, idx) => {
          if (idx === 0) mCtx.moveTo(pt[0], pt[1]);
          else mCtx.lineTo(pt[0], pt[1]);
        });
        mCtx.closePath();
      });
      mCtx.fill();
    }
    mCtx.restore();

    return {
      minX,
      minY,
      maxX,
      maxY,
      bw,
      bh,
      alphaData: mCtx.getImageData(minX, minY, bw, bh).data
    };
  }

  /**
   * Processa uma vista fotográfica 8K de estúdio ao nível do píxel com máscaras cirúrgicas,
   * garantindo 100% de cobertura sólida dentro de cada peça e 0% de sangramento fora da área.
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

    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = 1920;
    maskCanvas.height = 1080;
    const mCtx = maskCanvas.getContext("2d", { willReadFrequently: true });

    try {
      const imgData = ctx.getImageData(0, 0, 1920, 1080);
      const data = imgData.data;

      // 2. Remover de forma 100% invisível o emblema original no depósito por interpolação vertical contínua
      // (evita manchas escuras nas cores claras e evita texto invertido ao rodar 360°)
      if (meta.emblemHealBox) {
        const hb = meta.emblemHealBox;
        const spanY = Math.max(1, hb.yBot - hb.yTop);
        for (let x = hb.x1; x <= hb.x2; x++) {
          const topIdx = (hb.yTop * 1920 + x) * 4;
          const botIdx = (hb.yBot * 1920 + x) * 4;
          const rTop = data[topIdx],
            gTop = data[topIdx + 1],
            bTop = data[topIdx + 2];
          const rBot = data[botIdx],
            gBot = data[botIdx + 1],
            bBot = data[botIdx + 2];
          for (let y = hb.yTop + 1; y < hb.yBot; y++) {
            const t = (y - hb.yTop) / spanY;
            const pIdx = (y * 1920 + x) * 4;
            data[pIdx] = Math.round(rTop + (rBot - rTop) * t);
            data[pIdx + 1] = Math.round(gTop + (gBot - gTop) * t);
            data[pIdx + 2] = Math.round(bTop + (bBot - bTop) * t);
          }
        }
      }

      // ======================================================================
      // PEÇA 01: DEPÓSITO E PINTURA (Todas as 6 cores + 3 acabamentos funcionam a 100% sem falhas!)
      // ======================================================================
      const tankMask = buildSurgicalPolygonMaskData(
        mCtx,
        meta.tankPolys,
        meta.tankExcludePolys,
        1.5
      );
      if (tankMask) {
        for (let y = tankMask.minY; y <= tankMask.maxY; y++) {
          const maskRow = (y - tankMask.minY) * tankMask.bw;
          const imgRow = y * 1920;
          for (let x = tankMask.minX; x <= tankMask.maxX; x++) {
            const mAlpha = tankMask.alphaData[(maskRow + (x - tankMask.minX)) * 4 + 3];
            if (mAlpha < 4) continue;

            const pIdx = (imgRow + x) * 4;
            const r = data[pIdx];
            const g = data[pIdx + 1];
            const b = data[pIdx + 2];
            // Luminância percetual real da iluminação de estúdio sobre o depósito (funciona em luz fria e quente!)
            const lRaw = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

            let outH = 215;
            let outS = 0.05;
            let outL = lRaw;

            if (v.tankColorKey === "alpine_white") {
              outH = 42;
              outS = 0.06;
              outL = Math.max(0.54, Math.min(0.98, 0.56 + Math.pow(lRaw, 0.56) * 0.44));
            } else if (v.tankColorKey === "british_green") {
              outH = 144;
              outS = 0.64 * (1 - Math.pow(Math.abs(2 * lRaw - 1), 2.2) * 0.32);
              outL = Math.max(0.04, Math.min(0.78, 0.03 + Math.pow(lRaw, 0.85) * 0.84));
            } else if (v.tankColorKey === "midnight_blue") {
              outH = 220;
              outS = 0.78 * (1 - Math.pow(Math.abs(2 * lRaw - 1), 2.2) * 0.28);
              outL = Math.max(0.05, Math.min(0.82, 0.05 + Math.pow(lRaw, 0.8) * 0.88));
            } else if (v.tankColorKey === "nardo_grey") {
              outH = 208;
              outS = 0.08;
              outL = Math.max(0.18, Math.min(0.84, 0.2 + Math.pow(lRaw, 0.75) * 0.65));
            } else if (v.tankColorKey === "desert_sand") {
              outH = 35;
              outS = 0.48 * (1 - Math.max(0, lRaw - 0.58) * 0.45);
              outL = Math.max(0.16, Math.min(0.88, 0.18 + Math.pow(lRaw, 0.72) * 0.72));
            } else if (v.tankColorKey === "classic_silver") {
              outH = 210;
              outS = 0.03;
              outL = Math.max(0.42, Math.min(0.96, 0.44 + Math.pow(lRaw, 0.62) * 0.54));
            } else {
              // bandit_black (Preto Bandit Mate / Profundo)
              outH = 215;
              outS = 0.05;
              outL = Math.max(0.02, Math.min(0.68, Math.pow(lRaw, 1.16) * 0.74));
            }

            if (v.tankFinish === "raw_brushed") {
              outS = Math.min(0.08, outS * 0.3);
              outL = Math.min(0.9, 0.12 + Math.pow(lRaw, 0.78) * 0.82);
            } else if (v.tankFinish === "gloss_ceramic") {
              const specBoost =
                lRaw > 0.32
                  ? Math.pow((lRaw - 0.32) / 0.68, 1.35) * 0.18
                  : -0.02 * (0.32 - lRaw);
              outL = Math.max(0.02, Math.min(0.94, outL + specBoost));
            }

            const blend = mAlpha / 255;
            const [nr, ng, nb] = hslToRgb(outH, outS, outL);
            data[pIdx] = Math.round(r + (nr - r) * blend);
            data[pIdx + 1] = Math.round(g + (ng - g) * blend);
            data[pIdx + 2] = Math.round(b + (nb - b) * blend);
          }
        }
      }

      // ======================================================================
      // PEÇA 02: ASSENTO EM PELE ARTESANAL (Todos os 5 materiais restritos ao contorno exato!)
      // ======================================================================
      if (v.seatMat !== "cognac_leather" && meta.seatBox) {
        const sb = meta.seatBox;
        for (let y = sb.y1; y <= sb.y2; y++) {
          const imgRow = y * 1920;
          for (let x = sb.x1; x <= sb.x2; x++) {
            const pIdx = (imgRow + x) * 4;
            const r = data[pIdx];
            const g = data[pIdx + 1];
            const b = data[pIdx + 2];
            // Detetar estritamente os píxeis de pele conhaque do assento (zero parede cinzenta!)
            const warmth = Math.min(r - b - 12, (g - b) * 3.5);
            if (warmth <= 0 || r < 34) continue;
            const blend = Math.min(1, warmth / 18);
            const lRaw = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

            let outH = 24;
            let outS = 0.65;
            let outL = lRaw;

            if (v.seatMat === "black_nautical") {
              outH = 215;
              outS = 0.05;
              outL = Math.max(0.03, Math.min(0.44, 0.02 + Math.pow(lRaw, 1.05) * 0.42));
            } else if (v.seatMat === "alcantara_suede") {
              outH = 215;
              outS = 0.1;
              outL = Math.max(0.06, Math.min(0.58, 0.07 + Math.pow(lRaw, 0.85) * 0.52));
            } else if (v.seatMat === "chocolate_leather") {
              outH = 18;
              outS = 0.58;
              outL = Math.max(0.04, Math.min(0.55, 0.03 + Math.pow(lRaw, 0.95) * 0.54));
            } else if (v.seatMat === "crimson_red") {
              outH = 355;
              outS = 0.78;
              outL = Math.max(0.05, Math.min(0.68, 0.04 + Math.pow(lRaw, 0.86) * 0.7));
            }

            const [nr, ng, nb] = hslToRgb(outH, outS, outL);
            data[pIdx] = Math.round(r + (nr - r) * blend);
            data[pIdx + 1] = Math.round(g + (ng - g) * blend);
            data[pIdx + 2] = Math.round(b + (nb - b) * blend);
          }
        }
      }

      // ======================================================================
      // PEÇA 03: BAINHAS DIANTEIRAS USD (3 acabamentos restritos aos tubos da forqueta!)
      // ======================================================================
      if (v.frontColorKey !== "gold_racing" && meta.forkBox) {
        const fb = meta.forkBox;
        for (let y = fb.y1; y <= fb.y2; y++) {
          const imgRow = y * 1920;
          for (let x = fb.x1; x <= fb.x2; x++) {
            const pIdx = (imgRow + x) * 4;
            const r = data[pIdx];
            const g = data[pIdx + 1];
            const b = data[pIdx + 2];
            // Detetar estritamente o alumínio anodizado dourado/bronze dos tubos USD
            const warmth = Math.min(r - b - 12, (g - b) * 3.5);
            if (warmth <= 0 || r < 34) continue;
            const blend = Math.min(1, warmth / 18);
            const lRaw = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

            let outH = 215;
            let outS = 0.05;
            let outL = lRaw;
            if (v.frontColorKey === "matte_black") {
              outS = 0.05;
              outL = Math.max(0.03, Math.min(0.42, 0.02 + Math.pow(lRaw, 1.05) * 0.4));
            } else if (v.frontColorKey === "polished_alloy") {
              outH = 210;
              outS = 0.05;
              outL = Math.max(0.12, Math.min(0.92, 0.14 + Math.pow(lRaw, 0.76) * 0.82));
            }

            const [nr, ng, nb] = hslToRgb(outH, outS, outL);
            data[pIdx] = Math.round(r + (nr - r) * blend);
            data[pIdx + 1] = Math.round(g + (ng - g) * blend);
            data[pIdx + 2] = Math.round(b + (nb - b) * blend);
          }
        }
      }

      // ======================================================================
      // PEÇA 04: SUSPENSÃO TRASEIRA (Restrito estritamente às espiras da mola — ZERO parede!)
      // ======================================================================
      const shockMask = buildSurgicalPolygonMaskData(mCtx, meta.shockPolys, null, 1.0);
      if (shockMask) {
        const isYellowSpring =
          v.rearSpringKey === "ohlins_yellow" || v.rearSuspOpt === "ohlins_piggyback_gold";
        const isTotalBlack = v.rearSpringKey === "total_black";
        if (isYellowSpring || isTotalBlack) {
          for (let y = shockMask.minY; y <= shockMask.maxY; y++) {
            const maskRow = (y - shockMask.minY) * shockMask.bw;
            const imgRow = y * 1920;
            for (let x = shockMask.minX; x <= shockMask.maxX; x++) {
              const mAlpha = shockMask.alphaData[(maskRow + (x - shockMask.minX)) * 4 + 3];
              if (mAlpha < 8) continue;

              const pIdx = (imgRow + x) * 4;
              const r = data[pIdx];
              const g = data[pIdx + 1];
              const b = data[pIdx + 2];
              const lRaw = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

              if (isYellowSpring) {
                // Colorir apenas as espiras metálicas iluminadas da mola (preserva o intervalo escuro entre espiras)
                if (lRaw >= 0.085 && lRaw <= 0.75) {
                  const coilStrength =
                    (mAlpha / 255) * Math.min(1, (lRaw - 0.08) * 6.5) * 0.92;
                  const [nr, ng, nb] = hslToRgb(
                    46,
                    0.92,
                    Math.min(0.8, 0.14 + Math.pow(lRaw, 0.75) * 0.85)
                  );
                  data[pIdx] = Math.round(r + (nr - r) * coilStrength);
                  data[pIdx + 1] = Math.round(g + (ng - g) * coilStrength);
                  data[pIdx + 2] = Math.round(b + (nb - b) * coilStrength);
                }
              } else if (isTotalBlack) {
                const blend = (mAlpha / 255) * 0.75;
                const [nr, ng, nb] = hslToRgb(215, 0.04, lRaw * 0.42);
                data[pIdx] = Math.round(r + (nr - r) * blend);
                data[pIdx + 1] = Math.round(g + (ng - g) * blend);
                data[pIdx + 2] = Math.round(b + (nb - b) * blend);
              }
            }
          }
        }
      }

      // ======================================================================
      // PEÇA 05 & 06: JANTES E PNEUS (Tacos TKC80 / Vintage Canelado Firestone / Estrada Avon + Aros)
      // ======================================================================
      if (
        (v.tireOpt && v.tireOpt !== "continental_tkc80") ||
        (v.wheelRimFinish && v.wheelRimFinish !== "black_stainless")
      ) {
        const wheelsList = [meta.frontWheel, meta.rearWheel].filter(Boolean);
        wheelsList.forEach((wh) => {
          const xStart = Math.max(0, Math.floor(wh.cx - wh.rx * 1.05));
          const xEnd = Math.min(1919, Math.ceil(wh.cx + wh.rx * 1.05));
          const yStart = Math.max(0, Math.floor(wh.cy - wh.ry * 1.05));
          const yEnd = Math.min(1079, Math.ceil(wh.cy + wh.ry * 1.05));

          for (let y = yStart; y <= yEnd; y++) {
            const rowOff = y * 1920;
            for (let x = xStart; x <= xEnd; x++) {
              const dx = (x - wh.cx) / wh.rx;
              const dy = (y - wh.cy) / wh.ry;
              const rNorm = Math.hypot(dx, dy);
              if (rNorm < 0.25 || rNorm > 1.02) continue;

              const pIdx = (rowOff + x) * 4;
              const r = data[pIdx],
                g = data[pIdx + 1],
                b = data[pIdx + 2];
              const lRaw = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

              // Zona dos Aros e Raios (0.26 a 0.67)
              if (rNorm >= 0.26 && rNorm <= 0.67 && v.wheelRimFinish !== "black_stainless") {
                if (v.wheelRimFinish === "polished_classic" && rNorm >= 0.54 && rNorm <= 0.66) {
                  // Aro em Alumínio Polido Clássico
                  if (lRaw > 0.03 && lRaw < 0.55) {
                    const rimWeight =
                      (1 - Math.abs(rNorm - 0.6) / 0.065) * 0.72;
                    if (rimWeight > 0) {
                      const [nr, ng, nb] = hslToRgb(210, 0.04, Math.min(0.88, 0.35 + lRaw * 0.95));
                      data[pIdx] = Math.round(r + (nr - r) * rimWeight);
                      data[pIdx + 1] = Math.round(g + (ng - g) * rimWeight);
                      data[pIdx + 2] = Math.round(b + (nb - b) * rimWeight);
                    }
                  }
                } else if (v.wheelRimFinish === "total_black_satin") {
                  // Total Black Satin: escurecer raios inox
                  if (lRaw > 0.18) {
                    data[pIdx] = Math.round(r * 0.45);
                    data[pIdx + 1] = Math.round(g * 0.45);
                    data[pIdx + 2] = Math.round(b * 0.48);
                  }
                }
              }

              // Zona do Pneu (0.68 a 1.01)
              if (rNorm >= 0.68 && rNorm <= 1.01 && v.tireOpt !== "continental_tkc80") {
                const warmth = r - b;
                if (v.tireOpt === "avon_roadrider_mk2" || v.tireOpt === "pirelli_mt60_rs") {
                  // Pneu desportivo de estrada / street tracker: remover reflexo castanho-terra dos tacos e dar borracha preta acetinada limpa
                  if (warmth > 6 || rNorm > 0.88) {
                    const rubberL = Math.max(0.03, Math.min(0.28, lRaw * 0.62));
                    const [nr, ng, nb] = hslToRgb(215, 0.04, rubberL);
                    const w = Math.min(1, Math.max(0.45, warmth / 24));
                    data[pIdx] = Math.round(r + (nr - r) * w);
                    data[pIdx + 1] = Math.round(g + (ng - g) * w);
                    data[pIdx + 2] = Math.round(b + (nb - b) * w);
                  }
                  // Linha fina desportiva na parede lateral para distinguir Pirelli / Avon
                  if (Math.abs(rNorm - 0.75) < 0.014 && lRaw > 0.03) {
                    const stripeAlpha = (1 - Math.abs(rNorm - 0.75) / 0.014) * 0.55;
                    const [sr, sg, sb2] =
                      v.tireOpt === "pirelli_mt60_rs"
                        ? [215, 165, 45]
                        : [200, 208, 220];
                    data[pIdx] = Math.round(data[pIdx] + (sr - data[pIdx]) * stripeAlpha);
                    data[pIdx + 1] = Math.round(data[pIdx + 1] + (sg - data[pIdx + 1]) * stripeAlpha);
                    data[pIdx + 2] = Math.round(data[pIdx + 2] + (sb2 - data[pIdx + 2]) * stripeAlpha);
                  }
                } else if (v.tireOpt === "firestone_deluxe") {
                  // Firestone Deluxe Champion: parede lateral clássica vintage c/ anel creme/marfim subtil e borracha escura
                  if (warmth > 6) {
                    const [nr, ng, nb] = hslToRgb(215, 0.03, lRaw * 0.65);
                    data[pIdx] = Math.round(r + (nr - r) * 0.8);
                    data[pIdx + 1] = Math.round(g + (ng - g) * 0.8);
                    data[pIdx + 2] = Math.round(b + (nb - b) * 0.8);
                  }
                  if (rNorm >= 0.71 && rNorm <= 0.785 && lRaw > 0.025 && lRaw < 0.45) {
                    const bandW =
                      (1 - Math.abs(rNorm - 0.747) / 0.038) * 0.68;
                    if (bandW > 0) {
                      const [vr, vg, vb] = hslToRgb(40, 0.28, Math.min(0.78, 0.42 + lRaw * 0.65));
                      data[pIdx] = Math.round(data[pIdx] + (vr - data[pIdx]) * bandW);
                      data[pIdx + 1] = Math.round(data[pIdx + 1] + (vg - data[pIdx + 1]) * bandW);
                      data[pIdx + 2] = Math.round(data[pIdx + 2] + (vb - data[pIdx + 2]) * bandW);
                    }
                  }
                } else if (v.tireOpt === "heidenau_k60_ranger") {
                  // Heidenau K60 Ranger: taco de aventura em borracha grafite reforçada
                  if (warmth > 8) {
                    const [nr, ng, nb] = hslToRgb(42, 0.18, Math.min(0.42, lRaw * 0.82));
                    data[pIdx] = Math.round(r + (nr - r) * 0.75);
                    data[pIdx + 1] = Math.round(g + (ng - g) * 0.75);
                    data[pIdx + 2] = Math.round(b + (nb - b) * 0.75);
                  }
                }
              }
            }
          }
        });
      }

      // ======================================================================
      // PEÇA 09: PINÇA DE TRAVÃO (Brembo M4 / Série Oro / Beringer CNC Vermelho / Hel + 3 Cores)
      // ======================================================================
      if (meta.caliperPolys) {
        let calMode = v.caliperSpec || "black_red_logo";
        if (calMode === "black_red_logo") {
          if (v.brakeOpt === "brembo_oro_rcs19") calMode = "gold_anodized";
          else if (v.brakeOpt === "beringer_aerotec_cnc") calMode = "beringer_red";
          else if (v.brakeOpt === "hel_braided_oem") calMode = "titanium_raw";
        }
        if (calMode !== "black_red_logo") {
          const calMask = buildSurgicalPolygonMaskData(mCtx, meta.caliperPolys, null, 1.0);
          if (calMask) {
            for (let y = calMask.minY; y <= calMask.maxY; y++) {
              const maskRow = (y - calMask.minY) * calMask.bw;
              const imgRow = y * 1920;
              for (let x = calMask.minX; x <= calMask.maxX; x++) {
                const mAlpha = calMask.alphaData[(maskRow + (x - calMask.minX)) * 4 + 3];
                if (mAlpha < 6) continue;
                const pIdx = (imgRow + x) * 4;
                const r = data[pIdx],
                  g = data[pIdx + 1],
                  b = data[pIdx + 2];
                const lRaw = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                if (lRaw < 0.065 || lRaw > 0.58) continue;

                let outH = 38,
                  outS = 0.86,
                  outL = Math.min(0.8, 0.18 + Math.pow(lRaw, 0.72) * 0.72);
                if (calMode === "beringer_red") {
                  outH = 356;
                  outS = 0.84;
                  outL = Math.min(0.74, 0.16 + Math.pow(lRaw, 0.74) * 0.68);
                } else if (calMode === "titanium_raw") {
                  outH = 210;
                  outS = 0.06;
                  outL = Math.min(0.84, 0.24 + Math.pow(lRaw, 0.7) * 0.68);
                }
                const blend = (mAlpha / 255) * 0.88;
                const [nr, ng, nb] = hslToRgb(outH, outS, outL);
                data[pIdx] = Math.round(r + (nr - r) * blend);
                data[pIdx + 1] = Math.round(g + (ng - g) * blend);
                data[pIdx + 2] = Math.round(b + (nb - b) * blend);
              }
            }
          }
        }
      }

      // ======================================================================
      // PEÇA 10: LENTE DO FAROL DIANTEIRO (Amarelo Vintage / Cristal LED)
      // ======================================================================
      if (v.isYellowLens && meta.headlightCircle) {
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
            const r = data[pIdx],
              g = data[pIdx + 1],
              b = data[pIdx + 2];
            const lRaw = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            if (lRaw > 0.15) {
              const lensWeight = (1 - Math.pow(ellDist, 1.8)) * 0.85;
              const [nr, ng, nb] = hslToRgb(48, 0.9, Math.min(0.88, lRaw * 1.1));
              data[pIdx] = Math.round(r + (nr - r) * lensWeight);
              data[pIdx + 1] = Math.round(g + (ng - g) * lensWeight);
              data[pIdx + 2] = Math.round(b + (nb - b) * lensWeight);
            }
          }
        }
      }

      // ======================================================================
      // PEÇA 12: PUNHOS DO GUIADOR (Conhaque / Chocolate Vintage / Preto Perfurado)
      // ======================================================================
      if (v.gripHex !== "#a45526" && meta.gripBox) {
        const gb = meta.gripBox;
        for (let y = gb.y1; y <= gb.y2; y++) {
          const imgRow = y * 1920;
          for (let x = gb.x1; x <= gb.x2; x++) {
            const pIdx = (imgRow + x) * 4;
            const r = data[pIdx],
              g = data[pIdx + 1],
              b = data[pIdx + 2];
            const warmth = Math.min(r - b - 12, (g - b) * 3.5);
            if (warmth <= 0 || r < 34) continue;
            const blend = Math.min(1, warmth / 18);
            const lRaw = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            const isBlackGrip = v.gripHex === "#16181d";
            const outH = isBlackGrip ? 215 : 18;
            const outS = isBlackGrip ? 0.05 : 0.58;
            const outL = isBlackGrip
              ? Math.max(0.03, lRaw * 0.38)
              : Math.max(0.04, lRaw * 0.54);
            const [nr, ng, nb] = hslToRgb(outH, outS, outL);
            data[pIdx] = Math.round(r + (nr - r) * blend);
            data[pIdx + 1] = Math.round(g + (ng - g) * blend);
            data[pIdx + 2] = Math.round(b + (nb - b) * blend);
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);

      // ======================================================================
      // LISTADOS / FAIXAS DE DEPÓSITO (double_pinstripe | motorsport_stripe | clean_pure)
      // Recortado estritamente à máscara cirúrgica tankMask (respeitando tampão Monza e espelho)
      // ======================================================================
      if (v.tankStripe && v.tankStripe !== "clean_pure" && tankMask) {
        const stripeCanvas = document.createElement("canvas");
        stripeCanvas.width = 1920;
        stripeCanvas.height = 1080;
        const sCtx = stripeCanvas.getContext("2d");

        const isLightTank =
          v.tankColorKey === "alpine_white" ||
          v.tankColorKey === "classic_silver" ||
          v.tankColorKey === "desert_sand" ||
          v.tankFinish === "raw_brushed";

        if (v.tankStripe === "double_pinstripe" && meta.stripeCurves) {
          const pts = meta.stripeCurves;
          const drawSmoothCurve = (offsetY, lineW, strokeCol) => {
            sCtx.beginPath();
            sCtx.moveTo(pts[0][0], pts[0][1] + offsetY);
            for (let i = 1; i < pts.length - 1; i++) {
              const xc = (pts[i][0] + pts[i + 1][0]) / 2;
              const yc = (pts[i][1] + pts[i + 1][1]) / 2 + offsetY;
              sCtx.quadraticCurveTo(pts[i][0], pts[i][1] + offsetY, xc, yc);
            }
            const last = pts[pts.length - 1];
            sCtx.lineTo(last[0], last[1] + offsetY);
            sCtx.lineWidth = lineW;
            sCtx.strokeStyle = strokeCol;
            sCtx.lineCap = "round";
            sCtx.stroke();
          };
          const primaryPinCol = isLightTank
            ? "rgba(18, 22, 30, 0.92)"
            : "rgba(232, 200, 132, 0.94)";
          const secondaryPinCol = isLightTank
            ? "rgba(180, 140, 62, 0.88)"
            : "rgba(248, 250, 252, 0.85)";
          drawSmoothCurve(0, 4.0, primaryPinCol);
          drawSmoothCurve(7.5, 2.0, secondaryPinCol);
        } else if (v.tankStripe === "motorsport_stripe" && meta.centerStripePoly) {
          sCtx.fillStyle = isLightTank
            ? "rgba(18, 22, 30, 0.88)"
            : "rgba(241, 245, 249, 0.82)";
          sCtx.beginPath();
          meta.centerStripePoly.forEach((pt, idx) => {
            if (idx === 0) sCtx.moveTo(pt[0], pt[1]);
            else sCtx.lineTo(pt[0], pt[1]);
          });
          sCtx.closePath();
          sCtx.fill();
          sCtx.strokeStyle = "rgba(212, 175, 55, 0.95)";
          sCtx.lineWidth = 2.8;
          sCtx.stroke();
        }

        // Aplicar estritamente dentro de tankMask (garantindo que nunca pinta sobre o espelho ou tampão)
        const sData = sCtx.getImageData(
          tankMask.minX,
          tankMask.minY,
          tankMask.bw,
          tankMask.bh
        );
        const sArr = sData.data;
        const mArr = tankMask.alphaData;
        const boxPixels = tankMask.bw * tankMask.bh;
        for (let i = 0; i < boxPixels; i++) {
          const p4 = i * 4 + 3;
          sArr[p4] = Math.round((sArr[p4] * mArr[p4]) / 255);
        }
        sCtx.clearRect(0, 0, 1920, 1080);
        sCtx.putImageData(sData, tankMask.minX, tankMask.minY);
        ctx.drawImage(stripeCanvas, 0, 0);
      }
    } catch (_err) {
      // Fallback seguro
    }

    // Se a vista for espelhada (180° perfil esquerdo), inverter horizontalmente o canvas já tratado
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
  // MOTOR DE ROTAÇÃO 360° CONTÍNUA E SUAVE A 60 FPS (PROJEÇÃO PERSPETIVA 3D REAL)
  // Zero saltos entre fotografias diferentes, zero fantasmas/dupla exposição, 100% sólido!
  // ============================================================================
  let cachedStudioBackdrop = null;
  const isolatedBikeCache = new Map();
  let lazyExportTimer = null;

  function getStudioBackdropCanvas() {
    if (cachedStudioBackdrop) return cachedStudioBackdrop;
    const bg = document.createElement("canvas");
    bg.width = 1920;
    bg.height = 1080;
    const bCtx = bg.getContext("2d");
    if (!bCtx) return bg;

    // Parede de betão escuro de estúdio (y = 0..715)
    const wallGrad = bCtx.createRadialGradient(960, 380, 120, 960, 420, 1150);
    wallGrad.addColorStop(0, "#1c2026");
    wallGrad.addColorStop(0.55, "#111419");
    wallGrad.addColorStop(1, "#06080c");
    bCtx.fillStyle = wallGrad;
    bCtx.fillRect(0, 0, 1920, 715);

    // Linhas subtis de cofragem de betão arquitetónico de estúdio
    bCtx.strokeStyle = "rgba(255, 255, 255, 0.018)";
    bCtx.lineWidth = 1.5;
    for (let vx = 160; vx < 1920; vx += 320) {
      bCtx.beginPath();
      bCtx.moveTo(vx, 0);
      bCtx.lineTo(vx, 715);
      bCtx.stroke();
    }

    // Chão de estúdio escuro polido (y = 715..1080)
    const floorGrad = bCtx.createLinearGradient(0, 715, 0, 1080);
    floorGrad.addColorStop(0, "#0d0f14");
    floorGrad.addColorStop(0.35, "#151312");
    floorGrad.addColorStop(1, "#05070b");
    bCtx.fillStyle = floorGrad;
    bCtx.fillRect(0, 715, 1920, 365);

    cachedStudioBackdrop = bg;
    return bg;
  }

  function getTurntableCameraSpec(normAngle) {
    const a = (((normAngle % 360) + 360) % 360);
    if (a < 28 || a >= 332) {
      const d = a >= 332 ? a - 360 : a; // -28..+28
      return {
        viewKey: "SIDE",
        isMirrored: false,
        relDeg: d,
        label: "0° PERFIL LATERAL DIREITO 8K"
      };
    } else if (a >= 28 && a < 90) {
      return {
        viewKey: "FRONT_34",
        isMirrored: false,
        relDeg: a - 58,
        label: "45° PERSPETIVA 3/4 DIANTEIRA DIREITA 8K"
      };
    } else if (a >= 90 && a < 152) {
      return {
        viewKey: "FRONT_34",
        isMirrored: true,
        relDeg: a - 122,
        label: "135° PERSPETIVA 3/4 DIANTEIRA ESQUERDA 8K"
      };
    } else if (a >= 152 && a < 208) {
      return {
        viewKey: "SIDE",
        isMirrored: true,
        relDeg: a - 180,
        label: "180° PERFIL LATERAL ESQUERDO 8K"
      };
    } else if (a >= 208 && a < 270) {
      return {
        viewKey: "REAR_34",
        isMirrored: true,
        relDeg: a - 238,
        label: "225° PERSPETIVA 3/4 TRASEIRA ESQUERDA 8K"
      };
    } else {
      return {
        viewKey: "REAR_34",
        isMirrored: false,
        relDeg: a - 302,
        label: "315° PERSPETIVA 3/4 TRASEIRA DIREITA 8K"
      };
    }
  }

  async function getIsolatedTurntableBikeCanvas(viewKey, isMirrored, v) {
    const vKey = viewKey || "SIDE";
    const sig = `${vKey}_${isMirrored ? "L" : "R"}_${getVisualSignature(v)}`;
    if (isolatedBikeCache.has(sig)) {
      return isolatedBikeCache.get(sig);
    }

    const gradedView = await getGradedStudioViewCanvas(vKey, isMirrored, v);
    const iso = document.createElement("canvas");
    iso.width = 1920;
    iso.height = 1080;
    const iCtx = iso.getContext("2d");
    if (!iCtx) return gradedView;

    // Recorte suave (feathered) da silhueta envolvente da moto e sombra no chão
    // para que ao rodar 360° por todos os ângulos (Perfil, 3/4 Frente, Frente, 3/4 Traseira) nunca apareçam bordas
    const mask = document.createElement("canvas");
    mask.width = 1920;
    mask.height = 1080;
    const mCtx = mask.getContext("2d");
    if (mCtx) {
      mCtx.filter = "blur(28px)";
      mCtx.fillStyle = "#ffffff";
      mCtx.beginPath();
      const silPts = [
        [95, 650],
        [125, 390],
        [310, 320],
        [470, 145],
        [750, 120],
        [1050, 85],
        [1390, 75],
        [1520, 185],
        [1640, 370],
        [1810, 460],
        [1830, 690],
        [1775, 945],
        [1420, 965],
        [960, 945],
        [450, 965],
        [145, 945]
      ];
      silPts.forEach((pt, idx) => {
        const px = isMirrored ? 1920 - pt[0] : pt[0];
        const py = pt[1];
        if (idx === 0) mCtx.moveTo(px, py);
        else mCtx.lineTo(px, py);
      });
      mCtx.closePath();
      mCtx.fill();
    }

    iCtx.drawImage(gradedView, 0, 0);
    if (mask) {
      iCtx.globalCompositeOperation = "destination-in";
      iCtx.drawImage(mask, 0, 0);
      iCtx.globalCompositeOperation = "source-over";
    }

    if (isolatedBikeCache.size > 18) {
      const firstKey = isolatedBikeCache.keys().next().value;
      isolatedBikeCache.delete(firstKey);
    }
    isolatedBikeCache.set(sig, iso);
    return iso;
  }

  /**
   * Projeta a câmara 360° atual (Perfil Direito, 3/4 Dianteira Direita, Frente, 3/4 Dianteira Esquerda,
   * Perfil Esquerdo, 3/4 Traseira Esquerda, Traseira, 3/4 Traseira Direita) em Perspetiva 3D Contínua
   * (72 faixas verticais sem sobreposição e sem fantasmas) para mostrar todos os ângulos reais da moto!
   */
  function drawContinuous360TurntableStage(ctx, bikeCanvas, relDeg) {
    const rad = ((relDeg || 0) * Math.PI) / 180;
    const cosR = Math.cos(rad);
    const sinR = Math.sin(rad);

    const effMag = 0.84 + 0.16 * cosR;
    const strips = 72;
    const minSrcX = 70;
    const maxSrcX = 1850;
    const totalSrcW = maxSrcX - minSrcX;
    const stripW = totalSrcW / strips;
    const focalD = 2650;

    // Sombra elíptica dinâmica no chão do estúdio
    ctx.save();
    const shadowRx = 680 * effMag;
    const shadowGrad = ctx.createRadialGradient(960, 895, 30, 960, 895, Math.max(220, shadowRx));
    shadowGrad.addColorStop(0, "rgba(0, 0, 0, 0.78)");
    shadowGrad.addColorStop(0.65, "rgba(0, 0, 0, 0.42)");
    shadowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(960, 895, Math.max(220, shadowRx), 46, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    for (let i = 0; i < strips; i++) {
      const sx1 = minSrcX + i * stripW;
      const sx2 = sx1 + stripW;
      const u1 = sx1 - 960;
      const u2 = sx2 - 960;
      const uMid = (u1 + u2) * 0.5;

      const z1 = u1 * sinR * 0.42;
      const z2 = u2 * sinR * 0.42;
      const zMid = uMid * sinR * 0.42;

      const p1 = focalD / (focalD - z1);
      const p2 = focalD / (focalD - z2);
      const pMid = focalD / (focalD - zMid);

      const dx1 = 960 + u1 * effMag * p1;
      const dx2 = 960 + u2 * effMag * p2;
      const destX = Math.min(dx1, dx2);
      const destW = Math.max(1, Math.abs(dx2 - dx1) + 0.65);

      const destH = 1080 * pMid;
      const elevationOffset = -zMid * 0.028;
      const destY = 525 - destH * (525 / 1080) + elevationOffset;

      ctx.drawImage(bikeCanvas, sx1, 0, stripW + 0.5, 1080, destX, destY, destW, destH);
    }
  }

  function computeContinuous360Hotspots(normAngle, viewMode) {
    if (viewMode === "CAMERA_FRONT_34" || viewMode === "CAMERA_REAR_34") {
      const vKey = viewMode === "CAMERA_FRONT_34" ? "FRONT_34" : "REAR_34";
      const anchors = STUDIO_VIEWS_META[vKey].anchors;
      const out = {};
      Object.keys(anchors).forEach((k) => {
        const pt = anchors[k];
        out[k] = {
          cx: pt.x,
          cy: pt.y,
          xPct: (pt.x / 1920) * 100,
          yPct: (pt.y / 1080) * 100
        };
      });
      return out;
    }

    const cam = getTurntableCameraSpec(normAngle);
    const rad = (cam.relDeg * Math.PI) / 180;
    const cosR = Math.cos(rad);
    const sinR = Math.sin(rad);
    const effMag = 0.84 + 0.16 * cosR;
    const focalD = 2650;

    const baseAnchors = (STUDIO_VIEWS_META[cam.viewKey] || STUDIO_VIEWS_META.SIDE).anchors;
    const out = {};

    Object.keys(baseAnchors).forEach((compKey) => {
      const pt = baseAnchors[compKey];
      const rawX = cam.isMirrored ? 1920 - pt.x : pt.x;
      const rawY = pt.y;
      const u = rawX - 960;
      const z = u * sinR * 0.42;
      const p = focalD / (focalD - z);

      const stageX = 960 + u * effMag * p;
      const destH = 1080 * p;
      const elevationOffset = -z * 0.028;
      const stageY = 525 - destH * (525 / 1080) + elevationOffset + rawY * p;

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
        label: `TRAVÕES ${brakesSum.brand.toUpperCase()}`
      },
      {
        src: rear34Graded,
        sx: 610,
        sy: 330,
        sw: 320,
        sh: 320,
        label: `SUSPENSÃO ${rearSuspSum.brand.toUpperCase()}`
      },
      {
        src: front34Graded,
        sx: 1090,
        sy: 230,
        sw: 330,
        sh: 330,
        label: `FORQUETA ${frontSuspSum.brand.toUpperCase()}`
      },
      {
        src: front34Graded,
        sx: 1185,
        sy: 105,
        sw: 270,
        sh: 270,
        label: `FAROL LED ${headlightSum.brand.toUpperCase()}`
      },
      {
        src: sideGraded,
        sx: 820,
        sy: 170,
        sw: 380,
        sh: 380,
        label: "PINTURA & TAMPÃO MONZA"
      },
      {
        src: rear34Graded,
        sx: 235,
        sy: 360,
        sw: 460,
        sh: 460,
        label: `JANTES & PNEUS ${tiresSum.brand.toUpperCase()}`
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
  // MOTOR DE COMPOSIÇÃO FOTOGRÁFICA 8K + ROTAÇÃO 360° CONTÍNUA E SUAVE (1920x1080)
  // ============================================================================
  async function generateStudioRenderCanvas(canvas, customAngleDeg, skipExportDataUrl) {
    if (!canvas) {
      canvas = document.createElement("canvas");
    }
    if (canvas.width !== 1920) canvas.width = 1920;
    if (canvas.height !== 1080) canvas.height = 1080;
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
    const rad = (normAngle * Math.PI) / 180;
    const cosA = Math.cos(rad);
    const isMirrored = cosA < 0;

    const modelImg = await loadImageSafe(targetModel?.image);

    // 1. FUNDO DE ESTÚDIO ESCURO DE ALTA COSTURA (ESTACIONÁRIO E CONTÍNUO EM 1920x1080)
    const studioBg = getStudioBackdropCanvas();
    ctx.drawImage(studioBg, 0, 0, 1920, 1080);

    // 2. ANEL DE PLATAFORMA GIRATÓRIA 360° NO CHÃO DO ESTÚDIO (DESENHADO SOB AS RODAS DA MOTO)
    ctx.save();
    const groundY = 892;
    ctx.strokeStyle = "rgba(197, 160, 89, 0.32)";
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

    // 3. RENDERIZAR A MOTO EM ESTÚDIO 8K (TODOS OS ÂNGULOS 360° REAIS: PERFIL, 3/4 FRENTE, FRENTE, 3/4 TRÁS, TRASEIRA!)
    let viewLabel = "ESTÚDIO 360° MULTI-ÂNGULO 8K";
    if (configState.viewMode === "CAMERA_FRONT_34") {
      const frontCanvas = await getGradedStudioViewCanvas("FRONT_34", false, v);
      ctx.drawImage(frontCanvas, 0, 0, 1920, 1080);
      viewLabel = "CÂMARA 3/4 DIANTEIRA 8K";
    } else if (configState.viewMode === "CAMERA_REAR_34") {
      const rearCanvas = await getGradedStudioViewCanvas("REAR_34", false, v);
      ctx.drawImage(rearCanvas, 0, 0, 1920, 1080);
      viewLabel = "CÂMARA 3/4 TRASEIRA 8K";
    } else {
      // Modo STUDIO_360: Percorre todos os ângulos reais (Perfil Direito, 3/4 Frente Dir, 3/4 Frente Esq, Perfil Esquerdo, 3/4 Trás Esq, 3/4 Trás Dir)
      const cam = getTurntableCameraSpec(normAngle);
      if (Math.abs(cam.relDeg) < 1.2) {
        const crispView = await getGradedStudioViewCanvas(cam.viewKey, cam.isMirrored, v);
        ctx.drawImage(crispView, 0, 0, 1920, 1080);
      } else {
        const bikeIso = await getIsolatedTurntableBikeCanvas(cam.viewKey, cam.isMirrored, v);
        drawContinuous360TurntableStage(ctx, bikeIso, cam.relDeg);
      }
      viewLabel = cam.label;
    }

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

    // 5. CALCULAR AS COORDENADAS 3D CONTÍNUAS DOS 12 PONTOS INTERATIVOS PARA O ÂNGULO ATUAL
    configState.screenHotspots = computeContinuous360Hotspots(normAngle, configState.viewMode);

    // 6. BARRA SUPERIOR E RODAPÉ TÉCNICO DE ESTÚDIO 8K (COM AUTO-FIT PARA NUNCA CORTAR TEXTO)
    const topGrad = ctx.createLinearGradient(0, 0, 0, 90);
    topGrad.addColorStop(0, "rgba(4, 7, 12, 0.88)");
    topGrad.addColorStop(1, "rgba(4, 7, 12, 0)");
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, 1920, 90);

    ctx.fillStyle = "#c5a059";
    ctx.font = "bold 13px monospace";
    ctx.fillText(
      `BANDIT GARAGE ATELIER • ${viewLabel} • ${configState.projectCode} • ROTAÇÃO: ${Math.round(normAngle)}°`,
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
      `ESTÚDIO FOTORREALISTA 8K • CLIQUE DIRETAMENTE EM QUALQUER PEÇA DA MOTO PARA ALTERAR • ROTAÇÃO 360° CONTÍNUA E SUAVE`,
      122,
      974
    );

    ctx.fillStyle = "#ffffff";
    const headlineText = `${targetName} — DEPÓSITO: ${(tankSum.specs || tankSum.accessory).toUpperCase()}`;
    fillFittedText(ctx, headlineText, 122, 1005, 1740, 23, 14, "sans-serif", "900");

    ctx.fillStyle = "#cbd5e1";
    const specLine = `ASSENTO: ${seatSum.brand} (${seatSum.specs})  •  SUSPENSÃO: ${frontSuspSum.brand}  •  JANTES: ${wheelsSum.brand}  •  TRAVÕES: ${brakesSum.brand}`;
    fillFittedText(ctx, specLine, 122, 1034, 1740, 13, 10, "monospace", "bold");

    // Para garantir 60 FPS sem bloqueios durante a rotação 360°, só codificamos JPEG quando necessário
    if (!skipExportDataUrl) {
      const dataUrl = canvas.toDataURL("image/jpeg", 0.94);
      configState.lastRenderDataUrl = dataUrl;
      return dataUrl;
    } else {
      if (lazyExportTimer) clearTimeout(lazyExportTimer);
      lazyExportTimer = setTimeout(() => {
        try {
          configState.lastRenderDataUrl = canvas.toDataURL("image/jpeg", 0.92);
        } catch (_e) {}
      }, 240);
      return configState.lastRenderDataUrl || "";
    }
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
          <span class="cfg-popover-kicker">Alteração Direta na Peça • Atualiza Automaticamente na Imagem</span>
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
          <strong>${cTitle}:</strong>
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
            Fotografia de estúdio 8K gerada com as suas escolhas nos 12 tópicos. <strong>Clique diretamente em qualquer peça da moto na imagem</strong> (depósito, assento, suspensão, travões, farol, guiador, punhos, jantes ou pneus) para abrir as alternativas e atualizar a imagem em tempo real. Arraste a imagem ou use a barra abaixo para <strong>rodar 360 graus de forma contínua e suave</strong>, ou alterne para a <strong>Prancha Formal de Apresentação do Projeto</strong>.
          </p>
        </div>

        <div class="cfg-stage-instruction-banner">
          <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
            <button type="button" class="cfg-btn-studio ${
              configState.viewMode === "STUDIO_360" ? "is-active" : ""
            }" id="cfgModeStudio360Btn">
              ↻ Estúdio 360° Contínuo
            </button>
            <button type="button" class="cfg-btn-studio ${
              configState.viewMode === "CAMERA_FRONT_34" ? "is-active" : ""
            }" id="cfgModeFront34Btn">
              📷 Câmara 3/4 Dianteira
            </button>
            <button type="button" class="cfg-btn-studio ${
              configState.viewMode === "CAMERA_REAR_34" ? "is-active" : ""
            }" id="cfgModeRear34Btn">
              📷 Câmara 3/4 Traseira
            </button>
            <button type="button" class="cfg-btn-studio ${
              configState.viewMode === "FORMAL_BOARD" ? "is-active" : ""
            }" id="cfgModeFormalBoardBtn">
              ✦ Prancha Formal do Projeto
            </button>
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button type="button" class="cfg-btn-studio" id="cfgReviewZoomBtn">
              🔍 Ecrã Inteiro
            </button>
            <button type="button" class="cfg-btn-studio" id="cfgDownload360RenderBtn">
              ⬇ Descarregar Imagem 8K
            </button>
          </div>
        </div>

        <!-- PALCO INTERATIVO DA MOTO CRIADA (SEM NUMERAÇÃO SOBREPOSTA — SELEÇÃO DIRETA AO CLICAR NA PEÇA) -->
        <div class="cfg-interactive-stage-container is-draggable" id="cfgInteractiveStage">
          <canvas id="cfgInteractiveCanvas360" width="1920" height="1080" style="cursor: pointer;" title="Clique diretamente em qualquer peça da moto para alterar ou arraste para rodar 360°"></canvas>
        </div>

        <!-- MENU DE OPÇÕES DA PEÇA ESCOLHIDA (FORA DA IMAGEM DA MOTO — NUNCA TAPA A MOTO!) -->
        <div class="cfg-part-popover cfg-part-popover-external" id="cfgPartPopover" style="display: none;"></div>

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
              <small style="color: var(--sand);">Clique diretamente na peça na imagem acima ou em qualquer linha abaixo para alterar instantaneamente</small>
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

    function updateHotspotPinPositionsFast() {
      if (!hotspotsLayer || !configState.showHotspots) return;
      const pins = hotspotsLayer.querySelectorAll("[data-hotspot-comp]");
      if (pins.length !== components.length) {
        renderHotspotPins();
        return;
      }
      pins.forEach((pinBtn) => {
        const compKey = pinBtn.dataset.hotspotComp;
        const pos = configState.screenHotspots[compKey];
        if (pos) {
          pinBtn.style.left = `${pos.xPct.toFixed(2)}%`;
          pinBtn.style.top = `${pos.yPct.toFixed(2)}%`;
        }
      });
    }

    function syncCameraModeButtons(normAngle) {
      const mode360Btn = document.getElementById("cfgModeStudio360Btn");
      const modeFrontBtn = document.getElementById("cfgModeFront34Btn");
      const modeRearBtn = document.getElementById("cfgModeRear34Btn");
      const modeBoardBtn = document.getElementById("cfgModeFormalBoardBtn");
      if (mode360Btn) mode360Btn.classList.toggle("is-active", configState.viewMode === "STUDIO_360");
      if (modeFrontBtn)
        modeFrontBtn.classList.toggle("is-active", configState.viewMode === "CAMERA_FRONT_34");
      if (modeRearBtn)
        modeRearBtn.classList.toggle("is-active", configState.viewMode === "CAMERA_REAR_34");
      if (modeBoardBtn)
        modeBoardBtn.classList.toggle("is-active", configState.viewMode === "FORMAL_BOARD");

      container.querySelectorAll("[data-angle-preset]").forEach((b) => {
        const presetDeg = parseInt(b.dataset.anglePreset, 10);
        const diff = Math.abs(((normAngle - presetDeg + 540) % 360) - 180);
        b.classList.toggle(
          "is-active",
          configState.viewMode === "STUDIO_360" && diff <= 20
        );
      });
    }

    let isRenderingRotationFrame = false;
    async function refreshRotationFrameFast() {
      const normAngle = ((configState.rotationAngle % 360) + 360) % 360;
      const roundedAngle = Math.round(normAngle) % 360;
      if (sliderEl) sliderEl.value = String(roundedAngle);
      if (readoutEl) readoutEl.textContent = `${roundedAngle}°`;
      syncCameraModeButtons(roundedAngle);

      if (isRenderingRotationFrame) return;
      isRenderingRotationFrame = true;
      try {
        await generateStudioRenderCanvas(canvas360, normAngle, true);
        updateHotspotPinPositionsFast();
      } finally {
        isRenderingRotationFrame = false;
      }
    }

    async function refreshInteractiveScene() {
      const normAngle = ((Math.round(configState.rotationAngle) % 360) + 360) % 360;
      if (sliderEl) sliderEl.value = String(normAngle);
      if (readoutEl) readoutEl.textContent = `${normAngle}°`;
      syncCameraModeButtons(normAngle);

      await generateStudioRenderCanvas(canvas360, normAngle, false);
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

    document.getElementById("cfgModeFront34Btn")?.addEventListener("click", () => {
      stopAutoSpin();
      configState.viewMode = "CAMERA_FRONT_34";
      refreshInteractiveScene();
    });

    document.getElementById("cfgModeRear34Btn")?.addEventListener("click", () => {
      stopAutoSpin();
      configState.viewMode = "CAMERA_REAR_34";
      refreshInteractiveScene();
    });

    document.getElementById("cfgModeFormalBoardBtn")?.addEventListener("click", () => {
      stopAutoSpin();
      configState.viewMode = "FORMAL_BOARD";
      refreshInteractiveScene();
    });

    function openPartPopover(compKey, shouldScroll = true) {
      stopAutoSpin();
      configState.activePopoverCompKey = compKey;
      if (!popoverEl) return;
      popoverEl.style.display = "block";
      popoverEl.innerHTML = buildPopoverInnerHtml(compKey);
      renderHotspotPins();

      if (shouldScroll) {
        setTimeout(() => {
          popoverEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 40);
      }

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
          openPartPopover(compKey, false);
          refreshInteractiveScene();
        });
      });

      popoverEl.querySelectorAll("[data-pop-color]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          configState.components[compKey].selectedColor = btn.dataset.popColor;
          openPartPopover(compKey, false);
          refreshInteractiveScene();
        });
      });

      popoverEl.querySelectorAll("[data-pop-mat]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          configState.components[compKey].selectedMaterial = btn.dataset.popMat;
          openPartPopover(compKey, false);
          refreshInteractiveScene();
        });
      });

      popoverEl.querySelectorAll("[data-pop-stitch]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          configState.components[compKey].selectedStitch = btn.dataset.popStitch;
          openPartPopover(compKey, false);
          refreshInteractiveScene();
        });
      });

      popoverEl.querySelectorAll("[data-pop-spec1]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          configState.components[compKey].selectedSpec1 = btn.dataset.popSpec1;
          openPartPopover(compKey, false);
          refreshInteractiveScene();
        });
      });

      popoverEl.querySelectorAll("[data-pop-spec2]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          configState.components[compKey].selectedSpec2 = btn.dataset.popSpec2;
          openPartPopover(compKey, false);
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

    if (configState._cleanupStagePointerListeners) {
      configState._cleanupStagePointerListeners();
      configState._cleanupStagePointerListeners = null;
    }

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

      const onWindowPointerMove = (e) => {
        if (!isPointerDown) return;
        const dx = e.clientX - pointerStartX;
        const dy = e.clientY - pointerStartY;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
          hasDragged = true;
        }
        if (hasDragged) {
          configState.viewMode = "STUDIO_360";
          configState.rotationAngle = (((startRotation + dx * 0.42) % 360) + 360) % 360;
          refreshRotationFrameFast();
        }
      };

      const onWindowPointerUp = (e) => {
        if (!isPointerDown) return;
        isPointerDown = false;
        stageEl.classList.remove("is-dragging");

        if (!hasDragged && e.target === canvas360) {
          const rect = canvas360.getBoundingClientRect();
          const clickX = ((e.clientX - rect.left) / rect.width) * 1920;
          const clickY = ((e.clientY - rect.top) / rect.height) * 1080;

          let closestKey = null;
          let minDist = Infinity;

          // Deteção direta e inteligente de clique na peça física em qualquer ângulo 360° (sem necessidade de numeração na imagem!)
          if (configState.viewMode !== "FORMAL_BOARD") {
            const normAngle = (((configState.rotationAngle % 360) + 360) % 360);
            const cam = getTurntableCameraSpec(normAngle);

            let vKey = cam.viewKey;
            let isMirrored = cam.isMirrored;
            if (configState.viewMode === "CAMERA_FRONT_34") {
              vKey = "FRONT_34";
              isMirrored = false;
            } else if (configState.viewMode === "CAMERA_REAR_34") {
              vKey = "REAR_34";
              isMirrored = false;
            }
            const meta = STUDIO_VIEWS_META[vKey] || STUDIO_VIEWS_META.SIDE;

            // Converter o clique no palco para a coordenada da vista base (desfazendo a projeção 3D e o espelhamento)
            let localX = clickX;
            let localY = clickY;
            if (configState.viewMode === "STUDIO_360") {
              const rad = (cam.relDeg * Math.PI) / 180;
              const effMag = 0.84 + 0.16 * Math.cos(rad);
              const rawU = (clickX - 960) / effMag;
              const unmirroredX = 960 + rawU;
              localX = isMirrored ? 1920 - unmirroredX : unmirroredX;
            }

            if (
              meta.seatBox &&
              localX >= meta.seatBox.x1 - 20 &&
              localX <= meta.seatBox.x2 + 20 &&
              localY >= meta.seatBox.y1 - 20 &&
              localY <= meta.seatBox.y2 + 20
            ) {
              closestKey = "seat";
              minDist = 0;
            } else if (
              meta.gripBox &&
              localX >= meta.gripBox.x1 - 18 &&
              localX <= meta.gripBox.x2 + 18 &&
              localY >= meta.gripBox.y1 - 18 &&
              localY <= meta.gripBox.y2 + 18
            ) {
              closestKey = "grips";
              minDist = 0;
            } else if (
              meta.headlightCircle &&
              Math.hypot(
                (localX - meta.headlightCircle.cx) / (meta.headlightCircle.rx + 28),
                (localY - meta.headlightCircle.cy) / (meta.headlightCircle.ry + 28)
              ) <= 1.15
            ) {
              closestKey = "headlight";
              minDist = 0;
            } else if (
              localX >= 700 &&
              localX <= 1255 &&
              localY >= 140 &&
              localY <= 445
            ) {
              closestKey = "tank";
              minDist = 0;
            } else if (
              localX >= 455 &&
              localX <= 730 &&
              localY >= 340 &&
              localY <= 640
            ) {
              closestKey = "rearSuspension";
              minDist = 0;
            } else if (
              localX >= 1080 &&
              localX <= 1490 &&
              localY >= 565 &&
              localY <= 780
            ) {
              closestKey = "brakes";
              minDist = 0;
            } else if (
              meta.forkBox &&
              localX >= meta.forkBox.x1 - 20 &&
              localX <= meta.forkBox.x2 + 20 &&
              localY >= meta.forkBox.y1 &&
              localY <= meta.forkBox.y2
            ) {
              closestKey = "frontSuspension";
              minDist = 0;
            } else if (
              meta.frontWheel &&
              Math.hypot(
                (localX - meta.frontWheel.cx) / meta.frontWheel.rx,
                (localY - meta.frontWheel.cy) / meta.frontWheel.ry
              ) <= 1.08
            ) {
              const rNorm = Math.hypot(
                (localX - meta.frontWheel.cx) / meta.frontWheel.rx,
                (localY - meta.frontWheel.cy) / meta.frontWheel.ry
              );
              closestKey = rNorm >= 0.68 ? "tires" : "wheels";
              minDist = 0;
            } else if (
              meta.rearWheel &&
              Math.hypot(
                (localX - meta.rearWheel.cx) / meta.rearWheel.rx,
                (localY - meta.rearWheel.cy) / meta.rearWheel.ry
              ) <= 1.08
            ) {
              const rNorm = Math.hypot(
                (localX - meta.rearWheel.cx) / meta.rearWheel.rx,
                (localY - meta.rearWheel.cy) / meta.rearWheel.ry
              );
              closestKey = rNorm >= 0.68 ? "tires" : "wheels";
              minDist = 0;
            }
          }

          if (!closestKey) {
            Object.entries(configState.screenHotspots).forEach(([key, pt]) => {
              const d = Math.hypot(clickX - pt.cx, clickY - pt.cy);
              if (d < minDist) {
                minDist = d;
                closestKey = key;
              }
            });
          }

          if (closestKey && minDist < 260) {
            openPartPopover(closestKey);
          } else if (popoverEl) {
            configState.activePopoverCompKey = null;
            popoverEl.style.display = "none";
            renderHotspotPins();
          }
        }
      };

      window.addEventListener("pointermove", onWindowPointerMove);
      window.addEventListener("pointerup", onWindowPointerUp);
      configState._cleanupStagePointerListeners = () => {
        window.removeEventListener("pointermove", onWindowPointerMove);
        window.removeEventListener("pointerup", onWindowPointerUp);
      };
    }

    sliderEl?.addEventListener("input", () => {
      stopAutoSpin();
      configState.viewMode = "STUDIO_360";
      configState.rotationAngle = parseFloat(sliderEl.value) || 0;
      refreshRotationFrameFast();
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
        let lastTs = performance.now();
        const spinStep = (nowTs) => {
          if (!configState.isAutoSpinning) return;
          const dt = Math.min(50, Math.max(8, nowTs - lastTs));
          lastTs = nowTs;
          configState.rotationAngle = (configState.rotationAngle + dt * 0.042) % 360;
          refreshRotationFrameFast();
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
