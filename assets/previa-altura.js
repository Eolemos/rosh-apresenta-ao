/* Quando a prévia está embutida, informa a altura do conteúdo à página que a contém */
(function () {
  'use strict';

  if (window.parent === window) return;

  var ultima = 0;

  function avisar() {
    // Altura do conteúdo, não da janela: scrollHeight nunca fica menor que a moldura
    var altura = Math.ceil(document.body.getBoundingClientRect().height);
    if (Math.abs(altura - ultima) < 2) return;
    ultima = altura;
    window.parent.postMessage({ roshPreviaAltura: altura }, '*');
  }

  if ('ResizeObserver' in window) {
    new ResizeObserver(avisar).observe(document.body);
  }
  window.addEventListener('load', avisar);
  document.addEventListener('click', function () {
    setTimeout(avisar, 50);
  });
})();
