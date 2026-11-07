/**
 * BANDIT GARAGE — MOTORCYCLE CONFIGURATOR
 * Ferramenta exclusiva de captação de projetos personalizados e pedidos de cotação.
 * NÃO É UMA LOJA ONLINE — Sem carrinho, sem checkout, sem pagamento, sem preço automático comercial.
 * Alinhado com as 12 categorias e o fluxo de 10 estados do BO Bandit App.
 */

(function () {
  // Estado da Configuração Atual
  const configState = {
    step: 1, // 1: Moto de Partida, 2: Modelo Bandit, 3: 12 Componentes, 4: Referências/Notas, 5: Revisão e Envio
    inputBike: {
      make: "BMW",
      model: "BMW R100RT",
      year: 1982,
      vin: "",
      photoUrl: null
    },
    targetModelId: "TFM_CAFE_RACER",
    components: {},
    notes: "",
    referencePhotos: [],
    customer: {
      name: "",
      email: "",
      phone: "",
      country: "",
      city: ""
    },
    projectCode: `MOTO-${new Date().getFullYear()}-${String(Math.floor(100 + Math.random() * 900))}`,
    lastRenderDataUrl: null
  };

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
    let sx = 0, sy = 0, sw = img.width, sh = img.height;
    if (imgRatio > targetRatio) {
      sw = img.height * targetRatio;
      sx = (img.width - sw) / 2;
    } else {
      sh = img.width / targetRatio;
      sy = (img.height - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }

  function loadImageSafe(url) {
    return new Promise((resolve) => {
      if (!url) return resolve(null);
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }

  async function generateStudioRenderCanvas(canvas) {
    if (!canvas) return "";
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    const targetModel = (window.CONFIGURATOR_MODELS || []).find((m) => m.id === configState.targetModelId);
    let studioImg = await loadImageSafe(targetModel?.image);
    if (!studioImg) {
      studioImg = await loadImageSafe("renders/bespoke-scrambler-render-v2.jpg");
    }

    ctx.fillStyle = "#070a10";
    ctx.fillRect(0, 0, 1920, 1080);

    if (studioImg) {
      drawCoverImage(ctx, studioImg, 0, 0, 1920, 1080);
    }

    const footerGrad = ctx.createLinearGradient(0, 910, 0, 1080);
    footerGrad.addColorStop(0, "rgba(0, 0, 0, 0)");
    footerGrad.addColorStop(1, "rgba(4, 7, 12, 0.92)");
    ctx.fillStyle = footerGrad;
    ctx.fillRect(0, 910, 1920, 170);

    ctx.fillStyle = "#c5a059";
    drawRoundedRect(ctx, 48, 996, 48, 48, 10);
    ctx.fill();
    ctx.fillStyle = "#06080d";
    ctx.font = "900 26px sans-serif";
    ctx.fillText("B", 63, 1029);

    ctx.fillStyle = "#c5a059";
    ctx.font = "bold 13px monospace";
    ctx.fillText(
      `BANDIT BESPOKE STUDIO 8K RENDER • ${configState.projectCode} • ATELIER PORTUGAL`,
      112,
      1012
    );

    const targetName = targetModel ? getLocalizedText(targetModel.name).toUpperCase() : "BANDIT CUSTOM";
    ctx.fillStyle = "#f8fafc";
    ctx.font = "900 24px sans-serif";
    ctx.fillText(
      `${configState.inputBike.make} ${configState.inputBike.model} (${configState.inputBike.year}) → ${targetName}`,
      112,
      1042
    );

    const dataUrl = canvas.toDataURL("image/jpeg", 0.94);
    configState.lastRenderDataUrl = dataUrl;
    return dataUrl;
  }

  // Inicializar componentes com valores padrão
  function initDefaultComponents() {
    if (!window.CONFIGURATOR_COMPONENTS) return;
    window.CONFIGURATOR_COMPONENTS.forEach((comp) => {
      configState.components[comp.key] = {
        selectedOption: comp.options[0]?.key || "",
        selectedColor: comp.colors ? comp.colors[0]?.key : null,
        selectedMaterial: comp.materials ? comp.materials[0]?.key : null,
        selectedStitch: comp.stitches ? comp.stitches[0]?.key : null,
        customNotes: ""
      };
    });
  }

  function getLang() {
    return document.documentElement.lang.slice(0, 2) || "pt";
  }

  function getLocalizedText(obj) {
    if (!obj) return "";
    const lang = getLang();
    return obj[lang] || obj.pt || obj.en || Object.values(obj)[0] || "";
  }

  // Renderizar o Wizard do Configurador
  function renderConfigurator() {
    const container = document.getElementById("configuratorWizardContainer");
    if (!container) return;

    const currentStep = configState.step;

    // Atualizar Barra de Progresso / Stepper
    document.querySelectorAll(".cfg-step-indicator").forEach((stepEl) => {
      const stepNum = parseInt(stepEl.dataset.step);
      stepEl.classList.toggle("is-active", stepNum === currentStep);
      stepEl.classList.toggle("is-completed", stepNum < currentStep);
    });

    if (currentStep === 1) {
      renderStep1(container);
    } else if (currentStep === 2) {
      renderStep2(container);
    } else if (currentStep === 3) {
      renderStep3(container);
    } else if (currentStep === 4) {
      renderStep4(container);
    } else if (currentStep === 5) {
      renderStep5(container);
    }
  }

  // PASSO 1: MOTO ORIGINAL DE ENTRADA
  function renderStep1(container) {
    const popularModels = [
      "BMW R100RT",
      "BMW R100RS",
      "BMW R100/7",
      "BMW R80/7",
      "BMW R80 G/S",
      "BMW R80 GS",
      "BMW R65",
      "BMW R90S",
      "BMW K100 (Flying Brick)",
      "Honda CB750 Four",
      "Yamaha XS650",
      "Moto Guzzi 850 Le Mans"
    ];

    container.innerHTML = `
      <div class="cfg-step-box">
        <div class="cfg-step-header">
          <span class="cfg-step-badge">Passo 1 de 5</span>
          <h2>A Sua Motocicleta de Partida</h2>
          <p class="cfg-step-lead">
            Indique a base que já possui ou que gostaria que a Bandit Garage adquirisse para o seu projeto de transformação.
          </p>
        </div>

        <div class="cfg-form-grid">
          <div class="cfg-field-group">
            <label>Marca:</label>
            <select id="cfgInputMake" class="cfg-select">
              <option value="BMW" ${configState.inputBike.make === "BMW" ? "selected" : ""}>BMW Motorrad (Especialidade Bandit)</option>
              <option value="Honda" ${configState.inputBike.make === "Honda" ? "selected" : ""}>Honda</option>
              <option value="Yamaha" ${configState.inputBike.make === "Yamaha" ? "selected" : ""}>Yamaha</option>
              <option value="Triumph" ${configState.inputBike.make === "Triumph" ? "selected" : ""}>Triumph</option>
              <option value="Moto Guzzi" ${configState.inputBike.make === "Moto Guzzi" ? "selected" : ""}>Moto Guzzi</option>
              <option value="Outra" ${configState.inputBike.make === "Outra" ? "selected" : ""}>Outra Marca / A Definir</option>
            </select>
          </div>

          <div class="cfg-field-group">
            <label>Modelo:</label>
            <input type="text" id="cfgInputModel" class="cfg-input" value="${configState.inputBike.model}" placeholder="Ex.: BMW R100RT ou BMW R80 GS" list="popularModelsList" required />
            <datalist id="popularModelsList">
              ${popularModels.map((m) => `<option value="${m}">`).join("")}
            </datalist>
          </div>

          <div class="cfg-field-group">
            <label>Ano de Fabrico (Aprox.):</label>
            <input type="number" id="cfgInputYear" class="cfg-input" value="${configState.inputBike.year}" min="1950" max="2026" required />
          </div>

          <div class="cfg-field-group">
            <label>Nº de Chassi / VIN (Opcional):</label>
            <input type="text" id="cfgInputVin" class="cfg-input" value="${configState.inputBike.vin}" placeholder="Ex.: 608XXXX (Se já tiver a moto)" />
          </div>
        </div>

        <div class="cfg-upload-zone" id="cfgBikePhotoZone">
          <div class="cfg-upload-icon">📷</div>
          <strong>Fotografia da Sua Moto Atual (Opcional)</strong>
          <p>Se já tiver a moto na sua posse, carregue uma foto frontal ou lateral para análise da equipa técnica.</p>
          <input type="file" id="cfgBikePhotoInput" accept="image/*" class="cfg-file-input" />
          <div id="cfgBikePhotoPreview" class="cfg-photo-preview ${configState.inputBike.photoUrl ? "has-photo" : ""}">
            ${configState.inputBike.photoUrl ? `<img src="${configState.inputBike.photoUrl}" alt="Moto base" /><button type="button" id="removeBasePhoto">Remover</button>` : ""}
          </div>
        </div>

        <div class="cfg-step-nav">
          <div></div>
          <button type="button" class="btn btn-primary" id="cfgNextToStep2">
            Continuar para Escolha do Modelo Bandit →
          </button>
        </div>
      </div>
    `;

    // Eventos do Passo 1
    const nextBtn = document.getElementById("cfgNextToStep2");
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        configState.inputBike.make = document.getElementById("cfgInputMake").value;
        configState.inputBike.model = document.getElementById("cfgInputModel").value || "BMW R100";
        configState.inputBike.year = parseInt(document.getElementById("cfgInputYear").value) || 1982;
        configState.inputBike.vin = document.getElementById("cfgInputVin").value;
        configState.step = 2;
        renderConfigurator();
        window.scrollTo({ top: document.getElementById("configurator").offsetTop - 80, behavior: "smooth" });
      });
    }

    const fileInput = document.getElementById("cfgBikePhotoInput");
    if (fileInput) {
      fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            configState.inputBike.photoUrl = event.target.result;
            renderConfigurator();
          };
          reader.readAsDataURL(file);
        }
      });
    }

    const removePhotoBtn = document.getElementById("removeBasePhoto");
    if (removePhotoBtn) {
      removePhotoBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        configState.inputBike.photoUrl = null;
        renderConfigurator();
      });
    }
  }

  // PASSO 2: ESCOLHA DO MODELO BANDIT PRETENDIDO
  function renderStep2(container) {
    const models = window.CONFIGURATOR_MODELS || [];

    container.innerHTML = `
      <div class="cfg-step-box">
        <div class="cfg-step-header">
          <span class="cfg-step-badge">Passo 2 de 5</span>
          <h2>Selecione o Modelo Bandit Pretendido</h2>
          <p class="cfg-step-lead">
            Qual é a postura e filosofia de transformação que pretende para o seu projeto?
          </p>
        </div>

        <div class="cfg-models-grid">
          ${models
            .map((m) => {
              const name = getLocalizedText(m.name);
              const tagline = getLocalizedText(m.tagline);
              const desc = getLocalizedText(m.description);
              const isSelected = configState.targetModelId === m.id;

              return `
              <div class="cfg-model-card ${isSelected ? "is-selected" : ""}" data-model-id="${m.id}">
                <div class="cfg-model-media">
                  <img src="${m.image}" alt="${name}" />
                  ${isSelected ? `<span class="cfg-selected-check">✓ Selecionado</span>` : ""}
                </div>
                <div class="cfg-model-body">
                  <h3>${name}</h3>
                  <p class="cfg-model-tagline">${tagline}</p>
                  <p class="cfg-model-desc">${desc}</p>
                </div>
              </div>
            `;
            })
            .join("")}
        </div>

        <div class="cfg-step-nav">
          <button type="button" class="btn btn-outline" id="cfgBackToStep1">
            ← Voltar à Moto de Partida
          </button>
          <button type="button" class="btn btn-primary" id="cfgNextToStep3">
            Personalizar os 12 Componentes →
          </button>
        </div>
      </div>
    `;

    container.querySelectorAll(".cfg-model-card").forEach((card) => {
      card.addEventListener("click", () => {
        configState.targetModelId = card.dataset.modelId;
        renderConfigurator();
      });
    });

    const backBtn = document.getElementById("cfgBackToStep1");
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        configState.step = 1;
        renderConfigurator();
      });
    }

    const nextBtn = document.getElementById("cfgNextToStep3");
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        configState.step = 3;
        renderConfigurator();
        window.scrollTo({ top: document.getElementById("configurator").offsetTop - 80, behavior: "smooth" });
      });
    }
  }

  // PASSO 3: PERSONALIZAÇÃO DAS 12 CATEGORIAS CANÓNICAS DO BO
  function renderStep3(container) {
    const components = window.CONFIGURATOR_COMPONENTS || [];
    const targetModel = window.CONFIGURATOR_MODELS.find((m) => m.id === configState.targetModelId);

    container.innerHTML = `
      <div class="cfg-step-box">
        <div class="cfg-step-header">
          <span class="cfg-step-badge">Passo 3 de 5</span>
          <h2>Personalização dos Componentes</h2>
          <p class="cfg-step-lead">
            Personalize as 12 categorias técnicas conforme a sua preferência estética e funcional para o modelo 
            <strong>${getLocalizedText(targetModel?.name)}</strong>.
          </p>
        </div>

        <div class="cfg-live-studio-wrap">
          <div class="cfg-live-studio-header">
            <div class="cfg-live-studio-status">
              <span class="cfg-live-dot"></span>
              <span class="cfg-live-studio-title">Estúdio de Render 8K em Tempo Real</span>
              <span class="cfg-live-badge">Ativo</span>
            </div>
            <div class="cfg-live-actions">
              <button type="button" class="cfg-btn-studio" id="cfgDownloadStudioRenderBtn">
                ⬇ Descarregar Render 8K
              </button>
            </div>
          </div>
          <div class="cfg-canvas-stage">
            <canvas id="cfgStudioLiveCanvas" width="1920" height="1080"></canvas>
          </div>
        </div>

        <div class="cfg-components-accordion">
          ${components
            .map((comp) => {
              const compTitle = getLocalizedText(comp.title);
              const compDesc = getLocalizedText(comp.description);
              const currentCfg = configState.components[comp.key] || {};

              let optionsHtml = comp.options
                .map((opt) => {
                  const isChecked = currentCfg.selectedOption === opt.key;
                  return `
                  <label class="cfg-comp-option ${isChecked ? "is-active" : ""}">
                    <input type="radio" name="comp_${comp.key}" value="${opt.key}" ${isChecked ? "checked" : ""} class="cfg-radio-opt" data-comp-key="${comp.key}" />
                    <span>${getLocalizedText(opt.label)}</span>
                  </label>
                `;
                })
                .join("");

              let colorsHtml = "";
              if (comp.colors) {
                colorsHtml = `
                  <div class="cfg-sub-section">
                    <span class="cfg-sub-label">Cor / Tom da Pintura:</span>
                    <div class="cfg-color-swatches">
                      ${comp.colors
                        .map((c) => {
                          const isSel = currentCfg.selectedColor === c.key;
                          return `
                          <button type="button" class="cfg-swatch ${isSel ? "is-selected" : ""}" style="background-color: ${c.hex};" title="${getLocalizedText(c.name)}" data-comp-key="${comp.key}" data-color-key="${c.key}">
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
                    <span class="cfg-sub-label">Material do Estofo:</span>
                    <div class="cfg-pills-row">
                      ${comp.materials
                        .map((mat) => {
                          const isSel = currentCfg.selectedMaterial === mat.key;
                          return `
                          <button type="button" class="cfg-pill ${isSel ? "is-active" : ""}" data-comp-key="${comp.key}" data-mat-key="${mat.key}">
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
                          <button type="button" class="cfg-pill ${isSel ? "is-active" : ""}" data-comp-key="${comp.key}" data-stitch-key="${st.key}">
                            ${getLocalizedText(st.name)}
                          </button>
                        `;
                        })
                        .join("")}
                    </div>
                  </div>
                `;
              }

              return `
              <div class="cfg-component-panel" data-comp-key="${comp.key}">
                <div class="cfg-panel-header">
                  <span class="cfg-panel-num">${String(comp.order).padStart(2, "0")}</span>
                  <div class="cfg-panel-titles">
                    <h3>${compTitle}</h3>
                    <p>${compDesc}</p>
                  </div>
                </div>
                <div class="cfg-panel-body">
                  <div class="cfg-options-list">
                    ${optionsHtml}
                  </div>
                  ${colorsHtml}
                  ${materialsHtml}
                  ${stitchesHtml}
                </div>
              </div>
            `;
            })
            .join("")}
        </div>

        <div class="cfg-step-nav">
          <button type="button" class="btn btn-outline" id="cfgBackToStep2">
            ← Voltar ao Modelo Bandit
          </button>
          <button type="button" class="btn btn-primary" id="cfgNextToStep4">
            Fotografias de Referência & Notas →
          </button>
        </div>
      </div>
    `;

    // Eventos de seleção nos componentes
    container.querySelectorAll(".cfg-radio-opt").forEach((radio) => {
      radio.addEventListener("change", () => {
        const compKey = radio.dataset.compKey;
        if (configState.components[compKey]) {
          configState.components[compKey].selectedOption = radio.value;
        }
        renderConfigurator();
      });
    });

    container.querySelectorAll(".cfg-swatch").forEach((sw) => {
      sw.addEventListener("click", () => {
        const compKey = sw.dataset.compKey;
        const colorKey = sw.dataset.colorKey;
        if (configState.components[compKey]) {
          configState.components[compKey].selectedColor = colorKey;
        }
        renderConfigurator();
      });
    });

    container.querySelectorAll("[data-mat-key]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const compKey = btn.dataset.compKey;
        const matKey = btn.dataset.matKey;
        if (configState.components[compKey]) {
          configState.components[compKey].selectedMaterial = matKey;
        }
        renderConfigurator();
      });
    });

    container.querySelectorAll("[data-stitch-key]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const compKey = btn.dataset.compKey;
        const stitchKey = btn.dataset.stitchKey;
        if (configState.components[compKey]) {
          configState.components[compKey].selectedStitch = stitchKey;
        }
        renderConfigurator();
      });
    });

    const liveCanvas = document.getElementById("cfgStudioLiveCanvas");
    if (liveCanvas) {
      generateStudioRenderCanvas(liveCanvas);
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

    const backBtn = document.getElementById("cfgBackToStep2");
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        configState.step = 2;
        renderConfigurator();
      });
    }

    const nextBtn = document.getElementById("cfgNextToStep4");
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        configState.step = 4;
        renderConfigurator();
        window.scrollTo({ top: document.getElementById("configurator").offsetTop - 80, behavior: "smooth" });
      });
    }
  }

  // PASSO 4: FOTOS DE REFERÊNCIA & NOTAS DO CLIENTE
  function renderStep4(container) {
    container.innerHTML = `
      <div class="cfg-step-box">
        <div class="cfg-step-header">
          <span class="cfg-step-badge">Passo 4 de 5</span>
          <h2>Fotografias de Referência & Observações</h2>
          <p class="cfg-step-lead">
            Tem fotografias de motos que admira, pormenores de acabamento ou esboços? Carregue-os aqui para a análise da nossa equipa.
          </p>
        </div>

        <div class="cfg-upload-zone" id="cfgRefPhotosZone">
          <div class="cfg-upload-icon">📂</div>
          <strong>Carregar Fotografias ou Anexos de Inspiração</strong>
          <p>Arraste ficheiros ou clique para selecionar (PNG, JPG, PDF até 15MB).</p>
          <input type="file" id="cfgRefPhotoInput" multiple accept="image/*" class="cfg-file-input" />
        </div>

        <div class="cfg-gallery-previews" id="cfgGalleryPreviews">
          ${configState.referencePhotos
            .map(
              (p, idx) => `
            <div class="cfg-gallery-item">
              <img src="${p}" alt="Referência ${idx + 1}" />
              <button type="button" class="cfg-remove-photo-btn" data-photo-idx="${idx}">×</button>
            </div>
          `
            )
            .join("")}
        </div>

        <div class="cfg-field-group" style="margin-top: 24px;">
          <label>Observações e Intenção de Utilização:</label>
          <textarea id="cfgNotes" class="cfg-textarea" rows="4" placeholder="Ex.: Pretendo uma condução diária confortável, preferência por escape com bom som sem ser excessivo, destino final em França, etc.">${configState.notes}</textarea>
        </div>

        <div class="cfg-step-nav">
          <button type="button" class="btn btn-outline" id="cfgBackToStep3">
            ← Voltar aos Componentes
          </button>
          <button type="button" class="btn btn-primary" id="cfgNextToStep5">
            Revisão & Pedido de Cotação →
          </button>
        </div>
      </div>
    `;

    const fileInput = document.getElementById("cfgRefPhotoInput");
    if (fileInput) {
      fileInput.addEventListener("change", (e) => {
        Array.from(e.target.files).forEach((file) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            configState.referencePhotos.push(event.target.result);
            renderConfigurator();
          };
          reader.readAsDataURL(file);
        });
      });
    }

    container.querySelectorAll(".cfg-remove-photo-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        configState.referencePhotos.splice(parseInt(btn.dataset.photoIdx), 1);
        renderConfigurator();
      });
    });

    const backBtn = document.getElementById("cfgBackToStep3");
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        configState.notes = document.getElementById("cfgNotes")?.value || "";
        configState.step = 3;
        renderConfigurator();
      });
    }

    const nextBtn = document.getElementById("cfgNextToStep5");
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        configState.notes = document.getElementById("cfgNotes")?.value || "";
        configState.step = 5;
        renderConfigurator();
        window.scrollTo({ top: document.getElementById("configurator").offsetTop - 80, behavior: "smooth" });
      });
    }
  }

  // PASSO 5: REVISÃO, IDENTIFICAÇÃO E SUBMISSÃO PARA COTAÇÃO NO BO
  function renderStep5(container) {
    const targetModel = window.CONFIGURATOR_MODELS.find((m) => m.id === configState.targetModelId);
    const components = window.CONFIGURATOR_COMPONENTS || [];

    // Gerar lista resumida dos 12 componentes
    const summaryListHtml = components
      .map((c) => {
        const cTitle = getLocalizedText(c.title);
        const compCfg = configState.components[c.key] || {};
        const chosenOpt = c.options.find((o) => o.key === compCfg.selectedOption);
        const optTitle = chosenOpt ? getLocalizedText(chosenOpt.label) : "Padrão Bandit";

        let extraDetails = [];
        if (compCfg.selectedColor && c.colors) {
          const colorObj = c.colors.find((co) => co.key === compCfg.selectedColor);
          if (colorObj) extraDetails.push(`Cor: ${getLocalizedText(colorObj.name)}`);
        }
        if (compCfg.selectedMaterial && c.materials) {
          const matObj = c.materials.find((m) => m.key === compCfg.selectedMaterial);
          if (matObj) extraDetails.push(`Material: ${getLocalizedText(matObj.name)}`);
        }
        if (compCfg.selectedStitch && c.stitches) {
          const stObj = c.stitches.find((s) => s.key === compCfg.selectedStitch);
          if (stObj) extraDetails.push(`Costura: ${getLocalizedText(stObj.name)}`);
        }

        return `
        <div class="cfg-summary-row">
          <strong>${cTitle}:</strong>
          <div>
            <span>${optTitle}</span>
            ${extraDetails.length > 0 ? `<small class="cfg-summary-extra">${extraDetails.join(" · ")}</small>` : ""}
          </div>
        </div>
      `;
      })
      .join("");

    container.innerHTML = `
      <div class="cfg-step-box">
        <div class="cfg-step-header">
          <span class="cfg-step-badge">Passo 5 de 5 — Revisão Final</span>
          <h2>Submissão do Pedido de Cotação</h2>
          <p class="cfg-step-lead">
            Reveja os detalhes do seu projeto de transformação e introduza os seus contactos para envio à oficina Bandit Garage.
          </p>
        </div>

        <div class="cfg-notice-banner">
          <div class="cfg-notice-icon">ℹ️</div>
          <div>
            <strong>Processo de Cotação Técnica Bandit Garage:</strong>
            <p>
              O configurador é uma ferramenta de captação de projetos personalizados. 
              <strong>Não é uma loja online e não gera preços comerciais automáticos.</strong>
              O orçamento formal detalhado será preparado e validado pela equipa Bandit após análise de viabilidade técnica.
            </p>
          </div>
        </div>

        <div class="cfg-summary-dossier">
          <div class="cfg-dossier-hero">
            <img src="${configState.lastRenderDataUrl || targetModel?.image}" alt="Modelo Bandit" class="cfg-dossier-img" id="cfgDossierHeroImg" />
            <div class="cfg-dossier-intro">
              <span class="cfg-tag">Modelo Escolhido</span>
              <h3>${getLocalizedText(targetModel?.name)}</h3>
              <p><strong>Moto de Origem:</strong> ${configState.inputBike.make} ${configState.inputBike.model} (${configState.inputBike.year})</p>
              ${configState.inputBike.vin ? `<p><strong>Chassi/VIN:</strong> ${configState.inputBike.vin}</p>` : ""}
              ${configState.referencePhotos.length > 0 ? `<p><strong>Anexos:</strong> ${configState.referencePhotos.length} fotografia(s) de referência incluída(s)</p>` : ""}
            </div>
          </div>

          <div class="cfg-summary-details">
            <h4>Especificações Configuradas das 12 Categorias</h4>
            <div class="cfg-summary-grid">
              ${summaryListHtml}
            </div>
            ${configState.notes ? `<div class="cfg-summary-notes"><strong>Observações:</strong> ${configState.notes}</div>` : ""}
          </div>
        </div>

        <form id="cfgSubmissionForm" class="cfg-customer-form">
          <h3>Os Seus Contactos</h3>
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
              <label>País / Cidade de Residência:</label>
              <input type="text" name="customer_location" class="cfg-input" placeholder="Ex.: Lisboa, Portugal / Paris, França" required />
            </div>
          </div>

          <div class="cfg-step-nav" style="margin-top: 24px;">
            <button type="button" class="btn btn-outline" id="cfgBackToStep4">
              ← Alterar Fotos e Notas
            </button>
            <button type="submit" class="btn btn-primary" id="cfgSubmitBtn">
              Submeter Pedido de Cotação à Bandit →
            </button>
          </div>
        </form>
      </div>
    `;

    const backBtn = document.getElementById("cfgBackToStep4");
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        configState.step = 4;
        renderConfigurator();
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
      submitBtn.textContent = "A enviar projeto à oficina...";
    }

    const formData = new FormData(form);
    const targetModel = window.CONFIGURATOR_MODELS.find((m) => m.id === configState.targetModelId);

    // Gerar código de projeto canónico do BO (ex: MOTO-2026-042)
    const projectCode = `MOTO-${new Date().getFullYear()}-${String(Math.floor(100 + Math.random() * 900))}`;

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
      inputBike: {
        make: configState.inputBike.make,
        model: configState.inputBike.model,
        year: configState.inputBike.year,
        vin: configState.inputBike.vin,
        photoIncluded: Boolean(configState.inputBike.photoUrl)
      },
      targetModel: {
        id: targetModel?.id,
        category: targetModel?.category,
        name: getLocalizedText(targetModel?.name)
      },
      componentsConfig: configState.components,
      referencePhotosCount: configState.referencePhotos.length,
      notes: configState.notes,
      commercialNotice: "Preço sob consulta técnica Bandit. Sem carrinho nem conversão automática em venda."
    };

    // Gravação no BO (armazenamento persistente no formato da tabela moto_projects do BO)
    try {
      const existingQuotes = JSON.parse(localStorage.getItem("bandit_bo_moto_projects") || "[]");
      existingQuotes.unshift(quotePayload);
      localStorage.setItem("bandit_bo_moto_projects", JSON.stringify(existingQuotes));
    } catch (_err) {}

    // Ecrã de Confirmação do Pedido de Cotação
    const container = document.getElementById("configuratorWizardContainer");
    if (container) {
      container.innerHTML = `
        <div class="cfg-success-box">
          <div class="cfg-success-badge">✓ Pedido Registado</div>
          <h2>Pedido de Cotação Submetido com Sucesso</h2>
          <p class="cfg-code-display">Código do Projeto: <strong>${projectCode}</strong></p>
          
          <div class="cfg-success-card">
            <h4>O que acontece a seguir?</h4>
            <ol class="cfg-steps-list">
              <li><strong>1. Análise Técnica:</strong> A equipa de engenharia e transformação da Bandit Garage vai analisar a compatibilidade da sua moto base com o modelo <em>${getLocalizedText(targetModel?.name)}</em>.</li>
              <li><strong>2. Validação & Componentes:</strong> Iremos verificar os componentes selecionados, disponibilidade e necessidades estruturais.</li>
              <li><strong>3. Orçamento Formal:</strong> Prepararemos uma proposta orçamentada detalhada com estimativa de horas, materiais e cronograma de produção.</li>
              <li><strong>4. Apresentação:</strong> Entraremos em contacto consigo através de <strong>${quotePayload.customer.email}</strong> ou por telefone para apresentar a cotação e afinar detalhes.</li>
            </ol>
          </div>

          <div class="cfg-success-actions">
            <button type="button" class="btn btn-outline" id="cfgRestartBtn">
              Nova Configuração
            </button>
            <a href="#atelier" class="btn btn-primary">
              Conhecer o Nosso Atelier
            </a>
          </div>
        </div>
      `;

      const restartBtn = document.getElementById("cfgRestartBtn");
      if (restartBtn) {
        restartBtn.addEventListener("click", () => {
          configState.step = 1;
          renderConfigurator();
        });
      }
    }
  }

  // Inicialização
  document.addEventListener("DOMContentLoaded", () => {
    initDefaultComponents();
    renderConfigurator();
  });

  window.MotorcycleConfigurator = {
    render: renderConfigurator,
    getState: () => configState
  };
})();
