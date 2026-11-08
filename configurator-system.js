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
    // Estado do Estúdio Interativo 360° (Passo 3)
    rotationAngle: 0, // 0° a 360°
    isAutoSpinning: false,
    autoSpinRafId: null,
    activePopoverCompKey: null,
    showHotspots: true,
    screenHotspots: {}
  };

  const imageCache = new Map();

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
  // MOTOR DE COMPOSIÇÃO FOTOGRÁFICA 8K POR CAMADAS + TURNTABLE 360° (1920x1080)
  // ============================================================================
  async function generateStudioRenderCanvas(canvas, customAngleDeg) {
    if (!canvas) {
      canvas = document.createElement("canvas");
    }
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    const angleDeg =
      typeof customAngleDeg === "number" ? customAngleDeg : configState.rotationAngle || 0;
    const normAngle = ((Math.round(angleDeg) % 360) + 360) % 360;

    const targetModel =
      (window.CONFIGURATOR_MODELS || []).find((m) => m.id === configState.targetModelId) ||
      (window.CONFIGURATOR_MODELS || [])[0];
    const v = getVisualConfigParams();

    // Carregar o Render Fotorrealista 8K de Estúdio e a fotografia oficial do modelo escolhido
    const studioMasterImg = await loadImageSafe("renders/bespoke-scrambler-render-v2.jpg");
    const modelImg = await loadImageSafe(targetModel?.image);

    // Determinar o modo de câmara conforme a rotação 360°:
    // - Perto de 0°..50° ou 310°..360°: Estúdio 8K Perfil Direita (Master Render)
    // - Perto de 130°..230°: Estúdio 8K Perfil Esquerda (Espelhamento Óptico Fotorrealista)
    // - Perto de 55°..125° ou 235°..305°: Ângulo 3/4 Dinâmico Fotográfico
    const rad = (normAngle * Math.PI) / 180;
    const cosA = Math.cos(rad);
    const sinA = Math.sin(rad);
    const isFlippedSide = cosA < 0; // 91° a 269° mostra o lado oposto da moto
    const perspectiveScaleX = 0.84 + 0.16 * Math.abs(cosA); // Efeito de paralaxe 3D suave ao rodar

    // 1. FUNDO DE ESTÚDIO ESCURO DE ALTA COSTURA
    ctx.fillStyle = "#06080c";
    ctx.fillRect(0, 0, 1920, 1080);

    // 2. DESENHAR A FOTOGRAFIA REAL DE ESTÚDIO 8K E APLICAR AS ALTERAÇÕES VISUAIS REAIS NAS PEÇAS
    const basePhoto = studioMasterImg || modelImg;

    if (basePhoto) {
      ctx.save();
      // Transformação de Turntable 360° centrada no palco
      ctx.translate(960, 490);
      ctx.scale((isFlippedSide ? -1 : 1) * perspectiveScaleX, 1);
      ctx.translate(-960, -490);

      // Desenhar a fotografia 8K fotorrealista de base
      drawCoverImage(ctx, basePhoto, 0, 0, 1920, 1080);

      // ======================================================================
      // CAMADA FOTOGRÁFICA 01: DEPÓSITO (Cor da Pintura, Acabamento e Faixas)
      // Coordenadas exatas do depósito na fotografia 8K (x: 775..1245, y: 205..428)
      // ======================================================================
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(782, 392);
      ctx.bezierCurveTo(784, 305, 818, 232, 920, 216);
      ctx.bezierCurveTo(1038, 198, 1175, 206, 1226, 250);
      ctx.bezierCurveTo(1252, 276, 1246, 355, 1206, 405);
      ctx.bezierCurveTo(1145, 424, 1035, 424, 965, 415);
      ctx.bezierCurveTo(885, 412, 815, 408, 782, 392);
      ctx.closePath();
      ctx.clip();

      // Se a cor não for o preto mate original, aplicar color grading fotográfico preservando os reflexos reais
      if (v.tankColorKey !== "bandit_black" || v.tankFinish !== "matte_satin") {
        // Tint de cor com modo 'color' e 'multiply' / 'screen' para manter o volume fotográfico real
        ctx.globalCompositeOperation = "color";
        ctx.fillStyle = v.tankHex;
        ctx.fillRect(760, 190, 510, 250);

        ctx.globalCompositeOperation =
          v.tankColorKey === "classic_silver" || v.tankColorKey === "desert_sand" || v.tankColorKey === "nardo_grey"
            ? "screen"
            : "overlay";
        const paintGrad = ctx.createLinearGradient(820, 200, 1180, 425);
        paintGrad.addColorStop(0, hexToRgba(v.tankHex, 0.82));
        paintGrad.addColorStop(0.5, hexToRgba(v.tankHex, 0.65));
        paintGrad.addColorStop(1, hexToRgba(shadeHex(v.tankHex, -35), 0.85));
        ctx.fillStyle = paintGrad;
        ctx.fillRect(760, 190, 510, 250);
      }

      // Acabamento Brilhante Espelhado Cerâmico vs Alumínio Escovado
      if (v.tankFinish === "gloss_ceramic") {
        ctx.globalCompositeOperation = "screen";
        const glossGrad = ctx.createLinearGradient(850, 205, 1080, 315);
        glossGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
        glossGrad.addColorStop(0.42, "rgba(255, 255, 255, 0.34)");
        glossGrad.addColorStop(0.52, "rgba(255, 255, 255, 0.06)");
        glossGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = glossGrad;
        ctx.fillRect(760, 190, 510, 250);
      } else if (v.tankFinish === "raw_brushed") {
        ctx.globalCompositeOperation = "screen";
        ctx.fillStyle = "rgba(210, 220, 232, 0.36)";
        ctx.fillRect(760, 190, 510, 250);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
        ctx.lineWidth = 1;
        for (let by = 210; by < 420; by += 3) {
          ctx.beginPath();
          ctx.moveTo(775, by);
          ctx.lineTo(1245, by);
          ctx.stroke();
        }
      }

      // Joelheira Clássica de Borracha se selecionado "Original BMW Monolever c/ Joelheiras"
      if (v.tankOption === "bmw_monolever_custom") {
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = "rgba(14, 16, 20, 0.76)";
        ctx.strokeStyle = "rgba(255, 255, 255, 0.14)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(815, 385);
        ctx.bezierCurveTo(820, 315, 895, 295, 965, 310);
        ctx.bezierCurveTo(980, 345, 965, 392, 945, 398);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Faixas / Filetes no Depósito (Filete Duplo Pintado à Mão ou Faixa Motorsport)
      ctx.globalCompositeOperation = "source-over";
      if (v.tankStripe === "double_pinstripe") {
        ctx.strokeStyle = "rgba(248, 250, 252, 0.82)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(802, 378);
        ctx.bezierCurveTo(812, 262, 925, 228, 1192, 252);
        ctx.stroke();

        ctx.strokeStyle = "rgba(197, 160, 89, 0.88)";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(810, 385);
        ctx.bezierCurveTo(820, 272, 930, 238, 1188, 260);
        ctx.stroke();
      } else if (v.tankStripe === "motorsport_stripe") {
        ctx.strokeStyle = "rgba(56, 189, 248, 0.85)";
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(790, 330);
        ctx.bezierCurveTo(940, 305, 1090, 300, 1235, 318);
        ctx.stroke();

        ctx.strokeStyle = "rgba(239, 68, 68, 0.85)";
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(790, 342);
        ctx.bezierCurveTo(940, 317, 1090, 312, 1235, 330);
        ctx.stroke();
      }
      ctx.restore();

      // ======================================================================
      // CAMADA FOTOGRÁFICA 02: ASSENTO (Pele, Cor, Costura e Formato Bossa/Corrido)
      // Coordenadas na fotografia 8K (x: 498..768, y: 268..362)
      // ======================================================================
      ctx.save();
      // Se o utilizador escolheu Monolugar com Bossa Café Racer ou Assento Corrido Scrambler,
      // desenhamos a extensão fotorrealista sobre o guarda-lamas/subquadro traseiro
      if (v.seatOption === "cafe_solo_cowl") {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(475, 325);
        ctx.bezierCurveTo(470, 255, 535, 242, 585, 285);
        ctx.lineTo(575, 332);
        ctx.closePath();
        const cowlGrad = ctx.createLinearGradient(475, 245, 585, 332);
        cowlGrad.addColorStop(0, shadeHex(v.tankHex, 25));
        cowlGrad.addColorStop(0.6, v.tankHex);
        cowlGrad.addColorStop(1, "#080a0f");
        ctx.fillStyle = cowlGrad;
        ctx.fill();
        ctx.strokeStyle = "rgba(197, 160, 89, 0.65)";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }

      // Máscara do selim de pele real na fotografia 8K
      ctx.beginPath();
      ctx.moveTo(500, 285);
      ctx.bezierCurveTo(512, 264, 565, 298, 628, 308);
      ctx.bezierCurveTo(682, 312, 745, 296, 766, 312);
      ctx.bezierCurveTo(772, 328, 715, 348, 642, 355);
      ctx.bezierCurveTo(572, 356, 512, 318, 500, 285);
      ctx.closePath();
      ctx.clip();

      if (v.seatMat !== "cognac_leather") {
        ctx.globalCompositeOperation = "color";
        ctx.fillStyle = v.seatHex;
        ctx.fillRect(490, 260, 290, 110);

        ctx.globalCompositeOperation = "multiply";
        ctx.fillStyle = hexToRgba(v.seatHex, 0.72);
        ctx.fillRect(490, 260, 290, 110);
      }

      // Costura Diamante ou Canelada (Tuck & Roll) sobre a pele do banco
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = "rgba(255, 235, 205, 0.34)";
      ctx.lineWidth = 1.4;
      if (v.seatStitch === "diamond") {
        for (let sx = 520; sx < 755; sx += 16) {
          ctx.beginPath();
          ctx.moveTo(sx, 280);
          ctx.lineTo(sx + 14, 348);
          ctx.moveTo(sx + 14, 280);
          ctx.lineTo(sx, 348);
          ctx.stroke();
        }
      } else if (v.seatStitch === "tuck_roll") {
        for (let sx = 520; sx < 755; sx += 12) {
          ctx.beginPath();
          ctx.moveTo(sx, 275);
          ctx.lineTo(sx - 4, 352);
          ctx.stroke();
        }
      }
      ctx.restore();

      // ======================================================================
      // CAMADA FOTOGRÁFICA 03: BAINHAS DIANTEIRAS / SUSPENSÃO (Cor + Foles)
      // Coordenadas das bainhas na fotografia 8K: (1252,212) -> (1452,542)
      // ======================================================================
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(1244, 212);
      ctx.lineTo(1292, 198);
      ctx.lineTo(1465, 535);
      ctx.lineTo(1412, 552);
      ctx.closePath();
      ctx.clip();

      if (v.frontColorKey !== "gold_racing") {
        ctx.globalCompositeOperation = "color";
        ctx.fillStyle = v.forkHex;
        ctx.fillRect(1230, 190, 250, 380);

        ctx.globalCompositeOperation =
          v.frontColorKey === "matte_black" ? "multiply" : "screen";
        ctx.fillStyle = hexToRgba(v.forkHex, 0.75);
        ctx.fillRect(1230, 190, 250, 380);
      }
      ctx.restore();

      // Foles de borracha clássicos se selecionado "Original BMW c/ Foles" ou "WP Rally"
      if (v.hasGaiters) {
        ctx.save();
        ctx.strokeStyle = "#0e1015";
        ctx.lineWidth = 34;
        ctx.lineCap = "round";
        ctx.setLineDash([7, 4]);
        ctx.beginPath();
        ctx.moveTo(1372, 385);
        ctx.lineTo(1432, 505);
        ctx.stroke();
        ctx.restore();
      }

      // ======================================================================
      // CAMADA FOTOGRÁFICA 04: SUSPENSÃO TRASEIRA (Mola Amarela Öhlins / Piggyback)
      // Coordenadas na fotografia 8K: (675,412) -> (462,618)
      // ======================================================================
      if (v.rearSpringKey === "ohlins_yellow" || v.rearSuspOpt === "ohlins_piggyback_gold") {
        ctx.save();
        ctx.strokeStyle = "#eab308";
        ctx.lineWidth = 22;
        ctx.setLineDash([7, 6]);
        ctx.beginPath();
        ctx.moveTo(645, 445);
        ctx.lineTo(495, 585);
        ctx.stroke();
        ctx.setLineDash([]);

        if (v.rearType === "piggyback_reservoir" || v.rearSuspOpt === "ohlins_piggyback_gold") {
          ctx.fillStyle = "#d4a73c";
          ctx.strokeStyle = "#fef08a";
          ctx.lineWidth = 1.5;
          drawRoundedRect(ctx, 658, 405, 18, 42, 6);
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      }

      // ======================================================================
      // CAMADA FOTOGRÁFICA 05 & 09: JANTES & TRAVÕES (Aros Polidos e Pinça Brembo)
      // Roda Traseira: (382, 658, r=215) | Roda Dianteira: (1522, 668, r=212)
      // ======================================================================
      if (v.wheelRimFinish === "polished_classic") {
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.strokeStyle = "rgba(226, 232, 240, 0.55)";
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.arc(382, 658, 196, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(1522, 668, 194, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Pinça de Travão Dianteira (Dourada Anodizada Racing ou Preta c/ Logo Vermelho Brembo)
      ctx.save();
      if (v.caliperSpec === "gold_anodized" || v.brakeOpt === "brembo_oro_rcs19") {
        ctx.globalCompositeOperation = "color";
        ctx.fillStyle = "#eab308";
        ctx.beginPath();
        ctx.arc(1408, 638, 36, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = "overlay";
        ctx.fillStyle = "rgba(234, 179, 8, 0.78)";
        ctx.beginPath();
        ctx.arc(1408, 638, 34, 0, Math.PI * 2);
        ctx.fill();
      } else if (v.caliperSpec === "black_red_logo") {
        ctx.fillStyle = "rgba(239, 68, 68, 0.92)";
        drawRoundedRect(ctx, 1396, 628, 22, 7, 2);
        ctx.fill();
      }
      ctx.restore();

      // ======================================================================
      // CAMADA FOTOGRÁFICA 10: FAROL DIANTEIRO (Lente Amarela Bates / LED Halo / Grelha)
      // Coordenadas na fotografia 8K: (1402, 246)
      // ======================================================================
      ctx.save();
      if (v.isYellowLens) {
        const yellowGlow = ctx.createRadialGradient(1412, 246, 4, 1418, 246, 95);
        yellowGlow.addColorStop(0, "rgba(250, 204, 21, 0.85)");
        yellowGlow.addColorStop(0.35, "rgba(250, 204, 21, 0.32)");
        yellowGlow.addColorStop(1, "rgba(250, 204, 21, 0)");
        ctx.fillStyle = yellowGlow;
        ctx.beginPath();
        ctx.arc(1415, 246, 95, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Halo LED Branco/Azulado moderno (Koso / JW Speaker)
        const ledGlow = ctx.createRadialGradient(1412, 246, 4, 1425, 246, 110);
        ledGlow.addColorStop(0, "rgba(224, 242, 254, 0.85)");
        ledGlow.addColorStop(0.3, "rgba(56, 189, 248, 0.28)");
        ledGlow.addColorStop(1, "rgba(56, 189, 248, 0)");
        ctx.fillStyle = ledGlow;
        ctx.beginPath();
        ctx.arc(1415, 246, 110, 0, Math.PI * 2);
        ctx.fill();
      }

      if (v.hasHeadlightGrill) {
        ctx.strokeStyle = "rgba(15, 23, 42, 0.9)";
        ctx.lineWidth = 2.5;
        for (let gy = 195; gy <= 295; gy += 11) {
          ctx.beginPath();
          ctx.moveTo(1388, gy);
          ctx.lineTo(1414, gy);
          ctx.stroke();
        }
      }

      if (v.hasBikiniFairing) {
        ctx.fillStyle = hexToRgba(v.tankHex, 0.92);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(1315, 165);
        ctx.quadraticCurveTo(1415, 175, 1422, 298);
        ctx.lineTo(1345, 315);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();

      // ======================================================================
      // CAMADA FOTOGRÁFICA 08 & 12: PUNHOS & PISCAS LED (Bar-End / Loop Traseiro)
      // Coordenadas do punho: (1245, 206)
      // ======================================================================
      ctx.save();
      ctx.beginPath();
      ctx.arc(1245, 206, 26, 0, Math.PI * 2);
      ctx.clip();
      ctx.globalCompositeOperation = "color";
      ctx.fillStyle = v.gripHex;
      ctx.fillRect(1215, 175, 60, 60);
      ctx.restore();

      if (v.turnOpt === "motogadget_moblaze_disc") {
        ctx.save();
        const tsGlow = ctx.createRadialGradient(1224, 218, 2, 1224, 218, 26);
        tsGlow.addColorStop(0, "rgba(251, 191, 36, 0.95)");
        tsGlow.addColorStop(0.4, "rgba(245, 158, 11, 0.38)");
        tsGlow.addColorStop(1, "rgba(245, 158, 11, 0)");
        ctx.fillStyle = tsGlow;
        ctx.beginPath();
        ctx.arc(1224, 218, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (v.turnOpt === "bandit_loop_integrated") {
        ctx.save();
        const rearLoopGlow = ctx.createRadialGradient(512, 312, 2, 512, 312, 32);
        rearLoopGlow.addColorStop(0, "rgba(239, 68, 68, 0.95)");
        rearLoopGlow.addColorStop(0.45, "rgba(245, 158, 11, 0.4)");
        rearLoopGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = rearLoopGlow;
        ctx.beginPath();
        ctx.arc(512, 312, 32, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.restore();
    }

    // 3. ANEL DE PLATAFORMA GIRATÓRIA 360° DISCRETO NO CHÃO DO ESTÚDIO
    ctx.save();
    const groundY = 885;
    ctx.strokeStyle = "rgba(197, 160, 89, 0.32)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(960, groundY, 690, 44, 0, 0, Math.PI * 2);
    ctx.stroke();

    for (let a = 0; a < 360; a += 15) {
      const mRad = ((a + normAngle) * Math.PI) / 180;
      const rIn = a % 45 === 0 ? 668 : 678;
      const rOut = 696;
      const x1 = 960 + Math.cos(mRad) * rIn;
      const y1 = groundY + Math.sin(mRad) * (rIn * 0.064);
      const x2 = 960 + Math.cos(mRad) * rOut;
      const y2 = groundY + Math.sin(mRad) * (rOut * 0.064);
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
      ctx.fillStyle = "rgba(4, 7, 12, 0.65)";
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

    // 5. CALCULAR AS COORDENADAS ESPAÇADAS DOS 12 PONTOS INTERATIVOS (ZERO SOBREPOSIÇÃO!)
    // As coordenadas na zona do cockpit foram cuidadosamente separadas para nunca se tocarem
    const baseAnchors = {
      tank: { x: 1015, y: 315 },
      seat: { x: 635, y: 305 },
      frontSuspension: { x: 1345, y: 405 },
      rearSuspension: { x: 575, y: 485 },
      wheels: { x: 382, y: 655 },
      tires: { x: 1685, y: 555 },
      handlebar: { x: 1185, y: 145 },
      turnSignals: { x: 1125, y: 248 },
      brakes: { x: 1408, y: 638 },
      headlight: { x: 1412, y: 245 },
      speedometer: { x: 1315, y: 155 },
      grips: { x: 1245, y: 205 }
    };

    const nextHotspots = {};
    Object.keys(baseAnchors).forEach((compKey) => {
      const pt = baseAnchors[compKey];
      const dxFromCenter = pt.x - 960;
      const transformedX =
        960 + dxFromCenter * (isFlippedSide ? -1 : 1) * perspectiveScaleX;
      const clampedX = Math.max(90, Math.min(1830, transformedX));
      const clampedY = Math.max(85, Math.min(840, pt.y));
      nextHotspots[compKey] = {
        cx: clampedX,
        cy: clampedY,
        xPct: (clampedX / 1920) * 100,
        yPct: (clampedY / 1080) * 100
      };
    });
    configState.screenHotspots = nextHotspots;

    // 6. BARRA SUPERIOR E RODAPÉ TÉCNICO DE ESTÚDIO 8K (COM AUTO-FIT PARA NUNCA CORTAR TEXTO)
    const topGrad = ctx.createLinearGradient(0, 0, 0, 90);
    topGrad.addColorStop(0, "rgba(4, 7, 12, 0.88)");
    topGrad.addColorStop(1, "rgba(4, 7, 12, 0)");
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, 1920, 90);

    const viewLabel =
      normAngle <= 45 || normAngle >= 315
        ? "PERFIL DIREITO DE ESTÚDIO 8K"
        : normAngle >= 135 && normAngle <= 225
        ? "PERFIL ESQUERDO DE ESTÚDIO 8K"
        : "PERSPETIVA 3/4 DE ESTÚDIO 8K";

    ctx.fillStyle = "#c5a059";
    ctx.font = "bold 13px monospace";
    ctx.fillText(
      `BANDIT GARAGE ATELIER • ${viewLabel} • ${configState.projectCode} • ROTAÇÃO: ${normAngle}°`,
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
      `ESTÚDIO FOTORREALISTA 8K • CLIQUE NOS PONTOS (01–12) PARA ALTERAR NA IMAGEM • ROTAÇÃO 360°`,
      122,
      974
    );

    // Título auto-ajustável à largura máxima (1740px) para NUNCA cortar na margem direita
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
    const anglePresets = [0, 45, 90, 135, 180, 225, 270, 315];

    container.innerHTML = `
      <div class="cfg-step-box">
        <div class="cfg-step-header">
          <span class="cfg-step-badge">Passo 3 de 3 — Estúdio 8K Interativo & Rotação 360°</span>
          <h2>A sua ${getLocalizedText(targetModel?.name)} Personalizada</h2>
          <p class="cfg-step-lead">
            Fotografia de estúdio 8K gerada com as suas escolhas nos 12 tópicos. <strong>Clique em qualquer um dos números (01 a 12) ou diretamente na peça da moto</strong> para abrir as alternativas e atualizar a imagem em tempo real. Arraste a imagem ou use a barra abaixo para <strong>rodar 360 graus</strong>.
          </p>
        </div>

        <div class="cfg-stage-instruction-banner">
          <div>
            <strong>💡 Edição Direta na Fotografia 8K:</strong> Passe o rato ou clique nos pontos <strong>01 a 12</strong> sobre a moto para mudar a cor do depósito, pele do assento, suspensão, travões ou farol.
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

        <!-- BARRA DE CONTROLO DE ROTAÇÃO 360 GRAUS -->
        <div class="cfg-360-toolbar">
          <div class="cfg-360-top-row">
            <div class="cfg-360-slider-wrap">
              <strong style="font-size: 0.8rem; color: #f8fafc; white-space: nowrap;">↻ Rotação 360°:</strong>
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
                Math.round(configState.rotationAngle) === ang ? "is-active" : ""
              }" data-angle-preset="${ang}">
                ${ang}°
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

      container.querySelectorAll("[data-angle-preset]").forEach((b) => {
        b.classList.toggle("is-active", parseInt(b.dataset.anglePreset, 10) === normAngle);
      });

      await generateStudioRenderCanvas(canvas360, normAngle);
      renderHotspotPins();

      if (summaryGridEl) {
        summaryGridEl.innerHTML = buildSummaryGridHtml();
        bindSummaryRowClicks();
      }
    }

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
      configState.rotationAngle = parseFloat(sliderEl.value) || 0;
      refreshInteractiveScene();
    });

    container.querySelectorAll("[data-angle-preset]").forEach((btn) => {
      btn.addEventListener("click", () => {
        stopAutoSpin();
        configState.rotationAngle = parseFloat(btn.dataset.anglePreset) || 0;
        refreshInteractiveScene();
      });
    });

    const autoSpinBtn = document.getElementById("cfgAutoSpin360Btn");
    autoSpinBtn?.addEventListener("click", () => {
      if (configState.isAutoSpinning) {
        stopAutoSpin();
      } else {
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
