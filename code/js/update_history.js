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
    return `${Number(parts[1])}月${Number(parts[2])}日`;
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

  function groupByDate(updates) {
    const map = new Map();
    updates.forEach(update => {
      const date = update.date || '更新';
      if (!map.has(date)) map.set(date, []);
      map.get(date).push(update);
    });
    return Array.from(map.entries());
  }

  document.addEventListener('DOMContentLoaded', () => {
    const list = document.getElementById('update-history-list');
    if (!list) return;
    const updates = Array.isArray(window.holodoriSiteUpdates) ? sortUpdates(window.holodoriSiteUpdates) : [];
    if (!updates.length) {
      list.innerHTML = '<p class="history-empty">更新履歴はまだありません。</p>';
      return;
    }

    list.innerHTML = groupByDate(updates).map(([date, entries]) => `
      <article class="history-version-block">
        <h2 class="history-version-title">${escapeHtml(formatDate(date))}</h2>
        ${entries.map(update => `
          <section class="history-entry">
            <div class="history-notice-label"><span aria-hidden="true">■</span> ${escapeHtml(update.title || update.page || '更新しました。')}</div>
            <p class="history-summary">${allowLineBreaks(update.summary)}</p>
          </section>
        `).join('')}
      </article>
    `).join('');
  });
})();
