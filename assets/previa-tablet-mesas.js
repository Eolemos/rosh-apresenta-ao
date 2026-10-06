/* Prévia das telas: mesas abertas (com busca) e reposição de carvão, no tablet do garçom e no caixa */
(function () {
  'use strict';

  var R = window.Rosh;
  var C = window.RoshCatalogo;
  var U = window.RoshUI;
  var M = window.RoshMesas;
  var A = window.RoshAcesso;
  var ME = window.RoshMesaEscolha;

  // Reposição só de carvão para uma mesa aberta; quem está há mais tempo sem carvão aparece primeiro
  function reposicao(tela, mesaInicial, aparelho) {
    var quem = aparelho || 'tablet';
    var r = { mesa: mesaInicial || null, qtd: 1, pagamento: null };
    var preco = C.preco(C.porId(C.ADICIONAIS, 'carvao'));
    function corpo() {
      return '<h2 class="ui-modal__titulo">Reposição de carvão</h2>' +
        '<p class="ui-modal__texto">Pedido só de carvão para uma mesa aberta. Laranja é carvão há mais de ' + M.LIMITE_CARVAO + ' min.</p>' +
        ME.linhas(r.mesa) +
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
        var p = R.criarPedido({ tipo: 'reposicao', mesa: r.mesa, carvoes: r.qtd, pagamento: r.pagamento, vendedorId: A.operador(quem), treino: A.emTreino(quem) });
        fechar();
        U.aviso(tela, 'Reposição de ' + p.carvoes + (p.carvoes === 1 ? ' carvão' : ' carvões') + ' para ' + R.nomeMesa(p.mesa) + ', vai em 5 s', {
          rotulo: 'Desfazer', fn: function () { U.aviso(tela, R.desfazer(p.id) ? 'Reposição desfeita' : 'A cozinha já recebeu'); }
        }, 5000);
        return;
      }
      if (nome === 'mesa') r.mesa = valor;
      if (nome === 'mais') r.qtd = Math.min(9, r.qtd + 1);
      if (nome === 'menos') r.qtd = Math.max(1, r.qtd - 1);
      if (nome === 'pagamento') r.pagamento = valor;
      fundo.querySelector('.ui-modal__caixa').innerHTML = corpo();
    });
    modal.el.querySelector('.ui-modal__caixa').classList.add('ui-modal__caixa--largo');
  }

  // Liberar fecha a mesa; se ainda houver rosh grátis, pede confirmação antes
  function liberar(tela, id, aparelho, depois) {
    var info = M.infoMesa(id);
    var nome = R.nomeMesa(id);
    var falta = M.pendentes(id);
    if (falta) {
      U.aviso(tela, nome + ' ainda tem ' + falta + (falta === 1 ? ' pedido que não foi entregue' : ' pedidos que não foram entregues') + '. Entregue ou peça o cancelamento antes de liberar');
      return depois();
    }
    if (!info.credito) {
      M.liberarMesa(id, A.operador(aparelho));
      U.aviso(tela, nome + ' liberada: a mesa foi fechada');
      return depois();
    }
    U.abrirModal(tela, '<h2 class="ui-modal__titulo">Liberar ' + R.esc(nome) + '?</h2>' +
      '<p class="ui-modal__texto">A mesa ainda tem 1 rosh grátis do pedido 0' + info.credito.origem + '. Liberar fecha a mesa e encerra esse rosh grátis.</p>' +
      '<div class="ui-modal__acoes"><button type="button" class="ui-botao" data-acao="nao">Voltar</button>' +
      '<button type="button" class="ui-botao ui-botao--perigo" data-acao="sim">Liberar e encerrar o crédito</button></div>', function (alvo, fechar) {
      fechar();
      if (alvo.getAttribute('data-acao') === 'sim') {
        M.liberarMesa(id, A.operador(aparelho));
        U.aviso(tela, nome + ' liberada; o rosh grátis foi encerrado');
      }
      depois();
    });
  }

  function cartao(m) {
    var info = M.infoMesa(m.id);
    return '<article class="ui-mapa__mesa' + (info.carvaoAtrasado ? ' ui-mapa__mesa--carvao' : '') + '" data-mesa="' + m.id + '">' +
      '<div class="ui-mapa__cabeca"><h3 class="ui-mapa__nome">' + R.esc(m.nome) + '</h3>' +
      '<button type="button" class="ui-link ui-mapa__editar" data-acao="editar" data-valor="' + m.id + '">Editar mesa</button></div>' +
      (m.descricao ? '<p class="ui-mapa__desc">' + R.esc(m.descricao) + '</p>' : '') +
      (info.narguileEm ? '<p class="ui-mapa__linha">Narguilé há ' + R.minutos(info.narguileEm) + ' min</p><p class="ui-mapa__linha' + (info.carvaoAtrasado ? ' ui-mapa__linha--alerta' : '') + '">' +
        (info.carvaoAtrasado ? U.ICONES.brasa : '') + 'Último carvão há ' + R.minutos(info.ultimoCarvaoEm) + ' min' + (info.carvaoAtrasado ? ', ofereça carvão' : '') + '</p>' :
        '<p class="ui-mapa__linha">Sem pedido ainda</p>') +
      (info.credito ? '<p class="ui-mapa__credito">' + U.ICONES.presente + '1 rosh grátis até ' + R.hora(info.credito.validoAte) + '</p>' : '') +
      '<p class="ui-mapa__quem">Aberta por ' + C.OPERADORES[m.abertaPor].nome + ' às ' + R.hora(m.abertaEm) + '</p>' +
      '<div class="ui-mapa__acoes">' +
      (info.narguileEm ? '<button type="button" class="ui-botao ui-botao--mini' + (info.carvaoAtrasado ? ' ui-botao--brasa' : '') + '" data-acao="carvao" data-valor="' + m.id + '">' +
        (info.carvaoAtrasado ? 'Oferecer carvão' : 'Mais carvão') + '</button>' : '') +
      '<button type="button" class="ui-botao ui-botao--mini" data-acao="liberar" data-valor="' + m.id + '">Liberar mesa</button></div></article>';
  }

  // Quem precisa de carvão vem primeiro; depois, da mesa mais nova para a mais antiga
  function cartoes(termo) {
    var lista = ME.filtrar(termo).sort(function (a, b) { return M.infoMesa(b.id).carvaoAtrasado - M.infoMesa(a.id).carvaoAtrasado; });
    if (lista.length) return lista.map(cartao).join('');
    return '<p class="ui-vazio">' + (M.abertas().length ? 'Nenhuma mesa aberta com esse nome ou descrição.' : 'Nenhuma mesa aberta agora. Toque em Nova mesa para começar.') + '</p>';
  }

  // Mesas abertas: todos da equipe veem todas, com tempo de narguilé, carvão e rosh grátis
  function abrir(tela, aparelho) {
    var quem = aparelho || 'tablet';
    var termo = '';
    function voltar() { abrir(tela, quem); }
    var n = M.abertas().length;
    var modal = U.abrirModal(tela, '<h2 class="ui-modal__titulo">Mesas abertas <span class="ui-lateral__qtd">' + n + '</span></h2>' +
      '<p class="ui-modal__texto">Toda a equipe vê todas as mesas. Laranja: último carvão há mais de ' + M.LIMITE_CARVAO + ' min. Quando o cliente for embora, toque em Liberar mesa.</p>' +
      '<div class="ui-mapa__topo"><label class="ui-busca">' + U.ICONES.busca + '<span class="ui-oculto">Buscar mesa pelo nome ou descrição</span>' +
      '<input type="search" data-entrada="busca-mapa" autocomplete="off" placeholder="Buscar pelo nome ou descrição"></label>' +
      '<button type="button" class="ui-botao ui-botao--brasa" data-acao="nova">Nova mesa</button></div>' +
      '<div class="ui-mapa" data-parte="mesas">' + cartoes(termo) + '</div>' +
      '<div class="ui-modal__acoes"><p class="ui-form__nota">Mesa esquecida aberta fecha sozinha na virada do dia, às 6h.</p>' +
      '<button type="button" class="ui-botao" data-acao="fechar">Fechar</button></div>', function (alvo, fechar) {
      var nome = alvo.getAttribute('data-acao');
      var id = alvo.getAttribute('data-valor');
      fechar();
      if (nome === 'carvao') reposicao(tela, id, quem);
      if (nome === 'liberar') liberar(tela, id, quem, voltar);
      if (nome === 'editar') ME.editar(tela, id, voltar);
      if (nome === 'nova') ME.nova(tela, A.operador(quem), voltar);
    });
    modal.el.querySelector('.ui-modal__caixa').classList.add('ui-modal__caixa--mapa');
    modal.el.addEventListener('input', function (ev) {
      if (ev.target.getAttribute('data-entrada') !== 'busca-mapa') return;
      termo = ev.target.value;
      modal.el.querySelector('[data-parte="mesas"]').innerHTML = cartoes(termo);
    });
  }

  window.RoshMapaMesas = { abrir: abrir, reposicao: reposicao };
})();
