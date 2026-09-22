(() => {
  const menuGroups = [
    {

      links: [
        { label: 'HOME', href: 'home.html' },
        { label: '更新履歴', href: 'update_history.html' },
        { label: 'このサイトについて', href: 'about.html' }
      ]
    },
    {
      title: 'ゲーム説明',
      links: [
        { label: 'ドリームパーク', href: 'dream_park.html' },
        { label: 'リズムゲーム', href: 'rhythm_game.html' }
      ]
    },
    {
      title: '一覧系',
      links: [
        { label: '収録楽曲一覧', href: 'song.html', countKey: 'songs', countFallback: 200 },
        { label: 'キャラクターカード一覧', href: 'character_card.html', countKey: 'cards', countFallback: 185 },
        { label: 'アイテム一覧', href: 'item_search.html', countKey: 'items', countFallback: 44 }
      ]
    },
    {
      title: 'オリジナル',
      links: [
        { label: '非公式段位', href: 'dan.html' }
      ]
    }
  ];

  const countSources = {
    songs: 'js/song-data.js',
    cards: 'js/card-data.js',
    items: 'js/item-data.js'
  };

  function getLoadedCount(key) {
    if (key === 'songs' && typeof songList !== 'undefined' && Array.isArray(songList)) {
      return songList.length;
    }
    if (key === 'cards' && typeof cardData !== 'undefined' && Array.isArray(cardData)) {
      return cardData.length;
    }
    if (key === 'items' && typeof itemList !== 'undefined' && Array.isArray(itemList)) {
      return itemList.length;
    }
    return null;
  }

  function loadCountSource(key) {
    const loadedCount = getLoadedCount(key);
    if (loadedCount !== null) return Promise.resolve(loadedCount);

    const source = countSources[key];
    if (!source) return Promise.resolve(null);

    const existingScript = Array.from(document.scripts).find(script => {
      if (!script.src) return false;
      return new URL(script.src, document.baseURI).pathname.endsWith(`/${source}`);
    });
    if (existingScript) return Promise.resolve(getLoadedCount(key));

    return new Promise(resolve => {
      const script = document.createElement('script');
      script.src = source;
      script.async = true;
      script.dataset.menuCountSource = key;
      script.addEventListener('load', () => resolve(getLoadedCount(key)), { once: true });
      script.addEventListener('error', () => resolve(null), { once: true });
      document.head.appendChild(script);
    });
  }

  function refreshMenuCounts(panel) {
    Object.keys(countSources).forEach(key => {
      loadCountSource(key).then(count => {
        if (!Number.isFinite(count)) return;
        const countElement = panel.querySelector(`[data-count-key="${key}"]`);
        if (countElement) countElement.textContent = String(count);
      });
    });
  }

  function currentFileName() {
    const path = window.location.pathname.replace(/\\/g, '/');
    return decodeURIComponent(path.substring(path.lastIndexOf('/') + 1)) || 'home.html';
  }

  function closeMenu(button, panel, backdrop) {
    button.classList.remove('is-open');
    panel.classList.remove('is-open');
    backdrop.classList.remove('is-open');
    button.setAttribute('aria-expanded', 'false');
    panel.setAttribute('aria-hidden', 'true');
  }

  function openMenu(button, panel, backdrop) {
    button.classList.add('is-open');
    panel.classList.add('is-open');
    backdrop.classList.add('is-open');
    button.setAttribute('aria-expanded', 'true');
    panel.setAttribute('aria-hidden', 'false');
  }

  function buildMenu() {
    if (document.querySelector('.holodori-menu-button')) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'holodori-menu-button';
    button.setAttribute('aria-label', 'メニューを開く');
    button.setAttribute('aria-expanded', 'false');
    button.innerHTML = '<span class="holodori-menu-lines" aria-hidden="true"><span></span><span></span><span></span></span>';

    const backdrop = document.createElement('div');
    backdrop.className = 'holodori-menu-backdrop';

    const panel = document.createElement('nav');
    panel.className = 'holodori-menu-panel';
    panel.setAttribute('aria-label', 'サイトメニュー');
    panel.setAttribute('aria-hidden', 'true');

    const title = document.createElement('p');
    title.className = 'holodori-menu-title';
    title.textContent = 'メニュー';
    panel.appendChild(title);

    const current = currentFileName();
    menuGroups.forEach(group => {
      const section = document.createElement('section');
      section.className = 'holodori-menu-section';

      if (group.title) {
        const heading = document.createElement('p');
        heading.className = 'holodori-menu-heading';
        heading.textContent = group.title;
        section.appendChild(heading);
      }

      group.links.forEach(link => {
        const anchor = document.createElement('a');
        anchor.className = 'holodori-menu-link';
        anchor.href = link.href;
        const label = document.createElement('span');
        label.className = 'holodori-menu-link-label';
        label.textContent = link.label;
        anchor.appendChild(label);
        if (link.countKey) {
          const count = document.createElement('span');
          count.className = 'holodori-menu-link-count';
          count.dataset.countKey = link.countKey;
          count.textContent = String(link.countFallback ?? '');
          anchor.appendChild(count);
        }
        if (link.href === current) anchor.classList.add('is-current');
        section.appendChild(anchor);
      });

      panel.appendChild(section);
    });

    button.addEventListener('click', () => {
      if (panel.classList.contains('is-open')) {
        closeMenu(button, panel, backdrop);
      } else {
        openMenu(button, panel, backdrop);
      }
    });

    backdrop.addEventListener('click', () => closeMenu(button, panel, backdrop));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeMenu(button, panel, backdrop);
    });

    document.body.appendChild(button);
    document.body.appendChild(backdrop);
    document.body.appendChild(panel);
    refreshMenuCounts(panel);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildMenu);
  } else {
    buildMenu();
  }
})();
