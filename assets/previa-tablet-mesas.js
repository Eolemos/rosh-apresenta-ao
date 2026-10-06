/* Prévia das telas: mapa de mesas e reposição de carvão no tablet do garçom */
(function () {
  'use strict';

  var R = window.Rosh;
  var C = window.RoshCatalogo;
  var U = window.RoshUI;
  var M = window.RoshMesas;
  var A = window.RoshAcesso;

  function linhaStatus(info) {
    if (!info.ocupada) return 'Livre';
    return 'Narguilé há ' + R.minutos(info.narguileEm) + ' min, último carvão há ' + R.minutos(info.ultimoCarvaoEm) + ' min';
  }

  // Reposição só de carvão; as mesas ocupadas aparecem primeiro, as com carvão atrasado no topo
  function reposicao(tela, mesaInicial) {
    var r = { mesa: mesaInicial || null, qtd: 1, pagamento: null };
    var preco = C.preco(C.porId(C.ADICIONAIS, 'carvao'));
    function botaoMesa(m) {
      var info = M.infoMesa(m);
      return '<button type="button" class="ui-opcao ui-opcao--mesa-linha' + (info.carvaoAtrasado ? ' ui-opcao--carvao' : '') + '" data-acao="mesa" data-valor="' + m +
        '" aria-pressed="' + (r.mesa === m) + '"><strong>' + R.nomeMesa(m) + '</strong><span>' + linhaStatus(info) + '</span></button>';
    }
    function corpo() {
      var ocupadas = C.MESAS.filter(function (m) { return M.infoMesa(m).ocupada; })
        .sort(function (a, b) { return M.infoMesa(a).ultimoCarvaoEm - M.infoMesa(b).ultimoCarvaoEm; });
      var livres = C.MESAS.filter(function (m) { return !M.infoMesa(m).ocupada; });
      return '<h2 class="ui-modal__titulo">Reposição de carvão</h2>' +
        '<p class="ui-modal__texto">Pedido só de carvão para uma mesa. Mesas ocupadas primeiro; laranja é carvão há mais de ' + M.LIMITE_CARVAO + ' min.</p>' +
        '<div class="ui-mesas-lista">' + ocupadas.map(botaoMesa).join('') + '</div>' +
        (livres.length ? '<details class="ui-mesas-livres"><summary>Mesas livres (' + livres.length + ')</summary><div class="ui-grade ui-grade--mesas-modal">' +
          livres.map(function (m) {
            return '<button type="button" class="ui-opcao ui-opcao--mesa" data-acao="mesa" data-valor="' + m + '" aria-pressed="' + (r.mesa === m) + '">' + m + '</button>';
          }).join('') + '</div></details>' : '') +
        '<div class="ui-adicional ui-adicional--modal"><div><p class="ui-adicional__nome">Carvões</p><p class="ui-adicional__preco">' + R.reais(preco) + ' cada</p></div>' +
        U.contador('carvao', r.qtd, 'Carvões', 1) + '</div>' +
        '<h3 class="ui-rotulo">Pagamento, na hora</h3><div class="ui-grade ui-grade--pagamento">' + U.botoesPagamento(r.pagamento, 'rep-') + '</div>' +
        (r.pagamento && r.pagamento !== 'dinheiro' ? '<p class="ui-cobre">Cobre ' + (r.pagamento === 'pix' ? 'no Pix' : 'na maquininha') + ' antes de confirmar.</p>' : '') +
        '<div class="ui-modal__acoes"><button type="button" class="ui-botao" data-acao="cancelar">Cancelar</button>' +
        '<button type="button" class="ui-botao ui-botao--primario ui-botao--duas" data-acao="finalizar"' + (r.mesa && r.pagamento ? '' : ' disabled') + '>' +
        '<span>' + (r.pagamento ? 'Pagamento recebido' : 'Escolha a mesa e o pagamento') + '</span><span class="ui-botao__sub">' + R.reais(preco * r.qtd) +
        (r.pagamento ? ' ' + { dinheiro: 'em dinheiro', cartao: 'no cartão', pix: 'no Pix' }[r.pagamento] : '') + '</span></button></div>';
    }
    var modal = U.abrirModal(tela, corpo(), function (alvo, fechar, fundo) {
      var nome = alvo.getAttribute('data-acao');
      var valor = alvo.getAttribute('data-valor');
      if (nome === 'cancelar') return fechar();
      if (nome === 'finalizar') {
        var p = R.criarPedido({ tipo: 'reposicao', mesa: r.mesa, carvoes: r.qtd, pagamento: r.pagamento, vendedorId: A.operador('tablet'), treino: A.emTreino('tablet') });
        fechar();
        U.aviso(tela, 'Reposição de ' + p.carvoes + (p.carvoes === 1 ? ' carvão' : ' carvões') + ' para a ' + R.nomeMesa(p.mesa) + ', vai em 5 s', {
          rotulo: 'Desfazer', fn: function () { U.aviso(tela, R.desfazer(p.id) ? 'Reposição desfeita' : 'A cozinha já recebeu'); }
        }, 5000);
        return;
      }
      if (nome === 'mesa') r.mesa = valor;
      if (nome === 'mais') r.qtd = Math.min(9, r.qtd + 1);
      if (nome === 'menos') r.qtd = Math.max(1, r.qtd - 1);
      if (nome === 'pagamento') r.pagamento = valor;
      var aberto = fundo.querySelector('details') && fundo.querySelector('details').open;
      fundo.querySelector('.ui-modal__caixa').innerHTML = corpo();
      if (aberto) fundo.querySelector('details').open = true;
    });
    modal.el.querySelector('.ui-modal__caixa').classList.add('ui-modal__caixa--largo');
  }

  function liberar(tela, m) {
    var info = M.infoMesa(m);
    if (!info.credito) {
      M.liberarMesa(m, A.operador('tablet'));
      return U.aviso(tela, R.nomeMesa(m) + ' liberada para o próximo cliente');
    }
    U.abrirModal(tela, '<h2 class="ui-modal__titulo">Liberar a ' + R.nomeMesa(m) + '?</h2>' +
      '<p class="ui-modal__texto">A mesa ainda tem 1 rosh grátis do pedido 0' + info.credito.origem + '. Liberar encerra esse rosh grátis: o próximo cliente não herda o crédito.</p>' +
      '<div class="ui-modal__acoes"><button type="button" class="ui-botao" data-acao="nao">Voltar</button>' +
      '<button type="button" class="ui-botao ui-botao--perigo" data-acao="sim">Liberar e encerrar o crédito</button></div>', function (alvo, fechar) {
      fechar();
      if (alvo.getAttribute('data-acao') === 'sim') {
        M.liberarMesa(m, A.operador('tablet'));
        U.aviso(tela, R.nomeMesa(m) + ' liberada; o rosh grátis foi encerrado');
      }
    });
  }

  // Mapa de mesas: quem está ocupado, há quanto tempo, carvão e rosh grátis
  function abrir(tela) {
    function corpo() {
      return '<h2 class="ui-modal__titulo">Mapa de mesas</h2><p class="ui-modal__texto">Laranja: o último carvão foi há mais de ' + M.LIMITE_CARVAO + ' min. Quando o cliente for embora, toque em Liberar mesa.</p>' +
        '<div class="ui-mapa">' + C.MESAS.map(function (m) {
          var info = M.infoMesa(m);
          return '<div class="ui-mapa__mesa' + (info.ocupada ? ' ui-mapa__mesa--ocupada' : '') + (info.carvaoAtrasado ? ' ui-mapa__mesa--carvao' : '') + '">' +
            '<p class="ui-mapa__nome">' + R.nomeMesa(m) + '</p>' +
            (info.ocupada ? '<p class="ui-mapa__linha">Narguilé há ' + R.minutos(info.narguileEm) + ' min</p><p class="ui-mapa__linha">Último carvão há ' + R.minutos(info.ultimoCarvaoEm) + ' min</p>' :
              '<p class="ui-mapa__linha">Livre</p>') +
            (info.credito ? '<p class="ui-mapa__credito">1 rosh grátis até ' + R.hora(info.credito.validoAte) + '</p>' : '') +
            '<div class="ui-mapa__acoes">' +
            (info.carvaoAtrasado ? '<button type="button" class="ui-botao ui-botao--mini ui-botao--brasa" data-acao="carvao" data-valor="' + m + '">Oferecer carvão</button>' : '') +
            (info.ocupada || info.credito ? '<button type="button" class="ui-botao ui-botao--mini" data-acao="liberar" data-valor="' + m + '">Liberar mesa</button>' : '') +
            '</div></div>';
        }).join('') + '</div><div class="ui-modal__acoes"><button type="button" class="ui-botao" data-acao="fechar">Fechar</button></div>';
    }
    var modal = U.abrirModal(tela, corpo(), function (alvo, fechar) {
      var nome = alvo.getAttribute('data-acao');
      var m = alvo.getAttribute('data-valor');
      fechar();
      if (nome === 'carvao') reposicao(tela, m);
      if (nome === 'liberar') liberar(tela, m);
    });
    modal.el.querySelector('.ui-modal__caixa').classList.add('ui-modal__caixa--mapa');
  }

  window.RoshMapaMesas = { abrir: abrir, reposicao: reposicao };
})();
