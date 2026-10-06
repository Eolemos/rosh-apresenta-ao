/* Prévia das telas: abas, escala dos aparelhos, impressora e inicialização */
(function () {
  'use strict';

  var R = window.Rosh;
  var U = window.RoshUI;
  var reduzir = window.matchMedia('(prefers-reduced-motion: reduce)');

  var DISPOSITIVO = { 'ao-vivo': 'tablet', tablet: 'tablet', cozinha: 'cozinha', caixa: 'caixa', gestao: 'gestao', config: 'config' };

  var DICAS = {
    'ao-vivo': 'Lance um pedido no tablet: abra uma mesa com um nome, escolha o rosh, as essências por marca, os adicionais e a conta. Confirme o pagamento; o pedido chega na cozinha 5 s depois, tempo de desfazer. Avance até pronto e ele aparece em Prontos para entregar.',
    tablet: 'A tela que cada garçom usa no salão: mesas abertas na hora com nome e descrição, o tempo do carvão de cada uma, mais de um narguilé por pedido, rosh grátis da mesa e ações depois do envio. Toque no nome do garçom para trocar de usuário ou ligar o modo treino.',
    cozinha: 'A fila de montagem. Use Estoque para abrir um pacote novo ou marcar uma essência em falta; o aviso chega na hora para o gerente e o master.',
    caixa: 'O caixa lança pedidos do balcão ou de uma mesa aberta com troco calculado, abre o turno com fundo de troco, registra retiradas e fecha contando o dinheiro da gaveta.',
    gestao: 'O painel do gerente e do master, no computador e no celular do dono. Todos os cartões seguem a loja escolhida; os avisos têm ação direta, como aprovar cancelamento.',
    config: 'Troque entre Gerente e Master para ver o que cada um pode mudar. Cadastros, preços, estoque, promoções e mesas fixas aparecem no tablet, no caixa e na cozinha na hora.'
  };

  // Cada tela é desenhada no tamanho real e reduzida para caber na moldura
  function escalar(aparelho) {
    var largura = Number(aparelho.getAttribute('data-largura'));
    var altura = Number(aparelho.getAttribute('data-altura'));
    var janela = aparelho.querySelector('.aparelho__janela');
    var tela = aparelho.querySelector('.aparelho__tela');
    var disponivel = janela.clientWidth;
    if (!disponivel) return;
    var s = Math.min(1, disponivel / largura);
    tela.style.width = largura + 'px';
    tela.style.height = altura + 'px';
    tela.style.transform = 'scale(' + s + ')';
    janela.style.height = Math.round(altura * s) + 'px';
    aparelho.style.setProperty('--s-imp', Math.max(s, 0.62));
  }

  var aparelhos = Array.prototype.slice.call(document.querySelectorAll('.aparelho'));

  function escalarTodos() {
    aparelhos.forEach(escalar);
  }

  if ('ResizeObserver' in window) {
    var observador = new ResizeObserver(function (entradas) {
      entradas.forEach(function (e) { escalar(e.target.closest('.aparelho')); });
    });
    aparelhos.forEach(function (a) { observador.observe(a.querySelector('.aparelho__moldura')); });
  } else {
    window.addEventListener('resize', escalarTodos);
  }

  var palco = document.getElementById('palco');
  var dica = document.getElementById('dica');
  var abas = Array.prototype.slice.call(document.querySelectorAll('.pv-aba'));

  function selecionar(aba, focar) {
    abas.forEach(function (a) {
      var ativa = a === aba;
      a.setAttribute('aria-selected', String(ativa));
      a.tabIndex = ativa ? 0 : -1;
    });
    var vista = aba.getAttribute('data-vista');
    palco.setAttribute('data-vista', vista);
    palco.setAttribute('aria-labelledby', aba.id);
    dica.textContent = DICAS[vista];
    if (focar) aba.focus();
    requestAnimationFrame(function () {
      escalarTodos();
      if (window.RoshDicas && !window.ROSH_TOUR) {
        window.RoshDicas.fechar();
        setTimeout(function () { window.RoshDicas.mostrar(DISPOSITIVO[vista]); }, 120);
      }
    });
  }

  abas.forEach(function (aba, i) {
    aba.addEventListener('click', function () { selecionar(aba, false); });
    aba.addEventListener('keydown', function (ev) {
      var destino = null;
      if (ev.key === 'ArrowRight') destino = abas[(i + 1) % abas.length];
      if (ev.key === 'ArrowLeft') destino = abas[(i - 1 + abas.length) % abas.length];
      if (ev.key === 'Home') destino = abas[0];
      if (ev.key === 'End') destino = abas[abas.length - 1];
      if (destino) {
        ev.preventDefault();
        selecionar(destino, true);
      }
    });
  });

  // Impressora da cozinha: a comanda sobe a cada pedido novo ou reimpressão
  var impressora = document.getElementById('impressora');
  var comanda = document.getElementById('comanda-impressa');
  var temporizadores = [];

  function imprimir(pedido) {
    temporizadores.forEach(clearTimeout);
    temporizadores = [];
    comanda.innerHTML = U.comandaPedido(pedido);
    impressora.classList.remove('pv-impressora--imprimindo', 'pv-impressora--saindo');
    void impressora.offsetWidth;
    impressora.classList.add('pv-impressora--imprimindo');
    var espera = reduzir.matches ? 2600 : 4400;
    temporizadores.push(setTimeout(function () {
      impressora.classList.remove('pv-impressora--imprimindo');
      impressora.classList.add('pv-impressora--saindo');
    }, espera));
    temporizadores.push(setTimeout(function () {
      impressora.classList.remove('pv-impressora--saindo');
    }, espera + 500));
  }

  var telaCozinha = document.getElementById('tela-cozinha');

  R.ao(function (ev) {
    if (ev.tipo === 'navegar') selecionar(document.getElementById('aba-' + ev.vista), false);
    if (ev.tipo === 'liberado' || (ev.tipo === 'alterado' && ev.reimprimir)) imprimir(ev.pedido);
    if (ev.tipo === 'imprimir') {
      imprimir(ev.pedido);
      U.aviso(telaCozinha, 'Comanda de ' + R.nomeMesa(ev.pedido.mesa) + ' reimpressa');
    }
  });

  window.RoshTablet.montar(document.getElementById('tela-tablet'));
  window.RoshCozinha.montar(telaCozinha);
  window.RoshCaixa.montar(document.getElementById('tela-caixa'));
  window.RoshGestao.montar(document.getElementById('tela-gestao'));
  window.RoshConfig.montar(document.getElementById('tela-config'));
  window.RoshCelular.montar(document.getElementById('tela-celular'));

  function abaDe(vista) {
    return document.getElementById('aba-' + vista);
  }

  // Link direto para uma tela, por exemplo previa.html#tela=cozinha
  var pedida = /tela=([a-z-]+)/.exec(location.hash);
  selecionar((pedida && abaDe(pedida[1])) || abas[0], false);
  escalarTodos();

  window.RoshApp = {
    selecionar: function (vista) { if (abaDe(vista)) selecionar(abaDe(vista), false); },
    vista: function () { return palco.getAttribute('data-vista'); },
    imprimir: imprimir,
    escalar: escalarTodos
  };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(escalarTodos);
})();
