/* Prévia das telas: configuração do estoque de essências e histórico de movimentos */
(function () {
  'use strict';

  var R = window.Rosh;
  var C = window.RoshCatalogo;
  var E = window.RoshEstoque;

  var FILTROS = [['', 'Todas'], ['falta', 'Em falta'], ['baixo', 'Estoque baixo'], ['ok', 'Ok']];
  var ORDEM = { falta: 0, baixo: 1, ok: 2 };

  function html(ctx) {
    var cardapio = window.RoshCfgCardapio;
    var c = E.contarStatus();
    var compras = E.listaCompras();
    var lista = C.SABORES.filter(C.saborVisivel).filter(function (s) { return !ctx.filtroEstoque || E.status(s) === ctx.filtroEstoque; })
      .sort(function (a, b) { return ORDEM[E.status(a)] - ORDEM[E.status(b)] || a.estoque - b.estoque; });
    var linhas = lista.map(function (s) {
      return '<tr><th scope="row">' + R.esc(C.rotuloSabor(s)) + '</th><td>' + s.estoque + '</td><td>' + s.minimo + '</td><td>' + cardapio.chipStatus(s) + '</td>' +
        '<td class="ui-tabela__acoes"><button type="button" class="ui-botao ui-botao--mini" data-acao="entrada" data-valor="' + s.id + '" data-foco="e-ent-' + s.id + '">Entrada</button>' +
        '<button type="button" class="ui-botao ui-botao--mini" data-acao="contagem" data-valor="' + s.id + '" data-foco="e-cont-' + s.id + '">Contagem</button></td></tr>';
    }).join('');
    var historico = E.movimentos.slice(0, 14).map(function (m) {
      var op = C.OPERADORES[m.quem];
      return '<li class="ui-mov ui-mov--' + m.tipo + '"><p class="ui-mov__topo"><span class="ui-mov__hora">' + R.hora(m.ts) + '</span>' +
        '<span class="ui-mov__quem">' + op.nome + ' (' + op.cargo + ')</span></p>' +
        '<p class="ui-mov__sabor">' + R.esc(C.rotuloSabor(R.sabor(m.saborId))) + '</p>' +
        '<p class="ui-mov__texto">' + R.esc(m.texto) + '. Ficou com ' + E.pacotes(m.depois) + '.</p></li>';
    }).join('');
    return '<div class="ui-cfg-duas ui-cfg-duas--estoque"><section class="ui-painel"><div class="ui-cfg-cabeca"><h3 class="ui-painel__titulo">Estoque em pacotes fechados</h3>' +
      '<p class="ui-cfg-dica">' + c.falta + ' em falta, ' + c.baixo + ' com estoque baixo. Baixo é quando sobra o mínimo ou menos.</p></div>' +
      '<div class="ui-linha ui-linha--filtros" role="group" aria-label="Filtro">' + FILTROS.map(function (f) {
        return '<button type="button" class="ui-filtro" data-acao="filtro" data-valor="' + f[0] + '" data-foco="ef-' + (f[0] || 'todas') + '" aria-pressed="' + (ctx.filtroEstoque === f[0]) + '">' + f[1] + '</button>';
      }).join('') + '</div>' +
      '<table class="ui-tabela ui-tabela--cfg"><thead><tr><th scope="col">Essência</th><th scope="col">Pacotes</th><th scope="col">Mínimo</th><th scope="col">Situação</th>' +
      '<th scope="col"><span class="ui-oculto">Ações</span></th></tr></thead><tbody>' + (linhas || '<tr><td colspan="5" class="ui-vazio">Nada nesta situação.</td></tr>') + '</tbody></table></section>' +
      '<section class="ui-painel"><h3 class="ui-painel__titulo">Lista de compras</h3><p class="ui-cfg-dica ui-cfg-dica--esquerda">Sugestão: o que está no mínimo ou abaixo, ' +
      'para voltar ao dobro do mínimo.</p><ul class="ui-compras">' + (compras.length ? compras.map(function (i) {
        return '<li><span>' + R.esc(C.rotuloSabor(i.sabor)) + '<small>' + E.pacotes(i.sabor.estoque) + ', mínimo ' + i.sabor.minimo + '</small></span><strong>' + i.sugestao + ' pct</strong>' +
          '<button type="button" class="ui-botao ui-botao--mini" data-acao="entrada" data-valor="' + i.sabor.id + '">Lançar entrada</button></li>';
      }).join('') : '<li class="ui-vazio">Nada para comprar agora.</li>') + '</ul>' +
      '<h3 class="ui-painel__titulo ui-painel__titulo--espaco">Movimentos de estoque</h3><ul class="ui-movs">' + historico + '</ul></section></div>';
  }

  function acao(nome, valor, alvo, ctx) {
    if (nome === 'filtro') {
      ctx.filtroEstoque = valor;
      return true;
    }
    if (nome === 'entrada') window.RoshCfgCardapio.abrirEntrada(ctx.tela, valor, ctx);
    if (nome === 'contagem') window.RoshCfgCardapio.abrirContagem(ctx.tela, valor, ctx);
    return false;
  }

  window.RoshCfgEstoque = { html: html, acao: acao };
})();
