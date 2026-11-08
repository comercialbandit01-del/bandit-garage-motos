/**
 * BANDIT GARAGE — MOTORCYCLE CONFIGURATOR (ESTÚDIO INTERATIVO 3D / 360° & 12 TÓPICOS DE PRODUTO)
 *
 * Passo 1: O cliente escolhe um dos 9 modelos da Bandit Garage.
 * Passo 2: O cliente escolhe os acessórios na lista de acessórios em cada um dos 12 tópicos de produto
 *          e clica em "Confirmar Escolhas & Gerar Imagem Interativa 360° da Moto".
 * Passo 3: A imagem criada da moto aparece após confirmar as escolhas, refletindo visualmente todas as
 *          alterações (cor/formato/acabamento/faixas do depósito, formato/pele/costura do assento,
 *          suspensão dianteira USD/foles, amortecedores traseiros, jantes, pneus, guiador, piscas,
 *          travões Brembo/discos, farol amarelo/LED/grelha, conta-quilómetros e punhos).
 *          - Na imagem criada, o cliente clica diretamente no componente que quer alterar (ou no respetivo
 *            ponto interativo) e abre o menu de alternativas sobre a imagem; ao escolher outra opção,
 *            a moto altera-se automaticamente e em tempo real na imagem.
 *          - No final, a imagem da moto pode ser rodada 360 graus (0° a 360°) com rato/toque, slider ou
 *            rotação 360° automática contínua.
 */

