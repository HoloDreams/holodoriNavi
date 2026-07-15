(() => {
  const menuGroups = [
    {

      links: [
        { label: 'HOME', href: 'home.html' },
        { label: '更新履歴', href: 'update_history.html' }
      ]
    },
    {
      title: 'ゲーム説明',
      links: [
        { label: 'ドリームパーク', href: 'dream_park.html' },
        { label: 'リズムゲーム', href: 'rhythm_game.html' },
        { label: 'ユニット', href: 'unit.html' }
      ]
    },
    {
      title: '攻略',
      links: [
        { label: '収録楽曲一覧', href: 'song.html' },
        { label: 'キャラクターカード一覧', href: 'character_card.html' },
        { label: 'アイテム一覧', href: 'item_search.html' }
      ]
    }
  ];

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
        anchor.textContent = link.label;
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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildMenu);
  } else {
    buildMenu();
  }
})();

