(() => {
  function getBasePath() {
    const path = window.location.pathname.replace(/\\/g, '/');
    if (path.includes('/code/収録楽曲一覧/')) return '../';
    if (path.includes('/code/')) return '';
    return 'code/';
  }

  function buildFooter() {
    if (document.querySelector('.site-rights-footer')) return;

    const basePath = getBasePath();
    const footer = document.createElement('footer');
    footer.className = 'site-rights-footer';
    footer.innerHTML = `
      <p>当サイトはファンが作成した非公式攻略・データベースサイトです。公式とは関係ありません。</p>
      <p>掲載している画像・名称・ロゴ等の著作権および商標権は、各権利者に帰属します。</p>
      <p>掲載内容に問題がある場合は確認後すみやかに対応します。詳しくは <a href="${basePath}about.html">このサイトについて</a> をご確認ください。</p>
      <p>&copy; COVER / &copy; QualiArts, Inc.</p>
    `;
    document.body.appendChild(footer);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildFooter);
  } else {
    buildFooter();
  }
})();
