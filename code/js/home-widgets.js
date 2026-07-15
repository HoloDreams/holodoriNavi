(function () {
  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"]/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;'
    }[char]));
  }

  function allowLineBreaks(value) {
    return escapeHtml(value).replace(/&lt;br\s*\/?&gt;/gi, '<br>');
  }

  function formatDate(value) {
    const parts = String(value || '').split('-');
    if (parts.length !== 3) return value || '';
    return `${Number(parts[1])}/${Number(parts[2])}`;
  }

  function sortUpdates(updates) {
    return updates
      .map((update, index) => ({ ...update, originalIndex: index }))
      .sort((a, b) => {
        const dateDiff = new Date(b.date || 0) - new Date(a.date || 0);
        return dateDiff || a.originalIndex - b.originalIndex;
      })
      .map(({ originalIndex, ...update }) => update);
  }

  function renderHomeUpdates() {
    const list = document.getElementById('home-update-list');
    if (!list) return;
    const updates = Array.isArray(window.holodoriSiteUpdates) ? sortUpdates(window.holodoriSiteUpdates).slice(0, 3) : [];
    if (!updates.length) {
      list.innerHTML = '<p class="home-update-empty">更新情報はまだありません。</p>';
      return;
    }
    list.innerHTML = updates.map(update => `
      <article class="home-update-card">
        <div class="home-update-meta"><span>${escapeHtml(formatDate(update.date))}</span><span>${escapeHtml(update.tag || '更新')}</span></div>
        <h3>${escapeHtml(update.title || `${update.page || 'サイト'}に更新があります`)}</h3>
        <p>${allowLineBreaks(update.summary)}</p>
      </article>
    `).join('');
  }

  function pickRandom(entries) {
    if (!entries.length) return null;
    return entries[Math.floor(Math.random() * entries.length)];
  }

  function renderRandomEntry() {
    const box = document.getElementById('home-random-result');
    const button = document.getElementById('home-random-button');
    if (!box || !button) return;
    const entries = Array.isArray(window.holodoriRandomEntries) ? window.holodoriRandomEntries : [];
    const entry = pickRandom(entries);
    if (!entry) return;
    box.innerHTML = `<span>${escapeHtml(entry.kind)}</span><strong>${escapeHtml(entry.name)}</strong><p>${escapeHtml(entry.note)}</p>`;
    button.href = entry.href;
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderHomeUpdates();
    renderRandomEntry();
    const reroll = document.getElementById('home-random-reroll');
    if (reroll) reroll.addEventListener('click', renderRandomEntry);
  });
})();
