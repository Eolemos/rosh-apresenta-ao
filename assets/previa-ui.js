/* Prévia das telas: utilidades de interface compartilhadas pelas telas */
(function () {
  'use strict';

  var R = window.Rosh;
  var C = window.RoshCatalogo;

  var ICONES = {
    dinheiro: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v5M18 9.5v5"/></svg>',
    cartao: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="5.5" width="19" height="13" rx="2"/><path d="M2.5 10h19M6 15h4"/></svg>',
    pix: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5 20.5 12 12 20.5 3.5 12Z"/><path d="M8.5 12h7M12 8.5v7"/></svg>',
    sino: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15Z"/><path d="M10 20.5a2 2 0 0 0 4 0"/></svg>',
    imprimir: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 9V4h10v5"/><rect x="3.5" y="9" width="17" height="8" rx="2"/><path d="M7 14h10v6H7Z"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    brasa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-4 2.5-5.5.3 1.6 1.2 2.6 2.5 3C11.5 8 11 5.5 12 3Z"/></svg>',
    busca: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/></svg>',
    voltar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5.5 8 12l6.5 6.5"/></svg>',
    fechar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>',
    presente: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="9" width="16" height="11" rx="1.5"/><path d="M3 9h18M12 9v11M12 9c-2.5 0-4.5-1-4.5-3S10 3.5 12 9Zm0 0c2.5 0 4.5-1 4.5-3S14 3.5 12 9Z"/></svg>'
  };

  // Recria o HTML de uma tela sem perder o foco nem a posição do cursor
  function desenhar(raiz, html) {
    var ativo = document.activeElement;
    var chave = ativo && raiz.contains(ativo) ? ativo.getAttribute('data-foco') : null;
    var cursor = chave && ativo.setSelectionRange && typeof ativo.selectionStart === 'number' ? ativo.selectionStart : null;
    raiz.innerHTML = html;
    if (!chave) return;
    var alvo = raiz.querySelector('[data-foco="' + chave + '"]');
    if (!alvo) return;
    alvo.focus({ preventScroll: true });
    if (cursor !== null && alvo.setSelectionRange) alvo.setSelectionRange(cursor, cursor);
  }

  var ROTULO_ESTADO = { fila: 'Na fila', preparo: 'Em preparo', pronto: 'Pronto', entregue: 'Entregue', cancelado: 'Cancelado' };

  function chipEstado(estado) {
    return '<span class="ui-estado ui-estado--' + estado + '">' + ROTULO_ESTADO[estado] + '</span>';
  }

  function vendedor(opId) {
    var op = C.OPERADORES[opId];
    return op.nome + ' (' + op.cargo + ')';
  }

  function rotuloAdicionais(adicionais) {
    return C.ADICIONAIS.filter(function (a) { return adicionais[a.id]; }).map(function (a) {
      var n = adicionais[a.id];
      return '+' + n + ' ' + (n === 1 || !a.plural ? a.nome.toLowerCase() : a.plural);
    }).join(', ');
  }

  function nomeSabor(id) {
    return C.rotuloSabor(R.sabor(id));
  }

  // Aviso rápido no pé da tela; pode ter uma ação (ex.: Desfazer) e durar mais
  function aviso(tela, texto, acao, duracao) {
    var raiz = tela.querySelector('.ui') || tela;
    var antigo = raiz.querySelector('.ui-aviso');
    if (antigo) antigo.remove();
    var el = document.createElement('div');
    el.className = 'ui-aviso' + (acao ? ' ui-aviso--acao' : '');
    el.setAttribute('role', 'status');
    el.innerHTML = ICONES.check + '<span>' + R.esc(texto) + '</span>' +
      (acao ? '<button type="button" class="ui-aviso__botao">' + R.esc(acao.rotulo) + '</button>' : '');
    raiz.appendChild(el);
    if (acao) {
      el.querySelector('button').addEventListener('click', function () {
        el.remove();
        acao.fn();
      });
    }
    var tempo = duracao || 2600;
    setTimeout(function () { el.classList.add('ui-aviso--saindo'); }, tempo);
    setTimeout(function () { el.remove(); }, tempo + 500);
  }

  // Diálogo dentro de uma tela; devolve o elemento e a função de fechar
  function abrirModal(tela, html, aoClicar) {
    var raiz = tela.querySelector('.ui') || tela;
    var anterior = document.activeElement;
    var fundo = document.createElement('div');
    fundo.className = 'ui-modal';
    fundo.innerHTML = '<div class="ui-modal__caixa" role="dialog" aria-modal="true">' + html + '</div>';
    raiz.appendChild(fundo);
    function fechar() {
      fundo.remove();
      if (anterior && document.contains(anterior)) anterior.focus({ preventScroll: true });
    }
    fundo.addEventListener('click', function (ev) {
      var alvo = ev.target.closest('[data-acao]');
      if (alvo && !alvo.disabled) aoClicar(alvo, fechar, fundo);
    });
    fundo.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') fechar();
    });
    var foco = fundo.querySelector('[data-autofoco]') || fundo.querySelector('button:not(:disabled)');
    if (foco) foco.focus({ preventScroll: true });
    return { el: fundo, fechar: fechar };
  }

  function linhaComanda(texto) {
    return '<div>' + R.esc(texto) + '</div>';
  }

  function linhaValor(texto, valor) {
    return '<div class="comanda__linha"><span>' + R.esc(texto) + '</span><span>' + valor + '</span></div>';
  }

  // Partes da conta com nome: rosh, acréscimo premium, adicionais, desconto e total
  function partesConta(conta) {
    var partes = [['Rosh', R.reais(conta.rosh)]];
    if (conta.premium) partes.push(['Acréscimo premium (' + conta.marcasPremium.join(', ') + ')', R.reais(conta.premium)]);
    if (conta.adicionais) partes.push(['Adicionais', R.reais(conta.adicionais)]);
    if (conta.desconto || (conta.rotulo && conta.subtotal)) partes.push(['Desconto' + (conta.rotulo ? ' (' + conta.rotulo + ')' : ''), (conta.desconto ? '−' : '') + R.reais(conta.desconto)]);
    return partes;
  }

  function htmlConta(conta, classe) {
    return '<dl class="ui-conta-lista' + (classe ? ' ' + classe : '') + '">' + partesConta(conta).map(function (pt) {
      return '<div' + (pt[0].indexOf('Desconto') === 0 ? ' class="ui-conta-lista__desconto"' : '') + '><dt>' + R.esc(pt[0]) + '</dt><dd>' + pt[1] + '</dd></div>';
    }).join('') + '<div class="ui-conta-lista__total"><dt>Total</dt><dd>' + R.reais(conta.total) + '</dd></div></dl>';
  }

  function linhasItem(item, i, total) {
    return '<div><strong>' + (total > 1 ? 'Narguilé ' + (i + 1) + ': ' : '1x ') + R.esc(R.rosh(item.roshId).nome) + '</strong></div>' +
      item.sabores.map(function (id) { return '<div>&nbsp;&nbsp;' + R.esc(nomeSabor(id)) + '</div>'; }).join('') +
      (rotuloAdicionais(item.adicionais) ? '<div>&nbsp;&nbsp;' + R.esc(rotuloAdicionais(item.adicionais)) + '</div>' : '') +
      (item.gelo ? '<div>&nbsp;&nbsp;Obs: gelo no vaso</div>' : '');
  }

  // Comanda térmica da cozinha (mesma aparência da apresentação)
  function comandaPedido(p) {
    var topo = (p.treino ? '<div class="comanda__centro"><strong>*** TREINO, NÃO PREPARAR ***</strong></div>' : '') +
      '<div class="comanda__centro">Cozinha' + (p.alteradoEm ? ', alterado ' + R.hora(p.alteradoEm) : '') + '</div>' +
      '<div class="comanda__linha"><span>' + R.hora(p.criadoEm) + '</span><span>Pedido 0' + p.numero + '</span></div>';
    var rodape = '<hr class="comanda__corte">' +
      (p.rotuloDesconto ? linhaComanda('Promoção: ' + p.rotuloDesconto) : '') +
      (p.segundo ? linhaComanda('Promoção: rosh duplo, 2º rosh') : '') +
      linhaComanda('Vendido por: ' + vendedor(p.vendedorId)) +
      linhaComanda('Pagamento: ' + (p.pagamento ? R.pagamento(p.pagamento).nome.toLowerCase() : 'sem cobrança'));
    if (p.tipo === 'reposicao') {
      return topo + '<div class="comanda__centro"><strong>Reposição de carvão</strong></div>' +
        '<div class="comanda__mesa">' + R.esc(R.nomeMesa(p.mesa).toUpperCase()) + '</div><hr class="comanda__corte">' +
        '<div><strong>' + p.carvoes + (p.carvoes === 1 ? ' carvão' : ' carvões') + '</strong></div>' + rodape;
    }
    return topo + '<div class="comanda__mesa">' + R.esc(R.nomeMesa(p.mesa).toUpperCase()) + '</div>' +
      (p.segundo ? '<div class="comanda__centro"><strong>2º rosh (rosh duplo)</strong></div>' : '') +
      '<hr class="comanda__corte">' + p.itens.map(function (item, i) { return linhasItem(item, i, p.itens.length); }).join('') + rodape;
  }

  // Comprovante do cliente com a conta aberta em partes
  function comprovante(p) {
    return (p.treino ? '<div class="comanda__centro"><strong>*** TREINO ***</strong></div>' : '') +
      '<div class="comanda__centro">Comprovante, não fiscal</div>' +
      '<div class="comanda__linha"><span>' + R.hora(p.criadoEm) + '</span><span>Pedido 0' + p.numero + '</span></div>' +
      '<div class="comanda__centro">' + R.esc(R.nomeMesa(p.mesa)) + '</div><hr class="comanda__corte">' +
      partesConta(p.conta).map(function (pt) { return linhaValor(pt[0], pt[1]); }).join('') +
      '<hr class="comanda__corte">' + linhaValor('Total', R.reais(p.total)) +
      (p.pagamento ? linhaValor('Pago no ' + R.pagamento(p.pagamento).nome.toLowerCase(), R.reais(p.recebido || p.total)) : '') +
      (p.pagamento === 'dinheiro' && p.recebido > p.total ? linhaValor('Troco', R.reais(p.recebido - p.total)) : '');
  }

  // Botões de menos e mais com a quantidade no meio
  function contador(chave, valor, rotulo, minimo) {
    return '<div class="ui-qtd" role="group" aria-label="' + rotulo + '">' +
      '<button type="button" class="ui-qtd__botao" data-acao="menos" data-valor="' + chave + '" data-foco="menos-' + chave + '"' +
      (valor <= (minimo || 0) ? ' disabled' : '') + ' aria-label="Menos ' + rotulo.toLowerCase() + '">−</button>' +
      '<span class="ui-qtd__valor" aria-live="polite">' + valor + '</span>' +
      '<button type="button" class="ui-qtd__botao" data-acao="mais" data-valor="' + chave + '" data-foco="mais-' + chave + '"' +
      ' aria-label="Mais ' + rotulo.toLowerCase() + '">+</button></div>';
  }

  function botoesPagamento(selecionado, prefixo, desativado) {
    return C.PAGAMENTOS.map(function (pg) {
      return '<button type="button" class="ui-opcao ui-opcao--pagamento" data-acao="pagamento" data-valor="' + pg.id +
        '" data-foco="' + prefixo + pg.id + '" aria-pressed="' + (selecionado === pg.id) + '"' + (desativado ? ' disabled' : '') + '>' +
        ICONES[pg.id] + '<span>' + pg.nome + '</span></button>';
    }).join('');
  }

  window.RoshUI = {
    ICONES: ICONES,
    desenhar: desenhar,
    chipEstado: chipEstado,
    vendedor: vendedor,
    rotuloAdicionais: rotuloAdicionais,
    nomeSabor: nomeSabor,
    aviso: aviso,
    abrirModal: abrirModal,
    comandaPedido: comandaPedido,
    comprovante: comprovante,
    partesConta: partesConta,
    htmlConta: htmlConta,
    contador: contador,
    botoesPagamento: botoesPagamento
  };
})();