(function () {
  const configState = {
    step: 1, // 1: Escolher Modelo Bandit, 2: Escolher Acessórios nos 12 Tópicos, 3: Imagem Criada Interativa 360° & Cotação
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
    // Estado do Palco Interativo 360° (Passo 3)
    rotationAngle: 28, // Ângulo 3/4 de estúdio inicial (0 a 360 graus)
    isAutoSpinning: false,
    autoSpinRafId: null,
    activePopoverCompKey: null,
    showHotspots: true,
    screenHotspots: {} // { [compKey]: { xPct, yPct, cx, cy } }
  };

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
    // Ajustar predefinições coerentes com o estilo do modelo Bandit selecionado
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
  // HELPERS DE COR & GEOMETRIA 2D/3D PARA O MOTOR GRÁFICO 360°
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

  // Extrai todas as propriedades visuais reais a partir das escolhas do utilizador nos 12 tópicos
  function getVisualConfigParams() {
    const c = configState.components;
    const tankComp = (window.CONFIGURATOR_COMPONENTS || []).find((x) => x.key === "tank");
    const tankColObj = tankComp?.colors?.find((col) => col.key === c.tank?.selectedColor);
    const tankHex = tankColObj?.hex || "#141619";
    const tankOption = c.tank?.selectedOption || "bmw_monolever_custom";
    const tankFinish = c.tank?.selectedSpec1 || "matte_satin";
    const tankStripe = c.tank?.selectedSpec2 || "double_pinstripe";

    // Assento (cor de pele, formato e costura)
    const seatOption = c.seat?.selectedOption || "cafe_solo_cowl";
    const seatMat = c.seat?.selectedMaterial || "cognac_leather";
    const seatStitch = c.seat?.selectedStitch || "diamond";
    const seatColorMap = {
      cognac_leather: "#9c5227",
      chocolate_leather: "#47291b",
      black_nautical: "#181a1f",
      alcantara_suede: "#2c313a",
      crimson_red: "#7f1d1d"
    };
    const seatHex = seatColorMap[seatMat] || "#9c5227";

    // Suspensão Dianteira
    const frontSuspOpt = c.frontSuspension?.selectedOption || "ohlins_usd_fg";
    const frontTravel = c.frontSuspension?.selectedSpec1 || "standard_road";
    const frontColorKey = c.frontSuspension?.selectedSpec2 || "gold_racing";
    const forkColorMap = {
      gold_racing: "#d4a73c",
      matte_black: "#1b1f26",
      polished_alloy: "#cbd5e1"
    };
    const forkHex = forkColorMap[frontColorKey] || "#d4a73c";
    const hasGaiters = frontSuspOpt === "bmw_oem_gaiters" || frontSuspOpt === "wp_rally_long";

    // Suspensão Traseira
    const rearSuspOpt = c.rearSuspension?.selectedOption || "ohlins_stx36_blackline";
    const rearType = c.rearSuspension?.selectedSpec1 || "twin_shock";
    const rearSpringKey = c.rearSuspension?.selectedSpec2 || "black_alu";
    const rearSpringHex =
      rearSpringKey === "ohlins_yellow" || rearSuspOpt === "ohlins_piggyback_gold"
        ? "#eab308"
        : rearSpringKey === "total_black"
        ? "#111317"
        : "#262b35";

    // Jantes & Pneus
    const wheelOpt = c.wheels?.selectedOption || "excel_takasago_spoked";
    const wheelRimFinish = c.wheels?.selectedSpec2 || "black_stainless";
    const rimHex = wheelRimFinish === "polished_classic" ? "#d1d5db" : "#141820";
    const spokeHex = wheelRimFinish === "total_black_satin" ? "#262c36" : "#cbd5e1";
    const isSnowflake = wheelOpt === "bmw_snowflake_alloy";

    const tireOpt = c.tires?.selectedOption || "continental_tkc80";
    const isKnobbyTire = tireOpt === "continental_tkc80" || tireOpt === "heidenau_k60_ranger" || tireOpt === "pirelli_mt60_rs";
    const isVintageTire = tireOpt === "firestone_deluxe";

    // Guiador & Piscas
    const handlebarOpt = c.handlebar?.selectedOption || "lsl_clipons_cnc";
    const handlebarFinish = c.handlebar?.selectedSpec1 || "black_anodized";
    const handlebarHex = handlebarFinish === " black_anodized" || handlebarFinish === "black_anodized" ? "#1e232c" : "#cbd5e1";
    const isClipOn =
      handlebarOpt === "lsl_clipons_cnc" ||
      handlebarOpt === "tommaselli_condor" ||
      handlebarOpt === "gilles_tooling_gp";

    const turnOpt = c.turnSignals?.selectedOption || "motogadget_moblaze_disc";

    // Travões
    const brakeOpt = c.brakes?.selectedOption || "brembo_m4_radial";
    const caliperSpec = c.brakes?.selectedSpec1 || "black_red_logo";
    const caliperHex =
      caliperSpec === "gold_anodized" || brakeOpt === "brembo_oro_rcs19"
        ? "#d4a73c"
        : caliperSpec === "titanium_raw"
        ? "#94a3b8"
        : "#181c24";

    // Farol
    const headlightOpt = c.headlight?.selectedOption || "koso_thunderbolt_led";
    const headlightSpec = c.headlight?.selectedSpec1 || "matte_black_alu";
    const isYellowLens = headlightOpt === "bates_vintage_yellow";
    const hasBikiniFairing = headlightOpt === "highsider_reno_bikini";
    const hasHeadlightGrill =
      headlightSpec === "total_black_gloss" ||
      headlightOpt === "bates_vintage_yellow" ||
      headlightOpt === "denali_rally_twin";

    // Conta-Quilómetros & Punhos
    const speedoOpt = c.speedometer?.selectedOption || "motogadget_tiny_49";
    const speedoMount = c.speedometer?.selectedSpec1 || "flush_triple_tree";

    const gripsSpec = c.grips?.selectedSpec1 || "cognac_brown";
    const gripHex =
      gripsSpec === "cognac_brown"
        ? "#9c5227"
        : gripsSpec === "chocolate_vintage"
        ? "#47291b"
        : "#17191e";

    return {
      tankHex,
      tankOption,
      tankFinish,
      tankStripe,
      seatOption,
      seatHex,
      seatStitch,
      frontSuspOpt,
      frontTravel,
      forkHex,
      hasGaiters,
      rearSuspOpt,
      rearType,
      rearSpringHex,
      wheelOpt,
      rimHex,
      spokeHex,
      isSnowflake,
      tireOpt,
      isKnobbyTire,
      isVintageTire,
      handlebarOpt,
      handlebarHex,
      isClipOn,
      turnOpt,
      brakeOpt,
      caliperHex,
      caliperSpec,
      headlightOpt,
      headlightSpec,
      isYellowLens,
      hasBikiniFairing,
      hasHeadlightGrill,
      speedoOpt,
      speedoMount,
      gripHex
    };
  }

  // ============================================================================
  // MOTOR DE RENDERIZAÇÃO PARAMÉTRICO 3D / 360° DA MOTO PERSONALIZADA (1920x1080)
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
    const rad = (angleDeg * Math.PI) / 180;
    const cosA = Math.cos(rad);
    const sinA = Math.sin(rad);

    const targetModel =
      (window.CONFIGURATOR_MODELS || []).find((m) => m.id === configState.targetModelId) ||
      (window.CONFIGURATOR_MODELS || [])[0];
    const v = getVisualConfigParams();

    // 1. FUNDO DE ESTÚDIO AUTOMÓVEL / MOTO CICLORAMA 8K
    const bgGrad = ctx.createRadialGradient(960, 470, 80, 960, 520, 1080);
    bgGrad.addColorStop(0, "#1d283a");
    bgGrad.addColorStop(0.45, "#0d131d");
    bgGrad.addColorStop(0.8, "#06090f");
    bgGrad.addColorStop(1, "#030407");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1920, 1080);

    // Luz volumétrica de estúdio com reflexo subtil da cor do depósito escolhida
    ctx.save();
    const tankGlow = ctx.createRadialGradient(960, 430, 30, 960, 430, 620);
    tankGlow.addColorStop(0, hexToRgba(v.tankHex, 0.28));
    tankGlow.addColorStop(0.55, hexToRgba(v.tankHex, 0.08));
    tankGlow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = tankGlow;
    ctx.fillRect(0, 0, 1920, 900);
    ctx.restore();

    // Luzes superiores de estúdio (Softboxes no teto)
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.035)";
    drawRoundedRect(ctx, 520, 36, 880, 18, 9);
    ctx.fill();
    ctx.restore();

    // 2. PLATAFORMA GIRATÓRIA 360° (TURNTABLE DE ESTÚDIO)
    const cx = 960;
    const groundY = 768;

    // Sombra elíptica no chão
    ctx.save();
    const floorShadow = ctx.createRadialGradient(cx, groundY + 18, 60, cx, groundY + 18, 560);
    floorShadow.addColorStop(0, "rgba(0, 0, 0, 0.92)");
    floorShadow.addColorStop(0.65, "rgba(0, 0, 0, 0.55)");
    floorShadow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = floorShadow;
    ctx.beginPath();
    ctx.ellipse(cx, groundY + 18, 560, 92, 0, 0, Math.PI * 2);
    ctx.fill();

    // Anel graduado 360° na plataforma
    ctx.strokeStyle = "rgba(197, 160, 89, 0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, groundY + 14, 490, 72, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(cx, groundY + 14, 535, 80, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Marcas de graus na plataforma giratória que rodam com o ângulo
    for (let a = 0; a < 360; a += 15) {
      const mRad = ((a + angleDeg) * Math.PI) / 180;
      const rIn = a % 45 === 0 ? 470 : 482;
      const rOut = 498;
      const x1 = cx + Math.cos(mRad) * rIn;
      const y1 = groundY + 14 + Math.sin(mRad) * (rIn * 0.147);
      const x2 = cx + Math.cos(mRad) * rOut;
      const y2 = groundY + 14 + Math.sin(mRad) * (rOut * 0.147);
      ctx.strokeStyle = a % 45 === 0 ? "rgba(197, 160, 89, 0.7)" : "rgba(255, 255, 255, 0.16)";
      ctx.lineWidth = a % 45 === 0 ? 2.2 : 1;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.restore();

    // 3. PROJEÇÃO 3D COM ROTAÇÃO YAW (0° A 360°)
    // Sistema de coordenadas 3D da moto (em mm escalados para pixels):
    // X: longitudinal (- traseira, + dianteira)
    // Y: vertical (0 = eixo do chão, valores negativos sobem no ecrã, vamos usar Y+ para cima e converter)
    // Z: transversal (- esquerda, + direita)
    const pitch = 0.11; // Ligeira inclinação de câmara superior para leitura 3D da plataforma
    const fov = 1550;

    function project3D(x, yUp, z) {
      // Rotação em torno do eixo vertical Y
      const rx = x * cosA - z * sinA;
      const rz = x * sinA + z * cosA;
      const ry = yUp * Math.cos(pitch) - rz * Math.sin(pitch);
      const depth = rz * Math.cos(pitch) + yUp * Math.sin(pitch);
      const scale = fov / (fov + depth * 0.38);
      return {
        x: cx + rx * scale,
        y: groundY - ry * scale,
        z: depth,
        scale: scale
      };
    }

    // Offset de altura conforme a suspensão dianteira escolhida
    const stanceDeltaY =
      v.frontTravel === "scrambler_plus30" ? 16 : v.frontTravel === "cafe_lowered25" ? -14 : 0;

    // Função auxiliar para desenhar cilindros/tubos 3D entre dois pontos
    function drawTube3D(p1, p2, radiusPx, colorHex, highlightHex) {
      const s1 = project3D(p1.x, p1.y, p1.z);
      const s2 = project3D(p2.x, p2.y, p2.z);
      const r = Math.max(1.5, radiusPx * ((s1.scale + s2.scale) * 0.5));
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = colorHex;
      ctx.lineWidth = r * 2;
      ctx.beginPath();
      ctx.moveTo(s1.x, s1.y);
      ctx.lineTo(s2.x, s2.y);
      ctx.stroke();

      if (highlightHex) {
        ctx.strokeStyle = highlightHex;
        ctx.lineWidth = Math.max(1, r * 0.55);
        ctx.beginPath();
        ctx.moveTo(s1.x, s1.y - r * 0.35);
        ctx.lineTo(s2.x, s2.y - r * 0.35);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Função para desenhar uma roda completa 3D (Pneu + Tacos/Canelado + Jante + Raios/Snowflake + Disco + Pinça)
    function drawWheelAssembly3D(wheelCenterX, wheelRadius, isFront) {
      const wCenter = project3D(wheelCenterX, wheelRadius, 0);
      const rxRadius = Math.max(26, Math.abs(cosA) * wheelRadius * wCenter.scale);
      const ryRadius = wheelRadius * wCenter.scale;
      const tireWidth = (isFront ? 38 : 48) * wCenter.scale;

      ctx.save();

      // Volume lateral do pneu quando visto de frente/trás (sinA elevado)
      const sideOffset = sinA * (isFront ? 22 : 30) * wCenter.scale;

      // Sombra de contacto do pneu no chão
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.beginPath();
      ctx.ellipse(wCenter.x, groundY + 6, rxRadius * 0.85 + 24, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      // Banda de rodagem traseira (espessura 3D do pneu)
      ctx.strokeStyle = "#12151c";
      ctx.lineWidth = tireWidth;
      ctx.beginPath();
      ctx.ellipse(wCenter.x - sideOffset * 0.45, wCenter.y, rxRadius, ryRadius, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Pneu principal
      ctx.strokeStyle = "#1b2029";
      ctx.lineWidth = tireWidth;
      ctx.beginPath();
      ctx.ellipse(wCenter.x + sideOffset * 0.35, wCenter.y, rxRadius, ryRadius, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Tacos de pneu (Continental TKC80 / Pirelli MT60 / Heidenau) ou canelado vintage (Firestone)
      if (v.isKnobbyTire) {
        const numKnobs = 28;
        ctx.fillStyle = "#0e1117";
        ctx.strokeStyle = "#2b3240";
        ctx.lineWidth = 2;
        for (let i = 0; i < numKnobs; i++) {
          const theta = (i / numKnobs) * Math.PI * 2;
          const kx = wCenter.x + sideOffset * 0.35 + Math.cos(theta) * (rxRadius + tireWidth * 0.42);
          const ky = wCenter.y + Math.sin(theta) * (ryRadius + tireWidth * 0.42);
          ctx.beginPath();
          ctx.arc(kx, ky, 5.5 * wCenter.scale, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      } else if (v.isVintageTire) {
        ctx.strokeStyle = "rgba(212, 175, 55, 0.25)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(
          wCenter.x + sideOffset * 0.35,
          wCenter.y,
          Math.max(10, rxRadius - tireWidth * 0.15),
          ryRadius - tireWidth * 0.15,
          0,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      }

      // Aro da Jante (05. Jantes)
      const rimRx = Math.max(16, rxRadius - tireWidth * 0.52);
      const rimRy = ryRadius - tireWidth * 0.52;
      ctx.strokeStyle = v.rimHex;
      ctx.lineWidth = 13 * wCenter.scale;
      ctx.beginPath();
      ctx.ellipse(wCenter.x + sideOffset * 0.25, wCenter.y, rimRx, rimRy, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Filete dourado/alumínio no aro
      ctx.strokeStyle =
        v.rimHex === "#d1d5db" ? "#ffffff" : "rgba(197, 160, 89, 0.55)";
      ctx.lineWidth = 2 * wCenter.scale;
      ctx.beginPath();
      ctx.ellipse(wCenter.x + sideOffset * 0.25, wCenter.y, rimRx + 3, rimRy + 3, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Raios Inox / Pretos ou Jante BMW Snowflake
      const hubX = wCenter.x + sideOffset * 0.15;
      const hubY = wCenter.y;
      if (v.isSnowflake) {
        ctx.strokeStyle = v.spokeHex;
        ctx.lineWidth = 6 * wCenter.scale;
        for (let s = 0; s < 10; s++) {
          const ang = (s / 10) * Math.PI * 2;
          const ex = wCenter.x + sideOffset * 0.25 + Math.cos(ang) * (rimRx - 4);
          const ey = wCenter.y + Math.sin(ang) * (rimRy - 4);
          ctx.beginPath();
          ctx.moveTo(hubX, hubY);
          ctx.lineTo(ex, ey);
          ctx.stroke();
          // Ramificação Snowflake
          const mx = (hubX + ex) * 0.5;
          const my = (hubY + ey) * 0.5;
          const bAng1 = ang + 0.28;
          const bAng2 = ang - 0.28;
          ctx.lineWidth = 3.5 * wCenter.scale;
          ctx.beginPath();
          ctx.moveTo(mx, my);
          ctx.lineTo(
            wCenter.x + sideOffset * 0.25 + Math.cos(bAng1) * (rimRx - 4),
            wCenter.y + Math.sin(bAng1) * (rimRy - 4)
          );
          ctx.moveTo(mx, my);
          ctx.lineTo(
            wCenter.x + sideOffset * 0.25 + Math.cos(bAng2) * (rimRx - 4),
            wCenter.y + Math.sin(bAng2) * (rimRy - 4)
          );
          ctx.stroke();
        }
      } else {
        ctx.strokeStyle = v.spokeHex;
        ctx.lineWidth = 1.8 * wCenter.scale;
        const spokeCount = 36;
        for (let s = 0; s < spokeCount; s++) {
          const ang = (s / spokeCount) * Math.PI * 2;
          const hOffX = Math.cos(ang + 0.4) * (18 * Math.abs(cosA) + 6);
          const hOffY = Math.sin(ang + 0.4) * 18;
          const ex = wCenter.x + sideOffset * 0.25 + Math.cos(ang) * (rimRx - 4);
          const ey = wCenter.y + Math.sin(ang) * (rimRy - 4);
          ctx.beginPath();
          ctx.moveTo(hubX + hOffX, hubY + hOffY);
          ctx.lineTo(ex, ey);
          ctx.stroke();
        }
      }

      // Cubo central maquinado CNC
      ctx.fillStyle = "#262d3a";
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(hubX, hubY, Math.max(10, 26 * Math.abs(cosA)), 26 * wCenter.scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 09. TRAVÕES: Discos Flutuantes 320mm Perfirados + Pinça Radial Brembo / Beringer
      if (isFront || v.brakeOpt === "brembo_m4_radial" || v.brakeOpt === "beringer_aerotec_cnc") {
        const rotorRatio = isFront ? 0.64 : 0.52;
        const rotorRx = Math.max(12, rimRx * rotorRatio);
        const rotorRy = rimRy * rotorRatio;

        // Anel exterior em aço inox do disco de travão
        ctx.strokeStyle = "rgba(203, 213, 225, 0.88)";
        ctx.lineWidth = (isFront ? 16 : 12) * wCenter.scale;
        ctx.beginPath();
        ctx.ellipse(hubX, hubY, rotorRx, rotorRy, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Aranha central do disco flutuante (dourada ou preta anodizada)
        ctx.strokeStyle =
          v.caliperHex === "#d4a73c" ? "#d4a73c" : "#475569";
        ctx.lineWidth = 5 * wCenter.scale;
        ctx.beginPath();
        ctx.ellipse(hubX, hubY, rotorRx * 0.65, rotorRy * 0.65, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Pinça de travão (Brembo / Beringer / Hel)
        if (isFront) {
          const calAngle = cosA >= 0 ? Math.PI * 0.78 : Math.PI * 0.22;
          const calX = hubX + Math.cos(calAngle) * rotorRx;
          const calY = hubY - Math.sin(calAngle) * rotorRy;

          ctx.save();
          ctx.translate(calX, calY);
          ctx.fillStyle = v.caliperHex;
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1.5;
          drawRoundedRect(ctx, -20 * wCenter.scale, -14 * wCenter.scale, 40 * wCenter.scale, 28 * wCenter.scale, 7);
          ctx.fill();
          ctx.stroke();

          // Logótipo vermelho Brembo na pinça
          ctx.fillStyle = v.caliperSpec === "black_red_logo" ? "#ef4444" : "#0f172a";
          ctx.font = `900 ${Math.round(9 * wCenter.scale)}px sans-serif`;
          ctx.textAlign = "center";
          ctx.fillText("BREMBO", 0, 4 * wCenter.scale);
          ctx.restore();
        }
      }

      ctx.restore();
    }

    // Desenhar primeiro a roda que está mais afastada da câmara (ordenação Z)
    const frontWheelX = 335;
    const rearWheelX = -335;
    const wheelRadius = 158;

    const frontWheelProj = project3D(frontWheelX, wheelRadius, 0);
    const rearWheelProj = project3D(rearWheelX, wheelRadius, 0);

    const drawRearFirst = rearWheelProj.z > frontWheelProj.z;
    if (drawRearFirst) {
      drawWheelAssembly3D(rearWheelX, wheelRadius, false);
    } else {
      drawWheelAssembly3D(frontWheelX, wheelRadius, true);
    }

    // ========================================================================
    // 4. QUADRO TUBULAR BMW R100, BRAÇO OSCILANTE MONOLEVER & MOTOR BOXER 1000cc
    // ========================================================================
    // Braço oscilante traseiro (Cardan BMW)
    drawTube3D(
      { x: -90, y: 185 + stanceDeltaY * 0.3, z: 32 },
      { x: rearWheelX, y: wheelRadius, z: 38 },
      14,
      "#1e2430",
      "#475569"
    );
    drawTube3D(
      { x: -90, y: 185 + stanceDeltaY * 0.3, z: -32 },
      { x: rearWheelX, y: wheelRadius, z: -38 },
      12,
      "#151922",
      null
    );

    // Tubos principais do quadro e subquadro traseiro Bandit
    const subframeEndX =
      v.seatOption === "spirit_bobber_solo"
        ? -215
        : v.seatOption === "motone_brat_flat"
        ? -305
        : -325;

    // Duplo berço do quadro
    drawTube3D({ x: 185, y: 405 + stanceDeltaY, z: 0 }, { x: 95, y: 165, z: 36 }, 10, "#171b24", "#334155");
    drawTube3D({ x: 185, y: 405 + stanceDeltaY, z: 0 }, { x: 95, y: 165, z: -36 }, 10, "#171b24", null);
    drawTube3D({ x: 95, y: 165, z: 36 }, { x: -115, y: 165, z: 36 }, 10, "#171b24", "#334155");
    drawTube3D({ x: -115, y: 165, z: 36 }, { x: -110, y: 355 + stanceDeltaY * 0.5, z: 32 }, 10, "#171b24", "#334155");
    // Espinha superior do quadro
    drawTube3D({ x: 185, y: 405 + stanceDeltaY, z: 0 }, { x: -110, y: 365 + stanceDeltaY * 0.5, z: 0 }, 12, "#151922", "#334155");
    // Subquadro traseiro com Loop Bandit
    drawTube3D(
      { x: -110, y: 360 + stanceDeltaY * 0.5, z: 28 },
      { x: subframeEndX, y: 360 + stanceDeltaY * 0.4, z: 24 },
      8.5,
      "#1b202b",
      "#475569"
    );
    drawTube3D(
      { x: -110, y: 360 + stanceDeltaY * 0.5, z: -28 },
      { x: subframeEndX, y: 360 + stanceDeltaY * 0.4, z: -24 },
      8.5,
      "#141820",
      null
    );
    // Escoras inclinadas do subquadro
    if (v.seatOption !== "spirit_bobber_solo") {
      drawTube3D(
        { x: -115, y: 205, z: 34 },
        { x: -245, y: 360 + stanceDeltaY * 0.4, z: 26 },
        7,
        "#1b202b",
        "#334155"
      );
      drawTube3D(
        { x: -115, y: 205, z: -34 },
        { x: -245, y: 360 + stanceDeltaY * 0.4, z: -26 },
        7,
        "#151922",
        null
      );
    }

    // MOTOR BMW BOXER 2-VÁLVULAS 1000cc (Bloco central + Cilindros Alhetados Esquerdo e Direito + Escapes Inox)
    function drawBoxerEngine3D() {
      const engCenter = project3D(-5, 225, 0);
      const sc = engCenter.scale;

      // Bloco central do carter em alumínio granalhado escuro
      ctx.save();
      const blockW = Math.max(70, 175 * Math.abs(cosA) + 65) * sc;
      const blockH = 128 * sc;
      const blkGrad = ctx.createLinearGradient(
        engCenter.x - blockW * 0.5,
        engCenter.y - blockH * 0.5,
        engCenter.x + blockW * 0.5,
        engCenter.y + blockH * 0.5
      );
      blkGrad.addColorStop(0, "#333b48");
      blkGrad.addColorStop(0.5, "#1f242d");
      blkGrad.addColorStop(1, "#12151b");
      ctx.fillStyle = blkGrad;
      ctx.strokeStyle = "#64748b";
      ctx.lineWidth = 2;
      drawRoundedRect(
        ctx,
        engCenter.x - blockW * 0.5,
        engCenter.y - blockH * 0.5,
        blockW,
        blockH,
        22 * sc
      );
      ctx.fill();
      ctx.stroke();

      // Alhetas horizontais do bloco e tampa "BMW BANDIT"
      ctx.strokeStyle = "rgba(203, 213, 225, 0.35)";
      ctx.lineWidth = 1.5;
      for (let f = -40; f <= 40; f += 13) {
        ctx.beginPath();
        ctx.moveTo(engCenter.x - blockW * 0.44, engCenter.y + f * sc);
        ctx.lineTo(engCenter.x + blockW * 0.44, engCenter.y + f * sc);
        ctx.stroke();
      }

      // Desenhar os 2 cilindros opostos Boxer (z = +92 direita, z = -92 esquerda)
      const cylSides = sinA >= 0 ? [-92, 92] : [92, -92];
      cylSides.forEach((zSide) => {
        const cPos = project3D(12, 218, zSide);
        const cylW = 92 * cPos.scale;
        const cylH = 66 * cPos.scale;

        ctx.fillStyle = "#181c24";
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 2;
        drawRoundedRect(ctx, cPos.x - cylW * 0.5, cPos.y - cylH * 0.5, cylW, cylH, 12 * cPos.scale);
        ctx.fill();
        ctx.stroke();

        // Alhetas de arrefecimento maquinadas a prateado nas cabeças Boxer
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 2.2 * cPos.scale;
        for (let k = -24; k <= 24; k += 8) {
          ctx.beginPath();
          ctx.moveTo(cPos.x - cylW * 0.46, cPos.y + k * cPos.scale);
          ctx.lineTo(cPos.x + cylW * 0.46, cPos.y + k * cPos.scale);
          ctx.stroke();
        }

        // Tampa de válvulas Boxer clássica
        ctx.fillStyle = "#94a3b8";
        drawRoundedRect(
          ctx,
          cPos.x - cylW * 0.36,
          cPos.y - cylH * 0.25,
          cylW * 0.72,
          cylH * 0.5,
          8 * cPos.scale
        );
        ctx.fill();
        ctx.fillStyle = "#0f172a";
        ctx.font = `900 ${Math.round(9 * cPos.scale)}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText("BOXER 1000", cPos.x, cPos.y + 3 * cPos.scale);
      });
      ctx.restore();

      // Coletores e ponteiras de escape em Inox Escovado com soldaduras TIG
      const exhaustZ = cosA >= 0 ? 64 : -64;
      drawTube3D({ x: 35, y: 195, z: exhaustZ }, { x: 110, y: 135, z: exhaustZ }, 9, "#cbd5e1", "#ffffff");
      drawTube3D({ x: 110, y: 135, z: exhaustZ }, { x: -135, y: 130, z: exhaustZ }, 9.5, "#b8c4d4", "#ffffff");
      // Ponteira Megafone / Cone Bandit Inox
      drawTube3D({ x: -135, y: 130, z: exhaustZ }, { x: -275, y: 175, z: exhaustZ + 6 }, 15, "#94a3b8", "#f8fafc");
    }

    drawBoxerEngine3D();

    // ========================================================================
    // 04. SUSPENSÃO TRASEIRA (Twin Shock / Monoshock Cantilever / Piggyback Öhlins)
    // ========================================================================
    const rearShockZ = cosA >= 0 ? 44 : -44;
    let rearSuspHotspot3D = { x: -235, y: 270, z: rearShockZ };

    if (v.rearType === "monoshock_cantilever" || v.rearSuspOpt === "hagon_cantilever") {
      // Amortecedor central sob o assento (Cantilever)
      rearSuspHotspot3D = { x: -155, y: 295, z: 0 };
      drawTube3D(
        { x: -105, y: 335 + stanceDeltaY * 0.4, z: 0 },
        { x: -215, y: 235, z: 0 },
        11,
        v.rearSpringHex,
        "#f8fafc"
      );
    } else {
      // Twin shock clássico ou Piggyback
      const topShock = { x: -230, y: 350 + stanceDeltaY * 0.4, z: rearShockZ };
      const botShock = { x: rearWheelX + 18, y: wheelRadius + 15, z: rearShockZ };
      rearSuspHotspot3D = { x: -270, y: 265, z: rearShockZ };

      // Corpo do amortecedor
      drawTube3D(topShock, botShock, 7, "#cbd5e1", "#ffffff");

      // Espiras da mola (Amarela Öhlins, Preta ou Total Black)
      const sTop = project3D(topShock.x, topShock.y, topShock.z);
      const sBot = project3D(botShock.x, botShock.y, botShock.z);
      ctx.save();
      ctx.strokeStyle = v.rearSpringHex;
      ctx.lineWidth = 15 * sTop.scale;
      ctx.setLineDash([7 * sTop.scale, 5 * sTop.scale]);
      ctx.beginPath();
      ctx.moveTo(sTop.x, sTop.y);
      ctx.lineTo(sBot.x, sBot.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Reservatório Separado Piggyback Dourado Öhlins
      if (v.rearType === "piggyback_reservoir" || v.rearSuspOpt === "ohlins_piggyback_gold") {
        ctx.fillStyle = "#d4a73c";
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        drawRoundedRect(ctx, sTop.x - 24 * sTop.scale, sTop.y + 6 * sTop.scale, 16 * sTop.scale, 38 * sTop.scale, 5);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }

    // Desenhar a outra roda (a que está mais próxima da câmara)
    if (drawRearFirst) {
      drawWheelAssembly3D(frontWheelX, wheelRadius, true);
    } else {
      drawWheelAssembly3D(rearWheelX, wheelRadius, false);
    }

    // ========================================================================
    // 03. BAINHAS DIANTEIRAS / SUSPENSÃO (Forqueta USD Dourada/Preta/Polida + Foles)
    // ========================================================================
    const forkTop = { x: 188, y: 430 + stanceDeltaY, z: 28 };
    const forkMid = { x: 265, y: 285 + stanceDeltaY * 0.5, z: 28 };
    const forkBot = { x: frontWheelX, y: wheelRadius, z: 28 };

    // Perna de trás da forqueta
    drawTube3D(
      { x: forkTop.x, y: forkTop.y, z: -28 },
      { x: forkMid.x, y: forkMid.y, z: -28 },
      12,
      shadeHex(v.forkHex, -25),
      null
    );
    drawTube3D(
      { x: forkMid.x, y: forkMid.y, z: -28 },
      { x: forkBot.x, y: forkBot.y, z: -28 },
      9,
      "#94a3b8",
      null
    );

    // Perna da frente da forqueta (Bainha superior na cor escolhida + tubo interno)
    drawTube3D(forkTop, forkMid, 13.5, v.forkHex, "#ffffff");
    drawTube3D(forkMid, forkBot, 9.5, "#e2e8f0", "#ffffff");

    // Foles de borracha clássicos se selecionado "Original BMW c/ Foles" ou "WP Rally"
    if (v.hasGaiters) {
      const gTop = project3D(forkMid.x - 12, forkMid.y + 18, 28);
      const gBot = project3D(forkBot.x - 18, forkBot.y + 42, 28);
      ctx.save();
      ctx.strokeStyle = "#111318";
      ctx.lineWidth = 22 * gTop.scale;
      ctx.setLineDash([6 * gTop.scale, 3 * gTop.scale]);
      ctx.beginPath();
      ctx.moveTo(gTop.x, gTop.y);
      ctx.lineTo(gBot.x, gBot.y);
      ctx.stroke();
      ctx.restore();
    }

    // Mesas de Direção Maquinadas CNC (Triple Trees)
    const tripleTop = project3D(185, 434 + stanceDeltaY, 0);
    ctx.save();
    ctx.fillStyle = "#334155";
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, tripleTop.x - 22, tripleTop.y - 8, 44, 16, 5);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // ========================================================================
    // 01. DEPÓSITO (Formato, Cor da Pintura, Acabamento Mate/Brilho/Escovado e Filetes)
    // ========================================================================
    function drawCustomFuelTank3D() {
      const tankCenter = project3D(45, 395 + stanceDeltaY * 0.65, 0);
      const sc = tankCenter.scale;
      const sideFactor = Math.max(0.38, Math.abs(cosA));
      const dir = cosA >= 0 ? 1 : -1;

      const tLen =
        (v.tankOption === "heinrich_hoske_endurance"
          ? 275
          : v.tankOption === "wbo_custom_racing"
          ? 248
          : 232) *
        sideFactor *
        sc;
      const tHeight =
        (v.tankOption === "heinrich_hoske_endurance" ? 112 : 96) * sc;

      ctx.save();
      ctx.translate(tankCenter.x, tankCenter.y);
      ctx.scale(dir, 1);

      // Caminho escultural do depósito BMW R100 / Monza / Hoske
      ctx.beginPath();
      ctx.moveTo(-tLen * 0.52, tHeight * 0.36); // Base traseira junto ao banco
      ctx.bezierCurveTo(
        -tLen * 0.48,
        -tHeight * 0.38,
        -tLen * 0.1,
        -tHeight * 0.68,
        tLen * 0.34,
        -tHeight * 0.52
      ); // Topo arredondado do depósito
      ctx.bezierCurveTo(
        tLen * 0.56,
        -tHeight * 0.42,
        tLen * 0.58,
        tHeight * 0.18,
        tLen * 0.38,
        tHeight * 0.36
      ); // Frente junto à coluna de direção
      ctx.lineTo(-tLen * 0.52, tHeight * 0.36);
      ctx.closePath();

      // Gradiente segundo a cor e o acabamento (Mate Acetinado, Brilhante Cerâmico ou Metal Escovado)
      const tankGrad = ctx.createLinearGradient(0, -tHeight * 0.65, 0, tHeight * 0.4);
      if (v.tankFinish === "raw_brushed") {
        tankGrad.addColorStop(0, "#f1f5f9");
        tankGrad.addColorStop(0.35, "#94a3b8");
        tankGrad.addColorStop(0.7, "#cbd5e1");
        tankGrad.addColorStop(1, "#475569");
      } else if (v.tankFinish === "gloss_ceramic") {
        tankGrad.addColorStop(0, shadeHex(v.tankHex, 55));
        tankGrad.addColorStop(0.22, v.tankHex);
        tankGrad.addColorStop(0.65, shadeHex(v.tankHex, -15));
        tankGrad.addColorStop(1, shadeHex(v.tankHex, -45));
      } else {
        // Mate Acetinado
        tankGrad.addColorStop(0, shadeHex(v.tankHex, 24));
        tankGrad.addColorStop(0.5, v.tankHex);
        tankGrad.addColorStop(1, shadeHex(v.tankHex, -32));
      }

      ctx.fillStyle = tankGrad;
      ctx.fill();
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
      ctx.stroke();

      // Recorte de joelho (Knee dent) ou joelheira de borracha BMW
      ctx.beginPath();
      ctx.moveTo(-tLen * 0.42, tHeight * 0.26);
      ctx.quadraticCurveTo(-tLen * 0.15, -tHeight * 0.08, tLen * 0.08, tHeight * 0.25);
      ctx.closePath();
      if (v.tankOption === "bmw_monolever_custom") {
        ctx.fillStyle = "rgba(15, 18, 24, 0.88)";
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        ctx.fillStyle = "rgba(0, 0, 0, 0.24)";
        ctx.fill();
      }

      // Faixas / Filetes do Depósito (Filete Duplo Clássico, Faixa Motorsport ou Liso)
      if (v.tankStripe === "double_pinstripe") {
        ctx.strokeStyle = "#f8fafc";
        ctx.lineWidth = 2.4 * sc;
        ctx.beginPath();
        ctx.moveTo(-tLen * 0.44, tHeight * 0.18);
        ctx.bezierCurveTo(-tLen * 0.35, -tHeight * 0.28, tLen * 0.05, -tHeight * 0.46, tLen * 0.36, -tHeight * 0.3);
        ctx.stroke();

        ctx.strokeStyle = "#c5a059";
        ctx.lineWidth = 1.3 * sc;
        ctx.beginPath();
        ctx.moveTo(-tLen * 0.41, tHeight * 0.22);
        ctx.bezierCurveTo(-tLen * 0.32, -tHeight * 0.21, tLen * 0.05, -tHeight * 0.39, tLen * 0.33, -tHeight * 0.23);
        ctx.stroke();
      } else if (v.tankStripe === "motorsport_stripe") {
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 5 * sc;
        ctx.beginPath();
        ctx.moveTo(-tLen * 0.45, -tHeight * 0.06);
        ctx.lineTo(tLen * 0.42, -tHeight * 0.14);
        ctx.stroke();

        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 5 * sc;
        ctx.beginPath();
        ctx.moveTo(-tLen * 0.45, tHeight * 0.03);
        ctx.lineTo(tLen * 0.42, -tHeight * 0.05);
        ctx.stroke();
      }

      // Reflexo especular de verniz cerâmico no topo
      if (v.tankFinish === "gloss_ceramic" || v.tankFinish === "raw_brushed") {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
        ctx.lineWidth = 4 * sc;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(-tLen * 0.22, -tHeight * 0.44);
        ctx.quadraticCurveTo(tLen * 0.05, -tHeight * 0.54, tLen * 0.26, -tHeight * 0.38);
        ctx.stroke();
      }

      // Emblema circular BMW / Bandit Garage na lateral do depósito
      const badgeX = tLen * 0.2;
      const badgeY = -tHeight * 0.12;
      const badgeR = 13 * sc;
      ctx.fillStyle = "#0f172a";
      ctx.strokeStyle = "#c5a059";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.moveTo(badgeX, badgeY);
      ctx.arc(badgeX, badgeY, badgeR - 3, 0, Math.PI * 0.5);
      ctx.moveTo(badgeX, badgeY);
      ctx.arc(badgeX, badgeY, badgeR - 3, Math.PI, Math.PI * 1.5);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(badgeX, badgeY);
      ctx.arc(badgeX, badgeY, badgeR - 3, Math.PI * 0.5, Math.PI);
      ctx.moveTo(badgeX, badgeY);
      ctx.arc(badgeX, badgeY, badgeR - 3, Math.PI * 1.5, Math.PI * 2);
      ctx.fill();

      // Tampão Monza em alumínio polido no topo do depósito
      ctx.fillStyle = "#e2e8f0";
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 1.5;
      drawRoundedRect(ctx, tLen * 0.04, -tHeight * 0.64, 24 * sc, 9 * sc, 3);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }

    drawCustomFuelTank3D();

    // ========================================================================
    // 02. ASSENTO (Formato Café Racer Bossa / Scrambler / Brat / Bobber + Pele + Costura)
    // ========================================================================
    function drawCustomSeat3D() {
      const seatCenter = project3D(-195, 382 + stanceDeltaY * 0.5, 0);
      const sc = seatCenter.scale;
      const sideFactor = Math.max(0.38, Math.abs(cosA));
      const dir = cosA >= 0 ? 1 : -1;
      const sLen =
        (v.seatOption === "spirit_bobber_solo"
          ? 125
          : v.seatOption === "motone_brat_flat"
          ? 195
          : 225) *
        sideFactor *
        sc;
      const sH = 42 * sc;

      ctx.save();
      ctx.translate(seatCenter.x, seatCenter.y);
      ctx.scale(dir, 1);

      const seatGrad = ctx.createLinearGradient(0, -sH, 0, sH);
      seatGrad.addColorStop(0, shadeHex(v.seatHex, 22));
      seatGrad.addColorStop(0.55, v.seatHex);
      seatGrad.addColorStop(1, shadeHex(v.seatHex, -35));

      ctx.fillStyle = seatGrad;
      ctx.strokeStyle = shadeHex(v.seatHex, -45);
      ctx.lineWidth = 2;

      ctx.beginPath();
      if (v.seatOption === "cafe_solo_cowl") {
        // Assento Café Racer com Bossa traseira pintada na cor do depósito
        ctx.moveTo(sLen * 0.52, sH * 0.35);
        ctx.lineTo(-sLen * 0.48, sH * 0.35);
        ctx.quadraticCurveTo(-sLen * 0.52, -sH * 0.85, -sLen * 0.15, -sH * 0.92);
        ctx.lineTo(-sLen * 0.02, -sH * 0.18);
        ctx.lineTo(sLen * 0.48, -sH * 0.18);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Bossa traseira pintada na cor do depósito
        ctx.fillStyle = v.tankHex;
        ctx.strokeStyle = "rgba(255,255,255,0.28)";
        ctx.beginPath();
        ctx.moveTo(-sLen * 0.05, sH * 0.35);
        ctx.lineTo(-sLen * 0.5, sH * 0.35);
        ctx.quadraticCurveTo(-sLen * 0.52, -sH * 0.88, -sLen * 0.12, -sH * 0.94);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (v.seatOption === "spirit_bobber_solo") {
        // Selim Solo Flutuante Cantilever Bobber
        ctx.moveTo(sLen * 0.55, sH * 0.25);
        ctx.quadraticCurveTo(0, sH * 0.45, -sLen * 0.55, -sH * 0.35);
        ctx.quadraticCurveTo(-sLen * 0.45, -sH * 0.65, 0, -sH * 0.25);
        ctx.quadraticCurveTo(sLen * 0.4, -sH * 0.1, sLen * 0.55, sH * 0.25);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        // Banco Corrido Scrambler / Brat / Street Tracker
        drawRoundedRect(ctx, -sLen * 0.5, -sH * 0.35, sLen, sH * 0.72, 14 * sc);
        ctx.fill();
        ctx.stroke();
      }

      // Padrão de Costura na Pele (Diamond Stitch ou Tuck & Roll Canelado)
      ctx.strokeStyle = "rgba(255, 238, 210, 0.38)";
      ctx.lineWidth = 1.3 * sc;
      const stitchStart = v.seatOption === "cafe_solo_cowl" ? -sLen * 0.02 : -sLen * 0.42;
      const stitchEnd = sLen * 0.42;

      if (v.seatStitch === "diamond") {
        for (let x = stitchStart; x < stitchEnd; x += 14 * sc) {
          ctx.beginPath();
          ctx.moveTo(x, -sH * 0.22);
          ctx.lineTo(x + 8 * sc, sH * 0.24);
          ctx.moveTo(x + 8 * sc, -sH * 0.22);
          ctx.lineTo(x, sH * 0.24);
          ctx.stroke();
        }
      } else if (v.seatStitch === "tuck_roll") {
        for (let x = stitchStart; x < stitchEnd; x += 11 * sc) {
          ctx.beginPath();
          ctx.moveTo(x, -sH * 0.28);
          ctx.lineTo(x, sH * 0.28);
          ctx.stroke();
        }
      } else {
        // Costura Francesa Dupla Longitudinal
        ctx.beginPath();
        ctx.moveTo(stitchStart, 0);
        ctx.lineTo(stitchEnd, 0);
        ctx.stroke();
      }

      ctx.restore();
    }

    drawCustomSeat3D();

    // ========================================================================
    // 10. FAROL DIANTEIRO (Lente Amarela Bates / Halo LED Koso / Grelha / Carenagem Bikini)
    // ========================================================================
    const hlPos3D = { x: 238, y: 405 + stanceDeltaY, z: 0 };
    const hlProj = project3D(hlPos3D.x, hlPos3D.y, hlPos3D.z);
    const hlSc = hlProj.scale;
    const dir = cosA >= 0 ? 1 : -1;

    ctx.save();
    ctx.translate(hlProj.x, hlProj.y);
    ctx.scale(dir, 1);

    // Se tiver carenagem Bikini Café Racer (Highsider Reno Bikini ou Vintage Racer)
    if (v.hasBikiniFairing) {
      ctx.fillStyle = v.tankHex;
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-28 * hlSc, -52 * hlSc);
      ctx.quadraticCurveTo(32 * hlSc, -46 * hlSc, 42 * hlSc, 22 * hlSc);
      ctx.lineTo(-18 * hlSc, 32 * hlSc);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Carcaça do farol
    ctx.fillStyle =
      v.headlightSpec === "chrome_classic" ? "#cbd5e1" : "#141821";
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 26 * hlSc, Math.PI * 0.5, Math.PI * 1.5);
    ctx.lineTo(14 * hlSc, -26 * hlSc);
    ctx.lineTo(14 * hlSc, 26 * hlSc);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Lente e feixe luminoso (Amarelo Vintage Bates ou Branco/Azul LED Halo DRL)
    const lensColor = v.isYellowLens ? "#facc15" : "#e0f2fe";
    const glowColor = v.isYellowLens ? "rgba(250, 204, 21, 0.35)" : "rgba(56, 189, 248, 0.35)";

    // Halo / Feixe subtil
    const beamGrad = ctx.createRadialGradient(16 * hlSc, 0, 4, 55 * hlSc, 0, 95 * hlSc);
    beamGrad.addColorStop(0, glowColor);
    beamGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.arc(38 * hlSc, 0, 85 * hlSc, -0.5, 0.5);
    ctx.lineTo(14 * hlSc, 0);
    ctx.closePath();
    ctx.fill();

    // Óptica frontal
    ctx.fillStyle = lensColor;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.5 * hlSc;
    ctx.beginPath();
    ctx.ellipse(14 * hlSc, 0, 8 * hlSc, 24 * hlSc, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Grelha protetora do farol (Bates / Denali / Total Black c/ Grelha)
    if (v.hasHeadlightGrill) {
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 2.2 * hlSc;
      for (let gy = -18; gy <= 18; gy += 7) {
        ctx.beginPath();
        ctx.moveTo(8 * hlSc, gy * hlSc);
        ctx.lineTo(21 * hlSc, gy * hlSc);
        ctx.stroke();
      }
    }
    ctx.restore();

    // ========================================================================
    // 07. GUIADOR, 11. VISOR CONTA-QUILÓMETROS, 12. PUNHOS & 08. PISCAS
    // ========================================================================
    const barHeight = v.isClipOn ? 422 + stanceDeltaY : 468 + stanceDeltaY;
    const barX = v.isClipOn ? 196 : 168;
    const gripZ = cosA >= 0 ? 56 : -56;

    // 11. Visor Conta-Quilómetros (Motogadget tiny / Chronoclassic / Daytona / Koso)
    const speedo3D = {
      x: 192,
      y: v.speedoMount === "flush_triple_tree" ? 442 + stanceDeltaY : 476 + stanceDeltaY,
      z: 0
    };
    const spProj = project3D(speedo3D.x, speedo3D.y, speedo3D.z);
    ctx.save();
    ctx.fillStyle = "#0f172a";
    ctx.strokeStyle = "#c5a059";
    ctx.lineWidth = 2.2;
    const gaugeR =
      (v.speedoOpt === "motogadget_tiny_49" ? 12 : 17) * spProj.scale;
    ctx.beginPath();
    ctx.arc(spProj.x, spProj.y, gaugeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Ponteiro luminoso no mostrador
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(spProj.x, spProj.y);
    ctx.lineTo(spProj.x + gaugeR * 0.65, spProj.y - gaugeR * 0.45);
    ctx.stroke();
    ctx.restore();

    // 07. Tubo do Guiador (Clip-On baixo ou Guiador Largo Renthal Scrambler)
    drawTube3D(
      { x: 185, y: 434 + stanceDeltaY, z: 0 },
      { x: barX, y: barHeight, z: gripZ },
      7.5,
      v.handlebarHex,
      "#ffffff"
    );

    // 12. Punhos (Castanho Conhaque / Chocolate / Preto)
    const gripStart3D = { x: barX - 8, y: barHeight - 2, z: gripZ * 0.85 };
    const gripEnd3D = { x: barX - 28, y: barHeight - 6, z: gripZ * 1.15 };
    drawTube3D(gripStart3D, gripEnd3D, 9.5, v.gripHex, shadeHex(v.gripHex, 30));

    // 08. Piscas LED (Bar-End no topo do guiador OU Fita LED no Loop Traseiro / Kellermann)
    let turnSignalHotspot3D = { x: gripEnd3D.x, y: gripEnd3D.y, z: gripEnd3D.z };
    if (v.turnOpt === "motogadget_moblaze_disc") {
      const tsProj = project3D(gripEnd3D.x, gripEnd3D.y, gripEnd3D.z);
      ctx.save();
      ctx.fillStyle = "#f59e0b";
      ctx.shadowColor = "#f59e0b";
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(tsProj.x, tsProj.y, 7 * tsProj.scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      // Piscas integrados no loop traseiro + micro LEDs
      turnSignalHotspot3D = { x: subframeEndX, y: 360 + stanceDeltaY * 0.4, z: 24 };
      const rearLoopProj = project3D(turnSignalHotspot3D.x, turnSignalHotspot3D.y, turnSignalHotspot3D.z);
      ctx.save();
      ctx.fillStyle = "#f59e0b";
      ctx.shadowColor = "#f59e0b";
      ctx.shadowBlur = 16;
      drawRoundedRect(ctx, rearLoopProj.x - 10, rearLoopProj.y - 5, 20, 10, 5);
      ctx.fill();
      ctx.restore();
    }

    // ========================================================================
    // 5. CALCULAR E GUARDAR AS COORDENADAS DOS 12 PONTOS INTERATIVOS (HOTSPOTS)
    // ========================================================================
    const hotspot3DMap = {
      tank: { x: 45, y: 405 + stanceDeltaY * 0.65, z: 0 },
      seat: { x: -195, y: 392 + stanceDeltaY * 0.5, z: 0 },
      frontSuspension: { x: 245, y: 315 + stanceDeltaY * 0.5, z: 28 },
      rearSuspension: rearSuspHotspot3D,
      wheels: { x: rearWheelX, y: wheelRadius + 95, z: 0 },
      tires: { x: frontWheelX + 95, y: wheelRadius + 95, z: 0 },
      handlebar: { x: barX, y: barHeight + 12, z: gripZ * 0.5 },
      turnSignals: turnSignalHotspot3D,
      brakes: { x: frontWheelX - 55, y: wheelRadius + 25, z: 28 },
      headlight: hlPos3D,
      speedometer: speedo3D,
      grips: gripEnd3D
    };

    const nextHotspots = {};
    Object.keys(hotspot3DMap).forEach((compKey) => {
      const pt3 = hotspot3DMap[compKey];
      const proj = project3D(pt3.x, pt3.y, pt3.z);
      const clampedX = Math.max(110, Math.min(1810, proj.x));
      const clampedY = Math.max(95, Math.min(835, proj.y));
      nextHotspots[compKey] = {
        cx: clampedX,
        cy: clampedY,
        xPct: (clampedX / 1920) * 100,
        yPct: (clampedY / 1080) * 100
      };
    });
    configState.screenHotspots = nextHotspots;

    // ========================================================================
    // 6. BARRA SUPERIOR E RODAPÉ TÉCNICO DE ESTÚDIO 8K
    // ========================================================================
    const topGrad = ctx.createLinearGradient(0, 0, 0, 88);
    topGrad.addColorStop(0, "rgba(4, 7, 12, 0.88)");
    topGrad.addColorStop(1, "rgba(4, 7, 12, 0)");
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, 1920, 88);

    ctx.fillStyle = "#c5a059";
    ctx.font = "bold 14px monospace";
    ctx.fillText(
      `BANDIT GARAGE ATELIER • ESTÚDIO 360° INTERATIVO • ${configState.projectCode} • ÂNGULO: ${Math.round(
        ((angleDeg % 360) + 360) % 360
      )}°`,
      48,
      40
    );

    const footerGrad = ctx.createLinearGradient(0, 860, 0, 1080);
    footerGrad.addColorStop(0, "rgba(0, 0, 0, 0)");
    footerGrad.addColorStop(0.35, "rgba(4, 7, 12, 0.92)");
    footerGrad.addColorStop(1, "rgba(4, 7, 12, 0.98)");
    ctx.fillStyle = footerGrad;
    ctx.fillRect(0, 860, 1920, 220);

    // Emblema B
    ctx.fillStyle = "#c5a059";
    drawRoundedRect(ctx, 48, 962, 58, 58, 12);
    ctx.fill();
    ctx.fillStyle = "#06080d";
    ctx.font = "900 32px sans-serif";
    ctx.fillText("B", 65, 1002);

    const targetName = targetModel ? getLocalizedText(targetModel.name).toUpperCase() : "BANDIT CUSTOM";
    const tankSum = getTopicSummaryText("tank");
    const seatSum = getTopicSummaryText("seat");
    const frontSuspSum = getTopicSummaryText("frontSuspension");
    const wheelsSum = getTopicSummaryText("wheels");
    const brakesSum = getTopicSummaryText("brakes");

    ctx.fillStyle = "#c5a059";
    ctx.font = "bold 12px monospace";
    ctx.fillText(
      `IMAGEM GERADA COM AS ESCOLHAS DO CLIENTE • CLIQUE NAS PEÇAS PARA ALTERAR • ROTAÇÃO 360°`,
      124,
      976
    );

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 25px sans-serif";
    ctx.fillText(
      `${targetName} — DEPÓSITO: ${(tankSum.specs || tankSum.accessory).toUpperCase()}`,
      124,
      1008
    );

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "bold 13px monospace";
    const specLine = `ASSENTO: ${seatSum.brand} (${seatSum.specs})  •  SUSPENSÃO: ${frontSuspSum.brand}  •  JANTES: ${wheelsSum.brand}  •  TRAVÕES: ${brakesSum.brand}`;
    ctx.fillText(specLine.substring(0, 142), 124, 1036);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
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
            Selecione um dos modelos oficiais da Bandit Garage como base do seu projeto. No passo seguinte poderá escolher os acessórios na lista de cada um dos 12 tópicos de produto e, ao confirmar as escolhas, gerar a sua moto interativa 360°.
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
            Selecione os acessórios na lista de cada um dos 12 tópicos de produto (<strong>01. Depósito e Cor</strong>, <strong>02. Assento</strong>, <strong>03. Suspensão Dianteira</strong>, <strong>04. Suspensão Traseira</strong>, <strong>05. Jantes</strong>, <strong>06. Pneus</strong>, <strong>07. Guiador</strong>, <strong>08. Piscas</strong>, <strong>09. Travões</strong>, <strong>10. Farol</strong>, <strong>11. Conta-Quilómetros</strong> e <strong>12. Punhos</strong>). No final, clique em <strong>Confirmar Escolhas & Gerar Imagem Interativa 360°</strong>.
          </p>
        </div>

        <!-- BARRA DE MODELO SELECIONADO E BOTÃO RÁPIDO DE CONFIRMAÇÃO -->
        <div class="cfg-stage-instruction-banner" style="margin-bottom: 20px;">
          <div>
            <strong>Modelo Base Escolhido:</strong> ${getLocalizedText(targetModel?.name)}
            <span style="opacity: 0.8; margin-left: 8px;">• A imagem personalizada 360° será gerada assim que confirmar as suas escolhas.</span>
          </div>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button type="button" class="cfg-btn-studio" id="cfgChangeModelQuickBtn">
              ⇄ Mudar Modelo Bandit
            </button>
            <button type="button" class="btn btn-primary" id="cfgConfirmTopBtn" style="padding: 8px 16px; font-size: 0.82rem;">
              ✓ Confirmar Escolhas & Gerar Imagem 360° →
            </button>
          </div>
        </div>

        <!-- NAVEGAÇÃO RÁPIDA PELOS 12 TÓPICOS -->
        <div class="cfg-sub-section" style="margin-bottom: 24px;">
          <span class="cfg-sub-label">Ir diretamente para o tópico de produto:</span>
          <div class="cfg-pills-row">
            ${quickNavHtml}
          </div>
        </div>

        <!-- LISTA DOS 12 TÓPICOS DE PRODUTO -->
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
            ✓ Confirmar Escolhas & Gerar Imagem Interativa 360° da Moto →
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

    const changeModelBtn = document.getElementById("cfgChangeModelQuickBtn");
    if (changeModelBtn) {
      changeModelBtn.addEventListener("click", () => {
        configState.step = 1;
        renderConfigurator();
      });
    }

    const backBtn = document.getElementById("cfgBackToStep1");
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        configState.step = 1;
        renderConfigurator();
        window.scrollTo({
          top: document.getElementById("configurator").offsetTop - 80,
          behavior: "smooth"
        });
      });
    }

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
  // PASSO 3: IMAGEM CRIADA INTERATIVA (CLIQUE NA PEÇA + ALTERAÇÃO AUTOMÁTICA + ROTAÇÃO 360°)
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
          <span class="cfg-step-badge">Passo 3 de 3 — Imagem Criada Interativa & Rotação 360°</span>
          <h2>A sua ${getLocalizedText(targetModel?.name)} Personalizada</h2>
          <p class="cfg-step-lead">
            A imagem da sua moto foi criada com todas as suas escolhas nos 12 tópicos. <strong>Clique em qualquer componente diretamente na imagem</strong> para ver as alternativas e alterar automaticamente na moto. Utilize o controlo abaixo ou arraste a imagem para <strong>rodar a moto 360 graus</strong>.
          </p>
        </div>

        <div class="cfg-stage-instruction-banner">
          <div>
            <strong>💡 Interação Direta na Imagem:</strong> Clique num dos <strong>12 pontos interativos</strong> (ou diretamente na peça da moto) para abrir as outras alternativas de escolha. Arraste para a esquerda/direita para rodar 360°.
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

        <!-- PALCO INTERATIVO DA MOTO CRIADA COM HOTSPOTS E POPOVER DE ALTERNATIVAS -->
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
              <small style="color: var(--sand);">Clique também em qualquer linha abaixo ou na imagem acima para alterar instantaneamente</small>
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

    // Interação de arrastar (Drag 360°) e clique direto na peça da moto no Canvas
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

        // Se foi um clique direto na imagem da moto (sem arrastar), encontrar a peça mais próxima e abrir as alternativas
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

          if (closestKey && minDist < 260) {
            openPartPopover(closestKey);
          } else if (popoverEl) {
            configState.activePopoverCompKey = null;
            popoverEl.style.display = "none";
            renderHotspotPins();
          }
        }
      });
    }

    // Slider de rotação 360°
    sliderEl?.addEventListener("input", () => {
      stopAutoSpin();
      configState.rotationAngle = parseFloat(sliderEl.value) || 0;
      refreshInteractiveScene();
    });

    // Botões de ângulos rápidos (0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°)
    container.querySelectorAll("[data-angle-preset]").forEach((btn) => {
      btn.addEventListener("click", () => {
        stopAutoSpin();
        configState.rotationAngle = parseFloat(btn.dataset.anglePreset) || 0;
        refreshInteractiveScene();
      });
    });

    // Botão de rotação 360° automática contínua
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

    // Mostrar/Ocultar pontos interativos
    const toggleHotspotsBtn = document.getElementById("cfgToggleHotspotsBtn");
    toggleHotspotsBtn?.addEventListener("click", () => {
      configState.showHotspots = !configState.showHotspots;
      toggleHotspotsBtn.textContent = configState.showHotspots
        ? "👁 Ocultar Pontos (12)"
        : "👁 Mostrar Pontos (12)";
      renderHotspotPins();
    });

    // Ecrã inteiro e download
    document.getElementById("cfgReviewZoomBtn")?.addEventListener("click", () => {
      openRenderLightbox(configState.lastRenderDataUrl, getLocalizedText(targetModel?.name));
    });

    document.getElementById("cfgDownload360RenderBtn")?.addEventListener("click", () => {
      if (configState.lastRenderDataUrl) {
        const a = document.createElement("a");
        a.href = configState.lastRenderDataUrl;
        a.download = `${configState.projectCode}-Bandit-Render-360.jpg`;
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

    // Renderizar inicialmente a cena 3D / 360° da moto personalizada
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
