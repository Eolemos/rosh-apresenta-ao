/* Prévia das telas: cartões do painel de gestão, todos seguindo a unidade escolhida */
(function () {
  'use strict';

  var R = window.Rosh;
  var C = window.RoshCatalogo;
  var N = window.RoshNumeros;
  var U = window.RoshUI;
  var E = window.RoshEstoque;

  function kpi(rotulo, valor, detalhe) {
    return '<div class="ui-kpi"><p class="ui-kpi__rotulo">' + rotulo + '</p><p class="ui-kpi__valor">' + valor + '</p>' +
      (detalhe ? '<p class="ui-kpi__detalhe">' + detalhe + '</p>' : '') + '</div>';
  }

  function grafico(horas, altura) {
    var max = Math.max.apply(null, horas);
    return '<div class="ui-grafico" role="img" aria-label="Pedidos por hora, de 13h a 21h">' + horas.map(function (n, i) {
      return '<div class="ui-grafico__coluna"><span class="ui-grafico__valor">' + n + '</span>' +
        '<span class="ui-grafico__barra" style="height:' + Math.round((n / max) * (altura || 105)) + 'px"></span><span class="ui-grafico__hora">' + N.HORAS[i] + '</span></div>';
    }).join('') + '</div>';
  }

  function ranking(lista, rotulo, cor, empilhado) {
    var max = lista.length ? lista[0].n : 1;
    return '<ol class="ui-ranking' + (empilhado ? ' ui-ranking--empilhado' : '') + '">' + lista.map(function (item) {
      return '<li><span class="ui-ranking__nome">' + R.esc(rotulo(item)) + '</span><span class="ui-ranking__barra"><span style="width:' +
        Math.round((item.n / max) * 100) + '%;' + (cor ? 'background:' + cor(item) : '') + '"></span></span><span class="ui-ranking__n">' + item.n + '</span></li>';
    }).join('') + '</ol>';
  }

  function tabelaEquipe(d) {
    return '<table class="ui-tabela"><thead><tr><th scope="col">Pessoa</th><th scope="col">Pedidos</th><th scope="col">Dinheiro</th>' +
      '<th scope="col">Cartão</th><th scope="col">Pix</th><th scope="col">Carvões</th><th scope="col">Líquido</th></tr></thead><tbody>' +
      d.porOperador.map(function (o) {
        var fm = o.resumo.formas;
        return '<tr><th scope="row" title="' + U.vendedor(o.id) + '">' + C.OPERADORES[o.id].nome + '</th><td>' + o.total.n + '</td><td>' + fm.dinheiro.n + '</td><td>' + fm.cartao.n +
          '</td><td>' + fm.pix.n + '</td><td>' + o.resumo.carvoes + '</td><td>' + R.reais(o.total.liq) + '</td></tr>';
      }).join('') + '</tbody></table>';
  }

  function tabelaUnidades(u1) {
    var linhas = [{ nome: C.UNIDADES.u1, pedidos: u1.pedidos, valor: u1.valor, carvoes: u1.carvoes }].concat(N.OUTRAS_UNIDADES);
    return '<table class="ui-tabela"><thead><tr><th scope="col">Unidade</th><th scope="col">Pedidos</th><th scope="col">Carvões</th>' +
      '<th scope="col">Faturamento</th><th scope="col">Ticket médio</th></tr></thead><tbody>' + linhas.map(function (u) {
        return '<tr><th scope="row">' + u.nome + '</th><td>' + u.pedidos + '</td><td>' + u.carvoes + '</td><td>' + R.reais(u.valor) +
          '</td><td>' + R.reais(Math.round(u.valor / u.pedidos)) + '</td></tr>';
      }).join('') + '</tbody></table>';
  }

  function tabelaPromocoes(todas) {
    return '<table class="ui-tabela ui-tabela--compacta"><thead><tr><th scope="col">Promoção</th><th scope="col">Pedidos</th><th scope="col">Desconto</th></tr></thead><tbody>' +
      N.resultadoPromocoes(todas).map(function (p) {
        var promo = R.promocao(p.id);
        var situacao = p.tipo === 'avulso' ? 'Com PIN do gerente' : promo.encerrada ? 'Encerrada' : promo.pausada ? 'Pausada' :
          (promo.modo === 'automatica' ? 'Automática, ' : 'Opcional, ') + (C.promoAtiva(promo, R.agora()) ? 'ativa agora' : 'fora do horário');
        var desconto = p.tipo === 'duplo' ? p.gratis + ' rosh grátis' : p.desc ? R.reais(p.desc) : '—';
        return '<tr><th scope="row">' + R.esc(p.nome) + '<span class="ui-tabela__sub">' + situacao + '</span></th><td>' + p.n + '</td><td>' + desconto + '</td></tr>';
      }).join('') + '</tbody></table>';
  }

  function fechamentos(todas) {
    if (todas) {
      var t1 = { abertos: 0, aguardando: 0, conferidos: 0 };
      ['bia', 'rafa', 'leo', 'duda', 'bia-anterior'].forEach(function (id) {
        var t = N.turnos[id];
        if (!t) return;
        if (t.estado === 'aberto') t1.abertos += 1;
        else if (t.estado === 'aguardando') t1.aguardando += 1;
        else t1.conferidos += 1;
      });
      return '<ul class="ui-fechamentos ui-fechamentos--rede">' + [{ nome: C.UNIDADES.u1, turnos: t1 }].concat(N.OUTRAS_UNIDADES).map(function (u) {
        return '<li class="ui-fechamentos__item"><div><p class="ui-fechamentos__nome">' + u.nome + '</p><p class="ui-fechamentos__hora">' + u.turnos.abertos + ' abertos, ' +
          u.turnos.conferidos + ' conferidos</p></div>' + (u.turnos.aguardando ? '<span class="ui-estado ui-estado--fila">' + u.turnos.aguardando + ' para conferir</span>' :
          '<span class="ui-estado ui-estado--pronto">Em dia</span>') + '</li>';
      }).join('') + '</ul>';
    }
    var peso = { aguardando: 0, aberto: 1, conferido: 2 };
    var ordem = ['bia', 'rafa', 'leo', 'bia-anterior', 'duda'].filter(function (id) { return N.turnos[id]; })
      .sort(function (a, b) { return peso[N.turnos[a].estado] - peso[N.turnos[b].estado]; });
    return '<ul class="ui-fechamentos">' + ordem.map(function (id) {
      var t = N.turnos[id];
      var estado;
      if (t.estado === 'conferido') estado = '<span class="ui-estado ui-estado--pronto">Conferido por ' + t.conferidoPor + '</span>';
      else if (t.estado === 'aguardando') estado = '<button type="button" class="ui-botao ui-botao--pequeno ui-botao--primario" data-acao="conferir" data-id="' + id + '" data-foco="conf-' + id + '">Conferir</button>';
      else estado = '<span class="ui-estado ui-estado--fila">Aberto</span>';
      var dif = typeof t.diferenca === 'number' && t.diferenca !== 0 ? '<p class="ui-fechamentos__dif">Diferença no dinheiro: ' + (t.diferenca > 0 ? 'sobra ' : 'falta ') + R.reais(Math.abs(t.diferenca)) + '</p>' : '';
      return '<li class="ui-fechamentos__item"><div><p class="ui-fechamentos__nome">' + U.vendedor(id) + '</p><p class="ui-fechamentos__hora">' + R.esc(t.horario) + '</p>' + dif + '</div>' + estado + '</li>';
    }).join('') + '</ul>';
  }

  // Estoque: na unidade, contagem e lista de compras; na rede, uma linha por loja
  function estoque(todas) {
    var c = E.contarStatus();
    var compras = E.listaCompras();
    if (todas) {
      var linhas = [{ nome: C.UNIDADES.u1, falta: c.falta, baixo: c.baixo, compras: compras.length }].concat(N.OUTRAS_UNIDADES.map(function (u) {
        return { nome: u.nome, falta: E.OUTRAS[u.id].falta, baixo: E.OUTRAS[u.id].baixo, compras: E.OUTRAS[u.id].compras };
      }));
      return '<ul class="ui-compras">' + linhas.map(function (l) {
        return '<li><span>' + l.nome + '<small>' + l.falta + ' em falta, ' + l.baixo + ' baixo, ' + l.compras + ' para comprar</small></span></li>';
      }).join('') + '</ul>';
    }
    return '<div class="ui-estoque-resumo"><p class="ui-estoque-resumo__linha ui-estoque-resumo__linha--falta"><strong>' + c.falta + '</strong> em falta, ' +
      '<strong class="ui-estoque-resumo__baixo">' + c.baixo + '</strong> com estoque baixo. Sugestão de compra:</p><ul class="ui-compras">' + compras.slice(0, 4).map(function (i) {
        return '<li><span>' + R.esc(C.rotuloSabor(i.sabor)) + '</span><strong>' + i.sugestao + ' pct</strong></li>';
      }).join('') + '</ul>' +
      '<button type="button" class="ui-link" data-acao="ver-estoque" data-foco="ver-estoque">Ver lista de compras completa (' + compras.length + (compras.length === 1 ? ' item' : ' itens') + ')</button></div>';
  }

  window.RoshGestaoCartoes = {
    kpi: kpi, grafico: grafico, ranking: ranking, tabelaEquipe: tabelaEquipe, tabelaUnidades: tabelaUnidades,
    tabelaPromocoes: tabelaPromocoes, fechamentos: fechamentos, estoque: estoque
  };
})();
