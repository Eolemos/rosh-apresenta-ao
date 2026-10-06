/* Prévia das telas: conta e pagamento do pedido (narguilés, promoção, confirmação do pagamento) */
(function () {
  'use strict';

  var R = window.Rosh;
  var C = window.RoshCatalogo;
  var U = window.RoshUI;
  var E = window.RoshEssencias;
  var A = window.RoshAcesso;

  var FORMA = { dinheiro: 'em dinheiro', cartao: 'no cartão', pix: 'no Pix' };

  function conta(ctx) { return R.calcular(ctx.sel); }

  function prontos(sel) {
    return sel.itens.filter(function (i) { return i.roshId && i.sabores.length; });
  }

  function faltando(ctx) {
    var sel = ctx.sel;
    var falta = [];
    if (!sel.mesa) falta.push(ctx.cfg.modo === 'caixa' ? 'mesa ou balcão' : 'mesa');
    sel.itens.forEach(function (i, n) {
      var nome = sel.itens.length > 1 ? ' do narguilé ' + (n + 1) : '';
      if (!i.roshId) falta.push('tipo de rosh' + nome);
      else if (!i.sabores.length) falta.push('sabor' + nome);
    });
    var total = conta(ctx).total;
    if (total > 0 && !sel.pagamento) falta.push('forma de pagamento');
    if (total > 0 && sel.pagamento === 'dinheiro' && sel.recebido < total) falta.push('valor recebido em dinheiro');
    return falta;
  }

  function htmlItens(ctx) {
    var sel = ctx.sel;
    var c = conta(ctx);
    return sel.itens.map(function (item, i) {
      var preco = c.itens[i];
      var incompleto = !item.roshId || !item.sabores.length;
      return '<li class="ui-carrinho__item' + (incompleto ? ' ui-carrinho__item--falta' : '') + '"><div class="ui-carrinho__texto">' +
        '<p class="ui-carrinho__nome">Narguilé ' + (i + 1) + ': ' + (item.roshId ? R.esc(R.rosh(item.roshId).nome) : 'tipo a escolher') + '</p>' +
        '<p class="ui-carrinho__detalhe">' + (item.sabores.length ? R.esc(E.resumo(item)) : 'Falta escolher o sabor') +
        (U.rotuloAdicionais(item.adicionais) ? ', ' + R.esc(U.rotuloAdicionais(item.adicionais)) : '') + (item.gelo ? ', gelo no vaso' : '') + '</p>' +
        (preco.premium ? '<p class="ui-carrinho__detalhe">Inclui acréscimo premium ' + R.esc(preco.marcaPremium) + ' de ' + R.reais(preco.premium) + '</p>' : '') + '</div>' +
        '<span class="ui-carrinho__preco">' + R.reais(preco.total) + '</span>' +
        (sel.segundo ? '' : '<div class="ui-carrinho__acoes"><button type="button" class="ui-botao ui-botao--mini" data-acao="editar-item" data-valor="' + i + '" data-foco="editar-item-' + i + '">Editar</button>' +
          (sel.itens.length > 1 ? '<button type="button" class="ui-botao ui-botao--mini ui-botao--perigo" data-acao="remover-item" data-valor="' + i + '" data-foco="remover-item-' + i + '">Remover</button>' : '') + '</div>') +
        '</li>';
    }).join('');
  }

  // Automática entra sozinha e só sai com o PIN do gerente; escolher uma opcional troca a automática
  function htmlPromocao(ctx) {
    var sel = ctx.sel;
    if (sel.segundo) return '<p class="ui-ajuda">O 2º rosh já é a promoção rosh duplo e não soma outras.</p>';
    if (sel.avulsoPct) {
      return '<div class="ui-faixa ui-faixa--latao"><p><strong>Desconto avulso ' + sel.avulsoPct + '%</strong>, autorizado por Ana (gerente).</p>' +
        '<button type="button" class="ui-link" data-acao="tirar-avulso" data-foco="tirar-avulso">Remover</button></div>';
    }
    var auto = R.promoAutomatica();
    var html = '';
    if (auto && !sel.promoId && !sel.semAutomatica) {
      html += '<div class="ui-promo-auto"><p><strong>' + R.esc(auto.nome) + '</strong> aplicado sozinho. ' + R.esc(C.rotuloRegra(auto)) + '.</p>' +
        '<button type="button" class="ui-link" data-acao="remover-auto" data-foco="remover-auto">Remover (PIN do gerente)</button></div>';
    } else if (auto && sel.semAutomatica) {
      html += '<div class="ui-promo-auto ui-promo-auto--fora"><p>' + R.esc(auto.nome) + ' removido pelo gerente neste pedido.</p>' +
        '<button type="button" class="ui-link" data-acao="voltar-auto" data-foco="voltar-auto">Aplicar de novo</button></div>';
    }
    var opcionais = C.PROMOCOES.filter(function (p) { return p.modo !== 'automatica' && !p.encerrada; });
    html += '<p class="ui-ajuda">Opcionais, a equipe escolhe' + (auto && !sel.semAutomatica ? '. Uma promoção por pedido: a opcional troca a automática' : '') + '.</p>';
    html += opcionais.map(function (p) {
      var motivo = '';
      if (p.pausada) motivo = 'Pausada pelo gerente';
      else if (!C.promoAtiva(p, R.agora())) motivo = 'Fora do horário: ' + C.rotuloDias(p.dias).toLowerCase() + ', ' + C.rotuloHorario(p);
      else if (p.tipo === 'duplo' && sel.mesa === 'Balcão') motivo = 'Precisa de mesa: o 2º rosh fica guardado para a mesa, e no balcão não há mesa';
      else if (p.tipo === 'duplo' && sel.itens.length > 1) motivo = 'Vale para pedido com um narguilé só';
      return '<button type="button" class="ui-promo" data-acao="promo" data-valor="' + p.id + '" data-foco="promo-' + p.id + '" aria-pressed="' + (sel.promoId === p.id) + '"' +
        (motivo ? ' disabled' : '') + '><span class="ui-promo__nome">' + R.esc(p.nome) + '</span><span class="ui-promo__regra">' + R.esc(motivo || C.rotuloRegra(p)) + '</span></button>';
    }).join('');
    return html + '<button type="button" class="ui-link" data-acao="avulso" data-foco="avulso">Desconto avulso (PIN do gerente)</button>';
  }

  function htmlPagamento(ctx) {
    var sel = ctx.sel;
    var total = conta(ctx).total;
    if (total === 0 && prontos(sel).length) return '<p class="ui-ajuda">Sem cobrança: o 2º rosh é grátis. Se tiver adicional, ele aparece no total e precisa ser pago.</p>';
    var html = '<div class="ui-grade ui-grade--pagamento">' + U.botoesPagamento(sel.pagamento, 'pag-') + '</div>';
    if (sel.pagamento === 'dinheiro') {
      var troco = sel.recebido - total;
      var notas = [total, Math.ceil(total / 5000) * 5000, Math.ceil(total / 10000) * 10000].filter(function (v, i, l) { return l.indexOf(v) === i; });
      html += '<label class="ui-campo ui-campo--recebido"><span>Valor recebido (R$)</span><input type="text" inputmode="decimal" data-entrada="recebido" data-foco="recebido" ' +
        'value="' + R.esc(sel.recebidoTexto || '') + '" placeholder="Ex.: 100,00"></label><div class="ui-linha">' + notas.map(function (v, i) {
          return '<button type="button" class="ui-filtro" data-acao="nota" data-valor="' + v + '">' + (i === 0 ? 'Valor exato' : R.reais(v)) + '</button>';
        }).join('') + '</div>' +
        '<p class="ui-troco' + (sel.recebido && troco < 0 ? ' ui-troco--falta' : '') + '" data-troco>' +
        (!sel.recebido ? 'Digite quanto o cliente entregou.' : troco < 0 ? 'Faltam ' + R.reais(-troco) + '.' : 'Troco: <strong>' + R.reais(troco) + '</strong>') + '</p>';
    } else if (sel.pagamento) {
      html += '<p class="ui-cobre">' + (sel.pagamento === 'pix' ? 'Cobre no Pix antes de confirmar: confira o valor de ' + R.reais(total) + ' no app do lounge.' :
        'Cobre na maquininha antes de confirmar: passe ' + R.reais(total) + ' no cartão.') + '</p>';
    }
    if (ctx.cfg.modo === 'caixa') {
      html += '<button type="button" class="ui-alternar" data-acao="comprovante" data-foco="comprovante" aria-pressed="' + (ctx.comprovante !== false) + '">' +
        '<span class="ui-alternar__trilho" aria-hidden="true"></span>Imprimir comprovante</button>';
    }
    return html;
  }

  function html(ctx) {
    var sel = ctx.sel;
    return '<div class="ui-passo4"><section class="ui-secao ui-carrinho"><h3 class="ui-rotulo">Pedido' + (sel.mesa ? ', ' + R.nomeMesa(sel.mesa) : '') + '</h3>' +
      '<ul class="ui-carrinho__lista">' + htmlItens(ctx) + '</ul>' +
      (sel.segundo ? '' : '<button type="button" class="ui-botao ui-botao--mini" data-acao="outro-narguile" data-foco="outro-narguile">Adicionar outro narguilé</button>') +
      U.htmlConta(conta(ctx), 'ui-conta-lista--passo') + '</section>' +
      '<section class="ui-secao"><h3 class="ui-rotulo">Promoção</h3><div class="ui-pilha ui-pilha--promos">' + htmlPromocao(ctx) + '</div>' +
      '<h3 class="ui-rotulo ui-rotulo--espaco">Pagamento, na hora</h3>' + htmlPagamento(ctx) + '</section></div>';
  }

  function textoBotao(ctx) {
    var sel = ctx.sel;
    var total = conta(ctx).total;
    if (total === 0) return ['Enviar sem cobrança', '2º rosh grátis'];
    if (!sel.pagamento) return ['Escolha a forma de pagamento', R.reais(total)];
    if (sel.pagamento === 'dinheiro') {
      return ['Pagamento recebido', R.reais(Math.max(sel.recebido, total)) + ' em dinheiro' + (sel.recebido > total ? ', troco ' + R.reais(sel.recebido - total) : '')];
    }
    return ['Pagamento recebido', R.reais(total) + ' ' + FORMA[sel.pagamento]];
  }

  function rodape(ctx) {
    var sel = ctx.sel;
    var ui = ctx.ui;
    var c = conta(ctx);
    var lista = prontos(sel);
    var linha1 = (sel.mesa ? R.nomeMesa(sel.mesa) : 'Sem mesa') + ', ' + (lista.length === 1 && sel.itens.length === 1 ? R.rosh(lista[0].roshId).nome :
      sel.itens.length + (sel.itens.length === 1 ? ' narguilé' : ' narguilés')) + (sel.segundo ? ' (2º rosh)' : '');
    var linha2 = sel.itens.map(function (i) { return E.resumo(i); }).filter(Boolean).join('; ');
    var falta = faltando(ctx);
    var botao;
    if (ui.passo < 4) botao = '<button type="button" class="ui-botao ui-botao--primario ui-botao--grande" data-acao="continuar" data-foco="continuar">Continuar</button>';
    else {
      var t = textoBotao(ctx);
      botao = '<button type="button" class="ui-botao ui-botao--primario ui-botao--grande ui-botao--duas" data-acao="finalizar" data-foco="finalizar"' + (falta.length ? ' disabled' : '') + '>' +
        '<span>' + t[0] + '</span><span class="ui-botao__sub">' + t[1] + '</span></button>';
    }
    return '<footer class="ui-rodape-pedido"><div class="ui-rodape-pedido__resumo"><span class="ui-rodape-pedido__linha1">' + R.esc(linha1) + '</span>' +
      '<span class="ui-rodape-pedido__itens">' + R.esc(linha2 || 'Nenhum sabor ainda') + '</span>' +
      (ui.passo === 4 && falta.length ? '<span class="ui-rodape-pedido__falta">Falta: ' + falta.join(', ') + '</span>' : '') + '</div>' +
      U.htmlConta(c, 'ui-conta-lista--rodape') + botao + '</footer>';
  }

  function escolherAvulso(ctx) {
    var tela = ctx.cfg.tela;
    A.pinGerente(tela, 'Desconto avulso', function () {
      U.abrirModal(tela, '<h2 class="ui-modal__titulo">Quanto de desconto?</h2><p class="ui-modal__texto">Vale para o pedido inteiro e fica registrado com o nome da Ana (gerente).</p>' +
        '<div class="ui-linha">' + [5, 10, 15].map(function (v) {
          return '<button type="button" class="ui-botao" data-acao="pct" data-valor="' + v + '">' + v + '%</button>';
        }).join('') + '</div><div class="ui-modal__acoes"><button type="button" class="ui-botao" data-acao="cancelar">Cancelar</button></div>', function (alvo, fechar) {
        if (alvo.getAttribute('data-acao') === 'pct') {
          ctx.sel.avulsoPct = Number(alvo.getAttribute('data-valor'));
          ctx.sel.promoId = null;
          ctx.desenhar();
          U.aviso(tela, 'Desconto de ' + ctx.sel.avulsoPct + '% autorizado');
        }
        fechar();
      });
    });
  }

  function finalizar(ctx) {
    if (faltando(ctx).length) return;
    var sel = ctx.sel;
    var tela = ctx.cfg.tela;
    var dados = JSON.parse(JSON.stringify(sel));
    dados.itens = prontos(sel);
    dados.vendedorId = A.operador(ctx.cfg.aparelho);
    dados.treino = A.emTreino(ctx.cfg.aparelho);
    if (!dados.pagamento || dados.pagamento !== 'dinheiro') dados.recebido = 0;
    var p = R.criarPedido(dados);
    var comprovante = ctx.cfg.modo === 'caixa' && ctx.comprovante !== false;
    ctx.reiniciar();
    var texto = 'Pedido 0' + p.numero + (p.total ? ' pago ' + FORMA[p.pagamento] : ' sem cobrança') + ', vai para a cozinha em 5 s';
    if (p.pagamento === 'dinheiro' && p.recebido > p.total) texto += '. Troco ' + R.reais(p.recebido - p.total);
    if (p.promoId === 'duplo') texto += '. A mesa ganhou 1 rosh grátis';
    if (p.treino) texto = 'TREINO: ' + texto;
    U.aviso(tela, texto, { rotulo: 'Desfazer', fn: function () {
      U.aviso(tela, R.desfazer(p.id) ? 'Pedido desfeito: a cozinha não recebeu nada' : 'Não deu para desfazer: a cozinha já recebeu. Peça cancelamento.');
    } }, 5000);
    if (comprovante) {
      U.abrirModal(tela, '<h2 class="ui-modal__titulo">Comprovante impresso</h2><div class="comanda ui-modal__comanda">' + U.comprovante(p) + '</div>' +
        '<div class="ui-modal__acoes"><button type="button" class="ui-botao" data-acao="ok">Fechar</button></div>', function (alvo, fechar) { fechar(); });
    }
  }

  function acao(ctx, nome, valor) {
    var sel = ctx.sel;
    switch (nome) {
      case 'promo': sel.promoId = sel.promoId === valor ? null : valor; break;
      case 'remover-auto':
        A.pinGerente(ctx.cfg.tela, 'Remover a promoção automática', function () {
          sel.semAutomatica = true;
          ctx.desenhar();
        });
        return true;
      case 'voltar-auto': sel.semAutomatica = false; break;
      case 'tirar-avulso': sel.avulsoPct = 0; break;
      case 'avulso': escolherAvulso(ctx); return true;
      case 'pagamento': sel.pagamento = valor; break;
      case 'nota':
        sel.recebido = Number(valor);
        sel.recebidoTexto = (sel.recebido / 100).toFixed(2).replace('.', ',');
        break;
      case 'comprovante': ctx.comprovante = ctx.comprovante === false; break;
      case 'finalizar': finalizar(ctx); return true;
      default: return false;
    }
    ctx.desenhar();
    return true;
  }

  function atualizarTroco(ctx, raiz) {
    ctx.sel.recebidoTexto = raiz.querySelector('[data-entrada="recebido"]').value;
    ctx.desenhar();
  }

  window.RoshPagamento = { html: html, rodape: rodape, acao: acao, atualizarTroco: atualizarTroco, faltando: faltando };
})();
