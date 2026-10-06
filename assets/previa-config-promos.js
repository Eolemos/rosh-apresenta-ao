/* Prévia das telas: configuração de promoções (criar, editar, pausar e encerrar) */
(function () {
  'use strict';

  var R = window.Rosh;
  var C = window.RoshCatalogo;
  var U = window.RoshUI;
  var K = window.RoshCadastro;

  var HORAS = [];
  for (var h = 0; h < 24; h++) HORAS.push(String(h).padStart(2, '0') + ':00');

  function novoRascunho() {
    return { nome: '', pct: 10, vale: 'pedido', modo: 'opcional', dias: [new Date(R.agora()).getDay()], inicio: '20:00', fim: '23:00', alcance: 'unidade', validadeHoras: 3 };
  }

  function rascunhoDe(promo) {
    return { nome: promo.nome, pct: promo.pct, vale: promo.vale, modo: promo.modo || 'opcional', dias: promo.dias.slice(), inicio: promo.inicio, fim: promo.fim,
      alcance: promo.alcance, validadeHoras: promo.validadeHoras || 3 };
  }

  function situacao(p) {
    if (p.pausada) return '<span class="ui-estado ui-estado--fila">Pausada</span>';
    return C.promoAtiva(p, R.agora()) ? '<span class="ui-estado ui-estado--pronto">Ativa agora</span>' : '<span class="ui-estado ui-estado--entregue">Fora do horário</span>';
  }

  // O gerente só mexe nas promoções da loja dele; as da rede são do master
  function travada(ctx, p) {
    return ctx.papel === 'gerente' && p.alcance === 'rede';
  }

  function htmlLista(ctx) {
    var vivas = C.PROMOCOES.filter(function (p) { return !p.encerrada; });
    var encerradas = C.PROMOCOES.length - vivas.length;
    return '<ul class="ui-cfg-promos">' + vivas.map(function (p) {
      return '<li class="ui-cfg-promo' + (ctx.promoEditando === p.id ? ' ui-cfg-promo--editando' : '') + '"><div class="ui-cfg-promo__texto">' +
        '<p class="ui-cfg-promo__nome">' + R.esc(p.nome) + (p.nova ? ' <span class="ui-selo ui-selo--brasa">Nova</span>' : '') + '</p>' +
        '<p class="ui-cfg-promo__regra">' + (p.modo === 'automatica' ? 'Automática' : 'Opcional') + ', ' + R.esc(C.rotuloRegra(p)) + '</p>' +
        '<p class="ui-cfg-promo__regra">' + C.rotuloDias(p.dias) + ', ' + C.rotuloHorario(p) + ', ' + (p.alcance === 'rede' ? 'rede inteira' : 'só a ' + C.UNIDADES.u1) + '</p>' +
        (travada(ctx, p) ? '<p class="ui-cfg-promo__trava">Da rede: só o master altera para todas as lojas.</p>' : '<div class="ui-linha ui-cfg-promo__acoes">' +
        '<button type="button" class="ui-botao ui-botao--mini" data-acao="editar-promo" data-valor="' + p.id + '" data-foco="ep-' + p.id + '">Editar</button>' +
        '<button type="button" class="ui-botao ui-botao--mini" data-acao="pausar-promo" data-valor="' + p.id + '" data-foco="pp-' + p.id + '">' + (p.pausada ? 'Reativar' : 'Pausar') + '</button>' +
        '<button type="button" class="ui-botao ui-botao--mini ui-botao--perigo" data-acao="encerrar-promo" data-valor="' + p.id + '" data-foco="xp-' + p.id + '">Encerrar</button></div>') + '</div>' +
        situacao(p) + '</li>';
    }).join('') + '</ul>' + (encerradas ? '<p class="ui-cfg-dica ui-cfg-dica--esquerda">' + encerradas + (encerradas === 1 ? ' promoção encerrada' : ' promoções encerradas') + ', fora do tablet.</p>' : '');
  }

  function segmento(r, campo, opcoes) {
    return '<div class="ui-segmento ui-segmento--form" role="group">' + opcoes.map(function (o) {
      return '<button type="button" data-acao="campo" data-campo="' + campo + '" data-valor="' + o[0] + '" data-foco="f-' + campo + '-' + o[0] + '" aria-pressed="' + (r[campo] === o[0]) + '">' + o[1] + '</button>';
    }).join('') + '</div>';
  }

  function opcoesHora(atual) {
    return HORAS.map(function (hh) { return '<option value="' + hh + '"' + (hh === atual ? ' selected' : '') + '>' + hh + '</option>'; }).join('');
  }

  function htmlForm(ctx) {
    var r = ctx.rascunho;
    var editando = ctx.promoEditando ? R.promocao(ctx.promoEditando) : null;
    var duplo = editando && editando.tipo === 'duplo';
    return '<h3 class="ui-painel__titulo">' + (editando ? 'Editar ' + R.esc(editando.nome) : 'Nova promoção') + '</h3>' +
      (editando ? '<p class="ui-form__nota">As mudanças valem para os próximos pedidos. Os pedidos já feitos guardam o nome e o desconto que tinham.</p>' : '') +
      '<form class="ui-form" novalidate>' +
      '<label class="ui-campo"><span>Nome</span><input type="text" data-entrada="nome" data-foco="f-nome" value="' + R.esc(r.nome) + '" placeholder="Ex.: Quinta 10%"></label>' +
      (duplo ? '<p class="ui-form__nota">Rosh duplo: paga 1, ganha 2. O 2º rosh fica para a mesa e não vale no balcão.</p>' +
        '<div class="ui-campo"><span>O 2º rosh vale por</span>' + segmento(r, 'validadeHoras', [[2, '2 h'], [3, '3 h'], [4, '4 h']]) + '</div>' :
        '<div class="ui-campo"><span>Tipo</span>' + segmento(r, 'modo', [['automatica', 'Automática'], ['opcional', 'Opcional']]) +
        '<small class="ui-campo__ajuda">' + (r.modo === 'automatica' ? 'Entra sozinha no horário; só sai do pedido com o PIN do gerente.' : 'A equipe escolhe no pedido, como aniversariante.') + '</small></div>' +
        '<label class="ui-campo ui-campo--curto"><span>Desconto (%)</span><input type="number" min="1" max="90" data-entrada="pct" data-foco="f-pct" value="' + r.pct + '"></label>' +
        '<div class="ui-campo"><span>Onde vale</span>' + segmento(r, 'vale', [['pedido', 'Pedido inteiro'], ['rosh', 'Só o rosh'], ['adicionais', 'Só adicionais']]) + '</div>') +
      '<div class="ui-campo"><span>Dias da semana</span><div class="ui-dias" role="group">' + C.DIAS_CURTOS.map(function (d, i) {
        return '<button type="button" class="ui-filtro" data-acao="dia" data-valor="' + i + '" data-foco="f-dia-' + i + '" aria-pressed="' + (r.dias.indexOf(i) !== -1) + '">' + d + '</button>';
      }).join('') + '</div></div>' +
      '<div class="ui-campo"><span>Horário</span><div class="ui-linha"><select data-entrada="inicio" data-foco="f-inicio" aria-label="Começa">' + opcoesHora(r.inicio) + '</select>' +
      '<span class="ui-form__ate">às</span><select data-entrada="fim" data-foco="f-fim" aria-label="Termina">' + opcoesHora(r.fim) + '</select></div></div>' +
      (ctx.papel === 'gerente' ? '<div class="ui-campo"><span>Vale em</span><p class="ui-form__nota">Só a ' + C.UNIDADES.u1 + '. Promoção para a rede inteira só o master cria.</p></div>' :
        '<div class="ui-campo"><span>Vale em</span>' + segmento(r, 'alcance', [['unidade', 'Só a ' + C.UNIDADES.u1], ['rede', 'Rede inteira']]) + '</div>') +
      (ctx.erro ? '<p class="ui-form__erro" role="alert">' + ctx.erro + '</p>' : '') +
      '<div class="ui-linha"><button type="button" class="ui-botao ui-botao--primario" data-acao="salvar-promo" data-foco="f-salvar">' + (editando ? 'Salvar mudanças' : 'Salvar promoção') + '</button>' +
      (editando ? '<button type="button" class="ui-botao" data-acao="cancelar-edicao" data-foco="f-cancelar">Cancelar edição</button>' : '') + '</div></form>';
  }

  function html(ctx) {
    if (!ctx.rascunho) ctx.rascunho = novoRascunho();
    return '<div class="ui-cfg-duas ui-cfg-duas--promos"><section class="ui-painel"><h3 class="ui-painel__titulo">Promoções</h3>' + htmlLista(ctx) + '</section>' +
      '<section class="ui-painel">' + htmlForm(ctx) + '</section></div>';
  }

  function salvar(ctx) {
    var r = ctx.rascunho;
    var editando = ctx.promoEditando ? R.promocao(ctx.promoEditando) : null;
    var pct = Number(r.pct);
    if (!r.nome.trim()) ctx.erro = 'Dê um nome para a promoção.';
    else if ((!editando || editando.tipo === 'percentual') && !(pct >= 1 && pct <= 90)) ctx.erro = 'O desconto precisa estar entre 1% e 90%.';
    else if (!r.dias.length) ctx.erro = 'Escolha pelo menos um dia da semana.';
    else if (r.inicio === r.fim) ctx.erro = 'O horário de início e de fim não podem ser iguais.';
    else ctx.erro = '';
    if (ctx.erro) return true;
    var dados = Object.assign({}, r, { nome: r.nome.trim(), pct: pct, alcance: ctx.papel === 'gerente' ? 'unidade' : r.alcance });
    ctx.rascunho = novoRascunho();
    ctx.promoEditando = null;
    var promo = K.salvarPromocao(dados, editando ? editando.id : null);
    U.aviso(ctx.tela, (editando ? 'Promoção atualizada. ' : 'Promoção salva. ') +
      (C.promoAtiva(promo, R.agora()) ? 'Já aparece no pagamento do tablet' : 'Aparece no tablet no horário dela'));
    return false;
  }

  function encerrar(ctx, id) {
    var p = R.promocao(id);
    U.abrirModal(ctx.tela, '<h2 class="ui-modal__titulo">Encerrar ' + R.esc(p.nome) + '?</h2>' +
      '<p class="ui-modal__texto">Ela sai do tablet e do caixa e não volta. Os pedidos já feitos não mudam.</p>' +
      '<div class="ui-modal__acoes"><button type="button" class="ui-botao" data-acao="cancelar">Cancelar</button>' +
      '<button type="button" class="ui-botao ui-botao--perigo" data-acao="encerrar">Encerrar promoção</button></div>', function (alvo, fechar) {
      if (alvo.getAttribute('data-acao') === 'encerrar') {
        if (ctx.promoEditando === id) {
          ctx.promoEditando = null;
          ctx.rascunho = novoRascunho();
        }
        K.encerrarPromocao(id);
        U.aviso(ctx.tela, p.nome + ' encerrada');
      }
      fechar();
    });
  }

  function acao(nome, valor, alvo, ctx) {
    switch (nome) {
      case 'campo': {
        var campo = alvo.getAttribute('data-campo');
        ctx.rascunho[campo] = campo === 'validadeHoras' ? Number(valor) : valor;
        return true;
      }
      case 'dia': {
        var d = Number(valor);
        var i = ctx.rascunho.dias.indexOf(d);
        if (i === -1) ctx.rascunho.dias.push(d);
        else ctx.rascunho.dias.splice(i, 1);
        return true;
      }
      case 'editar-promo':
        ctx.promoEditando = valor;
        ctx.rascunho = rascunhoDe(R.promocao(valor));
        ctx.erro = '';
        return true;
      case 'cancelar-edicao':
        ctx.promoEditando = null;
        ctx.rascunho = novoRascunho();
        ctx.erro = '';
        return true;
      case 'pausar-promo':
        K.pausarPromocao(valor);
        U.aviso(ctx.tela, R.promocao(valor).nome + (R.promocao(valor).pausada ? ' pausada; saiu do tablet' : ' reativada'));
        return false;
      case 'encerrar-promo': encerrar(ctx, valor); return false;
      case 'salvar-promo': return salvar(ctx);
      default: return false;
    }
  }

  function digitar(alvo, ctx) {
    var campo = alvo.getAttribute('data-entrada');
    if (campo && ctx.rascunho) ctx.rascunho[campo] = alvo.value;
  }

  window.RoshCfgPromos = { html: html, acao: acao, digitar: digitar };
})();
