/* Prévia das telas: abrir, editar e escolher mesas (atendimentos com nome e descrição) */
(function () {
  'use strict';

  var R = window.Rosh;
  var C = window.RoshCatalogo;
  var U = window.RoshUI;
  var F = window.RoshForm;
  var M = window.RoshMesas;

  var LIMITE_BUSCA = 6;
  var ICONE_MAIS = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';

  function campos(m) {
    return F.texto('nome', 'Nome da mesa', m.nome, 'Ex.: Casal da janela', C.LIMITE_MESA.nome) +
      F.texto('descricao', 'Descrição (opcional)', m.descricao, 'Ex.: perto da entrada, 2 pessoas', C.LIMITE_MESA.descricao) +
      '<p class="ui-form__nota">O nome sai na comanda em letras grandes. A descrição aparece só nas telas, para a equipe achar a mesa.</p>';
  }

  function nova(tela, opId, aoCriar) {
    F.modal(tela, {
      titulo: 'Nova mesa', salvar: 'Abrir mesa',
      texto: 'Dê um nome que a equipe reconheça. Não precisa de número.',
      campos: campos({ nome: '', descricao: '' }),
      aoSalvar: function (d) {
        var erro = M.validarNome(d.nome) || M.validarDescricao(d.descricao);
        if (erro) return erro;
        var m = M.abrir(d.nome, d.descricao, opId);
        U.aviso(tela, 'Mesa ' + m.nome + ' aberta');
        if (aoCriar) aoCriar(m);
      }
    });
  }

  function editar(tela, id, depois) {
    var m = R.mesa(id);
    F.modal(tela, {
      titulo: 'Editar mesa', salvar: 'Salvar',
      texto: 'Os pedidos já feitos passam a mostrar o nome novo.',
      campos: campos(m),
      aoSalvar: function (d) {
        var erro = M.validarNome(d.nome, id) || M.validarDescricao(d.descricao);
        if (erro) return erro;
        M.editar(id, d.nome, d.descricao);
        U.aviso(tela, 'Mesa atualizada: ' + R.mesa(id).nome);
        if (depois) depois();
      }
    });
  }

  // Mesas abertas que batem com a busca, da mais nova para a mais antiga
  function filtrar(termo) {
    var limpo = (termo || '').trim().toLowerCase();
    return M.abertas().filter(function (m) {
      return !limpo || (m.nome + ' ' + m.descricao).toLowerCase().indexOf(limpo) !== -1;
    }).reverse();
  }

  function statusCurto(info) {
    if (!info.narguileEm) return 'sem pedido ainda';
    if (info.carvaoAtrasado) return U.ICONES.brasa + 'carvão há ' + R.minutos(info.ultimoCarvaoEm) + ' min';
    return 'narguilé há ' + R.minutos(info.narguileEm) + ' min';
  }

  function botaoMesa(m, sel, travado) {
    var info = M.infoMesa(m.id);
    return '<button type="button" class="ui-opcao ui-mesa-aberta' + (info.carvaoAtrasado ? ' ui-opcao--carvao' : '') + '" data-acao="mesa" data-valor="' + m.id +
      '" data-foco="mesa-' + m.id + '" aria-pressed="' + (sel.mesa === m.id) + '"' + (travado ? ' disabled' : '') + '>' +
      '<span class="ui-mesa-aberta__nome">' + R.esc(m.nome) + '</span>' +
      (m.descricao ? '<span class="ui-mesa-aberta__desc">' + R.esc(m.descricao) + '</span>' : '') +
      '<span class="ui-mesa-aberta__lado"><span class="ui-mesa-aberta__status">' + statusCurto(info) + '</span>' +
      (info.credito ? '<span class="ui-mesa-aberta__credito">1 rosh grátis</span>' : '') + '</span></button>';
  }

  // Atalhos das mesas fixas da loja: um toque abre a mesa, ou escolhe a que já está aberta
  function atalhos(sel, travado) {
    if (!C.MESAS_FIXAS.length) return '';
    return '<span class="ui-mesas__atalhos"><span class="ui-mesas__rotulo">Mesas fixas</span>' + C.MESAS_FIXAS.map(function (f) {
      var aberta = M.fixaAberta(f.id);
      return '<button type="button" class="ui-opcao ui-mesas__atalho' + (aberta ? ' ui-mesas__atalho--aberta' : '') + '" data-acao="mesa-fixa" data-valor="' + f.id +
        '" data-foco="fixa-' + f.id + '" aria-pressed="' + Boolean(aberta && sel.mesa === aberta.id) + '"' + (travado ? ' disabled' : '') +
        ' title="' + (aberta ? 'Já está aberta' : 'Abrir com um toque') + '">' + R.esc(f.nome) + '</button>';
    }).join('') + '</span>';
  }

  // Passo "Mesa" do pedido: nova mesa, atalhos das mesas fixas e a lista das mesas abertas
  function html(sel, ui, cfg) {
    var caixa = cfg.modo === 'caixa';
    var todas = M.abertas();
    var lista = filtrar(ui.buscaMesa);
    var travado = sel.segundo;
    return '<section class="ui-secao ui-mesas"><h3 class="ui-rotulo">' + (caixa ? 'Balcão ou mesa' : 'Mesa') + '</h3>' +
      '<div class="ui-mesas__acoes">' +
      (caixa ? '<button type="button" class="ui-opcao ui-mesas__balcao" data-acao="mesa" data-valor="Balcão" data-foco="mesa-balcao" aria-pressed="' +
        (sel.mesa === 'Balcão') + '"' + (travado ? ' disabled' : '') + '>Balcão</button>' : '') +
      '<button type="button" class="ui-botao ui-botao--brasa ui-mesas__nova" data-acao="nova-mesa" data-foco="nova-mesa"' + (travado ? ' disabled' : '') + '>' +
      ICONE_MAIS + 'Nova mesa</button>' + atalhos(sel, travado) + '</div>' +
      (todas.length > LIMITE_BUSCA ? '<label class="ui-busca ui-busca--mesas">' + U.ICONES.busca + '<span class="ui-oculto">Buscar mesa aberta</span>' +
        '<input type="search" data-entrada="busca-mesa" data-foco="busca-mesa" autocomplete="off" placeholder="Buscar mesa aberta" value="' + R.esc(ui.buscaMesa || '') + '"></label>' : '') +
      '<div class="ui-mesas__lista" role="group" aria-label="Mesas abertas">' +
      (lista.length ? lista.map(function (m) { return botaoMesa(m, sel, travado); }).join('') :
        '<p class="ui-vazio">' + (todas.length ? 'Nenhuma mesa aberta com esse nome.' : 'Nenhuma mesa aberta. Toque em Nova mesa para começar.') + '</p>') + '</div>' +
      '<p class="ui-ajuda">Laranja: último carvão há mais de ' + M.LIMITE_CARVAO + ' min. Ofereça carvão.</p></section>';
  }

  // Lista de mesas abertas para escolher uma (reposição de carvão, trocar a mesa de um pedido)
  function linhas(selecionada, ignorar) {
    var lista = M.abertas().filter(function (m) { return m.id !== ignorar; })
      .sort(function (a, b) { return (M.infoMesa(a.id).ultimoCarvaoEm || Infinity) - (M.infoMesa(b.id).ultimoCarvaoEm || Infinity); });
    if (!lista.length) return '<p class="ui-vazio">Nenhuma outra mesa aberta agora.</p>';
    return '<div class="ui-mesas-lista">' + lista.map(function (m) {
      var info = M.infoMesa(m.id);
      return '<button type="button" class="ui-opcao ui-opcao--mesa-linha' + (info.carvaoAtrasado ? ' ui-opcao--carvao' : '') + '" data-acao="mesa" data-valor="' + m.id +
        '" aria-pressed="' + (selecionada === m.id) + '"><strong>' + R.esc(m.nome) + '</strong>' +
        (m.descricao ? '<span>' + R.esc(m.descricao) + '</span>' : '') + '<span>' + M.linhaStatus(m.id) + '</span></button>';
    }).join('') + '</div>';
  }

  // Nome com a descrição logo abaixo, para as telas (nunca para a comanda)
  function rotulo(id, classe) {
    var desc = R.descMesa(id);
    return '<span class="' + classe + '">' + R.esc(R.nomeMesa(id)) + '</span>' + (desc ? '<span class="ui-mesa-desc">' + R.esc(desc) + '</span>' : '');
  }

  window.RoshMesaEscolha = { nova: nova, editar: editar, html: html, filtrar: filtrar, linhas: linhas, rotulo: rotulo };
})();
