/**
 * Sistema de Gestão de Estoque — Loja Varejo
 * Aplicação Frontend em JavaScript Vanilla (ES6+)
 */

// Estado da Aplicação
const state = {
  products: [],
  selectedProduct: null,
  currentSearch: '',
  lowStockOnly: false,
  stats: {
    totalProducts: 0,
    totalStockUnits: 0,
    lowStockCount: 0,
    totalInventoryValue: 0
  }
};

// Elementos do DOM
const elements = {
  // Indicadores KPI
  kpiTotalProducts: document.getElementById('kpi-total-products'),
  kpiTotalUnits: document.getElementById('kpi-total-units'),
  kpiLowStock: document.getElementById('kpi-low-stock'),
  kpiTotalValue: document.getElementById('kpi-total-value'),
  
  // Barra de Ferramentas
  searchInput: document.getElementById('search-input'),
  btnClearSearch: document.getElementById('btn-clear-search'),
  filterLowStock: document.getElementById('filter-low-stock'),
  btnRefresh: document.getElementById('btn-refresh'),
  btnOpenCreateModal: document.getElementById('btn-open-create-modal'),
  
  // Tabela
  productTbody: document.getElementById('product-tbody'),
  productCountBadge: document.getElementById('product-count-badge'),
  
  // Modal de Produto
  productModal: document.getElementById('product-modal'),
  productModalTitle: document.getElementById('product-modal-title'),
  productForm: document.getElementById('product-form'),
  productFormId: document.getElementById('product-form-id'),
  productNameInput: document.getElementById('product-name-input'),
  productPriceInput: document.getElementById('product-price-input'),
  productQuantityInput: document.getElementById('product-quantity-input'),
  initialQuantityGroup: document.getElementById('initial-quantity-group'),
  btnSaveProduct: document.getElementById('btn-save-product'),
  
  // Modal de Movimentação de Estoque
  stockModal: document.getElementById('stock-modal'),
  stockModalTitle: document.getElementById('stock-modal-title'),
  stockForm: document.getElementById('stock-form'),
  stockFormProductId: document.getElementById('stock-form-product-id'),
  stockFormActionType: document.getElementById('stock-form-action-type'),
  stockModalProductName: document.getElementById('stock-modal-product-name'),
  stockModalCurrentQty: document.getElementById('stock-modal-current-qty'),
  stockQuantityLabel: document.getElementById('stock-quantity-label'),
  stockQuantityInput: document.getElementById('stock-quantity-input'),
  stockQuantityHelp: document.getElementById('stock-quantity-help'),
  stockReasonInput: document.getElementById('stock-reason-input'),
  stockPreview: document.getElementById('stock-preview'),
  stockPreviewNewQty: document.getElementById('stock-preview-new-qty'),
  btnSubmitStock: document.getElementById('btn-submit-stock'),

  // Modal de Histórico
  historyModal: document.getElementById('history-modal'),
  historyModalProductName: document.getElementById('history-modal-product-name'),
  historyTbody: document.getElementById('history-tbody'),

  // Container de Notificações Toast
  toastContainer: document.getElementById('toast-container')
};

// ================= TRADUÇÃO DE MENSAGENS DE ERRO =================
function translateErrorMessage(msg) {
  if (!msg) return 'Ocorreu um erro inesperado. Por favor, tente novamente.';

  if (msg.includes('Product name is required')) {
    return 'O nome do produto é obrigatório e não pode ficar vazio.';
  }
  if (msg.includes('Product name must not exceed')) {
    return 'O nome do produto não pode exceder 200 caracteres.';
  }
  if (msg.includes('Price must be a non-negative number')) {
    return 'O preço deve ser um valor numérico não negativo.';
  }
  if (msg.includes('Quantity must be a non-negative integer')) {
    return 'A quantidade deve ser um número inteiro não negativo.';
  }
  if (msg.includes('Quantity to add must be an integer greater than zero')) {
    return 'A quantidade a adicionar deve ser um número inteiro maior que zero.';
  }
  if (msg.includes('Quantity to remove must be an integer greater than zero')) {
    return 'A quantidade a remover deve ser um número inteiro maior que zero.';
  }
  if (msg.includes('Cannot remove') && msg.includes('available')) {
    const match = msg.match(/Cannot remove (\d+) units\. Only (\d+) units are currently available\./);
    if (match) {
      return `Não é possível remover ${match[1]} unidades. Apenas ${match[2]} unidades estão disponíveis no momento.`;
    }
    return 'Estoque insuficiente para esta operação.';
  }
  if (msg.includes('Product not found')) {
    return 'Produto não encontrado.';
  }
  return msg;
}

