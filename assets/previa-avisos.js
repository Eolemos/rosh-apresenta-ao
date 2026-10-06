/* Prévia das telas: sino de avisos da central e a lista de avisos com ações */
(function () {
  'use strict';

  var R = window.Rosh;
  var C = window.RoshCatalogo;
  var U = window.RoshUI;
  var E = window.RoshEstoque;

  var TIPOS = {
    falta: 'Em falta',
    baixo: 'Estoque baixo',
    impressora: 'Impressora com falha',
    turno: 'Turno aguardando conferência',
    cancelamento: 'Pedido de cancelamento'
  };

  var ICONE_SINO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15Z"/><path d="M10 20.5a2 2 0 0 0 4 0"/></svg>';

  function rotuloEscopo(valor) {
    var v = valor || E.escopo.valor;
    return v === 'todas' ? 'Todas as unidades' : C.UNIDADES[v];
  }

  function sino(valor) {
    var n = E.naoLidos(valor);
    return '<button type="button" class="ui-sino-botao' + (n ? ' ui-sino-botao--ativo' : '') + '" data-acao="avisos" data-foco="avisos" aria-label="Avisos de ' +
      rotuloEscopo(valor) + ', ' + n + ' não lidos">' + ICONE_SINO + (n ? '<span class="ui-sino-botao__n">' + n + '</span>' : '') + '</button>';
  }

  // Ações de cada aviso: resolver ali mesmo, sem procurar a tela certa
  function acoes(a) {
    var botoes = [];
    var ref = a.ref || {};
    if (a.tipo === 'cancelamento' && !a.resolvido) {
      botoes.push('<button type="button" class="ui-botao ui-botao--mini ui-botao--primario" data-acao="aprovar" data-valor="' + ref.pedidoId + '">Aprovar</button>');
      botoes.push('<button type="button" class="ui-botao ui-botao--mini ui-botao--perigo" data-acao="recusar" data-valor="' + ref.pedidoId + '">Recusar</button>');
    }
    if ((a.tipo === 'falta' || a.tipo === 'baixo') && a.unidade === 'u1' && ref.saborId) {
      botoes.push('<button type="button" class="ui-botao ui-botao--mini" data-acao="entrada" data-valor="' + ref.saborId + '">Lançar entrada</button>');
      botoes.push('<button type="button" class="ui-botao ui-botao--mini" data-acao="ver-estoque">Ver estoque</button>');
    }
    if (a.tipo === 'turno' && ref.opId && window.RoshNumeros.turnos[ref.opId] && window.RoshNumeros.turnos[ref.opId].estado === 'aguardando') {
      botoes.push('<button type="button" class="ui-botao ui-botao--mini ui-botao--primario" data-acao="conferir" data-valor="' + ref.opId + '">Conferir turno</button>');
    }
    if (!a.lida) botoes.push('<button type="button" class="ui-botao ui-botao--mini" data-acao="lido" data-valor="' + a.id + '">Marcar como lida</button>');
    return botoes.length ? '<div class="ui-aviso-item__acoes">' + botoes.join('') + '</div>' : '<span class="ui-aviso-item__lido">Lido</span>';
  }

  function corpo(valor) {
    var lista = E.doEscopo(valor).slice().sort(function (a, b) { return (a.lida - b.lida) || (b.ts - a.ts); });
    var n = E.naoLidos(valor);
    return '<header class="ui-avisos__topo"><div><h2 class="ui-modal__titulo">Avisos</h2><p class="ui-modal__texto">' + rotuloEscopo(valor) + ', ' +
      (n ? n + (n === 1 ? ' não lido' : ' não lidos') : 'tudo lido') + '</p></div>' +
      '<button type="button" class="ui-botao ui-botao--pequeno" data-acao="todos"' + (n ? '' : ' disabled') + '>Marcar todas como lidas</button></header>' +
      (lista.length ? '<ul class="ui-avisos">' + lista.map(function (a) {
        return '<li class="ui-aviso-item ui-aviso-item--' + a.tipo + (a.lida ? ' ui-aviso-item--lido' : '') + '">' +
          '<div class="ui-aviso-item__corpo"><p class="ui-aviso-item__meta"><span class="ui-aviso-tag ui-aviso-tag--' + a.tipo + '">' + TIPOS[a.tipo] + '</span>' +
          '<span class="ui-aviso-item__loja">' + C.UNIDADES[a.unidade] + '</span><span class="ui-aviso-item__hora">' + R.tempoDecorrido(a.ts) + '</span></p>' +
          '<p class="ui-aviso-item__titulo">' + R.esc(a.titulo) + '</p><p class="ui-aviso-item__detalhe">' + R.esc(a.resolvido || a.detalhe) + '</p>' + acoes(a) + '</div></li>';
      }).join('') + '</ul>' : '<p class="ui-vazio">Nenhum aviso para esta unidade.</p>') +
      '<div class="ui-modal__acoes"><button type="button" class="ui-botao" data-acao="fechar">Fechar</button></div>';
  }

  // Ação de um aviso (usada também no celular do dono)
  function executar(tela, nome, valor, escopoValor) {
    var M = window.RoshMesas;
    if (nome === 'lido') E.marcarLido(valor);
    if (nome === 'todos') E.marcarTodos(escopoValor);
    if (nome === 'aprovar') {
      M.aprovarCancelamento(valor, 'ana');
      U.aviso(tela, 'Cancelamento aprovado: pedido saiu da cozinha e o estorno foi registrado');
    }
    if (nome === 'recusar') {
      M.recusarCancelamento(valor, 'ana');
      U.aviso(tela, 'Cancelamento recusado: o pedido segue normal');
    }
    if (nome === 'conferir') {
      window.RoshNumeros.conferirTurno(valor);
      U.aviso(tela, 'Turno conferido');
    }
    if (nome === 'entrada') window.RoshCfgCardapio.abrirEntrada(tela, valor);
    if (nome === 'ver-estoque') R.avisar({ tipo: 'navegar', vista: 'config', secao: 'estoque' });
  }

  function abrir(tela, escopoValor) {
    var modal = U.abrirModal(tela, corpo(escopoValor), function (alvo, fechar, fundo) {
      var nome = alvo.getAttribute('data-acao');
      var valor = alvo.getAttribute('data-valor');
      if (nome === 'fechar' || nome === 'entrada' || nome === 'ver-estoque') fechar();
      if (nome !== 'fechar') executar(tela, nome, valor, escopoValor);
      if (document.contains(fundo)) fundo.querySelector('.ui-modal__caixa').innerHTML = corpo(escopoValor);
    });
    modal.el.querySelector('.ui-modal__caixa').classList.add('ui-modal__caixa--avisos');
    R.ao(function (ev) {
      if ((ev.tipo === 'aviso' || ev.tipo === 'turno' || ev.tipo === 'alterado') && document.contains(modal.el)) {
        modal.el.querySelector('.ui-modal__caixa').innerHTML = corpo(escopoValor);
      }
    });
  }

  window.RoshAvisos = { sino: sino, abrir: abrir, corpo: corpo, executar: executar, rotuloEscopo: rotuloEscopo, TIPOS: TIPOS };
})();
