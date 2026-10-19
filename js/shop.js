/* Hassan Fish Store — hero setup, catalogue, cart and cash-on-delivery checkout. */
(function () {
  'use strict';

  const CONFIG = {
    currency: 'Rs',
    deliveryFee: 800,          // flat live-fish delivery charge per order
    // Your WhatsApp number in international format, digits only (92 = Pakistan). Orders and every
    // WhatsApp button on the site go here.
    whatsappNumber: '923262853106',
    // Optional: a form endpoint (e.g. https://formspree.io/f/xxxx) that emails each order to you.
    orderEndpoint: '',
    cartKey: 'hfs-cart',
    ordersKey: 'hfs-orders'
  };

  const PRODUCTS = window.KOI_PRODUCTS || [];
  const CATEGORIES = window.KOI_CATEGORIES || [];
  const byId = id => PRODUCTS.find(p => p.id === id);
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const money = n => CONFIG.currency + ' ' + Math.round(n).toLocaleString('en-PK');
  const waLink = text => 'https://wa.me/' + CONFIG.whatsappNumber + (text ? '?text=' + encodeURIComponent(text) : '');
  $$('a[href^="https://wa.me/"]').forEach(a => { a.href = waLink(); });
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const store = {
    get(key, fallback) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ } }
  };

  // ---------- hero ----------
  const heroCanvas = $('#koi-canvas');
  const heroApi = window.KoiSwim && window.KOI_SWIM_PHOTOS && heroCanvas
    ? window.KoiSwim.initHero(heroCanvas, window.KOI_SWIM_PHOTOS, [
      { photo: 'kohaku', follow: true, length: 2.7, x: 2.2, y: -0.4, heading: 2.6 },
      { photo: 'tancho', length: 2.0, x: -5, y: 2.2, heading: 0.4, z: -2.5, maxSpeed: 0.6, tint: 0xd4e6ff },
      { photo: 'showa', length: 2.1, x: 5, y: 2.8, heading: 3.4, z: -3, maxSpeed: 0.55, tint: 0xd4e6ff },
      { photo: 'yamabuki', length: 1.7, x: -3, y: -3, heading: 1.2, z: -4.5, maxSpeed: 0.5, tint: 0xc4dcff },
      { photo: 'kujaku', length: 1.8, x: 4, y: -2.5, heading: 2.2, z: -5.5, maxSpeed: 0.5, tint: 0xc4dcff }
    ])
    : null;
  if (!heroApi) document.body.classList.add('no-webgl');
  $('#home').addEventListener('click', e => {
    if (!heroApi || e.target.closest('a, button')) return;
    heroApi.feed(e.clientX, e.clientY);
  });

  // ---------- catalogue ----------
  let category = 'all', sort = 'featured';
  const chosenSize = {};
  PRODUCTS.forEach(p => { chosenSize[p.id] = Math.min(1, p.sizes.length - 1); });

  const filters = $('#filters');
  filters.innerHTML = CATEGORIES.map(c =>
    `<button type="button" class="chip${c.id === category ? ' active' : ''}" data-cat="${c.id}" aria-pressed="${c.id === category}">${esc(c.label)}</button>`
  ).join('');
  filters.addEventListener('click', e => {
    const b = e.target.closest('[data-cat]');
    if (!b) return;
    category = b.dataset.cat;
    $$('.chip', filters).forEach(c => { const on = c === b; c.classList.toggle('active', on); c.setAttribute('aria-pressed', on); });
    renderGrid();
  });
  $('#sort').addEventListener('change', e => { sort = e.target.value; renderGrid(); });

  // Photo shown whole (contain) over a blurred, zoomed copy of itself, so every shape of photo fills the frame.
  function mediaHTML(p, cls) {
    return `<div class="media ${cls || ''}">
      <img class="media-bg" src="${p.image}" alt="" aria-hidden="true" loading="lazy">
      <img class="media-fg" src="${p.image}" alt="${esc(p.name)} koi" loading="lazy">
    </div>`;
  }

  function sizeButtons(p, selected, attr) {
    return p.sizes.map((s, i) =>
      `<button type="button" class="size${i === selected ? ' active' : ''}" ${attr}="${i}" aria-pressed="${i === selected}">${esc(s.label)}</button>`
    ).join('');
  }

  function renderGrid() {
    let list = PRODUCTS.filter(p => category === 'all' || p.category === category);
    const priceOf = p => p.sizes[0].price;
    if (sort === 'low') list = list.slice().sort((a, b) => priceOf(a) - priceOf(b));
    if (sort === 'high') list = list.slice().sort((a, b) => priceOf(b) - priceOf(a));
    $('#grid').innerHTML = list.map(p => {
      const si = chosenSize[p.id];
      return `<article class="card reveal" data-id="${p.id}">
        <button type="button" class="card-media" data-open="${p.id}" aria-label="View ${esc(p.name)} details">
          ${mediaHTML(p)}
          ${p.badge ? `<span class="badge">${esc(p.badge)}</span>` : ''}
        </button>
        <div class="card-body">
          <div class="card-title"><h3>${esc(p.name)}</h3><span class="jp">${esc(p.jp)}</span></div>
          <p class="card-desc">${esc(p.desc)}</p>
          <div class="sizes" role="group" aria-label="Size">${sizeButtons(p, si, 'data-size')}</div>
          <div class="card-foot">
            <span class="price" data-price>${money(p.sizes[si].price)}</span>
            <button type="button" class="btn btn-primary btn-sm" data-add="${p.id}">Add to cart</button>
          </div>
        </div>
      </article>`;
    }).join('') || '<p class="empty">No koi in this category yet.</p>';
    observeReveals();
  }

  $('#grid').addEventListener('click', e => {
    const card = e.target.closest('.card');
    if (!card) return;
    const p = byId(card.dataset.id);
    const sizeBtn = e.target.closest('[data-size]');
    if (sizeBtn) {
      chosenSize[p.id] = +sizeBtn.dataset.size;
      $$('[data-size]', card).forEach(b => { const on = b === sizeBtn; b.classList.toggle('active', on); b.setAttribute('aria-pressed', on); });
      $('[data-price]', card).textContent = money(p.sizes[chosenSize[p.id]].price);
      return;
    }
    if (e.target.closest('[data-add]')) { addToCart(p.id, chosenSize[p.id], 1); return; }
    if (e.target.closest('[data-open]')) openProduct(p.id);
  });

  // ---------- product modal ----------
  const productModal = $('#product-modal');
  function openProduct(id) {
    const p = byId(id);
    let si = chosenSize[id], qty = 1;
    productModal.innerHTML = `
      <button type="button" class="modal-close" data-close aria-label="Close">&times;</button>
      <div class="pm">
        ${mediaHTML(p, 'pm-media')}
        <div class="pm-info">
          <p class="eyebrow">${esc(p.jp)} · ${esc((CATEGORIES.find(c => c.id === p.category) || {}).label || '')}</p>
          <h2>${esc(p.name)}</h2>
          <p class="pm-desc">${esc(p.desc)}</p>
          <dl class="pm-details">${Object.entries(p.details).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
          <p class="label">Size</p>
          <div class="sizes" role="group" aria-label="Size">${sizeButtons(p, si, 'data-psize')}</div>
          <div class="pm-buy">
            <div class="qty" aria-label="Quantity">
              <button type="button" data-q="-1" aria-label="Decrease">−</button><span data-qty>1</span><button type="button" data-q="1" aria-label="Increase">+</button>
            </div>
            <button type="button" class="btn btn-primary" data-padd>Add to cart · <span data-ptotal>${money(p.sizes[si].price)}</span></button>
          </div>
          <p class="pm-note">✓ Live arrival guarantee &nbsp; ✓ Cash on delivery</p>
          ${creditHTML(p)}
        </div>
      </div>`;
    const update = () => {
      $('[data-qty]', productModal).textContent = qty;
      $('[data-ptotal]', productModal).textContent = money(p.sizes[si].price * qty);
    };
    productModal.onclick = e => {
      if (e.target === productModal || e.target.closest('[data-close]')) { productModal.close(); return; }
      const s = e.target.closest('[data-psize]');
      if (s) {
        si = +s.dataset.psize; chosenSize[id] = si;
        $$('[data-psize]', productModal).forEach(b => { const on = b === s; b.classList.toggle('active', on); b.setAttribute('aria-pressed', on); });
        update(); renderGrid();
      }
      const q = e.target.closest('[data-q]');
      if (q) { qty = Math.max(1, Math.min(20, qty + +q.dataset.q)); update(); }
      if (e.target.closest('[data-padd]')) { addToCart(id, si, qty); productModal.close(); }
    };
    productModal.showModal();
  }

  function creditHTML(p) {
    if (!p.credit) return '';
    return `<p class="credit">Photo: <a href="${p.credit.url}" target="_blank" rel="noopener">${esc(p.credit.author)}</a>, ${esc(p.credit.license)}</p>`;
  }
  $('#photo-credits').innerHTML = PRODUCTS.filter(p => p.credit).map(p =>
    `<li>${esc(p.name)}: <a href="${p.credit.url}" target="_blank" rel="noopener">${esc(p.credit.author)}</a> (${esc(p.credit.license)})</li>`
  ).join('');

  // ---------- cart ----------
  let cart = store.get(CONFIG.cartKey, []).filter(l => byId(l.id) && byId(l.id).sizes[l.size]);
  const lineKey = l => l.id + ':' + l.size;
  const linePrice = l => byId(l.id).sizes[l.size].price;
  const subtotal = () => cart.reduce((s, l) => s + linePrice(l) * l.qty, 0);
  const totals = () => { const sub = subtotal(); const fee = cart.length ? CONFIG.deliveryFee : 0; return { sub, fee, total: sub + fee }; };

  function saveCart() { store.set(CONFIG.cartKey, cart); renderCart(); }

  function addToCart(id, size, qty) {
    const found = cart.find(l => l.id === id && l.size === size);
    if (found) found.qty = Math.min(20, found.qty + qty); else cart.push({ id, size, qty });
    saveCart();
    const p = byId(id);
    toast(`${p.name} (${p.sizes[size].label}) added to cart`);
    const btn = $('#cart-btn'); btn.classList.remove('bump'); void btn.offsetWidth; btn.classList.add('bump');
  }

  const cartEl = $('#cart'), overlay = $('#overlay');
  function openCart() { cartEl.classList.add('open'); overlay.classList.add('show'); cartEl.setAttribute('aria-hidden', 'false'); $('.cart-close', cartEl).focus(); }
  function closeCart() { cartEl.classList.remove('open'); overlay.classList.remove('show'); cartEl.setAttribute('aria-hidden', 'true'); }
  $('#cart-btn').addEventListener('click', openCart);
  overlay.addEventListener('click', closeCart);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && cartEl.classList.contains('open')) closeCart(); });

  function renderCart() {
    const count = cart.reduce((s, l) => s + l.qty, 0);
    $('#cart-count').textContent = count;
    $('#cart-count').hidden = !count;
    const { sub, fee, total } = totals();
    const items = $('#cart-items');
    if (!cart.length) {
      items.innerHTML = `<div class="cart-empty"><span class="kanji" aria-hidden="true">鯉</span><p>Your cart is empty.</p><a href="#shop" class="btn btn-ghost btn-sm" data-close-cart>Browse koi</a></div>`;
    } else {
      items.innerHTML = cart.map(l => {
        const p = byId(l.id);
        return `<div class="cart-line" data-key="${lineKey(l)}">
          ${mediaHTML(p, 'cart-thumb')}
          <div class="cl-info">
            <strong>${esc(p.name)}</strong>
            <span class="muted">${esc(p.sizes[l.size].label)} · ${money(linePrice(l))}</span>
            <div class="qty qty-sm"><button type="button" data-cq="-1" aria-label="Decrease">−</button><span>${l.qty}</span><button type="button" data-cq="1" aria-label="Increase">+</button></div>
          </div>
          <div class="cl-right"><strong>${money(linePrice(l) * l.qty)}</strong><button type="button" class="link" data-remove>Remove</button></div>
        </div>`;
      }).join('');
    }
    $('#cart-sub').textContent = money(sub);
    $('#cart-fee').textContent = cart.length ? money(fee) : '—';
    $('#cart-total').textContent = money(total);
    $('#checkout-btn').disabled = !cart.length;
  }

  $('#cart-items').addEventListener('click', e => {
    if (e.target.closest('[data-close-cart]')) { closeCart(); return; }
    const row = e.target.closest('.cart-line');
    if (!row) return;
    const line = cart.find(l => lineKey(l) === row.dataset.key);
    const q = e.target.closest('[data-cq]');
    if (q) { line.qty += +q.dataset.cq; if (line.qty < 1) cart = cart.filter(l => l !== line); line.qty = Math.min(20, line.qty); saveCart(); }
    if (e.target.closest('[data-remove]')) { cart = cart.filter(l => l !== line); saveCart(); }
  });
  $('.cart-close').addEventListener('click', closeCart);

  // ---------- checkout (cash on delivery) ----------
  const checkout = $('#checkout-modal');
  $('#checkout-btn').addEventListener('click', () => { closeCart(); openCheckout(); });

  function summaryHTML(lines) {
    return lines.map(l => {
      const p = byId(l.id);
      return `<li><span>${l.qty} × ${esc(p.name)} <span class="muted">${esc(p.sizes[l.size].label)}</span></span><span>${money(linePrice(l) * l.qty)}</span></li>`;
    }).join('');
  }

  function openCheckout() {
    const { sub, fee, total } = totals();
    $('#co-summary').innerHTML = summaryHTML(cart);
    $('#co-sub').textContent = money(sub);
    $('#co-fee').textContent = money(fee);
    $('#co-total').textContent = money(total);
    $('#co-cash').textContent = money(total);
    $('#checkout-form').hidden = false;
    $('#co-success').hidden = true;
    checkout.showModal();
  }
  checkout.addEventListener('click', e => {
    if (e.target === checkout || e.target.closest('[data-close]')) checkout.close();
  });

  $('#checkout-form').addEventListener('submit', e => {
    e.preventDefault();
    const form = e.target;
    const phone = form.phone;
    phone.setCustomValidity(/^(\+92|0)3\d{2}[\s-]?\d{7}$/.test(phone.value.trim()) ? '' : 'Enter a Pakistani mobile number, e.g. 0300 1234567');
    if (!form.reportValidity()) return;

    const data = Object.fromEntries(new FormData(form).entries());
    const { sub, fee, total } = totals();
    const order = {
      id: 'HFS-' + Date.now().toString(36).toUpperCase().slice(-6),
      date: new Date().toISOString(),
      customer: data,
      payment: 'Cash on delivery',
      items: cart.map(l => ({ id: l.id, name: byId(l.id).name, size: byId(l.id).sizes[l.size].label, qty: l.qty, price: linePrice(l) })),
      subtotal: sub, delivery: fee, total
    };
    const orders = store.get(CONFIG.ordersKey, []);
    orders.push(order);
    store.set(CONFIG.ordersKey, orders);
    if (CONFIG.orderEndpoint) {
      fetch(CONFIG.orderEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(order) })
        .catch(() => { /* order is still saved locally */ });
    }

    // hand the order to WhatsApp so it reaches the shop; the success screen keeps a button in case the popup was blocked
    const message = [
      `New order ${order.id} — Hassan Fish Store`,
      '',
      ...order.items.map(i => `• ${i.qty} × ${i.name} (${i.size}) — ${money(i.price * i.qty)}`),
      '',
      `Subtotal: ${money(sub)}`,
      `Delivery: ${money(fee)}`,
      `Total (cash on delivery): ${money(total)}`,
      '',
      `Name: ${data.name}`,
      `Phone: ${data.phone}`,
      `City: ${data.city}`,
      `Address: ${data.address}`,
      data.notes ? `Notes: ${data.notes}` : ''
    ].filter((line, i, all) => line || all[i - 1]).join('\n');
    const url = waLink(message);
    $('#co-whatsapp').href = url;
    window.open(url, '_blank', 'noopener');

    $('#co-order-id').textContent = order.id;
    $('#co-paid').textContent = money(total);
    $('#co-phone').textContent = data.phone;
    form.hidden = true;
    $('#co-success').hidden = false;
    form.reset();
    cart = [];
    saveCart();
  });

  // ---------- small UI bits ----------
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
  }

  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  const menuBtn = $('#menu-btn');
  menuBtn.addEventListener('click', () => {
    const open = nav.classList.toggle('menu-open');
    menuBtn.setAttribute('aria-expanded', open);
  });
  $$('.nav-links a').forEach(a => a.addEventListener('click', () => { nav.classList.remove('menu-open'); menuBtn.setAttribute('aria-expanded', 'false'); }));

  let revealObserver;
  function observeReveals() {
    if (!('IntersectionObserver' in window)) { $$('.reveal').forEach(el => el.classList.add('in')); return; }
    revealObserver = revealObserver || new IntersectionObserver(es => es.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); revealObserver.unobserve(en.target); }
    }), { threshold: 0.12 });
    $$('.reveal:not(.in)').forEach(el => revealObserver.observe(el));
  }

  $('#year').textContent = new Date().getFullYear();
  renderGrid();
  renderCart();
})();