// ================= SERVIÇO DE API =================
const API = {
  async fetchProducts(filters = {}) {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.lowStockOnly) params.append('lowStockOnly', 'true');

    const res = await fetch(`/api/products?${params.toString()}`);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(translateErrorMessage(errorData.error));
    }
    return res.json();
  },

  async fetchDashboardStats() {
    const res = await fetch('/api/dashboard/stats');
    if (!res.ok) {
      throw new Error('Falha ao carregar indicadores do painel');
    }
    return res.json();
  },

  async createProduct(productData) {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(translateErrorMessage(data.error));
    }
    return data;
  },

  async updateProduct(id, updateData) {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(translateErrorMessage(data.error));
    }
    return data;
  },

  async deleteProduct(id) {
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(translateErrorMessage(data.error));
    }
    return data;
  },

  async addStock(id, quantity, reason) {
    const res = await fetch(`/api/products/${id}/stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity, reason })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(translateErrorMessage(data.error));
    }
    return data;
  },

  async removeStock(id, quantity, reason) {
    const res = await fetch(`/api/products/${id}/stock/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity, reason })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(translateErrorMessage(data.error));
    }
    return data;
  },

  async fetchMovements(id) {
    const res = await fetch(`/api/products/${id}/movements`);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(translateErrorMessage(data.error));
    }
    return res.json();
  }
};

// ================= SISTEMA DE TOASTS =================
function showToast(message, type = 'info', duration = 4000) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const content = document.createElement('div');
  content.className = 'toast-content';
  content.textContent = message;
  
  const closeBtn = document.createElement('button');
  closeBtn.className = 'toast-close';
  closeBtn.innerHTML = '&times;';
  closeBtn.title = 'Fechar';
  closeBtn.addEventListener('click', () => toast.remove());
  
  toast.appendChild(content);
  toast.appendChild(closeBtn);
  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'opacity 0.25s, transform 0.25s';
    setTimeout(() => toast.remove(), 250);
  }, duration);
}

// ================= RENDERIZAÇÃO DA INTERFACE =================
function formatCurrency(amount) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(amount);
}

function updateDashboardKPIs(stats) {
  elements.kpiTotalProducts.textContent = stats.totalProducts;
  elements.kpiTotalUnits.textContent = stats.totalStockUnits;
  elements.kpiLowStock.textContent = stats.lowStockCount;
  elements.kpiTotalValue.textContent = formatCurrency(stats.totalInventoryValue);
}

function renderProductsTable(products) {
  elements.productCountBadge.textContent = `${products.length} ${products.length === 1 ? 'item' : 'itens'}`;

  if (!products || products.length === 0) {
    elements.productTbody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          Nenhum produto cadastrado. Clique em "Novo Produto" acima para cadastrar.
        </td>
      </tr>
    `;
    return;
  }

  elements.productTbody.innerHTML = products.map((product) => {
    const badgeClass = product.isLowStock ? 'badge-low-stock' : 'badge-in-stock';
    const badgeLabel = product.isLowStock ? 'Estoque Baixo' : 'Em Estoque';

    return `
      <tr data-id="${product.id}">
        <td><strong>#${product.id}</strong></td>
        <td>
          <div style="font-weight: 600; color: var(--neutral-900);">${escapeHtml(product.name)}</div>
        </td>
        <td>${formatCurrency(product.price)}</td>
        <td>
          <span class="badge ${badgeClass}">
            <span class="badge-dot"></span>
            ${badgeLabel}
          </span>
        </td>
        <td>
          <span class="stock-value">${product.quantity}</span>
        </td>
        <td style="text-align: right;">
          <div class="action-buttons">
            <button class="btn btn-success btn-sm btn-action-add" data-id="${product.id}" title="Adicionar entrada de estoque">
              + Entrada
            </button>
            <button class="btn btn-danger btn-sm btn-action-remove" data-id="${product.id}" title="Registrar saída de estoque">
              - Saída
            </button>
            <button class="btn btn-secondary btn-sm btn-action-edit" data-id="${product.id}" title="Editar produto">
              Editar
            </button>
            <button class="btn btn-secondary btn-sm btn-action-history" data-id="${product.id}" title="Ver auditoria de movimentações">
              Histórico
            </button>
            <button class="btn btn-secondary btn-sm btn-action-delete" data-id="${product.id}" title="Excluir produto" style="color: var(--danger);">
              &times;
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[m]));
}

