window.renderInfoPage = function renderInfoPage(pageContent) {
  const root = document.getElementById('content-root');
  if (!root || !pageContent) return;

  const escapeHtml = (value) => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

  const paragraphHtml = (paragraph) => {
    if (typeof paragraph === 'string') return `<p>${paragraph}</p>`;
    if (paragraph.type === 'image') {
      return `<p><img src="${escapeHtml(paragraph.src)}" alt="${escapeHtml(paragraph.alt || '')}" class="notes_img"></p>`;
    }
    const className = paragraph.className ? ` class="${escapeHtml(paragraph.className)}"` : '';
    return `<p${className}>${paragraph.html || escapeHtml(paragraph.text || '')}</p>`;
  };

  const sections = (pageContent.sections || []).map((section) => {
    const heading = section.heading ? `<p class="double-space"><span class="title-explanation">${escapeHtml(section.heading)}</span></p>` : '';
    const body = (section.paragraphs || []).map(paragraphHtml).join('\n');
    return `<section class="operation-block fade-in-up">${heading}${body}</section>`;
  }).join('\n');

  const note = pageContent.noteHtml ? `<h3>${pageContent.noteHtml}</h3>` : '';
  root.innerHTML = `<h1>${escapeHtml(pageContent.title || '')}</h1>${sections}${note}`;

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('is-show');
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    document.querySelectorAll('.fade-in-up').forEach(el => observer.observe(el));
  } else {
    document.querySelectorAll('.fade-in-up').forEach(el => el.classList.add('is-show'));
  }
};

document.addEventListener('DOMContentLoaded', () => window.renderInfoPage(window.pageContent));
