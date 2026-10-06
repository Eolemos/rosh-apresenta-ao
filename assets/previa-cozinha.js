/* Prévia das telas: tela da cozinha (fila de montagem, idade dos pedidos e reposições) */
(function () {
  'use strict';

  var R = window.Rosh;
  var C = window.RoshCatalogo;
  var U = window.RoshUI;
  var A = window.RoshAcesso;

  var ICONE_ESTOQUE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5Z"/><path d="M4 8.5 12 13l8-4.5M12 13v7"/></svg>';
  var COLUNAS = [
    { estado: 'fila', titulo: 'Na fila' },
    { estado: 'preparo', titulo: 'Em preparo' },
    { estado: 'pronto', titulo: 'Pronto' }
  ];

  // Idade do pedido: laranja depois de 10 min, vermelho depois de 15 min
  function idade(p) {
    var m = R.minutos(p.criadoEm);
    if (p.estado === 'pronto') return '';
    return m > 15 ? ' ui-card--atrasado' : m > 10 ? ' ui-card--demorando' : '';
  }

  function montarCozinha(tela) {
    tela.innerHTML = '<div class="ui ui--cozinha"><div data-parte="barra"></div><div class="ui-quadro" data-parte="quadro"></div></div>';
    var barraEl = tela.querySelector('[data-parte="barra"]');
    var quadro = tela.querySelector('[data-parte="quadro"]');
    var vistos = {};
    var iniciada = false;
    window.RoshTablet.ligarBarra(tela, barraEl, 'cozinha');

    function acoes(p) {
      var principal;
      var id = ' data-id="' + p.id + '" data-foco="av-' + p.id + '"';
      if (p.estado === 'fila' && p.tipo === 'reposicao') principal = '<button type="button" class="ui-botao ui-botao--brasa" data-acao="avancar"' + id + '>Marcar pronto</button>';
      else if (p.estado === 'fila') principal = '<button type="button" class="ui-botao ui-botao--primario" data-acao="avancar"' + id + '>Começar preparo</button>';
      else if (p.estado === 'preparo') principal = '<button type="button" class="ui-botao ui-botao--brasa" data-acao="avancar"' + id + '>Marcar pronto</button>';
      else principal = '<button type="button" class="ui-botao ui-botao--vidro" data-acao="entregar" data-id="' + p.id + '" data-foco="en-' + p.id + '">Marcar entregue</button>';
      return '<div class="ui-card__acoes">' + principal +
        '<button type="button" class="ui-icone" data-acao="reimprimir" data-id="' + p.id + '" data-foco="re-' + p.id + '" aria-label="Reimprimir a comanda de ' +
        R.esc(R.nomeMesa(p.mesa)) + '" title="Reimprimir">' + U.ICONES.imprimir + '</button></div>';
    }

    function selos(p) {
      var lista = [];
      if (p.treino) lista.push('<span class="ui-selo ui-selo--treino">Treino, não preparar</span>');
      if (p.segundo) lista.push('<span class="ui-selo ui-selo--vidro">2º rosh (rosh duplo)</span>');
      else if (p.rotuloDesconto) lista.push('<span class="ui-selo ui-selo--latao">' + R.esc(p.rotuloDesconto) + '</span>');
      if (p.alteradoEm) lista.push('<span class="ui-selo ui-selo--brasa">Alterado ' + R.hora(p.alteradoEm) + '</span>');
      if (p.cancelamento && p.cancelamento.estado === 'pendente') lista.push('<span class="ui-selo ui-selo--alerta">Cancelamento pedido</span>');
      return lista.length ? '<p class="ui-card__selos">' + lista.join('') + '</p>' : '';
    }

    function cartao(p) {
      var novo = !vistos[p.id + p.estado + (p.alteradoEm || '')];
      vistos[p.id + p.estado + (p.alteradoEm || '')] = true;
      var classe = 'ui-card ui-card--' + p.estado + (p.tipo === 'reposicao' ? ' ui-card--reposicao' : '') + idade(p) + (novo && iniciada ? ' ui-novo' : '');
      var topo = '<header class="ui-card__topo"><span class="ui-card__mesa">' + R.esc(R.nomeMesa(p.mesa)) + '</span><span class="ui-card__tempo">' + R.minutos(p.criadoEm) + ' min</span></header>' +
        (R.descMesa(p.mesa) ? '<p class="ui-card__desc">' + R.esc(R.descMesa(p.mesa)) + '</p>' : '');
      var venda = '<p class="ui-card__venda">0' + p.numero + ', ' + R.esc(C.OPERADORES[p.vendedorId].nome) + ', ' + (p.pagamento ? R.pagamento(p.pagamento).nome : 'sem cobrança') + '</p>';
      if (p.tipo === 'reposicao') {
        return '<article class="' + classe + '"><p class="ui-card__tipo">' + U.ICONES.brasa + 'Reposição de carvão</p>' + topo + selos(p) +
          '<p class="ui-card__rosh">' + p.carvoes + (p.carvoes === 1 ? ' carvão' : ' carvões') + '</p>' + venda + acoes(p) + '</article>';
      }
      return '<article class="' + classe + '">' + topo + selos(p) + p.itens.map(function (item, i) {
        return '<div class="ui-card__item"><p class="ui-card__rosh">' + (p.itens.length > 1 ? (i + 1) + '. ' : '') + R.esc(R.rosh(item.roshId).nome) + '</p>' +
          '<p class="ui-card__sabores">' + item.sabores.map(function (id) { return R.esc(U.nomeSabor(id)); }).join(' + ') + '</p>' +
          (U.rotuloAdicionais(item.adicionais) ? '<p class="ui-card__adicionais">' + U.rotuloAdicionais(item.adicionais) + '</p>' : '') +
          (item.gelo ? '<p class="ui-card__obs">Gelo no vaso</p>' : '') + '</div>';
      }).join('') + venda + acoes(p) + '</article>';
    }

    // Contador "+N" quando há cartões fora da área visível da coluna
    function contarEscondidos() {
      Array.prototype.forEach.call(quadro.querySelectorAll('.ui-coluna'), function (col) {
        var lista = col.querySelector('.ui-coluna__cartoes');
        var limite = lista.scrollTop + lista.clientHeight;
        var escondidos = Array.prototype.filter.call(lista.querySelectorAll('.ui-card'), function (c) {
          return c.offsetTop - lista.offsetTop + c.offsetHeight > limite + 4;
        }).length;
        var mais = col.querySelector('.ui-coluna__mais');
        mais.textContent = escondidos ? '+' + escondidos + ' abaixo' : '';
        mais.hidden = !escondidos;
      });
    }

    function desenhar() {
      var ativos = R.pedidos.filter(function (p) { return R.naCozinha(p) && p.estado !== 'entregue'; });
      var naFila = ativos.filter(function (p) { return p.estado === 'fila'; }).length;
      U.desenhar(barraEl, window.RoshTablet.barra('Cozinha', 'cozinha', '<span class="ui-chip">' + C.UNIDADES.u1 + '</span>' +
        '<button type="button" class="ui-botao ui-botao--pequeno" data-acao="estoque" data-foco="estoque">' + ICONE_ESTOQUE + 'Estoque</button>' +
        '<span class="ui-chip ui-chip--latao">' + naFila + ' na fila</span><span class="ui-relogio">' + R.hora(R.agora()) + '</span>'));
      U.desenhar(quadro, COLUNAS.map(function (c) {
        var lista = ativos.filter(function (p) { return p.estado === c.estado; }).sort(function (a, b) { return a.criadoEm - b.criadoEm; });
        return '<section class="ui-coluna ui-coluna--' + c.estado + '" aria-label="' + c.titulo + '">' +
          '<h2 class="ui-coluna__titulo">' + c.titulo + '<span class="ui-coluna__qtd">' + lista.length + '</span><span class="ui-coluna__mais" hidden></span></h2>' +
          '<div class="ui-coluna__cartoes">' + (lista.length ? lista.map(cartao).join('') : '<p class="ui-vazio">Nenhum pedido aqui.</p>') + '</div></section>';
      }).join(''));
      var novo = quadro.querySelector('.ui-novo');
      if (novo) {
        var col = novo.parentNode;
        col.scrollTop = novo.offsetTop - col.offsetTop - 4;
      }
      Array.prototype.forEach.call(quadro.querySelectorAll('.ui-coluna__cartoes'), function (l) { l.addEventListener('scroll', contarEscondidos); });
      requestAnimationFrame(contarEscondidos);
    }

    barraEl.addEventListener('click', function (ev) {
      if (ev.target.closest('[data-acao="estoque"]')) window.RoshCozinhaEstoque.abrir(tela);
    });

    quadro.addEventListener('click', function (ev) {
      var alvo = ev.target.closest('[data-acao]');
      if (!alvo) return;
      var id = alvo.getAttribute('data-id');
      var acao = alvo.getAttribute('data-acao');
      if (acao === 'avancar') R.avancar(id);
      if (acao === 'entregar') {
        R.entregar(id);
        U.aviso(tela, 'Entrega registrada pela cozinha');
      }
      if (acao === 'reimprimir') R.reimprimir(id);
    });

    R.ao(function (ev) {
      if (['liberado', 'estado', 'imprimir', 'alterado', 'desfeito', 'usuario'].indexOf(ev.tipo) !== -1) desenhar();
    });
    setInterval(desenhar, 15000);
    desenhar();
    iniciada = true;
  }

  window.RoshCozinha = { montar: montarCozinha };
})();
