/* Prévia das telas: configuração de marcas e essências, com estoque em pacotes e permissão por papel */
(function () {
  'use strict';

  var R = window.Rosh;
  var C = window.RoshCatalogo;
  var U = window.RoshUI;
  var E = window.RoshEstoque;
  var F = window.RoshForm;
  var K = window.RoshCadastro;

  var STATUS = { ok: 'Ok', baixo: 'Baixo', falta: 'Em falta' };
  var MOTIVOS = ['Contagem de rotina', 'Pacote danificado', 'Erro de lançamento', 'Perda ou vencimento'];
  var SO_MASTER = 'Só o master altera para todas as lojas. Aqui você ajusta só esta unidade.';

  function quem(ctx) { return ctx && ctx.papel === 'gerente' ? 'ana' : 'marcos'; }
  function daRede(item) { return item.escopo !== 'unidade'; }
  function travado(ctx, item) { return ctx.papel === 'gerente' && daRede(item); }

  function chipStatus(sabor) {
    if (sabor.ativo === false) return '<span class="ui-estoque-chip ui-estoque-chip--inativo">Inativa</span>';
    if (sabor.ocultoUnidade) return '<span class="ui-estoque-chip ui-estoque-chip--inativo">Oculta nesta loja</span>';
    var st = E.status(sabor);
    return '<span class="ui-estoque-chip ui-estoque-chip--' + st + '">' + STATUS[st] + '</span>';
  }

  function seloEscopo(item) {
    return daRede(item) ? '' : ' <span class="ui-selo ui-selo--latao">Só nesta loja</span>';
  }

  function abrirEntrada(tela, id, ctx) {
    var s = R.sabor(id);
    F.modal(tela, {
      titulo: 'Entrada de pacotes', salvar: 'Registrar entrada',
      texto: C.rotuloSabor(s) + '. Hoje: ' + E.pacotes(s.estoque) + ' fechados.' + (s.emFalta ? ' Está em falta: com a entrada ele volta ao cardápio sozinho.' : ''),
      campos: F.numero('qtd', 'Pacotes recebidos', 6, { min: 1, max: 99, curto: true }),
      aoSalvar: function (d) {
        if (!(d.qtd >= 1 && d.qtd <= 99) || d.qtd % 1) return 'Digite quantos pacotes chegaram, de 1 a 99.';
        var voltou = E.entrada(id, d.qtd, quem(ctx));
        U.aviso(tela, 'Entrada de ' + E.pacotes(d.qtd) + ' de ' + s.nome + ' registrada' + (voltou ? '. Chegou de novo ao cardápio' : ''));
      }
    });
  }

  function abrirContagem(tela, id, ctx) {
    var s = R.sabor(id);
    F.modal(tela, {
      titulo: 'Contagem de estoque', salvar: 'Registrar contagem',
      texto: C.rotuloSabor(s) + '. O sistema mostra ' + E.pacotes(s.estoque) + ' fechados.',
      campos: F.numero('qtd', 'Pacotes contados', s.estoque, { min: 0, max: 99, curto: true }) +
        F.selecao('motivo', 'Motivo', MOTIVOS.map(function (m) { return [m, m]; }), MOTIVOS[0]),
      aoSalvar: function (d) {
        if (!(d.qtd >= 0 && d.qtd <= 99) || d.qtd % 1) return 'Digite a quantidade contada, de 0 a 99.';
        E.contagem(id, d.qtd, d.motivo, quem(ctx));
        U.aviso(tela, 'Contagem de ' + s.nome + ' registrada');
      }
    });
  }

  function ocultar(item) {
    return F.chips('oculto', 'Nesta loja', [['mostrar', 'Mostrar'], ['ocultar', 'Ocultar nesta unidade']], [item.ocultoUnidade ? 'ocultar' : 'mostrar'], true);
  }

  function botaoAtivo(ctx, item, tipo) {
    if (travado(ctx, item)) return '';
    return '<button type="button" class="ui-botao ui-botao--perigo" data-acao="ativo">' + (item.ativo === false ? 'Reativar ' : 'Desativar ') + tipo + (daRede(item) ? ' na rede' : '') + '</button>';
  }

  function abrirMarca(tela, id, ctx) {
    var m = id ? R.marca(id) : { nome: '', cor: C.CORES_MARCA[6], tier: 'tradicional', sobretaxa: 0, ativo: true, escopo: ctx.papel === 'gerente' ? 'unidade' : 'rede' };
    var trava = id && travado(ctx, m);
    var campos = F.texto('nome', 'Nome', m.nome, 'Ex.: Haze') +
      F.cores('cor', 'Cor do bloco', C.CORES_MARCA.indexOf(m.cor) === -1 ? C.CORES_MARCA.concat([m.cor]) : C.CORES_MARCA, m.cor) +
      F.chips('tier', 'Faixa', [['tradicional', 'Tradicional'], ['premium', 'Premium']], [m.tier], true) +
      F.dinheiro('acrescimo', 'Acréscimo por rosh, só premium', m.sobretaxa);
    F.modal(tela, {
      titulo: id ? 'Editar marca ' + m.nome : 'Nova marca',
      texto: trava ? SO_MASTER : !id && ctx.papel === 'gerente' ? 'Marca nova criada pelo gerente vale só nesta loja.' : 'A marca aparece como um bloco com o nome e a cor no tablet e no caixa.',
      campos: trava ? '<fieldset class="ui-form__rede" disabled><legend>Da rede</legend>' + campos + '</fieldset>' + ocultar(m) : campos,
      extra: id ? botaoAtivo(ctx, m, 'marca') : '',
      aoSalvar: function (d) {
        if (trava) {
          K.ajustarUnidade(C.MARCAS, id, { ocultoUnidade: d.oculto === 'ocultar' || null });
          return U.aviso(tela, m.nome + (d.oculto === 'ocultar' ? ' oculta nesta loja; as outras lojas não mudam' : ' aparece nesta loja'));
        }
        if (!d.nome) return 'Dê um nome para a marca.';
        if (d.tier === 'premium' && !(d.acrescimo >= 0)) return 'Digite o acréscimo da marca premium, em reais.';
        var marca = K.salvarMarca(d, id, ctx.papel);
        ctx.marcaId = marca.id;
        ctx.desenhar();
        U.aviso(tela, id ? 'Marca atualizada no tablet e no caixa' : 'Marca ' + marca.nome + ' criada' + (ctx.papel === 'gerente' ? ' só nesta loja' : ''));
      },
      aoAcao: function (nome, valor, fechar) {
        if (nome !== 'ativo') return;
        var marca = K.alternarAtivo(C.MARCAS, id);
        fechar();
        U.aviso(tela, marca.nome + (marca.ativo ? ' de volta ao cardápio' : ' desativada; saiu do tablet e do caixa'));
      }
    });
  }

  function abrirSabor(tela, id, ctx) {
    var s = id ? R.sabor(id) : { marcaId: ctx.marcaId, linha: '', nome: '', categoria: 'frutas', tags: [], nota: '', minimo: 2, ativo: true };
    var trava = id && travado(ctx, s);
    var rede = '<div class="ui-form__duas">' + F.selecao('marcaId', 'Marca', C.ativos(C.MARCAS).map(function (m) { return [m.id, m.nome]; }), s.marcaId) +
      F.texto('linha', 'Linha (opcional)', s.linha || '', 'Ex.: Strong') + '</div>' +
      '<div class="ui-form__duas">' + F.texto('nome', 'Nome como vendido', s.nome, 'Ex.: Watermelon Mint') +
      F.selecao('categoria', 'Categoria', C.CATEGORIAS.map(function (c) { return [c.id, c.nome]; }), s.categoria) + '</div>' +
      F.chips('tags', 'Estilo', C.ETIQUETAS.map(function (t) { return [t, t]; }), s.tags) +
      F.texto('nota', 'Descrição curta', s.nota, 'Ex.: melão, melancia e menta');
    var unidade = '<div class="ui-form__duas">' + F.numero('minimo', 'Estoque mínimo nesta loja (pacotes)', s.minimo, { min: 0, max: 50, curto: true }) +
      (id ? '' : F.numero('inicial', 'Pacotes no estoque agora', 4, { min: 0, max: 99, curto: true })) + '</div>';
    F.modal(tela, {
      titulo: id ? 'Editar ' + s.nome : 'Nova essência',
      texto: trava ? SO_MASTER : id ? 'O estoque muda por entrada, contagem ou pacote aberto na cozinha.' :
        'Ela entra no tablet e no caixa assim que for salva' + (ctx.papel === 'gerente' ? ', só nesta loja.' : '.'),
      campos: (trava ? '<fieldset class="ui-form__rede" disabled><legend>Da rede</legend>' + rede + '</fieldset>' : rede) + unidade + (trava ? ocultar(s) : ''),
      extra: id ? botaoAtivo(ctx, s, 'essência') : '',
      aoSalvar: function (d) {
        if (!(d.minimo >= 0) || d.minimo % 1) return 'O estoque mínimo precisa ser um número inteiro, como 2.';
        if (trava) {
          K.ajustarUnidade(C.SABORES, id, { minimo: d.minimo, ocultoUnidade: d.oculto === 'ocultar' || null });
          return U.aviso(tela, s.nome + ' ajustada só nesta loja');
        }
        if (!d.nome) return 'Dê o nome da essência como ela é vendida, por exemplo Love 66.';
        if (!id && (!(d.inicial >= 0) || d.inicial % 1)) return 'Digite quantos pacotes há no estoque agora. Pode ser zero.';
        var sabor = K.salvarSabor(d, id, ctx.papel);
        ctx.marcaId = sabor.marcaId;
        ctx.desenhar();
        U.aviso(tela, id ? 'Essência atualizada' : sabor.nome + ' já aparece no tablet e no caixa');
      },
      aoAcao: function (nome, valor, fechar) {
        if (nome !== 'ativo') return;
        var sabor = K.alternarAtivo(C.SABORES, id);
        fechar();
        U.aviso(tela, sabor.nome + (sabor.ativo ? ' de volta ao cardápio' : ' desativada; saiu do tablet e do caixa'));
      }
    });
  }

  // Em falta com pacote fechado: oferece abrir um pacote antes
  function alternarFalta(ctx, id) {
    var s = R.sabor(id);
    if (s.emFalta || !s.estoque) {
      E.alternarFalta(id, quem(ctx));
      return U.aviso(ctx.tela, s.nome + (s.emFalta ? ' marcado em falta' : ' chegou de novo ao cardápio'));
    }
    U.abrirModal(ctx.tela, '<h2 class="ui-modal__titulo">Ainda há ' + E.pacotes(s.estoque) + ' de ' + R.esc(s.nome) + '</h2>' +
      '<p class="ui-modal__texto">Abrir um pacote mantém o sabor no cardápio. Marque em falta só se os pacotes não servem.</p><div class="ui-menu-lista">' +
      '<button type="button" class="ui-botao ui-botao--primario" data-acao="abrir">Abrir um pacote</button>' +
      '<button type="button" class="ui-botao ui-botao--perigo" data-acao="falta">Marcar em falta mesmo assim</button></div>' +
      '<div class="ui-modal__acoes"><button type="button" class="ui-botao" data-acao="cancelar">Cancelar</button></div>', function (alvo, fechar) {
      var nome = alvo.getAttribute('data-acao');
      fechar();
      if (nome === 'abrir') E.abrirPacote(id, quem(ctx));
      if (nome === 'falta') E.alternarFalta(id, quem(ctx));
    });
  }

  function html(ctx) {
    var marca = R.marca(ctx.marcaId) || C.MARCAS[0];
    var sabores = C.SABORES.filter(function (s) { return s.marcaId === marca.id; });
    var lista = '<ul class="ui-cfg-marcas">' + C.MARCAS.map(function (m) {
      var todos = C.SABORES.filter(function (s) { return s.marcaId === m.id && s.ativo !== false; });
      var falta = todos.filter(function (s) { return s.emFalta; }).length;
      return '<li><button type="button" class="ui-cfg-marca' + (m.ativo === false || m.ocultoUnidade ? ' ui-cfg-marca--inativa' : '') + '" data-acao="marca" data-valor="' + m.id +
        '" data-foco="cfg-marca-' + m.id + '" aria-pressed="' + (m.id === marca.id) + '"><span class="ui-cfg-marca__cor" style="background:' + m.cor + '" aria-hidden="true"></span>' +
        '<span class="ui-cfg-marca__nome">' + R.esc(m.nome) + seloEscopo(m) + '</span><span class="ui-cfg-marca__info">' +
        (m.ativo === false ? 'Inativa' : m.ocultoUnidade ? 'Oculta nesta loja' : m.tier === 'premium' ? 'Premium, +' + R.reais(m.sobretaxa) : 'Tradicional') + '</span>' +
        '<span class="ui-cfg-marca__info">' + todos.length + (todos.length === 1 ? ' sabor' : ' sabores') + (falta ? ', ' + falta + ' em falta' : '') + '</span></button></li>';
    }).join('') + '</ul>';
    var linhas = sabores.map(function (s) {
      var acoes = s.ativo === false ? '' : '<button type="button" class="ui-botao ui-botao--mini" data-acao="entrada" data-valor="' + s.id + '" data-foco="ent-' + s.id + '">Entrada</button>' +
        '<button type="button" class="ui-botao ui-botao--mini" data-acao="contagem" data-valor="' + s.id + '" data-foco="cont-' + s.id + '">Contagem</button>';
      return '<tr' + (s.ativo === false || s.ocultoUnidade ? ' class="ui-tabela__falta"' : '') + '><th scope="row">' + R.esc(s.nome) + seloEscopo(s) + '<span class="ui-tabela__sub">' +
        C.porId(C.CATEGORIAS, s.categoria).nome + (s.linha ? ', linha ' + R.esc(s.linha) : '') + (s.tags.length ? ', ' + s.tags.join(', ') : '') + '</span></th>' +
        '<td>' + s.estoque + '</td><td>' + s.minimo + '</td><td>' + chipStatus(s) + '</td>' +
        '<td>' + (s.ativo === false ? '' : '<button type="button" class="ui-alternar ui-alternar--so" data-acao="falta" data-valor="' + s.id + '" data-foco="falta-' + s.id +
          '" aria-pressed="' + s.emFalta + '" aria-label="' + R.esc(s.nome) + ' em falta"><span class="ui-alternar__trilho ui-alternar__trilho--falta" aria-hidden="true"></span></button>') + '</td>' +
        '<td class="ui-tabela__acoes">' + acoes + '<button type="button" class="ui-botao ui-botao--mini" data-acao="editar-sabor" data-valor="' + s.id +
        '" data-foco="ed-' + s.id + '">' + (travado(ctx, s) ? 'Ajustar' : 'Editar') + '</button></td></tr>';
    }).join('');
    return '<div class="ui-cfg-duas"><section class="ui-painel"><div class="ui-cfg-cabeca"><h3 class="ui-painel__titulo">Marcas</h3>' +
      '<button type="button" class="ui-botao ui-botao--mini ui-botao--primario" data-acao="nova-marca" data-foco="nova-marca">Nova marca</button></div>' + lista + '</section>' +
      '<section class="ui-painel"><div class="ui-cfg-cabeca"><h3 class="ui-painel__titulo">Essências ' + R.esc(marca.nome) +
      (marca.ativo === false ? ' <span class="ui-estoque-chip ui-estoque-chip--inativo">Marca inativa</span>' : '') + '</h3><div class="ui-linha">' +
      '<button type="button" class="ui-botao ui-botao--mini" data-acao="editar-marca" data-foco="editar-marca">' + (travado(ctx, marca) ? 'Ajustar marca nesta loja' : 'Editar marca') + '</button>' +
      '<button type="button" class="ui-botao ui-botao--mini ui-botao--primario" data-acao="novo-sabor" data-foco="novo-sabor">Nova essência</button></div></div>' +
      (ctx.papel === 'gerente' ? '<p class="ui-form__nota">' + SO_MASTER + ' Itens que você criar valem só nesta loja.</p>' : '') +
      '<table class="ui-tabela ui-tabela--cfg"><thead><tr><th scope="col">Sabor</th><th scope="col">Pacotes</th><th scope="col">Mínimo</th><th scope="col">Situação</th>' +
      '<th scope="col">Em falta</th><th scope="col"><span class="ui-oculto">Ações</span></th></tr></thead><tbody>' +
      (linhas || '<tr><td colspan="6" class="ui-vazio">Nenhuma essência nesta marca ainda. Toque em Nova essência.</td></tr>') + '</tbody></table></section></div>';
  }

  function acao(nome, valor, alvo, ctx) {
    switch (nome) {
      case 'marca': ctx.marcaId = valor; return true;
      case 'nova-marca': abrirMarca(ctx.tela, null, ctx); return false;
      case 'editar-marca': abrirMarca(ctx.tela, ctx.marcaId, ctx); return false;
      case 'novo-sabor': abrirSabor(ctx.tela, null, ctx); return false;
      case 'editar-sabor': abrirSabor(ctx.tela, valor, ctx); return false;
      case 'entrada': abrirEntrada(ctx.tela, valor, ctx); return false;
      case 'contagem': abrirContagem(ctx.tela, valor, ctx); return false;
      case 'falta': alternarFalta(ctx, valor); return false;
      default: return false;
    }
  }

  window.RoshCfgCardapio = { html: html, acao: acao, chipStatus: chipStatus, abrirEntrada: abrirEntrada, abrirContagem: abrirContagem, travado: travado, SO_MASTER: SO_MASTER };
})();