// ================= CONTROLES DE MODAIS =================
function openModal(modal) {
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal(modal) {
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(closeModal);
}

// ================= FLUXOS DE EVENTOS =================

// Carregar e Atualizar Dados
async function refreshData() {
  try {
    const [products, stats] = await Promise.all([
      API.fetchProducts({
        search: state.currentSearch,
        lowStockOnly: state.lowStockOnly
      }),
      API.fetchDashboardStats()
    ]);

    state.products = products;
    state.stats = stats;

    renderProductsTable(products);
    updateDashboardKPIs(stats);
  } catch (err) {
    showToast(err.message || 'Erro ao carregar dados do estoque.', 'error');
  }
}

// Abrir Modal de Criação de Produto
function openCreateProductModal() {
  elements.productModalTitle.textContent = 'Cadastrar Novo Produto';
  elements.productForm.reset();
  elements.productFormId.value = '';
  elements.initialQuantityGroup.style.display = 'block';
  elements.productQuantityInput.required = true;
  openModal(elements.productModal);
  elements.productNameInput.focus();
}

// Abrir Modal de Edição de Produto
function openEditProductModal(productId) {
  const product = state.products.find((p) => p.id === productId);
  if (!product) return;

  elements.productModalTitle.textContent = `Editar Produto: ${product.name}`;
  elements.productFormId.value = product.id;
  elements.productNameInput.value = product.name;
  elements.productPriceInput.value = product.price.toFixed(2);
  elements.initialQuantityGroup.style.display = 'none';
  elements.productQuantityInput.required = false;

  openModal(elements.productModal);
  elements.productNameInput.focus();
}

// Submissão do Formulário de Produto
elements.productForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = elements.productFormId.value;
  const name = elements.productNameInput.value.trim();
  const price = parseFloat(elements.productPriceInput.value);

  if (!name) {
    showToast('O nome do produto é obrigatório.', 'warning');
    return;
  }
  if (isNaN(price) || price < 0) {
    showToast('O preço deve ser um valor válido não negativo.', 'warning');
    return;
  }

  try {
    if (id) {
      await API.updateProduct(id, { name, price });
      showToast(`Produto "${name}" atualizado com sucesso!`, 'success');
    } else {
      const quantity = parseInt(elements.productQuantityInput.value, 10);
      if (isNaN(quantity) || quantity < 0) {
        showToast('A quantidade inicial deve ser um número inteiro não negativo.', 'warning');
        return;
      }
      await API.createProduct({ name, price, quantity });
      showToast(`Produto "${name}" cadastrado com sucesso!`, 'success');
    }

    closeModal(elements.productModal);
    await refreshData();
  } catch (err) {
    showToast(err.message, 'error');
  }
});

