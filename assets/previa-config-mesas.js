/* Prévia das telas: configuração das mesas fixas da unidade (lista opcional de atalhos) */
(function () {
  'use strict';

  var R = window.Rosh;
  var C = window.RoshCatalogo;
  var U = window.RoshUI;
  var F = window.RoshForm;
  var M = window.RoshMesas;

  function abrirFixa(tela, id) {
    var fixa = id ? C.porId(C.MESAS_FIXAS, id) : { nome: '' };
    F.modal(tela, {
      titulo: id ? 'Editar mesa fixa' : 'Nova mesa fixa',
      salvar: id ? 'Salvar' : 'Cadastrar',
      texto: 'Vira um atalho de um toque ao lado de Nova mesa, no tablet e no caixa. Vale só nesta loja.',
      campos: F.texto('nome', 'Nome da mesa', fixa.nome, 'Ex.: Mesa 07 ou VIP 1', C.LIMITE_MESA.nome),
      extra: id ? '<button type="button" class="ui-botao ui-botao--perigo" data-acao="remover">Remover mesa fixa</button>' : '',
      aoSalvar: function (d) {
        var erro = M.validarFixa(d.nome, id);
        if (erro) return erro;
        var salva = M.salvarFixa(d.nome, id);
        U.aviso(tela, salva.nome + (id ? ' atualizada' : ' já aparece como atalho no tablet e no caixa'));
      },
      aoAcao: function (nome, valor, fechar) {
        if (nome !== 'remover') return;
        var removida = M.removerFixa(id);
        fechar();
        U.aviso(tela, removida.nome + ' saiu dos atalhos. Se estiver aberta agora, continua aberta');
      }
    });
  }

  function html() {
    var linhas = C.MESAS_FIXAS.map(function (f) {
      var aberta = M.fixaAberta(f.id);
      return '<tr><th scope="row">' + R.esc(f.nome) + '</th><td>' + (aberta ? 'Aberta agora por ' + C.OPERADORES[aberta.abertaPor].nome : 'Livre') + '</td>' +
        '<td class="ui-tabela__acoes"><button type="button" class="ui-botao ui-botao--mini" data-acao="editar-fixa" data-valor="' + f.id + '" data-foco="editar-fixa-' + f.id + '">Editar</button></td></tr>';
    }).join('');
    return '<p class="ui-form__nota">Opcional. A equipe sempre pode abrir uma mesa na hora, só com um nome. Se a sua loja numera as mesas, cadastre aqui: cada uma vira um atalho de um toque.</p>' +
      '<div class="ui-cfg-coluna ui-cfg-coluna--mesas"><section class="ui-painel"><div class="ui-cfg-cabeca"><h3 class="ui-painel__titulo">Mesas fixas desta loja</h3>' +
      '<button type="button" class="ui-botao ui-botao--mini ui-botao--primario" data-acao="nova-fixa" data-foco="nova-fixa">Nova mesa fixa</button></div>' +
      (linhas ? '<table class="ui-tabela ui-tabela--cfg"><thead><tr><th scope="col">Mesa</th><th scope="col">Agora</th><th scope="col"><span class="ui-oculto">Ações</span></th></tr></thead><tbody>' +
        linhas + '</tbody></table>' : '<p class="ui-vazio">Nenhuma mesa fixa. A equipe abre as mesas na hora, com nome livre.</p>') +
      '<p class="ui-cfg-dica ui-cfg-dica--esquerda">Gerente e master podem mudar esta lista. Ela vale só para esta loja.</p></section>' +
      '<section class="ui-painel"><h3 class="ui-painel__titulo">Como as mesas funcionam</h3><ul class="ui-cfg-regras">' +
      '<li>Garçom, caixa e gerente abrem uma mesa com um nome (até ' + C.LIMITE_MESA.nome + ' letras) e uma descrição opcional (até ' + C.LIMITE_MESA.descricao + ').</li>' +
      '<li>Duas mesas abertas na mesma loja não podem ter o mesmo nome.</li>' +
      '<li>A comanda impressa leva só o nome, em letras grandes. A descrição fica nas telas.</li>' +
      '<li>Liberar mesa fecha o atendimento. Mesa esquecida aberta fecha sozinha na virada do dia, às 6h.</li></ul></section></div>';
  }

  function acao(nome, valor, alvo, ctx) {
    if (nome === 'nova-fixa') abrirFixa(ctx.tela, null);
    if (nome === 'editar-fixa') abrirFixa(ctx.tela, valor);
    return false;
  }

  window.RoshCfgMesas = { html: html, acao: acao };
})();
