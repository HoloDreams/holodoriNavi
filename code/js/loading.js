(function () {
  // 1. ローディングHTMLの自動注入
  function injectLoadingScreen() {
    if (document.querySelector('.holodori-loading-screen')) return;

    var loader = document.createElement('div');
    loader.className = 'holodori-loading-screen';
    loader.setAttribute('role', 'status');
    loader.setAttribute('aria-live', 'polite');
    loader.innerHTML = [
      '<div class="holodori-loading-inner">',
      '  <p class="holodori-loading-text" aria-label="Loading...">',
      '    <span style="--i: 0;">L</span><span style="--i: 1;">o</span><span style="--i: 2;">a</span>',
      '    <span style="--i: 3;">d</span><span style="--i: 4;">i</span><span style="--i: 5;">n</span>',
      '    <span style="--i: 6;">g</span><span style="--i: 7;">.</span><span style="--i: 8;">.</span><span style="--i: 9;">.</span>',
      '  </p>',
      '  <div class="holodori-loading-bar" aria-hidden="true">',
      '    <div class="holodori-loading-bar-fill"></div>',
      '  </div>',
      '</div>'
    ].join('');

    if (document.body) {
      document.body.insertBefore(loader, document.body.firstChild);
    }
  }

  // 2. 非表示処理
  function hideLoadingScreen() {
    var loader = document.querySelector('.holodori-loading-screen');
    if (!loader) {
      document.body.classList.add('holodori-loaded');
      return;
    }
    loader.classList.add('is-hidden');
    window.setTimeout(function () {
      if (loader && loader.parentNode) {
        loader.parentNode.removeChild(loader);
      }
      document.body.classList.add('holodori-loaded');
    }, 800);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectLoadingScreen);
  } else {
    injectLoadingScreen();
  }

  if (document.readyState === 'complete') {
    window.setTimeout(hideLoadingScreen, 250);
  } else {
    window.addEventListener('load', function () {
      window.setTimeout(hideLoadingScreen, 250);
    });
  }
})();