// Excluir Produto
async function handleDeleteProduct(productId) {
  const product = state.products.find((p) => p.id === productId);
  if (!product) return;

  const confirmed = window.confirm(`Tem certeza de que deseja excluir o produto "${product.name}"? Esta ação não pode ser desfeita.`);
  if (!confirmed) return;

  try {
    await API.deleteProduct(productId);
    showToast(`Produto "${product.name}" excluído com sucesso.`, 'success');
    await refreshData();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Abrir Modal de Entrada / Saída de Estoque
async function openStockModal(productId, actionType) {
  let product = state.products.find((p) => Number(p.id) === Number(productId));
  if (!product) {
    try {
      const res = await fetch(`/api/products/${productId}`);
      if (res.ok) product = await res.json();
    } catch (e) {
      console.error(e);
    }
  }
  if (!product) {
    showToast('Produto não encontrado.', 'error');
    return;
  }

  state.selectedProduct = product;
  elements.stockFormProductId.value = product.id;
  elements.stockFormActionType.value = actionType;
  elements.stockModalProductName.textContent = product.name;
  elements.stockModalCurrentQty.textContent = `${product.quantity} unidades`;
  elements.stockReasonInput.value = '';
  elements.stockQuantityInput.value = '';
  elements.stockPreview.style.display = 'none';

  if (actionType === 'add') {
    elements.stockModalTitle.textContent = `Entrada de Estoque — ${product.name}`;
    elements.stockQuantityLabel.innerHTML = 'Quantidade a Adicionar <span class="required">*</span>';
    if (elements.stockQuantityHelp) {
      elements.stockQuantityHelp.textContent = 'Informe um número inteiro positivo para a entrada.';
    }
    elements.stockQuantityInput.removeAttribute('max');
    elements.btnSubmitStock.textContent = 'Confirmar Entrada';
    elements.btnSubmitStock.className = 'btn btn-primary';
  } else {
    elements.stockModalTitle.textContent = `Saída de Estoque — ${product.name}`;
    elements.stockQuantityLabel.innerHTML = `Quantidade a Remover (Máx: ${product.quantity}) <span class="required">*</span>`;
    if (elements.stockQuantityHelp) {
      elements.stockQuantityHelp.textContent = `Não é possível remover mais do que o estoque disponível (${product.quantity} unidades).`;
    }
    elements.stockQuantityInput.setAttribute('max', String(product.quantity));
    elements.btnSubmitStock.textContent = 'Confirmar Saída';
    elements.btnSubmitStock.className = 'btn btn-danger';
  }

  openModal(elements.stockModal);
  setTimeout(() => elements.stockQuantityInput?.focus(), 50);
}

// Cálculo Dinâmico de Prévia de Estoque
elements.stockQuantityInput.addEventListener('input', () => {
  const qty = parseInt(elements.stockQuantityInput.value, 10);
  if (isNaN(qty) || qty <= 0 || !state.selectedProduct) {
    elements.stockPreview.style.display = 'none';
    return;
  }

  const current = state.selectedProduct.quantity;
  const actionType = elements.stockFormActionType.value;

  if (actionType === 'add') {
    const newQty = current + qty;
    elements.stockPreviewNewQty.textContent = `${newQty} unidades (${current} + ${qty})`;
    elements.stockPreview.style.display = 'block';
  } else {
    const newQty = current - qty;
    if (newQty < 0) {
      elements.stockPreviewNewQty.textContent = `Erro: Estoque insuficiente (não pode ficar negativo)`;
      elements.stockPreview.style.display = 'block';
    } else {
      elements.stockPreviewNewQty.textContent = `${newQty} unidades (${current} - ${qty})`;
      elements.stockPreview.style.display = 'block';
    }
  }
});

// Submissão de Ajuste de Estoque
elements.stockForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const productId = parseInt(elements.stockFormProductId.value, 10);
  const actionType = elements.stockFormActionType.value;
  const quantity = parseInt(elements.stockQuantityInput.value, 10);
  const reason = elements.stockReasonInput.value.trim();

  if (isNaN(quantity) || quantity <= 0) {
    showToast('A quantidade deve ser maior que zero.', 'warning');
    return;
  }

  try {
    let response;
    if (actionType === 'add') {
      response = await API.addStock(productId, quantity, reason);
      showToast(`${quantity} unidades adicionadas com sucesso a ${response.name}. Estoque atual: ${response.quantity}.`, 'success');
    } else {
      response = await API.removeStock(productId, quantity, reason);
      showToast(`${quantity} unidades removidas com sucesso de ${response.name}. Estoque atual: ${response.quantity}.`, 'success');
    }

    closeModal(elements.stockModal);
    await refreshData();
  } catch (err) {
    showToast(err.message, 'error');
  }
});

