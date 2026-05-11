const API = '';
let token = localStorage.getItem('admin_token');
let allProducts = [];
let allBrands = [];
let allCategories = [];
let editingId = null;
let editingBrandId = null;
let editingCatId = null;
let pendingDeleteId = null;
let pendingDeleteType = null;
let currentPhotos = [];
let currentColors = [];

const COLOR_PALETTE = [
  { name: 'Noir',           hex: '#111111' },
  { name: 'Gris anthracite',hex: '#4a4a4a' },
  { name: 'Gris',           hex: '#888888' },
  { name: 'Gris clair',     hex: '#cccccc' },
  { name: 'Blanc',          hex: '#f0f0f0' },
  { name: 'Rouge',          hex: '#cc0000' },
  { name: 'Bordeaux',       hex: '#800020' },
  { name: 'Orange',         hex: '#ff6600' },
  { name: 'Jaune',          hex: '#ffc200' },
  { name: 'Vert',           hex: '#228b22' },
  { name: 'Vert olive',     hex: '#6b7c37' },
  { name: 'Bleu marine',    hex: '#001f5b' },
  { name: 'Bleu roi',       hex: '#0044cc' },
  { name: 'Bleu ciel',      hex: '#00adef' },
  { name: 'Violet',         hex: '#6a0dad' },
  { name: 'Rose',           hex: '#e75480' },
  { name: 'Beige',          hex: '#d4b483' },
  { name: 'Marron',         hex: '#8b4513' },
  { name: 'Kaki',           hex: '#8b7355' },
  { name: 'Or',             hex: '#d4a017' },
];

// ── AUTH ──
async function login() {
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');
  errEl.textContent = '';
  try {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error || 'Mot de passe incorrect'; return; }
    token = data.token;
    localStorage.setItem('admin_token', token);
    showApp();
  } catch {
    errEl.textContent = 'Erreur de connexion au serveur';
  }
}

document.getElementById('login-password').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') login();
});

function logout() {
  localStorage.removeItem('admin_token');
  token = null;
  document.getElementById('app').classList.remove('visible');
  document.getElementById('login-screen').style.display = 'flex';
}

async function checkAuth() {
  if (!token) return;
  const res = await fetch(`${API}/api/products`);
  if (res.ok) showApp();
}

function showApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').classList.add('visible');
  loadBrands();
  loadCategories();
  loadProducts();
  showSection('products');
}

