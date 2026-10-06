/* Prévia das telas: escolha das essências (marca primeiro, busca por sabor e recentes) */
(function () {
  'use strict';

  var R = window.Rosh;
  var C = window.RoshCatalogo;
  var N = window.RoshNumeros;
  var U = window.RoshUI;

  function marcasOrdenadas() {
    var uso = {};
    N.marcasMaisVendidas().forEach(function (m, i) { uso[m.id] = i; });
    function pos(id) { return id in uso ? uso[id] : 99; }
    return C.ativos(C.MARCAS).sort(function (a, b) { return pos(a.id) - pos(b.id); });
  }

  function emEstoquePrimeiro(lista) {
    return lista.filter(function (s) { return !s.emFalta; }).concat(lista.filter(function (s) { return s.emFalta; }));
  }

  function estadoSabor(sel, sabor) {
    var r = sel.roshId ? R.rosh(sel.roshId) : null;
    var marcado = sel.sabores.indexOf(sabor.id) !== -1;
    var cheio = r && r.max > 1 && sel.sabores.length >= r.max;
    return { marcado: marcado, bloqueado: sabor.emFalta || !r || (cheio && !marcado) };
  }

  function htmlEscolhidos(sel) {
    var r = sel.roshId ? R.rosh(sel.roshId) : null;
    var chips = sel.sabores.map(function (id) {
      return '<span class="ui-escolhido">' + R.esc(U.nomeSabor(id)) +
        '<button type="button" class="ui-escolhido__tirar" data-acao="tirar-sabor" data-valor="' + id + '" data-foco="tirar-' + id +
        '" aria-label="Tirar ' + R.esc(U.nomeSabor(id)) + '">' + U.ICONES.fechar + '</button></span>';
    }).join('');
    var contador = r
      ? '<span class="ui-contador' + (sel.sabores.length >= r.max ? ' ui-contador--cheio' : '') + '" aria-live="polite">' + sel.sabores.length + ' de ' + r.max + '</span>'
      : '<button type="button" class="ui-link" data-acao="passo" data-valor="1" data-foco="ir-rosh">Escolha o tipo de rosh primeiro</button>';
    return '<div class="ui-ess__escolhidos"><span class="ui-ess__titulo">Sabores</span>' +
      (chips || '<span class="ui-ess__vazio">Nenhum sabor escolhido. Pode misturar marcas.</span>') + contador + '</div>';
  }

  function htmlBarra(ui) {
    var voltar = ui.modo === 'marcas' ? '' :
      '<button type="button" class="ui-botao ui-botao--fantasma" data-acao="ver-marcas" data-foco="ver-marcas">' + U.ICONES.voltar + 'Marcas</button>';
    var marca = ui.modo === 'marca' ? R.marca(ui.marcaId) : null;
    return '<div class="ui-ess__barra">' + voltar +
      (marca ? '<span class="ui-ess__marca" style="--marca:' + marca.cor + ';--marca-texto:' + marca.texto + '">' + marca.nome + '</span>' : '') +
      '<label class="ui-busca">' + U.ICONES.busca + '<span class="ui-oculto">Buscar por sabor</span>' +
      '<input type="search" data-entrada="busca" data-foco="busca" autocomplete="off" placeholder="' +
      (marca ? 'Buscar em ' + marca.nome : 'Buscar por sabor, marca ou estilo (ex.: mentolado)') + '" value="' + R.esc(ui.busca) + '"></label></div>';
  }

  function htmlRecentes(sel) {
    return '<div class="ui-ess__recentes"><span class="ui-ess__titulo">Recentes</span>' +
      R.recentes.filter(function (id) { return C.saborVisivel(R.sabor(id)); }).slice(0, 4).map(function (id) {
        var sabor = R.sabor(id);
        var e = estadoSabor(sel, sabor);
        return '<button type="button" class="ui-chip-sabor" data-acao="sabor" data-valor="' + id + '" data-foco="rec-' + id +
          '" aria-pressed="' + e.marcado + '"' + (e.bloqueado && !e.marcado ? ' disabled' : '') + '>' + R.esc(U.nomeSabor(id)) + '</button>';
      }).join('') + '</div>';
  }

  function htmlCategorias(ui, lista) {
    var opcoes = [{ id: '', nome: 'Todas' }].concat(C.CATEGORIAS.filter(function (c) {
      return lista.some(function (s) { return C.naCategoria(s, c.id); });
    }));
    return '<div class="ui-ess__categorias" role="group" aria-label="Categoria">' + opcoes.map(function (c) {
      return '<button type="button" class="ui-filtro" data-acao="categoria" data-valor="' + c.id + '" data-foco="cat-' + (c.id || 'todas') +
        '" aria-pressed="' + ((ui.categoria || '') === c.id) + '">' + c.nome + '</button>';
    }).join('') + '</div>';
  }

  function htmlMarcas() {
    return '<div class="ui-marcas">' + marcasOrdenadas().map(function (m) {
      var sabores = C.SABORES.filter(function (s) { return s.marcaId === m.id && s.ativo !== false; });
      var falta = sabores.filter(function (s) { return s.emFalta; }).length;
      return '<button type="button" class="ui-marca" data-acao="marca" data-valor="' + m.id + '" data-foco="marca-' + m.id +
        '" style="--marca:' + m.cor + ';--marca-texto:' + m.texto + '">' +
        '<span class="ui-marca__nome">' + m.nome + '</span>' +
        (m.tier === 'premium' ? '<span class="ui-marca__selo">Premium +' + R.reais(m.sobretaxa) + '</span>' : '') +
        '<span class="ui-marca__info">' + sabores.length + (sabores.length === 1 ? ' sabor' : ' sabores') + (falta ? ', ' + falta + ' em falta' : '') + '</span></button>';
    }).join('') +
      '<button type="button" class="ui-marca ui-marca--busca" data-acao="buscar-por-sabor" data-foco="buscar-por-sabor">' +
      U.ICONES.busca + '<span class="ui-marca__nome">Buscar por sabor</span><span class="ui-marca__info">Todas as marcas, por estilo</span></button></div>';
  }

  function htmlSabores(sel, ui, lista, mostrarMarca) {
    if (!lista.length) {
      return '<p class="ui-ess__nada">Nenhum sabor encontrado' + (ui.busca ? ' para "' + R.esc(ui.busca) + '"' : '') +
        '. Tente outra palavra ou escolha outra categoria.</p>';
    }
    return '<div class="ui-sabores">' + emEstoquePrimeiro(lista).map(function (s) {
      var e = estadoSabor(sel, s);
      var marca = R.marca(s.marcaId);
      return '<button type="button" class="ui-sabor' + (s.emFalta ? ' ui-sabor--falta' : '') + '" data-acao="sabor" data-valor="' + s.id +
        '" data-foco="sab-' + s.id + '" aria-pressed="' + e.marcado + '"' + (e.bloqueado && !e.marcado ? ' disabled' : '') + '>' +
        '<span class="ui-sabor__nome">' + R.esc(s.nome) + '</span>' +
        '<span class="ui-sabor__nota">' + R.esc(s.nota) + '</span>' +
        '<span class="ui-sabor__rodape">' +
        (mostrarMarca ? '<span class="ui-sabor__marca" style="--marca:' + marca.cor + '">' + marca.nome + (s.linha ? ' ' + s.linha : '') + '</span>' :
          s.linha ? '<span class="ui-sabor__linha">' + marca.nome + ' ' + s.linha + '</span>' : '') +
        (s.emFalta ? '<span class="ui-sabor__falta">Em falta</span>' : '') +
        '</span></button>';
    }).join('') + '</div>';
  }

  function html(sel, ui) {
    var corpo;
    if (ui.modo === 'marca' && R.marca(ui.marcaId).ativo === false) ui.modo = 'marcas';
    if (ui.modo === 'marcas') {
      corpo = htmlRecentes(sel) + '<div class="ui-ess__conteudo">' + htmlMarcas() + '</div>';
    } else {
      var daVez = ui.modo === 'marca'
        ? C.SABORES.filter(function (s) { return s.marcaId === ui.marcaId && C.saborVisivel(s); })
        : C.SABORES.filter(C.saborVisivel);
      var buscados = daVez.filter(function (s) { return C.busca(s, ui.busca); });
      var filtrados = buscados.filter(function (s) { return C.naCategoria(s, ui.categoria); });
      corpo = htmlCategorias(ui, buscados) + '<div class="ui-ess__conteudo">' + htmlSabores(sel, ui, filtrados, ui.modo === 'busca') + '</div>';
    }
    return '<div class="ui-ess">' + htmlEscolhidos(sel) + htmlBarra(ui) + corpo + '</div>';
  }

  // Devolve true quando a ação era desta etapa
  function acao(sel, ui, nome, valor) {
    switch (nome) {
      case 'marca':
        ui.modo = 'marca';
        ui.marcaId = valor;
        ui.categoria = null;
        ui.busca = '';
        return true;
      case 'ver-marcas':
        ui.modo = 'marcas';
        ui.categoria = null;
        ui.busca = '';
        return true;
      case 'buscar-por-sabor':
        ui.modo = 'busca';
        ui.categoria = null;
        ui.focarBusca = true;
        return true;
      case 'categoria':
        ui.categoria = valor || null;
        return true;
      case 'tirar-sabor':
        sel.sabores.splice(sel.sabores.indexOf(valor), 1);
        return true;
      case 'sabor': {
        var r = sel.roshId ? R.rosh(sel.roshId) : null;
        if (!r) return true;
        var i = sel.sabores.indexOf(valor);
        if (i !== -1) sel.sabores.splice(i, 1);
        else if (r.max === 1) sel.sabores.splice(0, sel.sabores.length, valor);
        else if (sel.sabores.length < r.max) sel.sabores.push(valor);
        return true;
      }
      default:
        return false;
    }
  }

  function digitar(ui, texto) {
    ui.busca = texto;
    if (texto && ui.modo === 'marcas') ui.modo = 'busca';
  }

  function resumo(sel) {
    return sel.sabores.map(U.nomeSabor).join(' + ');
  }

  window.RoshEssencias = { html: html, acao: acao, digitar: digitar, resumo: resumo };
})();
