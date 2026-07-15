(function () {
  function hideLoadingScreen() {
    var loader = document.querySelector('.holodori-loading-screen');
    if (!loader) return;
    loader.classList.add('is-hidden');
    window.setTimeout(function () {
      if (loader && loader.parentNode) {
        loader.parentNode.removeChild(loader);
      }
    }, 800);
  }

  if (document.readyState === 'complete') {
    window.setTimeout(hideLoadingScreen, 250);
  } else {
    window.addEventListener('load', function () {
      window.setTimeout(hideLoadingScreen, 250);
    });
  }
})();

