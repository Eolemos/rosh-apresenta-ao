/* Prévia das telas: tablet do garçom (pedido, prontos para entregar, rosh grátis da mesa, meus pedidos) */
(function () {
  'use strict';

  var R = window.Rosh;
  var C = window.RoshCatalogo;
  var N = window.RoshNumeros;
  var U = window.RoshUI;
  var M = window.RoshMesas;
  var A = window.RoshAcesso;

  var ICONE_MESAS = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/></svg>';

  // Barra de cima de cada aparelho: título, botões, dicas e a pessoa logada
  function barra(titulo, aparelho, extra) {
    return '<header class="ui-barra"><div class="ui-barra__marca"><span class="ui-brasa" aria-hidden="true"></span><span class="ui-barra__titulo">' + titulo + '</span></div>' +
      '<div class="ui-barra__lado">' + extra +
      '<button type="button" class="ui-ajuda-botao" data-acao="dicas" data-foco="dicas" aria-label="Ver dicas desta tela">?</button>' + A.chipUsuario(aparelho) + '</div></header>';
  }

  function ligarBarra(tela, el, aparelho, cfg) {
    el.addEventListener('click', function (ev) {
      var alvo = ev.target.closest('[data-acao]');
      if (!alvo) return;
      if (alvo.getAttribute('data-acao') === 'menu-usuario') A.menu(tela, aparelho, cfg);
      if (alvo.getAttribute('data-acao') === 'dicas' && window.RoshDicas) window.RoshDicas.mostrar(aparelho, true);
    });
  }

  function montarTablet(tela) {
    tela.innerHTML = '<div class="ui"><div data-parte="barra"></div>' +
      '<div class="ui-corpo"><div data-parte="construtor"></div><aside class="ui-lateral" data-parte="lateral" aria-label="Pedidos"></aside></div></div>';

    var barraEl = tela.querySelector('[data-parte="barra"]');
    var lateral = tela.querySelector('[data-parte="lateral"]');
    var construtor = window.RoshConstrutor(tela.querySelector('[data-parte="construtor"]'), { modo: 'garcom', aparelho: 'tablet', tela: tela });
    var vistos = {};

    function eu() { return A.operador('tablet'); }

    function meus() {
      return R.pedidos.filter(function (p) { return p.vendedorId === eu() && p.estado !== 'desfeito'; });
    }

    function prontos() {
      return R.pedidos.filter(function (p) { return p.estado === 'pronto' && R.naCozinha(p); });
    }

    function desenharBarra() {
      var meusProntos = prontos().filter(function (p) { return p.vendedorId === eu(); }).length;
      var turno = N.totais(N.vendasDoTurno(eu())).n;
      U.desenhar(barraEl, barra('Novo pedido', 'tablet',
        '<button type="button" class="ui-botao ui-botao--pequeno" data-acao="mesas" data-foco="mesas">' + ICONE_MESAS + 'Mesas</button>' +
        '<button type="button" class="ui-botao ui-botao--pequeno ui-botao--brasa" data-acao="reposicao" data-foco="reposicao">' + U.ICONES.brasa + 'Mais carvão</button>' +
        '<span class="ui-chip">Turno: ' + turno + ' pedidos</span>' +
        '<span class="ui-sino' + (meusProntos ? ' ui-sino--ativo' : '') + '" role="img" aria-label="' + meusProntos + ' pedidos seus prontos">' +
        U.ICONES.sino + (meusProntos ? '<span class="ui-sino__numero">' + meusProntos + '</span>' : '') + '</span>'));
      A.marcarTreino(tela, 'tablet');
    }

    function novo(chave) {
      var e = !vistos[chave];
      vistos[chave] = true;
      return e ? ' ui-novo' : '';
    }

    function desenharLateral() {
      var html = '';
      var creditos = M.creditosDisponiveis();
      if (creditos.length) {
        html += '<h2 class="ui-lateral__titulo">Rosh grátis</h2>' + creditos.map(function (c) {
          return '<div class="ui-credito' + novo('c' + c.id) + '"><p class="ui-credito__titulo">' + U.ICONES.presente + R.nomeMesa(c.mesa) + ': 1 ' + R.esc(R.rosh(c.roshId).nome.toLowerCase()) + '</p>' +
            '<p class="ui-credito__texto">Pedido 0' + c.origem + ' às ' + R.hora(c.criadoEm) + ', ' + C.OPERADORES[c.vendedorId].nome + '. Vale até ' + R.hora(c.validoAte) + ', uma vez.</p>' +
            '<button type="button" class="ui-botao ui-botao--vidro ui-botao--pequeno" data-acao="segundo" data-id="' + c.id + '" data-foco="segundo-' + c.id + '">Lançar 2º rosh</button></div>';
        }).join('');
      }
      var lista = prontos().sort(function (a, b) { return (b.vendedorId === eu()) - (a.vendedorId === eu()); });
      html += '<h2 class="ui-lateral__titulo">Prontos para entregar <span class="ui-lateral__qtd">' + lista.length + '</span></h2>';
      html += lista.length ? lista.map(function (p) {
        var meu = p.vendedorId === eu();
        return '<div class="ui-pronto' + (meu ? ' ui-pronto--meu' : '') + novo('p' + p.id) + '" role="status"><p class="ui-pronto__mesa">' + R.nomeMesa(p.mesa) +
          (p.treino ? ' <span class="ui-selo ui-selo--treino">Treino</span>' : '') + '</p>' +
          '<p class="ui-pronto__texto">' + R.esc(R.descricao(p)) + ', ' + (meu ? 'seu pedido' : 'de ' + C.OPERADORES[p.vendedorId].nome) + '</p>' +
          '<button type="button" class="ui-botao ui-botao--vidro ui-botao--pequeno" data-acao="entregar" data-id="' + p.id + '" data-foco="entregar-' + p.id + '">Marcar entregue</button></div>';
      }).join('') : '<p class="ui-vazio">Nada pronto agora.</p>';

      var mine = meus();
      var ativos = mine.filter(function (p) { return p.estado === 'fila' || p.estado === 'preparo' || p.estado === 'pronto'; }).reverse();
      var fim = mine.filter(function (p) { return p.estado === 'entregue' || p.estado === 'cancelado'; }).slice(-2).reverse();
      html += '<h2 class="ui-lateral__titulo">Meus pedidos</h2><ul class="ui-pedidos">' + ativos.concat(fim).map(function (p) {
        return '<li class="ui-pedidos__item"><div class="ui-pedidos__texto"><p class="ui-pedidos__mesa">' + R.nomeMesa(p.mesa) + ' <span class="ui-pedidos__num">0' + p.numero + '</span></p>' +
          '<p class="ui-pedidos__detalhe">' + R.esc(R.descricao(p)) + ', ' + R.tempoDecorrido(p.criadoEm) + '</p>' + window.RoshPosVenda.situacao(p) +
          (p.treino ? ' <span class="ui-selo ui-selo--treino">Treino</span>' : '') + '</div>' +
          '<button type="button" class="ui-botao ui-botao--mini" data-acao="acoes" data-id="' + p.id + '" data-foco="acoes-' + p.id + '" aria-label="Ações do pedido 0' + p.numero + '">Ações</button></li>';
      }).join('') + '</ul>';
      if (!ativos.length && !fim.length) html += '<p class="ui-vazio">Os pedidos que você lançar aparecem aqui.</p>';
      U.desenhar(lateral, html);
    }

    lateral.addEventListener('click', function (ev) {
      var alvo = ev.target.closest('[data-acao]');
      if (!alvo) return;
      var id = alvo.getAttribute('data-id');
      var acao = alvo.getAttribute('data-acao');
      if (acao === 'entregar') {
        R.entregar(id);
        U.aviso(tela, 'Entrega registrada');
      }
      if (acao === 'segundo') {
        construtor.iniciarSegundo(C.porId(M.creditos, id));
        U.aviso(tela, 'Escolha as essências do 2º rosh');
      }
      if (acao === 'acoes') window.RoshPosVenda.abrir(tela, C.porId(R.pedidos, id), eu());
    });

    barraEl.addEventListener('click', function (ev) {
      var alvo = ev.target.closest('[data-acao]');
      if (!alvo) return;
      if (alvo.getAttribute('data-acao') === 'reposicao') window.RoshMapaMesas.reposicao(tela);
      if (alvo.getAttribute('data-acao') === 'mesas') window.RoshMapaMesas.abrir(tela);
    });
    ligarBarra(tela, barraEl, 'tablet');

    function tudo() {
      desenharBarra();
      desenharLateral();
    }

    R.ao(tudo);
    setInterval(tudo, 20000);
    tudo();
  }

  window.RoshTablet = { montar: montarTablet, barra: barra, ligarBarra: ligarBarra };
})();
