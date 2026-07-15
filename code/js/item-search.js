const itemsPerPage = 30;
let currentPage = 1;
let filteredItems = [];
let itemModalCloseTimer = 0;


function getItemImagePath(imageName) {
  if (!imageName) return `${itemImageBasePath}item_placeholder.svg`;
  if (/^(https?:|data:|\/|\.\/|\.\.\/)/.test(imageName)) return imageName;
  return `${itemImageBasePath}${imageName}`;
}
function escapeHtml(value) {
  return String(value || '').replace(/[&<>\"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
}


function formatGetPlaces(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value || '')
    .split(/[、,]/)
    .map(place => place.trim())
    .filter(Boolean);
}
function updateItemDisplay() {
  const input = document.getElementById('item-search-input');
  const keyword = input ? input.value.trim().toLowerCase() : '';

  filteredItems = itemList.filter(item => {
    const target = `${item.name || ''} ${item.description || ''}`.toLowerCase();
    return !keyword || target.includes(keyword);
  });

  const maxPage = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  if (currentPage > maxPage) currentPage = maxPage;

  const totalEl = document.getElementById('total-count');
  const hitEl = document.getElementById('hit-count');
  if (totalEl) totalEl.textContent = itemList.length;
  if (hitEl) hitEl.textContent = filteredItems.length;

  renderItems();
}

function renderItems() {
  const container = document.getElementById('item-list-container');
  const pageNum = document.getElementById('current-page-num');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  if (!container) return;

  const maxPage = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  const start = (currentPage - 1) * itemsPerPage;
  const pageItems = filteredItems.slice(start, start + itemsPerPage);

  container.innerHTML = '';

  if (!pageItems.length) {
    container.innerHTML = '<p class="empty-message">該当するアイテムが見つかりませんでした。</p>';
  }

  pageItems.forEach(item => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'item-card';
    card.innerHTML = `
      <span class="item-image-wrap"><img src="${escapeHtml(getItemImagePath(item.image))}" alt="${escapeHtml(item.name)}"></span>
      <span class="item-card-name">${escapeHtml(item.name)}</span>
    `;
    card.addEventListener('click', () => openItemModal(item));
    container.appendChild(card);
  });

  if (pageNum) pageNum.textContent = `${currentPage} / ${maxPage}`;
  if (prevBtn) prevBtn.disabled = currentPage <= 1;
  if (nextBtn) nextBtn.disabled = currentPage >= maxPage;
}

function scrollItemPageTop() {
  if (window.lenis && typeof window.lenis.scrollTo === 'function') {
    window.lenis.scrollTo(0, { immediate: true });
  }
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
}

function openItemModal(item) {
  const modal = document.getElementById('item-modal');
  const image = document.getElementById('item-modal-image');
  const title = document.getElementById('item-modal-title');
  const description = document.getElementById('item-modal-description');
  const getBox = document.getElementById('item-modal-get');
  if (!modal || !image || !title || !description) return;

  window.clearTimeout(itemModalCloseTimer);
  image.src = getItemImagePath(item.image);
  image.alt = item.name || '';
  title.textContent = item.name || '';
  description.textContent = item.description || '説明は後から追加予定です。';
  if (getBox) {
    const places = formatGetPlaces(item.get);
    if (places.length) {
      getBox.hidden = false;
      getBox.innerHTML = `<strong>入手できる場所</strong><span>${places.map(escapeHtml).join('</span><span>')}</span>`;
    } else {
      getBox.hidden = true;
      getBox.innerHTML = '';
    }
  }
  modal.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => modal.classList.add('is-open'));
}

function closeItemModal() {
  const modal = document.getElementById('item-modal');
  if (!modal || !modal.classList.contains('is-open')) return;
  modal.classList.remove('is-open');
  window.clearTimeout(itemModalCloseTimer);
  itemModalCloseTimer = window.setTimeout(() => {
    modal.setAttribute('aria-hidden', 'true');
  }, 500);
}

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('item-search-input');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const modal = document.getElementById('item-modal');
  const closeBtn = document.getElementById('item-modal-close');

  if (input) {
    input.addEventListener('input', () => {
      currentPage = 1;
      updateItemDisplay();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentPage <= 1) return;
      currentPage -= 1;
      renderItems();
      scrollItemPageTop();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const maxPage = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
      if (currentPage >= maxPage) return;
      currentPage += 1;
      renderItems();
      scrollItemPageTop();
    });
  }

  if (modal) {
    modal.addEventListener('click', event => {
      if (event.target === modal) closeItemModal();
    });
  }

  if (closeBtn) closeBtn.addEventListener('click', closeItemModal);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeItemModal();
  });

  updateItemDisplay();
});
