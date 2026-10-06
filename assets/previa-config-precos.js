/* Prévia das telas: configuração de tipos de rosh, adicionais e preços (rede e unidade) */
(function () {
  'use strict';

  var R = window.Rosh;
  var C = window.RoshCatalogo;
  var U = window.RoshUI;
  var F = window.RoshForm;
  var K = window.RoshCadastro;

  function travado(ctx, item) { return window.RoshCfgCardapio.travado(ctx, item); }

  function centavos(v) { return Math.round(v * 100); }

  // Gerente num item da rede: só preço desta loja e mostrar ou ocultar aqui
  function ajusteLocal(tela, lista, item, rotulo) {
    F.modal(tela, {
      titulo: 'Ajustar ' + item.nome + ' nesta loja', salvar: 'Salvar ajuste',
      texto: window.RoshCfgCardapio.SO_MASTER + ' Preço da rede: ' + R.reais(item.preco) + '.',
      campos: F.dinheiro('precoLocal', 'Preço nesta loja', C.preco(item)) +
        F.chips('oculto', 'Nesta loja', [['mostrar', 'Mostrar'], ['ocultar', 'Ocultar nesta unidade']], [item.ocultoUnidade ? 'ocultar' : 'mostrar'], true) +
        (typeof item.precoLocal === 'number' ? '<p class="ui-form__nota">Esta loja já usa preço próprio. Para voltar ao preço da rede, digite ' + R.reais(item.preco).replace('R$', '').trim() + '.</p>' : ''),
      aoSalvar: function (d) {
        if (!(d.precoLocal >= 0)) return 'Digite o preço desta loja em reais, por exemplo 50.';
        var local = centavos(d.precoLocal);
        K.ajustarUnidade(lista, item.id, { precoLocal: local === item.preco ? null : local, ocultoUnidade: d.oculto === 'ocultar' || null });
        U.aviso(tela, rotulo + ' ajustado só nesta loja: ' + R.reais(local) + (d.oculto === 'ocultar' ? ', oculto' : ''));
      }
    });
  }

  function abrirRosh(tela, id, ctx) {
    var r = id ? R.rosh(id) : { nome: '', preco: 5000, max: 2 };
    if (id && travado(ctx, r)) return ajusteLocal(tela, C.ROSH, r, r.nome);
    F.modal(tela, {
      titulo: id ? 'Editar tipo de rosh' : 'Novo tipo de rosh',
      texto: 'Preço e limite valem para os próximos pedidos; os pedidos já feitos não mudam.' + (!id && ctx.papel === 'gerente' ? ' Criado pelo gerente, vale só nesta loja.' : ''),
      campos: F.texto('nome', 'Nome', r.nome, 'Ex.: Rosh gigante') + F.dinheiro('preco', 'Preço' + (ctx.papel === 'master' ? ' na rede' : ''), r.preco) +
        F.chips('max', 'Máximo de sabores', [['1', '1'], ['2', '2'], ['3', '3'], ['4', '4']], [String(r.max)], true),
      aoSalvar: function (d) {
        if (!d.nome) return 'Dê um nome para o tipo de rosh, por exemplo Rosh gigante.';
        if (!(d.preco > 0)) return 'Digite um preço maior que zero, em reais.';
        d.max = Number(d.max);
        var item = K.salvarRosh(d, id, ctx.papel);
        U.aviso(tela, item.nome + (id ? ' atualizado' : ' criado') + ' no tablet e no caixa');
      }
    });
  }

  function abrirAdicional(tela, id, ctx) {
    var a = id ? C.porId(C.ADICIONAIS, id) : { nome: '', preco: 300, ativo: true };
    if (id && travado(ctx, a)) return ajusteLocal(tela, C.ADICIONAIS, a, a.nome);
    var extra = '';
    if (id && a.fixo) extra = '<p class="ui-form__nota">O carvão extra também é usado na reposição e não pode ser desativado.</p>';
    else if (id) extra = '<button type="button" class="ui-botao ui-botao--perigo" data-acao="ativo">' + (a.ativo === false ? 'Reativar' : 'Desativar') + ' adicional</button>';
    F.modal(tela, {
      titulo: id ? 'Editar adicional' : 'Novo adicional',
      texto: 'O preço vale para os próximos pedidos; os pedidos já feitos não mudam.' + (!id && ctx.papel === 'gerente' ? ' Criado pelo gerente, vale só nesta loja.' : ''),
      campos: F.texto('nome', 'Nome', a.nome, 'Ex.: Piteira descartável') + F.dinheiro('preco', 'Preço por unidade', a.preco),
      extra: extra,
      aoSalvar: function (d) {
        if (!d.nome) return 'Dê um nome para o adicional, por exemplo Piteira descartável.';
        if (!(d.preco >= 0)) return 'Digite o preço em reais. Pode ser zero.';
        var item = K.salvarAdicional(d, id, ctx.papel);
        U.aviso(tela, item.nome + (id ? ' atualizado' : ' já aparece nos adicionais do pedido'));
      },
      aoAcao: function (nome, valor, fechar) {
        if (nome !== 'ativo') return;
        var item = K.alternarAtivo(C.ADICIONAIS, id);
        fechar();
        U.aviso(tela, item.nome + (item.ativo ? ' reativado' : ' desativado; saiu do pedido'));
      }
    });
  }

  function botao(acao, item, ctx) {
    return '<button type="button" class="ui-botao ui-botao--mini" data-acao="' + acao + '" data-valor="' + item.id + '" data-foco="' + acao + '-' + item.id + '">' +
      (travado(ctx, item) ? 'Ajustar nesta loja' : 'Editar') + '</button>';
  }

  function preco(item) {
    var local = typeof item.precoLocal === 'number';
    return R.reais(C.preco(item)) + (local ? '<span class="ui-tabela__sub">Nesta loja; rede ' + R.reais(item.preco) + '</span>' : '');
  }

  function situacao(item) {
    if (item.ativo === false) return '<span class="ui-tabela__sub">Inativo</span>';
    if (item.ocultoUnidade) return '<span class="ui-tabela__sub">Oculto nesta loja</span>';
    if (item.escopo === 'unidade') return '<span class="ui-tabela__sub">Só nesta loja</span>';
    return item.fixo ? '<span class="ui-tabela__sub">Também na reposição</span>' : '';
  }

  function painel(titulo, novo, cols, corpo, nota) {
    return '<section class="ui-painel"><div class="ui-cfg-cabeca"><h3 class="ui-painel__titulo">' + titulo + '</h3>' + novo + '</div>' +
      '<table class="ui-tabela ui-tabela--cfg"><thead><tr>' + cols.map(function (c) { return '<th scope="col">' + c + '</th>'; }).join('') +
      '</tr></thead><tbody>' + corpo + '</tbody></table>' + (nota ? '<p class="ui-cfg-dica ui-cfg-dica--esquerda">' + nota + '</p>' : '') + '</section>';
  }

  function html(ctx) {
    var rosh = C.ROSH.map(function (r) {
      return '<tr' + (r.ocultoUnidade ? ' class="ui-tabela__falta"' : '') + '><th scope="row">' + R.esc(r.nome) + situacao(r) + '</th><td>' + preco(r) + '</td>' +
        '<td>' + (r.max === 1 ? '1 sabor' : 'Até ' + r.max) + '</td><td class="ui-tabela__acoes">' + botao('editar-rosh', r, ctx) + '</td></tr>';
    }).join('');
    var adicionais = C.ADICIONAIS.map(function (a) {
      return '<tr' + (a.ativo === false || a.ocultoUnidade ? ' class="ui-tabela__falta"' : '') + '><th scope="row">' + R.esc(a.nome) + situacao(a) + '</th>' +
        '<td>' + preco(a) + '</td><td class="ui-tabela__acoes">' + botao('editar-adicional', a, ctx) + '</td></tr>';
    }).join('') + '<tr><th scope="row">' + C.OBS_GELO + '<span class="ui-tabela__sub">Observação na comanda</span></th><td>Grátis</td><td></td></tr>';
    var premium = C.ativos(C.MARCAS).filter(function (m) { return m.sobretaxa; }).map(function (m) {
      return '<tr><th scope="row">' + R.esc(m.nome) + '</th><td>+' + R.reais(m.sobretaxa) + '</td></tr>';
    }).join('');
    var nota = ctx.papel === 'gerente' ? 'Como gerente, você ajusta o preço só nesta loja e pode ocultar itens aqui. O preço da rede é do master.' : '';
    return (nota ? '<p class="ui-form__nota">' + nota + '</p>' : '') + '<div class="ui-cfg-coluna">' +
      painel('Tipos de rosh', '<button type="button" class="ui-botao ui-botao--mini ui-botao--primario" data-acao="novo-rosh" data-foco="novo-rosh">Novo tipo</button>',
        ['Tipo', 'Preço', 'Sabores', '<span class="ui-oculto">Ações</span>'], rosh) +
      painel('Adicionais', '<button type="button" class="ui-botao ui-botao--mini ui-botao--primario" data-acao="novo-adicional" data-foco="novo-adicional">Novo adicional</button>',
        ['Adicional', 'Preço', '<span class="ui-oculto">Ações</span>'], adicionais) +
      painel('Marcas premium', '', ['Marca', 'Acréscimo por rosh'], premium, 'Numa mistura de marcas vale o maior acréscimo. Mude o acréscimo em Marcas e essências.') +
      '</div>';
  }

  function acao(nome, valor, alvo, ctx) {
    if (nome === 'novo-rosh') abrirRosh(ctx.tela, null, ctx);
    if (nome === 'editar-rosh') abrirRosh(ctx.tela, valor, ctx);
    if (nome === 'novo-adicional') abrirAdicional(ctx.tela, null, ctx);
    if (nome === 'editar-adicional') abrirAdicional(ctx.tela, valor, ctx);
    return false;
  }

  window.RoshCfgPrecos = { html: html, acao: acao };
})();
