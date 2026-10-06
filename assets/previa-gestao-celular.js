/* Prévia das telas: celular do dono (gestão pensada para a tela pequena, com navegação embaixo) */
(function () {
  'use strict';

  var R = window.Rosh;
  var C = window.RoshCatalogo;
  var N = window.RoshNumeros;
  var U = window.RoshUI;
  var E = window.RoshEstoque;
  var A = window.RoshAvisos;
  var K = window.RoshGestaoCartoes;

  var ABAS = [
    { id: 'inicio', nome: 'Início', icone: '<path d="M4 11 12 4l8 7v8.5H14v-5h-4v5H4Z"/>' },
    { id: 'avisos', nome: 'Avisos', icone: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15Z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>' },
    { id: 'estoque', nome: 'Estoque', icone: '<path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5Z"/><path d="M4 8.5 12 13l8-4.5M12 13v7"/>' },
    { id: 'turnos', nome: 'Turnos', icone: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/>' }
  ];

  function montar(tela) {
    var escopo = 'todas';
    var aba = 'inicio';
    tela.innerHTML = '<div class="ui ui--celular" data-parte="celular"></div>';
    var raiz = tela.querySelector('[data-parte="celular"]');

    function cartao(rotulo, valor, detalhe, destaque) {
      return '<div class="ui-cel-kpi' + (destaque ? ' ui-cel-kpi--destaque' : '') + '"><p class="ui-cel-kpi__rotulo">' + rotulo + '</p><p class="ui-cel-kpi__valor">' + valor + '</p>' +
        (detalhe ? '<p class="ui-cel-kpi__detalhe">' + detalhe + '</p>' : '') + '</div>';
    }

    function itemAviso(a) {
      var ref = a.ref || {};
      var botoes = [];
      if (a.tipo === 'cancelamento' && !a.resolvido) {
        botoes.push('<button type="button" class="ui-botao ui-botao--mini ui-botao--primario" data-acao="aprovar" data-valor="' + ref.pedidoId + '">Aprovar</button>');
        botoes.push('<button type="button" class="ui-botao ui-botao--mini ui-botao--perigo" data-acao="recusar" data-valor="' + ref.pedidoId + '">Recusar</button>');
      }
      if (a.tipo === 'turno' && ref.opId && N.turnos[ref.opId] && N.turnos[ref.opId].estado === 'aguardando') {
        botoes.push('<button type="button" class="ui-botao ui-botao--mini ui-botao--primario" data-acao="conferir" data-valor="' + ref.opId + '">Conferir turno</button>');
      }
      if (!a.lida) botoes.push('<button type="button" class="ui-botao ui-botao--mini" data-acao="lido" data-valor="' + a.id + '">Lida</button>');
      return '<li class="ui-cel-aviso ui-aviso-item--' + a.tipo + (a.lida ? ' ui-aviso-item--lido' : '') + '"><p class="ui-aviso-item__meta"><span class="ui-aviso-tag ui-aviso-tag--' + a.tipo + '">' +
        A.TIPOS[a.tipo] + '</span><span>' + R.tempoDecorrido(a.ts) + '</span></p><p class="ui-cel-aviso__titulo">' + R.esc(a.titulo) + '</p>' +
        '<p class="ui-cel-aviso__loja">' + C.UNIDADES[a.unidade] + '. ' + R.esc(a.resolvido || a.detalhe) + '</p>' +
        (botoes.length ? '<div class="ui-aviso-item__acoes">' + botoes.join('') + '</div>' : '') + '</li>';
    }

    function listaAvisos(limite) {
      var lista = E.doEscopo(escopo).slice().sort(function (a, b) { return (a.lida - b.lida) || (b.ts - a.ts); });
      if (limite) lista = lista.filter(function (a) { return !a.lida; }).slice(0, limite);
      return lista.length ? '<ul class="ui-cel-avisos">' + lista.map(itemAviso).join('') + '</ul>' : '<p class="ui-vazio">Nada pendente aqui. Bom sinal.</p>';
    }

    function inicio() {
      var d = N.resumoEscopo(escopo);
      var naCozinha = R.pedidos.filter(function (p) { return R.naCozinha(p) && (p.estado === 'fila' || p.estado === 'preparo'); }).length;
      return cartao('Faturamento líquido', R.reais(d.valor), d.pedidos + ' pedidos no dia', true) +
        '<div class="ui-cel-duas">' + cartao('Ticket médio', R.reais(Math.round(d.valor / d.pedidos))) + cartao('Carvões extra', d.carvoes) + '</div>' +
        (escopo === 'u1' ? cartao('Na cozinha agora', naCozinha, 'Na fila ou em preparo') : '') +
        '<section class="ui-cel-bloco"><h3 class="ui-cel-bloco__titulo">Pedidos por hora</h3>' + K.grafico(d.horas, 80) + '</section>' +
        '<section class="ui-cel-bloco"><h3 class="ui-cel-bloco__titulo">Precisa de você</h3>' + listaAvisos(3) + '</section>';
    }

    function estoque() {
      if (escopo !== 'u1') return '<section class="ui-cel-bloco"><h3 class="ui-cel-bloco__titulo">Estoque por loja</h3>' + K.estoque(true) + '</section>' +
        '<p class="ui-ajuda">Escolha uma loja no topo para ver a lista de compras dela.</p>';
      var c = E.contarStatus();
      return '<div class="ui-cel-duas">' + cartao('Em falta', c.falta) + cartao('Estoque baixo', c.baixo) + '</div>' +
        '<section class="ui-cel-bloco"><h3 class="ui-cel-bloco__titulo">Lista de compras</h3><ul class="ui-compras">' + E.listaCompras().map(function (i) {
          return '<li><span>' + R.esc(C.rotuloSabor(i.sabor)) + '<small>' + E.pacotes(i.sabor.estoque) + ', mínimo ' + i.sabor.minimo + '</small></span><strong>' + i.sugestao + ' pct</strong></li>';
        }).join('') + '</ul></section>';
    }

    function turnos() {
      return '<section class="ui-cel-bloco"><h3 class="ui-cel-bloco__titulo">Fechamentos de turno</h3>' + K.fechamentos(escopo !== 'u1') + '</section>' +
        (escopo !== 'u1' ? '<p class="ui-ajuda">Escolha ' + C.UNIDADES.u1 + ' no topo para conferir os turnos dela.</p>' : '');
    }

    function desenhar() {
      var n = E.naoLidos(escopo);
      var corpo = aba === 'inicio' ? inicio() : aba === 'avisos' ? '<div class="ui-linha ui-linha--entre"><p class="ui-cel-sub">' + A.rotuloEscopo(escopo) + '</p>' +
        '<button type="button" class="ui-botao ui-botao--mini" data-acao="todos"' + (n ? '' : ' disabled') + '>Marcar todas como lidas</button></div>' + listaAvisos() :
        aba === 'estoque' ? estoque() : turnos();
      U.desenhar(raiz, '<header class="ui-cel-topo"><div class="ui-cel-topo__marca"><span class="ui-brasa" aria-hidden="true"></span>Rosh</div>' +
        '<label class="ui-cel-loja"><span class="ui-oculto">Unidade</span><select data-entrada="unidade" data-foco="unidade">' +
        [['todas', 'Todas as unidades'], ['u1', C.UNIDADES.u1], ['u2', C.UNIDADES.u2], ['u3', C.UNIDADES.u3]].map(function (o) {
          return '<option value="' + o[0] + '"' + (o[0] === escopo ? ' selected' : '') + '>' + o[1] + '</option>';
        }).join('') + '</select></label></header>' +
        '<p class="ui-cel-dia">' + R.rotuloDia() + '</p>' +
        '<main class="ui-cel-corpo">' + corpo + '</main>' +
        '<nav class="ui-cel-nav" aria-label="Seções">' + ABAS.map(function (a) {
          return '<button type="button" class="ui-cel-nav__item" data-acao="aba" data-valor="' + a.id + '" data-foco="cel-' + a.id + '"' + (aba === a.id ? ' aria-current="page"' : '') + '>' +
            '<svg viewBox="0 0 24 24" aria-hidden="true">' + a.icone + '</svg><span>' + a.nome + '</span>' +
            (a.id === 'avisos' && n ? '<span class="ui-cel-nav__n">' + n + '</span>' : '') + '</button>';
        }).join('') + '</nav>');
    }

    raiz.addEventListener('click', function (ev) {
      var alvo = ev.target.closest('[data-acao]');
      if (!alvo || alvo.disabled) return;
      var nome = alvo.getAttribute('data-acao');
      var valor = alvo.getAttribute('data-valor') || alvo.getAttribute('data-id');
      if (nome === 'aba') {
        aba = valor;
        raiz.querySelector('.ui-cel-corpo').scrollTop = 0;
        return desenhar();
      }
      if (nome === 'ver-estoque') {
        aba = 'estoque';
        return desenhar();
      }
      if (nome === 'conferir' && alvo.hasAttribute('data-id')) {
        N.conferirTurno(valor);
        return U.aviso(tela, 'Turno conferido');
      }
      A.executar(tela, nome, valor, escopo);
    });

    raiz.addEventListener('change', function (ev) {
      if (ev.target.getAttribute('data-entrada') !== 'unidade') return;
      escopo = ev.target.value;
      desenhar();
    });

    R.ao(desenhar);
    desenhar();
  }

  window.RoshCelular = { montar: montar };
})();
