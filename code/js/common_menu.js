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

  // --- ヘッダー（navbar）の自動生成 ---
  function buildHeader() {
    const headerContainer = document.getElementById('site-header');
    if (!headerContainer || headerContainer.querySelector('.navbar')) return;

    const subtitle = headerContainer.dataset.subtitle || '';
    const titleHtml = subtitle 
      ? `ホロドリナビ<br>${subtitle}` 
      : `非公式攻略サイト<br>ホロドリナビ`;

    const nav = document.createElement('nav');
    nav.className = 'navbar';
    nav.innerHTML = `
      <div class="logo">
        <a href="home.html"><img src="img/ロゴ.png" alt="logo"></a>
        <span class="site-title">${titleHtml}</span>
      </div>
      <ul class="nav-links">
        <li><a href="https://opening.hololive-dreams.com/" target="_blank">公式サイト</a></li>
        <li><a href="https://x.com/hololive_dreams" target="_blank" class="sns-link"><img src="sns_img/x.png" alt="公式X"></a></li>
        <li><a href="https://www.youtube.com/@hololivedreams" target="_blank" class="sns-link"><img src="sns_img/yt.png" alt="公式YouTube"></a></li>
      </ul>
    `;
    headerContainer.appendChild(nav);
  }

  // --- 共通ボタン（戻るボタン・ページトップボタン）の自動追加 ---
  function buildCommonButtons() {
    const current = currentFileName();

    // 1. 戻るボタン（home.html 以外で追加）
    if (current !== 'home.html' && !document.querySelector('.back-btn')) {
      const backBtn = document.createElement('a');
      backBtn.href = 'home.html';
      backBtn.className = 'back-btn';
      backBtn.setAttribute('aria-label', '戻る');
      backBtn.innerHTML = '<img src="img/back.png" alt="戻る">';
      document.body.prepend(backBtn);
    }

    // 2. ページトップボタン（全ページで追加）
    if (!document.querySelector('.page-top-button')) {
      const topBtn = document.createElement('a');
      topBtn.href = '#page-top';
      topBtn.className = 'page-top-button';
      topBtn.setAttribute('aria-label', '一番上へ戻る');
      topBtn.textContent = '⇧';
      document.body.appendChild(topBtn);
    }
  }

  // --- ドロワーメニューの自動構築 ---
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

  // --- アニメーション・スムーズスクロール初期化 ---
  function initCommonEffects() {
    // Lenis スムーズスクロール
    if (window.Lenis) {
      const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smooth: true
      });
      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    }

    // fade-in-up IntersectionObserver 監視
    const targets = document.querySelectorAll('.fade-in-up');
    if (targets.length) {
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-show');
              observer.unobserve(entry.target);
            }
          });
        }, { rootMargin: '0px 0px -33% 0px' });
        targets.forEach(el => observer.observe(el));
      } else {
        targets.forEach(el => el.classList.add('is-show'));
      }
    }
  }

  function init() {
    buildHeader();
    buildCommonButtons();
    buildMenu();
    initCommonEffects();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