// ── SIDEBAR MOBILE ──
function toggleSidebar() {
  document.querySelector('.sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('visible');
}

function closeSidebar() {
  document.querySelector('.sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('visible');
}

// ── NAVIGATION ──
function showSection(name) {
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const navItem = document.querySelector(`.nav-item[data-section="${name}"]`);
  if (navItem) navItem.classList.add('active');

  document.getElementById('products-section').style.display = name === 'products' ? '' : 'none';
  document.getElementById('brands-section').style.display = name === 'brands' ? '' : 'none';
  document.getElementById('categories-section').style.display = name === 'categories' ? '' : 'none';

  document.getElementById('btn-add-product').style.display = name === 'products' ? '' : 'none';
  document.getElementById('btn-add-brand').style.display = name === 'brands' ? '' : 'none';
  document.getElementById('btn-add-cat').style.display = name === 'categories' ? '' : 'none';

  const titles = { products: 'Produits', brands: 'Marques', categories: 'Catégories' };
  document.getElementById('section-title').textContent = titles[name] || name;

  closeSidebar(); // fermer le menu sur mobile après navigation
}

// ── PRODUCTS ──
async function loadProducts() {
  try {
    const res = await fetch(`${API}/api/products`);
    allProducts = await res.json();
    renderStats();
    renderProducts(allProducts);
    // Mettre à jour les compteurs dans les sections Marques et Catégories
    renderBrands();
    renderCategories();
  } catch {
    showToast('Erreur de chargement des produits', 'error');
  }
}

function renderStats() {
  const statsGrid = document.getElementById('stats-grid');
  if (!statsGrid) return;
  let html = `<div class="stat-card"><div class="stat-label">Total produits</div><div class="stat-value">${allProducts.length}</div></div>`;
  allBrands.forEach(b => {
    const count = allProducts.filter(p => p.brand === b.name).length;
    html += `<div class="stat-card"><div class="stat-label">${b.name}</div><div class="stat-value">${count}</div></div>`;
  });
  statsGrid.innerHTML = html;
}

function filterProducts() {
  const q = document.getElementById('search-input').value.toLowerCase();
  const brand = document.getElementById('brand-filter').value;
  const cat = document.getElementById('cat-filter').value;
  const filtered = allProducts.filter(p => {
    const matchQ = !q || p.name.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q);
    const matchBrand = !brand || p.brand === brand;
    const matchCat = !cat || (Array.isArray(p.category) ? p.category.includes(cat) : (p.category || '').includes(cat));
    return matchQ && matchBrand && matchCat;
  });
  renderProducts(filtered);
}

function renderProducts(products) {
  const list = document.getElementById('products-list');
  if (!products.length) {
    list.innerHTML = '<div class="loading">Aucun produit trouvé</div>';
    return;
  }
  list.innerHTML = products.map(p => {
    const images = Array.isArray(p.images) ? p.images : (JSON.parse(p.images || '[]'));
    const thumb = images[0];
    const thumbHtml = thumb
      ? `<div class="product-thumb"><img src="${thumb}" alt="" onerror="this.parentElement.textContent='👕'"></div>`
      : `<div class="product-thumb">👕</div>`;
    const price = (p.price || 0).toLocaleString('fr-FR') + ' FCFA';
    return `
      <div class="table-row">
        ${thumbHtml}
        <div class="product-info">
          <div class="product-name">${p.name}</div>
          <div class="product-sku">${p.sku || ''}</div>
        </div>
        <div>${p.brand || '–'}</div>
        <div class="price">${price}</div>
        <div class="row-actions">
          <button class="btn btn-outline btn-sm" onclick="openProductModal(${p.id})">✏️ Modifier</button>
          <button class="btn btn-danger btn-sm" onclick="askDelete(${p.id},'product')">🗑️</button>
        </div>
      </div>`;
  }).join('');
}

// ── PRODUCT MODAL ──
function openProductModal(id = null) {
  editingId = id;
  currentPhotos = [];
  currentColors = [];
  document.getElementById('photos-preview').innerHTML = '';
  document.getElementById('upload-status').textContent = '';
  document.getElementById('modal-title').textContent = id ? 'Modifier le produit' : 'Ajouter un produit';

  populateBrandSelect();
  populateCatSelect();

  if (id) {
    const p = allProducts.find(x => x.id === id);
    if (!p) return;
    const images = Array.isArray(p.images) ? p.images : JSON.parse(p.images || '[]');
    const sizes = Array.isArray(p.sizes) ? p.sizes : JSON.parse(p.sizes || '[]');
    const colors = Array.isArray(p.colors) ? p.colors : JSON.parse(p.colors || '[]');
    const category = Array.isArray(p.category) ? p.category : JSON.parse(p.category || '[]');

    document.getElementById('f-name').value = p.name || '';
    document.getElementById('f-sku').value = p.sku || '';
    document.getElementById('f-brand').value = p.brand || '';
    document.getElementById('f-price').value = p.price || '';
    document.getElementById('f-sizes').value = sizes.join(', ');
    document.getElementById('f-fabric').value = p.fabric || '';
    document.getElementById('f-desc').value = p.description || '';

    const catSlugs = allCategories.map(c => c.slug);
    const mainCat = catSlugs.find(s => category.includes(s)) || catSlugs[0] || '';
    document.getElementById('f-category').value = mainCat;

    currentColors = [...colors];
    currentPhotos = images.map(url => ({ url, public_id: null }));
    renderPhotosPreview();
  } else {
    document.getElementById('f-name').value = '';
    document.getElementById('f-sku').value = '';
    document.getElementById('f-brand').value = '';
    document.getElementById('f-price').value = '';
    document.getElementById('f-sizes').value = '';
    document.getElementById('f-fabric').value = '';
    document.getElementById('f-desc').value = '';
  }

  renderColorPicker();
  document.getElementById('product-modal').classList.add('open');
}

function closeProductModal() {
  document.getElementById('product-modal').classList.remove('open');
  editingId = null;
}

async function saveProduct() {
  const name = document.getElementById('f-name').value.trim();
  if (!name) { showToast('Le nom est requis', 'error'); return; }

  const brand = document.getElementById('f-brand').value;
  const mainCat = document.getElementById('f-category').value;
  const brandObj = allBrands.find(b => b.name === brand);
  const brandSlug = brandObj ? brandObj.slug : (brand || '').toLowerCase().replace(/\s+/g, '-');
  const category = [mainCat, brandSlug].filter(Boolean);

  const sizes = document.getElementById('f-sizes').value.split(',').map(s => s.trim()).filter(Boolean);
  const images = currentPhotos.map(p => p.url);

  const body = {
    name,
    brand,
    category,
    price: parseInt(document.getElementById('f-price').value) || 0,
    sizes,
    colors: currentColors,
    fabric: document.getElementById('f-fabric').value.trim(),
    description: document.getElementById('f-desc').value.trim(),
    images,
  };
  // Pour une modification, on conserve le SKU existant
  if (editingId) body.sku = document.getElementById('f-sku').value.trim();

  const btn = document.getElementById('save-btn');
  btn.disabled = true; btn.textContent = 'Enregistrement...';

  try {
    const url = editingId ? `${API}/api/products/${editingId}` : `${API}/api/products`;
    const method = editingId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) { showToast(data.error || 'Erreur', 'error'); return; }
    showToast(editingId ? 'Produit mis à jour !' : 'Produit ajouté !', 'success');
    closeProductModal();
    await loadProducts();
  } catch {
    showToast('Erreur serveur', 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Enregistrer';
  }
}

// ── COLOR PICKER ──
function renderColorPicker() {
  const palette = document.getElementById('color-palette');
  const selected = document.getElementById('selected-colors');
  if (!palette || !selected) return;

  palette.innerHTML = COLOR_PALETTE.map(c => `
    <div class="palette-swatch${currentColors.includes(c.hex) ? ' selected' : ''}"
      style="background:${c.hex}"
      title="${c.name}"
      onclick="toggleColor('${c.hex}')"></div>`
  ).join('');

  if (!currentColors.length) {
    selected.innerHTML = '<span class="no-color-msg">Aucune couleur sélectionnée</span>';
    return;
  }
  selected.innerHTML = currentColors.map((hex, i) => {
    const def = COLOR_PALETTE.find(c => c.hex === hex);
    const name = def ? def.name : hex;
    return `<div class="color-chip">
      <div class="color-chip-dot" style="background:${hex}"></div>
      ${name}
      <button class="color-chip-remove" onclick="removeColor(${i})">✕</button>
    </div>`;
  }).join('');
}

function toggleColor(hex) {
  const idx = currentColors.indexOf(hex);
  if (idx === -1) currentColors.push(hex);
  else currentColors.splice(idx, 1);
  renderColorPicker();
}

function removeColor(index) {
  currentColors.splice(index, 1);
  renderColorPicker();
}

function populateBrandSelect() {
  const sel = document.getElementById('f-brand');
  const current = sel.value;
  sel.innerHTML = '<option value="">Choisir...</option>' +
    allBrands.map(b => `<option value="${b.name}">${b.name}</option>`).join('');
  if (current) sel.value = current;
}

function populateCatSelect() {
  const sel = document.getElementById('f-category');
  const current = sel.value;
  sel.innerHTML = allCategories.map(c => `<option value="${c.slug}">${c.name}</option>`).join('');
  if (current) sel.value = current;
}

function populateFilterSelects() {
  const brandFilter = document.getElementById('brand-filter');
  const brandVal = brandFilter.value;
  brandFilter.innerHTML = '<option value="">Toutes les marques</option>' +
    allBrands.map(b => `<option value="${b.name}">${b.name}</option>`).join('');
  brandFilter.value = brandVal;

  const catFilter = document.getElementById('cat-filter');
  const catVal = catFilter.value;
  catFilter.innerHTML = '<option value="">Toutes catégories</option>' +
    allCategories.map(c => `<option value="${c.slug}">${c.name}</option>`).join('');
  catFilter.value = catVal;
}

// ── UPLOAD ──
function dragover(e) {
  e.preventDefault();
  document.getElementById('upload-zone').classList.add('dragover');
}
function drop(e) {
  e.preventDefault();
  document.getElementById('upload-zone').classList.remove('dragover');
  handleFiles(e.dataTransfer.files);
}

async function handleFiles(files) {
  if (!files || !files.length) return;
  const remaining = 5 - currentPhotos.length;
  if (remaining <= 0) { showToast('Maximum 5 photos par produit', 'error'); return; }

  const toUpload = Array.from(files).slice(0, remaining);
  document.getElementById('upload-status').textContent = `Upload en cours (${toUpload.length} photo${toUpload.length > 1 ? 's' : ''})...`;

  const form = new FormData();
  toUpload.forEach(f => form.append('photos', f));

  try {
    const res = await fetch(`${API}/api/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const data = await res.json();
    if (!res.ok) { showToast(data.error || 'Erreur upload', 'error'); return; }
    currentPhotos.push(...data.urls);
    renderPhotosPreview();
    document.getElementById('upload-status').textContent = `${currentPhotos.length} photo${currentPhotos.length > 1 ? 's' : ''} chargée${currentPhotos.length > 1 ? 's' : ''}`;
  } catch {
    showToast('Erreur upload', 'error');
    document.getElementById('upload-status').textContent = '';
  }
}

function renderPhotosPreview() {
  const preview = document.getElementById('photos-preview');
  preview.innerHTML = currentPhotos.map((p, i) => `
    <div class="photo-item">
      <img src="${p.url}" alt="photo ${i + 1}">
      <button class="photo-remove" onclick="removePhoto(${i})">✕</button>
    </div>`).join('');
}

async function removePhoto(index) {
  const photo = currentPhotos[index];
  if (photo.public_id) {
    try {
      await fetch(`${API}/api/upload`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ public_id: photo.public_id }),
      });
    } catch {}
  }
  currentPhotos.splice(index, 1);
  renderPhotosPreview();
  document.getElementById('upload-status').textContent = currentPhotos.length
    ? `${currentPhotos.length} photo${currentPhotos.length > 1 ? 's' : ''}`
    : '';
}

// ── BRANDS ──
async function loadBrands() {
  try {
    const res = await fetch(`${API}/api/brands`);
    allBrands = await res.json();
    renderBrands();
    populateFilterSelects();
    renderStats();
  } catch {
    showToast('Erreur chargement des marques', 'error');
  }
}

function renderBrands() {
  const list = document.getElementById('brands-list');
  if (!allBrands.length) {
    list.innerHTML = '<div class="loading">Aucune marque</div>';
    return;
  }
  list.innerHTML = allBrands.map(b => {
    const count = allProducts.filter(p => p.brand === b.name).length;
    return `
      <div class="table-row">
        <div class="product-info">
          <div class="product-name">${b.name}</div>
          <div class="product-sku">${b.slug}</div>
        </div>
        <div>${count} produit${count !== 1 ? 's' : ''}</div>
        <div class="row-actions">
          <button class="btn btn-outline btn-sm" onclick="openBrandModal(${b.id})">✏️ Modifier</button>
          <button class="btn btn-danger btn-sm" onclick="askDelete(${b.id},'brand')">🗑️</button>
        </div>
      </div>`;
  }).join('');
}

function openBrandModal(id = null) {
  editingBrandId = id;
  document.getElementById('brand-modal-title').textContent = id ? 'Modifier la marque' : 'Ajouter une marque';
  if (id) {
    const b = allBrands.find(x => x.id === id);
    if (!b) return;
    document.getElementById('b-name').value = b.name;
    document.getElementById('b-slug').value = b.slug;
  } else {
    document.getElementById('b-name').value = '';
    document.getElementById('b-slug').value = '';
  }
  document.getElementById('brand-modal').classList.add('open');
}

function closeBrandModal() {
  document.getElementById('brand-modal').classList.remove('open');
  editingBrandId = null;
}

async function saveBrand() {
  const name = document.getElementById('b-name').value.trim();
  const slug = document.getElementById('b-slug').value.trim();
  if (!name || !slug) { showToast('Nom et slug requis', 'error'); return; }

  const btn = document.getElementById('save-brand-btn');
  btn.disabled = true; btn.textContent = 'Enregistrement...';

  try {
    const url = editingBrandId ? `${API}/api/brands/${editingBrandId}` : `${API}/api/brands`;
    const method = editingBrandId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, slug }),
    });
    const data = await res.json();
    if (!res.ok) { showToast(data.error || 'Erreur', 'error'); return; }
    showToast(editingBrandId ? 'Marque mise à jour !' : 'Marque ajoutée !', 'success');
    closeBrandModal();
    await loadBrands();
  } catch {
    showToast('Erreur serveur', 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Enregistrer';
  }
}

// ── CATEGORIES ──
async function loadCategories() {
  try {
    const res = await fetch(`${API}/api/categories`);
    allCategories = await res.json();
    renderCategories();
    populateFilterSelects();
  } catch {
    showToast('Erreur chargement des catégories', 'error');
  }
}

function renderCategories() {
  const list = document.getElementById('categories-list');
  if (!allCategories.length) {
    list.innerHTML = '<div class="loading">Aucune catégorie</div>';
    return;
  }
  list.innerHTML = allCategories.map(c => {
    const count = allProducts.filter(p =>
      Array.isArray(p.category) ? p.category.includes(c.slug) : (p.category || '').includes(c.slug)
    ).length;
    return `
      <div class="table-row">
        <div class="product-info">
          <div class="product-name">${c.name}</div>
          <div class="product-sku">${c.slug}</div>
        </div>
        <div>${count} produit${count !== 1 ? 's' : ''}</div>
        <div class="row-actions">
          <button class="btn btn-outline btn-sm" onclick="openCatModal(${c.id})">✏️ Modifier</button>
          <button class="btn btn-danger btn-sm" onclick="askDelete(${c.id},'category')">🗑️</button>
        </div>
      </div>`;
  }).join('');
}

function openCatModal(id = null) {
  editingCatId = id;
  document.getElementById('cat-modal-title').textContent = id ? 'Modifier la catégorie' : 'Ajouter une catégorie';
  if (id) {
    const c = allCategories.find(x => x.id === id);
    if (!c) return;
    document.getElementById('c-name').value = c.name;
    document.getElementById('c-slug').value = c.slug;
  } else {
    document.getElementById('c-name').value = '';
    document.getElementById('c-slug').value = '';
  }
  document.getElementById('cat-modal').classList.add('open');
}

function closeCatModal() {
  document.getElementById('cat-modal').classList.remove('open');
  editingCatId = null;
}

async function saveCat() {
  const name = document.getElementById('c-name').value.trim();
  const slug = document.getElementById('c-slug').value.trim();
  if (!name || !slug) { showToast('Nom et slug requis', 'error'); return; }

  const btn = document.getElementById('save-cat-btn');
  btn.disabled = true; btn.textContent = 'Enregistrement...';

  try {
    const url = editingCatId ? `${API}/api/categories/${editingCatId}` : `${API}/api/categories`;
    const method = editingCatId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, slug }),
    });
    const data = await res.json();
    if (!res.ok) { showToast(data.error || 'Erreur', 'error'); return; }
    showToast(editingCatId ? 'Catégorie mise à jour !' : 'Catégorie ajoutée !', 'success');
    closeCatModal();
    await loadCategories();
  } catch {
    showToast('Erreur serveur', 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Enregistrer';
  }
}

// ── SLUG HELPER ──
function autoSlug(nameId, slugId) {
  const val = document.getElementById(nameId).value;
  document.getElementById(slugId).value = val
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

// ── DELETE (shared) ──
function askDelete(id, type) {
  pendingDeleteId = id;
  pendingDeleteType = type;
  const labels = {
    product: ['Supprimer le produit ?', 'Le produit sera définitivement supprimé du site.'],
    brand: ['Supprimer la marque ?', 'La marque sera définitivement supprimée.'],
    category: ['Supprimer la catégorie ?', 'La catégorie sera définitivement supprimée.'],
  };
  const [title, text] = labels[type] || labels.product;
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-text').textContent = text;
  document.getElementById('confirm-modal').classList.add('open');
}

function closeConfirm() {
  pendingDeleteId = null;
  pendingDeleteType = null;
  document.getElementById('confirm-modal').classList.remove('open');
}

async function confirmDelete() {
  if (!pendingDeleteId) return;
  const endpoints = {
    product: `${API}/api/products/${pendingDeleteId}`,
    brand: `${API}/api/brands/${pendingDeleteId}`,
    category: `${API}/api/categories/${pendingDeleteId}`,
  };
  const url = endpoints[pendingDeleteType] || endpoints.product;
  try {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const msgs = { product: 'Produit supprimé', brand: 'Marque supprimée', category: 'Catégorie supprimée' };
      showToast(msgs[pendingDeleteType] || 'Supprimé', 'success');
      const type = pendingDeleteType;
      closeConfirm();
      if (type === 'product') await loadProducts();
      else if (type === 'brand') await loadBrands();
      else if (type === 'category') await loadCategories();
    } else {
      showToast('Erreur suppression', 'error');
    }
  } catch {
    showToast('Erreur serveur', 'error');
  }
}

// ── TOAST ──
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ── INIT ──
checkAuth();