// Abrir Modal de Auditoria e Histórico
async function openHistoryModal(productId) {
  const product = state.products.find((p) => p.id === productId);
  if (!product) return;

  elements.historyModalProductName.textContent = `Auditoria de: ${product.name} (Estoque atual: ${product.quantity} unidades)`;
  elements.historyTbody.innerHTML = '<tr><td colspan="5" class="empty-state">Carregando histórico...</td></tr>';
  openModal(elements.historyModal);

  try {
    const movements = await API.fetchMovements(productId);
    if (!movements || movements.length === 0) {
      elements.historyTbody.innerHTML = '<tr><td colspan="5" class="empty-state">Nenhuma movimentação registrada.</td></tr>';
      return;
    }

    elements.historyTbody.innerHTML = movements.map((m) => {
      let typeBadge = '';
      let changeText = '';
      if (m.type === 'INITIAL') {
        typeBadge = '<span class="badge" style="background:#e0f2fe; color:#0369a1;">INICIAL</span>';
        changeText = `+${m.quantity}`;
      } else if (m.type === 'ADD') {
        typeBadge = '<span class="badge badge-in-stock">ENTRADA</span>';
        changeText = `<span style="color:var(--success); font-weight:600;">+${m.quantity}</span>`;
      } else {
        typeBadge = '<span class="badge badge-low-stock">SAÍDA</span>';
        changeText = `<span style="color:var(--danger); font-weight:600;">-${m.quantity}</span>`;
      }

      const formattedDate = new Date(m.createdAt).toLocaleString('pt-BR');

      return `
        <tr>
          <td><small>${formattedDate}</small></td>
          <td>${typeBadge}</td>
          <td>${changeText}</td>
          <td>${m.previousQuantity} &rarr; <strong>${m.newQuantity}</strong></td>
          <td><small>${m.reason ? escapeHtml(m.reason) : '<em>Sem observação informada</em>'}</small></td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    elements.historyTbody.innerHTML = `<tr><td colspan="5" class="empty-state" style="color:var(--danger);">${err.message}</td></tr>`;
  }
}

// Delegação de Eventos na Tabela
elements.productTbody.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;

  const id = parseInt(btn.getAttribute('data-id'), 10);
  if (!id) return;

  if (btn.classList.contains('btn-action-add')) {
    openStockModal(id, 'add');
  } else if (btn.classList.contains('btn-action-remove')) {
    openStockModal(id, 'remove');
  } else if (btn.classList.contains('btn-action-edit')) {
    openEditProductModal(id);
  } else if (btn.classList.contains('btn-action-history')) {
    openHistoryModal(id);
  } else if (btn.classList.contains('btn-action-delete')) {
    handleDeleteProduct(id);
  }
});

// Fechar modais ao clicar no botão fechar ou fora da caixa
document.addEventListener('click', (e) => {
  const closeBtn = e.target.closest('[data-close]');
  if (closeBtn) {
    const modalId = closeBtn.getAttribute('data-close');
    const modal = document.getElementById(modalId);
    if (modal) closeModal(modal);
  }

  if (e.target.classList.contains('modal-overlay')) {
    closeModal(e.target);
  }
});

// Tecla ESC fecha modais
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeAllModals();
  }
});

// Busca com debounce de 300ms
let searchDebounceTimer = null;
elements.searchInput.addEventListener('input', (e) => {
  const query = e.target.value;
  state.currentSearch = query;
  elements.btnClearSearch.style.display = query ? 'block' : 'none';

  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    refreshData();
  }, 300);
});

elements.btnClearSearch.addEventListener('click', () => {
  elements.searchInput.value = '';
  state.currentSearch = '';
  elements.btnClearSearch.style.display = 'none';
  refreshData();
});

// Filtro de estoque baixo
elements.filterLowStock.addEventListener('change', (e) => {
  state.lowStockOnly = e.target.checked;
  refreshData();
});

// Botões do Cabeçalho
elements.btnOpenCreateModal.addEventListener('click', openCreateProductModal);
elements.btnRefresh.addEventListener('click', () => {
  refreshData();
  showToast('Estoque atualizado.', 'info', 2000);
});

// Inicialização da Página
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', refreshData);
} else {
  refreshData();
}
