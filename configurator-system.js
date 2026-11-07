/**
 * BANDIT GARAGE — MOTORCYCLE CONFIGURATOR
 * Passo 1: O cliente escolhe um dos 9 modelos da Bandit Garage.
 * Passo 2: O cliente escolhe os acessórios na lista de acessórios em cada um dos 12 tópicos de produto:
 *          01. Depósito (acessório, cor do depósito, acabamento, faixas)
 *          02. Assento (acessório, pele/cor, costura)
 *          03. Bainhas Dianteiras / Suspensão
 *          04. Suspensão Traseira
 *          05. Jantes
 *          06. Pneus
 *          07. Guiador
 *          08. Piscas
 *          09. Travões
 *          10. Farol
 *          11. Visor de Conta-Quilómetros
 *          12. Punhos
 * Passo 3: Revisão do Render 8K e envio do pedido de cotação à Bandit Garage.
 */

(function () {
  const configState = {
    step: 1, // 1: Escolher Modelo Bandit, 2: Escolher Acessórios nos 12 Tópicos, 3: Resumo & Cotação
    modelCategoryFilter: "ALL",
    targetModelId: "TFM_CAFE_RACER",
    inputBike: {
      hasDonorBike: "BANDIT_SOURCE", // "BANDIT_SOURCE" (A Bandit fornece a moto base) ou "CLIENT_HAS" (Tenho moto própria)
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
    lastRenderDataUrl: null
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
    if (!model || !model.defaultColors) return;
    if (model.defaultColors.tank && configState.components.tank) {
      configState.components.tank.selectedColor = model.defaultColors.tank;
    }
    if (model.defaultColors.seat && configState.components.seat) {
      configState.components.seat.selectedMaterial = model.defaultColors.seat;
    }
  }

  // Helpers para resumo de cada tópico
  function getTopicSummaryText(compKey) {
    const comp = (window.CONFIGURATOR_COMPONENTS || []).find((c) => c.key === compKey);
    const cfg = configState.components[compKey];
    if (!comp || !cfg) return "Padrão Bandit";

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
  // MOTOR DE RENDER 8K DE ESTÚDIO (CANVAS 1920x1080)
  // ============================================================================
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

  function hexToRgba(hex, alpha) {
    if (!hex) return `rgba(0,0,0,${alpha})`;
    let c = hex.replace("#", "");
    if (c.length === 3) {
      c = c
        .split("")
        .map((x) => x + x)
        .join("");
    }
    const num = parseInt(c, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  async function generateStudioRenderCanvas(canvas) {
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

    let studioImg = await loadImageSafe(targetModel?.image);
    if (!studioImg) {
      studioImg = await loadImageSafe("renders/bespoke-scrambler-render-v2.jpg");
    }

    ctx.fillStyle = "#070a10";
    ctx.fillRect(0, 0, 1920, 1080);

    if (studioImg) {
      drawCoverImage(ctx, studioImg, 0, 0, 1920, 1080);
    }

    // Luz ambiente subtil da cor selecionada para o depósito
    const tankComp = (window.CONFIGURATOR_COMPONENTS || []).find((c) => c.key === "tank");
    const tankColorKey = configState.components.tank?.selectedColor;
    const tankColorObj = tankComp?.colors?.find((c) => c.key === tankColorKey);
    if (tankColorObj && tankColorObj.hex) {
      ctx.save();
      const glow = ctx.createRadialGradient(960, 440, 40, 960, 440, 520);
      glow.addColorStop(0, hexToRgba(tankColorObj.hex, 0.22));
      glow.addColorStop(0.6, hexToRgba(tankColorObj.hex, 0.08));
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, 1920, 920);
      ctx.restore();
    }

    // Barra superior discreta de estúdio
    const topGrad = ctx.createLinearGradient(0, 0, 0, 90);
    topGrad.addColorStop(0, "rgba(4, 7, 12, 0.85)");
    topGrad.addColorStop(1, "rgba(4, 7, 12, 0)");
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, 1920, 90);

    ctx.fillStyle = "#c5a059";
    ctx.font = "bold 13px monospace";
    ctx.fillText(`BANDIT GARAGE ATELIER • CONFIGURAÇÃO PERSONALIZADA • ${configState.projectCode}`, 48, 38);

    // Rodapé técnico com o modelo Bandit e resumo dos acessórios escolhidos
    const footerGrad = ctx.createLinearGradient(0, 880, 0, 1080);
    footerGrad.addColorStop(0, "rgba(0, 0, 0, 0)");
    footerGrad.addColorStop(0.35, "rgba(4, 7, 12, 0.88)");
    footerGrad.addColorStop(1, "rgba(4, 7, 12, 0.96)");
    ctx.fillStyle = footerGrad;
    ctx.fillRect(0, 880, 1920, 200);

    // Emblema B
    ctx.fillStyle = "#c5a059";
    drawRoundedRect(ctx, 48, 968, 56, 56, 12);
    ctx.fill();
    ctx.fillStyle = "#06080d";
    ctx.font = "900 30px sans-serif";
    ctx.fillText("B", 65, 1007);

    const targetName = targetModel ? getLocalizedText(targetModel.name).toUpperCase() : "BANDIT CUSTOM";
    const tankSum = getTopicSummaryText("tank");
    const seatSum = getTopicSummaryText("seat");
    const frontSuspSum = getTopicSummaryText("frontSuspension");
    const wheelsSum = getTopicSummaryText("wheels");
    const brakesSum = getTopicSummaryText("brakes");

    ctx.fillStyle = "#c5a059";
    ctx.font = "bold 12px monospace";
    ctx.fillText(
      `MODELO BANDIT ESCOLHIDO • 12 TÓPICOS DE ACESSÓRIOS CONFIGURADOS`,
      122,
      982
    );

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 26px sans-serif";
    ctx.fillText(
      `${targetName} — DEPÓSITO: ${(tankSum.specs || tankSum.accessory).toUpperCase()}`,
      122,
      1013
    );

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "bold 13px monospace";
    const specLine = `ASSENTO: ${seatSum.brand} (${seatSum.specs})  •  SUSPENSÃO: ${frontSuspSum.brand}  •  JANTES: ${wheelsSum.brand}  •  TRAVÕES: ${brakesSum.brand}`;
    ctx.fillText(specLine.substring(0, 138), 122, 1040);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.94);
    configState.lastRenderDataUrl = dataUrl;
    return dataUrl;
  }

  function updateStudioFooterChips() {
    const tankChip = document.getElementById("cfgChipTank");
    const seatChip = document.getElementById("cfgChipSeat");
    const suspChip = document.getElementById("cfgChipSusp");
    const wheelsChip = document.getElementById("cfgChipWheels");
    const brakesChip = document.getElementById("cfgChipBrakes");

    const tank = getTopicSummaryText("tank");
    const seat = getTopicSummaryText("seat");
    const susp = getTopicSummaryText("frontSuspension");
    const wheels = getTopicSummaryText("wheels");
    const brakes = getTopicSummaryText("brakes");

    if (tankChip) tankChip.innerHTML = `<strong>01. Depósito:</strong> ${tank.brand} (${tank.specs})`;
    if (seatChip) seatChip.innerHTML = `<strong>02. Assento:</strong> ${seat.brand} (${seat.specs})`;
    if (suspChip) suspChip.innerHTML = `<strong>03. Suspensão:</strong> ${susp.brand}`;
    if (wheelsChip) wheelsChip.innerHTML = `<strong>05. Jantes:</strong> ${wheels.brand}`;
    if (brakesChip) brakesChip.innerHTML = `<strong>09. Travões:</strong> ${brakes.brand}`;
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

  // ============================================================================
  // RENDERIZAÇÃO DO WIZARD (3 PASSOS)
  // ============================================================================
  function renderConfigurator() {
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
            Selecione um dos modelos oficiais da Bandit Garage como base do seu projeto. No passo seguinte poderá escolher os acessórios em cada um dos 12 tópicos de produto (cor do depósito, assento, suspensão, jantes, pneus, guiador, piscas, travões, farol, visor e punhos).
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
  // PASSO 2: ESCOLHA DOS ACESSÓRIOS EM CADA UM DOS 12 TÓPICOS DE PRODUTO
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
          <h2>Configurar Acessórios — ${getLocalizedText(targetModel?.name)}</h2>
          <p class="cfg-step-lead">
            Escolha os acessórios na lista de cada tópico de produto: <strong>01. Depósito e Cor</strong>, <strong>02. Assento</strong>, <strong>03. Suspensão Dianteira</strong>, <strong>04. Suspensão Traseira</strong>, <strong>05. Jantes</strong>, <strong>06. Pneus</strong>, <strong>07. Guiador</strong>, <strong>08. Piscas</strong>, <strong>09. Travões</strong>, <strong>10. Farol</strong>, <strong>11. Conta-Quilómetros</strong> e <strong>12. Punhos</strong>.
          </p>
        </div>

        <!-- ESTÚDIO DE RENDER 8K EM TEMPO REAL -->
        <div class="cfg-live-studio-wrap">
          <div class="cfg-live-studio-header">
            <div class="cfg-live-studio-status">
              <span class="cfg-live-dot"></span>
              <span class="cfg-live-studio-title">Estúdio Bandit 8K — ${getLocalizedText(targetModel?.name)}</span>
              <span class="cfg-live-badge">Render Dinâmico</span>
            </div>
            <div class="cfg-live-actions">
              <button type="button" class="cfg-btn-studio" id="cfgChangeModelQuickBtn">
                ⇄ Mudar Modelo Bandit
              </button>
              <button type="button" class="cfg-btn-studio" id="cfgFullscreenStudioBtn">
                🔍 Ecrã Inteiro
              </button>
              <button type="button" class="cfg-btn-studio" id="cfgDownloadStudioRenderBtn">
                ⬇ Guardar Render 8K
              </button>
            </div>
          </div>
          <div class="cfg-canvas-stage">
            <canvas id="cfgStudioLiveCanvas" width="1920" height="1080"></canvas>
          </div>
          <div class="cfg-live-studio-footer">
            <span class="cfg-render-specs-chip" id="cfgChipTank"></span>
            <span class="cfg-render-specs-chip" id="cfgChipSeat"></span>
            <span class="cfg-render-specs-chip" id="cfgChipSusp"></span>
            <span class="cfg-render-specs-chip" id="cfgChipWheels"></span>
            <span class="cfg-render-specs-chip" id="cfgChipBrakes"></span>
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

              // Lista de Acessórios da Categoria
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

              // Seletor de Cor (ex: Cor do Depósito)
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

              // Seletor de Material / Pele (Assento)
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

              // Seletor de Costura (Assento)
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

              // Especificação Técnica 1 (Acabamento, Curso, Medida, etc.)
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

              // Especificação Técnica 2 (Faixas, Cor das Bainhas/Pinças, etc.)
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
            Ver Resumo dos 12 Tópicos & Pedir Cotação →
          </button>
        </div>
      </div>
    `;

    // Renderizar o Canvas 8K e os chips de resumo
    const liveCanvas = document.getElementById("cfgStudioLiveCanvas");
    updateStudioFooterChips();
    if (liveCanvas) {
      generateStudioRenderCanvas(liveCanvas);
    }

    const refreshStudio = () => {
      updateStudioFooterChips();
      const c = document.getElementById("cfgStudioLiveCanvas");
      if (c) generateStudioRenderCanvas(c);
    };

    // Eventos sem reconstruir todo o DOM para manter o scroll estável
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
        refreshStudio();
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
        refreshStudio();
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
        refreshStudio();
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
        refreshStudio();
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
        refreshStudio();
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
        refreshStudio();
      });
    });

    const changeModelBtn = document.getElementById("cfgChangeModelQuickBtn");
    if (changeModelBtn) {
      changeModelBtn.addEventListener("click", () => {
        configState.step = 1;
        renderConfigurator();
      });
    }

    const fullBtn = document.getElementById("cfgFullscreenStudioBtn");
    if (fullBtn) {
      fullBtn.addEventListener("click", async () => {
        const c = document.getElementById("cfgStudioLiveCanvas") || document.createElement("canvas");
        const url = await generateStudioRenderCanvas(c);
        openRenderLightbox(url, getLocalizedText(targetModel?.name));
      });
    }

    const dlBtn = document.getElementById("cfgDownloadStudioRenderBtn");
    if (dlBtn) {
      dlBtn.addEventListener("click", async () => {
        const c = document.getElementById("cfgStudioLiveCanvas") || document.createElement("canvas");
        const url = await generateStudioRenderCanvas(c);
        if (url) {
          const a = document.createElement("a");
          a.href = url;
          a.download = `${configState.projectCode}-Bandit-Render-8K.jpg`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
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

    const nextBtn = document.getElementById("cfgNextToStep3");
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        configState.step = 3;
        renderConfigurator();
        window.scrollTo({
          top: document.getElementById("configurator").offsetTop - 80,
          behavior: "smooth"
        });
      });
    }
  }

  // ============================================================================
  // PASSO 3: RESUMO DOS 12 TÓPICOS, RENDER 8K E ENVIO DE PEDIDO DE COTAÇÃO
  // ============================================================================
  async function renderStep3Review(container) {
    const targetModel =
      (window.CONFIGURATOR_MODELS || []).find((m) => m.id === configState.targetModelId) ||
      (window.CONFIGURATOR_MODELS || [])[0];
    const components = window.CONFIGURATOR_COMPONENTS || [];

    if (!configState.lastRenderDataUrl) {
      await generateStudioRenderCanvas(document.createElement("canvas"));
    }

    const summaryListHtml = components
      .map((c) => {
        const cTitle = getLocalizedText(c.title);
        const sum = getTopicSummaryText(c.key);

        return `
        <div class="cfg-summary-row">
          <strong>${String(c.order).padStart(2, "0")}. ${cTitle}:</strong>
          <div>
            <span>${sum.accessory}</span>
            ${sum.specs ? `<small class="cfg-summary-extra">${sum.specs}</small>` : ""}
          </div>
        </div>
      `;
      })
      .join("");

    container.innerHTML = `
      <div class="cfg-step-box">
        <div class="cfg-step-header">
          <span class="cfg-step-badge">Passo 3 de 3 — Resumo da Configuração & Pedido de Cotação</span>
          <h2>Ficha Técnica da sua ${getLocalizedText(targetModel?.name)}</h2>
          <p class="cfg-step-lead">
            Reveja o modelo Bandit escolhido e os acessórios selecionados nos 12 tópicos de produto. Preencha os seus dados para receber a proposta técnica da Bandit Garage.
          </p>
        </div>

        <div class="cfg-summary-dossier">
          <div class="cfg-dossier-hero" style="flex-direction: column; gap: 16px;">
            <div style="width: 100%; border-radius: 12px; overflow: hidden; border: 1px solid rgba(197, 160, 89, 0.35); background: #04060a;">
              <img src="${configState.lastRenderDataUrl || targetModel?.image}" alt="Render Bandit 8K" style="width: 100%; height: auto; display: block; cursor: pointer;" id="cfgReviewHeroImg" />
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; width: 100%;">
              <div>
                <span class="cfg-tag">Modelo Bandit Selecionado</span>
                <h3 style="margin-top: 4px;">${getLocalizedText(targetModel?.name)} (${configState.projectCode})</h3>
              </div>
              <div style="display: flex; gap: 10px;">
                <button type="button" class="cfg-btn-studio" id="cfgReviewZoomBtn">🔍 Ver em Ecrã Inteiro</button>
                <a href="${configState.lastRenderDataUrl || targetModel?.image}" download="${configState.projectCode}-Bandit-Render-8K.jpg" class="cfg-btn-studio">⬇ Descarregar Render 8K</a>
              </div>
            </div>
          </div>

          <div class="cfg-summary-details">
            <h4>Acessórios Escolhidos nos 12 Tópicos de Produto</h4>
            <div class="cfg-summary-grid">
              ${summaryListHtml}
            </div>
          </div>
        </div>

        <form id="cfgSubmissionForm" class="cfg-customer-form">
          <h3>Dados de Contacto & Observações</h3>
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
              ← Alterar Acessórios nos 12 Tópicos
            </button>
            <button type="submit" class="btn btn-primary" id="cfgSubmitBtn">
              Enviar Configuração à Bandit Garage →
            </button>
          </div>
        </form>
      </div>
    `;

    const zoomHandler = () => {
      openRenderLightbox(
        configState.lastRenderDataUrl || targetModel?.image,
        getLocalizedText(targetModel?.name)
      );
    };
    document.getElementById("cfgReviewHeroImg")?.addEventListener("click", zoomHandler);
    document.getElementById("cfgReviewZoomBtn")?.addEventListener("click", zoomHandler);

    const backBtn = document.getElementById("cfgBackToStep2");
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        configState.step = 2;
        renderConfigurator();
        window.scrollTo({
          top: document.getElementById("configurator").offsetTop - 80,
          behavior: "smooth"
        });
      });
    }

    const form = document.getElementById("cfgSubmissionForm");
    if (form) {
      form.addEventListener("submit", handleConfigSubmit);
    }
  }

  // SUBMISSÃO PARA O BACKOFFICE BANDIT APP
  function handleConfigSubmit(e) {
    e.preventDefault();
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

  // Permitir clicar diretamente nos passos do Stepper Bar
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
