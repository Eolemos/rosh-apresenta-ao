/* Prévia das telas: painel de gestão (gerente e master) */
(function () {
  'use strict';

  var R = window.Rosh;
  var C = window.RoshCatalogo;
  var N = window.RoshNumeros;
  var U = window.RoshUI;
  var E = window.RoshEstoque;
  var A = window.RoshAvisos;
  var K = window.RoshGestaoCartoes;

  // Menu lateral da central: Visão geral e Configuração funcionam; o resto fica de fora da prévia
  function menu(atual) {
    var itens = [['Visão geral', 'gestao'], ['Pedidos'], ['Fechamentos'], ['Equipe'], ['Unidades'], ['Configuração', 'config']];
    return '<nav class="ui-menu" aria-label="Central"><div class="ui-menu__marca"><span class="ui-brasa" aria-hidden="true"></span>Rosh <span>Central</span></div>' +
      itens.map(function (it) {
        if (!it[1]) return '<span class="ui-menu__item ui-menu__item--inerte" title="Fora da prévia">' + it[0] + '</span>';
        return '<button type="button" class="ui-menu__item" data-acao="menu" data-valor="' + it[1] + '"' + (it[0] === atual ? ' aria-current="page"' : '') + '>' + it[0] + '</button>';
      }).join('') +
      '<span class="ui-menu__usuario"><span class="ui-usuario__avatar" aria-hidden="true">M</span>Marcos (master)</span></nav>';
  }

  function montarGestao(tela) {
    tela.innerHTML = '<div class="ui ui--gestao">' + menu('Visão geral') + '<main class="ui-gestao" data-parte="gestao"></main></div>';
    var area = tela.querySelector('[data-parte="gestao"]');

    function desenhar() {
      var todas = E.escopo.valor === 'todas';
      var d = N.resumoEscopo(todas ? 'todas' : 'u1');
      var naCozinha = R.pedidos.filter(function (p) { return R.naCozinha(p) && (p.estado === 'fila' || p.estado === 'preparo'); }).length;
      var onde = todas ? 'rede' : C.UNIDADES.u1;
      U.desenhar(area, '<header class="ui-gestao__topo"><div><h2 class="ui-gestao__titulo">Visão geral</h2><p class="ui-gestao__data">' + R.rotuloDia() + '</p></div>' +
        '<div class="ui-gestao__acoes"><div class="ui-segmento" role="group" aria-label="Unidade">' +
        '<button type="button" data-acao="vista" data-valor="u1" data-foco="vista-u1" aria-pressed="' + !todas + '">' + C.UNIDADES.u1 + '</button>' +
        '<button type="button" data-acao="vista" data-valor="todas" data-foco="vista-todas" aria-pressed="' + todas + '">Todas as unidades</button></div>' +
        '<button type="button" class="ui-ajuda-botao" data-acao="dicas" aria-label="Ver dicas desta tela">?</button>' + A.sino() + '</div></header>' +
        '<div class="ui-kpis">' + K.kpi('Pedidos no dia', d.pedidos) + K.kpi('Faturamento líquido', R.reais(d.valor)) +
        K.kpi('Ticket médio', R.reais(Math.round(d.valor / d.pedidos))) + K.kpi('Carvões extra', d.carvoes, 'Em pedidos e reposições') +
        (todas ? K.kpi('Unidades abertas', '3', 'Todas com a caixinha online') : K.kpi('Na cozinha agora', naCozinha, 'Na fila ou em preparo')) + '</div>' +
        '<div class="ui-gestao__grade">' +
        '<section class="ui-painel ui-painel--largo"><h3 class="ui-painel__titulo">Pedidos por hora, ' + onde + '</h3>' + K.grafico(d.horas) + '</section>' +
        '<section class="ui-painel"><h3 class="ui-painel__titulo">Marcas mais vendidas</h3>' +
        K.ranking(N.marcasMaisVendidas(todas).slice(0, 6), function (m) { return R.marca(m.id).nome; }, function (m) { return R.marca(m.id).cor; }) + '</section>' +
        '<section class="ui-painel"><h3 class="ui-painel__titulo">Sabores mais vendidos</h3>' +
        K.ranking(N.saboresMaisVendidos(todas).slice(0, 4), function (s) { return U.nomeSabor(s.id); }, null, true) + '</section>' +
        '<section class="ui-painel ui-painel--largo"><h3 class="ui-painel__titulo">' + (todas ? 'Vendas por unidade' : 'Vendas por pessoa, em pedidos') + '</h3>' +
        (todas ? K.tabelaUnidades(d.u1) : K.tabelaEquipe(d.u1)) + '</section>' +
        '<section class="ui-painel ui-painel--largo"><h3 class="ui-painel__titulo">Promoções, ' + onde + '</h3>' + K.tabelaPromocoes(todas) + '</section>' +
        '<section class="ui-painel ui-painel--largo ui-painel--fechamentos"><h3 class="ui-painel__titulo">Fechamentos de turno, ' + onde + '</h3>' + K.fechamentos(todas) + '</section>' +
        '<section class="ui-painel ui-painel--largo ui-painel--estoque"><h3 class="ui-painel__titulo">Estoque, ' + onde + '</h3>' + K.estoque(todas) + '</section></div>');
    }

    area.addEventListener('click', function (ev) {
      var alvo = ev.target.closest('[data-acao]');
      if (!alvo) return;
      var acao = alvo.getAttribute('data-acao');
      if (acao === 'vista') E.definirEscopo(alvo.getAttribute('data-valor'));
      if (acao === 'avisos') A.abrir(tela);
      if (acao === 'dicas' && window.RoshDicas) window.RoshDicas.mostrar('gestao', true);
      if (acao === 'ver-estoque') R.avisar({ tipo: 'navegar', vista: 'config', secao: 'estoque' });
      if (acao === 'conferir') {
        N.conferirTurno(alvo.getAttribute('data-id'));
        U.aviso(tela, 'Fechamento conferido');
      }
    });
    tela.querySelector('.ui-menu').addEventListener('click', function (ev) {
      var alvo = ev.target.closest('[data-acao="menu"]');
      if (alvo) R.avisar({ tipo: 'navegar', vista: alvo.getAttribute('data-valor') });
    });

    R.ao(desenhar);
    desenhar();
  }

  window.RoshGestao = { montar: montarGestao, menu: menu };
})();
