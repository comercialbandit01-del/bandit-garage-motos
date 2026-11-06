/**
 * BANDIT GARAGE — SISTEMA DA BANDIT STORE
 * Destina-se exclusivamente à comercialização de kits completos Bandit Garage.
 * NÃO se mistura com o configurador de projetos.
 */

(function () {
  // Estado do Carrinho (armazenado em localStorage)
  let cart = [];
  try {
    const saved = localStorage.getItem("bandit_store_cart");
    if (saved) cart = JSON.parse(saved);
  } catch (_e) {
    cart = [];
  }

  function saveCart() {
    try {
      localStorage.setItem("bandit_store_cart", JSON.stringify(cart));
    } catch (_e) {}
    updateCartUI();
  }

  function getLang() {
    return document.documentElement.lang.slice(0, 2) || "pt";
  }

  function getLocalizedText(obj) {
    if (!obj) return "";
    const lang = getLang();
    return obj[lang] || obj.pt || obj.en || Object.values(obj)[0] || "";
  }

  function formatMoney(amount) {
    return (
      Number(amount).toLocaleString("pt-PT", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }) + " €"
    );
  }

  // Elementos do DOM da Store
  const storeContainer = document.getElementById("banditStoreCatalog");
  const cartDrawer = document.getElementById("storeCartDrawer");
  const cartOverlay = document.getElementById("storeCartOverlay");
  const cartItemsList = document.getElementById("storeCartItemsList");
  const cartSubtotalEl = document.getElementById("storeCartSubtotal");
  const cartVatEl = document.getElementById("storeCartVat");
  const cartTotalEl = document.getElementById("storeCartTotal");
  const cartCountBadges = document.querySelectorAll(".cart-count-badge");
  const kitModal = document.getElementById("kitDetailModal");
  const kitModalContent = document.getElementById("kitDetailModalContent");
  const checkoutModal = document.getElementById("storeCheckoutModal");

  // Renderizar o Catálogo de Kits
  function renderStoreCatalog(filterCategory = "all") {
    if (!storeContainer || !window.BANDIT_KITS) return;

    const filtered =
      filterCategory === "all"
        ? window.BANDIT_KITS
        : window.BANDIT_KITS.filter((k) => k.category === filterCategory);

    storeContainer.innerHTML = filtered
      .map((kit) => {
        const categoryTitle = getLocalizedText(kit.categoryName);
        const name = getLocalizedText(kit.name);
        const tagline = getLocalizedText(kit.tagline);
        const delivery = getLocalizedText(kit.deliveryTime);
        const mainImage = kit.images[0] || "";

        return `
        <article class="kit-card" data-kit-id="${kit.id}">
          <div class="kit-card-media">
            <img src="${mainImage}" alt="${name}" loading="lazy" />
            <span class="kit-card-ref">${kit.ref}</span>
            <span class="kit-card-badge">${categoryTitle}</span>
          </div>
          <div class="kit-card-body">
            <h3 class="kit-card-title">${name}</h3>
            <p class="kit-card-tagline">${tagline}</p>
            
            <div class="kit-card-compat-preview">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span>${kit.compatibility[0].make} ${kit.compatibility[0].model} (${kit.compatibility[0].years}) +</span>
            </div>

            <div class="kit-card-footer">
              <div class="kit-card-pricing">
                <span class="kit-price-gross">${formatMoney(kit.priceGross)}</span>
                <span class="kit-price-vat">IVA inc. (23%)</span>
              </div>
              <button type="button" class="btn btn-outline btn-small view-kit-btn" data-kit-id="${kit.id}">
                Ver Especificações
              </button>
            </div>
            
            <div class="kit-card-delivery-tag">
              <span class="dot-in-stock"></span> ${delivery}
            </div>
          </div>
        </article>
      `;
      })
      .join("");

    // Adicionar eventos de clique nos cartões
    storeContainer.querySelectorAll(".view-kit-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        openKitModal(btn.dataset.kitId);
      });
    });
  }

  // Abrir Ficha Técnica Individual do Kit
  function openKitModal(kitId) {
    const kit = window.BANDIT_KITS.find((k) => k.id === kitId);
    if (!kit || !kitModal || !kitModalContent) return;

    const name = getLocalizedText(kit.name);
    const tagline = getLocalizedText(kit.tagline);
    const category = getLocalizedText(kit.categoryName);
    const delivery = getLocalizedText(kit.deliveryTime);
    const contentItems = kit.contentList[getLang()] || kit.contentList.pt || [];
    const techSpecs = kit.technicalSpecs[getLang()] || kit.technicalSpecs.pt || [];

    // Gerar seletores de variantes/opções
    let optionsHtml = "";
    if (kit.options && kit.options.length > 0) {
      optionsHtml = kit.options
        .map((opt) => {
          const optLabel = getLocalizedText(opt.label);
          return `
          <div class="kit-option-group">
            <label class="kit-option-label">${optLabel}:</label>
            <select class="kit-option-select" data-option-id="${opt.id}">
              ${opt.values
                .map((v) => `<option value="${v.key}">${getLocalizedText(v.name)}</option>`)
                .join("")}
            </select>
          </div>
        `;
        })
        .join("");
    }

    kitModalContent.innerHTML = `
      <div class="kit-modal-header">
        <div class="kit-modal-tags">
          <span class="kit-tag-ref">${kit.ref}</span>
          <span class="kit-tag-cat">${category}</span>
          <span class="kit-tag-stock"><span class="dot-in-stock"></span> ${delivery}</span>
        </div>
        <h2 class="kit-modal-title">${name}</h2>
        <p class="kit-modal-lead">${tagline}</p>
      </div>

      <div class="kit-modal-grid">
        <div class="kit-modal-gallery">
          <div class="kit-main-image-wrap">
            <img id="kitModalMainImg" src="${kit.images[0]}" alt="${name}" />
          </div>
          <div class="kit-thumb-row">
            ${kit.images
              .map(
                (img, idx) => `
              <button type="button" class="kit-thumb-btn ${idx === 0 ? "active" : ""}" data-img="${img}">
                <img src="${img}" alt="Thumb ${idx + 1}" />
              </button>
            `
              )
              .join("")}
          </div>
        </div>

        <div class="kit-modal-sidebar">
          <div class="kit-buy-box">
            <div class="kit-buy-pricing">
              <span class="kit-buy-price">${formatMoney(kit.priceGross)}</span>
              <span class="kit-buy-net">(${formatMoney(kit.priceNet)} s/ IVA a 23%)</span>
            </div>
            
            ${optionsHtml}

            <div class="kit-buy-actions">
              <div class="kit-qty-control">
                <button type="button" id="kitQtyMinus" class="qty-btn">-</button>
                <input type="number" id="kitQtyInput" value="1" min="1" max="${kit.stockQuantity}" readonly />
                <button type="button" id="kitQtyPlus" class="qty-btn">+</button>
              </div>
              <button type="button" id="kitAddToCartBtn" class="btn btn-primary btn-block">
                Adicionar ao Carrinho
              </button>
            </div>
            <p class="kit-guarantee-note">✓ Peça oficial Bandit Garage. Envio internacional com seguro e rastreio.</p>
          </div>

          <div class="kit-section-block">
            <h4>Modelos e Anos Compatíveis</h4>
            <div class="kit-compat-table">
              ${kit.compatibility
                .map(
                  (c) => `
                <div class="kit-compat-row">
                  <strong>${c.make} ${c.model}</strong>
                  <span>${c.years}</span>
                </div>
              `
                )
                .join("")}
            </div>
          </div>
        </div>
      </div>

      <div class="kit-modal-details-tabs">
        <div class="kit-section-block">
          <h3>Conteúdo Completo Incluído no Kit</h3>
          <ul class="kit-bullet-list">
            ${contentItems.map((item) => `<li>${item}</li>`).join("")}
          </ul>
        </div>

        <div class="kit-section-block">
          <h3>Características Técnicas</h3>
          <ul class="kit-bullet-list">
            ${techSpecs.map((spec) => `<li>${spec}</li>`).join("")}
          </ul>
        </div>
      </div>
    `;

    // Eventos de imagem galeria
    kitModalContent.querySelectorAll(".kit-thumb-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        kitModalContent.querySelectorAll(".kit-thumb-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const mainImg = document.getElementById("kitModalMainImg");
        if (mainImg) mainImg.src = btn.dataset.img;
      });
    });

    // Controlo de quantidade
    const qtyInput = document.getElementById("kitQtyInput");
    const qtyMinus = document.getElementById("kitQtyMinus");
    const qtyPlus = document.getElementById("kitQtyPlus");
    if (qtyMinus && qtyPlus && qtyInput) {
      qtyMinus.addEventListener("click", () => {
        let val = parseInt(qtyInput.value) || 1;
        if (val > 1) qtyInput.value = val - 1;
      });
      qtyPlus.addEventListener("click", () => {
        let val = parseInt(qtyInput.value) || 1;
        if (val < kit.stockQuantity) qtyInput.value = val + 1;
      });
    }

    // Botão Adicionar ao Carrinho
    const addBtn = document.getElementById("kitAddToCartBtn");
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        const qty = parseInt(qtyInput ? qtyInput.value : 1) || 1;
        const selectedOptions = {};
        kitModalContent.querySelectorAll(".kit-option-select").forEach((sel) => {
          selectedOptions[sel.dataset.optionId] = sel.value;
        });

        addToCart(kit, qty, selectedOptions);
        closeKitModal();
        openCartDrawer();
      });
    }

    kitModal.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function closeKitModal() {
    if (!kitModal) return;
    kitModal.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  // Funções do Carrinho
  function addToCart(kit, quantity, options) {
    const optionKey = Object.entries(options || {})
      .sort()
      .map(([k, v]) => `${k}:${v}`)
      .join("|");

    const existingIndex = cart.findIndex(
      (item) => item.kitId === kit.id && item.optionKey === optionKey
    );

    if (existingIndex >= 0) {
      cart[existingIndex].quantity += quantity;
    } else {
      cart.push({
        kitId: kit.id,
        ref: kit.ref,
        name: kit.name,
        priceGross: kit.priceGross,
        priceNet: kit.priceNet,
        vatRate: kit.vatRate,
        image: kit.images[0],
        quantity: quantity,
        options: options,
        optionKey: optionKey
      });
    }

    saveCart();
  }

  function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
  }

  function updateQuantity(index, newQty) {
    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }
    cart[index].quantity = newQty;
    saveCart();
  }

  function updateCartUI() {
    const totalCount = cart.reduce((acc, item) => acc + item.quantity, 0);
    cartCountBadges.forEach((badge) => {
      badge.textContent = String(totalCount);
      badge.style.display = totalCount > 0 ? "inline-flex" : "none";
    });

    if (!cartItemsList) return;

    if (cart.length === 0) {
      cartItemsList.innerHTML = `
        <div class="cart-empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          <p>O seu carrinho da Bandit Store está vazio.</p>
          <button type="button" class="btn btn-outline btn-small" id="closeEmptyCartBtn">Explorar Kits</button>
        </div>
      `;
      const btn = document.getElementById("closeEmptyCartBtn");
      if (btn) btn.addEventListener("click", closeCartDrawer);

      if (cartSubtotalEl) cartSubtotalEl.textContent = formatMoney(0);
      if (cartVatEl) cartVatEl.textContent = formatMoney(0);
      if (cartTotalEl) cartTotalEl.textContent = formatMoney(0);
      return;
    }

    let subtotalNet = 0;
    let totalGross = 0;

    cartItemsList.innerHTML = cart
      .map((item, index) => {
        const itemTotal = item.priceGross * item.quantity;
        const itemNetTotal = item.priceNet * item.quantity;
        subtotalNet += itemNetTotal;
        totalGross += itemTotal;

        const kitName = getLocalizedText(item.name);
        const optionsList = Object.entries(item.options || {})
          .map(([k, v]) => `<span>${k}: <b>${v}</b></span>`)
          .join(" · ");

        return `
        <div class="cart-item">
          <img src="${item.image}" alt="${kitName}" class="cart-item-img" />
          <div class="cart-item-info">
            <span class="cart-item-ref">${item.ref}</span>
            <strong class="cart-item-title">${kitName}</strong>
            ${optionsList ? `<div class="cart-item-options">${optionsList}</div>` : ""}
            <div class="cart-item-controls">
              <div class="cart-item-qty">
                <button type="button" class="cart-qty-btn decrease-cart-qty" data-index="${index}">-</button>
                <span>${item.quantity}</span>
                <button type="button" class="cart-qty-btn increase-cart-qty" data-index="${index}">+</button>
              </div>
              <span class="cart-item-price">${formatMoney(itemTotal)}</span>
            </div>
          </div>
          <button type="button" class="cart-item-remove" data-index="${index}" aria-label="Remover">×</button>
        </div>
      `;
      })
      .join("");

    const vatTotal = totalGross - subtotalNet;
    if (cartSubtotalEl) cartSubtotalEl.textContent = formatMoney(subtotalNet);
    if (cartVatEl) cartVatEl.textContent = formatMoney(vatTotal);
    if (cartTotalEl) cartTotalEl.textContent = formatMoney(totalGross);

    // Eventos nos itens do carrinho
    cartItemsList.querySelectorAll(".decrease-cart-qty").forEach((b) => {
      b.addEventListener("click", () => updateQuantity(parseInt(b.dataset.index), cart[parseInt(b.dataset.index)].quantity - 1));
    });
    cartItemsList.querySelectorAll(".increase-cart-qty").forEach((b) => {
      b.addEventListener("click", () => updateQuantity(parseInt(b.dataset.index), cart[parseInt(b.dataset.index)].quantity + 1));
    });
    cartItemsList.querySelectorAll(".cart-item-remove").forEach((b) => {
      b.addEventListener("click", () => removeFromCart(parseInt(b.dataset.index)));
    });
  }

  function openCartDrawer() {
    if (!cartDrawer || !cartOverlay) return;
    cartDrawer.classList.add("is-open");
    cartOverlay.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function closeCartDrawer() {
    if (!cartDrawer || !cartOverlay) return;
    cartDrawer.classList.remove("is-open");
    cartOverlay.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  // Checkout da Bandit Store
  function openCheckout() {
    if (cart.length === 0) return;
    closeCartDrawer();
    if (!checkoutModal) return;

    let totalGross = cart.reduce((acc, it) => acc + it.priceGross * it.quantity, 0);
    const checkoutTotalEl = document.getElementById("checkoutTotalDisplay");
    if (checkoutTotalEl) checkoutTotalEl.textContent = formatMoney(totalGross);

    checkoutModal.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function closeCheckout() {
    if (!checkoutModal) return;
    checkoutModal.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  // Submeter Encomenda da Store (Integração com BO)
  function handleCheckoutSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');

    const orderNumber = `BORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const formData = new FormData(form);

    const orderPayload = {
      orderId: orderNumber,
      orderType: "BANDIT_STORE_KIT_PURCHASE",
      customer: {
        name: formData.get("customer_name"),
        email: formData.get("customer_email"),
        phone: formData.get("customer_phone"),
        taxId: formData.get("customer_tax_id") || "N/A",
        address: formData.get("customer_address"),
        city: formData.get("customer_city"),
        postalCode: formData.get("customer_postal"),
        country: formData.get("customer_country")
      },
      items: cart.map((c) => ({
        kitId: c.kitId,
        ref: c.ref,
        name: getLocalizedText(c.name),
        quantity: c.quantity,
        unitPriceGross: c.priceGross,
        totalGross: c.priceGross * c.quantity,
        options: c.options
      })),
      totals: {
        totalGross: cart.reduce((acc, it) => acc + it.priceGross * it.quantity, 0),
        currency: "EUR",
        vatIncluded: true
      },
      paymentMethod: formData.get("payment_method") || "CREDIT_CARD",
      paymentStatus: "CONFIRMED", // Simulação imediata de autorização
      shippingStatus: "PENDING_DISPATCH",
      boStatus: "NEW_ORDER",
      createdAt: new Date().toISOString()
    };

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "A registar encomenda...";
    }

    // Gravação no log do BO (para leitura do Backoffice)
    try {
      const existingOrders = JSON.parse(localStorage.getItem("bandit_bo_orders") || "[]");
      existingOrders.unshift(orderPayload);
      localStorage.setItem("bandit_bo_orders", JSON.stringify(existingOrders));
    } catch (_err) {}

    // Limpar carrinho
    cart = [];
    saveCart();

    // Apresentar Ecrã de Confirmação da Encomenda
    const checkoutBody = document.getElementById("checkoutModalBody");
    if (checkoutBody) {
      checkoutBody.innerHTML = `
        <div class="checkout-success-box">
          <div class="success-icon">✓</div>
          <h2>Encomenda Confirmada com Sucesso</h2>
          <p class="order-id-highlight">Número da Encomenda: <strong>${orderNumber}</strong></p>
          <p class="order-notice">
            A sua encomenda deu entrada diretamente no sistema de expedição da Bandit Garage. 
            Enviámos uma cópia da confirmação e da fatura para <strong>${orderPayload.customer.email}</strong>.
          </p>
          <div class="order-summary-box">
            <h4>Resumo da Compra</h4>
            <p><strong>Total Pago (c/ IVA):</strong> ${formatMoney(orderPayload.totals.totalGross)}</p>
            <p><strong>Destino de Envio:</strong> ${orderPayload.customer.city}, ${orderPayload.customer.country}</p>
            <p><strong>Prazo Estimado de Envio:</strong> 3 a 5 dias úteis com código de rastreio</p>
          </div>
          <button type="button" class="btn btn-primary" id="finishStoreOrderBtn">
            Voltar à Bandit Store
          </button>
        </div>
      `;

      const finishBtn = document.getElementById("finishStoreOrderBtn");
      if (finishBtn) {
        finishBtn.addEventListener("click", () => {
          closeCheckout();
          window.location.hash = "#store";
        });
      }
    }
  }

  // Inicialização dos Eventos
  document.addEventListener("DOMContentLoaded", () => {
    renderStoreCatalog();
    updateCartUI();

    // Filtros de Categoria da Store
    document.querySelectorAll(".store-filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".store-filter-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        renderStoreCatalog(btn.dataset.filter);
      });
    });

    // Abrir/Fechar Carrinho
    const cartTrigger = document.getElementById("navStoreCartBtn");
    if (cartTrigger) cartTrigger.addEventListener("click", openCartDrawer);

    const closeCartBtn = document.getElementById("closeCartDrawerBtn");
    if (closeCartBtn) closeCartBtn.addEventListener("click", closeCartDrawer);
    if (cartOverlay) cartOverlay.addEventListener("click", closeCartDrawer);

    // Botão de Finalizar Compra
    const checkoutBtn = document.getElementById("storeCheckoutBtn");
    if (checkoutBtn) checkoutBtn.addEventListener("click", openCheckout);

    // Fechar Modais
    const closeKitModalBtn = document.getElementById("closeKitModalBtn");
    if (closeKitModalBtn) closeKitModalBtn.addEventListener("click", closeKitModal);

    const closeCheckoutBtn = document.getElementById("closeCheckoutModalBtn");
    if (closeCheckoutBtn) closeCheckoutBtn.addEventListener("click", closeCheckout);

    // Formulário de Checkout
    const checkoutForm = document.getElementById("storeCheckoutForm");
    if (checkoutForm) checkoutForm.addEventListener("submit", handleCheckoutSubmit);
  });

  // Exportar funções globais
  window.BanditStore = {
    render: renderStoreCatalog,
    openKit: openKitModal,
    openCart: openCartDrawer,
    closeCart: closeCartDrawer
  };
})();
